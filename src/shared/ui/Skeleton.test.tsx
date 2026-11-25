// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Skeleton } from './Skeleton';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('Skeleton (shared loading placeholder)', () => {
  it('renders a silent pulsing block on the line token', () => {
    const { container, root } = render(<Skeleton />);
    const sk = container.firstElementChild as HTMLElement;
    expect(sk.getAttribute('aria-hidden')).toBe('true');
    expect(sk.className).toContain('animate-pulse');
    expect(sk.className).toContain('bg-line');
    act(() => root.unmount());
  });

  it('supports the documented size and radius props', () => {
    const { container, root } = render(<Skeleton width="8rem" height="2rem" rounded="full" />);
    const sk = container.firstElementChild as HTMLElement;
    expect(sk.style.width).toBe('8rem');
    expect(sk.style.height).toBe('2rem');
    expect(sk.className).toContain('rounded-full');
    act(() => root.unmount());
  });

  it('defaults to a text-line height and lg radius', () => {
    const { container, root } = render(<Skeleton />);
    const sk = container.firstElementChild as HTMLElement;
    expect(sk.style.height).toBe('1rem');
    expect(sk.className).toContain('rounded-lg');
    act(() => root.unmount());
  });
});
