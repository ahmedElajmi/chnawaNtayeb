import React from 'react';

/**
 * Navigation injected by the consumer (contract of lot 2.6.2, decision A-6):
 * shared components stay independent of the router — they always pass `href`, render a native
 * `<a href>` by default, and the React Router consumer provides an adapter that maps `href` → `to`
 * (in the consumer's module, never inside the generic component).
 */
export interface InjectedLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  'aria-current'?: 'page';
  /** Honored by the injected router link (SPA); ignored by the native anchor */
  replace?: boolean;
}

export type LinkComponent = React.ComponentType<InjectedLinkProps>;

interface LinkRenderProps extends InjectedLinkProps {
  native: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
}

/** Renders the injected link, or a plain anchor by default (never with a `replace` DOM attribute). */
export function renderInjectedLink({
  native,
  linkComponent,
  ...props
}: LinkRenderProps & { linkComponent?: LinkComponent }) {
  if (linkComponent) {
    const Link = linkComponent;
    return <Link {...props} className={props.className} aria-current={props['aria-current']} replace={props.replace} />;
  }
  const { replace: _replace, ...anchorProps } = props;
  return <a {...anchorProps} {...native} />;
}
