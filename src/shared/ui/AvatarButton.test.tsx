// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AvatarButton } from './AvatarButton';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

const base = {
  label: 'Profil et réglages',
  expanded: false,
  panelId: 'profile-panel',
  onClick: () => {},
};

describe('AvatarButton (header avatar, D-23)', () => {
  it('exposes the accessibility contract: label, aria-expanded, aria-controls, no menu role', () => {
    const { container, root } = render(<AvatarButton {...base} />);
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Profil et réglages');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('profile-panel');
    expect(button.getAttribute('role')).toBeNull();
    act(() => root.unmount());
  });

  it('mirrors the panel state on aria-expanded', () => {
    const { container, root } = render(<AvatarButton {...base} expanded />);
    expect(container.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    act(() => root.unmount());
  });

  it('renders the three states: connected initial, guest icon, photo', () => {
    const connected = render(<AvatarButton {...base} initial="s" />);
    expect(connected.container.textContent).toContain('s');
    expect(connected.container.querySelector('button')!.className).toContain('bg-brand');
    act(() => connected.root.unmount());

    const guest = render(<AvatarButton {...base} isGuest />);
    expect(guest.container.querySelector('svg')).not.toBeNull();
    expect(guest.container.querySelector('button')!.className).toContain('bg-tint');
    act(() => guest.root.unmount());

    const photo = render(<AvatarButton {...base} src="/photo.png" />);
    expect(photo.container.querySelector('img')?.getAttribute('src')).toBe('/photo.png');
    act(() => photo.root.unmount());
  });

  it('declares the 44×44 px touch target and fires onClick', () => {
    let clicked = 0;
    const mounted = render(<AvatarButton {...base} onClick={() => (clicked += 1)} />);
    const button = mounted.container.querySelector('button')!;
    expect(button.className).toContain('h-11');
    expect(button.className).toContain('w-11');
    act(() => button.click());
    expect(clicked).toBe(1);
    act(() => mounted.root.unmount());
  });
});
