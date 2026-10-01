import{s as f,j as i}from"./index-CX5EOl4V.js";const l=`
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
`;function u(){if(!f)throw new Error("O Supabase não foi inicializado.");return f}function w(e){var n,t,s,r,a,o,p;return{name:((n=e.name)==null?void 0:n.trim())||"",description:((t=e.description)==null?void 0:t.trim())||null,city:((s=e.city)==null?void 0:s.trim())||null,state:((a=(r=e.state)==null?void 0:r.trim())==null?void 0:a.toUpperCase())||null,total_area:e.totalArea===""||e.totalArea===null||e.totalArea===void 0?null:Number(e.totalArea),area_unit:((o=e.areaUnit)==null?void 0:o.trim())||null,notes:((p=e.notes)==null?void 0:p.trim())||null}}async function y(){const e=u(),{data:n,error:t}=await e.from("properties").select(l).is("deleted_at",null).neq("status","archived").order("name",{ascending:!0});if(t)throw t;return n??[]}async function h(){const e=u(),{data:n,error:t}=await e.from("properties").select(l).eq("status","archived").order("updated_at",{ascending:!1});if(t)throw t;return n??[]}async function S(e){const n=u(),{data:t,error:s}=await n.from("properties").select(l).eq("id",e).maybeSingle();if(s)throw s;return t}async function q(e){const n=u(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const s=w(e),{data:r,error:a}=await n.from("properties").insert({...s,user_id:t.id,status:"active"}).select(l).single();if(a)throw a;return r}async function g(e,n){const t=u(),s=await i();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const r=w(n),{data:a,error:o}=await t.from("properties").update(r).eq("id",e).eq("user_id",s.id).is("deleted_at",null).select(l).single();if(o)throw o;return a}async function E(e){const n=u(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const s=new Date().toISOString(),{data:r,error:a}=await n.from("properties").update({status:"archived",deleted_at:s}).eq("id",e).eq("user_id",t.id).select(l).single();if(a)throw a;return r}async function v(e){const n=u(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:r}=await n.from("properties").update({status:"active",deleted_at:null}).eq("id",e).eq("user_id",t.id).select(l).single();if(r)throw r;return s}const d=`
  id,
  user_id,
  property_id,
  name,
  start_date,
  end_date,
  description,
  status,
  deleted_at,
  created_at,
  updated_at,
  property:properties (
    id,
    name,
    city,
    state,
    deleted_at
  )
`;function c(){if(!f)throw new Error("O Supabase não foi inicializado.");return f}function m(e){var n,t;return{property_id:e.propertyId,name:((n=e.name)==null?void 0:n.trim())||"",start_date:e.startDate||null,end_date:e.endDate||null,description:((t=e.description)==null?void 0:t.trim())||null,status:e.status||"planned"}}async function P({propertyId:e=null,status:n=null,archived:t=!1}={}){let r=c().from("seasons").select(d);t?r=r.not("deleted_at","is",null):r=r.is("deleted_at",null),e&&(r=r.eq("property_id",e)),n&&(r=r.eq("status",n)),r=r.order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1});const{data:a,error:o}=await r;if(o)throw o;return a??[]}async function x(e){const n=c(),{data:t,error:s}=await n.from("seasons").select(d).eq("id",e).maybeSingle();if(s)throw s;return t}async function b(e){const n=c(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const s=m(e),{data:r,error:a}=await n.from("seasons").insert({...s,user_id:t.id}).select(d).single();if(a)throw a;return r}async function A(e,n){const t=c(),s=await i();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const r=m(n),{data:a,error:o}=await t.from("seasons").update(r).eq("id",e).eq("user_id",s.id).is("deleted_at",null).select(d).single();if(o)throw o;return a}async function O(e){const n=c(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:r}=await n.from("seasons").update({deleted_at:new Date().toISOString()}).eq("id",e).eq("user_id",t.id).select(d).single();if(r)throw r;return s}async function D(e){const n=c(),t=await i();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:r}=await n.from("seasons").update({deleted_at:null}).eq("id",e).eq("user_id",t.id).select(d).single();if(r)throw r;return s}async function I(e=null){let t=c().from("seasons").select("id",{count:"exact",head:!0}).is("deleted_at",null).in("status",["planned","active"]);e&&(t=t.eq("property_id",e));const{count:s,error:r}=await t;if(r)throw r;return s??0}async function z(e,n=3){const t=c(),{data:s,error:r}=await t.from("seasons").select(d).eq("property_id",e).is("deleted_at",null).order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1}).limit(n);if(r)throw r;return s??[]}export{h as a,P as b,O as c,b as d,S as e,z as f,x as g,I as h,E as i,v as j,g as k,y as l,q as m,D as r,A as u};
