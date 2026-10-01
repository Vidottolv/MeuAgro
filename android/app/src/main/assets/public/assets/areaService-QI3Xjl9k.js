import{j as u,s as d}from"./index-CX5EOl4V.js";const c=`
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
`;function i(){if(!d)throw new Error("O Supabase não foi inicializado.");return d}function l(e){var a,t,s,r,n;return{area_type_id:e.areaTypeId||null,name:((a=e.name)==null?void 0:a.trim())||"",size:e.size===""||e.size===null||e.size===void 0?null:Number(e.size),unit:((t=e.unit)==null?void 0:t.trim())||null,description:((s=e.description)==null?void 0:s.trim())||null,location_description:((r=e.locationDescription)==null?void 0:r.trim())||null,notes:((n=e.notes)==null?void 0:n.trim())||null}}async function _(){const e=i(),{data:a,error:t}=await e.from("area_types").select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).order("is_system",{ascending:!1}).order("name",{ascending:!0});if(t)throw t;return a??[]}async function m({name:e,description:a}){const t=i(),s=await u();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await t.from("area_types").insert({user_id:s.id,name:e.trim(),description:(a==null?void 0:a.trim())||null,is_system:!1}).select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).single();if(n)throw n;return r}async function p(e,{archived:a=!1,limit:t=null}={}){let r=i().from("areas").select(c).eq("property_id",e);a?r=r.eq("status","archived"):r=r.is("deleted_at",null).neq("status","archived"),r=r.order("name",{ascending:!0}),Number.isInteger(t)&&t>0&&(r=r.limit(t));const{data:n,error:o}=await r;if(o)throw o;return n??[]}async function w(e=null){let t=i().from("areas").select("id",{count:"exact",head:!0}).is("deleted_at",null).neq("status","archived");e&&(t=t.eq("property_id",e));const{count:s,error:r}=await t;if(r)throw r;return s??0}async function y(e){const a=i(),{data:t,error:s}=await a.from("areas").select(c).eq("id",e).maybeSingle();if(s)throw s;return t}async function h(e,a){const t=i(),s=await u();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const r=l(a),{data:n,error:o}=await t.from("areas").insert({...r,user_id:s.id,property_id:e,status:"active"}).select(c).single();if(o)throw o;return n}async function g(e,a){const t=i(),s=await u();if(!s)throw new Error("Sua sessão expirou. Entre novamente.");const r=l(a),{data:n,error:o}=await t.from("areas").update(r).eq("id",e).eq("user_id",s.id).is("deleted_at",null).select(c).single();if(o)throw o;return n}async function q(e){const a=i(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:r}=await a.from("areas").update({status:"archived",deleted_at:new Date().toISOString()}).eq("id",e).eq("user_id",t.id).select(c).single();if(r)throw r;return s}async function v(e){const a=i(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:r}=await a.from("areas").update({status:"active",deleted_at:null}).eq("id",e).eq("user_id",t.id).select(c).single();if(r)throw r;return s}export{q as a,_ as b,w as c,m as d,h as e,y as g,p as l,v as r,g as u};
