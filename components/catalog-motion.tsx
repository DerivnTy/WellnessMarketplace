'use client';

import {useLayoutEffect, useRef, type ReactNode} from 'react';
import {ArrowDown, ArrowUpRight} from 'lucide-react';
import type {Product} from '@/lib/catalog';
import {MotionToggle, usePageMotion} from './home-motion';

const departmentCopy: Record<string, {eyebrow: string; title: string; description: string; images: string[]; detail: string}> = {
  supplements: {
    eyebrow: 'THE SUPPLEMENT EDIT', title: 'Find your formula.',
    description: 'Start with a goal. Explore the ingredients. Compare the details that matter to you.',
    images: ['momentous-ashwagandha', 'olly-goodbye-stress', 'maryruths-adult-sleep-gummies'],
    detail: 'Goals. Ingredients. Clearer choices.',
  },
  drinks: {
    eyebrow: 'THE DRINKS EDIT', title: 'Find your everyday pour.',
    description: 'Hydrate, fuel up, or wind down. Discover what’s in your drink before it’s in your routine.',
    images: ['gorgie-peach-tea', 'olipop-strawberry-vanilla', 'clean-cause-blackberry'],
    detail: 'A closer look at every sip.',
  },
  apparel: {
    eyebrow: 'THE NATURAL-FIBER EDIT', title: 'Good fabric. Everyday feeling.',
    description: 'Find your fit. Read the fabric. Explore natural fibers, considered basics, and the details beyond the label.',
    images: ['woolly-crew', 'harvest-jogger', 'mate-tee'],
    detail: 'The fabric is just the beginning.',
  },
};

export function DepartmentHero({category, products}: {category: string; products: Product[]}) {
  const copy = departmentCopy[category];
  return <section className={'department-hero department-hero-' + category}>
    <MotionToggle compact/>
    <div className="department-copy">
      <span className="eyebrow">{copy.eyebrow}</span>
      <h1>{copy.title}</h1>
      <p>{copy.description}</p>
      <div className="department-hero-actions">
        <a className="button dark" href="#catalog-results">Browse products <ArrowDown size={15}/></a>
        <a className="text-link" href="/methodology">Our standards <ArrowUpRight size={14}/></a>
      </div>
      <div className="department-meta"><span>{products.length} products</span><i/><span>{new Set(products.map(p => p.brandId)).size} brands</span><i/><span>Source-backed details</span></div>
    </div>
    <div className="department-stage" aria-hidden="true">
      <div className="department-orbit department-orbit-one"/><div className="department-orbit department-orbit-two"/>
      <div className="department-plinth"/>
      <div className="department-images">{copy.images.flatMap(id => {
        const product = products.find(p => p.id === id);
        return product ? [<img src={product.image} alt="" key={id}/>] : [];
      })}</div>
      <span className="department-stage-caption">{copy.detail}</span>
    </div>
  </section>;
}

// Keep keyed cards mounted so save/cart controls retain their state and focus.
// Only cards that enter or move animate; filtering itself is immediate.
export function SmoothProductGrid({products, renderCard}: {products: Product[]; renderCard: (product: Product) => ReactNode}) {
  const grid = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, {x: number; y: number}>());
  const {running} = usePageMotion();
  const signature = products.map(p => p.id).join('|');

  useLayoutEffect(() => {
    if (!grid.current) return;
    const next = new Map<string, {x: number; y: number}>();
    const animations: Animation[] = [];
    const nodes = [...grid.current.querySelectorAll<HTMLElement>(':scope > [data-product]')];
    nodes.forEach((node, index) => {
      const id = node.dataset.product!;
      const position = {x: node.offsetLeft, y: node.offsetTop};
      const previous = positions.current.get(id);
      next.set(id, position);
      if (!running || typeof node.animate !== 'function') return;
      if (previous) {
        const x = previous.x - position.x, y = previous.y - position.y;
        if (x || y) animations.push(node.animate([{transform: `translate(${x}px, ${y}px)`}, {transform: 'translate(0, 0)'}], {duration: 320, easing: 'cubic-bezier(.22,1,.36,1)'}));
      } else {
        animations.push(node.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 300, delay: Math.min(index, 5) * 25, easing: 'ease-out', fill: 'backwards'}));
      }
    });
    positions.current = next;
    // Resizing changes column geometry without changing the filter result.
    const observer = new ResizeObserver(() => {
      nodes.forEach(node => positions.current.set(node.dataset.product!, {x: node.offsetLeft, y: node.offsetTop}));
    });
    observer.observe(grid.current);
    return () => { animations.forEach(animation => animation.cancel()); observer.disconnect(); };
  }, [signature, running]);

  return <div className="product-grid listing-grid smooth-product-grid" ref={grid}>
    {products.map(product => <div className="product-motion-item" data-product={product.id} key={product.id}>{renderCard(product)}</div>)}
  </div>;
}
