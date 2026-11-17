/* Remplaçant de `next/link` pour Vite.
   Les composants Skiper UI sont écrits pour Next.js et importent `next/link` ;
   vite.config.ts redirige cet import ici : le lien devient un simple <a>. */
import { forwardRef, type AnchorHTMLAttributes } from 'react';

type Url = string | { pathname?: string; query?: Record<string, string>; hash?: string };

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: Url;
  // Options propres à Next.js, sans effet ici
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
  passHref?: boolean;
};

const toHref = (url: Url) => {
  if (typeof url === 'string') return url;
  const query = url.query ? `?${new URLSearchParams(url.query)}` : '';
  const hash = url.hash ? (url.hash.startsWith('#') ? url.hash : `#${url.hash}`) : '';
  return `${url.pathname ?? ''}${query}${hash}`;
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch, replace, scroll, shallow, locale, legacyBehavior, passHref, ...rest },
  ref,
) {
  return <a ref={ref} href={toHref(href)} {...rest} />;
});

export default Link;
