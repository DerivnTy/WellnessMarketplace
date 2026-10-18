import type {Product} from './catalog';
export const CART_KEY='wellness-cart-v1';
export const MAX_QUANTITY=99;
export type CartItem={id:string;quantity:number};
export function normalizeCart(value:unknown,products:Product[]):CartItem[]{
 if(!Array.isArray(value))return [];
 const allowed=new Set(products.map(p=>p.id)),result=new Map<string,number>();
 for(const item of value){if(!item||typeof item!=='object'||typeof item.id!=='string'||!allowed.has(item.id)||!Number.isSafeInteger(item.quantity)||item.quantity<1)continue;result.set(item.id,Math.min(MAX_QUANTITY,(result.get(item.id)||0)+item.quantity));}
 return Array.from(result,([id,quantity])=>({id,quantity}));
}
export function readCart(value:string|null,products:Product[]):CartItem[]{try{return normalizeCart(JSON.parse(value||'[]'),products);}catch{return [];}}
export function cartTotalCents(items:CartItem[],products:Product[]){return items.reduce((sum,item)=>{const p=products.find(p=>p.id===item.id);if(!p||typeof p.price!=='number'||!Number.isFinite(p.price))return sum;return sum+Math.round(p.price*100)*item.quantity;},0);}
