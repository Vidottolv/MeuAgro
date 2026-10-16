import{s as d,j as u}from"./index-CFRkglUh.js";const s=`
  id,
  user_id,
  name,
  description,
  city,
  state,
  total_area,
  area_unit,
  notes,
  image_url,
  status,
  deleted_at,
  created_at,
  updated_at
`;function a(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function p(e){var r,t,n,o,i,c,l;return{name:((r=e.name)==null?void 0:r.trim())||"",description:((t=e.description)==null?void 0:t.trim())||null,city:((n=e.city)==null?void 0:n.trim())||null,state:((i=(o=e.state)==null?void 0:o.trim())==null?void 0:i.toUpperCase())||null,total_area:e.totalArea===""||e.totalArea===null||e.totalArea===void 0?null:Number(e.totalArea),area_unit:((c=e.areaUnit)==null?void 0:c.trim())||null,notes:((l=e.notes)==null?void 0:l.trim())||null}}async function w(){const e=a(),{data:r,error:t}=await e.from("properties").select(s).is("deleted_at",null).neq("status","archived").order("name",{ascending:!0});if(t)throw t;return r??[]}async function m(){const e=a(),{data:r,error:t}=await e.from("properties").select(s).eq("status","archived").order("updated_at",{ascending:!1});if(t)throw t;return r??[]}async function y(e){const r=a(),{data:t,error:n}=await r.from("properties").select(s).eq("id",e).maybeSingle();if(n)throw n;return t}async function h(e){const r=a(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const n=p(e),{data:o,error:i}=await r.from("properties").insert({...n,user_id:t.id,status:"active"}).select(s).single();if(i)throw i;return o}async function _(e,r){const t=a(),n=await u();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const o=p(r),{data:i,error:c}=await t.from("properties").update(o).eq("id",e).eq("user_id",n.id).is("deleted_at",null).select(s).single();if(c)throw c;return i}async function v(e){const r=a(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const n=new Date().toISOString(),{data:o,error:i}=await r.from("properties").update({status:"archived",deleted_at:n}).eq("id",e).eq("user_id",t.id).select(s).single();if(i)throw i;return o}async function g(e){const r=a(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:o}=await r.from("properties").update({status:"active",deleted_at:null}).eq("id",e).eq("user_id",t.id).select(s).single();if(o)throw o;return n}async function q(){const e=a(),{count:r,error:t}=await e.from("properties").select("id",{count:"exact",head:!0}).is("deleted_at",null).neq("status","archived");if(t)throw t;return r??0}export{v as archiveProperty,q as countActiveProperties,h as createProperty,y as getPropertyById,w as listActiveProperties,m as listArchivedProperties,g as restoreProperty,_ as updateProperty};
