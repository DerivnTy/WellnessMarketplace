'use client';
import {useEffect,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {comparisonIds,comparisonHref} from '@/lib/comparison';
export function useComparison(products:Product[],path:string,queryIds:unknown){
 const [ids,setIds]=useState<string[]>([]),[ready,setReady]=useState(false),[storageUnavailable,setStorageUnavailable]=useState(false);
 useEffect(()=>{
  let next:string[]=[];
  if(path==='compare'&&typeof queryIds==='string')next=comparisonIds(queryIds.split(','),products);
  else try{next=comparisonIds(localStorage.getItem('wellness-compare')||'[]',products);}catch{setStorageUnavailable(true);}
  setIds(next);setReady(true);
  if(path==='compare'&&typeof queryIds==='string')try{localStorage.setItem('wellness-compare',JSON.stringify(next));}catch{setStorageUnavailable(true);}
 },[products,path,queryIds]);
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key==='wellness-compare')setIds(comparisonIds(e.newValue||'[]',products));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[products]);
 const update=(next:string[])=>{const valid=comparisonIds(next,products);setIds(valid);try{localStorage.setItem('wellness-compare',JSON.stringify(valid));}catch{setStorageUnavailable(true);}if(path==='compare')history.replaceState(null,'',comparisonHref(valid));};
 return {ids,ready,storageUnavailable,update};
}
