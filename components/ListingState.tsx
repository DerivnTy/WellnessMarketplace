import type {ReactNode} from 'react';

export function ListingLoading() {
  return <div className="listing-loading" role="status" aria-live="polite">
    <p>Loading products.</p>
  </div>;
}

export function ListingEmpty({title, text, action}: {title: string; text: string; action?: ReactNode}) {
  return <div className="listing-empty empty-state" role="status">
    <h2>{title}</h2>
    <p>{text}</p>
    {action}
  </div>;
}
