'use client';

import {useEffect, useState, type ReactNode, type Ref} from 'react';
import {ChevronDown, Minus, Plus, X} from 'lucide-react';

export type PreferenceFilterGroup = {
  id: string;
  label: string;
  options: {id: string; label: string; count?: number}[];
  hint?: string;
  defaultOpen?: boolean;
};

type Props = {
  groups: PreferenceFilterGroup[];
  activeFilters: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
  onReset?: () => void;
  beforeGroups?: ReactNode;
  afterGroups?: ReactNode;
  footer?: ReactNode;
  mobileOpen?: boolean;
  onClose?: () => void;
  panelRef?: Ref<HTMLElement>;
};

export function FilterSection({label, children, className = '', defaultOpen = true, forceOpen = false}: {label: ReactNode; children: ReactNode; className?: string; defaultOpen?: boolean; forceOpen?: boolean}) {
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  useEffect(() => {if (forceOpen) setOpen(true);}, [forceOpen]);
  return <fieldset className={'facet-block ' + className}>
    <legend>
      <button type="button" className="facet-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span className="facet-toggle-label">{label}</span>
        <ChevronDown size={16} aria-hidden="true"/>
      </button>
    </legend>
    <div className="facet-panel" hidden={!open}>{children}</div>
  </fieldset>;
}

export default function PreferenceFilters({groups, activeFilters, onChange, onReset, beforeGroups, afterGroups, footer, mobileOpen = false, onClose, panelRef}: Props) {
  const toggle = (group: string, option: string) => {
    const selected = activeFilters[group] || [];
    onChange({...activeFilters, [group]: selected.includes(option)
      ? selected.filter(id => id !== option) : [...selected, option]});
  };
  const reset = () => onReset ? onReset() : onChange({});

  return <aside id="catalog-filters" ref={panelRef}
    className={'filters contextual-filters preference-filters ' + (mobileOpen ? 'open' : '')}
    data-collapsible={onClose ? true : undefined}
    role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label="Filter products">
    <div className="filter-heading">
      <h3>Details that matter</h3>
      <button type="button" className="preference-reset" onClick={reset}>Reset</button>
      {onClose && <button type="button" className="mobile-filter-close" aria-label="Close filters" onClick={onClose}><X size={20}/></button>}
    </div>
    <div className="filter-inner">
      {beforeGroups}
      {groups.map(group => <FilterGroup key={group.id} group={group} selected={activeFilters[group.id] || []} onToggle={id => toggle(group.id, id)}/>)}
      {afterGroups}
    </div>
    {footer && <div className="mobile-filter-footer">{footer}</div>}
  </aside>;
}

function FilterGroup({group, selected, onToggle}: {group: PreferenceFilterGroup; selected: string[]; onToggle: (id: string) => void}) {
  const [expanded, setExpanded] = useState(false);
  // Keep selected options visible even when a long group is collapsed.
  const visible = expanded ? group.options : group.options.filter((option, index) => index < 7 || selected.includes(option.id));
  const hidden = group.options.length - visible.length;
  return <FilterSection label={<>{group.label}{selected.length > 0 && <span className="filter-selection-count">{selected.length} selected</span>}</>} defaultOpen={group.defaultOpen ?? true} forceOpen={selected.length > 0}>
    {visible.map(option => {
      const checked = selected.includes(option.id);
      const unavailable = option.count === 0 && !checked;
      return <label className={'facet-check ' + (unavailable ? 'unavailable' : '')} key={option.id}>
        <input type="checkbox" aria-label={option.label} checked={checked} disabled={unavailable} onChange={() => onToggle(option.id)}/>
        <span>{option.label}</span>
        {option.count !== undefined && <small aria-label={`${option.count} matching products`}>{option.count}</small>}
      </label>;
    })}
    {(hidden > 0 || expanded && group.options.length > 7) && <button type="button" className="facet-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      {expanded ? 'Show less' : `Show ${hidden} more`}{expanded ? <Minus size={12}/> : <Plus size={12}/>}
    </button>}
    {group.hint && <p className="facet-hint">{group.hint}</p>}
  </FilterSection>;
}
