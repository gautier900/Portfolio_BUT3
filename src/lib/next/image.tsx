/* Remplaçant de `next/image` pour Vite.
   Les composants Skiper UI sont écrits pour Next.js et peuvent importer `next/image` ;
   vite.config.ts redirige cet import ici : l'image devient un simple <img>. */
import { forwardRef, type CSSProperties, type ImgHTMLAttributes } from 'react';

type StaticImage = { src: string; width?: number; height?: number };

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | StaticImage;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  // Options propres à Next.js, sans effet ici
  quality?: number | string;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
  overrideSrc?: string;
};

const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, fill, priority, quality, placeholder, blurDataURL, unoptimized, loader, overrideSrc, style, width, height, loading, ...rest },
  ref,
) {
  const file = typeof src === 'string' ? { src } : src;
  return (
    <img
      ref={ref}
      src={file.src}
      width={fill ? undefined : (width ?? file.width)}
      height={fill ? undefined : (height ?? file.height)}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding="async"
      style={fill ? { ...FILL, ...style } : style}
      {...rest}
    />
  );
});

export default Image;
