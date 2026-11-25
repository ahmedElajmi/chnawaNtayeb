// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router';
import { PillTab } from './PillTab';

function renderAt(ui: React.ReactElement, initialPath = '/'): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Probe />
        {ui}
      </MemoryRouter>
    )
  );
  return { root, container };
}

/** Records the router location so the tests can assert a real navigation. */
let lastLocation = '';
function Probe() {
  const location = useLocation();
  useEffect(() => {
    lastLocation = location.pathname;
  }, [location.pathname]);
  return null;
}

describe('PillTab (desktop navigation pill, D-22)', () => {
  it('renders a link with href — never a tablist model', () => {
    const { container, root } = renderAt(<PillTab href="/fridge" label="El Frigo" active={false} />);
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/fridge');
    expect(link.getAttribute('role')).toBeNull();
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(link.className).not.toContain('bg-tint');
    act(() => root.unmount());
  });

  it('marks only the active pill with aria-current="page"', () => {
    const { container, root } = renderAt(<PillTab href="/fridge" label="El Frigo" active />);
    const link = container.querySelector('a')!;
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.className).toContain('bg-tint');
    expect(link.className).toContain('text-brand-text');
    act(() => root.unmount());
  });

  it('navigates for real on click (a link, not a useNavigate wrapper)', () => {
    const mounted = renderAt(<PillTab href="/planner" label="Jom3a" active={false} />);
    const link = mounted.container.querySelector('a')!;
    act(() => link.click());
    expect(lastLocation).toBe('/planner');
    act(() => mounted.root.unmount());
  });

  it('declares the 44 px touch height and the focus ring token', () => {
    const { container, root } = renderAt(<PillTab href="/grocery" label="Qadhya" active={false} />);
    const link = container.querySelector('a')!;
    expect(link.className).toContain('min-h-[44px]');
    expect(link.className).toContain('ring-focus-ring');
    act(() => root.unmount());
  });
});
