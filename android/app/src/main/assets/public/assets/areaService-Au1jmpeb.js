import{j as u,s as d}from"./index-CFRkglUh.js";const c=`
  id,
  user_id,
  property_id,
  area_type_id,
  name,
  size,
  unit,
  description,
  location_description,
  notes,
  image_url,
  status,
  deleted_at,
  created_at,
  updated_at,
  area_type:area_types (
    id,
    name,
    description,
    is_system,
    user_id
  )
`;function i(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function l(e){var n,t,a,r,s;return{area_type_id:e.areaTypeId||null,name:((n=e.name)==null?void 0:n.trim())||"",size:e.size===""||e.size===null||e.size===void 0?null:Number(e.size),unit:((t=e.unit)==null?void 0:t.trim())||null,description:((a=e.description)==null?void 0:a.trim())||null,location_description:((r=e.locationDescription)==null?void 0:r.trim())||null,notes:((s=e.notes)==null?void 0:s.trim())||null}}async function _(){const e=i(),{data:n,error:t}=await e.from("area_types").select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).order("is_system",{ascending:!1}).order("name",{ascending:!0});if(t)throw t;return n??[]}async function m({name:e,description:n}){const t=i(),a=await u();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:s}=await t.from("area_types").insert({user_id:a.id,name:e.trim(),description:(n==null?void 0:n.trim())||null,is_system:!1}).select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).single();if(s)throw s;return r}async function p(e,{archived:n=!1,limit:t=null}={}){let r=i().from("areas").select(c).eq("property_id",e);n?r=r.eq("status","archived"):r=r.is("deleted_at",null).neq("status","archived"),r=r.order("name",{ascending:!0}),Number.isInteger(t)&&t>0&&(r=r.limit(t));const{data:s,error:o}=await r;if(o)throw o;return s??[]}async function w(e=null){let t=i().from("areas").select("id",{count:"exact",head:!0}).is("deleted_at",null).neq("status","archived");e&&(t=t.eq("property_id",e));const{count:a,error:r}=await t;if(r)throw r;return a??0}async function y(e){const n=i(),{data:t,error:a}=await n.from("areas").select(c).eq("id",e).maybeSingle();if(a)throw a;return t}async function h(e,n){const t=i(),a=await u();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=l(n),{data:s,error:o}=await t.from("areas").insert({...r,user_id:a.id,property_id:e,status:"active"}).select(c).single();if(o)throw o;return s}async function q(e,n){const t=i(),a=await u();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=l(n),{data:s,error:o}=await t.from("areas").update(r).eq("id",e).eq("user_id",a.id).is("deleted_at",null).select(c).single();if(o)throw o;return s}async function g(e){const n=i(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:a,error:r}=await n.from("areas").update({status:"archived",deleted_at:new Date().toISOString()}).eq("id",e).eq("user_id",t.id).select(c).single();if(r)throw r;return a}async function v(e){const n=i(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:a,error:r}=await n.from("areas").update({status:"active",deleted_at:null}).eq("id",e).eq("user_id",t.id).select(c).single();if(r)throw r;return a}export{g as archiveArea,w as countActiveAreas,h as createArea,m as createAreaType,y as getAreaById,_ as listAreaTypes,p as listAreasByProperty,v as restoreArea,q as updateArea};
