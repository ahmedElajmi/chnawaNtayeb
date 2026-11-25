// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LinkTabs } from './LinkTabs';
import { Rail } from './Rail';
import { ChipFilter } from './Chips';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('LinkTabs (navigation by real links, router-independent)', () => {
  const items = [
    { href: '/recipes', label: 'Catalogue', count: 12, active: true },
    { href: '/suggestions', label: 'Suggestions', count: null, hint: 'Remplissez le frigo', active: false },
  ];

  it('renders real native links with aria-current on the active one only', () => {
    const { container, root } = render(<LinkTabs items={items} ariaLabel="Recettes" />);
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/recipes');
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('aria-current')).toBeNull();
    expect(links[0].className).toContain('min-h-[44px]');
    // No tablist model
    expect(container.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
    act(() => root.unmount());
  });

  it('never renders a replace DOM attribute on the native anchor', () => {
    const { container, root } = render(<LinkTabs items={items} ariaLabel="x" replace />);
    const a = container.querySelector('a');
    expect(a?.getAttribute('replace')).toBeNull();
    expect(Object.hasOwn(a ?? {}, 'replace')).toBe(false);
    act(() => root.unmount());
  });

  it('count null shows the hint; a count shows the number', () => {
    const { container, root } = render(<LinkTabs items={items} ariaLabel="x" />);
    expect(container.textContent).toContain('Remplissez le frigo');
    expect(container.textContent).toContain('(12)');
    act(() => root.unmount());
  });

  it('the injected LinkComponent receives href (adapter maps it to to — never inside the component)', () => {
    const seen: { href: string; current?: string }[] = [];
    const AdapterLink: React.FC<{ href: string; 'aria-current'?: string; children: React.ReactNode }> = ({
      href,
      'aria-current': current,
      children,
    }) => {
      seen.push({ href, current });
      return <span>{children}</span>;
    };
    const { container, root } = render(<LinkTabs items={items} ariaLabel="x" linkComponent={AdapterLink as never} />);
    expect(seen).toEqual([
      { href: '/recipes', current: 'page' },
      { href: '/suggestions', current: undefined },
    ]);
    expect(container.querySelector('a')).toBeNull();
    act(() => root.unmount());
  });
});

describe('Rail (horizontal carousel, no library)', () => {
  it('renders a labelled group with a scrollable track (logical RTL classes only)', () => {
    const { container, root } = render(
      <Rail label="Catégories">
        <div style={{ width: 60 }}>a</div>
        <div style={{ width: 60 }}>b</div>
      </Rail>
    );
    expect(container.firstElementChild?.getAttribute('aria-label')).toBe('Catégories');
    const track = container.firstElementChild?.lastElementChild as HTMLElement;
    expect(track.className).toContain('overflow-x-auto');
    // Arrows appear only when the content overflows (real layout: verified in Chromium, not happy-dom)
    expect(container.querySelectorAll('button')).toHaveLength(0);
    act(() => root.unmount());
  });
});

describe('ChipFilter (multi-selection chips)', () => {
  it('renders real buttons with aria-pressed and reports toggles', () => {
    const onToggle = vi.fn();
    const { container, root } = render(
      <ChipFilter
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
        selected={['a']}
        onToggle={onToggle}
        ariaLabel="Filtres rapides"
      />
    );
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[0].className).toContain('min-h-[44px]');
    act(() => buttons[1].click());
    expect(onToggle).toHaveBeenCalledWith('b');
    act(() => root.unmount());
  });
});
