import{j as c,s as u}from"./index-CX5EOl4V.js";const o=`
  id,
  user_id,
  name,
  category,
  average_cycle_days,
  notes,
  is_system,
  active,
  created_at,
  updated_at
`;function i(){if(!u)throw new Error("O Supabase não foi inicializado.");return u}function l(e){var s,r,t;return{name:((s=e.name)==null?void 0:s.trim())||"",category:((r=e.category)==null?void 0:r.trim())||null,average_cycle_days:e.averageCycleDays===""||e.averageCycleDays===null||e.averageCycleDays===void 0?null:Number(e.averageCycleDays),notes:((t=e.notes)==null?void 0:t.trim())||null}}async function f({activeOnly:e=!1}={}){let r=i().from("crops").select(o);e&&(r=r.eq("active",!0)),r=r.order("is_system",{ascending:!1}).order("name",{ascending:!0});const{data:t,error:a}=await r;if(a)throw a;return t??[]}async function d(){return f({activeOnly:!0})}async function m(e){const s=i(),{data:r,error:t}=await s.from("crops").select(o).eq("id",e).maybeSingle();if(t)throw t;return r}async function p(e){const s=i(),r=await c();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:t,error:a}=await s.from("crops").insert({...l(e),user_id:r.id,is_system:!1,active:!0}).select(o).single();if(a)throw a;return t}async function w(e,s){const r=i(),t=await c();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:a,error:n}=await r.from("crops").update(l(s)).eq("id",e).eq("user_id",t.id).eq("is_system",!1).select(o).single();if(n)throw n;return a}async function g(e,s){const r=i(),t=await c();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:a,error:n}=await r.from("crops").update({active:!!s}).eq("id",e).eq("user_id",t.id).eq("is_system",!1).select(o).single();if(n)throw n;return a}export{f as a,p as c,m as g,d as l,g as s,w as u};
