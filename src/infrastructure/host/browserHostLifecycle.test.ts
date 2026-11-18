import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserHostLifecycle } from './browserHostLifecycle';

/**
 * The browser adapter is thin, but its wiring matters: which event means hidden (including
 * the back/forward cache parking through `pagehide`) and that unsubscribing really detaches.
 * The test suite runs in node, so the browser globals are stubbed here — like the sync
 * tests did before the port existed.
 */

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('browserHostLifecycle', () => {
  it('notifies hidden on pagehide and on visibilitychange hidden, visible on visibilitychange', () => {
    const listeners = new Map<string, () => void>();
    const hidden = vi.fn();
    const visible = vi.fn();
    const documentStub = {
      addEventListener: (kind: string, listener: () => void) => listeners.set(kind, listener),
      removeEventListener: (kind: string) => listeners.delete(kind),
      visibilityState: 'visible',
    };
    const windowStub = {
      addEventListener: (kind: string, listener: () => void) => listeners.set(`w:${kind}`, listener),
      removeEventListener: (kind: string) => listeners.delete(`w:${kind}`),
    };
    vi.stubGlobal('window', windowStub);
    vi.stubGlobal('document', documentStub);

    createBrowserHostLifecycle().subscribeVisibility(hidden, visible);

    documentStub.visibilityState = 'hidden';
    listeners.get('visibilitychange')!();
    expect(hidden).toHaveBeenCalledTimes(1);
    expect(visible).not.toHaveBeenCalled();

    // Parking in the back/forward cache fires pagehide, never visibilitychange: hidden too
    listeners.get('w:pagehide')!();
    expect(hidden).toHaveBeenCalledTimes(2);

    documentStub.visibilityState = 'visible';
    listeners.get('visibilitychange')!(); // a BFCache restore resumes with this event
    expect(visible).toHaveBeenCalledTimes(1);
    expect(hidden).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes: no callback runs after it', () => {
    const listeners = new Map<string, () => void>();
    const hidden = vi.fn();
    vi.stubGlobal('window', {
      addEventListener: (kind: string, listener: () => void) => listeners.set(`w:${kind}`, listener),
      removeEventListener: (kind: string) => listeners.delete(`w:${kind}`),
    });
    vi.stubGlobal('document', {
      addEventListener: (kind: string, listener: () => void) => listeners.set(kind, listener),
      removeEventListener: (kind: string) => listeners.delete(kind),
      visibilityState: 'hidden',
    });

    const unsubscribe = createBrowserHostLifecycle().subscribeVisibility(hidden, () => undefined);
    unsubscribe();

    expect(listeners.size).toBe(0); // both listeners are detached (nothing left to fire)
    expect(hidden).not.toHaveBeenCalled();
  });

  it('defer runs the callback once after ms and the cancel really cancels it', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setTimeout, clearTimeout });
    const host = createBrowserHostLifecycle();
    const run = vi.fn();
    const cancel = host.defer(run, 1000);

    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(1);
    cancel(); // harmless once run

    const late = vi.fn();
    const cancelLate = host.defer(late, 1000);
    cancelLate();
    await vi.advanceTimersByTimeAsync(1000);
    expect(late).not.toHaveBeenCalled();
  });
});
