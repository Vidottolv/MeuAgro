import{g as f,u as y,c as m,a as v,s as w}from"./cropService-BzRtnshz.js";import{g as h,d as g}from"./productionCycleService-Cn8iYei2.js";import{g as E,u as S,c as d,a as b,d as C,l as P,b as q,e as k,r as I,f as F}from"./productionEventService-BR564vdF.js";import{l as A}from"./agriculturalInputService-D8cz8bdm.js";import{g as N,l as T}from"./inventoryLotService-BVyYrq5N.js";import{j as L,s as u}from"./index-CX5EOl4V.js";import{d as j}from"./cycleMetrics-BxtU-i7j.js";import{q as R,l}from"./productionModel-N69rzoPM.js";const x=`
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
    category,
    base_unit,
    active,
    deleted_at
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    purchase_date,
    expiration_date,
    unit,
    unit_price
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
`;function _(){if(!u)throw new Error("O Supabase não foi inicializado.");return u}async function B(t){const r=_(),{data:e,error:a}=await r.from("inventory_balances").select(`
        agricultural_input_id,
        current_quantity,
        base_unit,
        stock_status,
        minimum_stock,
        ideal_stock
      `).eq("agricultural_input_id",t).maybeSingle();if(a)throw a;return{agricultural_input_id:t,current_quantity:Number((e==null?void 0:e.current_quantity)??0),base_unit:(e==null?void 0:e.base_unit)||"",stock_status:(e==null?void 0:e.stock_status)||"out_of_stock",minimum_stock:Number((e==null?void 0:e.minimum_stock)??0),ideal_stock:(e==null?void 0:e.ideal_stock)===null||(e==null?void 0:e.ideal_stock)===void 0?null:Number(e.ideal_stock)}}async function z(t,r){var c;const e=_(),a=await L();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const n=Number(r.quantity);if(!Number.isFinite(n)||n<=0)throw new Error("Informe uma quantidade maior que zero.");const o=await N(r.lotId);if(!o||o.deleted_at||o.agricultural_input_id!==r.inputId)throw new Error("Lote inválido para o insumo selecionado.");if(Number(o.current_quantity)<n)throw new Error(`Saldo insuficiente no lote. Disponível: ${o.current_quantity} ${o.unit}.`);const{data:s,error:i}=await e.from("event_inputs").insert({user_id:a.id,production_event_id:t,agricultural_input_id:r.inputId,inventory_lot_id:r.lotId,quantity:n,unit:o.unit,notes:((c=r.notes)==null?void 0:c.trim())||null}).select(x).single();if(i)throw i;return s}const et=[["all","Todos"],["overdue","Atrasados"],["today","Hoje"],["harvest_week","7 dias"],["upcoming","Próximos"]];function H(t){return t==null?"no_forecast":t<0?"overdue":t===0?"today":t<=7?"harvest_week":"upcoming"}function rt(t){switch(t){case"overdue":return"Previsão atrasada";case"today":return"Previsto para hoje";case"harvest_week":return"Semana da colheita";case"upcoming":return"Próxima colheita";default:return"Sem previsão"}}const O=["harvested","closed","cancelled"],U=`
  id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  initial_harvest_forecast,
  current_harvest_forecast,
  final_harvest_date,
  status,
  deleted_at,
  crop:crops (
    id,
    name,
    category,
    average_cycle_days
  ),
  area:areas (
    id,
    name,
    area_type:area_types (
      id,
      name
    )
  ),
  property:properties (
    id,
    name
  ),
  season:seasons (
    id,
    name
  )
`;function $(){if(!u)throw new Error("O Supabase não foi inicializado.");return u}function D(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function V(t){const r=D(),e=t.current_harvest_forecast?j(t.current_harvest_forecast,r):null,a=H(e);return{...t,days_to_harvest:e,forecast_state:a}}async function M({propertyId:t=null,filter:r="all"}={}){let a=$().from("production_cycles").select(U).is("deleted_at",null).not("status","in",`(${O.join(",")})`).not("current_harvest_forecast","is",null).order("current_harvest_forecast",{ascending:!0});t&&(a=a.eq("property_id",t));const{data:n,error:o}=await a;if(o)throw o;const s=(n??[]).map(V);return r==="all"?s:s.filter(i=>i.forecast_state===r)}const at=async()=>await v(),ot=async t=>await f(t),nt=t=>g(t);async function it(t,r){const e=await(t?y(t,r):m(r));if(!(e!=null&&e.id)||t&&e.id!==t)throw new Error("Confira as culturas antes de tentar salvar novamente.");return e.id}async function st(t){if(t.is_system)throw new Error("Culturas do sistema não podem ser alteradas.");const r=await w(t.id,!t.active);if(!r||r.id!==t.id||r.active===t.active)throw new Error("Atualize a ficha para conferir a alteração.");return r}const Y=async t=>await h(t);async function ct(t,r){const[e,a]=await Promise.all([Y(t),r?E(r):Promise.resolve(null)]);return{planting:e,event:(a==null?void 0:a.production_cycle_id)===t?a:null}}const ut=async t=>await P(t);async function lt(t,r,e){const a={...e,occurredAt:l(e.occurredAt)},n=await(r?S(r,t,a):d(t,a));if(!(n!=null&&n.id)||r&&n.id!==r||n.production_cycle_id!==t)throw new Error("Confira a linha do tempo antes de salvar novamente.");return n.id}const dt=async()=>await A(),_t=async t=>t?await T({inputId:t,includeEmpty:!1}):[];async function pt(t,r,e,a,n){const o=await z(t,{inputId:r,lotId:e,quantity:R(a),notes:n});if(!(o!=null&&o.id))throw new Error("Confira o uso de insumos antes de tentar novamente.");return o}const ft=t=>B(t),yt=async t=>await b(t),mt=t=>C(t),vt=async t=>await M({propertyId:t||null});async function wt(t,r,e,a,n){let o=null,s=null;try{if(o=await q({file:r,cycle:t}),e==="__auto__"){const c=await d(t.id,{eventType:"photo",title:"Registro fotográfico",description:a||"Foto adicionada à evolução visual do ciclo.",notes:"",occurredAt:l(n)});if(!(c!=null&&c.id))throw new Error("Não foi possível confirmar o evento fotográfico.");s=c.id}const i=await k({cycle:t,eventId:s||(e==="__auto__"?null:e)||null,storagePath:o,description:a,capturedAt:l(n)});if(!(i!=null&&i.id))throw new Error("Não foi possível confirmar o registro da foto.");return i.id}catch(i){throw(await Promise.allSettled([...o?[I(o)]:[],...s?[F(s)]:[]])).some(p=>p.status==="rejected")?new Error("O envio falhou e a limpeza não foi concluída. Confira a galeria e a linha do tempo antes de repetir."):i}}export{et as H,ot as a,nt as b,at as c,ct as d,lt as e,pt as f,ft as g,Y as h,dt as i,vt as j,rt as k,_t as l,ut as m,wt as n,yt as p,mt as r,it as s,st as t};
