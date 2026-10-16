import{y as c,x as u,j as p,z as f,s as l}from"./index-CFRkglUh.js";import{signPhotos as y}from"./photoService-D2SKcO8w.js";const _=`
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
`;function s(){if(!l)throw new Error("O Supabase não foi inicializado.");return l}function v(t){var n,i,o;return{event_type:t.eventType,title:((n=t.title)==null?void 0:n.trim())||"",description:((i=t.description)==null?void 0:i.trim())||null,notes:((o=t.notes)==null?void 0:o.trim())||null,occurred_at:t.occurredAt||new Date().toISOString()}}async function d(t){const n=t.flatMap(e=>e.event_photos||[]),i=await y(n),o=new Map(i.map(e=>[e.id,e]));return t.map(e=>({...e,event_photos:(e.event_photos||[]).map(r=>o.get(r.id)||r)}))}async function E(t){const n=s(),{data:i,error:o}=await n.from("production_events").select(_).eq("production_cycle_id",t).order("occurred_at",{ascending:!1});if(o)throw o;const e=await c.merge("production_events",i??[],r=>r.production_cycle_id===t,u());return d(e.sort((r,a)=>a.occurred_at.localeCompare(r.occurred_at)))}async function g(t){const n=(await c.localRows("production_events")).find(a=>a.id===t);if(n)return(await d([n]))[0];const i=s(),{data:o,error:e}=await i.from("production_events").select(_).eq("id",t).maybeSingle();if(e)throw e;if(!o)return null;const[r]=await d([o]);return r}async function q(t,n){return f(t,v(n))}async function S(t,n,i){if(!u())throw Error("A edição de eventos existentes precisa de conexão. Você pode registrar um novo evento offline.");if((await c.localRows("production_events")).some(w=>w.id===t))throw Error("Sincronize e atualize a linha do tempo antes de editar este evento.");const o=s(),e=await p();if(!e)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:a}=await o.from("production_events").update(v(i)).eq("id",t).eq("production_cycle_id",n).eq("user_id",e.id).select(_).single();if(a)throw a;return r}async function b(t){if(!u())throw Error("A exclusão de eventos precisa de conexão.");if((await c.localRows("production_events")).some(e=>e.id===t))throw Error("Sincronize e atualize a linha do tempo antes de excluir este evento.");const n=s(),i=await p();if(!i)throw new Error("Sua sessão expirou. Entre novamente.");const{error:o}=await n.from("production_events").delete().eq("id",t).eq("user_id",i.id);if(o)throw o}export{q as createProductionEvent,b as deleteProductionEvent,g as getProductionEventById,E as listProductionEvents,S as updateProductionEvent};
