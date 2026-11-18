// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SearchX } from 'lucide-react';
import { EmptyState } from './EmptyState';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('EmptyState (shared empty state, exclusive action contract)', () => {
  it('renders icon, title, message and nothing else without action', () => {
    const { container, root } = render(
      <EmptyState icon={SearchX} title="Rien ici" message="Ajoutez des ingrédients" />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(container.textContent).toContain('Rien ici');
    expect(container.textContent).toContain('Ajoutez des ingrédients');
    expect(container.querySelector('a, button')).toBeNull();
    act(() => root.unmount());
  });

  it('link action renders a real link (native anchor by default)', () => {
    const { container, root } = render(
      <EmptyState title="Vide" action={{ kind: 'link', href: '/fridge', label: 'Remplir le frigo' }} />
    );
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('/fridge');
    expect(a?.textContent).toBe('Remplir le frigo');
    expect(a?.className).toContain('min-h-[44px]');
    act(() => root.unmount());
  });

  it('link action goes through the injected LinkComponent (SPA preserved, href passed)', () => {
    const seen: string[] = [];
    const FakeLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
      seen.push(href);
      return <span data-testid="fake-link">{children}</span>;
    };
    const { container, root } = render(
      <EmptyState
        title="Vide"
        action={{ kind: 'link', href: '/recipes', label: 'Voir' }}
        linkComponent={FakeLink as never}
      />
    );
    expect(seen).toEqual(['/recipes']);
    expect(container.querySelector('a')).toBeNull(); // no native anchor when injected
    act(() => root.unmount());
  });

  it('button action renders a real button and fires onClick', () => {
    const onAction = vi.fn();
    const { container, root } = render(
      <EmptyState title="Vide" action={{ kind: 'button', label: 'Scanner', onClick: onAction }} />
    );
    const btn = container.querySelector('button');
    expect(btn?.textContent).toBe('Scanner');
    act(() => btn!.click());
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
  });

  it('the union makes both actions impossible: a link action has no onClick to fire', () => {
    // Type-level guarantee (compiles only because the link variant carries no onClick):
    const action: React.ComponentProps<typeof EmptyState>['action'] = { kind: 'link', href: '/', label: 'x' };
    expect(action.kind).toBe('link');
  });
});
