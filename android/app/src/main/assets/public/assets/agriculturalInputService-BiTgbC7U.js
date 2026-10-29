import{s as c,j as o}from"./index-D4QhsyJX.js";const a=`
  id,
  user_id,
  name,
  brand,
  category,
  base_unit,
  description,
  notes,
  minimum_stock,
  ideal_stock,
  active,
  deleted_at,
  created_at,
  updated_at
`;function s(){if(!c)throw new Error("O Supabase não foi inicializado.");return c}function l(t){if(t===""||t===null||t===void 0)return null;const r=Number(t);return Number.isFinite(r)?r:null}function d(t){var r,e,n,i;return{name:((r=t.name)==null?void 0:r.trim())||"",brand:((e=t.brand)==null?void 0:e.trim())||null,category:t.category,base_unit:t.baseUnit,description:((n=t.description)==null?void 0:n.trim())||null,notes:((i=t.notes)==null?void 0:i.trim())||null,minimum_stock:l(t.minimumStock)??0,ideal_stock:l(t.idealStock)}}async function m(){const t=s(),{data:r,error:e}=await t.from("inventory_balances").select(`
        agricultural_input_id,
        current_quantity,
        stock_status,
        minimum_stock,
        ideal_stock,
        base_unit
      `);if(e)throw e;return new Map((r??[]).map(n=>[n.agricultural_input_id,n]))}function _(t,r){return{...t,current_quantity:(r==null?void 0:r.current_quantity)??0,stock_status:(r==null?void 0:r.stock_status)??"out_of_stock"}}async function p({includeInactive:t=!0}={}){let e=s().from("agricultural_inputs").select(a).is("deleted_at",null);t||(e=e.eq("active",!0)),e=e.order("name",{ascending:!0});const[n,i]=await Promise.all([e,m()]);if(n.error)throw n.error;return(n.data??[]).map(u=>_(u,i.get(u.id)))}async function g(t){const r=s(),[e,n]=await Promise.all([r.from("agricultural_inputs").select(a).eq("id",t).maybeSingle(),m()]);if(e.error)throw e.error;return e.data?_(e.data,n.get(t)):null}async function w(t){const r=s(),e=await o();if(!e)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:i}=await r.from("agricultural_inputs").insert({...d(t),user_id:e.id,active:!0}).select(a).single();if(i)throw i;return n}async function y(t,r){const e=s(),n=await o();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:i,error:u}=await e.from("agricultural_inputs").update(d(r)).eq("id",t).eq("user_id",n.id).is("deleted_at",null).select(a).single();if(u)throw u;return i}async function k(t,r){const e=s(),n=await o();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:i,error:u}=await e.from("agricultural_inputs").update({active:!!r}).eq("id",t).eq("user_id",n.id).is("deleted_at",null).select(a).single();if(u)throw u;return i}export{w as c,g,p as l,k as s,y as u};
