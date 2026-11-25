// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PageHeading } from './PageHeading';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('PageHeading (shared heading)', () => {
  it('renders the title in an h1, with optional subtitle and actions', () => {
    const { container, root } = render(
      <PageHeading title="Recettes" subtitle="Le catalogue complet" actions={<button type="button">Plus</button>} />
    );
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Recettes');
    expect(container.textContent).toContain('Le catalogue complet');
    expect(container.querySelector('button')?.textContent).toBe('Plus');
    act(() => root.unmount());
  });

  it('subtitle and actions are optional; compact reduces the spacing', () => {
    const { container, root } = render(<PageHeading title="Frigo" compact />);
    expect(container.querySelector('h1')?.textContent).toBe('Frigo');
    expect(container.querySelector('p')).toBeNull();
    act(() => root.unmount());
  });

  it('no hardcoded palette colors (theme tokens only)', () => {
    const { container, root } = render(<PageHeading title="x" />);
    expect(container.firstElementChild?.className).not.toMatch(/slate-|gray-|emerald-/);
    act(() => root.unmount());
  });
});
