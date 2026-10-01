import{s as p}from"./index-CX5EOl4V.js";const h=[["all","Todos"],["positive","Positivo"],["negative","Negativo"],["break_even","Empate"],["no_activity","Sem movimento"]];function f(e){const a=Number((e==null?void 0:e.input_cost)||0),i=Number((e==null?void 0:e.sales_revenue)||0),t=Number((e==null?void 0:e.estimated_result)||0);return a===0&&i===0?"no_activity":t>0?"positive":t<0?"negative":"break_even"}function b(e){switch(e){case"positive":return"Resultado positivo";case"negative":return"Resultado negativo";case"break_even":return"Empate";default:return"Sem movimentação financeira"}}const v=`
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
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
`,d=`
  production_cycle_id,
  user_id,
  input_cost,
  sales_revenue,
  estimated_result,
  usage_transactions_count,
  harvests_count,
  sales_count,
  gross_margin_percent
`;function _(){if(!p)throw new Error("O Supabase não foi inicializado.");return p}function n(e){const a=Number(e);return Number.isFinite(a)?a:0}function c(e){const a={production_cycle_id:e.production_cycle_id,user_id:e.user_id,input_cost:n(e.input_cost),sales_revenue:n(e.sales_revenue),estimated_result:n(e.estimated_result),usage_transactions_count:n(e.usage_transactions_count),harvests_count:n(e.harvests_count),sales_count:n(e.sales_count),gross_margin_percent:e.gross_margin_percent===null||e.gross_margin_percent===void 0?null:n(e.gross_margin_percent)};return{...a,result_state:f(a)}}async function q(){const e=_(),{data:a,error:i}=await e.rpc("financial_overview");if(i)throw i;const t=Array.isArray(a)?a[0]:a;return{cycles_count:n(t==null?void 0:t.cycles_count),cycles_with_activity_count:n(t==null?void 0:t.cycles_with_activity_count),positive_result_count:n(t==null?void 0:t.positive_result_count),negative_result_count:n(t==null?void 0:t.negative_result_count),break_even_count:n(t==null?void 0:t.break_even_count),input_cost:n(t==null?void 0:t.input_cost),sales_revenue:n(t==null?void 0:t.sales_revenue),estimated_result:n(t==null?void 0:t.estimated_result)}}async function S(){const e=_(),[a,i]=await Promise.all([e.from("production_cycle_financial_summary").select(d),e.from("production_cycles").select(v).is("deleted_at",null).order("planting_date",{ascending:!1})]);if(a.error)throw a.error;if(i.error)throw i.error;const t=new Map((a.data??[]).map(r=>[r.production_cycle_id,c(r)]));return(i.data??[]).map(r=>{const o=t.get(r.id)||c({production_cycle_id:r.id,user_id:r.user_id,input_cost:0,sales_revenue:0,estimated_result:0,usage_transactions_count:0,harvests_count:0,sales_count:0,gross_margin_percent:null});return{...r,finance:o}})}async function R(e){const a=_(),{data:i,error:t}=await a.from("production_cycle_financial_summary").select(d).eq("production_cycle_id",e).maybeSingle();if(t)throw t;return i?c(i):null}async function F(e){const a=_(),[i,t,r,o,u]=await Promise.all([a.from("production_cycles").select(v).eq("id",e).maybeSingle(),a.from("production_cycle_financial_summary").select(d).eq("production_cycle_id",e).maybeSingle(),a.from("production_cycle_input_cost_summary").select(`
          production_cycle_id,
          agricultural_input_id,
          input_name,
          brand,
          unit,
          quantity_used,
          usage_count,
          total_cost
        `).eq("production_cycle_id",e).order("total_cost",{ascending:!1}),a.from("production_cycle_harvest_quantity_summary").select(`
          production_cycle_id,
          unit,
          harvested_quantity,
          sold_quantity,
          remaining_quantity,
          gross_revenue,
          harvests_count,
          sales_count
        `).eq("production_cycle_id",e).order("unit",{ascending:!0}),a.from("harvests").select(`
          id,
          production_cycle_id,
          harvest_date,
          quantity,
          unit,
          destination,
          sales:harvest_sales (
            id,
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
        `).eq("production_cycle_id",e).order("harvest_date",{ascending:!1})]);for(const s of[i,t,r,o,u])if(s.error)throw s.error;if(!i.data)return null;const g=t.data?c(t.data):c({production_cycle_id:e,user_id:i.data.user_id,input_cost:0,sales_revenue:0,estimated_result:0,usage_transactions_count:0,harvests_count:0,sales_count:0,gross_margin_percent:null}),y=(u.data??[]).flatMap(s=>(s.sales??[]).map(l=>({...l,harvest:{...s,production_cycle:i.data}}))).sort((s,l)=>String(l.sale_date).localeCompare(String(s.sale_date)));return{cycle:i.data,summary:g,inputCosts:(r.data??[]).map(s=>({...s,quantity_used:n(s.quantity_used),usage_count:n(s.usage_count),total_cost:n(s.total_cost)})),production:(o.data??[]).map(s=>({...s,harvested_quantity:n(s.harvested_quantity),sold_quantity:n(s.sold_quantity),remaining_quantity:n(s.remaining_quantity),gross_revenue:n(s.gross_revenue),harvests_count:n(s.harvests_count),sales_count:n(s.sales_count)})),harvests:u.data??[],sales:y}}export{h as F,b as a,q as b,F as c,R as g,S as l};
