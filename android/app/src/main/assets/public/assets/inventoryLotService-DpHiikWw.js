import{s as m,j as h}from"./index-D4QhsyJX.js";const c=`
  id,
  user_id,
  agricultural_input_id,
  supplier,
  purchased_quantity,
  unit,
  total_price,
  unit_price,
  purchase_date,
  expiration_date,
  batch_number,
  notes,
  deleted_at,
  created_at,
  updated_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active,
    deleted_at
  )
`;function l(){if(!m)throw new Error("O Supabase não foi inicializado.");return m}function f(e){if(e===""||e===null||e===void 0)return null;const t=Number(e);return Number.isFinite(t)?t:null}async function w({inputId:e=null}={}){let n=l().from("inventory_lot_balances").select(`
        inventory_lot_id,
        agricultural_input_id,
        current_quantity,
        unit,
        unit_price,
        purchase_date,
        expiration_date,
        batch_number
      `);e&&(n=n.eq("agricultural_input_id",e));const{data:a,error:r}=await n;if(r)throw r;return new Map((a??[]).map(i=>[i.inventory_lot_id,i]))}function b(e,t){return{...e,current_quantity:(t==null?void 0:t.current_quantity)??0}}async function v({inputId:e=null,includeEmpty:t=!0,limit:n=null}={}){let r=l().from("inventory_lots").select(c).is("deleted_at",null);e&&(r=r.eq("agricultural_input_id",e)),r=r.order("purchase_date",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(n)&&n>0&&(r=r.limit(n));const[i,s]=await Promise.all([r,w({inputId:e})]);if(i.error)throw i.error;const o=(i.data??[]).map(u=>b(u,s.get(u.id)));return t?o:o.filter(u=>Number(u.current_quantity)>0)}async function q(e){const t=l(),[n,a]=await Promise.all([t.from("inventory_lots").select(c).eq("id",e).maybeSingle(),w()]);if(n.error)throw n.error;return n.data?b(n.data,a.get(e)):null}async function x(e,t){var _,p,y;const n=l(),a=await h();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:i}=await n.from("agricultural_inputs").select(`
      id,
      user_id,
      name,
      base_unit,
      active,
      deleted_at
    `).eq("id",e).eq("user_id",a.id).maybeSingle();if(i)throw i;if(!r||r.deleted_at)throw new Error("Insumo inválido para o lote.");if(!r.active)throw new Error("O insumo está inativo. Reative-o antes de cadastrar um novo lote.");const s=f(t.purchasedQuantity),o=f(t.totalPrice),{data:u,error:d}=await n.from("inventory_lots").insert({user_id:a.id,agricultural_input_id:r.id,supplier:((_=t.supplier)==null?void 0:_.trim())||null,purchased_quantity:s,unit:r.base_unit,total_price:o,purchase_date:t.purchaseDate,expiration_date:t.expirationDate||null,batch_number:((p=t.batchNumber)==null?void 0:p.trim())||null,notes:((y=t.notes)==null?void 0:y.trim())||null}).select(c).single();if(d)throw d;return u}async function E(e,t){var s,o,u;const n=l(),a=await h();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:i}=await n.from("inventory_lots").update({supplier:((s=t.supplier)==null?void 0:s.trim())||null,expiration_date:t.expirationDate||null,batch_number:((o=t.batchNumber)==null?void 0:o.trim())||null,notes:((u=t.notes)==null?void 0:u.trim())||null}).eq("id",e).eq("user_id",a.id).is("deleted_at",null).select(c).single();if(i)throw i;return r}export{x as c,q as g,v as l,E as u};
