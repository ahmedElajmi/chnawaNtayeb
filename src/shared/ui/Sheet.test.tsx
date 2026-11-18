// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SkeletonList } from './SkeletonList';
import { Sheet } from './Sheet';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('SkeletonList (shared loading list)', () => {
  it('renders the requested count of silent placeholders', () => {
    const { container, root } = render(<SkeletonList count={4} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
    act(() => root.unmount());
  });

  it('lines variant renders text bars', () => {
    const { container, root } = render(<SkeletonList count={3} variant="lines" />);
    const first = container.firstElementChild as HTMLElement;
    expect(first.className).toContain('flex flex-col');
    expect(first.children.length).toBe(3);
    act(() => root.unmount());
  });
});

describe('Sheet (bottom sheet on ModalShell, no second modal system)', () => {
  it('renders nothing when closed', () => {
    const { container, root } = render(
      <Sheet open={false} onClose={() => {}} label="Choisir">
        <p>content</p>
      </Sheet>
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => root.unmount());
  });

  it('renders a labelled dialog with the ModalShell backdrop when open', () => {
    const { root } = render(
      <Sheet open onClose={() => {}} label="Choisir une liste">
        <p>content</p>
      </Sheet>
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toBe('Choisir une liste');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    // ModalShell renders its backdrop in a portal on <body>
    expect(document.querySelector('[data-testid="modal-backdrop"]')).not.toBeNull();
    act(() => root.unmount());
  });

  it('outside click and Escape call onClose (ModalShell behaviors)', () => {
    const onClose = vi.fn();
    const { root } = render(
      <Sheet open onClose={onClose} label="x">
        <p>content</p>
      </Sheet>
    );
    act(() => {
      document.querySelector<HTMLElement>('[data-testid="modal-backdrop"]')!.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('content');
    act(() => root.unmount());
  });
});
