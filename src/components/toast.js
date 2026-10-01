import {shallowRef} from 'vue';
export const toastItems=shallowRef([]);
let sequence=0;
export function dismissToast(id){toastItems.value=toastItems.value.filter(t=>t.id!==id)}
export function clearTradeToast(){toastItems.value=toastItems.value.filter(t=>!t.trade)}
export function showToast(message,{type='default',duration=3500,trade=false}={}){if(trade)clearTradeToast();const id=++sequence;toastItems.value=[...toastItems.value,{id,message,type,trade}];window.setTimeout(()=>dismissToast(id),duration);}
