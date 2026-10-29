import{l as _,g as S,a as b,b as q,u as H,c as E,f as N}from"./harvestService-UQv1XJU_.js";import{j as w,s as f}from"./index-D4QhsyJX.js";import{v as I,b as C}from"./harvestModel-BNgBba4i.js";import{q as u}from"./productionModel-N69rzoPM.js";const c=`
  id,
  user_id,
  harvest_id,
  buyer,
  quantity,
  unit,
  unit_price,
  total_value,
  sale_date,
  payment_method,
  notes,
  created_at,
  updated_at,
  harvest:harvests (
    id,
    user_id,
    production_cycle_id,
    harvest_date,
    quantity,
    unit,
    quality_classification,
    destination,
    notes,
    production_cycle:production_cycles (
      id,
      property_id,
      area_id,
      variety,
      status,
      deleted_at,
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
    )
  )
`;function l(){if(!f)throw new Error("O Supabase não foi inicializado.");return f}function m(t,a){var e,r;return{harvest_id:a.id,buyer:((e=t.buyer)==null?void 0:e.trim())||null,quantity:Number(t.quantity),unit:a.unit,unit_price:Number(t.unitPrice),sale_date:t.saleDate,payment_method:t.paymentMethod||null,notes:((r=t.notes)==null?void 0:r.trim())||null}}function x(t){if(!t||!/^\d{4}-\d{2}$/.test(t))return null;const[a,e]=t.split("-").map(Number),r=`${a}-${String(e).padStart(2,"0")}-01`,i=new Date(a,e,1,12,0,0,0),s=[i.getFullYear(),String(i.getMonth()+1).padStart(2,"0"),"01"].join("-");return{start:r,end:s}}async function z({harvestId:t=null,propertyId:a=null,month:e=null,limit:r=null}={}){let s=l().from("harvest_sales").select(c).order("sale_date",{ascending:!1}).order("created_at",{ascending:!1});t&&(s=s.eq("harvest_id",t));const n=x(e);n&&(s=s.gte("sale_date",n.start).lt("sale_date",n.end)),Number.isInteger(r)&&r>0&&(s=s.limit(r));const{data:o,error:d}=await s;if(d)throw d;const y=o??[];return a?y.filter(g=>{var v,p;return((p=(v=g.harvest)==null?void 0:v.production_cycle)==null?void 0:p.property_id)===a}):y}async function P(t){const a=l(),{data:e,error:r}=await a.from("harvest_sales").select(c).eq("id",t).maybeSingle();if(r)throw r;return e}async function $(){return(await _()).filter(a=>{var r;const e=S(a);return!((r=a.production_cycle)!=null&&r.deleted_at)&&e.allowsSales&&e.remainingQuantity>0})}async function B(t,a){const e=l(),r=await w();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:i,error:s}=await e.from("harvest_sales").insert({...m(a,t),user_id:r.id}).select(c).single();if(s)throw s;return i}async function D(t,a,e){const r=l(),i=await w();if(!i)throw new Error("Sua sessão expirou. Entre novamente.");const s=m(e,a);delete s.harvest_id;const{data:n,error:o}=await r.from("harvest_sales").update(s).eq("id",t).eq("user_id",i.id).select(c).single();if(o)throw o;return n}const Q=async()=>await _(),h=async t=>await b(t),F=async()=>await q(),U=async()=>await z(),j=async t=>await P(t),V=async()=>await $(),Y=N;async function k(t,a){const e=t?await h(t):null;if(t&&!e)throw Error("Colheita não encontrada.");const r=(e==null?void 0:e.production_cycle)||(await F()).find(o=>o.id===a.cycleId),i=C(a,r,e);if(i)throw Error(i);const s={...a,quantity:u(a.quantity)},n=t?await H(t,s):await E(a.cycleId,s);if(!(n!=null&&n.id))throw Error("Não foi possível confirmar a gravação da colheita.");return String(n.id)}async function G(t,a){const e=t?await j(t):null;if(t&&(!e||e.harvest_id!==a.harvestId))throw Error("Venda não encontrada para esta colheita.");const r=await h(a.harvestId),i=I(a,r,t);if(i)throw Error(i);const s={...a,quantity:u(a.quantity),unitPrice:u(a.unitPrice)},n=t?await D(t,r,s):await B(r,s);if(!(n!=null&&n.id))throw Error("Não foi possível confirmar a gravação da venda.");return String(n.id)}export{F as a,U as b,j as c,G as d,V as e,Y as f,h as g,Q as l,k as s};
