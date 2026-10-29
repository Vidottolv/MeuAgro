import{getCropById as d,updateCrop as p,createCrop as f,listCrops as y,setCropActive as m}from"./cropService-CHKjzf90.js";import{getProductionCycleById as v,countOpenCyclesByCrop as w}from"./productionCycleService-DvQYpHH9.js";import{getProductionEventById as h,updateProductionEvent as g,createProductionEvent as E,listProductionEvents as S}from"./productionEventService-uaOqJS6t.js";import{l as b}from"./agriculturalInputService-BiTgbC7U.js";import{g as C,l as q}from"./inventoryLotService-DpHiikWw.js";import{j as P,s as c,al as k}from"./index-D4QhsyJX.js";import{listCyclePhotos as I,deletePhoto as F,validatePhotoFile as A}from"./photoService-BnBortsg.js";import{d as N}from"./cycleMetrics-BxtU-i7j.js";import{q as L,l}from"./productionModel-N69rzoPM.js";const T=`
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
`;function _(){if(!c)throw new Error("O Supabase não foi inicializado.");return c}async function j(t){const r=_(),{data:e,error:n}=await r.from("inventory_balances").select(`
        agricultural_input_id,
        current_quantity,
        base_unit,
        stock_status,
        minimum_stock,
        ideal_stock
      `).eq("agricultural_input_id",t).maybeSingle();if(n)throw n;return{agricultural_input_id:t,current_quantity:Number((e==null?void 0:e.current_quantity)??0),base_unit:(e==null?void 0:e.base_unit)||"",stock_status:(e==null?void 0:e.stock_status)||"out_of_stock",minimum_stock:Number((e==null?void 0:e.minimum_stock)??0),ideal_stock:(e==null?void 0:e.ideal_stock)===null||(e==null?void 0:e.ideal_stock)===void 0?null:Number(e.ideal_stock)}}async function x(t,r){var u;const e=_(),n=await P();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const o=Number(r.quantity);if(!Number.isFinite(o)||o<=0)throw new Error("Informe uma quantidade maior que zero.");const a=await C(r.lotId);if(!a||a.deleted_at||a.agricultural_input_id!==r.inputId)throw new Error("Lote inválido para o insumo selecionado.");if(Number(a.current_quantity)<o)throw new Error(`Saldo insuficiente no lote. Disponível: ${a.current_quantity} ${a.unit}.`);const{data:i,error:s}=await e.from("event_inputs").insert({user_id:n.id,production_event_id:t,agricultural_input_id:r.inputId,inventory_lot_id:r.lotId,quantity:o,unit:a.unit,notes:((u=r.notes)==null?void 0:u.trim())||null}).select(T).single();if(s)throw s;return i}const Z=[["all","Todos"],["overdue","Atrasados"],["today","Hoje"],["harvest_week","7 dias"],["upcoming","Próximos"]];function B(t){return t==null?"no_forecast":t<0?"overdue":t===0?"today":t<=7?"harvest_week":"upcoming"}function tt(t){switch(t){case"overdue":return"Previsão atrasada";case"today":return"Previsto para hoje";case"harvest_week":return"Semana da colheita";case"upcoming":return"Próxima colheita";default:return"Sem previsão"}}const H=["harvested","closed","cancelled"],R=`
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
`;function z(){if(!c)throw new Error("O Supabase não foi inicializado.");return c}function O(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function U(t){const r=O(),e=t.current_harvest_forecast?N(t.current_harvest_forecast,r):null,n=B(e);return{...t,days_to_harvest:e,forecast_state:n}}async function $({propertyId:t=null,filter:r="all"}={}){let n=z().from("production_cycles").select(R).is("deleted_at",null).not("status","in",`(${H.join(",")})`).not("current_harvest_forecast","is",null).order("current_harvest_forecast",{ascending:!0});t&&(n=n.eq("property_id",t));const{data:o,error:a}=await n;if(a)throw a;const i=(o??[]).map(U);return r==="all"?i:i.filter(s=>s.forecast_state===r)}const et=async()=>await y(),rt=async t=>await d(t),nt=t=>w(t);async function at(t,r){const e=await(t?p(t,r):f(r));if(!(e!=null&&e.id)||t&&e.id!==t)throw new Error("Confira as culturas antes de tentar salvar novamente.");return e.id}async function ot(t){if(t.is_system)throw new Error("Culturas do sistema não podem ser alteradas.");const r=await m(t.id,!t.active);if(!r||r.id!==t.id||r.active===t.active)throw new Error("Atualize a ficha para conferir a alteração.");return r}const D=async t=>await v(t);async function it(t,r){const[e,n]=await Promise.all([D(t),r?h(r):Promise.resolve(null)]);return{planting:e,event:(n==null?void 0:n.production_cycle_id)===t?n:null}}const st=async t=>await S(t);async function ct(t,r,e){const n={...e,occurredAt:l(e.occurredAt)},o=await(r?g(r,t,n):E(t,n));if(!(o!=null&&o.id)||r&&o.id!==r||o.production_cycle_id!==t)throw new Error("Confira a linha do tempo antes de salvar novamente.");return o.id}const ut=async()=>await b(),lt=async t=>t?await q({inputId:t,includeEmpty:!1}):[];async function _t(t,r,e,n,o){const a=await x(t,{inputId:r,lotId:e,quantity:L(n),notes:o});if(!(a!=null&&a.id))throw new Error("Confira o uso de insumos antes de tentar novamente.");return a}const dt=t=>j(t),pt=async t=>await I(t),ft=t=>F(t),yt=async t=>await $({propertyId:t||null});async function mt(t,r,e,n,o){const a=A(r);if(a)throw new Error(a);return k(t,r,e,n,l(o))}export{Z as H,rt as a,nt as b,et as c,it as d,ct as e,_t as f,dt as g,D as h,ut as i,yt as j,tt as k,lt as l,st as m,mt as n,pt as p,ft as r,at as s,ot as t};
