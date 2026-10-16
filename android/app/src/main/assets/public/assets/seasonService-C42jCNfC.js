import{s as d,j as c}from"./index-CFRkglUh.js";const o=`
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
`;function a(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function u(t){var r,n;return{property_id:t.propertyId,name:((r=t.name)==null?void 0:r.trim())||"",start_date:t.startDate||null,end_date:t.endDate||null,description:((n=t.description)==null?void 0:n.trim())||null,status:t.status||"planned"}}async function p({propertyId:t=null,status:r=null,archived:n=!1}={}){let e=a().from("seasons").select(o);n?e=e.not("deleted_at","is",null):e=e.is("deleted_at",null),t&&(e=e.eq("property_id",t)),r&&(e=e.eq("status",r)),e=e.order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1});const{data:i,error:l}=await e;if(l)throw l;return i??[]}async function w(t){const r=a(),{data:n,error:s}=await r.from("seasons").select(o).eq("id",t).maybeSingle();if(s)throw s;return n}async function _(t){const r=a(),n=await c();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const s=u(t),{data:e,error:i}=await r.from("seasons").insert({...s,user_id:n.id}).select(o).single();if(i)throw i;return e}async function m(t,r){const n=a(),s=await c();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const e=u(r),{data:i,error:l}=await n.from("seasons").update(e).eq("id",t).eq("user_id",s.id).is("deleted_at",null).select(o).single();if(l)throw l;return i}async function y(t){const r=a(),n=await c();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:e}=await r.from("seasons").update({deleted_at:new Date().toISOString()}).eq("id",t).eq("user_id",n.id).select(o).single();if(e)throw e;return s}async function S(t){const r=a(),n=await c();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:e}=await r.from("seasons").update({deleted_at:null}).eq("id",t).eq("user_id",n.id).select(o).single();if(e)throw e;return s}async function h(t=null){let n=a().from("seasons").select("id",{count:"exact",head:!0}).is("deleted_at",null).in("status",["planned","active"]);t&&(n=n.eq("property_id",t));const{count:s,error:e}=await n;if(e)throw e;return s??0}async function q(t,r=3){const n=a(),{data:s,error:e}=await n.from("seasons").select(o).eq("property_id",t).is("deleted_at",null).order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1}).limit(r);if(e)throw e;return s??[]}export{y as archiveSeason,h as countOpenSeasons,_ as createSeason,w as getSeasonById,q as listRecentPropertySeasons,p as listSeasons,S as restoreSeason,m as updateSeason};
