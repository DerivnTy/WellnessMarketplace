import manifest from '@/data/image-manifest.json';

type Entry = {width: number; height: number; base: string; widths: number[]};
const images = manifest as Record<string, Entry>;

type Props = {
  src?: string;
  alt: string;
  priority?: boolean;
  eager?: boolean;
  sizes?: string;
  className?: string;
};

export default function ProductImage({src, alt, priority = false, eager = false, sizes = '(max-width: 760px) 50vw, 280px', className}: Props) {
  if (!src) return null;
  const entry = images[src];
  const loading = priority || eager ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  if (!entry) {
    return <img className={className} src={src} alt={alt} loading={loading} decoding="async" fetchPriority={fetchPriority}/>;
  }
  const avif = entry.widths.map(width => `${entry.base}-${width}.avif ${width}w`).join(', ');
  const webp = entry.widths.map(width => `${entry.base}-${width}.webp ${width}w`).join(', ');
  const fallbackWidth = entry.widths.find(width => width >= 640) || entry.widths[entry.widths.length - 1];
  return <picture className={className}>
    <source type="image/avif" srcSet={avif} sizes={sizes}/>
    <source type="image/webp" srcSet={webp} sizes={sizes}/>
    <img src={`${entry.base}-${fallbackWidth}.webp`} alt={alt} width={entry.width} height={entry.height} sizes={sizes} loading={loading} decoding="async" fetchPriority={fetchPriority}/>
  </picture>;
}
