import{s as p,j as f,v as g}from"./index-CFRkglUh.js";import{h as w}from"./harvestDestinations-iItd34T-.js";const c=`
  id,
  user_id,
  production_cycle_id,
  production_event_id,
  harvest_date,
  quantity,
  unit,
  quality_classification,
  destination,
  notes,
  created_at,
  updated_at,
  production_cycle:production_cycles (
    id,
    user_id,
    property_id,
    area_id,
    season_id,
    crop_id,
    variety,
    planting_date,
    current_harvest_forecast,
    final_harvest_date,
    status,
    deleted_at,
    crop:crops (
      id,
      name,
      category
    ),
    area:areas (
      id,
      name,
      area_type:area_types (
        id,
        name
      )
    ),
    property:properties (
      id,
      name
    ),
    season:seasons (
      id,
      name
    )
  ),
  sales:harvest_sales (
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
    updated_at
  )
`,h=`
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  current_harvest_forecast,
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
  ),
  season:seasons (
    id,
    name
  )
`,S=["planted","developing","near_harvest","ready_to_harvest"];function o(){if(!p)throw new Error("O Supabase não foi inicializado.");return p}function y(e){var t,a,r;return{harvest_date:e.harvestDate,quantity:Number(e.quantity),unit:((t=e.unit)==null?void 0:t.trim())||"",quality_classification:((a=e.qualityClassification)==null?void 0:a.trim())||null,destination:e.destination,notes:((r=e.notes)==null?void 0:r.trim())||null}}function q(e){if(!e||!/^\d{4}-\d{2}$/.test(e))return null;const[t,a]=e.split("-").map(Number),r=`${t}-${String(a).padStart(2,"0")}-01`,s=new Date(t,a,1,12,0,0,0),i=[s.getFullYear(),String(s.getMonth()+1).padStart(2,"0"),"01"].join("-");return{start:r,end:i}}function H(e){const t=(e==null?void 0:e.sales)??[],a=t.reduce((i,n)=>i+Number(n.quantity||0),0),r=t.reduce((i,n)=>i+Number(n.total_value||0),0),s=Number((e==null?void 0:e.quantity)||0);return{salesCount:t.length,soldQuantity:a,grossRevenue:r,remainingQuantity:Math.max(0,s-a),allowsSales:w(e==null?void 0:e.destination)}}async function N({cycleId:e=null,propertyId:t=null,destination:a=null,month:r=null,limit:s=null}={}){let n=o().from("harvests").select(c).order("harvest_date",{ascending:!1}).order("created_at",{ascending:!1});e&&(n=n.eq("production_cycle_id",e)),a&&(n=n.eq("destination",a));const u=q(r);u&&(n=n.gte("harvest_date",u.start).lt("harvest_date",u.end)),Number.isInteger(s)&&s>0&&(n=n.limit(s));const{data:m,error:d}=await n;if(d)throw d;const l=m??[];return t?l.filter(v=>{var _;return((_=v.production_cycle)==null?void 0:_.property_id)===t}):l}async function A(e){const t=o(),{data:a,error:r}=await t.from("harvests").select(c).eq("id",e).maybeSingle();if(r)throw r;return a}async function C(){const e=o(),{data:t,error:a}=await e.from("production_cycles").select(h).is("deleted_at",null).in("status",S).order("current_harvest_forecast",{ascending:!0,nullsFirst:!1}).order("planting_date",{ascending:!1});if(a)throw a;return t??[]}async function x(e,t){const a=o(),r=await f();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:i}=await a.from("harvests").insert({...y(t),user_id:r.id,production_cycle_id:e}).select(c).single();if(i)throw i;return s}async function F(e,t){const a=o(),r=await f();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:i}=await a.from("harvests").update(y(t)).eq("id",e).eq("user_id",r.id).select(c).single();if(i)throw i;return s}async function L(e){const t=o(),{data:a,error:r}=await t.rpc("finalize_cycle_from_harvest",{p_harvest_id:e});if(r)throw r;return g(),a}export{A as a,C as b,x as c,L as f,H as g,N as l,F as u};
