'use client';
import Link from 'next/link';

import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play} from 'lucide-react';
import {categories, type Product} from '@/lib/catalog';

const MotionContext = createContext({running: false, paused: false, reduced: false, toggle: () => {}});
export const usePageMotion = () => useContext(MotionContext);

export function HomeMotion({children, className = '', refreshKey = ''}: {children: ReactNode; className?: string; refreshKey?: string}) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 760px)');
    const syncPreference = () => setReduced(preference.matches || mobile.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncPreference();
    syncVisibility();
    try { setPaused(localStorage.getItem('wellness-motion') === 'paused'); } catch {}
    setReady(true);
    preference.addEventListener('change', syncPreference);
    mobile.addEventListener('change', syncPreference);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      preference.removeEventListener('change', syncPreference);
      mobile.removeEventListener('change', syncPreference);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!root.current || !ready || reduced || paused || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('motion-revealed');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08});
    root.current.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [ready, reduced, paused, refreshKey]);

  const toggle = () => setPaused(value => {
    try { localStorage.setItem('wellness-motion', value ? 'running' : 'paused'); } catch {}
    return !value;
  });
  const running = ready && !paused && !reduced && visible;
  return <MotionContext.Provider value={{running, paused, reduced, toggle}}>
    <div ref={root} className={'home-motion ' + className} data-motion={running ? 'running' : 'paused'}>{children}</div>
  </MotionContext.Provider>;
}

export function MotionToggle({compact = false}: {compact?: boolean}) {
  const {paused, reduced, toggle} = useContext(MotionContext);
  const label = reduced ? 'Reduced motion enabled' : paused ? 'Play page animations' : 'Pause page animations';
  return <button type="button" className={'motion-toggle' + (compact ? ' motion-toggle-compact' : '')}
    onClick={toggle} disabled={reduced} aria-label={label} title={label}>
    {paused || reduced ? <Play size={13}/> : <Pause size={13}/>}
    {!compact && <span>{reduced ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion'}</span>}
  </button>;
}

const featuredBrands = ['cure', 'goodonya', 'b-t-r-nation', 'wama', 'puori', 'hooga', 'momentous', 'gorgie', 'woolly', 'promix', 'maryruths', 'olipop'];

export function BrandCarousel({products, brandIds = featuredBrands}: {products: Product[]; brandIds?: string[]}) {
  const {running, reduced} = useContext(MotionContext);
  const region = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(0);
  const [viewport, api] = useEmblaCarousel({loop: true, align: 'start', duration: 65, skipSnaps: true});
  const brands = brandIds.flatMap(id => {
    const product = products.find(p => p.brandId === id);
    return product ? [product] : [];
  });
  const autoplay = running && inView && !interacting && !focused && !dragging;

  useEffect(() => {
    if (!region.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold: 0.1});
    observer.observe(region.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!api) return;
    const select = () => setSelected(api.selectedScrollSnap());
    const down = () => setDragging(true);
    const up = () => setDragging(false);
    select();
    api.on('select', select).on('reInit', select).on('pointerDown', down).on('pointerUp', up);
    return () => { api.off('select', select).off('reInit', select).off('pointerDown', down).off('pointerUp', up); };
  }, [api]);

  useEffect(() => {
    if (!api || !autoplay) return;
    const timer = window.setInterval(() => api.scrollNext(), 3800);
    return () => window.clearInterval(timer);
  }, [api, autoplay]);

  return <div ref={region} className="brand-carousel" role="region" aria-roledescription="carousel" aria-label="Discover independent brands"
    onPointerEnter={e => { if (e.pointerType === 'mouse') setInteracting(true); }} onPointerLeave={() => setInteracting(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
    <div className="brand-carousel-viewport" ref={viewport}>
      <div className="brand-carousel-track">
        {brands.map((p, index) => <div className="brand-carousel-slide" key={p.brandId} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${brands.length}`}>
          <Link prefetch={false} href={'/brands/' + p.brandId} className={'brand-tile brand-style-' + index % 6}>
            <span className="brand-tile-category">{categories.find(c => c.id === p.category)?.name}</span>
            <strong>{p.brand}</strong>
            <span className="brand-tile-bottom">Explore the brand <ArrowUpRight size={16}/></span>
          </Link>
        </div>)}
      </div>
    </div>
    <div className="brand-carousel-footer">
      <span className="carousel-hint"><i className={autoplay ? 'is-playing' : ''}/><span>Discover at your own pace</span></span>
      <div className="brand-carousel-controls">
        <MotionToggle/>
        <span className="carousel-position" aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true"><b>{String(selected + 1).padStart(2, '0')}</b><span> / {String(brands.length).padStart(2, '0')}</span></span>
        <button type="button" className="carousel-arrow" aria-label="Previous brands" onClick={() => api?.scrollPrev(reduced)}><ArrowLeft size={16}/></button>
        <button type="button" className="carousel-arrow" aria-label="Next brands" onClick={() => api?.scrollNext(reduced)}><ArrowRight size={16}/></button>
      </div>
    </div>
  </div>;
}
