// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ProfilePanel, type ProfilePanelEntry } from './ProfilePanel';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

const entries: ProfilePanelEntry[] = [
  { key: 'account', label: 'Compte mte3i', icon: null, onSelect: () => {} },
  { key: 'settings', label: 'Réglages', icon: null, onSelect: () => {} },
];

describe('ProfilePanel (compact profile panel, D-23)', () => {
  it('is a labelled group of actions — never a menu', () => {
    const { container, root } = render(<ProfilePanel id="profile-panel" label="Menu profil" entries={entries} />);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute('role')).toBe('group');
    expect(panel.getAttribute('aria-label')).toBe('Menu profil');
    expect(panel.getAttribute('id')).toBe('profile-panel');
    expect(panel.querySelector('[role="menu"]')).toBeNull();
    act(() => root.unmount());
  });

  it('renders one button per existing destination, 44 px touch target, focus on the first', () => {
    const { container, root } = render(<ProfilePanel label="Menu profil" entries={entries} />);
    const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['Compte mte3i', 'Réglages']);
    expect(buttons.every((b) => b.className.includes('min-h-[44px]'))).toBe(true);
    expect(document.activeElement).toBe(buttons[0]);
    act(() => root.unmount());
  });

  it('fires the entry action on click', () => {
    let opened = '';
    const live: ProfilePanelEntry[] = [
      { key: 'account', label: 'Compte', icon: null, onSelect: () => (opened = 'account') },
      { key: 'settings', label: 'Réglages', icon: null, onSelect: () => (opened = 'settings') },
    ];
    const mounted = render(<ProfilePanel label="Menu profil" entries={live} />);
    const buttons = [...mounted.container.querySelectorAll('button')] as HTMLButtonElement[];
    act(() => buttons[1].click());
    expect(opened).toBe('settings');
    act(() => mounted.root.unmount());
  });

  it('never spells the brand identity (it comes from the caller)', () => {
    const { container, root } = render(<ProfilePanel label="Menu profil" entries={entries} />);
    expect(container.textContent).not.toMatch(/Chnawa|Chnowa|Souhed/);
    act(() => root.unmount());
  });
});
