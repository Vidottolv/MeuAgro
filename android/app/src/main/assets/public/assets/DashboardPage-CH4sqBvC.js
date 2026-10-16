import{u as B}from"./mountShell-6K3ZAk1w.js";import{u as S}from"./useResource-CXpiD_Vk.js";import{s as V,h as P,U as E,o as d,a as p,b as a,t as l,u as s,F as g,C as N,w as A,e as R,r as C,V as I,d as q}from"./index-CFRkglUh.js";import{g as L}from"./productionEventTypes-BrQRduqh.js";import{_ as D}from"./RequestState.vue_vue_type_script_setup_true_lang-BB6pLsUv.js";import{d as F}from"./seasonModel-ewtYpB80.js";import{a as x}from"./harvestModel-DjR4y7c0.js";import"./_plugin-vue_export-helper-DlAUqK2U.js";import"./dataErrorService-DIHtA1FH.js";import"./seasonStatus-7PQsp_kK.js";import"./harvestDestinations-iItd34T-.js";import"./productionModel-N69rzoPM.js";function b(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function $(o){return[o.getFullYear(),String(o.getMonth()+1).padStart(2,"0"),String(o.getDate()).padStart(2,"0")].join("-")}function M(){const o=new Date;o.setHours(12,0,0,0);const n=new Date(o);return n.setDate(n.getDate()+7),{start:$(o),end:$(n)}}function y(o){const n=Number(o);return Number.isFinite(n)?n:0}async function O(){const o=b(),{data:n,error:u}=await o.rpc("dashboard_summary");if(u)throw u;const e=Array.isArray(n)?n[0]:n;return{properties_count:y(e==null?void 0:e.properties_count),active_areas_count:y(e==null?void 0:e.active_areas_count),active_cycles_count:y(e==null?void 0:e.active_cycles_count),near_harvest_count:y(e==null?void 0:e.near_harvest_count),low_stock_count:y(e==null?void 0:e.low_stock_count),month_harvests_count:y(e==null?void 0:e.month_harvests_count)}}async function U(o=4){const n=b(),{start:u,end:e}=M(),{data:t,error:c}=await n.from("production_cycles").select(`
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
      `).is("deleted_at",null).not("status","in","(closed,cancelled,harvested)").gte("current_harvest_forecast",u).lte("current_harvest_forecast",e).order("current_harvest_forecast",{ascending:!0}).limit(o);if(c)throw c;return t??[]}async function j(o=4){const n=b(),{data:u,error:e}=await n.from("inventory_balances").select(`
        agricultural_input_id,
        name,
        brand,
        base_unit,
        minimum_stock,
        current_quantity,
        stock_status,
        active
      `).eq("active",!0).in("stock_status",["low_stock","out_of_stock"]).order("current_quantity",{ascending:!0}).limit(o);if(e)throw e;return u??[]}async function z(o){const n=b(),{data:u,error:e}=await n.from("production_events").select(`
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
      `).order("occurred_at",{ascending:!1}).limit(o);if(e)throw e;return(u??[]).map(t=>{var c,_,m,h,v;return{id:`event-${t.id}`,occurredAt:t.occurred_at,type:t.event_type||"event",iconName:L(t.event_type),title:t.title||"Atividade registrada",detail:[(_=(c=t.production_cycle)==null?void 0:c.crop)==null?void 0:_.name,(h=(m=t.production_cycle)==null?void 0:m.area)==null?void 0:h.name].filter(Boolean).join(" • "),href:(v=t.production_cycle)!=null&&v.id?`/plantings/${t.production_cycle.id}#timeline`:"/plantings"}})}async function H(o){const n=b(),{data:u,error:e}=await n.from("harvest_sales").select(`
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
      `).order("created_at",{ascending:!1}).limit(o);if(e)throw e;return(u??[]).map(t=>{var c,_,m,h,v,i;return{id:`sale-${t.id}`,occurredAt:t.created_at,type:"sale",iconName:"cart",title:(m=(_=(c=t.harvest)==null?void 0:c.production_cycle)==null?void 0:_.crop)!=null&&m.name?`Venda de ${t.harvest.production_cycle.crop.name}`:"Venda registrada",detail:[t.buyer,(i=(v=(h=t.harvest)==null?void 0:h.production_cycle)==null?void 0:v.area)==null?void 0:i.name].filter(Boolean).join(" • "),href:`/more/sales/${t.id}`}})}async function T(o=6){const n=Math.max(4,o),u=await Promise.allSettled([z(n),H(n)]),e=[];for(const t of u)t.status==="fulfilled"?e.push(...t.value):console.warn("Uma fonte de atividades recentes não pôde ser carregada:",t.reason);return e.filter(t=>t.occurredAt).sort((t,c)=>new Date(c.occurredAt).getTime()-new Date(t.occurredAt).getTime()).slice(0,o)}const W={class:"rural-vue"},Y={key:0,class:"rural-panel"},G={key:0,class:"rural-panel"},J={class:"rural-grid"},K=["href"],Q={class:"rural-panel"},X={key:0},Z=["href"],tt={class:"rural-panel"},et={key:0},at=["href"],rt={class:"rural-panel"},ot={key:0},nt=["href"],yt=P({__name:"DashboardPage",props:{session:{}},setup(o){const{status:n}=B(),u=o,e=q(()=>{var v,i,r;return((i=(v=u.session.user.user_metadata)==null?void 0:v.full_name)==null?void 0:i.trim().split(/\s+/)[0])||((r=u.session.user.email)==null?void 0:r.split("@")[0])||"produtor"}),t=S(O,null),c=S(async()=>await U(),[]),_=S(()=>j(),[]),m=S(()=>T(),[]),h=q(()=>t.data.value?[["Propriedades",t.data.value.properties_count,"/properties"],["Áreas ativas",t.data.value.active_areas_count,"/properties"],["Plantios ativos",t.data.value.active_cycles_count,"/plantings"],["Próximos da colheita",t.data.value.near_harvest_count,"/more/harvest-forecast"],["Insumos com estoque baixo",t.data.value.low_stock_count,"/inventory"],["Colheitas no mês",t.data.value.month_harvests_count,"/more/harvests"]]:[]);return E(()=>n.value.online,v=>{v&&(t.reload(),c.reload(),_.reload(),m.reload())}),(v,i)=>(d(),p("div",W,[a("h2",null,"Olá, "+l(e.value),1),s(n).online?(d(),p(g,{key:1},[N(D,{loading:s(t).loading.value,error:s(t).error.value,onRetry:s(t).reload},{default:A(()=>{var r;return[((r=s(t).data.value)==null?void 0:r.properties_count)===0?(d(),p("section",G,[...i[1]||(i[1]=[a("h3",null,"Cadastre sua primeira propriedade",-1),a("p",null,"Organize suas áreas e acompanhe a produção.",-1),a("a",{href:"/properties/new","data-link":"",class:"button button--primary"},"Cadastrar propriedade",-1)])])):R("",!0),a("div",J,[(d(!0),p(g,null,C(h.value,([f,k,w])=>(d(),p("article",{key:String(f),class:"rural-card"},[a("h3",null,l(f),1),a("strong",null,l(k),1),a("a",{href:String(w),"data-link":"",class:"button button--secondary"},"Ver "+l(String(f).toLowerCase()),9,K)]))),128))])]}),_:1},8,["loading","error","onRetry"]),i[5]||(i[5]=I('<section class="rural-panel"><h3>Acesso rápido</h3><div class="rural-actions"><a href="/plantings/new" data-link class="button button--primary">Novo plantio</a><a href="/more/harvests/new" data-link class="button button--secondary">Nova colheita</a><a href="/inventory/new" data-link class="button button--secondary">Novo insumo</a><a href="/compras" data-link class="button button--secondary">Minhas compras</a></div></section>',1)),a("section",Q,[i[2]||(i[2]=a("h3",null,"Colheitas nos próximos 7 dias",-1)),N(D,{loading:s(c).loading.value,error:s(c).error.value,onRetry:s(c).reload},{default:A(()=>[s(c).data.value.length?R("",!0):(d(),p("p",X,"Nenhum plantio previsto para os próximos 7 dias.")),(d(!0),p(g,null,C(s(c).data.value,r=>{var f,k,w;return d(),p("article",{key:r.id,class:"rural-card"},[a("h4",null,l((f=r.crop)==null?void 0:f.name)+" "+l(r.variety),1),a("p",null,l((k=r.property)==null?void 0:k.name)+" • "+l((w=r.area)==null?void 0:w.name)+" • "+l(s(F)(r.current_harvest_forecast)),1),a("a",{href:`/plantings/${encodeURIComponent(r.id)}`,"data-link":"",class:"button button--secondary"},"Ver plantio",8,Z)])}),128))]),_:1},8,["loading","error","onRetry"])]),a("section",tt,[i[3]||(i[3]=a("h3",null,"Estoque que merece atenção",-1)),N(D,{loading:s(_).loading.value,error:s(_).error.value,onRetry:s(_).reload},{default:A(()=>[s(_).data.value.length?R("",!0):(d(),p("p",et,"Nenhum insumo com estoque baixo.")),(d(!0),p(g,null,C(s(_).data.value,r=>(d(),p("article",{key:r.agricultural_input_id,class:"rural-card"},[a("h4",null,l(r.name)+" "+l(r.brand),1),a("p",null,l(s(x)(r.current_quantity))+" "+l(r.base_unit)+" • Mínimo: "+l(s(x)(r.minimum_stock)),1),a("a",{href:`/inventory/${encodeURIComponent(r.agricultural_input_id)}`,"data-link":"",class:"button button--secondary"},"Ver estoque",8,at)]))),128))]),_:1},8,["loading","error","onRetry"])]),a("section",rt,[i[4]||(i[4]=a("h3",null,"Atividades recentes",-1)),N(D,{loading:s(m).loading.value,error:s(m).error.value,onRetry:s(m).reload},{default:A(()=>[s(m).data.value.length?R("",!0):(d(),p("p",ot,"Nenhuma atividade registrada.")),(d(!0),p(g,null,C(s(m).data.value,r=>(d(),p("article",{key:r.id,class:"rural-card"},[a("h4",null,l(r.title),1),a("p",null,l(r.detail),1),a("p",null,l(new Date(r.occurredAt).toLocaleString("pt-BR")),1),a("a",{href:r.href,"data-link":"",class:"button button--secondary"},"Ver registro",8,nt)]))),128))]),_:1},8,["loading","error","onRetry"])])],64)):(d(),p("section",Y,[...i[0]||(i[0]=[a("h3",null,"Seu trabalho no campo",-1),a("p",null,"Abra um plantio preparado para registrar eventos e fotos sem internet.",-1),a("div",{class:"rural-actions"},[a("a",{href:"/plantings","data-link":"",class:"button button--primary"},"Abrir plantios"),a("a",{href:"/properties","data-link":"",class:"button button--secondary"},"Consultar propriedades"),a("a",{href:"/more/settings#offline","data-link":"",class:"button button--secondary"},"Ver sincronização")],-1)])]))]))}});export{yt as default};
