'use client';
import {useState,useEffect} from 'react';
import type {Product} from '@/lib/catalog';
import {CART_KEY,MAX_QUANTITY,readCart,type CartItem} from '@/lib/cart';
export function useCart(products:Product[]){
 const [items,setItems]=useState<CartItem[]>([]),[ready,setReady]=useState(false),[storageUnavailable,setStorageUnavailable]=useState(false);
 useEffect(()=>{try{setItems(readCart(localStorage.getItem(CART_KEY),products));}catch{setStorageUnavailable(true);}setReady(true);
  const sync=(event:StorageEvent)=>{if(event.key===CART_KEY||event.key===null)setItems(readCart(event.newValue,products));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[products]);
 useEffect(()=>{if(ready){try{localStorage.setItem(CART_KEY,JSON.stringify(items));setStorageUnavailable(false);}catch{setStorageUnavailable(true);}}},[items,ready]);
 const add=(id:string)=>{if(!products.some(p=>p.id===id&&p.available))return;setItems(current=>current.some(x=>x.id===id)?current.map(x=>x.id===id?{...x,quantity:Math.min(MAX_QUANTITY,x.quantity+1)}:x):[...current,{id,quantity:1}]);};
 const quantity=(id:string,value:number)=>{if(!Number.isSafeInteger(value)||value<1||value>MAX_QUANTITY)return;setItems(current=>current.map(x=>x.id===id?{...x,quantity:value}:x));};
 const remove=(id:string)=>setItems(current=>current.filter(x=>x.id!==id));
 return {items,ready,storageUnavailable,add,quantity,remove,count:items.reduce((sum,item)=>sum+item.quantity,0)};
}
