import{u as k}from"./useResource-Blqq0oyR.js";import{s as C,h as $,o as d,a as p,b as o,t as c,x as w,w as S,u as s,e as N,F as R,r as A,a2 as B,d as q}from"./index-CX5EOl4V.js";import{g as P}from"./productionEventTypes-BrQRduqh.js";import{_ as D}from"./RequestState.vue_vue_type_script_setup_true_lang-CrWf3PZS.js";import{d as E}from"./seasonModel-ewtYpB80.js";import{a as x}from"./harvestModel-DjR4y7c0.js";import"./dataErrorService-DIHtA1FH.js";import"./seasonStatus-7PQsp_kK.js";import"./harvestDestinations-iItd34T-.js";import"./productionModel-N69rzoPM.js";function f(){if(!C)throw new Error("O Supabase não foi inicializado.");return C}function V(r){return[r.getFullYear(),String(r.getMonth()+1).padStart(2,"0"),String(r.getDate()).padStart(2,"0")].join("-")}function I(){const r=new Date;r.setHours(12,0,0,0);const n=new Date(r);return n.setDate(n.getDate()+7),{start:V(r),end:V(n)}}function y(r){const n=Number(r);return Number.isFinite(n)?n:0}async function L(){const r=f(),{data:n,error:u}=await r.rpc("dashboard_summary");if(u)throw u;const e=Array.isArray(n)?n[0]:n;return{properties_count:y(e==null?void 0:e.properties_count),active_areas_count:y(e==null?void 0:e.active_areas_count),active_cycles_count:y(e==null?void 0:e.active_cycles_count),near_harvest_count:y(e==null?void 0:e.near_harvest_count),low_stock_count:y(e==null?void 0:e.low_stock_count),month_harvests_count:y(e==null?void 0:e.month_harvests_count)}}async function F(r=4){const n=f(),{start:u,end:e}=I(),{data:t,error:l}=await n.from("production_cycles").select(`
        id,
        planting_date,
        current_harvest_forecast,
        status,
        variety,
        crop:crops (
          id,
          name,
          average_cycle_days
        ),
        area:areas (
          id,
          name
        ),
        property:properties (
          id,
          name
        )
      `).is("deleted_at",null).not("status","in","(closed,cancelled,harvested)").gte("current_harvest_forecast",u).lte("current_harvest_forecast",e).order("current_harvest_forecast",{ascending:!0}).limit(r);if(l)throw l;return t??[]}async function M(r=4){const n=f(),{data:u,error:e}=await n.from("inventory_balances").select(`
        agricultural_input_id,
        name,
        brand,
        base_unit,
        minimum_stock,
        current_quantity,
        stock_status,
        active
      `).eq("active",!0).in("stock_status",["low_stock","out_of_stock"]).order("current_quantity",{ascending:!0}).limit(r);if(e)throw e;return u??[]}async function j(r){const n=f(),{data:u,error:e}=await n.from("production_events").select(`
        id,
        event_type,
        title,
        description,
        occurred_at,
        production_cycle:production_cycles (
          id,
          crop:crops (
            id,
            name
          ),
          area:areas (
            id,
            name
          )
        )
      `).order("occurred_at",{ascending:!1}).limit(r);if(e)throw e;return(u??[]).map(t=>{var l,_,v,m,i;return{id:`event-${t.id}`,occurredAt:t.occurred_at,type:t.event_type||"event",iconName:P(t.event_type),title:t.title||"Atividade registrada",detail:[(_=(l=t.production_cycle)==null?void 0:l.crop)==null?void 0:_.name,(m=(v=t.production_cycle)==null?void 0:v.area)==null?void 0:m.name].filter(Boolean).join(" • "),href:(i=t.production_cycle)!=null&&i.id?`/plantings/${t.production_cycle.id}#timeline`:"/plantings"}})}async function H(r){const n=f(),{data:u,error:e}=await n.from("harvest_sales").select(`
        id,
        buyer,
        total_value,
        sale_date,
        created_at,
        harvest:harvests (
          id,
          production_cycle:production_cycles (
            id,
            crop:crops (
              id,
              name
            ),
            area:areas (
              id,
              name
            )
          )
        )
      `).order("created_at",{ascending:!1}).limit(r);if(e)throw e;return(u??[]).map(t=>{var l,_,v,m,i,a;return{id:`sale-${t.id}`,occurredAt:t.created_at,type:"sale",iconName:"cart",title:(v=(_=(l=t.harvest)==null?void 0:l.production_cycle)==null?void 0:_.crop)!=null&&v.name?`Venda de ${t.harvest.production_cycle.crop.name}`:"Venda registrada",detail:[t.buyer,(a=(i=(m=t.harvest)==null?void 0:m.production_cycle)==null?void 0:i.area)==null?void 0:a.name].filter(Boolean).join(" • "),href:`/more/sales/${t.id}`}})}async function O(r=6){const n=Math.max(4,r),u=await Promise.allSettled([j(n),H(n)]),e=[];for(const t of u)t.status==="fulfilled"?e.push(...t.value):console.warn("Uma fonte de atividades recentes não pôde ser carregada:",t.reason);return e.filter(t=>t.occurredAt).sort((t,l)=>new Date(l.occurredAt).getTime()-new Date(t.occurredAt).getTime()).slice(0,r)}const U={class:"rural-vue"},z={key:0,class:"rural-panel"},T={class:"rural-grid"},W=["href"],Y={class:"rural-panel"},G={key:0},J=["href"],K={class:"rural-panel"},Q={key:0},X=["href"],Z={class:"rural-panel"},ee={key:0},te=["href"],pe=$({__name:"DashboardPage",props:{session:{}},setup(r){const n=r,u=q(()=>{var m,i,a;return((i=(m=n.session.user.user_metadata)==null?void 0:m.full_name)==null?void 0:i.trim().split(/\s+/)[0])||((a=n.session.user.email)==null?void 0:a.split("@")[0])||"produtor"}),e=k(L,null),t=k(async()=>await F(),[]),l=k(()=>M(),[]),_=k(()=>O(),[]),v=q(()=>e.data.value?[["Propriedades",e.data.value.properties_count,"/properties"],["Áreas ativas",e.data.value.active_areas_count,"/properties"],["Plantios ativos",e.data.value.active_cycles_count,"/plantings"],["Próximos da colheita",e.data.value.near_harvest_count,"/more/harvest-forecast"],["Insumos com estoque baixo",e.data.value.low_stock_count,"/inventory"],["Colheitas no mês",e.data.value.month_harvests_count,"/more/harvests"]]:[]);return(m,i)=>(d(),p("div",U,[o("h2",null,"Olá, "+c(u.value),1),w(D,{loading:s(e).loading.value,error:s(e).error.value,onRetry:s(e).reload},{default:S(()=>{var a;return[((a=s(e).data.value)==null?void 0:a.properties_count)===0?(d(),p("section",z,[...i[0]||(i[0]=[o("h3",null,"Cadastre sua primeira propriedade",-1),o("p",null,"Organize suas áreas e acompanhe a produção.",-1),o("a",{href:"/properties/new","data-link":"",class:"button button--primary"},"Cadastrar propriedade",-1)])])):N("",!0),o("div",T,[(d(!0),p(R,null,A(v.value,([h,g,b])=>(d(),p("article",{key:String(h),class:"rural-card"},[o("h3",null,c(h),1),o("strong",null,c(g),1),o("a",{href:String(b),"data-link":"",class:"button button--secondary"},"Ver "+c(String(h).toLowerCase()),9,W)]))),128))])]}),_:1},8,["loading","error","onRetry"]),i[4]||(i[4]=B('<section class="rural-panel"><h3>Acesso rápido</h3><div class="rural-actions"><a href="/plantings/new" data-link class="button button--primary">Novo plantio</a><a href="/more/harvests/new" data-link class="button button--secondary">Nova colheita</a><a href="/inventory/new" data-link class="button button--secondary">Novo insumo</a><a href="/compras" data-link class="button button--secondary">Minhas compras</a></div></section>',1)),o("section",Y,[i[1]||(i[1]=o("h3",null,"Colheitas nos próximos 7 dias",-1)),w(D,{loading:s(t).loading.value,error:s(t).error.value,onRetry:s(t).reload},{default:S(()=>[s(t).data.value.length?N("",!0):(d(),p("p",G,"Nenhum plantio previsto para os próximos 7 dias.")),(d(!0),p(R,null,A(s(t).data.value,a=>{var h,g,b;return d(),p("article",{key:a.id,class:"rural-card"},[o("h4",null,c((h=a.crop)==null?void 0:h.name)+" "+c(a.variety),1),o("p",null,c((g=a.property)==null?void 0:g.name)+" • "+c((b=a.area)==null?void 0:b.name)+" • "+c(s(E)(a.current_harvest_forecast)),1),o("a",{href:`/plantings/${encodeURIComponent(a.id)}`,"data-link":"",class:"button button--secondary"},"Ver plantio",8,J)])}),128))]),_:1},8,["loading","error","onRetry"])]),o("section",K,[i[2]||(i[2]=o("h3",null,"Estoque que merece atenção",-1)),w(D,{loading:s(l).loading.value,error:s(l).error.value,onRetry:s(l).reload},{default:S(()=>[s(l).data.value.length?N("",!0):(d(),p("p",Q,"Nenhum insumo com estoque baixo.")),(d(!0),p(R,null,A(s(l).data.value,a=>(d(),p("article",{key:a.agricultural_input_id,class:"rural-card"},[o("h4",null,c(a.name)+" "+c(a.brand),1),o("p",null,c(s(x)(a.current_quantity))+" "+c(a.base_unit)+" • Mínimo: "+c(s(x)(a.minimum_stock)),1),o("a",{href:`/inventory/${encodeURIComponent(a.agricultural_input_id)}`,"data-link":"",class:"button button--secondary"},"Ver estoque",8,X)]))),128))]),_:1},8,["loading","error","onRetry"])]),o("section",Z,[i[3]||(i[3]=o("h3",null,"Atividades recentes",-1)),w(D,{loading:s(_).loading.value,error:s(_).error.value,onRetry:s(_).reload},{default:S(()=>[s(_).data.value.length?N("",!0):(d(),p("p",ee,"Nenhuma atividade registrada.")),(d(!0),p(R,null,A(s(_).data.value,a=>(d(),p("article",{key:a.id,class:"rural-card"},[o("h4",null,c(a.title),1),o("p",null,c(a.detail),1),o("p",null,c(new Date(a.occurredAt).toLocaleString("pt-BR")),1),o("a",{href:a.href,"data-link":"",class:"button button--secondary"},"Ver registro",8,te)]))),128))]),_:1},8,["loading","error","onRetry"])])]))}});export{pe as default};
