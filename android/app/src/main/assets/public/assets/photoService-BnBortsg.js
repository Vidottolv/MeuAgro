import{n as g,i as u,j as d,s as _,p as l,q as w}from"./index-D4QhsyJX.js";const c="meu-agro-photos",b=async e=>!!await l(e),f=8*1024*1024,h=new Set(["image/jpeg","image/png","image/webp"]);function s(){if(!_)throw new Error("O Supabase não foi inicializado.");return _}function v(e){var n;const o=((e==null?void 0:e.name)||"").match(/\.([a-zA-Z0-9]+)$/),r=(n=o==null?void 0:o[1])==null?void 0:n.toLowerCase();return r&&["jpg","jpeg","png","webp"].includes(r)?r==="jpeg"?"jpg":r:(e==null?void 0:e.type)==="image/png"?"png":(e==null?void 0:e.type)==="image/webp"?"webp":"jpg"}function y(){var e;return(e=globalThis.crypto)!=null&&e.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}function E(e){return e?e.size>f?"A imagem deve possuir no máximo 8 MB.":e.type&&!h.has(e.type)||!e.type&&!/\.(jpe?g|png|webp)$/i.test(e.name||"")?"Use uma imagem JPG, PNG ou WebP.":null:"Selecione uma imagem."}async function x({file:e,cycle:t}){const o=E(e);if(o)throw new Error(o);const r=s(),n=await d();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");if(!(t!=null&&t.id)||!(t!=null&&t.property_id))throw new Error("Ciclo produtivo inválido.");const a=[n.id,t.property_id,t.id,`${Date.now()}-${y()}.${v(e)}`].join("/"),{error:i}=await r.storage.from(c).upload(a,e,{cacheControl:"3600",upsert:!1,contentType:e.type||void 0});if(i)throw i;return a}async function P(e){if(!e)return;const t=s(),{error:o}=await t.storage.from(c).remove([e]);if(o)throw o}async function j({cycle:e,eventId:t=null,storagePath:o,description:r,capturedAt:n}){const a=s(),i=await d();if(!i)throw new Error("Sua sessão expirou. Entre novamente.");const{data:m,error:p}=await a.from("event_photos").insert({user_id:i.id,property_id:e.property_id,area_id:e.area_id,production_cycle_id:e.id,production_event_id:t||null,storage_path:o,description:(r==null?void 0:r.trim())||null,captured_at:n||new Date().toISOString()}).select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `).single();if(p)throw p;return m}async function C(e){const t=s(),{data:o,error:r}=await t.from("event_photos").select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `).eq("production_cycle_id",e).order("captured_at",{ascending:!0});if(r)throw r;const n=await g.merge("event_photos",o??[],a=>a.production_cycle_id===e,u());return S(n.sort((a,i)=>a.captured_at.localeCompare(i.captured_at)))}async function S(e,t=3600){const o=s();return Promise.all((e??[]).map(async r=>{const n=await l(r);if(n)return{...r,signed_url:n};if(!u())return{...r,signed_url:null};if(!(r!=null&&r.storage_path))return{...r,signed_url:null};const{data:a,error:i}=await o.storage.from(c).createSignedUrl(r.storage_path,t);if(i)return console.warn("Não foi possível assinar a URL da foto:",i),{...r,signed_url:null};if(a!=null&&a.signedUrl)try{await w(r,a.signedUrl)}catch{}return{...r,signed_url:(a==null?void 0:a.signedUrl)||null}}))}async function A(e){if(!u())throw Error("A exclusão de fotos precisa de conexão.");if((await g.localRows("event_photos")).some(n=>n.id===e.id))throw Error("Sincronize e atualize a galeria antes de excluir esta foto.");const t=s(),o=await d();if(!o)throw new Error("Sua sessão expirou. Entre novamente.");const{error:r}=await t.from("event_photos").delete().eq("id",e.id).eq("user_id",o.id);if(r)throw r;try{await P(e.storage_path)}catch(n){console.warn("O registro da foto foi removido, mas o arquivo não pôde ser apagado do Storage:",n)}}export{j as createPhotoRecord,A as deletePhoto,C as listCyclePhotos,b as offlinePhotoAvailable,P as removePhotoFile,S as signPhotos,x as uploadCyclePhotoFile,E as validatePhotoFile};
