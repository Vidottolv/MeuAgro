import{j as s,s as d}from"./index-CX5EOl4V.js";const p="meu-agro-photos",f=8*1024*1024,y=new Set(["image/jpeg","image/png","image/webp"]);function u(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function h(t){var o;const r=((t==null?void 0:t.name)||"").match(/\.([a-zA-Z0-9]+)$/),e=(o=r==null?void 0:r[1])==null?void 0:o.toLowerCase();return e&&["jpg","jpeg","png","webp"].includes(e)?e==="jpeg"?"jpg":e:(t==null?void 0:t.type)==="image/png"?"png":(t==null?void 0:t.type)==="image/webp"?"webp":"jpg"}function E(){var t;return(t=globalThis.crypto)!=null&&t.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}function P(t){return t?t.size>f?"A imagem deve possuir no máximo 8 MB.":t.type&&!y.has(t.type)||!t.type&&!/\.(jpe?g|png|webp)$/i.test(t.name||"")?"Use uma imagem JPG, PNG ou WebP.":null:"Selecione uma imagem."}async function q({file:t,cycle:n}){const r=P(t);if(r)throw new Error(r);const e=u(),o=await s();if(!o)throw new Error("Sua sessão expirou. Entre novamente.");if(!(n!=null&&n.id)||!(n!=null&&n.property_id))throw new Error("Ciclo produtivo inválido.");const i=[o.id,n.property_id,n.id,`${Date.now()}-${E()}.${h(t)}`].join("/"),{error:a}=await e.storage.from(p).upload(i,t,{cacheControl:"3600",upsert:!1,contentType:t.type||void 0});if(a)throw a;return i}async function S(t){if(!t)return;const n=u(),{error:r}=await n.storage.from(p).remove([t]);if(r)throw r}async function U({cycle:t,eventId:n=null,storagePath:r,description:e,capturedAt:o}){const i=u(),a=await s();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:v,error:l}=await i.from("event_photos").insert({user_id:a.id,property_id:t.property_id,area_id:t.area_id,production_cycle_id:t.id,production_event_id:n||null,storage_path:r,description:(e==null?void 0:e.trim())||null,captured_at:o||new Date().toISOString()}).select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `).single();if(l)throw l;return v}async function I(t){const n=u(),{data:r,error:e}=await n.from("event_photos").select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `).eq("production_cycle_id",t).order("captured_at",{ascending:!0});if(e)throw e;return w(r??[])}async function w(t,n=3600){const r=u();return Promise.all((t??[]).map(async e=>{if(!(e!=null&&e.storage_path))return{...e,signed_url:null};const{data:o,error:i}=await r.storage.from(p).createSignedUrl(e.storage_path,n);return i?(console.warn("Não foi possível assinar a URL da foto:",i),{...e,signed_url:null}):{...e,signed_url:(o==null?void 0:o.signedUrl)||null}}))}async function x(t){const n=u(),r=await s();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{error:e}=await n.from("event_photos").delete().eq("id",t.id).eq("user_id",r.id);if(e)throw e;try{await S(t.storage_path)}catch(o){console.warn("O registro da foto foi removido, mas o arquivo não pôde ser apagado do Storage:",o)}}const _=`
  id,
  user_id,
  production_cycle_id,
  event_type,
  title,
  description,
  notes,
  occurred_at,
  created_at,
  updated_at,
  event_photos (
    id,
    user_id,
    property_id,
    area_id,
    production_cycle_id,
    production_event_id,
    storage_path,
    description,
    captured_at,
    created_at
  ),
  event_inputs (
    id,
    user_id,
    production_event_id,
    agricultural_input_id,
    inventory_lot_id,
    quantity,
    unit,
    unit_cost,
    total_cost,
    inventory_transaction_id,
    notes,
    created_at,
    agricultural_input:agricultural_inputs (
      id,
      name,
      brand,
      base_unit
    ),
    inventory_lot:inventory_lots (
      id,
      batch_number,
      supplier,
      unit,
      unit_price,
      purchase_date
    ),
    inventory_transaction:inventory_transactions (
      id,
      transaction_type,
      occurred_at,
      quantity,
      unit,
      unit_cost,
      total_cost
    )
  )
`;function c(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function g(t){var n,r,e;return{event_type:t.eventType,title:((n=t.title)==null?void 0:n.trim())||"",description:((r=t.description)==null?void 0:r.trim())||null,notes:((e=t.notes)==null?void 0:e.trim())||null,occurred_at:t.occurredAt||new Date().toISOString()}}async function m(t){const n=t.flatMap(o=>o.event_photos||[]),r=await w(n),e=new Map(r.map(o=>[o.id,o]));return t.map(o=>({...o,event_photos:(o.event_photos||[]).map(i=>e.get(i.id)||i)}))}async function j(t){const n=c(),{data:r,error:e}=await n.from("production_events").select(_).eq("production_cycle_id",t).order("occurred_at",{ascending:!1});if(e)throw e;return m(r??[])}async function T(t){const n=c(),{data:r,error:e}=await n.from("production_events").select(_).eq("id",t).maybeSingle();if(e)throw e;if(!r)return null;const[o]=await m([r]);return o}async function O(t,n){const r=c(),e=await s();if(!e)throw new Error("Sua sessão expirou. Entre novamente.");const{data:o,error:i}=await r.from("production_events").insert({...g(n),user_id:e.id,production_cycle_id:t}).select(_).single();if(i)throw i;return o}async function $(t,n,r){const e=c(),o=await s();if(!o)throw new Error("Sua sessão expirou. Entre novamente.");const{data:i,error:a}=await e.from("production_events").update(g(r)).eq("id",t).eq("production_cycle_id",n).eq("user_id",o.id).select(_).single();if(a)throw a;return i}async function C(t){const n=c(),r=await s();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{error:e}=await n.from("production_events").delete().eq("id",t).eq("user_id",r.id);if(e)throw e}export{I as a,q as b,O as c,x as d,U as e,C as f,T as g,j as l,S as r,$ as u,P as v};
