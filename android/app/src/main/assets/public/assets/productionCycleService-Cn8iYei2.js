import{s as y,j as u,v as l}from"./index-CX5EOl4V.js";import{O as f}from"./productionCycleStatus-Bj7TtvNm.js";const o=`
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planted_quantity,
  planted_unit,
  planting_date,
  initial_harvest_forecast,
  current_harvest_forecast,
  final_harvest_date,
  status,
  notes,
  deleted_at,
  created_at,
  updated_at,
  property:properties (
    id,
    name,
    city,
    state,
    deleted_at
  ),
  area:areas (
    id,
    property_id,
    name,
    status,
    deleted_at,
    area_type:area_types (
      id,
      name
    )
  ),
  season:seasons (
    id,
    property_id,
    name,
    status,
    deleted_at
  ),
  crop:crops (
    id,
    name,
    category,
    average_cycle_days,
    is_system,
    active
  )
`;function s(){if(!y)throw new Error("O Supabase não foi inicializado.");return y}function w(e){var a,t,n;return{property_id:e.propertyId,area_id:e.areaId,season_id:e.seasonId||null,crop_id:e.cropId,variety:((a=e.variety)==null?void 0:a.trim())||null,planted_quantity:e.plantedQuantity===""||e.plantedQuantity===null||e.plantedQuantity===void 0?null:Number(e.plantedQuantity),planted_unit:((t=e.plantedUnit)==null?void 0:t.trim())||null,planting_date:e.plantingDate,initial_harvest_forecast:e.initialHarvestForecast||null,current_harvest_forecast:e.currentHarvestForecast||null,final_harvest_date:e.finalHarvestDate||null,status:e.status||"planted",notes:((n=e.notes)==null?void 0:n.trim())||null}}async function C({propertyId:e=null,areaId:a=null,seasonId:t=null,cropId:n=null,status:i=null,openOnly:c=!1,archived:d=!1,limit:_=null}={}){let r=s().from("production_cycles").select(o);d?r=r.not("deleted_at","is",null):r=r.is("deleted_at",null),e&&(r=r.eq("property_id",e)),a&&(r=r.eq("area_id",a)),t&&(r=r.eq("season_id",t)),n&&(r=r.eq("crop_id",n)),c&&!d?r=r.in("status",f):i&&!d&&(r=r.eq("status",i)),r=r.order("planting_date",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(_)&&_>0&&(r=r.limit(_));const{data:m,error:p}=await r;if(p)throw p;return m??[]}async function E(e){const a=s(),{data:t,error:n}=await a.from("production_cycles").select(o).eq("id",e).maybeSingle();if(n)throw n;return t}async function S(e){const a=s(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:i}=await a.from("production_cycles").insert({...w(e),user_id:t.id}).select(o).single();if(i)throw i;return l(),n}async function I(e,a){const t=s(),n=await u();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:i,error:c}=await t.from("production_cycles").update(w(a)).eq("id",e).eq("user_id",n.id).is("deleted_at",null).select(o).single();if(c)throw c;return l(),i}async function P(e){const a=s(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:i}=await a.from("production_cycles").update({deleted_at:new Date().toISOString()}).eq("id",e).eq("user_id",t.id).select(o).single();if(i)throw i;return l(),n}async function O(e){const a=s(),t=await u();if(!t)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:i}=await a.from("production_cycles").update({deleted_at:null}).eq("id",e).eq("user_id",t.id).select(o).single();if(i)throw i;return l(),n}async function b(e,a){if(!e||!a)return null;const t=s(),{data:n,error:i}=await t.rpc("suggest_harvest_date",{p_crop_id:e,p_planting_date:a});if(i)throw i;return n||null}async function g(e={}){let t=s().from("production_cycles").select("id",{count:"exact",head:!0}).is("deleted_at",null).in("status",f);e.propertyId&&(t=t.eq("property_id",e.propertyId)),e.areaId&&(t=t.eq("area_id",e.areaId)),e.seasonId&&(t=t.eq("season_id",e.seasonId)),e.cropId&&(t=t.eq("crop_id",e.cropId));const{count:n,error:i}=await t;if(i)throw i;return n??0}async function x(e){return g({cropId:e})}export{P as a,g as b,S as c,x as d,E as g,C as l,O as r,b as s,I as u};
