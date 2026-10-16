import{s as _,j as l}from"./index-CFRkglUh.js";const p=[["entry","Entrada"],["usage","Saída por uso"],["positive_adjustment","Ajuste positivo"],["negative_adjustment","Ajuste negativo"],["loss","Perda"],["expiration","Vencimento"],["return","Devolução"]],y=[["positive_adjustment","Ajuste positivo"],["negative_adjustment","Ajuste negativo"],["loss","Perda"],["expiration","Vencimento"],["return","Devolução"]],v=["entry","positive_adjustment","return"];function m(t){var i;return((i=p.find(([r])=>r===t))==null?void 0:i[1])||t||"Movimentação"}function I(t){return v.includes(t)?1:-1}const u=`
  id,
  user_id,
  agricultural_input_id,
  inventory_lot_id,
  production_cycle_id,
  production_event_id,
  transaction_type,
  quantity,
  unit,
  unit_cost,
  total_cost,
  occurred_at,
  notes,
  created_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    unit,
    unit_price,
    purchase_date,
    expiration_date
  ),
  production_cycle:production_cycles (
    id,
    variety,
    crop:crops (
      id,
      name
    ),
    area:areas (
      id,
      name
    ),
    property:properties (
      id,
      name
    )
  ),
  production_event:production_events (
    id,
    title,
    event_type,
    occurred_at
  )
`;function c(){if(!_)throw new Error("O Supabase não foi inicializado.");return _}function g(){return new Set(y.map(([t])=>t))}async function f({inputId:t=null,lotId:i=null,type:r=null,limit:n=null}={}){let e=c().from("inventory_transactions").select(u);t&&(e=e.eq("agricultural_input_id",t)),i&&(e=e.eq("inventory_lot_id",i)),r&&(e=e.eq("transaction_type",r)),e=e.order("occurred_at",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(n)&&n>0&&(e=e.limit(n));const{data:s,error:o}=await e;if(o)throw o;return s??[]}async function w(t){const i=c(),{data:r,error:n}=await i.from("inventory_transactions").select(u).eq("id",t).maybeSingle();if(n)throw n;return r}async function S(t){var d;const i=c(),r=await l();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");if(!g().has(t.transactionType))throw new Error("Este tipo de movimentação não pode ser criado manualmente.");const{data:n,error:a}=await i.from("inventory_lots").select(`
      id,
      user_id,
      agricultural_input_id,
      unit,
      unit_price,
      deleted_at
    `).eq("id",t.lotId).eq("user_id",r.id).maybeSingle();if(a)throw a;if(!n||n.deleted_at||n.agricultural_input_id!==t.inputId)throw new Error("Lote inválido para o insumo informado.");const e=Number(t.quantity),{data:s,error:o}=await i.from("inventory_transactions").insert({user_id:r.id,agricultural_input_id:t.inputId,inventory_lot_id:n.id,production_cycle_id:t.productionCycleId||null,production_event_id:t.productionEventId||null,transaction_type:t.transactionType,quantity:e,unit:n.unit,unit_cost:n.unit_price,occurred_at:t.occurredAt||new Date().toISOString(),notes:((d=t.notes)==null?void 0:d.trim())||null}).select(u).single();if(o)throw o;return s}export{p as I,y as M,I as a,w as b,S as c,m as g,f as l};
