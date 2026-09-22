(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function a(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(n){if(n.ep)return;n.ep=!0;const s=a(n);fetch(n.href,s)}})();const yl=Symbol.for("@supabase/supabase-js.traceContextExtractor");function _l(){return globalThis[yl]}function Pr(t,e){var a={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.indexOf(r)<0&&(a[r]=t[r]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var n=0,r=Object.getOwnPropertySymbols(t);n<r.length;n++)e.indexOf(r[n])<0&&Object.prototype.propertyIsEnumerable.call(t,r[n])&&(a[r[n]]=t[r[n]]);return a}function bl(t,e,a,r){function n(s){return s instanceof a?s:new a(function(i){i(s)})}return new(a||(a=Promise))(function(s,i){function o(d){try{l(r.next(d))}catch(u){i(u)}}function c(d){try{l(r.throw(d))}catch(u){i(u)}}function l(d){d.done?s(d.value):n(d.value).then(o,c)}l((r=r.apply(t,e||[])).next())})}const wl=t=>t?(...e)=>t(...e):(...e)=>fetch(...e);class Mn extends Error{constructor(e,a="FunctionsError",r){super(e),this.name=a,this.context=r}toJSON(){return{name:this.name,message:this.message,context:this.context}}}class $l extends Mn{constructor(e){super("Failed to send a request to the Edge Function","FunctionsFetchError",e)}}class ps extends Mn{constructor(e){super("Relay Error invoking the Edge Function","FunctionsRelayError",e)}}class hs extends Mn{constructor(e){super("Edge Function returned a non-2xx status code","FunctionsHttpError",e)}}var yn;(function(t){t.Any="any",t.ApNortheast1="ap-northeast-1",t.ApNortheast2="ap-northeast-2",t.ApSouth1="ap-south-1",t.ApSoutheast1="ap-southeast-1",t.ApSoutheast2="ap-southeast-2",t.CaCentral1="ca-central-1",t.EuCentral1="eu-central-1",t.EuWest1="eu-west-1",t.EuWest2="eu-west-2",t.EuWest3="eu-west-3",t.SaEast1="sa-east-1",t.UsEast1="us-east-1",t.UsWest1="us-west-1",t.UsWest2="us-west-2"})(yn||(yn={}));class Sl{constructor(e,{headers:a={},customFetch:r,region:n=yn.Any}={}){this.url=e,this.headers=a,this.region=n,this.fetch=wl(r)}setAuth(e){this.headers.Authorization=`Bearer ${e}`}invoke(e){return bl(this,arguments,void 0,function*(a,r={}){var n,s;let i,o,c;try{const{headers:l,method:d,body:u,signal:p,timeout:m}=r;let f={},{region:v}=r;v||(v=this.region);const _=new URL(`${this.url}/${a}`);v&&v!=="any"&&(f["x-region"]=v,_.searchParams.set("forceFunctionRegion",v));let w;const k=!!l&&Object.keys(l).some(E=>E.toLowerCase()==="content-type");u&&!k?typeof Blob<"u"&&u instanceof Blob||u instanceof ArrayBuffer?(f["Content-Type"]="application/octet-stream",w=u):typeof u=="string"?(f["Content-Type"]="text/plain",w=u):typeof FormData<"u"&&u instanceof FormData?w=u:(f["Content-Type"]="application/json",w=JSON.stringify(u)):u&&typeof u!="string"&&!(typeof Blob<"u"&&u instanceof Blob)&&!(u instanceof ArrayBuffer)&&!(typeof FormData<"u"&&u instanceof FormData)?w=JSON.stringify(u):w=u;let S=p;m&&(o=new AbortController,i=setTimeout(()=>o.abort(),m),p?(S=o.signal,c=()=>o.abort(),p.addEventListener("abort",c)):S=o.signal);const T=yield this.fetch(_.toString(),{method:d||"POST",headers:Object.assign(Object.assign(Object.assign({},f),this.headers),l),body:w,signal:S}).catch(E=>{throw new $l(E)}),A=T.headers.get("x-relay-error");if(A&&A==="true")throw new ps(T);if(!T.ok)throw new hs(T);let C=((n=T.headers.get("Content-Type"))!==null&&n!==void 0?n:"text/plain").split(";")[0].trim().toLowerCase(),I;return C==="application/json"?I=yield T.json():C==="application/octet-stream"||C==="application/pdf"?I=yield T.blob():C==="text/event-stream"?I=T:C==="multipart/form-data"?I=yield T.formData():I=yield T.text(),{data:I,error:null,response:T}}catch(l){return{data:null,error:l,response:l instanceof hs||l instanceof ps?l.context:void 0}}finally{i&&clearTimeout(i),c&&((s=r.signal)===null||s===void 0||s.removeEventListener("abort",c))}})}}var Ht=class extends Error{constructor(t){super(t.message),this.name="PostgrestError",this.details=t.details,this.hint=t.hint,this.code=t.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};const Wi=3,ms=t=>Math.min(1e3*2**t,3e4),El=[520,503],Gi=["GET","HEAD","OPTIONS"];function wa(t){"@babel/helpers - typeof";return wa=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},wa(t)}function kl(t,e){if(wa(t)!="object"||!t)return t;var a=t[Symbol.toPrimitive];if(a!==void 0){var r=a.call(t,e);if(wa(r)!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Al(t){var e=kl(t,"string");return wa(e)=="symbol"?e:e+""}function Cl(t,e,a){return(e=Al(e))in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function fs(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(n){return Object.getOwnPropertyDescriptor(t,n).enumerable})),a.push.apply(a,r)}return a}function ft(t){for(var e=1;e<arguments.length;e++){var a=arguments[e]!=null?arguments[e]:{};e%2?fs(Object(a),!0).forEach(function(r){Cl(t,r,a[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):fs(Object(a)).forEach(function(r){Object.defineProperty(t,r,Object.getOwnPropertyDescriptor(a,r))})}return t}function vs(t,e){return new Promise(a=>{if(e!=null&&e.aborted){a();return}const r=setTimeout(()=>{e==null||e.removeEventListener("abort",n),a()},t);function n(){clearTimeout(r),a()}e==null||e.addEventListener("abort",n)})}function Tl(t,e,a,r){return!(!r||a>=Wi||!Gi.includes(t)||!El.includes(e))}async function Ki(t,e,a,r){let n=0;for(;;){const o=ft({},a.headers);n>0&&(o["X-Retry-Count"]=String(n));let c;try{c=await t(e,{method:a.method,headers:o,body:a.body,signal:a.signal})}catch(l){if((l==null?void 0:l.name)==="AbortError"||(l==null?void 0:l.code)==="ABORT_ERR"||!Gi.includes(a.method))throw l;if(r&&n<Wi){const d=ms(n);n++,await vs(d,a.signal);continue}throw l}if(Tl(a.method,c.status,n,r)){var s,i;const l=(s=(i=c.headers)===null||i===void 0?void 0:i.get("Retry-After"))!==null&&s!==void 0?s:null,d=l!==null?Math.max(0,parseInt(l,10)||0)*1e3:ms(n);await c.text(),n++,await vs(d,a.signal);continue}return c}}var Ll=class{constructor(t){var e,a,r,n,s;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=t.method,this.url=t.url,this.headers=new Headers(t.headers),this.schema=t.schema,this.body=t.body,this.shouldThrowOnError=(e=t.shouldThrowOnError)!==null&&e!==void 0?e:!1,this.signal=t.signal,this.isMaybeSingle=(a=t.isMaybeSingle)!==null&&a!==void 0?a:!1,this.shouldStripNulls=(r=t.shouldStripNulls)!==null&&r!==void 0?r:!1,this.urlLengthLimit=(n=t.urlLengthLimit)!==null&&n!==void 0?n:8e3,this.retryEnabled=(s=t.retry)!==null&&s!==void 0?s:!0,t.fetch?this.fetch=t.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(t,e){return this.headers=new Headers(this.headers),this.headers.set(t,e),this}retry(t){return this.retryEnabled=t,this}then(t,e){var a=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const i=this.headers.get("Accept");i==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!i||i==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const r=this.fetch;let s=(async()=>{const i={};a.headers.forEach((c,l)=>{i[l]=c});const o=await Ki(r,a.url.toString(),{method:a.method,headers:i,body:JSON.stringify(a.body,(c,l)=>typeof l=="bigint"?l.toString():l),signal:a.signal},a.retryEnabled);return await a.processResponse(o)})();return this.shouldThrowOnError||(s=s.catch(i=>{var o;let c="",l="",d="";const u=i==null?void 0:i.cause;if(u){var p,m,f,v;const k=(p=u==null?void 0:u.message)!==null&&p!==void 0?p:"",S=(m=u==null?void 0:u.code)!==null&&m!==void 0?m:"";c=`${(f=i==null?void 0:i.name)!==null&&f!==void 0?f:"FetchError"}: ${i==null?void 0:i.message}`,c+=`

Caused by: ${(v=u==null?void 0:u.name)!==null&&v!==void 0?v:"Error"}: ${k}`,S&&(c+=` (${S})`),u!=null&&u.stack&&(c+=`
${u.stack}`)}else{var _;c=(_=i==null?void 0:i.stack)!==null&&_!==void 0?_:""}const w=this.url.toString().length;return(i==null?void 0:i.name)==="AbortError"||(i==null?void 0:i.code)==="ABORT_ERR"?(d="",l="Request was aborted (timeout or manual cancellation)",w>this.urlLengthLimit&&(l+=`. Note: Your request URL is ${w} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):((u==null?void 0:u.name)==="HeadersOverflowError"||(u==null?void 0:u.code)==="UND_ERR_HEADERS_OVERFLOW")&&(d="",l="HTTP headers exceeded server limits (typically 16KB)",w>this.urlLengthLimit&&(l+=`. Your request URL is ${w} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(o=i==null?void 0:i.name)!==null&&o!==void 0?o:"FetchError"}: ${i==null?void 0:i.message}`,details:c,hint:l,code:d},data:null,count:null,status:0,statusText:""}})),s.then(t,e)}async processResponse(t){var e=this;let a=null,r=null,n=null,s=t.status,i=t.statusText;if(t.ok){var o,c;if(e.method!=="HEAD"){var l;const m=await t.text();if(m!=="")if(e.headers.get("Accept")==="text/csv")r=m;else if(e.headers.get("Accept")&&(!((l=e.headers.get("Accept"))===null||l===void 0)&&l.includes("application/vnd.pgrst.plan+text")))r=m;else try{r=JSON.parse(m)}catch{if(a={message:m},r=null,e.shouldThrowOnError)throw new Ht({message:m,details:"",hint:"",code:""})}}const u=(o=e.headers.get("Prefer"))===null||o===void 0?void 0:o.match(/count=(exact|planned|estimated)/),p=(c=t.headers.get("content-range"))===null||c===void 0?void 0:c.split("/");if(u&&p&&p.length>1&&(n=parseInt(p[1])),e.isMaybeSingle&&Array.isArray(r))if(r.length>1){if(a={code:"PGRST116",details:`Results contain ${r.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},r=null,n=null,s=406,i="Not Acceptable",e.shouldThrowOnError){var d;throw new Ht(ft(ft({},a),{},{hint:(d=a.hint)!==null&&d!==void 0?d:""}))}}else r.length===1?r=r[0]:r=null}else{const u=await t.text();try{a=JSON.parse(u),Array.isArray(a)&&t.status===404&&(r=[],a=null,s=200,i="OK")}catch{t.status===404&&u===""?(s=204,i="No Content"):a={message:u}}if(a&&e.shouldThrowOnError)throw new Ht(a)}return{success:a===null,error:a,data:r,count:n,status:s,statusText:i}}returns(){return this}overrideTypes(){return this}},Rl=class extends Ll{throwOnError(){return super.throwOnError()}select(t){let e=!1;const a=(t??"*").split("").map(r=>/\s/.test(r)&&!e?"":(r==='"'&&(e=!e),r)).join("");return this.url.searchParams.set("select",a),this.headers.append("Prefer","return=representation"),this}order(t,{ascending:e=!0,nullsFirst:a,foreignTable:r,referencedTable:n=r}={}){const s=n?`${n}.order`:"order",i=this.url.searchParams.get(s);return this.url.searchParams.set(s,`${i?`${i},`:""}${t}.${e?"asc":"desc"}${a===void 0?"":a?".nullsfirst":".nullslast"}`),this}limit(t,{foreignTable:e,referencedTable:a=e}={}){const r=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(r,`${t}`),this}range(t,e,{foreignTable:a,referencedTable:r=a}={}){const n=typeof r>"u"?"offset":`${r}.offset`,s=typeof r>"u"?"limit":`${r}.limit`;return this.url.searchParams.set(n,`${t}`),this.url.searchParams.set(s,`${e-t+1}`),this}abortSignal(t){return this.signal=t,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:t=!1,verbose:e=!1,settings:a=!1,buffers:r=!1,wal:n=!1,format:s="text"}={}){var i;const o=[t?"analyze":null,e?"verbose":null,a?"settings":null,r?"buffers":null,n?"wal":null].filter(Boolean).join("|"),c=(i=this.headers.get("Accept"))!==null&&i!==void 0?i:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${s}; for="${c}"; options=${o};`),s==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(t){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${t}`),this}};const gs=new RegExp("[,()]");var Ot=class extends Rl{throwOnError(){return super.throwOnError()}eq(t,e){return this.url.searchParams.append(t,`eq.${e}`),this}neq(t,e){return this.url.searchParams.append(t,`neq.${e}`),this}gt(t,e){return this.url.searchParams.append(t,`gt.${e}`),this}gte(t,e){return this.url.searchParams.append(t,`gte.${e}`),this}lt(t,e){return this.url.searchParams.append(t,`lt.${e}`),this}lte(t,e){return this.url.searchParams.append(t,`lte.${e}`),this}like(t,e){return this.url.searchParams.append(t,`like.${e}`),this}likeAllOf(t,e){return this.url.searchParams.append(t,`like(all).{${e.join(",")}}`),this}likeAnyOf(t,e){return this.url.searchParams.append(t,`like(any).{${e.join(",")}}`),this}ilike(t,e){return this.url.searchParams.append(t,`ilike.${e}`),this}ilikeAllOf(t,e){return this.url.searchParams.append(t,`ilike(all).{${e.join(",")}}`),this}ilikeAnyOf(t,e){return this.url.searchParams.append(t,`ilike(any).{${e.join(",")}}`),this}regexMatch(t,e){return this.url.searchParams.append(t,`match.${e}`),this}regexIMatch(t,e){return this.url.searchParams.append(t,`imatch.${e}`),this}is(t,e){return this.url.searchParams.append(t,`is.${e}`),this}isDistinct(t,e){return this.url.searchParams.append(t,`isdistinct.${e}`),this}in(t,e){const a=Array.from(new Set(e)).map(r=>typeof r=="string"&&gs.test(r)?`"${r}"`:`${r}`).join(",");return this.url.searchParams.append(t,`in.(${a})`),this}notIn(t,e){const a=Array.from(new Set(e)).map(r=>typeof r=="string"&&gs.test(r)?`"${r}"`:`${r}`).join(",");return this.url.searchParams.append(t,`not.in.(${a})`),this}contains(t,e){return typeof e=="string"?this.url.searchParams.append(t,`cs.${e}`):Array.isArray(e)?this.url.searchParams.append(t,`cs.{${e.join(",")}}`):this.url.searchParams.append(t,`cs.${JSON.stringify(e)}`),this}containedBy(t,e){return typeof e=="string"?this.url.searchParams.append(t,`cd.${e}`):Array.isArray(e)?this.url.searchParams.append(t,`cd.{${e.join(",")}}`):this.url.searchParams.append(t,`cd.${JSON.stringify(e)}`),this}rangeGt(t,e){return this.url.searchParams.append(t,`sr.${e}`),this}rangeGte(t,e){return this.url.searchParams.append(t,`nxl.${e}`),this}rangeLt(t,e){return this.url.searchParams.append(t,`sl.${e}`),this}rangeLte(t,e){return this.url.searchParams.append(t,`nxr.${e}`),this}rangeAdjacent(t,e){return this.url.searchParams.append(t,`adj.${e}`),this}overlaps(t,e){return typeof e=="string"?this.url.searchParams.append(t,`ov.${e}`):this.url.searchParams.append(t,`ov.{${e.join(",")}}`),this}textSearch(t,e,{config:a,type:r}={}){let n="";r==="plain"?n="pl":r==="phrase"?n="ph":r==="websearch"&&(n="w");const s=a===void 0?"":`(${a})`;return this.url.searchParams.append(t,`${n}fts${s}.${e}`),this}match(t){return Object.entries(t).filter(([e,a])=>a!==void 0).forEach(([e,a])=>{this.url.searchParams.append(e,`eq.${a}`)}),this}not(t,e,a){return this.url.searchParams.append(t,`not.${e}.${a}`),this}or(t,{foreignTable:e,referencedTable:a=e}={}){const r=a?`${a}.or`:"or";return this.url.searchParams.append(r,`(${t})`),this}filter(t,e,a){return this.url.searchParams.append(t,`${e}.${a}`),this}},Pl=class{constructor(t,{headers:e={},schema:a,fetch:r,urlLengthLimit:n=8e3,retry:s}){this.url=t,this.headers=new Headers(e),this.schema=a,this.fetch=r,this.urlLengthLimit=n,this.retry=s}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(t,e){const{head:a=!1,count:r}=e??{},n=a?"HEAD":"GET";let s=!1;const i=(t??"*").split("").map(l=>/\s/.test(l)&&!s?"":(l==='"'&&(s=!s),l)).join(""),{url:o,headers:c}=this.cloneRequestState();return o.searchParams.set("select",i),r&&c.append("Prefer",`count=${r}`),new Ot({method:n,url:o,headers:c,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(t,{count:e,defaultToNull:a=!0}={}){var r;const n="POST",{url:s,headers:i}=this.cloneRequestState();if(e&&i.append("Prefer",`count=${e}`),a||i.append("Prefer","missing=default"),Array.isArray(t)){const o=t.reduce((c,l)=>c.concat(Object.keys(l)),[]);if(o.length>0){const c=[...new Set(o)].map(l=>`"${l}"`);s.searchParams.set("columns",c.join(","))}}return new Ot({method:n,url:s,headers:i,schema:this.schema,body:t,fetch:(r=this.fetch)!==null&&r!==void 0?r:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(t,{onConflict:e,ignoreDuplicates:a=!1,count:r,defaultToNull:n=!0}={}){var s;const i="POST",{url:o,headers:c}=this.cloneRequestState();if(c.append("Prefer",`resolution=${a?"ignore":"merge"}-duplicates`),e!==void 0&&o.searchParams.set("on_conflict",e),r&&c.append("Prefer",`count=${r}`),n||c.append("Prefer","missing=default"),Array.isArray(t)){const l=t.reduce((d,u)=>d.concat(Object.keys(u)),[]);if(l.length>0){const d=[...new Set(l)].map(u=>`"${u}"`);o.searchParams.set("columns",d.join(","))}}return new Ot({method:i,url:o,headers:c,schema:this.schema,body:t,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(t,{count:e}={}){var a;const r="PATCH",{url:n,headers:s}=this.cloneRequestState();return e&&s.append("Prefer",`count=${e}`),new Ot({method:r,url:n,headers:s,schema:this.schema,body:t,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:t}={}){var e;const a="DELETE",{url:r,headers:n}=this.cloneRequestState();return t&&n.append("Prefer",`count=${t}`),new Ot({method:a,url:r,headers:n,schema:this.schema,fetch:(e=this.fetch)!==null&&e!==void 0?e:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function ql(t,e){try{const i=JSON.parse(t);if(i&&typeof i=="object"&&!Array.isArray(i)){var a,r,n,s;return new Ht({message:String((a=i.message)!==null&&a!==void 0?a:t),details:(r=i.details)!==null&&r!==void 0?r:"",hint:(n=i.hint)!==null&&n!==void 0?n:"",code:(s=i.code)!==null&&s!==void 0?s:""})}}catch{}return new Ht({message:t||e,details:"",hint:"",code:""})}function ys(t,e,a){var r;const n=t;return{success:!1,error:new Ht({message:`${(r=n==null?void 0:n.name)!==null&&r!==void 0?r:"FetchError"}: ${n==null?void 0:n.message}`,details:"",hint:"",code:""}),data:null,count:null,status:e,statusText:a}}var xl=class Ji{constructor(e,{headers:a={},schema:r,fetch:n,timeout:s,urlLengthLimit:i=8e3,retry:o}={}){this.url=e,this.headers=new Headers(a),this.schemaName=r,this.urlLengthLimit=i;const c=n??globalThis.fetch;s!==void 0&&s>0?this.fetch=(l,d)=>{const u=new AbortController,p=setTimeout(()=>u.abort(),s),m=d==null?void 0:d.signal;if(m){if(m.aborted)return clearTimeout(p),c(l,d);const f=()=>{clearTimeout(p),u.abort()};return m.addEventListener("abort",f,{once:!0}),c(l,ft(ft({},d),{},{signal:u.signal})).finally(()=>{clearTimeout(p),m.removeEventListener("abort",f)})}return c(l,ft(ft({},d),{},{signal:u.signal})).finally(()=>clearTimeout(p))}:this.fetch=c,this.retry=o}from(e){if(!e||typeof e!="string"||e.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new Pl(new URL(`${this.url}/${e}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(e){return new Ji(this.url,{headers:this.headers,schema:e,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}async getOpenApiSpec(){var e=this,a;const r=new Headers(e.headers);r.set("Accept","application/openapi+json"),e.schemaName&&r.set("Accept-Profile",e.schemaName);const n={};r.forEach((l,d)=>{n[d]=l});const s=(a=e.fetch)!==null&&a!==void 0?a:globalThis.fetch;let i;try{var o;i=await Ki(s,`${e.url}/`,{method:"GET",headers:n},(o=e.retry)!==null&&o!==void 0?o:!0)}catch(l){return ys(l,0,"")}let c;try{c=await i.text()}catch(l){return ys(l,i.status,i.statusText)}if(i.ok)try{return{success:!0,error:null,data:JSON.parse(c),count:null,status:i.status,statusText:i.statusText}}catch{}return{success:!1,error:ql(c,i.statusText),data:null,count:null,status:i.status,statusText:i.statusText}}rpc(e,a={},{head:r=!1,get:n=!1,count:s}={}){var i;let o;const c=new URL(`${this.url}/rpc/${e}`);let l;const d=m=>m!==null&&typeof m=="object"&&(!Array.isArray(m)||m.some(d)),u=r&&Object.values(a).some(d);u?(o="POST",l=a):r||n?(o=r?"HEAD":"GET",Object.entries(a).filter(([m,f])=>f!==void 0).map(([m,f])=>[m,Array.isArray(f)?`{${f.join(",")}}`:`${f}`]).forEach(([m,f])=>{c.searchParams.append(m,f)})):(o="POST",l=a);const p=new Headers(this.headers);return u?p.set("Prefer",s?`count=${s},return=minimal`:"return=minimal"):s&&p.set("Prefer",`count=${s}`),new Ot({method:o,url:c,headers:p,schema:this.schemaName,body:l,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};class Nl{constructor(){}static detectEnvironment(){var e;if(typeof WebSocket<"u")return{type:"native",wsConstructor:WebSocket};const a=globalThis;if(typeof globalThis<"u"&&typeof a.WebSocket<"u")return{type:"native",wsConstructor:a.WebSocket};const r=typeof global<"u"?global:void 0;if(r&&typeof r.WebSocket<"u")return{type:"native",wsConstructor:r.WebSocket};if(typeof globalThis<"u"&&typeof a.WebSocketPair<"u"&&typeof globalThis.WebSocket>"u")return{type:"cloudflare",error:"Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",workaround:"Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."};if(typeof globalThis<"u"&&a.EdgeRuntime||typeof navigator<"u"&&(!((e=navigator.userAgent)===null||e===void 0)&&e.includes("Vercel-Edge")))return{type:"unsupported",error:"Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",workaround:"Use serverless functions or a different deployment target for WebSocket functionality."};const n=globalThis.process;if(n){const s=n.versions;if(s&&s.node)return{type:"unsupported",error:"Node.js detected but native WebSocket not found.",workaround:"Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."}}return{type:"unsupported",error:"Unknown JavaScript runtime without WebSocket support.",workaround:"Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."}}static getWebSocketConstructor(){const e=this.detectEnvironment();if(e.wsConstructor)return e.wsConstructor;let a=e.error||"WebSocket not supported in this environment.";throw e.workaround&&(a+=`

Suggested solution: ${e.workaround}`),new Error(a)}static isWebSocketSupported(){try{return this.detectEnvironment().type==="native"}catch{return!1}}}const Il="2.116.0",Ol=`realtime-js/${Il}`,jl="1.0.0",Qi="2.0.0",Dl=Qi,Ml=1e4,Ul=15e3,Hl=1e4,Fl=100,it={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},Yi={close:"phx_close",error:"phx_error",join:"phx_join",leave:"phx_leave",access_token:"access_token"},_n={connecting:"connecting",closing:"closing",closed:"closed"};class Bl{constructor(e){this.HEADER_LENGTH=1,this.USER_BROADCAST_PUSH_META_LENGTH=6,this.KINDS={userBroadcastPush:3,userBroadcast:4},this.BINARY_ENCODING=0,this.JSON_ENCODING=1,this.BROADCAST_EVENT="broadcast",this.allowedMetadataKeys=[],this.allowedMetadataKeys=e??[]}encode(e,a){if(e.event===this.BROADCAST_EVENT&&!(e.payload instanceof ArrayBuffer)&&typeof e.payload.event=="string")return a(this._binaryEncodeUserBroadcastPush(e));let r=[e.join_ref,e.ref,e.topic,e.event,e.payload];return a(JSON.stringify(r))}_binaryEncodeUserBroadcastPush(e){var a;return this._isArrayBuffer((a=e.payload)===null||a===void 0?void 0:a.payload)?this._encodeBinaryUserBroadcastPush(e):this._encodeJsonUserBroadcastPush(e)}_encodeBinaryUserBroadcastPush(e){var a,r;const n=(r=(a=e.payload)===null||a===void 0?void 0:a.payload)!==null&&r!==void 0?r:new ArrayBuffer(0);return this._encodeUserBroadcastPush(e,this.BINARY_ENCODING,n)}_encodeJsonUserBroadcastPush(e){var a,r;const n=(r=(a=e.payload)===null||a===void 0?void 0:a.payload)!==null&&r!==void 0?r:{},i=new TextEncoder().encode(JSON.stringify(n)).buffer;return this._encodeUserBroadcastPush(e,this.JSON_ENCODING,i)}_encodeUserBroadcastPush(e,a,r){var n,s;const i=new TextEncoder,o=i.encode(e.topic),c=i.encode((n=e.ref)!==null&&n!==void 0?n:""),l=i.encode((s=e.join_ref)!==null&&s!==void 0?s:""),d=i.encode(e.payload.event),u=this.allowedMetadataKeys?this._pick(e.payload,this.allowedMetadataKeys):{},p=i.encode(Object.keys(u).length===0?"":JSON.stringify(u));if(l.length>255)throw new Error(`joinRef length ${l.length} exceeds maximum of 255`);if(c.length>255)throw new Error(`ref length ${c.length} exceeds maximum of 255`);if(o.length>255)throw new Error(`topic length ${o.length} exceeds maximum of 255`);if(d.length>255)throw new Error(`userEvent length ${d.length} exceeds maximum of 255`);if(p.length>255)throw new Error(`metadata length ${p.length} exceeds maximum of 255`);const m=this.USER_BROADCAST_PUSH_META_LENGTH+l.length+c.length+o.length+d.length+p.length,f=new ArrayBuffer(this.HEADER_LENGTH+m),v=new DataView(f),_=new Uint8Array(f);let w=0;v.setUint8(w++,this.KINDS.userBroadcastPush),v.setUint8(w++,l.length),v.setUint8(w++,c.length),v.setUint8(w++,o.length),v.setUint8(w++,d.length),v.setUint8(w++,p.length),v.setUint8(w++,a),_.set(l,w),w+=l.length,_.set(c,w),w+=c.length,_.set(o,w),w+=o.length,_.set(d,w),w+=d.length,_.set(p,w),w+=p.length;var k=new Uint8Array(f.byteLength+r.byteLength);return k.set(new Uint8Array(f),0),k.set(new Uint8Array(r),f.byteLength),k.buffer}decode(e,a){if(this._isArrayBuffer(e)){let r=this._binaryDecode(e);return a(r)}if(typeof e=="string"){const r=JSON.parse(e),[n,s,i,o,c]=r;return a({join_ref:n,ref:s,topic:i,event:o,payload:c})}return a({})}_binaryDecode(e){const a=new DataView(e),r=a.getUint8(0),n=new TextDecoder;switch(r){case this.KINDS.userBroadcast:return this._decodeUserBroadcast(e,a,n)}}_decodeUserBroadcast(e,a,r){const n=a.getUint8(1),s=a.getUint8(2),i=a.getUint8(3),o=a.getUint8(4);let c=this.HEADER_LENGTH+4;const l=r.decode(e.slice(c,c+n));c=c+n;const d=r.decode(e.slice(c,c+s));c=c+s;const u=r.decode(e.slice(c,c+i));c=c+i;const p=e.slice(c,e.byteLength),m=o===this.JSON_ENCODING?JSON.parse(r.decode(p)):p,f={type:this.BROADCAST_EVENT,event:d,payload:m};return i>0&&(f.meta=JSON.parse(u)),{join_ref:null,ref:null,topic:l,event:this.BROADCAST_EVENT,payload:f}}_isArrayBuffer(e){var a;return e instanceof ArrayBuffer||((a=e==null?void 0:e.constructor)===null||a===void 0?void 0:a.name)==="ArrayBuffer"}_pick(e,a){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([r])=>a.includes(r)))}}var se;(function(t){t.abstime="abstime",t.bool="bool",t.date="date",t.daterange="daterange",t.float4="float4",t.float8="float8",t.int2="int2",t.int4="int4",t.int4range="int4range",t.int8="int8",t.int8range="int8range",t.json="json",t.jsonb="jsonb",t.money="money",t.numeric="numeric",t.oid="oid",t.reltime="reltime",t.text="text",t.time="time",t.timestamp="timestamp",t.timestamptz="timestamptz",t.timetz="timetz",t.tsrange="tsrange",t.tstzrange="tstzrange"})(se||(se={}));const _s=(t,e,a={})=>{var r;const n=(r=a.skipTypes)!==null&&r!==void 0?r:[];return e?Object.keys(e).reduce((s,i)=>(s[i]=zl(i,t,e,n),s),{}):{}},zl=(t,e,a,r)=>{const n=e.find(o=>o.name===t),s=n==null?void 0:n.type,i=a[t];return s&&!r.includes(s)?Zi(s,i):bn(i)},Zi=(t,e)=>{if(t.charAt(0)==="_"){const a=t.slice(1,t.length);return Kl(e,a)}switch(t){case se.bool:return Vl(e);case se.float4:case se.float8:case se.int2:case se.int4:case se.int8:case se.numeric:case se.oid:return Wl(e);case se.json:case se.jsonb:return Gl(e);case se.timestamp:return Jl(e);case se.abstime:case se.date:case se.daterange:case se.int4range:case se.int8range:case se.money:case se.reltime:case se.text:case se.time:case se.timestamptz:case se.timetz:case se.tsrange:case se.tstzrange:return bn(e);default:return bn(e)}},bn=t=>t,Vl=t=>{switch(t){case"t":return!0;case"f":return!1;default:return t}},Wl=t=>{if(typeof t=="string"){const e=parseFloat(t);if(!Number.isNaN(e))return e}return t},Gl=t=>{if(typeof t=="string")try{return JSON.parse(t)}catch{return t}return t},Kl=(t,e)=>{if(typeof t!="string")return t;const a=t.length-1,r=t[a];if(t[0]==="{"&&r==="}"){let s;const i=t.slice(1,a);try{s=JSON.parse("["+i+"]")}catch{s=i?i.split(","):[]}return s.map(o=>Zi(e,o))}return t},Jl=t=>typeof t=="string"?t.replace(" ","T"):t,Xi=t=>{const e=new URL(t);return e.protocol=e.protocol.replace(/^ws/i,"http"),e.pathname=e.pathname.replace(/\/+$/,"").replace(/\/socket\/websocket$/i,"").replace(/\/socket$/i,"").replace(/\/websocket$/i,""),e.pathname===""||e.pathname==="/"?e.pathname="/api/broadcast":e.pathname=e.pathname+"/api/broadcast",e.href};var Ft=t=>typeof t=="function"?t:function(){return t},Ql=typeof self<"u"?self:null,jt=typeof window<"u"?window:null,Me=Ql||jt||globalThis,Yl="2.0.0",Zl=1e4,Xl=1e3,ed=100,Ue={connecting:0,open:1,closing:2,closed:3},_e={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},Je={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave"},wn={longpoll:"longpoll",websocket:"websocket"},td={complete:4},$n="base64url.bearer.phx.",Ba=class{constructor(t,e,a,r){this.channel=t,this.event=e,this.payload=a||function(){return{}},this.receivedResp=null,this.timeout=r,this.timeoutTimer=null,this.recHooks=[],this.sent=!1,this.ref=void 0}resend(t){this.timeout=t,this.reset(),this.send()}send(){this.hasReceived("timeout")||(this.startTimeout(),this.sent=!0,this.channel.socket.push({topic:this.channel.topic,event:this.event,payload:this.payload(),ref:this.ref,join_ref:this.channel.joinRef()}))}receive(t,e){return this.hasReceived(t)&&e(this.receivedResp.response),this.recHooks.push({status:t,callback:e}),this}reset(){this.cancelRefEvent(),this.ref=null,this.refEvent=null,this.receivedResp=null,this.sent=!1}destroy(){this.cancelRefEvent(),this.cancelTimeout()}matchReceive({status:t,response:e,_ref:a}){this.recHooks.filter(r=>r.status===t).forEach(r=>r.callback(e))}cancelRefEvent(){this.refEvent&&this.channel.off(this.refEvent)}cancelTimeout(){clearTimeout(this.timeoutTimer),this.timeoutTimer=null}startTimeout(){this.timeoutTimer&&this.cancelTimeout(),this.ref=this.channel.socket.makeRef(),this.refEvent=this.channel.replyEventName(this.ref),this.channel.on(this.refEvent,t=>{this.cancelRefEvent(),this.cancelTimeout(),this.receivedResp=t,this.matchReceive(t)}),this.timeoutTimer=setTimeout(()=>{this.trigger("timeout",{})},this.timeout)}hasReceived(t){return this.receivedResp&&this.receivedResp.status===t}trigger(t,e){this.channel.trigger(this.refEvent,{status:t,response:e})}},eo=class{constructor(t,e){this.callback=t,this.timerCalc=e,this.timer=void 0,this.tries=0}reset(){this.tries=0,clearTimeout(this.timer)}scheduleTimeout(){clearTimeout(this.timer),this.timer=setTimeout(()=>{this.tries=this.tries+1,this.callback()},this.timerCalc(this.tries+1))}},ad=class{constructor(t,e,a){this.state=_e.closed,this.topic=t,this.params=Ft(e||{}),this.socket=a,this.bindings=[],this.bindingRef=0,this.timeout=this.socket.timeout,this.joinedOnce=!1,this.joinPush=new Ba(this,Je.join,this.params,this.timeout),this.pushBuffer=[],this.stateChangeRefs=[],this.rejoinTimer=new eo(()=>{this.socket.isConnected()&&this.rejoin()},this.socket.rejoinAfterMs),this.stateChangeRefs.push(this.socket.onError(()=>this.rejoinTimer.reset())),this.stateChangeRefs.push(this.socket.onOpen(()=>{this.rejoinTimer.reset(),this.isErrored()&&this.rejoin()})),this.joinPush.receive("ok",()=>{this.state=_e.joined,this.rejoinTimer.reset(),this.pushBuffer.forEach(r=>r.send()),this.pushBuffer=[]}),this.joinPush.receive("error",r=>{this.state=_e.errored,this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,r),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.onClose(()=>{this.rejoinTimer.reset(),this.socket.hasLogger()&&this.socket.log("channel",`close ${this.topic}`),this.state=_e.closed,this.socket.remove(this)}),this.onError(r=>{this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,r),this.isJoining()&&this.joinPush.reset(),this.state=_e.errored,this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.joinPush.receive("timeout",()=>{this.socket.hasLogger()&&this.socket.log("channel",`timeout ${this.topic}`,this.joinPush.timeout),new Ba(this,Je.leave,Ft({}),this.timeout).send(),this.state=_e.errored,this.joinPush.reset(),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.on(Je.reply,(r,n)=>{this.trigger(this.replyEventName(n),r)})}join(t=this.timeout){if(this.joinedOnce)throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");return this.timeout=t,this.joinedOnce=!0,this.rejoin(),this.joinPush}teardown(){this.pushBuffer.forEach(t=>t.destroy()),this.pushBuffer=[],this.rejoinTimer.reset(),this.joinPush.destroy(),this.state=_e.closed,this.bindings=[]}onClose(t){this.on(Je.close,t)}onError(t){return this.on(Je.error,e=>t(e))}on(t,e){let a=this.bindingRef++;return this.bindings.push({event:t,ref:a,callback:e}),a}off(t,e){this.bindings=this.bindings.filter(a=>!(a.event===t&&(typeof e>"u"||e===a.ref)))}canPush(){return this.socket.isConnected()&&this.isJoined()}push(t,e,a=this.timeout){if(e=e||{},!this.joinedOnce)throw new Error(`tried to push '${t}' to '${this.topic}' before joining. Use channel.join() before pushing events`);let r=new Ba(this,t,function(){return e},a);return this.canPush()?r.send():(r.startTimeout(),this.pushBuffer.push(r)),r}leave(t=this.timeout){this.rejoinTimer.reset(),this.joinPush.cancelTimeout(),this.state=_e.leaving;let e=()=>{this.socket.hasLogger()&&this.socket.log("channel",`leave ${this.topic}`),this.trigger(Je.close,"leave")},a=new Ba(this,Je.leave,Ft({}),t);return a.receive("ok",()=>e()).receive("timeout",()=>e()),a.send(),this.canPush()||a.trigger("ok",{}),a}onMessage(t,e,a){return e}filterBindings(t,e,a){return!0}isMember(t,e,a,r){return this.topic!==t?!1:r&&r!==this.joinRef()?(this.socket.hasLogger()&&this.socket.log("channel","dropping outdated message",{topic:t,event:e,payload:a,joinRef:r}),!1):!0}joinRef(){return this.joinPush.ref}rejoin(t=this.timeout){this.isLeaving()||(this.socket.leaveOpenTopic(this.topic),this.state=_e.joining,this.joinPush.resend(t))}trigger(t,e,a,r){let n=this.onMessage(t,e,a,r);if(e&&!n)throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");let s=this.bindings.filter(i=>i.event===t&&this.filterBindings(i,e,a));for(let i=0;i<s.length;i++)s[i].callback(n,a,r||this.joinRef())}replyEventName(t){return`chan_reply_${t}`}isClosed(){return this.state===_e.closed}isErrored(){return this.state===_e.errored}isJoined(){return this.state===_e.joined}isJoining(){return this.state===_e.joining}isLeaving(){return this.state===_e.leaving}},or=class{static request(t,e,a,r,n,s,i){if(Me.XDomainRequest){let o=new Me.XDomainRequest;return this.xdomainRequest(o,t,e,r,n,s,i)}else if(Me.XMLHttpRequest){let o=new Me.XMLHttpRequest;return this.xhrRequest(o,t,e,a,r,n,s,i)}else{if(Me.fetch&&Me.AbortController)return this.fetchRequest(t,e,a,r,n,s,i);throw new Error("No suitable XMLHttpRequest implementation found")}}static fetchRequest(t,e,a,r,n,s,i){let o={method:t,headers:a,body:r},c=null;return n&&(c=new AbortController,setTimeout(()=>c.abort(),n),o.signal=c.signal),Me.fetch(e,o).then(l=>l.text()).then(l=>this.parseJSON(l)).then(l=>i&&i(l)).catch(l=>{l.name==="AbortError"&&s?s():i&&i(null)}),c}static xdomainRequest(t,e,a,r,n,s,i){return t.timeout=n,t.open(e,a),t.onload=()=>{let o=this.parseJSON(t.responseText);i&&i(o)},s&&(t.ontimeout=s),t.onprogress=()=>{},t.send(r),t}static xhrRequest(t,e,a,r,n,s,i,o){t.open(e,a,!0),t.timeout=s;for(let[c,l]of Object.entries(r))t.setRequestHeader(c,l);return t.onerror=()=>o&&o(null),t.onreadystatechange=()=>{if(t.readyState===td.complete&&o){let c=this.parseJSON(t.responseText);o(c)}},i&&(t.ontimeout=i),t.send(n),t}static parseJSON(t){if(!t||t==="")return null;try{return JSON.parse(t)}catch{return console&&console.log("failed to parse JSON response",t),null}}static serialize(t,e){let a=[];for(var r in t){if(!Object.prototype.hasOwnProperty.call(t,r))continue;let n=e?`${e}[${r}]`:r,s=t[r];typeof s=="object"?a.push(this.serialize(s,n)):a.push(encodeURIComponent(n)+"="+encodeURIComponent(s))}return a.join("&")}static appendParams(t,e){if(Object.keys(e).length===0)return t;let a=t.match(/\?/)?"&":"?";return`${t}${a}${this.serialize(e)}`}},rd=t=>{let e="",a=new Uint8Array(t),r=a.byteLength;for(let n=0;n<r;n++)e+=String.fromCharCode(a[n]);return btoa(e)},Rt=class{constructor(t,e){e&&e.length===2&&e[1].startsWith($n)&&(this.authToken=atob(e[1].slice($n.length))),this.endPoint=null,this.token=null,this.skipHeartbeat=!0,this.reqs=new Set,this.awaitingBatchAck=!1,this.currentBatch=null,this.currentBatchTimer=null,this.batchBuffer=[],this.onopen=function(){},this.onerror=function(){},this.onmessage=function(){},this.onclose=function(){},this.pollEndpoint=this.normalizeEndpoint(t),this.readyState=Ue.connecting,setTimeout(()=>this.poll(),0)}normalizeEndpoint(t){return t.replace("ws://","http://").replace("wss://","https://").replace(new RegExp("(.*)/"+wn.websocket),"$1/"+wn.longpoll)}endpointURL(){return or.appendParams(this.pollEndpoint,{token:this.token})}closeAndRetry(t,e,a){this.close(t,e,a),this.readyState=Ue.connecting}ontimeout(){this.onerror("timeout"),this.closeAndRetry(1005,"timeout",!1)}isActive(){return this.readyState===Ue.open||this.readyState===Ue.connecting}poll(){const t={Accept:"application/json"};this.authToken&&(t["X-Phoenix-AuthToken"]=this.authToken),this.ajax("GET",t,null,()=>this.ontimeout(),e=>{if(e){var{status:a,token:r,messages:n}=e;if(a===410&&this.token!==null){this.onerror(410),this.closeAndRetry(3410,"session_gone",!1);return}this.token=r}else a=0;switch(a){case 200:n.forEach(s=>{setTimeout(()=>this.onmessage({data:s}),0)}),this.poll();break;case 204:this.poll();break;case 410:this.readyState=Ue.open,this.onopen({}),this.poll();break;case 403:this.onerror(403),this.close(1008,"forbidden",!1);break;case 0:case 500:this.onerror(500),this.closeAndRetry(1011,"internal server error",500);break;default:throw new Error(`unhandled poll status ${a}`)}})}send(t){typeof t!="string"&&(t=rd(t)),this.currentBatch?this.currentBatch.push(t):this.awaitingBatchAck?this.batchBuffer.push(t):(this.currentBatch=[t],this.currentBatchTimer=setTimeout(()=>{this.batchSend(this.currentBatch),this.currentBatch=null},0))}batchSend(t,e=0){this.awaitingBatchAck=!0;const a=e+ed,r=t.slice(e,a);this.ajax("POST",{"Content-Type":"application/x-ndjson"},r.join(`
`),()=>this.onerror("timeout"),n=>{!n||n.status!==200?(this.awaitingBatchAck=!1,this.onerror(n&&n.status),this.closeAndRetry(1011,"internal server error",!1)):a<t.length?this.batchSend(t,a):this.batchBuffer.length>0?(this.batchSend(this.batchBuffer),this.batchBuffer=[]):this.awaitingBatchAck=!1})}close(t,e,a){for(let n of this.reqs)n.abort();this.readyState=Ue.closed;let r=Object.assign({code:1e3,reason:void 0,wasClean:!0},{code:t,reason:e,wasClean:a});this.batchBuffer=[],clearTimeout(this.currentBatchTimer),this.currentBatchTimer=null,typeof CloseEvent<"u"?this.onclose(new CloseEvent("close",r)):this.onclose(r)}ajax(t,e,a,r,n){let s,i=()=>{this.reqs.delete(s),r()};s=or.request(t,this.endpointURL(),e,a,this.timeout,i,o=>{this.reqs.delete(s),this.isActive()&&n(o)}),this.reqs.add(s)}},nd=class ha{constructor(e,a={}){let r=a.events||{state:"presence_state",diff:"presence_diff"};this.state=Object.create(null),this.pendingDiffs=[],this.channel=e,this.joinRef=null,this.caller={onJoin:function(){},onLeave:function(){},onSync:function(){}},this.channel.on(r.state,n=>{let{onJoin:s,onLeave:i,onSync:o}=this.caller;this.joinRef=this.channel.joinRef(),this.state=ha.syncState(this.state,n,s,i),this.pendingDiffs.forEach(c=>{this.state=ha.syncDiff(this.state,c,s,i)}),this.pendingDiffs=[],o()}),this.channel.on(r.diff,n=>{let{onJoin:s,onLeave:i,onSync:o}=this.caller;this.inPendingSyncState()?this.pendingDiffs.push(n):(this.state=ha.syncDiff(this.state,n,s,i),o())})}onJoin(e){this.caller.onJoin=e}onLeave(e){this.caller.onLeave=e}onSync(e){this.caller.onSync=e}list(e){return ha.list(this.state,e)}inPendingSyncState(){return!this.joinRef||this.joinRef!==this.channel.joinRef()}static syncState(e,a,r,n){let s=this.toNullProtoObj(this.clone(e));a=this.toNullProtoObj(a);let i=Object.create(null),o=Object.create(null);return this.map(s,(c,l)=>{a[c]||(o[c]=l)}),this.map(a,(c,l)=>{let d=s[c];if(d){let u=l.metas.map(v=>v.phx_ref),p=d.metas.map(v=>v.phx_ref),m=l.metas.filter(v=>p.indexOf(v.phx_ref)<0),f=d.metas.filter(v=>u.indexOf(v.phx_ref)<0);m.length>0&&(i[c]=l,i[c].metas=m),f.length>0&&(o[c]=this.clone(d),o[c].metas=f)}else i[c]=l}),this.syncDiff(s,{joins:i,leaves:o},r,n)}static syncDiff(e,a,r,n){e=this.toNullProtoObj(e);let{joins:s,leaves:i}=this.clone(a);return r||(r=function(){}),n||(n=function(){}),this.map(s,(o,c)=>{let l=e[o];if(e[o]=this.clone(c),l){let d=e[o].metas.map(p=>p.phx_ref),u=l.metas.filter(p=>d.indexOf(p.phx_ref)<0);e[o].metas.unshift(...u)}r(o,l,c)}),this.map(i,(o,c)=>{let l=e[o];if(!l)return;let d=c.metas.map(u=>u.phx_ref);l.metas=l.metas.filter(u=>d.indexOf(u.phx_ref)<0),n(o,l,c),l.metas.length===0&&delete e[o]}),e}static list(e,a){return a||(a=function(r,n){return n}),this.map(e,(r,n)=>a(r,n))}static map(e,a){return Object.getOwnPropertyNames(e).map(r=>a(r,e[r]))}static toNullProtoObj(e){if(Object.getPrototypeOf(e)===null)return e;let a=Object.create(null);return Object.getOwnPropertyNames(e).forEach(r=>{a[r]=e[r]}),a}static clone(e){return JSON.parse(JSON.stringify(e))}},za={HEADER_LENGTH:1,META_LENGTH:4,KINDS:{push:0,reply:1,broadcast:2},encode(t,e){if(t.payload.constructor===ArrayBuffer)return e(this.binaryEncode(t));{let a=[t.join_ref,t.ref,t.topic,t.event,t.payload];return e(JSON.stringify(a))}},decode(t,e){if(t.constructor===ArrayBuffer)return e(this.binaryDecode(t));{let[a,r,n,s,i]=JSON.parse(t);return e({join_ref:a,ref:r,topic:n,event:s,payload:i})}},binaryEncode(t){let{join_ref:e,ref:a,event:r,topic:n,payload:s}=t,i=new TextEncoder,o=i.encode(e),c=i.encode(a),l=i.encode(n),d=i.encode(r);this.assertFieldSize(o.byteLength,"join_ref"),this.assertFieldSize(c.byteLength,"ref"),this.assertFieldSize(l.byteLength,"topic"),this.assertFieldSize(d.byteLength,"event");let u=this.META_LENGTH+o.byteLength+c.byteLength+l.byteLength+d.byteLength,p=new ArrayBuffer(this.HEADER_LENGTH+u),m=new Uint8Array(p),f=new DataView(p),v=0;f.setUint8(v++,this.KINDS.push),f.setUint8(v++,o.byteLength),f.setUint8(v++,c.byteLength),f.setUint8(v++,l.byteLength),f.setUint8(v++,d.byteLength),m.set(o,v),v+=o.byteLength,m.set(c,v),v+=c.byteLength,m.set(l,v),v+=l.byteLength,m.set(d,v),v+=d.byteLength;var _=new Uint8Array(p.byteLength+s.byteLength);return _.set(m,0),_.set(new Uint8Array(s),p.byteLength),_.buffer},assertFieldSize(t,e){if(t>255)throw new Error(`unable to convert ${e} to binary: must be less than or equal to 255 bytes, but is ${t} bytes`)},binaryDecode(t){let e=new DataView(t),a=e.getUint8(0),r=new TextDecoder;switch(a){case this.KINDS.push:return this.decodePush(t,e,r);case this.KINDS.reply:return this.decodeReply(t,e,r);case this.KINDS.broadcast:return this.decodeBroadcast(t,e,r)}},decodePush(t,e,a){let r=e.getUint8(1),n=e.getUint8(2),s=e.getUint8(3),i=this.HEADER_LENGTH+this.META_LENGTH-1,o=a.decode(t.slice(i,i+r));i=i+r;let c=a.decode(t.slice(i,i+n));i=i+n;let l=a.decode(t.slice(i,i+s));i=i+s;let d=t.slice(i,t.byteLength);return{join_ref:o,ref:null,topic:c,event:l,payload:d}},decodeReply(t,e,a){let r=e.getUint8(1),n=e.getUint8(2),s=e.getUint8(3),i=e.getUint8(4),o=this.HEADER_LENGTH+this.META_LENGTH,c=a.decode(t.slice(o,o+r));o=o+r;let l=a.decode(t.slice(o,o+n));o=o+n;let d=a.decode(t.slice(o,o+s));o=o+s;let u=a.decode(t.slice(o,o+i));o=o+i;let p=t.slice(o,t.byteLength),m={status:u,response:p};return{join_ref:c,ref:l,topic:d,event:Je.reply,payload:m}},decodeBroadcast(t,e,a){let r=e.getUint8(1),n=e.getUint8(2),s=this.HEADER_LENGTH+2,i=a.decode(t.slice(s,s+r));s=s+r;let o=a.decode(t.slice(s,s+n));s=s+n;let c=t.slice(s,t.byteLength);return{join_ref:null,ref:null,topic:i,event:o,payload:c}}},sd=class{constructor(t,e={}){this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.channels=[],this.sendBuffer=[],this.ref=0,this.fallbackRef=null,this.timeout=e.timeout||Zl,this.transport=e.transport||Me.WebSocket||Rt,this.conn=void 0,this.primaryPassedHealthCheck=!1,this.longPollFallbackMs=e.longPollFallbackMs,this.fallbackTimer=null;let a=null;try{a=Me&&Me.sessionStorage}catch{}this.sessionStore=e.sessionStorage||a,this.establishedConnections=0,this.defaultEncoder=za.encode.bind(za),this.defaultDecoder=za.decode.bind(za),this.closeWasClean=!0,this.disconnecting=!1,this.binaryType=e.binaryType||"arraybuffer",this.connectClock=1,this.pageHidden=!1,this.encode=void 0,this.decode=void 0,this.transport!==Rt?(this.encode=e.encode||this.defaultEncoder,this.decode=e.decode||this.defaultDecoder):(this.encode=this.defaultEncoder,this.decode=this.defaultDecoder);let r=null;jt&&jt.addEventListener&&(jt.addEventListener("pagehide",n=>{this.conn&&(this.disconnect(),r=this.connectClock)}),jt.addEventListener("pageshow",n=>{r===this.connectClock&&(r=null,this.connect())}),jt.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?this.pageHidden=!0:(this.pageHidden=!1,!this.isConnected()&&!this.closeWasClean&&this.teardown(()=>this.connect()))})),this.heartbeatIntervalMs=e.heartbeatIntervalMs||3e4,this.autoSendHeartbeat=e.autoSendHeartbeat??!0,this.heartbeatCallback=e.heartbeatCallback??(()=>{}),this.rejoinAfterMs=n=>e.rejoinAfterMs?e.rejoinAfterMs(n):[1e3,2e3,5e3][n-1]||1e4,this.reconnectAfterMs=n=>e.reconnectAfterMs?e.reconnectAfterMs(n):[10,50,100,150,200,250,500,1e3,2e3][n-1]||5e3,this.logger=e.logger||null,!this.logger&&e.debug&&(this.logger=(n,s,i)=>{console.log(`${n}: ${s}`,i)}),this.longpollerTimeout=e.longpollerTimeout||2e4,this.params=Ft(e.params||{}),this.endPoint=`${t}/${wn.websocket}`,this.vsn=e.vsn||Yl,this.heartbeatTimeoutTimer=null,this.heartbeatTimer=null,this.heartbeatSentAt=null,this.pendingHeartbeatRef=null,this.reconnectTimer=new eo(()=>{if(this.pageHidden){this.log("Not reconnecting as page is hidden!"),this.teardown();return}this.teardown(async()=>{e.beforeReconnect&&await e.beforeReconnect(),this.connect()})},this.reconnectAfterMs),this.authToken=e.authToken&&Ft(e.authToken)}getLongPollTransport(){return Rt}replaceTransport(t){this.connectClock++,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.conn&&(this.conn.close(),this.conn=null),this.transport=t}protocol(){return location.protocol.match(/^https/)?"wss":"ws"}endPointURL(){let t=or.appendParams(or.appendParams(this.endPoint,this.params()),{vsn:this.vsn});return t.charAt(0)!=="/"?t:t.charAt(1)==="/"?`${this.protocol()}:${t}`:`${this.protocol()}://${location.host}${t}`}disconnect(t,e,a){this.connectClock++,this.disconnecting=!0,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.teardown(()=>{this.disconnecting=!1,t&&t()},e,a)}connect(t){t&&(console&&console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"),this.params=Ft(t)),!(this.conn&&!this.disconnecting)&&(this.longPollFallbackMs&&this.transport!==Rt?this.connectWithFallback(Rt,this.longPollFallbackMs):this.transportConnect())}log(t,e,a){this.logger&&this.logger(t,e,a)}hasLogger(){return this.logger!==null}onOpen(t){let e=this.makeRef();return this.stateChangeCallbacks.open.push([e,t]),e}onClose(t){let e=this.makeRef();return this.stateChangeCallbacks.close.push([e,t]),e}onError(t){let e=this.makeRef();return this.stateChangeCallbacks.error.push([e,t]),e}onMessage(t){let e=this.makeRef();return this.stateChangeCallbacks.message.push([e,t]),e}onHeartbeat(t){this.heartbeatCallback=t}ping(t){if(!this.isConnected())return!1;let e=this.makeRef(),a=Date.now();this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:e});let r=this.onMessage(n=>{n.ref===e&&(this.off([r]),t(Date.now()-a))});return!0}transportName(t){switch(t){case Rt:return"LongPoll";default:return t.name}}transportConnect(){this.connectClock++,this.closeWasClean=!1;let t;this.authToken&&(t=["phoenix",`${$n}${btoa(this.authToken()).replace(/=/g,"")}`]),this.conn=new this.transport(this.endPointURL(),t),this.conn.binaryType=this.binaryType,this.conn.timeout=this.longpollerTimeout,this.conn.onopen=()=>this.onConnOpen(),this.conn.onerror=e=>this.onConnError(e),this.conn.onmessage=e=>this.onConnMessage(e),this.conn.onclose=e=>this.onConnClose(e)}getSession(t){return this.sessionStore&&this.sessionStore.getItem(t)}storeSession(t,e){this.sessionStore&&this.sessionStore.setItem(t,e)}connectWithFallback(t,e=2500){clearTimeout(this.fallbackTimer);let a=!1,r=!0,n,s,i=this.transportName(t),o=c=>{this.log("transport",`falling back to ${i}...`,c),this.off([n,s]),r=!1,this.replaceTransport(t),this.transportConnect()};if(this.getSession(`phx:fallback:${i}`))return o("memorized");this.fallbackTimer=setTimeout(o,e),s=this.onError(c=>{this.log("transport","error",c),r&&!a&&(clearTimeout(this.fallbackTimer),o(c))}),this.fallbackRef&&this.off([this.fallbackRef]),this.fallbackRef=this.onOpen(()=>{if(a=!0,!r){let c=this.transportName(t);return this.primaryPassedHealthCheck||this.storeSession(`phx:fallback:${c}`,"true"),this.log("transport",`established ${c} fallback`)}clearTimeout(this.fallbackTimer),this.fallbackTimer=setTimeout(o,e),this.ping(c=>{this.log("transport","connected to primary after",c),this.primaryPassedHealthCheck=!0,clearTimeout(this.fallbackTimer)})}),this.transportConnect()}clearHeartbeats(){clearTimeout(this.heartbeatTimer),clearTimeout(this.heartbeatTimeoutTimer)}onConnOpen(){this.hasLogger()&&this.log("transport",`connected to ${this.endPointURL()}`),this.closeWasClean=!1,this.disconnecting=!1,this.establishedConnections++,this.flushSendBuffer(),this.reconnectTimer.reset(),this.autoSendHeartbeat&&this.resetHeartbeat(),this.triggerStateCallbacks("open")}heartbeatTimeout(){if(this.pendingHeartbeatRef){this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.hasLogger()&&this.log("transport","heartbeat timeout. Attempting to re-establish connection");try{this.heartbeatCallback("timeout")}catch(t){this.log("error","error in heartbeat callback",t)}this.triggerChanError(new Error("heartbeat timeout")),this.closeWasClean=!1,this.teardown(()=>this.reconnectTimer.scheduleTimeout(),Xl,"heartbeat timeout")}}resetHeartbeat(){this.conn&&this.conn.skipHeartbeat||(this.pendingHeartbeatRef=null,this.clearHeartbeats(),this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}teardown(t,e,a){if(!this.conn)return t&&t();const r=this.conn;this.waitForBufferDone(r,()=>{e?r.close(e,a||""):r.close(),this.waitForSocketClosed(r,()=>{this.conn===r&&(this.conn.onopen=function(){},this.conn.onerror=function(){},this.conn.onmessage=function(){},this.conn.onclose=function(){},this.conn=null),t&&t()})})}waitForBufferDone(t,e,a=1){if(a===5||!t.bufferedAmount){e();return}setTimeout(()=>{this.waitForBufferDone(t,e,a+1)},150*a)}waitForSocketClosed(t,e,a=1){if(a===5||t.readyState===Ue.closed){e();return}setTimeout(()=>{this.waitForSocketClosed(t,e,a+1)},150*a)}onConnClose(t){this.conn&&(this.conn.onclose=()=>{}),this.hasLogger()&&this.log("transport","close",t),this.triggerChanError(t),this.clearHeartbeats(),this.closeWasClean||this.reconnectTimer.scheduleTimeout(),this.triggerStateCallbacks("close",t)}onConnError(t){this.hasLogger()&&this.log("transport","error",t);let e=this.transport,a=this.establishedConnections;this.triggerStateCallbacks("error",t,e,a),(e===this.transport||a>0)&&this.triggerChanError(t)}triggerChanError(t){this.channels.forEach(e=>{e.isErrored()||e.isLeaving()||e.isClosed()||e.trigger(Je.error,t)})}connectionState(){switch(this.conn&&this.conn.readyState){case Ue.connecting:return"connecting";case Ue.open:return"open";case Ue.closing:return"closing";default:return"closed"}}isConnected(){return this.connectionState()==="open"}remove(t){this.off(t.stateChangeRefs),this.channels=this.channels.filter(e=>e!==t)}off(t){for(let e in this.stateChangeCallbacks)this.stateChangeCallbacks[e]=this.stateChangeCallbacks[e].filter(([a])=>t.indexOf(a)===-1)}channel(t,e={}){let a=new ad(t,e,this);return this.channels.push(a),a}push(t){if(this.hasLogger()){let{topic:e,event:a,payload:r,ref:n,join_ref:s}=t;this.log("push",`${e} ${a} (${s}, ${n})`,r)}this.isConnected()?this.encode(t,e=>this.conn.send(e)):this.sendBuffer.push(()=>this.encode(t,e=>this.conn.send(e)))}makeRef(){let t=this.ref+1;return t===this.ref?this.ref=0:this.ref=t,this.ref.toString()}sendHeartbeat(){if(!this.isConnected()){try{this.heartbeatCallback("disconnected")}catch(t){this.log("error","error in heartbeat callback",t)}return}if(this.pendingHeartbeatRef){this.heartbeatTimeout();return}this.pendingHeartbeatRef=this.makeRef(),this.heartbeatSentAt=Date.now(),this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:this.pendingHeartbeatRef});try{this.heartbeatCallback("sent")}catch(t){this.log("error","error in heartbeat callback",t)}this.heartbeatTimeoutTimer=setTimeout(()=>this.heartbeatTimeout(),this.heartbeatIntervalMs)}flushSendBuffer(){this.isConnected()&&this.sendBuffer.length>0&&(this.sendBuffer.forEach(t=>t()),this.sendBuffer=[])}onConnMessage(t){this.decode(t.data,e=>{let{topic:a,event:r,payload:n,ref:s,join_ref:i}=e;if(s&&s===this.pendingHeartbeatRef){const o=this.heartbeatSentAt?Date.now()-this.heartbeatSentAt:void 0;this.clearHeartbeats();try{this.heartbeatCallback(n.status==="ok"?"ok":"error",o)}catch(c){this.log("error","error in heartbeat callback",c)}this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.autoSendHeartbeat&&(this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}this.hasLogger()&&this.log("receive",`${n.status||""} ${a} ${r} ${s&&"("+s+")"||""}`.trim(),n);for(let o=0;o<this.channels.length;o++){const c=this.channels[o];c.isMember(a,r,n,i)&&c.trigger(r,n,s,i)}this.triggerStateCallbacks("message",e)})}triggerStateCallbacks(t,...e){try{this.stateChangeCallbacks[t].forEach(([a,r])=>{try{r(...e)}catch(n){this.log("error",`error in ${t} callback`,n)}})}catch(a){this.log("error",`error triggering ${t} callbacks`,a)}}leaveOpenTopic(t){let e=this.channels.find(a=>a.topic===t&&(a.isJoined()||a.isJoining()));e&&(this.hasLogger()&&this.log("transport",`leaving duplicate topic "${t}"`),e.leave())}};class va{constructor(e,a){const r=od(a);this.presence=new nd(e.getChannel(),r),this.presence.onJoin((n,s,i)=>{const o=va.onJoinPayload(n,s,i);e.getChannel().trigger("presence",o)}),this.presence.onLeave((n,s,i)=>{const o=va.onLeavePayload(n,s,i);e.getChannel().trigger("presence",o)}),this.presence.onSync(()=>{e.getChannel().trigger("presence",{event:"sync"})})}get state(){return va.transformState(this.presence.state)}static transformState(e){return e=id(e),Object.getOwnPropertyNames(e).reduce((a,r)=>{const n=e[r];return a[r]=ar(n),a},{})}static onJoinPayload(e,a,r){const n=bs(a),s=ar(r);return{event:"join",key:e,currentPresences:n,newPresences:s}}static onLeavePayload(e,a,r){const n=bs(a),s=ar(r);return{event:"leave",key:e,currentPresences:n,leftPresences:s}}}function ar(t){return t.metas.map(e=>{const a=Object.getOwnPropertyDescriptors(e),r=Object.defineProperties({},a);return r.presence_ref=r.phx_ref,delete r.phx_ref,delete r.phx_ref_prev,r})}function id(t){return JSON.parse(JSON.stringify(t))}function od(t){return(t==null?void 0:t.events)&&{events:t.events}}function bs(t){return t!=null&&t.metas?ar(t):[]}var ws;(function(t){t.SYNC="sync",t.JOIN="join",t.LEAVE="leave"})(ws||(ws={}));class cd{get state(){return this.presenceAdapter.state}constructor(e,a){this.channel=e,this.presenceAdapter=new va(this.channel.channelAdapter,a)}}function ld(t){if(t instanceof Error)return t;if(typeof t=="string")return new Error(t);if(t&&typeof t=="object"){const e=t;if(typeof e.code=="number"){const a=typeof e.reason=="string"&&e.reason?` (${e.reason})`:"";return new Error(`socket closed: ${e.code}${a}`,{cause:t})}return new Error("channel error: transport failure",{cause:t})}return new Error("channel error: connection lost")}class dd{constructor(e,a,r){const n=ud(r);this.channel=e.getSocket().channel(a,n),this.socket=e}get state(){return this.channel.state}set state(e){this.channel.state=e}get joinedOnce(){return this.channel.joinedOnce}get joinPush(){return this.channel.joinPush}get rejoinTimer(){return this.channel.rejoinTimer}on(e,a){return this.channel.on(e,a)}off(e,a){this.channel.off(e,a)}subscribe(e){return this.channel.join(e)}unsubscribe(e){return this.channel.leave(e)}teardown(){this.channel.teardown()}onClose(e){this.channel.onClose(e)}onError(e){return this.channel.onError(e)}push(e,a,r){let n;try{n=this.channel.push(e,a,r)}catch{throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`)}if(this.channel.pushBuffer.length>Fl){const s=this.channel.pushBuffer.shift();s.cancelTimeout(),this.socket.log("channel",`discarded push due to buffer overflow: ${s.event}`,s.payload())}return n}updateJoinPayload(e){const a=this.channel.joinPush.payload();this.channel.joinPush.payload=()=>Object.assign(Object.assign({},a),e)}canPush(){return this.socket.isConnected()&&this.state===it.joined}isJoined(){return this.state===it.joined}isJoining(){return this.state===it.joining}isClosed(){return this.state===it.closed}isLeaving(){return this.state===it.leaving}updateFilterBindings(e){this.channel.filterBindings=e}updatePayloadTransform(e){this.channel.onMessage=e}getChannel(){return this.channel}}function ud(t){return{config:Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},t.config)}}const pd=/[,()"\\]/,hd=t=>pd.test(t)||t!==t.trim(),md=t=>`"${t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,$s=t=>{const e=t===null?"null":String(t);return hd(e)?md(e):e},fd=t=>t===null?"null":String(t),vd=(t,e)=>{if(t==="in"){const a=Array.isArray(e)?e:[e];if(a.length===0)throw new Error("Realtime `in` filter requires at least one value.");return`in.(${Array.from(new Set(a)).map(n=>$s(n)).join(",")})`}return t==="is"?`is.${fd(e)}`:`${t}.${$s(e)}`};class gd{constructor(){this.filters=[]}add(e,a,r,n=!1){const s=n?"not.":"";return this.filters.push(`${e}=${s}${vd(a,r)}`),this}eq(e,a){return this.add(e,"eq",a)}neq(e,a){return this.add(e,"neq",a)}gt(e,a){return this.add(e,"gt",a)}gte(e,a){return this.add(e,"gte",a)}lt(e,a){return this.add(e,"lt",a)}lte(e,a){return this.add(e,"lte",a)}in(e,a){return this.add(e,"in",a)}like(e,a){return this.add(e,"like",a)}ilike(e,a){return this.add(e,"ilike",a)}match(e,a){return this.add(e,"match",a)}imatch(e,a){return this.add(e,"imatch",a)}is(e,a){return this.add(e,"is",a)}isDistinct(e,a){return this.add(e,"isdistinct",a)}not(e,a,r){return this.add(e,a,r,!0)}build(){return this.filters.join(",")}toString(){return this.build()}}var Ss;(function(t){t.ALL="*",t.INSERT="INSERT",t.UPDATE="UPDATE",t.DELETE="DELETE"})(Ss||(Ss={}));var mt;(function(t){t.BROADCAST="broadcast",t.PRESENCE="presence",t.POSTGRES_CHANGES="postgres_changes",t.SYSTEM="system"})(mt||(mt={}));var Qe;(function(t){t.SUBSCRIBED="SUBSCRIBED",t.TIMED_OUT="TIMED_OUT",t.CLOSED="CLOSED",t.CHANNEL_ERROR="CHANNEL_ERROR"})(Qe||(Qe={}));class Ye{get state(){return this.channelAdapter.state}set state(e){this.channelAdapter.state=e}get joinedOnce(){return this.channelAdapter.joinedOnce}get timeout(){return this.socket.timeout}get joinPush(){return this.channelAdapter.joinPush}get rejoinTimer(){return this.channelAdapter.rejoinTimer}constructor(e,a={config:{}},r){var n,s;if(this.topic=e,this.params=a,this.socket=r,this.bindings={},this.subTopic=e.replace(/^realtime:/i,""),this.params.config=Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},a.config),this.channelAdapter=new dd(this.socket.socketAdapter,e,this.params),this.presence=new cd(this),this._onClose(()=>{this.socket._remove(this)}),this._updateFilterTransform(),this.broadcastEndpointURL=Xi(this.socket.socketAdapter.endPointURL()),this.private=this.params.config.private||!1,!this.private&&(!((s=(n=this.params.config)===null||n===void 0?void 0:n.broadcast)===null||s===void 0)&&s.replay))throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`)}subscribe(e,a=this.timeout){var r,n,s,i;if(this.socket.isConnected()||this.socket.connect(),this.channelAdapter.isClosed()){const{config:{broadcast:o,presence:c,private:l,postgres_changes_options:d}}=this.params,u=(n=(r=this.bindings.postgres_changes)===null||r===void 0?void 0:r.map(_=>_.filter))!==null&&n!==void 0?n:[],p=!!this.bindings[mt.PRESENCE]&&this.bindings[mt.PRESENCE].length>0||((s=this.params.config.presence)===null||s===void 0?void 0:s.enabled)===!0,m={},f=Object.assign({broadcast:o,presence:Object.assign(Object.assign({},c),{enabled:p}),postgres_changes:u,private:l},d?{postgres_changes_options:d}:{});this.socket.accessTokenValue&&(m.access_token=this.socket.accessTokenValue),this._onError(_=>{e==null||e(Qe.CHANNEL_ERROR,ld(_))}),this._onClose(()=>e==null?void 0:e(Qe.CLOSED)),this.updateJoinPayload(Object.assign({config:f},m)),this._updateFilterMessage();const v=d!=null&&d.wait&&u.length>0?Math.max(a,((i=d.timeout)!==null&&i!==void 0?i:Ul)+Hl):a;this.channelAdapter.subscribe(v).receive("ok",async({postgres_changes:_})=>{if(this.socket._isManualToken()||this.socket.setAuth(),_===void 0){e==null||e(Qe.SUBSCRIBED);return}this._updatePostgresBindings(_,e)}).receive("error",_=>{this.state=it.errored;const w=Object.values(_).join(", ")||"error";e==null||e(Qe.CHANNEL_ERROR,new Error(w,{cause:_}))}).receive("timeout",()=>{e==null||e(Qe.TIMED_OUT)})}return this}_updatePostgresBindings(e,a){var r;const n=this.bindings.postgres_changes,s=(r=n==null?void 0:n.length)!==null&&r!==void 0?r:0,i=[];for(let o=0;o<s;o++){const c=n[o],{filter:{event:l,schema:d,table:u,filter:p}}=c,m=e&&e[o];if(m&&m.event===l&&Ye.isFilterValueEqual(m.schema,d)&&Ye.isFilterValueEqual(m.table,u)&&Ye.isFilterValueEqual(m.filter,p))i.push(Object.assign(Object.assign({},c),{id:m.id}));else{this.unsubscribe(),this.state=it.errored,a==null||a(Qe.CHANNEL_ERROR,new Error("mismatch between server and client bindings for postgres changes"));return}}this.bindings.postgres_changes=i,this.state!=it.errored&&a&&a(Qe.SUBSCRIBED)}presenceState(){return this.presence.state}async track(e,a={}){return await this.send({type:"presence",event:"track",payload:e},a)}async untrack(e={}){return await this.send({type:"presence",event:"untrack"},e)}on(e,a,r){const n=this.channelAdapter.isJoined()||this.channelAdapter.isJoining(),s=e===mt.PRESENCE||e===mt.POSTGRES_CHANGES;if(n&&s)throw this.socket.log("channel",`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`),new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);return this._on(e,a,r)}async httpSend(e,a,r={}){var n;if(a==null)return Promise.reject(new Error("Payload is required for httpSend()"));const s=a instanceof ArrayBuffer||ArrayBuffer.isView(a),i={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":s?"application/octet-stream":"application/json"};this.socket.accessTokenValue&&(i.Authorization=`Bearer ${this.socket.accessTokenValue}`);const o=new URL(this.broadcastEndpointURL);o.pathname+=`/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`,this.private&&o.searchParams.set("private","true");const c={method:"POST",headers:i,body:s?a:JSON.stringify(a)},l=await this._fetchWithTimeout(o.toString(),c,(n=r.timeout)!==null&&n!==void 0?n:this.timeout);if(l.status===202)return{success:!0};if(l.status===404)return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));let d=l.statusText;try{const u=await l.json();d=u.error||u.message||d}catch{}return Promise.reject(new Error(d))}async send(e,a={}){var r,n;if(!this.channelAdapter.canPush()&&e.type==="broadcast"){const s="Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";this.socket.hasLogger()?this.socket.log("channel",s):console.warn(s);const{event:i,payload:o}=e,c={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":"application/json"};this.socket.accessTokenValue&&(c.Authorization=`Bearer ${this.socket.accessTokenValue}`);const l={method:"POST",headers:c,body:JSON.stringify({messages:[{topic:this.subTopic,event:i,payload:o,private:this.private}]})};try{const d=await this._fetchWithTimeout(this.broadcastEndpointURL,l,(r=a.timeout)!==null&&r!==void 0?r:this.timeout);return await((n=d.body)===null||n===void 0?void 0:n.cancel()),d.ok?"ok":"error"}catch(d){return d instanceof Error&&d.name==="AbortError"?"timed out":"error"}}else return new Promise(s=>{var i,o,c;const l=this.channelAdapter.push(e.type,e,a.timeout||this.timeout);e.type==="broadcast"&&!(!((c=(o=(i=this.params)===null||i===void 0?void 0:i.config)===null||o===void 0?void 0:o.broadcast)===null||c===void 0)&&c.ack)&&s("ok"),l.receive("ok",()=>s("ok")),l.receive("error",()=>s("error")),l.receive("timeout",()=>s("timed out"))})}updateJoinPayload(e){this.channelAdapter.updateJoinPayload(e)}async unsubscribe(e=this.timeout){return new Promise(a=>{this.channelAdapter.unsubscribe(e).receive("ok",()=>a("ok")).receive("timeout",()=>a("timed out")).receive("error",()=>a("error"))})}teardown(){this.channelAdapter.teardown()}async _fetchWithTimeout(e,a,r){const n=new AbortController,s=setTimeout(()=>n.abort(),r),i=await this.socket.fetch(e,Object.assign(Object.assign({},a),{signal:n.signal}));return clearTimeout(s),i}_on(e,a,r){var n;const s=e.toLocaleLowerCase(),i=a==null?void 0:a.filter;if((i instanceof gd||typeof i=="object"&&i!==null&&typeof i.build=="function")&&(a=Object.assign(Object.assign({},a),{filter:i.build()})),s===mt.POSTGRES_CHANGES&&((n=this.bindings[s])===null||n===void 0?void 0:n.find(d=>Ye.isSamePostgresFilter(d.filter,a))))return this.socket.log("error",`duplicate \`postgres_changes\` binding for ${this.topic} ignored`,a),this;const o=this.channelAdapter.on(e,r),c={type:s,filter:a,callback:r,ref:o};return this.bindings[s]?this.bindings[s].push(c):this.bindings[s]=[c],this._updateFilterMessage(),this}_onClose(e){this.channelAdapter.onClose(e)}_onError(e){this.channelAdapter.onError(e)}_updateFilterMessage(){this.channelAdapter.updateFilterBindings((e,a,r)=>{var n,s,i,o,c,l,d;const u=e.event.toLocaleLowerCase();if(this._notThisChannelEvent(u,r))return!1;const p=(n=this.bindings[u])===null||n===void 0?void 0:n.find(m=>m.ref===e.ref);if(!p)return!0;if(["broadcast","presence","postgres_changes"].includes(u))if("id"in p){const m=p.id,f=(s=p.filter)===null||s===void 0?void 0:s.event;return m&&((i=a.ids)===null||i===void 0?void 0:i.includes(m))&&(f==="*"||(f==null?void 0:f.toLocaleLowerCase())===((o=a.data)===null||o===void 0?void 0:o.type.toLocaleLowerCase()))}else{const m=(l=(c=p==null?void 0:p.filter)===null||c===void 0?void 0:c.event)===null||l===void 0?void 0:l.toLocaleLowerCase();return m==="*"||m===((d=a==null?void 0:a.event)===null||d===void 0?void 0:d.toLocaleLowerCase())}else return p.type.toLocaleLowerCase()===u})}_notThisChannelEvent(e,a){const{close:r,error:n,leave:s,join:i}=Yi;return a&&[r,n,s,i].includes(e)&&a!==this.joinPush.ref}_updateFilterTransform(){this.channelAdapter.updatePayloadTransform((e,a,r)=>{if(typeof a=="object"&&"ids"in a){const n=a.data,{schema:s,table:i,commit_timestamp:o,type:c,errors:l}=n;return Object.assign(Object.assign({},{schema:s,table:i,commit_timestamp:o,eventType:c,new:{},old:{},errors:l}),this._getPayloadRecords(n))}return a})}copyBindings(e){if(this.joinedOnce)throw new Error("cannot copy bindings into joined channel");for(const a in e.bindings)for(const r of e.bindings[a])this._on(r.type,r.filter,r.callback)}static isFilterValueEqual(e,a){return(e??void 0)===(a??void 0)}static isSamePostgresFilter(e,a){var r,n,s,i;const o=(n=(r=e==null?void 0:e.select)===null||r===void 0?void 0:r.join())!==null&&n!==void 0?n:void 0,c=(i=(s=a==null?void 0:a.select)===null||s===void 0?void 0:s.join())!==null&&i!==void 0?i:void 0;return(e==null?void 0:e.event)===(a==null?void 0:a.event)&&Ye.isFilterValueEqual(e==null?void 0:e.schema,a==null?void 0:a.schema)&&Ye.isFilterValueEqual(e==null?void 0:e.table,a==null?void 0:a.table)&&Ye.isFilterValueEqual(e==null?void 0:e.filter,a==null?void 0:a.filter)&&o===c}_getPayloadRecords(e){const a={new:{},old:{}};return(e.type==="INSERT"||e.type==="UPDATE")&&(a.new=_s(e.columns,e.record)),(e.type==="UPDATE"||e.type==="DELETE")&&(a.old=_s(e.columns,e.old_record)),a}}class yd{constructor(e,a){this.socket=new sd(e,a)}get timeout(){return this.socket.timeout}get endPoint(){return this.socket.endPoint}get transport(){return this.socket.transport}get heartbeatIntervalMs(){return this.socket.heartbeatIntervalMs}get heartbeatCallback(){return this.socket.heartbeatCallback}set heartbeatCallback(e){this.socket.heartbeatCallback=e}get heartbeatTimer(){return this.socket.heartbeatTimer}get pendingHeartbeatRef(){return this.socket.pendingHeartbeatRef}get reconnectTimer(){return this.socket.reconnectTimer}get vsn(){return this.socket.vsn}get encode(){return this.socket.encode}get decode(){return this.socket.decode}get reconnectAfterMs(){return this.socket.reconnectAfterMs}get sendBuffer(){return this.socket.sendBuffer}get stateChangeCallbacks(){return this.socket.stateChangeCallbacks}connect(){this.socket.connect()}disconnect(e,a,r,n=1e4){return new Promise(s=>{setTimeout(()=>s("timeout"),n),this.socket.disconnect(()=>{e(),s("ok")},a,r)})}push(e){this.socket.push(e)}log(e,a,r){this.socket.log(e,a,r)}hasLogger(){return this.socket.hasLogger()}makeRef(){return this.socket.makeRef()}onOpen(e){this.socket.onOpen(e)}onClose(e){this.socket.onClose(e)}onError(e){this.socket.onError(e)}onMessage(e){this.socket.onMessage(e)}isConnected(){return this.socket.isConnected()}isConnecting(){return this.socket.connectionState()==_n.connecting}isDisconnecting(){return this.socket.connectionState()==_n.closing}connectionState(){return this.socket.connectionState()}endPointURL(){return this.socket.endPointURL()}sendHeartbeat(){this.socket.sendHeartbeat()}getSocket(){return this.socket}}const Es={HEARTBEAT_INTERVAL:25e3},_d=[1e3,2e3,5e3,1e4],bd=1e4;function wd(){const t=new Map;return{get length(){return t.size},clear(){t.clear()},getItem(e){return t.has(e)?t.get(e):null},key(e){var a;return(a=Array.from(t.keys())[e])!==null&&a!==void 0?a:null},removeItem(e){t.delete(e)},setItem(e,a){t.set(e,String(a))}}}function $d(){try{if(typeof globalThis<"u"&&globalThis.sessionStorage)return globalThis.sessionStorage}catch{}return wd()}const Sd=`
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;class Ed{get endPoint(){return this.socketAdapter.endPoint}get timeout(){return this.socketAdapter.timeout}get transport(){return this.socketAdapter.transport}get heartbeatCallback(){return this.socketAdapter.heartbeatCallback}get heartbeatIntervalMs(){return this.socketAdapter.heartbeatIntervalMs}get heartbeatTimer(){return this.worker?this._workerHeartbeatTimer:this.socketAdapter.heartbeatTimer}get pendingHeartbeatRef(){return this.worker?this._pendingWorkerHeartbeatRef:this.socketAdapter.pendingHeartbeatRef}get reconnectTimer(){return this.socketAdapter.reconnectTimer}get vsn(){return this.socketAdapter.vsn}get encode(){return this.socketAdapter.encode}get decode(){return this.socketAdapter.decode}get reconnectAfterMs(){return this.socketAdapter.reconnectAfterMs}get sendBuffer(){return this.socketAdapter.sendBuffer}get stateChangeCallbacks(){return this.socketAdapter.stateChangeCallbacks}constructor(e,a){var r;if(this.channels=new Array,this.accessTokenValue=null,this.accessToken=null,this.apiKey=null,this.httpEndpoint="",this.headers={},this.params={},this.ref=0,this.serializer=new Bl,this._manuallySetToken=!1,this._authPromise=null,this._authGeneration=0,this._workerHeartbeatTimer=void 0,this._pendingWorkerHeartbeatRef=null,this._pendingDisconnectTimer=null,this._disconnectOnEmptyChannelsAfterMs=0,this._resolveFetch=s=>s?(...i)=>s(...i):(...i)=>fetch(...i),!(!((r=a==null?void 0:a.params)===null||r===void 0)&&r.apikey))throw new Error("API key is required to connect to Realtime");this.apiKey=a.params.apikey;const n=this._initializeOptions(a);this.socketAdapter=new yd(e,n),this.httpEndpoint=Xi(e),this.fetch=this._resolveFetch(a==null?void 0:a.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.isConnected())){this.accessToken&&!this._authPromise&&this._setAuthSafely("connect"),this._setupConnectionHandlers();try{this.socketAdapter.connect()}catch(e){const a=e.message;throw new Error(`WebSocket not available: ${a}`)}this._handleNodeJsRaceCondition()}}endpointURL(){return this.socketAdapter.endPointURL()}async disconnect(e,a){return this._cancelPendingDisconnect(),this.isDisconnecting()?"ok":await this.socketAdapter.disconnect(()=>{clearInterval(this._workerHeartbeatTimer),this._terminateWorker()},e,a)}getChannels(){return this.channels}async removeChannel(e){const a=await e.unsubscribe();return a==="ok"&&e.teardown(),a}async removeAllChannels(){const e=this.channels.map(async r=>{const n=await r.unsubscribe();return r.teardown(),n}),a=await Promise.all(e);return await this.disconnect(),a}log(e,a,r){this.socketAdapter.log(e,a,r)}hasLogger(){return this.socketAdapter.hasLogger()}connectionState(){return this.socketAdapter.connectionState()||_n.closed}isConnected(){return this.socketAdapter.isConnected()}isConnecting(){return this.socketAdapter.isConnecting()}isDisconnecting(){return this.socketAdapter.isDisconnecting()}channel(e,a={config:{}}){const r=`realtime:${e}`,n=this.getChannels().find(s=>s.topic===r);if(n)return n;{const s=new Ye(`realtime:${e}`,a,this);return this._cancelPendingDisconnect(),this.channels.push(s),s}}push(e){this.socketAdapter.push(e)}async setAuth(e=null){const a=++this._authGeneration,r=this._performAuth(e,a);a===this._authGeneration&&(this._authPromise=r);try{await r}finally{this._authPromise===r&&(this._authPromise=null)}}_isManualToken(){return this._manuallySetToken}async sendHeartbeat(){this.socketAdapter.sendHeartbeat()}onHeartbeat(e){this.socketAdapter.heartbeatCallback=this._wrapHeartbeatCallback(e)}_makeRef(){return this.socketAdapter.makeRef()}_remove(e){this.channels=this.channels.filter(a=>a.topic!==e.topic),this.channels.length===0&&(this.log("transport","no channels remaining, scheduling disconnect"),this._schedulePendingDisconnect())}_schedulePendingDisconnect(){if(this._cancelPendingDisconnect(),this._disconnectOnEmptyChannelsAfterMs===0){this.log("transport","disconnecting immediately - no channels"),this.disconnect();return}this._pendingDisconnectTimer=setTimeout(()=>{this._pendingDisconnectTimer=null,this.channels.length===0&&(this.log("transport","deferred disconnect fired - no channels, disconnecting"),this.disconnect())},this._disconnectOnEmptyChannelsAfterMs),this.log("transport",`deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`)}_cancelPendingDisconnect(){this._pendingDisconnectTimer!==null&&(this.log("transport","pending disconnect cancelled - channel activity detected"),clearTimeout(this._pendingDisconnectTimer),this._pendingDisconnectTimer=null)}async _performAuth(e,a){let r,n=!1;if(e)r=e,n=!0;else if(this.accessToken)try{r=await this.accessToken()}catch(s){this.log("error","Error fetching access token from callback",s),r=this.accessTokenValue}else r=this.accessTokenValue;a===this._authGeneration&&(this.accessToken?this._manuallySetToken=!1:n&&(this._manuallySetToken=!0),this.accessTokenValue!=r&&(this.accessTokenValue=r,this.channels.forEach(s=>{const i={access_token:r,version:Ol};s.updateJoinPayload(i),s.joinedOnce&&s.channelAdapter.isJoined()&&s.channelAdapter.push(Yi.access_token,{access_token:r})})))}async _waitForAuthIfNeeded(){this._authPromise&&await this._authPromise}_setAuthSafely(e="general"){this._isManualToken()||this.setAuth().catch(a=>{this.log("error",`Error setting auth in ${e}`,a)})}_setupConnectionHandlers(){this.socketAdapter.onOpen(()=>{(this._authPromise||(this.accessToken&&!this.accessTokenValue?this.setAuth():Promise.resolve())).catch(a=>{this.log("error","error waiting for auth on connect",a)}),this.worker&&!this.workerRef&&this._startWorkerHeartbeat()}),this.socketAdapter.onClose(()=>{this.worker&&this.workerRef&&this._terminateWorker()}),this.socketAdapter.onMessage(e=>{e.ref&&e.ref===this._pendingWorkerHeartbeatRef&&(this._pendingWorkerHeartbeatRef=null)})}_handleNodeJsRaceCondition(){this.socketAdapter.isConnected()&&this.socketAdapter.getSocket().onConnOpen()}_wrapHeartbeatCallback(e){return(a,r)=>{a!=="disconnected"&&(a=="sent"&&this._setAuthSafely(),e&&e(a,r))}}_startWorkerHeartbeat(){this.workerUrl?this.log("worker",`starting worker for from ${this.workerUrl}`):this.log("worker","starting default worker");const e=this._workerObjectUrl(this.workerUrl);this.workerRef=new Worker(e),this.workerRef.onerror=a=>{this.log("worker","worker error",a.message),this._terminateWorker(),this.disconnect()},this.workerRef.onmessage=a=>{a.data.event==="keepAlive"&&this.sendHeartbeat()},this.workerRef.postMessage({event:"start",interval:this.heartbeatIntervalMs})}_terminateWorker(){this.workerRef&&(this.log("worker","terminating worker"),this.workerRef.terminate(),this.workerRef=void 0)}_workerObjectUrl(e){let a;if(e)a=e;else{const r=new Blob([Sd],{type:"application/javascript"});a=URL.createObjectURL(r)}return a}_initializeOptions(e){var a,r,n,s,i,o,c,l,d,u,p,m;this.worker=(a=e==null?void 0:e.worker)!==null&&a!==void 0?a:!1,this.accessToken=(r=e==null?void 0:e.accessToken)!==null&&r!==void 0?r:null;const f={};f.timeout=(n=e==null?void 0:e.timeout)!==null&&n!==void 0?n:Ml,f.heartbeatIntervalMs=(s=e==null?void 0:e.heartbeatIntervalMs)!==null&&s!==void 0?s:Es.HEARTBEAT_INTERVAL,this._disconnectOnEmptyChannelsAfterMs=(i=e==null?void 0:e.disconnectOnEmptyChannelsAfterMs)!==null&&i!==void 0?i:2*((o=e==null?void 0:e.heartbeatIntervalMs)!==null&&o!==void 0?o:Es.HEARTBEAT_INTERVAL),f.transport=(c=e==null?void 0:e.transport)!==null&&c!==void 0?c:Nl.getWebSocketConstructor(),f.params=e==null?void 0:e.params,f.logger=e==null?void 0:e.logger,f.heartbeatCallback=this._wrapHeartbeatCallback(e==null?void 0:e.heartbeatCallback),f.sessionStorage=(l=e==null?void 0:e.sessionStorage)!==null&&l!==void 0?l:$d(),f.reconnectAfterMs=(d=e==null?void 0:e.reconnectAfterMs)!==null&&d!==void 0?d:(k=>_d[k-1]||bd);let v,_;const w=(u=e==null?void 0:e.vsn)!==null&&u!==void 0?u:Dl;switch(w){case jl:v=(k,S)=>S(JSON.stringify(k)),_=(k,S)=>S(JSON.parse(k));break;case Qi:v=this.serializer.encode.bind(this.serializer),_=this.serializer.decode.bind(this.serializer);break;default:throw new Error(`Unsupported serializer version: ${f.vsn}`)}if(f.vsn=w,f.encode=(p=e==null?void 0:e.encode)!==null&&p!==void 0?p:v,f.decode=(m=e==null?void 0:e.decode)!==null&&m!==void 0?m:_,f.beforeReconnect=this._reconnectAuth.bind(this),(e!=null&&e.logLevel||e!=null&&e.log_level)&&(this.logLevel=e.logLevel||e.log_level,f.params=Object.assign(Object.assign({},f.params),{log_level:this.logLevel})),this.worker){if(typeof window<"u"&&!window.Worker)throw new Error("Web Worker is not supported");this.workerUrl=e==null?void 0:e.workerUrl,f.autoSendHeartbeat=!this.worker}return f}async _reconnectAuth(){await this._waitForAuthIfNeeded(),this.isConnected()||this.connect()}}var $a=class extends Error{constructor(t,e){var a;super(t),this.name="IcebergError",this.status=e.status,this.icebergType=e.icebergType,this.icebergCode=e.icebergCode,this.details=e.details,this.isCommitStateUnknown=e.icebergType==="CommitStateUnknownException"||[500,502,504].includes(e.status)&&((a=e.icebergType)==null?void 0:a.includes("CommitState"))===!0}isNotFound(){return this.status===404}isConflict(){return this.status===409}isAuthenticationTimeout(){return this.status===419}};function kd(t,e,a){const r=new URL(e,t);if(a)for(const[n,s]of Object.entries(a))s!==void 0&&r.searchParams.set(n,s);return r.toString()}async function Ad(t){return!t||t.type==="none"?{}:t.type==="bearer"?{Authorization:`Bearer ${t.token}`}:t.type==="header"?{[t.name]:t.value}:t.type==="custom"?await t.getHeaders():{}}function Cd(t){const e=t.fetchImpl??globalThis.fetch;return{async request({method:a,path:r,query:n,body:s,headers:i}){const o=kd(t.baseUrl,r,n),c=await Ad(t.auth),l=await e(o,{method:a,headers:{...s?{"Content-Type":"application/json"}:{},...c,...i},body:s?JSON.stringify(s):void 0}),d=await l.text(),u=(l.headers.get("content-type")||"").includes("application/json"),p=u&&d?JSON.parse(d):d;if(!l.ok){const m=u?p:void 0,f=m==null?void 0:m.error;throw new $a((f==null?void 0:f.message)??`Request failed with status ${l.status}`,{status:l.status,icebergType:f==null?void 0:f.type,icebergCode:f==null?void 0:f.code,details:m})}return{status:l.status,headers:l.headers,data:p}}}}function Va(t){return t.join("")}var Td=class{constructor(t,e=""){this.client=t,this.prefix=e}async listNamespaces(t){const e=t?{parent:Va(t.namespace)}:void 0;return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces`,query:e})).data.namespaces.map(r=>({namespace:r}))}async createNamespace(t,e){const a={namespace:t.namespace,properties:e==null?void 0:e.properties};return(await this.client.request({method:"POST",path:`${this.prefix}/namespaces`,body:a})).data}async dropNamespace(t){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${Va(t.namespace)}`})}async loadNamespaceMetadata(t){return{properties:(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Va(t.namespace)}`})).data.properties}}async namespaceExists(t){try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${Va(t.namespace)}`}),!0}catch(e){if(e instanceof $a&&e.status===404)return!1;throw e}}async createNamespaceIfNotExists(t,e){try{return await this.createNamespace(t,e)}catch(a){if(a instanceof $a&&a.status===409)return;throw a}}};function Pt(t){return t.join("")}var Ld=class{constructor(t,e="",a){this.client=t,this.prefix=e,this.accessDelegation=a}async listTables(t){return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables`})).data.identifiers}async createTable(t,e){const a={};return this.accessDelegation&&(a["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables`,body:e,headers:a})).data.metadata}async updateTable(t,e){const a=await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables/${t.name}`,body:e});return{"metadata-location":a.data["metadata-location"],metadata:a.data.metadata}}async dropTable(t,e){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables/${t.name}`,query:{purgeRequested:String((e==null?void 0:e.purge)??!1)}})}async loadTable(t){const e={};return this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables/${t.name}`,headers:e})).data.metadata}async tableExists(t){const e={};this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation);try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${Pt(t.namespace)}/tables/${t.name}`,headers:e}),!0}catch(a){if(a instanceof $a&&a.status===404)return!1;throw a}}async createTableIfNotExists(t,e){try{return await this.createTable(t,e)}catch(a){if(a instanceof $a&&a.status===409)return await this.loadTable({namespace:t.namespace,name:e.name});throw a}}},Rd=class{constructor(t){var r;let e="v1";t.catalogName&&(e+=`/${t.catalogName}`);const a=t.baseUrl.endsWith("/")?t.baseUrl:`${t.baseUrl}/`;this.client=Cd({baseUrl:a,auth:t.auth,fetchImpl:t.fetch}),this.accessDelegation=(r=t.accessDelegation)==null?void 0:r.join(","),this.namespaceOps=new Td(this.client,e),this.tableOps=new Ld(this.client,e,this.accessDelegation)}async listNamespaces(t){return this.namespaceOps.listNamespaces(t)}async createNamespace(t,e){return this.namespaceOps.createNamespace(t,e)}async dropNamespace(t){await this.namespaceOps.dropNamespace(t)}async loadNamespaceMetadata(t){return this.namespaceOps.loadNamespaceMetadata(t)}async listTables(t){return this.tableOps.listTables(t)}async createTable(t,e){return this.tableOps.createTable(t,e)}async updateTable(t,e){return this.tableOps.updateTable(t,e)}async dropTable(t,e){await this.tableOps.dropTable(t,e)}async loadTable(t){return this.tableOps.loadTable(t)}async namespaceExists(t){return this.namespaceOps.namespaceExists(t)}async tableExists(t){return this.tableOps.tableExists(t)}async createNamespaceIfNotExists(t,e){return this.namespaceOps.createNamespaceIfNotExists(t,e)}async createTableIfNotExists(t,e){return this.tableOps.createTableIfNotExists(t,e)}};function Sa(t){"@babel/helpers - typeof";return Sa=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Sa(t)}function Pd(t,e){if(Sa(t)!="object"||!t)return t;var a=t[Symbol.toPrimitive];if(a!==void 0){var r=a.call(t,e);if(Sa(r)!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function qd(t){var e=Pd(t,"string");return Sa(e)=="symbol"?e:e+""}function xd(t,e,a){return(e=qd(e))in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function ks(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(n){return Object.getOwnPropertyDescriptor(t,n).enumerable})),a.push.apply(a,r)}return a}function G(t){for(var e=1;e<arguments.length;e++){var a=arguments[e]!=null?arguments[e]:{};e%2?ks(Object(a),!0).forEach(function(r){xd(t,r,a[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):ks(Object(a)).forEach(function(r){Object.defineProperty(t,r,Object.getOwnPropertyDescriptor(a,r))})}return t}var qr=class extends Error{constructor(t,e="storage",a,r){super(t),this.__isStorageError=!0,this.namespace=e,this.name=e==="vectors"?"StorageVectorsError":"StorageError",this.status=a,this.statusCode=r}toJSON(){return{name:this.name,message:this.message,status:this.status,statusCode:this.statusCode}}};function xr(t){return typeof t=="object"&&t!==null&&"__isStorageError"in t}var Sn=class extends qr{constructor(t,e,a,r="storage",n){super(t,r,e,a),this.name=r==="vectors"?"StorageVectorsApiError":"StorageApiError",this.status=e,this.statusCode=a,this.code=n}toJSON(){return G(G({},super.toJSON()),{},{code:this.code})}},to=class extends qr{constructor(t,e,a="storage"){super(t,a),this.name=a==="vectors"?"StorageVectorsUnknownError":"StorageUnknownError",this.originalError=e}};function cr(t,e,a){const r=G({},t),n=e.toLowerCase();for(const s of Object.keys(r))s.toLowerCase()===n&&delete r[s];return r[n]=a,r}function Nd(t){const e={};for(const[a,r]of Object.entries(t))e[a.toLowerCase()]=r;return e}const Id=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),Od=t=>{if(typeof t!="object"||t===null)return!1;const e=Object.getPrototypeOf(t);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in t)&&!(Symbol.iterator in t)},En=t=>{if(Array.isArray(t))return t.map(a=>En(a));if(typeof t=="function"||t!==Object(t))return t;const e={};return Object.entries(t).forEach(([a,r])=>{const n=a.replace(/([-_][a-z])/gi,s=>s.toUpperCase().replace(/[-_]/g,""));e[n]=En(r)}),e},jd=t=>!t||typeof t!="string"||t.length===0||t.length>100||t.trim()!==t||t.includes("/")||t.includes("\\")?!1:/^[\w!.\*'() &$@=;:+,?-]+$/.test(t),kn=t=>t.split("/").map(encodeURIComponent).join("/"),As=t=>{if(typeof t=="object"&&t!==null){const e=t;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error;if(typeof e.error=="object"&&e.error!==null){const a=e.error;if(typeof a.message=="string")return a.message}}return JSON.stringify(t)},Dd=async(t,e,a,r)=>{if(t!==null&&typeof t=="object"&&"json"in t&&typeof t.json=="function"){const n=t;let s=parseInt(String(n.status),10);Number.isFinite(s)||(s=500),n.json().then(i=>{const o=(i==null?void 0:i.statusCode)||(i==null?void 0:i.code)||s+"";e(new Sn(As(i),s,o,r,i==null?void 0:i.code))}).catch(()=>{const i=s+"";e(new Sn(n.statusText||`HTTP ${s} error`,s,i,r))})}else e(new to(As(t),t,r))},Md=(t,e,a,r)=>{const n={method:t,headers:(e==null?void 0:e.headers)||{}};if(t==="GET"||t==="HEAD"||!r)return G(G({},n),a);if(Od(r)){var s;const i=(e==null?void 0:e.headers)||{};let o;for(const[c,l]of Object.entries(i))c.toLowerCase()==="content-type"&&(o=l);n.headers=cr(i,"Content-Type",(s=o)!==null&&s!==void 0?s:"application/json"),n.body=JSON.stringify(r)}else n.body=r;return e!=null&&e.duplex&&(n.duplex=e.duplex),G(G({},n),a)};async function sa(t,e,a,r,n,s,i){return new Promise((o,c)=>{t(a,Md(e,r,n,s)).then(l=>{if(!l.ok)throw l;if(r!=null&&r.noResolveJson)return l;if(i==="vectors"){const d=l.headers.get("content-type");if(l.headers.get("content-length")==="0"||l.status===204)return{};if(!d||!d.includes("application/json"))return{}}return l.json()}).then(l=>o(l)).catch(l=>Dd(l,c,r,i))})}function ao(t="storage"){return{get:async(e,a,r,n)=>sa(e,"GET",a,r,n,void 0,t),post:async(e,a,r,n,s)=>sa(e,"POST",a,n,s,r,t),put:async(e,a,r,n,s)=>sa(e,"PUT",a,n,s,r,t),head:async(e,a,r,n)=>sa(e,"HEAD",a,G(G({},r),{},{noResolveJson:!0}),n,void 0,t),remove:async(e,a,r,n,s)=>sa(e,"DELETE",a,n,s,r,t)}}const Ud=ao("storage"),{get:Bt,post:Pe,put:lr,head:Hd,remove:zt}=Ud,$e=ao("vectors");var Qt=class{constructor(t,e={},a,r="storage"){this.shouldThrowOnError=!1,this.url=t,this.headers=Nd(e),this.fetch=Id(a),this.namespace=r}throwOnError(){return this.shouldThrowOnError=!0,this}setHeader(t,e){return this.headers=cr(this.headers,t,e),this}async handleOperation(t){var e=this;try{return{data:await t(),error:null}}catch(a){if(e.shouldThrowOnError)throw a;if(xr(a))return{data:null,error:a};throw a}}};let ro;ro=Symbol.toStringTag;var Fd=class{constructor(t,e){this.downloadFn=t,this.shouldThrowOnError=e,this[ro]="StreamDownloadBuilder",this.promise=null}then(t,e){return this.getPromise().then(t,e)}catch(t){return this.getPromise().catch(t)}finally(t){return this.getPromise().finally(t)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var t=this;try{return{data:(await t.downloadFn()).body,error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(xr(e))return{data:null,error:e};throw e}}};let no;no=Symbol.toStringTag;var Bd=class{constructor(t,e){this.downloadFn=t,this.shouldThrowOnError=e,this[no]="BlobDownloadBuilder",this.promise=null}asStream(){return new Fd(this.downloadFn,this.shouldThrowOnError)}then(t,e){return this.getPromise().then(t,e)}catch(t){return this.getPromise().catch(t)}finally(t){return this.getPromise().finally(t)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var t=this;try{return{data:await(await t.downloadFn()).blob(),error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(xr(e))return{data:null,error:e};throw e}}};const Zr={limit:100,offset:0,sortBy:{column:"name",order:"asc"}},Cs={cacheControl:"3600",contentType:"text/plain;charset=UTF-8",upsert:!1};var zd=class extends Qt{constructor(t,e={},a,r){super(t,e,r,"storage"),this.bucketId=a}async uploadOrUpdate(t,e,a,r){var n=this;return n.handleOperation(async()=>{let s;const i=G(G({},Cs),r);let o=G(G({},n.headers),t==="POST"&&{"x-upsert":String(i.upsert)});const c=i.metadata;if(typeof Blob<"u"&&a instanceof Blob?(s=new FormData,s.append("cacheControl",i.cacheControl),c&&s.append("metadata",n.encodeMetadata(c)),s.append("",a)):typeof FormData<"u"&&a instanceof FormData?(s=a,s.has("cacheControl")||s.append("cacheControl",i.cacheControl),c&&!s.has("metadata")&&s.append("metadata",n.encodeMetadata(c))):(s=a,o["cache-control"]=`max-age=${i.cacheControl}`,o["content-type"]=i.contentType,c&&(o["x-metadata"]=n.toBase64(n.encodeMetadata(c))),(typeof ReadableStream<"u"&&s instanceof ReadableStream||s&&typeof s=="object"&&"pipe"in s&&typeof s.pipe=="function")&&!i.duplex&&(i.duplex="half")),r!=null&&r.headers)for(const[p,m]of Object.entries(r.headers))o=cr(o,p,m);const l=n._removeEmptyFolders(e),d=n._getFinalPath(l),u=await(t=="PUT"?lr:Pe)(n.fetch,`${n.url}/object/${d}`,s,G({headers:o},i!=null&&i.duplex?{duplex:i.duplex}:{}));return{path:l,id:u.Id,fullPath:u.Key}})}async upload(t,e,a){return this.uploadOrUpdate("POST",t,e,a)}async uploadToSignedUrl(t,e,a,r){var n=this;const s=n._removeEmptyFolders(t),i=n._getFinalPath(s),o=new URL(n.url+`/object/upload/sign/${i}`);return o.searchParams.set("token",e),n.handleOperation(async()=>{let c;const l=G(G({},Cs),r);let d=G(G({},n.headers),{"x-upsert":String(l.upsert)});const u=l.metadata;if(typeof Blob<"u"&&a instanceof Blob?(c=new FormData,c.append("cacheControl",l.cacheControl),u&&c.append("metadata",n.encodeMetadata(u)),c.append("",a)):typeof FormData<"u"&&a instanceof FormData?(c=a,c.has("cacheControl")||c.append("cacheControl",l.cacheControl),u&&!c.has("metadata")&&c.append("metadata",n.encodeMetadata(u))):(c=a,d["cache-control"]=`max-age=${l.cacheControl}`,d["content-type"]=l.contentType,u&&(d["x-metadata"]=n.toBase64(n.encodeMetadata(u))),(typeof ReadableStream<"u"&&c instanceof ReadableStream||c&&typeof c=="object"&&"pipe"in c&&typeof c.pipe=="function")&&!l.duplex&&(l.duplex="half")),r!=null&&r.headers)for(const[p,m]of Object.entries(r.headers))d=cr(d,p,m);return{path:s,fullPath:(await lr(n.fetch,o.toString(),c,G({headers:d},l!=null&&l.duplex?{duplex:l.duplex}:{}))).Key}})}async createSignedUploadUrl(t,e){var a=this;return a.handleOperation(async()=>{let r=a._getFinalPath(t);const n=G({},a.headers);e!=null&&e.upsert&&(n["x-upsert"]="true");const s=await Pe(a.fetch,`${a.url}/object/upload/sign/${r}`,{},{headers:n}),i=new URL(a.url+s.url),o=i.searchParams.get("token");if(!o)throw new qr("No token returned by API");return{signedUrl:i.toString(),path:t,token:o}})}async update(t,e,a){return this.uploadOrUpdate("PUT",t,e,a)}async move(t,e,a){var r=this;return r.handleOperation(async()=>await Pe(r.fetch,`${r.url}/object/move`,{bucketId:r.bucketId,sourceKey:t,destinationKey:e,destinationBucket:a==null?void 0:a.destinationBucket,sourceVersionId:a==null?void 0:a.sourceVersionId},{headers:r.headers}))}async copy(t,e,a){var r=this;return r.handleOperation(async()=>({path:(await Pe(r.fetch,`${r.url}/object/copy`,{bucketId:r.bucketId,sourceKey:t,destinationKey:e,destinationBucket:a==null?void 0:a.destinationBucket,sourceVersionId:a==null?void 0:a.sourceVersionId},{headers:r.headers})).Key}))}async createSignedUrl(t,e,a){var r=this;return r.handleOperation(async()=>{let n=r._getFinalPath(t);const s=typeof(a==null?void 0:a.transform)=="object"&&a.transform!==null&&Object.keys(a.transform).length>0;let i=await Pe(r.fetch,`${r.url}/object/sign/${n}`,G(G({expiresIn:e},s?{transform:a.transform}:{}),(a==null?void 0:a.versionId)!=null?{versionId:a.versionId}:{}),{headers:r.headers});const o=new URLSearchParams;a!=null&&a.download&&o.set("download",a.download===!0?"":a.download),(a==null?void 0:a.cacheNonce)!=null&&o.set("cacheNonce",String(a.cacheNonce));const c=o.toString();return{signedUrl:encodeURI(`${r.url}${i.signedURL}${c?`&${c}`:""}`)}})}async createSignedUrls(t,e,a){var r=this;return r.handleOperation(async()=>{const n=await Pe(r.fetch,`${r.url}/object/sign/${r.bucketId}`,{expiresIn:e,paths:t},{headers:r.headers}),s=new URLSearchParams;a!=null&&a.download&&s.set("download",a.download===!0?"":a.download),(a==null?void 0:a.cacheNonce)!=null&&s.set("cacheNonce",String(a.cacheNonce));const i=s.toString();return n.map(o=>G(G({},o),{},{signedUrl:o.signedURL?encodeURI(`${r.url}${o.signedURL}${i?`&${i}`:""}`):null}))})}download(t,e,a){const r=typeof(e==null?void 0:e.transform)=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image/authenticated":"object",n=new URLSearchParams;e!=null&&e.transform&&this.applyTransformOptsToQuery(n,e.transform),(e==null?void 0:e.cacheNonce)!=null&&n.set("cacheNonce",String(e.cacheNonce)),(e==null?void 0:e.versionId)!=null&&n.set("versionId",String(e.versionId));const s=n.toString(),i=this._getFinalPath(t),o=()=>Bt(this.fetch,`${this.url}/${r}/${i}${s?`?${s}`:""}`,{headers:this.headers,noResolveJson:!0},a);return new Bd(o,this.shouldThrowOnError)}async info(t,e){var a=this;const r=a._getFinalPath(t),n=new URLSearchParams;(e==null?void 0:e.versionId)!=null&&n.set("versionId",String(e.versionId));const s=n.toString();return a.handleOperation(async()=>En(await Bt(a.fetch,`${a.url}/object/info/${r}${s?`?${s}`:""}`,{headers:a.headers})))}async exists(t){var e=this;const a=e._getFinalPath(t);try{return await Hd(e.fetch,`${e.url}/object/${a}`,{headers:e.headers}),{data:!0,error:null}}catch(n){if(e.shouldThrowOnError)throw n;if(xr(n)){var r;const s=n instanceof Sn?n.status:n instanceof to?(r=n.originalError)===null||r===void 0?void 0:r.status:void 0;if(s!==void 0&&[400,404].includes(s))return{data:!1,error:n}}throw n}}getPublicUrl(t,e){const a=this._getFinalPath(t),r=new URLSearchParams;e!=null&&e.download&&r.set("download",e.download===!0?"":e.download),e!=null&&e.transform&&this.applyTransformOptsToQuery(r,e.transform),(e==null?void 0:e.cacheNonce)!=null&&r.set("cacheNonce",String(e.cacheNonce)),(e==null?void 0:e.versionId)!=null&&r.set("versionId",String(e.versionId));const n=r.toString(),s=typeof(e==null?void 0:e.transform)=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image":"object";return{data:{publicUrl:encodeURI(`${this.url}/${s}/public/${a}`)+(n?`?${n}`:"")}}}async remove(t){var e=this;return e.handleOperation(async()=>await zt(e.fetch,`${e.url}/object/${e.bucketId}`,{prefixes:t},{headers:e.headers}))}async purgeCache(t,e,a){var r=this;return r.handleOperation(async()=>{const n=kn(r._getFinalPath(t)),s=new URLSearchParams;e!=null&&e.transformations&&s.set("transformations","true");const i=s.toString();return await zt(r.fetch,`${r.url}/cdn/${n}${i?`?${i}`:""}`,{},{headers:r.headers},a)})}async list(t,e,a){var r=this;return r.handleOperation(async()=>{const n=e!=null&&e.sortBy?G(G({},Zr.sortBy),e.sortBy):Zr.sortBy,s=G(G(G({},Zr),e),{},{sortBy:n,prefix:t||""});return await Pe(r.fetch,`${r.url}/object/list/${r.bucketId}`,s,{headers:r.headers},a)})}async listV2(t,e){var a=this;return a.handleOperation(async()=>{const r=G({},t);return await Pe(a.fetch,`${a.url}/object/list-v2/${a.bucketId}`,r,{headers:a.headers},e)})}encodeMetadata(t){return JSON.stringify(t)}toBase64(t){return typeof Buffer<"u"?Buffer.from(t).toString("base64"):btoa(t)}_getFinalPath(t){return`${this.bucketId}/${t.replace(/^\/+/,"")}`}_removeEmptyFolders(t){return t.replace(/^\/|\/$/g,"").replace(/\/+/g,"/")}applyTransformOptsToQuery(t,e){return e.width&&t.set("width",e.width.toString()),e.height&&t.set("height",e.height.toString()),e.resize&&t.set("resize",e.resize),e.format&&t.set("format",e.format),e.quality&&t.set("quality",e.quality.toString()),t}};const Vd="2.116.0",qa={"X-Client-Info":`storage-js/${Vd}`};var Wd=class extends Qt{constructor(t,e={},a,r){const n=new URL(t);r!=null&&r.useNewHostname&&/supabase\.(co|in|red)$/.test(n.hostname)&&!n.hostname.includes("storage.supabase.")&&(n.hostname=n.hostname.replace("supabase.","storage.supabase."));const s=n.href.replace(/\/$/,""),i=G(G({},qa),e);super(s,i,a,"storage")}async listBuckets(t){var e=this;return e.handleOperation(async()=>{const a=e.listBucketOptionsToQueryString(t);return await Bt(e.fetch,`${e.url}/bucket${a}`,{headers:e.headers})})}async getBucket(t){var e=this;return e.handleOperation(async()=>await Bt(e.fetch,`${e.url}/bucket/${t}`,{headers:e.headers}))}async createBucket(t,e={public:!1}){var a=this;return a.handleOperation(async()=>await Pe(a.fetch,`${a.url}/bucket`,{id:t,name:t,type:e.type,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes,versioning_status:e.versioningStatus},{headers:a.headers}))}async updateBucket(t,e){var a=this;return a.handleOperation(async()=>await lr(a.fetch,`${a.url}/bucket/${t}`,{id:t,name:t,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes,versioning_status:e.versioningStatus},{headers:a.headers}))}async emptyBucket(t){var e=this;return e.handleOperation(async()=>await Pe(e.fetch,`${e.url}/bucket/${t}/empty`,{},{headers:e.headers}))}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await zt(e.fetch,`${e.url}/bucket/${t}`,{},{headers:e.headers}))}async getBucketLifecycle(t){var e=this;return e.handleOperation(async()=>await Bt(e.fetch,e.bucketLifecycleUrl(t),{headers:e.headers}))}async updateBucketLifecycle(t,e){var a=this;return a.handleOperation(async()=>await lr(a.fetch,a.bucketLifecycleUrl(t),e,{headers:a.headers}))}async deleteBucketLifecycle(t){var e=this;return e.handleOperation(async()=>await zt(e.fetch,e.bucketLifecycleUrl(t),{},{headers:e.headers}))}async purgeBucketCache(t,e,a){var r=this;return r.handleOperation(async()=>{const n=new URLSearchParams;e!=null&&e.transformations&&n.set("transformations","true");const s=n.toString();return await zt(r.fetch,`${r.url}/cdn/${kn(t)}${s?`?${s}`:""}`,{},{headers:r.headers},a)})}bucketLifecycleUrl(t){return`${this.url}/bucket/${kn(t)}/lifecycle`}listBucketOptionsToQueryString(t){const e={};return t&&("limit"in t&&(e.limit=String(t.limit)),"offset"in t&&(e.offset=String(t.offset)),t.search&&(e.search=t.search),t.sortColumn&&(e.sortColumn=t.sortColumn),t.sortOrder&&(e.sortOrder=t.sortOrder)),Object.keys(e).length>0?"?"+new URLSearchParams(e).toString():""}},Gd=class extends Qt{constructor(t,e={},a){const r=t.replace(/\/$/,""),n=G(G({},qa),e);super(r,n,a,"storage")}async createBucket(t){var e=this;return e.handleOperation(async()=>await Pe(e.fetch,`${e.url}/bucket`,{name:t},{headers:e.headers}))}async listBuckets(t){var e=this;return e.handleOperation(async()=>{const a=new URLSearchParams;(t==null?void 0:t.limit)!==void 0&&a.set("limit",t.limit.toString()),(t==null?void 0:t.offset)!==void 0&&a.set("offset",t.offset.toString()),t!=null&&t.sortColumn&&a.set("sortColumn",t.sortColumn),t!=null&&t.sortOrder&&a.set("sortOrder",t.sortOrder),t!=null&&t.search&&a.set("search",t.search);const r=a.toString(),n=r?`${e.url}/bucket?${r}`:`${e.url}/bucket`;return await Bt(e.fetch,n,{headers:e.headers})})}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await zt(e.fetch,`${e.url}/bucket/${t}`,{},{headers:e.headers}))}from(t){var e=this;if(!jd(t))throw new qr("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");const a=new Rd({baseUrl:this.url,catalogName:t,auth:{type:"custom",getHeaders:async()=>e.headers},fetch:this.fetch}),r=this.shouldThrowOnError;return new Proxy(a,{get(n,s){const i=n[s];return typeof i!="function"?i:async(...o)=>{try{return{data:await i.apply(n,o),error:null}}catch(c){if(r)throw c;return{data:null,error:c}}}}})}},Kd=class extends Qt{constructor(t,e={},a){const r=t.replace(/\/$/,""),n=G(G({},qa),{},{"Content-Type":"application/json"},e);super(r,n,a,"vectors")}async createIndex(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/CreateIndex`,t,{headers:e.headers})||{})}async getIndex(t,e){var a=this;return a.handleOperation(async()=>await $e.post(a.fetch,`${a.url}/GetIndex`,{vectorBucketName:t,indexName:e},{headers:a.headers}))}async listIndexes(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/ListIndexes`,t,{headers:e.headers}))}async deleteIndex(t,e){var a=this;return a.handleOperation(async()=>await $e.post(a.fetch,`${a.url}/DeleteIndex`,{vectorBucketName:t,indexName:e},{headers:a.headers})||{})}},Jd=class extends Qt{constructor(t,e={},a){const r=t.replace(/\/$/,""),n=G(G({},qa),{},{"Content-Type":"application/json"},e);super(r,n,a,"vectors")}async putVectors(t){var e=this;if(t.vectors.length<1||t.vectors.length>500)throw new Error("Vector batch size must be between 1 and 500 items");return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/PutVectors`,t,{headers:e.headers})||{})}async getVectors(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/GetVectors`,t,{headers:e.headers}))}async listVectors(t){var e=this;if(t.segmentCount!==void 0){if(t.segmentCount<1||t.segmentCount>16)throw new Error("segmentCount must be between 1 and 16");if(t.segmentIndex!==void 0&&(t.segmentIndex<0||t.segmentIndex>=t.segmentCount))throw new Error(`segmentIndex must be between 0 and ${t.segmentCount-1}`)}return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/ListVectors`,t,{headers:e.headers}))}async queryVectors(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/QueryVectors`,t,{headers:e.headers}))}async deleteVectors(t){var e=this;if(t.keys.length<1||t.keys.length>500)throw new Error("Keys batch size must be between 1 and 500 items");return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/DeleteVectors`,t,{headers:e.headers})||{})}},Qd=class extends Qt{constructor(t,e={},a){const r=t.replace(/\/$/,""),n=G(G({},qa),{},{"Content-Type":"application/json"},e);super(r,n,a,"vectors")}async createBucket(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/CreateVectorBucket`,{vectorBucketName:t},{headers:e.headers})||{})}async getBucket(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/GetVectorBucket`,{vectorBucketName:t},{headers:e.headers}))}async listBuckets(t={}){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/ListVectorBuckets`,t,{headers:e.headers}))}async deleteBucket(t){var e=this;return e.handleOperation(async()=>await $e.post(e.fetch,`${e.url}/DeleteVectorBucket`,{vectorBucketName:t},{headers:e.headers})||{})}},Yd=class extends Qd{constructor(t,e={}){super(t,e.headers||{},e.fetch)}from(t){return new Zd(this.url,this.headers,t,this.fetch)}async createBucket(t){var e=()=>super.createBucket,a=this;return e().call(a,t)}async getBucket(t){var e=()=>super.getBucket,a=this;return e().call(a,t)}async listBuckets(t={}){var e=()=>super.listBuckets,a=this;return e().call(a,t)}async deleteBucket(t){var e=()=>super.deleteBucket,a=this;return e().call(a,t)}},Zd=class extends Kd{constructor(t,e,a,r){super(t,e,r),this.vectorBucketName=a}async createIndex(t){var e=()=>super.createIndex,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName}))}async listIndexes(t={}){var e=()=>super.listIndexes,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName}))}async getIndex(t){var e=()=>super.getIndex,a=this;return e().call(a,a.vectorBucketName,t)}async deleteIndex(t){var e=()=>super.deleteIndex,a=this;return e().call(a,a.vectorBucketName,t)}index(t){return new Xd(this.url,this.headers,this.vectorBucketName,t,this.fetch)}},Xd=class extends Jd{constructor(t,e,a,r,n){super(t,e,n),this.vectorBucketName=a,this.indexName=r}async putVectors(t){var e=()=>super.putVectors,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName,indexName:a.indexName}))}async getVectors(t){var e=()=>super.getVectors,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName,indexName:a.indexName}))}async listVectors(t={}){var e=()=>super.listVectors,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName,indexName:a.indexName}))}async queryVectors(t){var e=()=>super.queryVectors,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName,indexName:a.indexName}))}async deleteVectors(t){var e=()=>super.deleteVectors,a=this;return e().call(a,G(G({},t),{},{vectorBucketName:a.vectorBucketName,indexName:a.indexName}))}},eu=class extends Wd{constructor(t,e={},a,r){super(t,e,a,r)}from(t){return new zd(this.url,this.headers,t,this.fetch)}get vectors(){return new Yd(this.url+"/vector",{headers:this.headers,fetch:this.fetch})}get analytics(){return new Gd(this.url+"/iceberg",this.headers,this.fetch)}};const so="2.116.0",Ze=30*1e3,ma=3,Xr=ma*Ze,tu=2*Ze,au="http://localhost:9999",ru="supabase.auth.token",nu={"X-Client-Info":`gotrue-js/${so}`},An="X-Supabase-Api-Version",io={"2024-01-01":{timestamp:Date.parse("2024-01-01T00:00:00.0Z"),name:"2024-01-01"}},su=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i,vt="sb_flow_id",iu=5,ou=600*1e3;class Ea extends Error{constructor(e,a,r){super(e),this.__isAuthError=!0,this.name="AuthError",this.status=a,this.code=r}toJSON(){return{name:this.name,message:this.message,status:this.status,code:this.code}}}function U(t){return typeof t=="object"&&t!==null&&"__isAuthError"in t}class cu extends Ea{constructor(e,a,r){super(e,a,r),this.name="AuthApiError",this.status=a,this.code=r}}function Ts(t){return U(t)&&t.name==="AuthApiError"}class qe extends Ea{constructor(e,a){super(e),this.name="AuthUnknownError",this.originalError=a}}class He extends Ea{constructor(e,a,r,n){super(e,r,n),this.name=a,this.status=r}}class he extends He{constructor(){super("Auth session missing!","AuthSessionMissingError",400,void 0)}}function Wa(t){return U(t)&&t.name==="AuthSessionMissingError"}class qt extends He{constructor(){super("Auth session or user missing","AuthInvalidTokenResponseError",500,void 0)}}class Ga extends He{constructor(e){super(e,"AuthInvalidCredentialsError",400,void 0)}}class Ka extends He{constructor(e,a=null){super(e,"AuthImplicitGrantRedirectError",500,void 0),this.details=null,this.details=a}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}}function lu(t){return U(t)&&t.name==="AuthImplicitGrantRedirectError"}class Ls extends He{constructor(e,a=null){super(e,"AuthPKCEGrantCodeExchangeError",500,void 0),this.details=null,this.details=a}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}}class du extends He{constructor(){super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.","AuthPKCECodeVerifierMissingError",400,"pkce_code_verifier_not_found")}}class rr extends He{constructor(e,a){super(e,"AuthRetryableFetchError",a,void 0)}}function Ja(t){return U(t)&&t.name==="AuthRetryableFetchError"}class Rs extends He{constructor(e="Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)"){super(e,"AuthRefreshDiscardedError",409,void 0)}}function Ps(t){return U(t)&&t.name==="AuthRefreshDiscardedError"}class qs extends He{constructor(e,a,r){super(e,"AuthWeakPasswordError",a,"weak_password"),this.reasons=r}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reasons:this.reasons})}}class dr extends He{constructor(e){super(e,"AuthInvalidJwtError",400,"invalid_jwt")}}const ur="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),xs=` 	
\r=`.split(""),uu=(()=>{const t=new Array(128);for(let e=0;e<t.length;e+=1)t[e]=-1;for(let e=0;e<xs.length;e+=1)t[xs[e].charCodeAt(0)]=-2;for(let e=0;e<ur.length;e+=1)t[ur[e].charCodeAt(0)]=e;return t})();function Ns(t,e,a){if(t!==null)for(e.queue=e.queue<<8|t,e.queuedBits+=8;e.queuedBits>=6;){const r=e.queue>>e.queuedBits-6&63;a(ur[r]),e.queuedBits-=6}else if(e.queuedBits>0)for(e.queue=e.queue<<6-e.queuedBits,e.queuedBits=6;e.queuedBits>=6;){const r=e.queue>>e.queuedBits-6&63;a(ur[r]),e.queuedBits-=6}}function oo(t,e,a){const r=uu[t];if(r>-1)for(e.queue=e.queue<<6|r,e.queuedBits+=6;e.queuedBits>=8;)a(e.queue>>e.queuedBits-8&255),e.queuedBits-=8;else{if(r===-2)return;throw new Error(`Invalid Base64-URL character "${String.fromCharCode(t)}"`)}}function Is(t){const e=[],a=i=>{e.push(String.fromCodePoint(i))},r={utf8seq:0,codepoint:0},n={queue:0,queuedBits:0},s=i=>{mu(i,r,a)};for(let i=0;i<t.length;i+=1)oo(t.charCodeAt(i),n,s);return e.join("")}function pu(t,e){if(t<=127){e(t);return}else if(t<=2047){e(192|t>>6),e(128|t&63);return}else if(t<=65535){e(224|t>>12),e(128|t>>6&63),e(128|t&63);return}else if(t<=1114111){e(240|t>>18),e(128|t>>12&63),e(128|t>>6&63),e(128|t&63);return}throw new Error(`Unrecognized Unicode codepoint: ${t.toString(16)}`)}function hu(t,e){for(let a=0;a<t.length;a+=1){let r=t.charCodeAt(a);if(r>55295&&r<=56319){const n=(r-55296)*1024&65535;r=(t.charCodeAt(a+1)-56320&65535|n)+65536,a+=1}pu(r,e)}}function mu(t,e,a){if(e.utf8seq===0){if(t<=127){a(t);return}for(let r=1;r<6;r+=1)if((t>>7-r&1)===0){e.utf8seq=r;break}if(e.utf8seq===2)e.codepoint=t&31;else if(e.utf8seq===3)e.codepoint=t&15;else if(e.utf8seq===4)e.codepoint=t&7;else throw new Error("Invalid UTF-8 sequence");e.utf8seq-=1}else if(e.utf8seq>0){if(t<=127)throw new Error("Invalid UTF-8 sequence");e.codepoint=e.codepoint<<6|t&63,e.utf8seq-=1,e.utf8seq===0&&a(e.codepoint)}}function Vt(t){const e=[],a={queue:0,queuedBits:0},r=n=>{e.push(n)};for(let n=0;n<t.length;n+=1)oo(t.charCodeAt(n),a,r);return new Uint8Array(e)}function fu(t){const e=[];return hu(t,a=>e.push(a)),new Uint8Array(e)}function gt(t){const e=[],a={queue:0,queuedBits:0},r=n=>{e.push(n)};return t.forEach(n=>Ns(n,a,r)),Ns(null,a,r),e.join("")}function co(t){return Math.round(Date.now()/1e3)+t}function vu(){return Symbol("auth-callback")}const ve=()=>typeof window<"u"&&typeof document<"u",pt={tested:!1,writable:!1},lo=()=>{if(!ve())return!1;try{if(typeof globalThis.localStorage!="object")return!1}catch{return!1}if(pt.tested)return pt.writable;const t=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(t,t),globalThis.localStorage.removeItem(t),pt.tested=!0,pt.writable=!0}catch{pt.tested=!0,pt.writable=!1}return pt.writable};function Os(t){const e={},a=new URL(t);if(a.hash&&a.hash[0]==="#")try{new URLSearchParams(a.hash.substring(1)).forEach((n,s)=>{e[s]=n})}catch{}return a.searchParams.forEach((r,n)=>{e[n]=r}),e}const uo=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),gu=t=>typeof t=="object"&&t!==null&&"status"in t&&"ok"in t&&"json"in t&&typeof t.json=="function",et=async(t,e,a)=>{await t.setItem(e,JSON.stringify(a))},ge=async(t,e)=>{const a=await t.getItem(e);if(!a)return null;try{return JSON.parse(a)}catch{return null}},be=async(t,e)=>{await t.removeItem(e)};class Nr{constructor(){this.promise=new Nr.promiseConstructor((e,a)=>{this.resolve=e,this.reject=a})}}Nr.promiseConstructor=Promise;function Qa(t){const e=t.split(".");if(e.length!==3)throw new dr("Invalid JWT structure");for(let r=0;r<e.length;r++)if(!su.test(e[r]))throw new dr("JWT not in base64url format");return{header:JSON.parse(Is(e[0])),payload:JSON.parse(Is(e[1])),signature:Vt(e[2]),raw:{header:e[0],payload:e[1]}}}async function yu(t){return await new Promise(e=>{setTimeout(()=>e(null),t)})}function _u(t,e){return new Promise((r,n)=>{(async()=>{for(let s=0;s<1/0;s++)try{const i=await t(s);if(!e(s,null,i)){r(i);return}}catch(i){if(!e(s,i)){n(i);return}}})()})}function po(t){return("0"+t.toString(16)).substr(-2)}function bu(){const e=new Uint32Array(56);if(typeof crypto>"u"){const a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",r=a.length;let n="";for(let s=0;s<56;s++)n+=a.charAt(Math.floor(Math.random()*r));return n}return crypto.getRandomValues(e),Array.from(e,po).join("")}async function wu(t){const a=new TextEncoder().encode(t),r=await crypto.subtle.digest("SHA-256",a),n=new Uint8Array(r);return Array.from(n).map(s=>String.fromCharCode(s)).join("")}async function $u(t){if(!(typeof crypto<"u"&&typeof crypto.subtle<"u"&&typeof TextEncoder<"u"))return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."),t;const a=await wu(t);return btoa(a).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}const Su=/^[a-zA-Z0-9_-]{8,64}$/;function nr(t){return typeof t=="string"&&Su.test(t)?t:null}function Eu(){if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){const e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,po).join("")}let t="";for(let e=0;e<32;e++)t+=Math.floor(Math.random()*16).toString(16);return t}const Wt=(t,e)=>`${t}-flow-${e}-code-verifier`,ka=t=>`${t}-flows-code-verifier`;async function Un(t,e){const a=await ge(t,ka(e));return Array.isArray(a)?a.filter(r=>nr(r)!==null):[]}async function ku(t,e,a,r,n){await et(t,Wt(e,a),r);const s=(await Un(t,e)).filter(i=>i!==a);for(s.push(a);s.length>iu;){const i=s.shift();await be(t,Wt(e,i)),n==null||n(i)}await et(t,ka(e),s),await et(t,`${e}-code-verifier`,r)}async function Au(t,e,a){if(a){const n=await ge(t,Wt(e,a));return{verifier:typeof n=="string"?n:null,flowId:a}}const r=await ge(t,`${e}-code-verifier`);return{verifier:typeof r=="string"?r:null,flowId:null}}async function Ae(t,e,a){const r=`${e}-code-verifier`;if(!a){await be(t,r);return}const n=Wt(e,a),s=await ge(t,n);await be(t,n);const i=await Un(t,e),o=i.filter(c=>c!==a);o.length!==i.length&&(o.length>0?await et(t,ka(e),o):await be(t,ka(e))),s!=null&&s===await ge(t,r)&&await be(t,r)}async function Cu(t,e){const a=await Un(t,e);for(const r of a)await be(t,Wt(e,r));await be(t,ka(e)),await be(t,`${e}-code-verifier`)}function Tu(t,e){const a=t.indexOf("#");let r=a===-1?t:t.slice(0,a);const n=a===-1?"":t.slice(a),s=r.indexOf("?");if(s!==-1){const o=r.slice(0,s),c=r.slice(s+1).split("&").filter(l=>l!==""&&l!==vt&&!l.startsWith(`${vt}=`));r=c.length>0?`${o}?${c.join("&")}`:o}const i=r.includes("?")?"&":"?";return`${r}${i}${vt}=${encodeURIComponent(e)}${n}`}async function Lu(t,e,a=!1,r){const n=bu();let s=n;a&&(s+="/recovery");const i=Eu();await ku(t,e,i,s,r);const o=await $u(n);return[o,n===o?"plain":"s256",i]}const Ru=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function Pu(t){const e=t.headers.get(An);if(!e||!e.match(Ru))return null;try{return new Date(`${e}T00:00:00.0Z`)}catch{return null}}function qu(t){if(!t)throw new Error("Missing exp claim");const e=Math.floor(Date.now()/1e3);if(t<=e)throw new Error("JWT has expired")}function xu(t){switch(t){case"RS256":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}};case"ES256":return{name:"ECDSA",namedCurve:"P-256",hash:{name:"SHA-256"}};default:throw new Error("Invalid alg claim")}}const Nu=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function Be(t){if(!Nu.test(t))throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not")}function Le(t){if(!t.passkey)throw new Error("@supabase/auth-js: the passkey API is experimental and disabled by default. Enable it by passing `auth: { experimental: { passkey: true } }` to createClient (or to the GoTrueClient constructor).")}function ia(t){if(!t.recoveryCodes)throw new Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).")}function en(){const t={};return new Proxy(t,{get:(e,a)=>{if(a==="__isUserNotAvailableProxy")return!0;if(typeof a=="symbol"){const r=a.toString();if(r==="Symbol(Symbol.toPrimitive)"||r==="Symbol(Symbol.toStringTag)"||r==="Symbol(util.inspect.custom)")return}throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${a}" property of the session object is not supported. Please use getUser() instead.`)},set:(e,a)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${a}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)},deleteProperty:(e,a)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${a}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)}})}function Iu(t,e){return new Proxy(t,{get:(a,r,n)=>{if(r==="__isInsecureUserWarningProxy")return!0;if(typeof r=="symbol"){const s=r.toString();if(s==="Symbol(Symbol.toPrimitive)"||s==="Symbol(Symbol.toStringTag)"||s==="Symbol(util.inspect.custom)"||s==="Symbol(nodejs.util.inspect.custom)")return Reflect.get(a,r,n)}return!e.value&&typeof r=="string"&&(console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."),e.value=!0),Reflect.get(a,r,n)}})}function js(t){return JSON.parse(JSON.stringify(t))}const ht=t=>{if(typeof t=="object"&&t!==null){const e=t;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error}return JSON.stringify(t)},Ds=[500,501,502,503,504,520,521,522,523,524,525,526,527,528,529,530];async function Ms(t){var e;if(!gu(t))throw new rr(ht(t),0);let a;try{a=await t.json()}catch(s){throw Ds.includes(t.status)?new rr(t.statusText||`HTTP ${t.status}`,t.status):new qe(ht(s),s)}if(Ds.includes(t.status))throw new rr(ht(a),t.status);let r;const n=Pu(t);if(n&&n.getTime()>=io["2024-01-01"].timestamp&&typeof a=="object"&&a&&typeof a.code=="string"?r=a.code:typeof a=="object"&&a&&typeof a.error_code=="string"&&(r=a.error_code),r){if(r==="weak_password")throw new qs(ht(a),t.status,((e=a.weak_password)===null||e===void 0?void 0:e.reasons)||[]);if(r==="session_not_found")throw new he}else if(typeof a=="object"&&a&&typeof a.weak_password=="object"&&a.weak_password&&Array.isArray(a.weak_password.reasons)&&a.weak_password.reasons.length&&a.weak_password.reasons.reduce((s,i)=>s&&typeof i=="string",!0))throw new qs(ht(a),t.status,a.weak_password.reasons);throw new cu(ht(a),t.status||500,r)}const Ou=(t,e,a,r)=>{const n={method:t,headers:(e==null?void 0:e.headers)||{}};return t==="GET"?n:(n.headers=Object.assign({"Content-Type":"application/json;charset=UTF-8"},e==null?void 0:e.headers),n.body=JSON.stringify(r),Object.assign(Object.assign({},n),a))};async function z(t,e,a,r){var n;const s=Object.assign({},r==null?void 0:r.headers);s[An]||(s[An]=io["2024-01-01"].name),r!=null&&r.jwt&&(s.Authorization=`Bearer ${r.jwt}`);const i=(n=r==null?void 0:r.query)!==null&&n!==void 0?n:{};r!=null&&r.redirectTo&&(i.redirect_to=r.redirectTo);const o=Object.keys(i).length?"?"+new URLSearchParams(i).toString():"",c=await ju(t,e,a+o,{headers:s,noResolveJson:r==null?void 0:r.noResolveJson},{},r==null?void 0:r.body);return r!=null&&r.xform?r==null?void 0:r.xform(c):{data:Object.assign({},c),error:null}}async function ju(t,e,a,r,n,s){const i=Ou(e,r,n,s);let o;try{o=await t(a,Object.assign({},i))}catch(c){throw new rr(ht(c),0)}if(o.ok||await Ms(o),r!=null&&r.noResolveJson)return o;try{return await o.json()}catch(c){await Ms(c)}}function Se(t){var e;let a=null;Uu(t)&&(a=Object.assign({},t),t.expires_at||(a.expires_at=co(t.expires_in)));const r=(e=t.user)!==null&&e!==void 0?e:typeof(t==null?void 0:t.id)=="string"?t:null;return{data:{session:a,user:r},error:null}}function Us(t){const e=Se(t);return!e.error&&t.weak_password&&typeof t.weak_password=="object"&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.message&&typeof t.weak_password.message=="string"&&t.weak_password.reasons.reduce((a,r)=>a&&typeof r=="string",!0)&&(e.data.weak_password=t.weak_password),e}function ot(t){var e;return{data:{user:(e=t.user)!==null&&e!==void 0?e:t},error:null}}function Du(t){return{data:t,error:null}}function Mu(t){const{action_link:e,email_otp:a,hashed_token:r,redirect_to:n,verification_type:s}=t,i=Pr(t,["action_link","email_otp","hashed_token","redirect_to","verification_type"]),o={action_link:e,email_otp:a,hashed_token:r,redirect_to:n,verification_type:s},c=Object.assign({},i);return{data:{properties:o,user:c},error:null}}function Hs(t){return t}function Uu(t){return!!t.access_token&&!!t.refresh_token&&!!t.expires_in}const tn=["global","local","others"];class Hu{constructor({url:e="",headers:a={},fetch:r,experimental:n}){this.url=e,this.headers=a,this.fetch=uo(r),this.experimental=n??{},this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)},this.oauth={listClients:this._listOAuthClients.bind(this),createClient:this._createOAuthClient.bind(this),getClient:this._getOAuthClient.bind(this),updateClient:this._updateOAuthClient.bind(this),deleteClient:this._deleteOAuthClient.bind(this),regenerateClientSecret:this._regenerateOAuthClientSecret.bind(this)},this.customProviders={listProviders:this._listCustomProviders.bind(this),createProvider:this._createCustomProvider.bind(this),getProvider:this._getCustomProvider.bind(this),updateProvider:this._updateCustomProvider.bind(this),deleteProvider:this._deleteCustomProvider.bind(this)},this.passkey={listPasskeys:this._adminListPasskeys.bind(this),deletePasskey:this._adminDeletePasskey.bind(this)}}async signOut(e,a=tn[0]){if(tn.indexOf(a)<0)throw new Error(`@supabase/auth-js: Parameter scope must be one of ${tn.join(", ")}`);try{return await z(this.fetch,"POST",`${this.url}/logout?scope=${a}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(r){if(U(r))return{data:null,error:r};throw r}}async inviteUserByEmail(e,a={}){try{return await z(this.fetch,"POST",`${this.url}/invite`,{body:{email:e,data:a.data},headers:this.headers,redirectTo:a.redirectTo,xform:ot})}catch(r){if(U(r))return{data:{user:null},error:r};throw r}}async generateLink(e){try{const{options:a}=e,r=Pr(e,["options"]),n=Object.assign(Object.assign({},r),a);return"newEmail"in r&&(n.new_email=r==null?void 0:r.newEmail,delete n.newEmail),await z(this.fetch,"POST",`${this.url}/admin/generate_link`,{body:n,headers:this.headers,xform:Mu,redirectTo:a==null?void 0:a.redirectTo})}catch(a){if(U(a))return{data:{properties:null,user:null},error:a};throw a}}async createUser(e){try{return await z(this.fetch,"POST",`${this.url}/admin/users`,{body:e,headers:this.headers,xform:ot})}catch(a){if(U(a))return{data:{user:null},error:a};throw a}}async listUsers(e){var a,r,n,s,i,o,c;try{const l={nextPage:null,lastPage:0,total:0},d=await z(this.fetch,"GET",`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(r=(a=e==null?void 0:e.page)===null||a===void 0?void 0:a.toString())!==null&&r!==void 0?r:"",per_page:(s=(n=e==null?void 0:e.perPage)===null||n===void 0?void 0:n.toString())!==null&&s!==void 0?s:""},xform:Hs});if(d.error)throw d.error;const u=await d.json(),p=(i=d.headers.get("x-total-count"))!==null&&i!==void 0?i:0,m=(c=(o=d.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&c!==void 0?c:[];return m.length>0&&(m.forEach(f=>{const v=parseInt(f.split(";")[0].split("=")[1].substring(0,1)),_=JSON.parse(f.split(";")[1].split("=")[1]);l[`${_}Page`]=v}),l.total=parseInt(p)),{data:Object.assign(Object.assign({},u),l),error:null}}catch(l){if(U(l))return{data:{users:[]},error:l};throw l}}async getUserById(e){Be(e);try{return await z(this.fetch,"GET",`${this.url}/admin/users/${e}`,{headers:this.headers,xform:ot})}catch(a){if(U(a))return{data:{user:null},error:a};throw a}}async updateUserById(e,a){Be(e);try{return await z(this.fetch,"PUT",`${this.url}/admin/users/${e}`,{body:a,headers:this.headers,xform:ot})}catch(r){if(U(r))return{data:{user:null},error:r};throw r}}async deleteUser(e,a=!1){Be(e);try{return await z(this.fetch,"DELETE",`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:a},xform:ot})}catch(r){if(U(r))return{data:{user:null},error:r};throw r}}async _listFactors(e){Be(e.userId);try{const{data:a,error:r}=await z(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:n=>({data:{factors:n},error:null})});return{data:a,error:r}}catch(a){if(U(a))return{data:null,error:a};throw a}}async _deleteFactor(e){Be(e.userId),Be(e.id);try{return{data:await z(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(a){if(U(a))return{data:null,error:a};throw a}}async _listOAuthClients(e){var a,r,n,s,i,o,c;try{const l={nextPage:null,lastPage:0,total:0},d=await z(this.fetch,"GET",`${this.url}/admin/oauth/clients`,{headers:this.headers,noResolveJson:!0,query:{page:(r=(a=e==null?void 0:e.page)===null||a===void 0?void 0:a.toString())!==null&&r!==void 0?r:"",per_page:(s=(n=e==null?void 0:e.perPage)===null||n===void 0?void 0:n.toString())!==null&&s!==void 0?s:""},xform:Hs});if(d.error)throw d.error;const u=await d.json(),p=(i=d.headers.get("x-total-count"))!==null&&i!==void 0?i:0,m=(c=(o=d.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&c!==void 0?c:[];return m.length>0&&(m.forEach(f=>{const v=parseInt(f.split(";")[0].split("=")[1].substring(0,1)),_=JSON.parse(f.split(";")[1].split("=")[1]);l[`${_}Page`]=v}),l.total=parseInt(p)),{data:Object.assign(Object.assign({},u),l),error:null}}catch(l){if(U(l))return{data:{clients:[]},error:l};throw l}}async _createOAuthClient(e){try{return await z(this.fetch,"POST",`${this.url}/admin/oauth/clients`,{body:e,headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _getOAuthClient(e){try{return await z(this.fetch,"GET",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _updateOAuthClient(e,a){try{return await z(this.fetch,"PUT",`${this.url}/admin/oauth/clients/${e}`,{body:a,headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(U(r))return{data:null,error:r};throw r}}async _deleteOAuthClient(e){try{return await z(this.fetch,"DELETE",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(a){if(U(a))return{data:null,error:a};throw a}}async _regenerateOAuthClientSecret(e){try{return await z(this.fetch,"POST",`${this.url}/admin/oauth/clients/${e}/regenerate_secret`,{headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _listCustomProviders(e){try{const a={};return e!=null&&e.type&&(a.type=e.type),await z(this.fetch,"GET",`${this.url}/admin/custom-providers`,{headers:this.headers,query:a,xform:r=>{var n;return{data:{providers:(n=r==null?void 0:r.providers)!==null&&n!==void 0?n:[]},error:null}}})}catch(a){if(U(a))return{data:{providers:[]},error:a};throw a}}async _createCustomProvider(e){try{return await z(this.fetch,"POST",`${this.url}/admin/custom-providers`,{body:e,headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _getCustomProvider(e){try{return await z(this.fetch,"GET",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _updateCustomProvider(e,a){try{return await z(this.fetch,"PUT",`${this.url}/admin/custom-providers/${e}`,{body:a,headers:this.headers,xform:r=>({data:r,error:null})})}catch(r){if(U(r))return{data:null,error:r};throw r}}async _deleteCustomProvider(e){try{return await z(this.fetch,"DELETE",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(a){if(U(a))return{data:null,error:a};throw a}}async _adminListPasskeys(e){Le(this.experimental),Be(e.userId);try{return await z(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/passkeys`,{headers:this.headers,xform:a=>({data:a,error:null})})}catch(a){if(U(a))return{data:null,error:a};throw a}}async _adminDeletePasskey(e){Le(this.experimental),Be(e.userId),Be(e.passkeyId);try{return await z(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(a){if(U(a))return{data:null,error:a};throw a}}}function Fs(t={}){return{getItem:e=>t[e]||null,setItem:(e,a)=>{t[e]=a},removeItem:e=>{delete t[e]}}}globalThis&&lo()&&globalThis.localStorage&&globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug");class Fu extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}}function Bu(){if(typeof globalThis!="object")try{Object.defineProperty(Object.prototype,"__magic__",{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<"u"&&(self.globalThis=self)}}function ho(t){if(!/^0x[a-fA-F0-9]{40}$/.test(t))throw new Error(`@supabase/auth-js: Address "${t}" is invalid.`);return t.toLowerCase()}function zu(t){return parseInt(t,16)}function Vu(t){const e=new TextEncoder().encode(t);return"0x"+Array.from(e,r=>r.toString(16).padStart(2,"0")).join("")}function Wu(t){var e;const{chainId:a,domain:r,expirationTime:n,issuedAt:s=new Date,nonce:i,notBefore:o,requestId:c,resources:l,scheme:d,uri:u,version:p}=t;{if(!Number.isInteger(a))throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${a}`);if(!r)throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');if(i&&i.length<8)throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${i}`);if(!u)throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');if(p!=="1")throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${p}`);if(!((e=t.statement)===null||e===void 0)&&e.includes(`
`))throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${t.statement}`)}const m=ho(t.address),f=d?`${d}://${r}`:r,v=t.statement?`${t.statement}
`:"",_=`${f} wants you to sign in with your Ethereum account:
${m}

${v}`;let w=`URI: ${u}
Version: ${p}
Chain ID: ${a}${i?`
Nonce: ${i}`:""}
Issued At: ${s.toISOString()}`;if(n&&(w+=`
Expiration Time: ${n.toISOString()}`),o&&(w+=`
Not Before: ${o.toISOString()}`),c&&(w+=`
Request ID: ${c}`),l){let k=`
Resources:`;for(const S of l){if(!S||typeof S!="string")throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${S}`);k+=`
- ${S}`}w+=k}return`${_}
${w}`}class ue extends Error{constructor({message:e,code:a,cause:r,name:n}){var s;super(e,{cause:r}),this.__isWebAuthnError=!0,this.name=(s=n??(r instanceof Error?r.name:void 0))!==null&&s!==void 0?s:"Unknown Error",this.code=a}toJSON(){return{name:this.name,message:this.message,code:this.code}}}class pr extends ue{constructor(e,a){super({code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:a,message:e}),this.name="WebAuthnUnknownError",this.originalError=a}}function Gu({error:t,options:e}){var a,r,n;const{publicKey:s}=e;if(!s)throw Error("options was missing required publicKey property");if(t.name==="AbortError"){if(e.signal instanceof AbortSignal)return new ue({message:"Registration ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:t})}else if(t.name==="ConstraintError"){if(((a=s.authenticatorSelection)===null||a===void 0?void 0:a.requireResidentKey)===!0)return new ue({message:"Discoverable credentials were required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",cause:t});if(e.mediation==="conditional"&&((r=s.authenticatorSelection)===null||r===void 0?void 0:r.userVerification)==="required")return new ue({message:"User verification was required during automatic registration but it could not be performed",code:"ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",cause:t});if(((n=s.authenticatorSelection)===null||n===void 0?void 0:n.userVerification)==="required")return new ue({message:"User verification was required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",cause:t})}else{if(t.name==="InvalidStateError")return new ue({message:"The authenticator was previously registered",code:"ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",cause:t});if(t.name==="NotAllowedError")return new ue({message:t.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t});if(t.name==="NotSupportedError")return s.pubKeyCredParams.filter(o=>o.type==="public-key").length===0?new ue({message:'No entry in pubKeyCredParams was of type "public-key"',code:"ERROR_MALFORMED_PUBKEYCREDPARAMS",cause:t}):new ue({message:"No available authenticator supported any of the specified pubKeyCredParams algorithms",code:"ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",cause:t});if(t.name==="SecurityError"){const i=window.location.hostname;if(mo(i)){if(s.rp.id!==i)return new ue({message:`The RP ID "${s.rp.id}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:t})}else return new ue({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:t})}else if(t.name==="TypeError"){if(s.user.id.byteLength<1||s.user.id.byteLength>64)return new ue({message:"User ID was not between 1 and 64 characters",code:"ERROR_INVALID_USER_ID_LENGTH",cause:t})}else if(t.name==="UnknownError")return new ue({message:"The authenticator was unable to process the specified options, or could not create a new credential",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:t})}return new ue({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t})}function Ku({error:t,options:e}){const{publicKey:a}=e;if(!a)throw Error("options was missing required publicKey property");if(t.name==="AbortError"){if(e.signal instanceof AbortSignal)return new ue({message:"Authentication ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:t})}else{if(t.name==="NotAllowedError")return new ue({message:t.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t});if(t.name==="SecurityError"){const r=window.location.hostname;if(mo(r)){if(a.rpId!==r)return new ue({message:`The RP ID "${a.rpId}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:t})}else return new ue({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:t})}else if(t.name==="UnknownError")return new ue({message:"The authenticator was unable to process the specified options, or could not create a new assertion signature",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:t})}return new ue({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t})}class Ju{createNewAbortSignal(){if(this.controller){const a=new Error("Cancelling existing WebAuthn API call for new one");a.name="AbortError",this.controller.abort(a)}const e=new AbortController;return this.controller=e,e.signal}cancelCeremony(){if(this.controller){const e=new Error("Manually cancelling existing WebAuthn API call");e.name="AbortError",this.controller.abort(e),this.controller=void 0}}}const Cn=new Ju;function Bs(t){if(!t)throw new Error("Credential creation options are required");if(typeof PublicKeyCredential<"u"&&"parseCreationOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseCreationOptionsFromJSON=="function")return PublicKeyCredential.parseCreationOptionsFromJSON(t);const{challenge:e,user:a,excludeCredentials:r}=t,n=Pr(t,["challenge","user","excludeCredentials"]),s=Vt(e).buffer,i=Object.assign(Object.assign({},a),{id:Vt(a.id).buffer}),o=Object.assign(Object.assign({},n),{challenge:s,user:i});if(r&&r.length>0){o.excludeCredentials=new Array(r.length);for(let c=0;c<r.length;c++){const l=r[c];o.excludeCredentials[c]=Object.assign(Object.assign({},l),{id:Vt(l.id).buffer,type:l.type||"public-key",transports:l.transports})}}return o}function zs(t){if(!t)throw new Error("Credential request options are required");if(typeof PublicKeyCredential<"u"&&"parseRequestOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseRequestOptionsFromJSON=="function")return PublicKeyCredential.parseRequestOptionsFromJSON(t);const{challenge:e,allowCredentials:a}=t,r=Pr(t,["challenge","allowCredentials"]),n=Vt(e).buffer,s=Object.assign(Object.assign({},r),{challenge:n});if(a&&a.length>0){s.allowCredentials=new Array(a.length);for(let i=0;i<a.length;i++){const o=a[i];s.allowCredentials[i]=Object.assign(Object.assign({},o),{id:Vt(o.id).buffer,type:o.type||"public-key",transports:o.transports})}}return s}function Vs(t){var e;if("toJSON"in t&&typeof t.toJSON=="function")return t.toJSON();const a=t;return{id:t.id,rawId:t.id,response:{attestationObject:gt(new Uint8Array(t.response.attestationObject)),clientDataJSON:gt(new Uint8Array(t.response.clientDataJSON))},type:"public-key",clientExtensionResults:t.getClientExtensionResults(),authenticatorAttachment:(e=a.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function Ws(t){var e;if("toJSON"in t&&typeof t.toJSON=="function")return t.toJSON();const a=t,r=t.getClientExtensionResults(),n=t.response;return{id:t.id,rawId:t.id,response:{authenticatorData:gt(new Uint8Array(n.authenticatorData)),clientDataJSON:gt(new Uint8Array(n.clientDataJSON)),signature:gt(new Uint8Array(n.signature)),userHandle:n.userHandle?gt(new Uint8Array(n.userHandle)):void 0},type:"public-key",clientExtensionResults:r,authenticatorAttachment:(e=a.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function mo(t){return t==="localhost"||/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(t)}function hr(){var t,e;return!!(ve()&&"PublicKeyCredential"in window&&window.PublicKeyCredential&&"credentials"in navigator&&typeof((t=navigator==null?void 0:navigator.credentials)===null||t===void 0?void 0:t.create)=="function"&&typeof((e=navigator==null?void 0:navigator.credentials)===null||e===void 0?void 0:e.get)=="function")}async function fo(t){try{const e=await navigator.credentials.create(t);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new pr("Browser returned unexpected credential type",e)}:{data:null,error:new pr("Empty credential response",e)}}catch(e){return{data:null,error:Gu({error:e,options:t})}}}async function vo(t){try{const e=await navigator.credentials.get(t);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new pr("Browser returned unexpected credential type",e)}:{data:null,error:new pr("Empty credential response",e)}}catch(e){return{data:null,error:Ku({error:e,options:t})}}}const Qu={hints:["security-key"],authenticatorSelection:{authenticatorAttachment:"cross-platform",requireResidentKey:!1,userVerification:"preferred",residentKey:"discouraged"},attestation:"direct"},Yu={userVerification:"preferred",hints:["security-key"],attestation:"direct"};function mr(...t){const e=n=>n!==null&&typeof n=="object"&&!Array.isArray(n),a=n=>n instanceof ArrayBuffer||ArrayBuffer.isView(n),r={};for(const n of t)if(n)for(const s in n){const i=n[s];if(i!==void 0)if(Array.isArray(i))r[s]=i;else if(a(i))r[s]=i;else if(e(i)){const o=r[s];e(o)?r[s]=mr(o,i):r[s]=mr(i)}else r[s]=i}return r}function Zu(t,e){return mr(Qu,t,e||{})}function Xu(t,e){return mr(Yu,t,e||{})}class ep{constructor(e){this.client=e,this.enroll=this._enroll.bind(this),this.challenge=this._challenge.bind(this),this.verify=this._verify.bind(this),this.authenticate=this._authenticate.bind(this),this.register=this._register.bind(this)}async _enroll(e){return this.client.mfa.enroll(Object.assign(Object.assign({},e),{factorType:"webauthn"}))}async _challenge({factorId:e,webauthn:a,friendlyName:r,signal:n},s){var i;try{const{data:o,error:c}=await this.client.mfa.challenge({factorId:e,webauthn:a});if(!o)return{data:null,error:c};const l=n??Cn.createNewAbortSignal();if(o.webauthn.type==="create"){const{user:d}=o.webauthn.credential_options.publicKey;if(!d.name){const u=r;if(u)d.name=`${d.id}:${u}`;else{const m=(await this.client.getUser()).data.user,f=((i=m==null?void 0:m.user_metadata)===null||i===void 0?void 0:i.name)||(m==null?void 0:m.email)||(m==null?void 0:m.id)||"User";d.name=`${d.id}:${f}`}}d.displayName||(d.displayName=d.name)}switch(o.webauthn.type){case"create":{const d=Zu(o.webauthn.credential_options.publicKey,s==null?void 0:s.create),{data:u,error:p}=await fo({publicKey:d,signal:l});return u?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:u}},error:null}:{data:null,error:p}}case"request":{const d=Xu(o.webauthn.credential_options.publicKey,s==null?void 0:s.request),{data:u,error:p}=await vo(Object.assign(Object.assign({},o.webauthn.credential_options),{publicKey:d,signal:l}));return u?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:u}},error:null}:{data:null,error:p}}}}catch(o){return U(o)?{data:null,error:o}:{data:null,error:new qe("Unexpected error in challenge",o)}}}async _verify({challengeId:e,factorId:a,webauthn:r}){return this.client.mfa.verify({factorId:a,challengeId:e,webauthn:r})}async _authenticate({factorId:e,webauthn:{rpId:a=typeof window<"u"?window.location.hostname:void 0,rpOrigins:r=typeof window<"u"?[window.location.origin]:void 0,signal:n}={}},s){if(!a)return{data:null,error:new Ea("rpId is required for WebAuthn authentication")};try{if(!hr())return{data:null,error:new qe("Browser does not support WebAuthn",null)};const{data:i,error:o}=await this.challenge({factorId:e,webauthn:{rpId:a,rpOrigins:r},signal:n},{request:s});if(!i)return{data:null,error:o};const{webauthn:c}=i;return this._verify({factorId:e,challengeId:i.challengeId,webauthn:{type:c.type,rpId:a,rpOrigins:r,credential_response:c.credential_response}})}catch(i){return U(i)?{data:null,error:i}:{data:null,error:new qe("Unexpected error in authenticate",i)}}}async _register({friendlyName:e,webauthn:{rpId:a=typeof window<"u"?window.location.hostname:void 0,rpOrigins:r=typeof window<"u"?[window.location.origin]:void 0,signal:n}={}},s){if(!a)return{data:null,error:new Ea("rpId is required for WebAuthn registration")};try{if(!hr())return{data:null,error:new qe("Browser does not support WebAuthn",null)};const{data:i,error:o}=await this._enroll({friendlyName:e});if(!i)return await this.client.mfa.listFactors().then(d=>{var u;return(u=d.data)===null||u===void 0?void 0:u.all.find(p=>p.factor_type==="webauthn"&&p.friendly_name===e&&p.status==="unverified")}).then(d=>d?this.client.mfa.unenroll({factorId:d==null?void 0:d.id}):void 0),{data:null,error:o};const{data:c,error:l}=await this._challenge({factorId:i.id,friendlyName:i.friendly_name,webauthn:{rpId:a,rpOrigins:r},signal:n},{create:s});return c?this._verify({factorId:i.id,challengeId:c.challengeId,webauthn:{rpId:a,rpOrigins:r,type:c.webauthn.type,credential_response:c.webauthn.credential_response}}):{data:null,error:l}}catch(i){return U(i)?{data:null,error:i}:{data:null,error:new qe("Unexpected error in register",i)}}}}Bu();const tp={url:au,storageKey:ru,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:nu,flowType:"implicit",debug:!1,hasCustomAuthorizationHeader:!1,throwOnError:!1,lockAcquireTimeout:5e3,skipAutoInitialize:!1,experimental:{}},xt={};let Gs=!1;class Aa{get jwks(){var e,a;return(a=(e=xt[this.storageKey])===null||e===void 0?void 0:e.jwks)!==null&&a!==void 0?a:{keys:[]}}set jwks(e){xt[this.storageKey]=Object.assign(Object.assign({},xt[this.storageKey]),{jwks:e})}get jwks_cached_at(){var e,a;return(a=(e=xt[this.storageKey])===null||e===void 0?void 0:e.cachedAt)!==null&&a!==void 0?a:Number.MIN_SAFE_INTEGER}set jwks_cached_at(e){xt[this.storageKey]=Object.assign(Object.assign({},xt[this.storageKey]),{cachedAt:e})}constructor(e){var a,r,n;this.userStorage=null,this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.autoRefreshTickTimeout=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.lastRefreshFailure=null,this._sessionRemovalEpoch=0,this.initializePromise=null,this._pendingInitNotifications=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lock=null,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log;const s=Object.assign(Object.assign({},tp),e);if(this.storageKey=s.storageKey,this.instanceID=(a=Aa.nextInstanceID[this.storageKey])!==null&&a!==void 0?a:0,Aa.nextInstanceID[this.storageKey]=this.instanceID+1,this.logDebugMessages=!!s.debug,typeof s.debug=="function"&&(this.logger=s.debug),this.instanceID>0&&ve()){const i=`${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;console.warn(i),this.logDebugMessages&&console.trace(i)}if(this.persistSession=s.persistSession,this.autoRefreshToken=s.autoRefreshToken,this.experimental=(r=s.experimental)!==null&&r!==void 0?r:{},this.admin=new Hu({url:s.url,headers:s.headers,fetch:s.fetch,experimental:this.experimental}),this.url=s.url,this.headers=s.headers,this.fetch=uo(s.fetch),this.detectSessionInUrl=s.detectSessionInUrl,this.flowType=s.flowType,this.hasCustomAuthorizationHeader=s.hasCustomAuthorizationHeader,this.throwOnError=s.throwOnError,this.lockAcquireTimeout=s.lockAcquireTimeout,s.lock!=null&&(this.lock=s.lock,Gs||(Gs=!0,console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))),this.jwks||(this.jwks={keys:[]},this.jwks_cached_at=Number.MIN_SAFE_INTEGER),this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this),webauthn:new ep(this),recoveryCodes:{getStatus:this._getRecoveryCodesStatus.bind(this),generate:this._generateRecoveryCodes.bind(this),verify:this._verifyRecoveryCode.bind(this),regenerate:this._regenerateRecoveryCodes.bind(this),unenroll:this._unenrollRecoveryCodes.bind(this)}},this.oauth={getAuthorizationDetails:this._getAuthorizationDetails.bind(this),approveAuthorization:this._approveAuthorization.bind(this),denyAuthorization:this._denyAuthorization.bind(this),listGrants:this._listOAuthGrants.bind(this),revokeGrant:this._revokeOAuthGrant.bind(this)},this.passkey={startRegistration:this._startPasskeyRegistration.bind(this),verifyRegistration:this._verifyPasskeyRegistration.bind(this),startAuthentication:this._startPasskeyAuthentication.bind(this),verifyAuthentication:this._verifyPasskeyAuthentication.bind(this),list:this._listPasskeys.bind(this),update:this._updatePasskey.bind(this),delete:this._deletePasskey.bind(this)},this.persistSession?(s.storage?this.storage=s.storage:lo()?this.storage=globalThis.localStorage:(this.memoryStorage={},this.storage=Fs(this.memoryStorage)),s.userStorage&&(this.userStorage=s.userStorage)):(this.memoryStorage={},this.storage=Fs(this.memoryStorage)),ve()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(i){console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available",i)}(n=this.broadcastChannel)===null||n===void 0||n.addEventListener("message",async i=>{this._debug("received broadcast notification from other tab or client",i),(i.data.event==="TOKEN_REFRESHED"||i.data.event==="SIGNED_IN")&&(this.lastRefreshFailure=null);try{await this._notifyAllSubscribers(i.data.event,i.data.session,!1)}catch(o){this._debug("#broadcastChannel","error",o)}})}s.skipAutoInitialize||this.initialize().catch(i=>{this._debug("#initialize()","error",i)})}isThrowOnErrorEnabled(){return this.throwOnError}_returnResult(e){if(this.throwOnError&&e&&e.error)throw e.error;return e}_logPrefix(){return`GoTrueClient@${this.storageKey}:${this.instanceID} (${so}) ${new Date().toISOString()}`}_debug(...e){return this.logDebugMessages&&this.logger(this._logPrefix(),...e),this}async initialize(){var e;if(this.initializePromise)return await this.initializePromise;this._pendingInitNotifications=[],this.initializePromise=(async()=>this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._initialize()):await this._initialize())();const a=await this.initializePromise,r=(e=this._pendingInitNotifications)!==null&&e!==void 0?e:[];this._pendingInitNotifications=null;for(const n of r)await this._notifyAllSubscribers(n.event,n.session,n.broadcast);return a}async _initialize(){var e;try{let a={},r="none";if(ve()&&(a=Os(window.location.href),this._isImplicitGrantCallback(a)?r="implicit":await this._isPKCECallback(a)&&(r="pkce")),ve()&&this.detectSessionInUrl&&r!=="none"){const{data:n,error:s}=await this._getSessionFromURL(a,r);if(s){if(this._debug("#_initialize()","error detecting session from URL",s),lu(s)){const c=(e=s.details)===null||e===void 0?void 0:e.code;if(c==="identity_already_exists"||c==="identity_not_found"||c==="single_identity_not_deletable")return{error:s}}return{error:s}}const{session:i,redirectType:o}=n;return this._debug("#_initialize()","detected session in URL",i,"redirect type",o),await this._saveSession(i),setTimeout(async()=>{o==="recovery"?await this._notifyAllSubscribers("PASSWORD_RECOVERY",i):await this._notifyAllSubscribers("SIGNED_IN",i)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(a){return U(a)?this._returnResult({error:a}):this._returnResult({error:new qe("Unexpected error during initialization",a)})}finally{await this._handleVisibilityChange(),this._debug("#_initialize()","end")}}async signInAnonymously(e){var a,r,n;try{const s=await z(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{data:(r=(a=e==null?void 0:e.options)===null||a===void 0?void 0:a.data)!==null&&r!==void 0?r:{},gotrue_meta_security:{captcha_token:(n=e==null?void 0:e.options)===null||n===void 0?void 0:n.captchaToken}},xform:Se}),{data:i,error:o}=s;if(o||!i)return this._returnResult({data:{user:null,session:null},error:o});const c=i.session,l=i.user;return i.session&&(await this._saveSession(i.session),await this._notifyAllSubscribers("SIGNED_IN",c)),this._returnResult({data:{user:l,session:c},error:null})}catch(s){if(U(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}}async signUp(e){var a,r,n;let s=null;try{let i;if("email"in e){const{email:u,password:p,options:m}=e;let f=null,v=null;this.flowType==="pkce"&&([f,v,s]=await this._getCodeChallengeAndMethod()),i=await z(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(m==null?void 0:m.emailRedirectTo,s),body:{email:u,password:p,data:(a=m==null?void 0:m.data)!==null&&a!==void 0?a:{},gotrue_meta_security:{captcha_token:m==null?void 0:m.captchaToken},code_challenge:f,code_challenge_method:v},xform:Se})}else if("phone"in e){const{phone:u,password:p,options:m}=e;i=await z(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{phone:u,password:p,data:(r=m==null?void 0:m.data)!==null&&r!==void 0?r:{},channel:(n=m==null?void 0:m.channel)!==null&&n!==void 0?n:"sms",gotrue_meta_security:{captcha_token:m==null?void 0:m.captchaToken}},xform:Se})}else throw new Ga("You must provide either an email or phone number and a password");const{data:o,error:c}=i;if(c||!o)return await Ae(this.storage,this.storageKey,s),this._returnResult({data:{user:null,session:null},error:c});const l=o.session,d=o.user;return o.session&&(await this._saveSession(o.session),await this._notifyAllSubscribers("SIGNED_IN",l)),this._returnResult({data:{user:d,session:l},error:null})}catch(i){if(await Ae(this.storage,this.storageKey,s),U(i))return this._returnResult({data:{user:null,session:null},error:i});throw i}}async signInWithPassword(e){try{let a;if("email"in e){const{email:s,password:i,options:o}=e;a=await z(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{email:s,password:i,gotrue_meta_security:{captcha_token:o==null?void 0:o.captchaToken}},xform:Us})}else if("phone"in e){const{phone:s,password:i,options:o}=e;a=await z(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{phone:s,password:i,gotrue_meta_security:{captcha_token:o==null?void 0:o.captchaToken}},xform:Us})}else throw new Ga("You must provide either an email or phone number and a password");const{data:r,error:n}=a;if(n)return this._returnResult({data:{user:null,session:null},error:n});if(!r||!r.session||!r.user){const s=new qt;return this._returnResult({data:{user:null,session:null},error:s})}return r.session&&(await this._saveSession(r.session),await this._notifyAllSubscribers("SIGNED_IN",r.session)),this._returnResult({data:Object.assign({user:r.user,session:r.session},r.weak_password?{weakPassword:r.weak_password}:null),error:n})}catch(a){if(U(a))return this._returnResult({data:{user:null,session:null},error:a});throw a}}async signInWithOAuth(e){var a,r,n,s;return await this._handleProviderSignIn(e.provider,{redirectTo:(a=e.options)===null||a===void 0?void 0:a.redirectTo,scopes:(r=e.options)===null||r===void 0?void 0:r.scopes,queryParams:(n=e.options)===null||n===void 0?void 0:n.queryParams,skipBrowserRedirect:(s=e.options)===null||s===void 0?void 0:s.skipBrowserRedirect})}async exchangeCodeForSession(e,a){return await this.initializePromise,this.lock!=null?this._acquireLock(this.lockAcquireTimeout,async()=>this._exchangeCodeForSession(e,a)):this._exchangeCodeForSession(e,a)}async signInWithWeb3(e){const{chain:a}=e;switch(a){case"ethereum":return await this.signInWithEthereum(e);case"solana":return await this.signInWithSolana(e);default:throw new Error(`@supabase/auth-js: Unsupported chain "${a}"`)}}async signInWithEthereum(e){var a,r,n,s,i,o,c,l,d,u,p;let m,f;if("message"in e)m=e.message,f=e.signature;else{const{chain:v,wallet:_,statement:w,options:k}=e;let S;if(ve())if(typeof _=="object")S=_;else{const L=window;if("ethereum"in L&&typeof L.ethereum=="object"&&"request"in L.ethereum&&typeof L.ethereum.request=="function")S=L.ethereum;else throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.")}else{if(typeof _!="object"||!(k!=null&&k.url))throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");S=_}const T=new URL((a=k==null?void 0:k.url)!==null&&a!==void 0?a:window.location.href),A=await S.request({method:"eth_requestAccounts"}).then(L=>L).catch(()=>{throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid")});if(!A||A.length===0)throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");const C=ho(A[0]);let I=(r=k==null?void 0:k.signInWithEthereum)===null||r===void 0?void 0:r.chainId;if(!I){const L=await S.request({method:"eth_chainId"});I=zu(L)}const E={domain:T.host,address:C,statement:w,uri:T.href,version:"1",chainId:I,nonce:(n=k==null?void 0:k.signInWithEthereum)===null||n===void 0?void 0:n.nonce,issuedAt:(i=(s=k==null?void 0:k.signInWithEthereum)===null||s===void 0?void 0:s.issuedAt)!==null&&i!==void 0?i:new Date,expirationTime:(o=k==null?void 0:k.signInWithEthereum)===null||o===void 0?void 0:o.expirationTime,notBefore:(c=k==null?void 0:k.signInWithEthereum)===null||c===void 0?void 0:c.notBefore,requestId:(l=k==null?void 0:k.signInWithEthereum)===null||l===void 0?void 0:l.requestId,resources:(d=k==null?void 0:k.signInWithEthereum)===null||d===void 0?void 0:d.resources};m=Wu(E),f=await S.request({method:"personal_sign",params:[Vu(m),C]})}try{const{data:v,error:_}=await z(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"ethereum",message:m,signature:f},!((u=e.options)===null||u===void 0)&&u.captchaToken?{gotrue_meta_security:{captcha_token:(p=e.options)===null||p===void 0?void 0:p.captchaToken}}:null),xform:Se});if(_)throw _;if(!v||!v.session||!v.user){const w=new qt;return this._returnResult({data:{user:null,session:null},error:w})}return v.session&&(await this._saveSession(v.session),await this._notifyAllSubscribers("SIGNED_IN",v.session)),this._returnResult({data:Object.assign({},v),error:_})}catch(v){if(U(v))return this._returnResult({data:{user:null,session:null},error:v});throw v}}async signInWithSolana(e){var a,r,n,s,i,o,c,l,d,u,p,m;let f,v;if("message"in e)f=e.message,v=e.signature;else{const{chain:_,wallet:w,statement:k,options:S}=e;let T;if(ve())if(typeof w=="object")T=w;else{const C=window;if("solana"in C&&typeof C.solana=="object"&&("signIn"in C.solana&&typeof C.solana.signIn=="function"||"signMessage"in C.solana&&typeof C.solana.signMessage=="function"))T=C.solana;else throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.")}else{if(typeof w!="object"||!(S!=null&&S.url))throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");T=w}const A=new URL((a=S==null?void 0:S.url)!==null&&a!==void 0?a:window.location.href);if("signIn"in T&&T.signIn){const C=await T.signIn(Object.assign(Object.assign(Object.assign({issuedAt:new Date().toISOString()},S==null?void 0:S.signInWithSolana),{version:"1",domain:A.host,uri:A.href}),k?{statement:k}:null));let I;if(Array.isArray(C)&&C[0]&&typeof C[0]=="object")I=C[0];else if(C&&typeof C=="object"&&"signedMessage"in C&&"signature"in C)I=C;else throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");if("signedMessage"in I&&"signature"in I&&(typeof I.signedMessage=="string"||I.signedMessage instanceof Uint8Array)&&I.signature instanceof Uint8Array)f=typeof I.signedMessage=="string"?I.signedMessage:new TextDecoder().decode(I.signedMessage),v=I.signature;else throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields")}else{if(!("signMessage"in T)||typeof T.signMessage!="function"||!("publicKey"in T)||typeof T!="object"||!T.publicKey||!("toBase58"in T.publicKey)||typeof T.publicKey.toBase58!="function")throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");f=[`${A.host} wants you to sign in with your Solana account:`,T.publicKey.toBase58(),...k?["",k,""]:[""],"Version: 1",`URI: ${A.href}`,`Issued At: ${(n=(r=S==null?void 0:S.signInWithSolana)===null||r===void 0?void 0:r.issuedAt)!==null&&n!==void 0?n:new Date().toISOString()}`,...!((s=S==null?void 0:S.signInWithSolana)===null||s===void 0)&&s.notBefore?[`Not Before: ${S.signInWithSolana.notBefore}`]:[],...!((i=S==null?void 0:S.signInWithSolana)===null||i===void 0)&&i.expirationTime?[`Expiration Time: ${S.signInWithSolana.expirationTime}`]:[],...!((o=S==null?void 0:S.signInWithSolana)===null||o===void 0)&&o.chainId?[`Chain ID: ${S.signInWithSolana.chainId}`]:[],...!((c=S==null?void 0:S.signInWithSolana)===null||c===void 0)&&c.nonce?[`Nonce: ${S.signInWithSolana.nonce}`]:[],...!((l=S==null?void 0:S.signInWithSolana)===null||l===void 0)&&l.requestId?[`Request ID: ${S.signInWithSolana.requestId}`]:[],...!((u=(d=S==null?void 0:S.signInWithSolana)===null||d===void 0?void 0:d.resources)===null||u===void 0)&&u.length?["Resources",...S.signInWithSolana.resources.map(I=>`- ${I}`)]:[]].join(`
`);const C=await T.signMessage(new TextEncoder().encode(f),"utf8");if(!C||!(C instanceof Uint8Array))throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");v=C}}try{const{data:_,error:w}=await z(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"solana",message:f,signature:gt(v)},!((p=e.options)===null||p===void 0)&&p.captchaToken?{gotrue_meta_security:{captcha_token:(m=e.options)===null||m===void 0?void 0:m.captchaToken}}:null),xform:Se});if(w)throw w;if(!_||!_.session||!_.user){const k=new qt;return this._returnResult({data:{user:null,session:null},error:k})}return _.session&&(await this._saveSession(_.session),await this._notifyAllSubscribers("SIGNED_IN",_.session)),this._returnResult({data:Object.assign({},_),error:w})}catch(_){if(U(_))return this._returnResult({data:{user:null,session:null},error:_});throw _}}async _exchangeCodeForSession(e,a){const r=(a==null?void 0:a.flowId)!=null,n=r?nr(a==null?void 0:a.flowId):ve()?nr(Os(window.location.href)[vt]):null;r&&!n&&this._debug("#_exchangeCodeForSession()","provided flowId is not a valid flow id",a==null?void 0:a.flowId);const{verifier:s,flowId:i}=r&&!n?{verifier:null,flowId:null}:await Au(this.storage,this.storageKey,n),[o,c]=(s??"").split("/");try{if(!o&&this.flowType==="pkce")throw new du;const{data:l,error:d}=await z(this.fetch,"POST",`${this.url}/token?grant_type=pkce`,{headers:this.headers,body:{auth_code:e,code_verifier:o},xform:Se});if(await Ae(this.storage,this.storageKey,i),d)throw d;if(!l||!l.session||!l.user){const u=new qt;return this._returnResult({data:{user:null,session:null,redirectType:null},error:u})}return l.session&&(await this._saveSession(l.session),await this._notifyAllSubscribers(c==="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",l.session)),this._returnResult({data:Object.assign(Object.assign({},l),{redirectType:c??null}),error:d})}catch(l){if(await Ae(this.storage,this.storageKey,i),U(l))return this._returnResult({data:{user:null,session:null,redirectType:null},error:l});throw l}}async signInWithIdToken(e){try{const{options:a,provider:r,token:n,access_token:s,nonce:i}=e,o=await z(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,body:{provider:r,id_token:n,access_token:s,nonce:i,gotrue_meta_security:{captcha_token:a==null?void 0:a.captchaToken}},xform:Se}),{data:c,error:l}=o;if(l)return this._returnResult({data:{user:null,session:null},error:l});if(!c||!c.session||!c.user){const d=new qt;return this._returnResult({data:{user:null,session:null},error:d})}return c.session&&(await this._saveSession(c.session),await this._notifyAllSubscribers("SIGNED_IN",c.session)),this._returnResult({data:c,error:l})}catch(a){if(U(a))return this._returnResult({data:{user:null,session:null},error:a});throw a}}async signInWithOtp(e){var a,r,n,s,i;let o=null;try{if("email"in e){const{email:c,options:l}=e;let d=null,u=null;this.flowType==="pkce"&&([d,u,o]=await this._getCodeChallengeAndMethod());const{error:p}=await z(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{email:c,data:(a=l==null?void 0:l.data)!==null&&a!==void 0?a:{},create_user:(r=l==null?void 0:l.shouldCreateUser)!==null&&r!==void 0?r:!0,gotrue_meta_security:{captcha_token:l==null?void 0:l.captchaToken},code_challenge:d,code_challenge_method:u},redirectTo:this._maybeAppendFlowIdToRedirect(l==null?void 0:l.emailRedirectTo,o)});return this._returnResult({data:{user:null,session:null},error:p})}if("phone"in e){const{phone:c,options:l}=e,{data:d,error:u}=await z(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{phone:c,data:(n=l==null?void 0:l.data)!==null&&n!==void 0?n:{},create_user:(s=l==null?void 0:l.shouldCreateUser)!==null&&s!==void 0?s:!0,gotrue_meta_security:{captcha_token:l==null?void 0:l.captchaToken},channel:(i=l==null?void 0:l.channel)!==null&&i!==void 0?i:"sms"}});return this._returnResult({data:{user:null,session:null,messageId:d==null?void 0:d.message_id},error:u})}throw new Ga("You must provide either an email or phone number.")}catch(c){if(await Ae(this.storage,this.storageKey,o),U(c))return this._returnResult({data:{user:null,session:null},error:c});throw c}}async verifyOtp(e){var a,r;try{let n,s;"options"in e&&(n=(a=e.options)===null||a===void 0?void 0:a.redirectTo,s=(r=e.options)===null||r===void 0?void 0:r.captchaToken);const{data:i,error:o}=await z(this.fetch,"POST",`${this.url}/verify`,{headers:this.headers,body:Object.assign(Object.assign({},e),{gotrue_meta_security:{captcha_token:s}}),redirectTo:n,xform:Se});if(o)throw o;if(!i)throw new Error("An error occurred on token verification.");const c=i.session,l=i.user;return c!=null&&c.access_token&&(await this._saveSession(c),await this._notifyAllSubscribers(e.type=="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",c)),this._returnResult({data:{user:l,session:c},error:null})}catch(n){if(U(n))return this._returnResult({data:{user:null,session:null},error:n});throw n}}async signInWithSSO(e){var a,r,n,s;let i=null;try{let o=null,c=null;this.flowType==="pkce"&&([o,c,i]=await this._getCodeChallengeAndMethod());const l=await z(this.fetch,"POST",`${this.url}/sso`,{body:Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},"providerId"in e?{provider_id:e.providerId}:null),"domain"in e?{domain:e.domain}:null),{redirect_to:this._maybeAppendFlowIdToRedirect((a=e.options)===null||a===void 0?void 0:a.redirectTo,i)}),!((r=e==null?void 0:e.options)===null||r===void 0)&&r.captchaToken?{gotrue_meta_security:{captcha_token:e.options.captchaToken}}:null),{skip_http_redirect:!0,code_challenge:o,code_challenge_method:c}),headers:this.headers,xform:Du});return!((n=l.data)===null||n===void 0)&&n.url&&ve()&&!(!((s=e.options)===null||s===void 0)&&s.skipBrowserRedirect)&&window.location.assign(l.data.url),this._returnResult(l)}catch(o){if(await Ae(this.storage,this.storageKey,i),U(o))return this._returnResult({data:null,error:o});throw o}}async reauthenticate(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._reauthenticate()):await this._reauthenticate()}async _reauthenticate(){try{return await this._useSession(async e=>{const{data:{session:a},error:r}=e;if(r)throw r;if(!a)throw new he;const{error:n}=await z(this.fetch,"GET",`${this.url}/reauthenticate`,{headers:this.headers,jwt:a.access_token});return this._returnResult({data:{user:null,session:null},error:n})})}catch(e){if(U(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async resend(e){let a=null;try{const r=`${this.url}/resend`;if("email"in e){const{email:n,type:s,options:i}=e;let o=null,c=null;this.flowType==="pkce"&&([o,c,a]=await this._getCodeChallengeAndMethod());const{error:l}=await z(this.fetch,"POST",r,{headers:this.headers,body:{email:n,type:s,gotrue_meta_security:{captcha_token:i==null?void 0:i.captchaToken},code_challenge:o,code_challenge_method:c},redirectTo:this._maybeAppendFlowIdToRedirect(i==null?void 0:i.emailRedirectTo,a)});return l&&await Ae(this.storage,this.storageKey,a),this._returnResult({data:{user:null,session:null},error:l})}else if("phone"in e){const{phone:n,type:s,options:i}=e,{data:o,error:c}=await z(this.fetch,"POST",r,{headers:this.headers,body:{phone:n,type:s,gotrue_meta_security:{captcha_token:i==null?void 0:i.captchaToken}}});return this._returnResult({data:{user:null,session:null,messageId:o==null?void 0:o.message_id},error:c})}throw new Ga("You must provide either an email or phone number and a type")}catch(r){if(await Ae(this.storage,this.storageKey,a),U(r))return this._returnResult({data:{user:null,session:null},error:r});throw r}}async getSession(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>this._useSession(async e=>e)):await this._useSession(async e=>e)}async _acquireLock(e,a){this._debug("#_acquireLock","begin",e);try{if(this.lockAcquired){const r=this.pendingInLock.length?this.pendingInLock[this.pendingInLock.length-1]:Promise.resolve(),n=(async()=>(await r,await a()))();return this.pendingInLock.push((async()=>{try{await n}catch{}})()),n}return await this.lock(`lock:${this.storageKey}`,e,async()=>{this._debug("#_acquireLock","lock acquired for storage key",this.storageKey);try{this.lockAcquired=!0;const r=a();for(this.pendingInLock.push((async()=>{try{await r}catch{}})()),await r;this.pendingInLock.length;){const n=[...this.pendingInLock];await Promise.all(n),this.pendingInLock.splice(0,n.length)}return await r}finally{this._debug("#_acquireLock","lock released for storage key",this.storageKey),this.lockAcquired=!1}})}finally{this._debug("#_acquireLock","end")}}async _useSession(e){this._debug("#_useSession","begin");try{const a=await this.__loadSession();return await e(a)}finally{this._debug("#_useSession","end")}}async __loadSession(){this._debug("#__loadSession()","begin"),this.lock!=null&&!this.lockAcquired&&this._debug("#__loadSession()","used outside of an acquired lock!",new Error().stack);try{let e=null;const a=await ge(this.storage,this.storageKey);if(this._debug("#getSession()","session from storage",a),a!==null&&(this._isValidSession(a)?e=a:(this._debug("#getSession()","session from storage is not valid"),await this._removeSession())),!e)return{data:{session:null},error:null};const r=e.expires_at?e.expires_at*1e3-Date.now()<Xr:!1;if(this._debug("#__loadSession()",`session has${r?"":" not"} expired`,"expires_at",e.expires_at),!r){if(this.userStorage){const i=await ge(this.userStorage,this.storageKey+"-user");i!=null&&i.user?e.user=i.user:e.user=en()}if(this.storage.isServer&&e.user&&!e.user.__isUserNotAvailableProxy){const i={value:this.suppressGetSessionWarning};e.user=Iu(e.user,i),i.value&&(this.suppressGetSessionWarning=!0)}return{data:{session:e},error:null}}const{data:n,error:s}=await this._callRefreshToken(e.refresh_token);if(s){if(!!(e.expires_at&&e.expires_at*1e3>Date.now())){const o=await ge(this.storage,this.storageKey);if(o&&o.refresh_token===e.refresh_token)return this._returnResult({data:{session:e},error:null})}return this._returnResult({data:{session:null},error:s})}return this._returnResult({data:{session:n},error:null})}finally{this._debug("#__loadSession()","end")}}async getUser(e){if(e)return await this._getUser(e);await this.initializePromise;let a;return this.lock!=null?a=await this._acquireLock(this.lockAcquireTimeout,async()=>await this._getUser()):a=await this._getUser(),a.data.user&&(this.suppressGetSessionWarning=!0),a}async _getUser(e){try{return e?await z(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:e,xform:ot}):await this._useSession(async a=>{var r,n,s;const{data:i,error:o}=a;if(o)throw o;return!(!((r=i.session)===null||r===void 0)&&r.access_token)&&!this.hasCustomAuthorizationHeader?{data:{user:null},error:new he}:await z(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:(s=(n=i.session)===null||n===void 0?void 0:n.access_token)!==null&&s!==void 0?s:void 0,xform:ot})})}catch(a){if(U(a))return Wa(a)&&await this._removeSession(),this._returnResult({data:{user:null},error:a});throw a}}async updateUser(e,a={}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._updateUser(e,a)):await this._updateUser(e,a)}async _updateUser(e,a={}){let r=null;try{return await this._useSession(async n=>{const{data:s,error:i}=n;if(i)throw i;if(!s.session)throw new he;const o=s.session;let c=null,l=null;this.flowType==="pkce"&&e.email!=null&&([c,l,r]=await this._getCodeChallengeAndMethod());const{data:d,error:u}=await z(this.fetch,"PUT",`${this.url}/user`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(a==null?void 0:a.emailRedirectTo,r),body:Object.assign(Object.assign({},e),{code_challenge:c,code_challenge_method:l}),jwt:o.access_token,xform:ot});if(u)throw u;return o.user=d.user,await this._saveSession(o),await this._notifyAllSubscribers("USER_UPDATED",o),this._returnResult({data:{user:o.user},error:null})})}catch(n){if(await Ae(this.storage,this.storageKey,r),U(n))return this._returnResult({data:{user:null},error:n});throw n}}async setSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._setSession(e)):await this._setSession(e)}async _setSession(e){try{if(!e.access_token||!e.refresh_token)throw new he;const a=Date.now()/1e3;let r=a,n=!0,s=null;const{payload:i}=Qa(e.access_token);if(i.exp&&(r=i.exp,n=r<=a),n){const{data:o,error:c}=await this._callRefreshToken(e.refresh_token);if(c)return this._returnResult({data:{user:null,session:null},error:c});if(!o)return{data:{user:null,session:null},error:null};s=o}else{const{data:o,error:c}=await this._getUser(e.access_token);if(c)return this._returnResult({data:{user:null,session:null},error:c});s={access_token:e.access_token,refresh_token:e.refresh_token,user:o.user,token_type:"bearer",expires_in:r-a,expires_at:r},await this._saveSession(s),await this._notifyAllSubscribers("SIGNED_IN",s)}return this._returnResult({data:{user:s.user,session:s},error:null})}catch(a){if(U(a))return this._returnResult({data:{session:null,user:null},error:a});throw a}}async refreshSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._refreshSession(e)):await this._refreshSession(e)}async _refreshSession(e){try{return await this._useSession(async a=>{var r;if(!e){const{data:i,error:o}=a;if(o)throw o;e=(r=i.session)!==null&&r!==void 0?r:void 0}if(!(e!=null&&e.refresh_token))throw new he;const{data:n,error:s}=await this._callRefreshToken(e.refresh_token);return s?this._returnResult({data:{user:null,session:null},error:s}):n?this._returnResult({data:{user:n.user,session:n},error:null}):this._returnResult({data:{user:null,session:null},error:null})})}catch(a){if(U(a))return this._returnResult({data:{user:null,session:null},error:a});throw a}}async _getSessionFromURL(e,a){var r;try{if(!ve())throw new Ka("No browser detected.");if(e.error||e.error_description||e.error_code)throw new Ka(e.error_description||"Error in URL with unspecified error_description",{error:e.error||"unspecified_error",code:e.error_code||"unspecified_code"});switch(a){case"implicit":if(this.flowType==="pkce")throw new Ls("Not a valid PKCE flow url.");break;case"pkce":if(this.flowType==="implicit")throw new Ka("Not a valid implicit grant flow url.");break;default:}if(a==="pkce"){if(this._debug("#_initialize()","begin","is PKCE flow",!0),!e.code)throw new Ls("No code detected.");const{data:S,error:T}=await this._exchangeCodeForSession(e.code,{flowId:e[vt]});if(T)throw T;const A=new URL(window.location.href);return A.searchParams.delete("code"),A.searchParams.delete(vt),window.history.replaceState(window.history.state,"",A.toString()),{data:{session:S.session,redirectType:(r=S.redirectType)!==null&&r!==void 0?r:null},error:null}}const{provider_token:n,provider_refresh_token:s,access_token:i,refresh_token:o,expires_in:c,expires_at:l,token_type:d}=e;if(!i||!c||!o||!d)throw new Ka("No session defined in URL");const u=Math.round(Date.now()/1e3),p=parseInt(c);let m=u+p;l&&(m=parseInt(l));const f=m-u;f*1e3<=Ze&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${p}s`);const v=m-p;u-v>=120?console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale",v,m,u):u-v<0&&console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew",v,m,u);const{data:_,error:w}=await this._getUser(i);if(w)throw w;const k={provider_token:n,provider_refresh_token:s,access_token:i,expires_in:p,expires_at:m,refresh_token:o,token_type:d,user:_.user};return window.location.hash="",this._debug("#_getSessionFromURL()","clearing window.location.hash"),this._returnResult({data:{session:k,redirectType:e.type},error:null})}catch(n){if(U(n))return this._returnResult({data:{session:null,redirectType:null},error:n});throw n}}_isImplicitGrantCallback(e){return typeof this.detectSessionInUrl=="function"?this.detectSessionInUrl(new URL(window.location.href),e):!!(e.access_token||e.error||e.error_description||e.error_code)}async _isPKCECallback(e){if(!e.code)return!1;const a=nr(e[vt]);return a&&await ge(this.storage,Wt(this.storageKey,a))?!0:!!await ge(this.storage,`${this.storageKey}-code-verifier`)}async signOut(e={scope:"global"}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._signOut(e)):await this._signOut(e)}async _signOut({scope:e}={scope:"global"}){return await this._useSession(async a=>{var r;const n=async()=>{await this._removeSession()},{data:s,error:i}=a;if(i&&!Wa(i))return this._returnResult({error:i});const o=(r=s.session)===null||r===void 0?void 0:r.access_token;if(o){const{error:c}=await this.admin.signOut(o,e);if(c&&!(Ts(c)&&(c.status===404||c.status===401||c.status===403)||Wa(c)))return e!=="others"&&await n(),this._returnResult({error:c})}return e!=="others"&&await n(),this._returnResult({error:null})})}onAuthStateChange(e){const a=vu(),r={id:a,callback:e,unsubscribe:()=>{this._debug("#unsubscribe()","state change callback with id removed",a),this.stateChangeEmitters.delete(a)}};return this._debug("#onAuthStateChange()","registered callback with id",a),this.stateChangeEmitters.set(a,r),(async()=>(await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>{this._emitInitialSession(a)}):await this._emitInitialSession(a)))(),{data:{subscription:r}}}async _emitInitialSession(e){return await this._useSession(async a=>{var r,n;try{const{data:{session:s},error:i}=a;if(i)throw i;await((r=this.stateChangeEmitters.get(e))===null||r===void 0?void 0:r.callback("INITIAL_SESSION",s)),this._debug("INITIAL_SESSION","callback id",e,"session",s)}catch(s){if(await((n=this.stateChangeEmitters.get(e))===null||n===void 0?void 0:n.callback("INITIAL_SESSION",null)),this._debug("INITIAL_SESSION","callback id",e,"error",s),Ps(s))return;Wa(s)||Ja(s)||Ts(s)&&(s.code==="refresh_token_not_found"||s.code==="refresh_token_already_used"||s.code==="session_expired")?console.warn(s):console.error(s)}})}async resetPasswordForEmail(e,a={}){let r=null,n=null,s=null;this.flowType==="pkce"&&([r,n,s]=await this._getCodeChallengeAndMethod(!0));try{return await z(this.fetch,"POST",`${this.url}/recover`,{body:{email:e,code_challenge:r,code_challenge_method:n,gotrue_meta_security:{captcha_token:a.captchaToken}},headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(a.redirectTo,s)})}catch(i){if(await Ae(this.storage,this.storageKey,s),U(i))return this._returnResult({data:null,error:i});throw i}}async getUserIdentities(){var e;try{const{data:a,error:r}=await this.getUser();if(r)throw r;return this._returnResult({data:{identities:(e=a.user.identities)!==null&&e!==void 0?e:[]},error:null})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async linkIdentity(e){return"token"in e?this.linkIdentityIdToken(e):this.linkIdentityOAuth(e)}async linkIdentityOAuth(e){var a;let r=null;try{const{data:n,error:s}=await this._useSession(async i=>{var o,c,l,d,u;const{data:p,error:m}=i;if(m)throw m;const{url:f,flowId:v}=await this._getUrlForProvider(`${this.url}/user/identities/authorize`,e.provider,{redirectTo:(o=e.options)===null||o===void 0?void 0:o.redirectTo,scopes:(c=e.options)===null||c===void 0?void 0:c.scopes,queryParams:(l=e.options)===null||l===void 0?void 0:l.queryParams,skipBrowserRedirect:!0});return r=v,await z(this.fetch,"GET",f,{headers:this.headers,jwt:(u=(d=p.session)===null||d===void 0?void 0:d.access_token)!==null&&u!==void 0?u:void 0})});if(s)throw s;return ve()&&!(!((a=e.options)===null||a===void 0)&&a.skipBrowserRedirect)&&window.location.assign(n==null?void 0:n.url),this._returnResult({data:{provider:e.provider,url:n==null?void 0:n.url,flowId:r},error:null})}catch(n){if(U(n))return this._returnResult({data:{provider:e.provider,url:null,flowId:r},error:n});throw n}}async linkIdentityIdToken(e){return await this._useSession(async a=>{var r;try{const{error:n,data:{session:s}}=a;if(n)throw n;const{options:i,provider:o,token:c,access_token:l,nonce:d}=e,u=await z(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,jwt:(r=s==null?void 0:s.access_token)!==null&&r!==void 0?r:void 0,body:{provider:o,id_token:c,access_token:l,nonce:d,link_identity:!0,gotrue_meta_security:{captcha_token:i==null?void 0:i.captchaToken}},xform:Se}),{data:p,error:m}=u;return m?this._returnResult({data:{user:null,session:null},error:m}):!p||!p.session||!p.user?this._returnResult({data:{user:null,session:null},error:new qt}):(p.session&&(await this._saveSession(p.session),await this._notifyAllSubscribers("USER_UPDATED",p.session)),this._returnResult({data:p,error:m}))}catch(n){if(await Ae(this.storage,this.storageKey,null),U(n))return this._returnResult({data:{user:null,session:null},error:n});throw n}})}async unlinkIdentity(e){try{return await this._useSession(async a=>{var r,n;const{data:s,error:i}=a;if(i)throw i;return await z(this.fetch,"DELETE",`${this.url}/user/identities/${e.identity_id}`,{headers:this.headers,jwt:(n=(r=s.session)===null||r===void 0?void 0:r.access_token)!==null&&n!==void 0?n:void 0})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _refreshAccessToken(e){const a="#_refreshAccessToken()";this._debug(a,"begin");try{const r=Date.now();return await _u(async n=>(n>0&&await yu(200*Math.pow(2,n-1)),this._debug(a,"refreshing attempt",n),await z(this.fetch,"POST",`${this.url}/token?grant_type=refresh_token`,{body:{refresh_token:e},headers:this.headers,xform:Se})),(n,s)=>{const i=200*Math.pow(2,n);return s&&Ja(s)&&Date.now()+i-r<Ze})}catch(r){if(this._debug(a,"error",r),U(r))return this._returnResult({data:{session:null,user:null},error:r});throw r}finally{this._debug(a,"end")}}_isValidSession(e){return typeof e=="object"&&e!==null&&"access_token"in e&&"refresh_token"in e&&"expires_at"in e}async _handleProviderSignIn(e,a){const{url:r,flowId:n}=await this._getUrlForProvider(`${this.url}/authorize`,e,{redirectTo:a.redirectTo,scopes:a.scopes,queryParams:a.queryParams});return this._debug("#_handleProviderSignIn()","provider",e,"options",a,"url",r),ve()&&!a.skipBrowserRedirect&&window.location.assign(r),{data:{provider:e,url:r,flowId:n},error:null}}async _recoverAndRefresh(){var e,a;const r="#_recoverAndRefresh()";this._debug(r,"begin");try{const n=await ge(this.storage,this.storageKey);if(n&&this.userStorage){let i=await ge(this.userStorage,this.storageKey+"-user");!this.storage.isServer&&Object.is(this.storage,this.userStorage)&&!i&&(i={user:n.user},await et(this.userStorage,this.storageKey+"-user",i)),n.user=(e=i==null?void 0:i.user)!==null&&e!==void 0?e:en()}else if(n&&!n.user&&!n.user){const i=await ge(this.storage,this.storageKey+"-user");i&&(i!=null&&i.user)?(n.user=i.user,await be(this.storage,this.storageKey+"-user"),await et(this.storage,this.storageKey,n)):n.user=en()}if(this._debug(r,"session from storage",n),!this._isValidSession(n)){this._debug(r,"session is not valid"),n!==null&&await this._removeSession();return}const s=((a=n.expires_at)!==null&&a!==void 0?a:1/0)*1e3-Date.now()<Xr;if(this._debug(r,`session has${s?"":" not"} expired with margin of ${Xr}s`),s){if(this.autoRefreshToken&&n.refresh_token){const{error:i}=await this._callRefreshToken(n.refresh_token);i&&(Ps(i)?this._debug(r,"refresh discarded by commit guard",i):this._debug(r,"refresh failed",i))}}else if(n.user&&n.user.__isUserNotAvailableProxy===!0)try{const{data:i,error:o}=await this._getUser(n.access_token);!o&&(i!=null&&i.user)?(n.user=i.user,await this._saveSession(n),await this._notifyAllSubscribers("SIGNED_IN",n)):this._debug(r,"could not get user data, skipping SIGNED_IN notification")}catch(i){console.error("Error getting user data:",i),this._debug(r,"error getting user data, skipping SIGNED_IN notification",i)}else await this._notifyAllSubscribers("SIGNED_IN",n)}catch(n){this._debug(r,"error",n),Ja(n)?console.warn(n):console.error(n);return}finally{this._debug(r,"end")}}async _callRefreshToken(e){var a,r;if(!e)throw new he;if(this.refreshingDeferred)return this.refreshingDeferred.promise;if(this.lastRefreshFailure&&this.lastRefreshFailure.refreshToken===e&&Date.now()<this.lastRefreshFailure.expiresAt)return this._debug("#_callRefreshToken()","returning cached failure (cooldown active)"),this.lastRefreshFailure.result;const n="#_callRefreshToken()";this._debug(n,"begin");try{this.refreshingDeferred=new Nr,this.refreshingDeferred.promise.then(void 0,()=>{});const s=await ge(this.storage,this.storageKey),{data:i,error:o}=await this._refreshAccessToken(e);if(o)throw o;if(!i.session)throw new he;const c=await ge(this.storage,this.storageKey);if(s!==null&&(c===null||c.refresh_token!==s.refresh_token)){this._debug(n,"commit guard: storage changed since refresh started, discarding rotated tokens",{startedWith:"present",nowHolds:c?"replaced":"cleared"});const p={data:null,error:new Rs};return this.refreshingDeferred.resolve(p),p}const d=this._sessionRemovalEpoch;if(await this._saveSession(i.session),this._sessionRemovalEpoch!==d){this._debug(n,"commit guard (post-save): _removeSession ran during _saveSession, undoing write"),await be(this.storage,this.storageKey),this.userStorage&&await be(this.userStorage,this.storageKey+"-user");const p={data:null,error:new Rs};return this.refreshingDeferred.resolve(p),p}await this._notifyAllSubscribers("TOKEN_REFRESHED",i.session);const u={data:i.session,error:null};return this.lastRefreshFailure=null,this.refreshingDeferred.resolve(u),u}catch(s){if(this._debug(n,"error",s),U(s)){const i={data:null,error:s};if(!Ja(s)){const o=await ge(this.storage,this.storageKey);!!(o!=null&&o.expires_at&&o.expires_at*1e3>Date.now())?this._debug(n,"proactive refresh failed, access token still valid — preserving session"):await this._removeSession()}return this.lastRefreshFailure={refreshToken:e,result:i,expiresAt:Date.now()+tu},(a=this.refreshingDeferred)===null||a===void 0||a.resolve(i),i}throw(r=this.refreshingDeferred)===null||r===void 0||r.reject(s),s}finally{this.refreshingDeferred=null,this._debug(n,"end")}}async _notifyAllSubscribers(e,a,r=!0){if(this._pendingInitNotifications!==null&&r){this._pendingInitNotifications.push({event:e,session:a,broadcast:r});return}const n=`#_notifyAllSubscribers(${e})`;this._debug(n,"begin",a,`broadcast = ${r}`);try{this.broadcastChannel&&r&&this.broadcastChannel.postMessage({event:e,session:a});const s=[],i=Array.from(this.stateChangeEmitters.values()).map(async o=>{try{await o.callback(e,a)}catch(c){s.push(c)}});if(await Promise.all(i),s.length>0){for(let o=0;o<s.length;o+=1)console.error(s[o]);throw s[0]}}finally{this._debug(n,"end")}}async _saveSession(e){this._debug("#_saveSession()",e),this.suppressGetSessionWarning=!0;const a=Object.assign({},e),r=a.user&&a.user.__isUserNotAvailableProxy===!0;if(this.userStorage){!r&&a.user&&await et(this.userStorage,this.storageKey+"-user",{user:a.user});const n=Object.assign({},a);delete n.user;const s=js(n);await et(this.storage,this.storageKey,s)}else{const n=js(a);await et(this.storage,this.storageKey,n)}}async _removeSession(){this._sessionRemovalEpoch+=1,this._debug("#_removeSession()"),this.lastRefreshFailure=null,this.suppressGetSessionWarning=!1,await be(this.storage,this.storageKey),await Cu(this.storage,this.storageKey),await be(this.storage,this.storageKey+"-user"),this.userStorage&&await be(this.userStorage,this.storageKey+"-user"),await this._notifyAllSubscribers("SIGNED_OUT",null)}_removeVisibilityChangedCallback(){this._debug("#_removeVisibilityChangedCallback()");const e=this.visibilityChangedCallback;this.visibilityChangedCallback=null;try{e&&ve()&&(window!=null&&window.removeEventListener)&&window.removeEventListener("visibilitychange",e)}catch(a){console.error("removing visibilitychange callback failed",a)}}async _startAutoRefresh(){await this._stopAutoRefresh(),this._debug("#_startAutoRefresh()");const e=setInterval(()=>this._autoRefreshTokenTick(),Ze);this.autoRefreshTicker=e,e&&typeof e=="object"&&typeof e.unref=="function"?e.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(e);const a=setTimeout(async()=>{await this.initializePromise,await this._autoRefreshTokenTick()},0);this.autoRefreshTickTimeout=a,a&&typeof a=="object"&&typeof a.unref=="function"?a.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(a)}async _stopAutoRefresh(){this._debug("#_stopAutoRefresh()");const e=this.autoRefreshTicker;this.autoRefreshTicker=null,e&&clearInterval(e);const a=this.autoRefreshTickTimeout;this.autoRefreshTickTimeout=null,a&&clearTimeout(a)}async startAutoRefresh(){this._removeVisibilityChangedCallback(),await this._startAutoRefresh()}async stopAutoRefresh(){this._removeVisibilityChangedCallback(),await this._stopAutoRefresh()}async dispose(){var e;this._removeVisibilityChangedCallback(),await this._stopAutoRefresh(),(e=this.broadcastChannel)===null||e===void 0||e.close(),this.broadcastChannel=null,this.stateChangeEmitters.clear()}async _autoRefreshTokenTick(){if(this._debug("#_autoRefreshTokenTick()","begin"),this.lock!=null){try{await this._acquireLock(0,async()=>{try{const e=Date.now();try{return await this._useSession(async a=>{const{data:{session:r}}=a;if(!r||!r.refresh_token||!r.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}const n=Math.floor((r.expires_at*1e3-e)/Ze);this._debug("#_autoRefreshTokenTick()",`access token expires in ${n} ticks, a tick lasts ${Ze}ms, refresh threshold is ${ma} ticks`),n<=ma&&await this._callRefreshToken(r.refresh_token)})}catch(a){console.error("Auto refresh tick failed with error. This is likely a transient error.",a)}}finally{this._debug("#_autoRefreshTokenTick()","end")}})}catch(e){if(e instanceof Fu)this._debug("auto refresh token tick lock not available");else throw e}return}if(this.refreshingDeferred!==null){this._debug("#_autoRefreshTokenTick()","refresh already in flight, skipping");return}try{const e=Date.now();try{await this._useSession(async a=>{const{data:{session:r}}=a;if(!r||!r.refresh_token||!r.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}const n=Math.floor((r.expires_at*1e3-e)/Ze);this._debug("#_autoRefreshTokenTick()",`access token expires in ${n} ticks, a tick lasts ${Ze}ms, refresh threshold is ${ma} ticks`),n<=ma&&await this._callRefreshToken(r.refresh_token)})}catch(a){console.error("Auto refresh tick failed with error. This is likely a transient error.",a)}}finally{this._debug("#_autoRefreshTokenTick()","end")}}async _handleVisibilityChange(){if(this._debug("#_handleVisibilityChange()"),!ve()||!(window!=null&&window.addEventListener))return this.autoRefreshToken&&this.startAutoRefresh(),!1;try{this.visibilityChangedCallback=async()=>{try{await this._onVisibilityChanged(!1)}catch(e){this._debug("#visibilityChangedCallback","error",e)}},window==null||window.addEventListener("visibilitychange",this.visibilityChangedCallback),await this._onVisibilityChanged(!0)}catch(e){console.error("_handleVisibilityChange",e)}}async _onVisibilityChanged(e){const a=`#_onVisibilityChanged(${e})`;if(this._debug(a,"visibilityState",document.visibilityState),document.visibilityState==="visible"){if(this.autoRefreshToken&&this._startAutoRefresh(),!e)if(await this.initializePromise,this.lock!=null)await this._acquireLock(this.lockAcquireTimeout,async()=>{if(document.visibilityState!=="visible"){this._debug(a,"acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");return}await this._recoverAndRefresh()});else{if(document.visibilityState!=="visible"){this._debug(a,"visibilityState is no longer visible, skipping recovery");return}await this._recoverAndRefresh()}}else document.visibilityState==="hidden"&&this.autoRefreshToken&&this._stopAutoRefresh()}async _getUrlForProvider(e,a,r){let n=r==null?void 0:r.redirectTo,s=null,i=null,o=null;this.flowType==="pkce"&&([s,i,o]=await this._getCodeChallengeAndMethod(),n=this._maybeAppendFlowIdToRedirect(n,o));const c=[`provider=${encodeURIComponent(a)}`];if(n&&c.push(`redirect_to=${encodeURIComponent(n)}`),r!=null&&r.scopes&&c.push(`scopes=${encodeURIComponent(r.scopes)}`),s!=null&&i!=null){const l=new URLSearchParams({code_challenge:`${encodeURIComponent(s)}`,code_challenge_method:`${encodeURIComponent(i)}`});c.push(l.toString())}if(r!=null&&r.queryParams){const l=new URLSearchParams(r.queryParams);c.push(l.toString())}return r!=null&&r.skipBrowserRedirect&&c.push(`skip_http_redirect=${r.skipBrowserRedirect}`),{url:`${e}?${c.join("&")}`,flowId:o}}_maybeAppendFlowIdToRedirect(e,a){return!e||!a||!this.experimental.appendPkceFlowIdToRedirects?e??void 0:Tu(e,a)}async _getCodeChallengeAndMethod(e=!1){return Lu(this.storage,this.storageKey,e,a=>this._debug("#_getCodeChallengeAndMethod()","evicted oldest pending PKCE verifier slot",a))}async _unenroll(e){try{return await this._useSession(async a=>{var r;const{data:n,error:s}=a;return s?this._returnResult({data:null,error:s}):await z(this.fetch,"DELETE",`${this.url}/factors/${e.factorId}`,{headers:this.headers,jwt:(r=n==null?void 0:n.session)===null||r===void 0?void 0:r.access_token})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _enroll(e){try{return await this._useSession(async a=>{var r,n;const{data:s,error:i}=a;if(i)return this._returnResult({data:null,error:i});const o=Object.assign({friendly_name:e.friendlyName,factor_type:e.factorType},e.factorType==="phone"?{phone:e.phone}:e.factorType==="totp"?{issuer:e.issuer}:{}),{data:c,error:l}=await z(this.fetch,"POST",`${this.url}/factors`,{body:o,headers:this.headers,jwt:(r=s==null?void 0:s.session)===null||r===void 0?void 0:r.access_token});return l?this._returnResult({data:null,error:l}):(e.factorType==="totp"&&c.type==="totp"&&(!((n=c==null?void 0:c.totp)===null||n===void 0)&&n.qr_code)&&(c.totp.qr_code=`data:image/svg+xml;utf-8,${c.totp.qr_code}`),this._returnResult({data:c,error:null}))})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _verify(e){const a=async()=>{try{return await this._useSession(async r=>{var n;const{data:s,error:i}=r;if(i)return this._returnResult({data:null,error:i});const o=Object.assign({challenge_id:e.challengeId},"webauthn"in e?{webauthn:Object.assign(Object.assign({},e.webauthn),{credential_response:e.webauthn.type==="create"?Vs(e.webauthn.credential_response):Ws(e.webauthn.credential_response)})}:{code:e.code}),{data:c,error:l}=await z(this.fetch,"POST",`${this.url}/factors/${e.factorId}/verify`,{body:o,headers:this.headers,jwt:(n=s==null?void 0:s.session)===null||n===void 0?void 0:n.access_token});return l?this._returnResult({data:null,error:l}):(await this._saveSession(Object.assign({expires_at:Math.round(Date.now()/1e3)+c.expires_in},c)),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",c),this._returnResult({data:c,error:l}))})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,a):a()}async _challenge(e){const a=async()=>{try{return await this._useSession(async r=>{var n;const{data:s,error:i}=r;if(i)return this._returnResult({data:null,error:i});const o=await z(this.fetch,"POST",`${this.url}/factors/${e.factorId}/challenge`,{body:e,headers:this.headers,jwt:(n=s==null?void 0:s.session)===null||n===void 0?void 0:n.access_token});if(o.error)return o;const{data:c}=o;if(c.type!=="webauthn")return{data:c,error:null};switch(c.webauthn.type){case"create":return{data:Object.assign(Object.assign({},c),{webauthn:Object.assign(Object.assign({},c.webauthn),{credential_options:Object.assign(Object.assign({},c.webauthn.credential_options),{publicKey:Bs(c.webauthn.credential_options.publicKey)})})}),error:null};case"request":return{data:Object.assign(Object.assign({},c),{webauthn:Object.assign(Object.assign({},c.webauthn),{credential_options:Object.assign(Object.assign({},c.webauthn.credential_options),{publicKey:zs(c.webauthn.credential_options.publicKey)})})}),error:null}}})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,a):a()}async _challengeAndVerify(e){const{data:a,error:r}=await this._challenge({factorId:e.factorId});return r?this._returnResult({data:null,error:r}):await this._verify({factorId:e.factorId,challengeId:a.id,code:e.code})}async _listFactors(){var e;const{data:{user:a},error:r}=await this.getUser();if(r)return{data:null,error:r};const n={all:[],phone:[],totp:[],webauthn:[],recovery_code:[]};for(const s of(e=a==null?void 0:a.factors)!==null&&e!==void 0?e:[])n.all.push(s),s.status==="verified"&&s.factor_type in n&&Array.isArray(n[s.factor_type])&&n[s.factor_type].push(s);return{data:n,error:null}}async _getAuthenticatorAssuranceLevel(e){var a,r,n,s;if(e)try{const{payload:m}=Qa(e);let f=null;m.aal&&(f=m.aal);let v=f;const{data:{user:_},error:w}=await this.getUser(e);if(w)return this._returnResult({data:null,error:w});((r=(a=_==null?void 0:_.factors)===null||a===void 0?void 0:a.filter(T=>T.status==="verified"))!==null&&r!==void 0?r:[]).length>0&&(v="aal2");const S=m.amr||[];return{data:{currentLevel:f,nextLevel:v,currentAuthenticationMethods:S},error:null}}catch(m){if(U(m))return this._returnResult({data:null,error:m});throw m}const{data:{session:i},error:o}=await this.getSession();if(o)return this._returnResult({data:null,error:o});if(!i)return{data:{currentLevel:null,nextLevel:null,currentAuthenticationMethods:[]},error:null};const{payload:c}=Qa(i.access_token);let l=null;c.aal&&(l=c.aal);let d=l;((s=(n=i.user.factors)===null||n===void 0?void 0:n.filter(m=>m.status==="verified"))!==null&&s!==void 0?s:[]).length>0&&(d="aal2");const p=c.amr||[];return{data:{currentLevel:l,nextLevel:d,currentAuthenticationMethods:p},error:null}}async _getRecoveryCodesStatus(){ia(this.experimental);try{return await this._useSession(async e=>{var a;const{data:r,error:n}=e;if(n)return this._returnResult({data:null,error:n});const{data:s,error:i}=await z(this.fetch,"GET",`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:(a=r==null?void 0:r.session)===null||a===void 0?void 0:a.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _generateRecoveryCodes(e){ia(this.experimental);try{return await this._useSession(async a=>{var r;const{data:n,error:s}=a;if(s)return this._returnResult({data:null,error:s});const{data:i,error:o}=await z(this.fetch,"POST",`${this.url}/factors/recovery-codes`,{body:e!=null&&e.friendlyName?{friendly_name:e.friendlyName}:void 0,headers:this.headers,jwt:(r=n==null?void 0:n.session)===null||r===void 0?void 0:r.access_token});return o?this._returnResult({data:null,error:o}):this._returnResult({data:i,error:null})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _verifyRecoveryCode(e){ia(this.experimental);const a=async()=>{try{return await this._useSession(async r=>{var n;const{data:s,error:i}=r;if(i)return this._returnResult({data:null,error:i});const{data:o,error:c}=await z(this.fetch,"POST",`${this.url}/factors/recovery-codes/verify`,{body:{code:e.code},headers:this.headers,jwt:(n=s==null?void 0:s.session)===null||n===void 0?void 0:n.access_token});if(c)return this._returnResult({data:null,error:c});const l=Object.assign({expires_at:co(o.expires_in)},o);return await this._saveSession(l),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",l),this._returnResult({data:o,error:null})})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,a):a()}async _regenerateRecoveryCodes(){ia(this.experimental);try{return await this._useSession(async e=>{var a;const{data:r,error:n}=e;if(n)return this._returnResult({data:null,error:n});const{data:s,error:i}=await z(this.fetch,"POST",`${this.url}/factors/recovery-codes/regenerate`,{headers:this.headers,jwt:(a=r==null?void 0:r.session)===null||a===void 0?void 0:a.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _unenrollRecoveryCodes(){ia(this.experimental);try{return await this._useSession(async e=>{var a;const{data:r,error:n}=e;if(n)return this._returnResult({data:null,error:n});const{data:s,error:i}=await z(this.fetch,"DELETE",`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:(a=r==null?void 0:r.session)===null||a===void 0?void 0:a.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _getAuthorizationDetails(e){try{return await this._useSession(async a=>{const{data:{session:r},error:n}=a;return n?this._returnResult({data:null,error:n}):r?await z(this.fetch,"GET",`${this.url}/oauth/authorizations/${e}`,{headers:this.headers,jwt:r.access_token,xform:s=>({data:s,error:null})}):this._returnResult({data:null,error:new he})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _approveAuthorization(e,a){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;if(s)return this._returnResult({data:null,error:s});if(!n)return this._returnResult({data:null,error:new he});const i=await z(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:n.access_token,body:{action:"approve"},xform:o=>({data:o,error:null})});return i.data&&i.data.redirect_url&&ve()&&!(a!=null&&a.skipBrowserRedirect)&&window.location.assign(i.data.redirect_url),i})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}}async _denyAuthorization(e,a){try{return await this._useSession(async r=>{const{data:{session:n},error:s}=r;if(s)return this._returnResult({data:null,error:s});if(!n)return this._returnResult({data:null,error:new he});const i=await z(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:n.access_token,body:{action:"deny"},xform:o=>({data:o,error:null})});return i.data&&i.data.redirect_url&&ve()&&!(a!=null&&a.skipBrowserRedirect)&&window.location.assign(i.data.redirect_url),i})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}}async _listOAuthGrants(){try{return await this._useSession(async e=>{const{data:{session:a},error:r}=e;return r?this._returnResult({data:null,error:r}):a?await z(this.fetch,"GET",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:a.access_token,xform:n=>({data:n,error:null})}):this._returnResult({data:null,error:new he})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _revokeOAuthGrant(e){try{return await this._useSession(async a=>{const{data:{session:r},error:n}=a;return n?this._returnResult({data:null,error:n}):r?(await z(this.fetch,"DELETE",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:r.access_token,query:{client_id:e.clientId},noResolveJson:!0}),{data:{},error:null}):this._returnResult({data:null,error:new he})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async fetchJwk(e,a={keys:[]}){let r=a.keys.find(o=>o.kid===e);if(r)return r;const n=Date.now();if(r=this.jwks.keys.find(o=>o.kid===e),r&&this.jwks_cached_at+ou>n)return r;const{data:s,error:i}=await z(this.fetch,"GET",`${this.url}/.well-known/jwks.json`,{headers:this.headers});if(i)throw i;return!s.keys||s.keys.length===0||(this.jwks=s,this.jwks_cached_at=n,r=s.keys.find(o=>o.kid===e),!r)?null:r}async getClaims(e,a={}){try{let r=e;if(!r){const{data:m,error:f}=await this.getSession();if(f||!m.session)return this._returnResult({data:null,error:f});r=m.session.access_token}const{header:n,payload:s,signature:i,raw:{header:o,payload:c}}=Qa(r);if(!(a!=null&&a.allowExpired))try{qu(s.exp)}catch(m){throw new dr(m instanceof Error?m.message:"JWT validation failed")}const l=!n.alg||n.alg.startsWith("HS")||!n.kid||!("crypto"in globalThis&&"subtle"in globalThis.crypto)?null:await this.fetchJwk(n.kid,a!=null&&a.keys?{keys:a.keys}:a==null?void 0:a.jwks);if(!l){const{error:m}=await this.getUser(r);if(m)throw m;return{data:{claims:s,header:n,signature:i},error:null}}const d=xu(n.alg),u=await crypto.subtle.importKey("jwk",l,d,!0,["verify"]);if(!await crypto.subtle.verify(d,u,i,fu(`${o}.${c}`)))throw new dr("Invalid JWT signature");return{data:{claims:s,header:n,signature:i},error:null}}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}}async signInWithPasskey(e){var a,r,n;Le(this.experimental);try{if(!hr())return this._returnResult({data:null,error:new qe("Browser does not support WebAuthn",null)});const{data:s,error:i}=await this._startPasskeyAuthentication({options:{captchaToken:(a=e==null?void 0:e.options)===null||a===void 0?void 0:a.captchaToken}});if(i||!s)return this._returnResult({data:null,error:i});const o=zs(s.options),c=(n=(r=e==null?void 0:e.options)===null||r===void 0?void 0:r.signal)!==null&&n!==void 0?n:Cn.createNewAbortSignal(),{data:l,error:d}=await vo({publicKey:o,signal:c});if(d||!l)return this._returnResult({data:null,error:d??new qe("WebAuthn ceremony failed",null)});const u=Ws(l);return this._verifyPasskeyAuthentication({challengeId:s.challenge_id,credential:u})}catch(s){if(U(s))return this._returnResult({data:null,error:s});throw s}}async registerPasskey(e){var a,r;Le(this.experimental);try{if(!hr())return this._returnResult({data:null,error:new qe("Browser does not support WebAuthn",null)});const{data:n,error:s}=await this._startPasskeyRegistration();if(s||!n)return this._returnResult({data:null,error:s});const i=Bs(n.options),o=(r=(a=e==null?void 0:e.options)===null||a===void 0?void 0:a.signal)!==null&&r!==void 0?r:Cn.createNewAbortSignal(),{data:c,error:l}=await fo({publicKey:i,signal:o});if(l||!c)return this._returnResult({data:null,error:l??new qe("WebAuthn ceremony failed",null)});const d=Vs(c);return this._verifyPasskeyRegistration({challengeId:n.challenge_id,credential:d})}catch(n){if(U(n))return this._returnResult({data:null,error:n});throw n}}async _startPasskeyRegistration(){Le(this.experimental);try{return await this._useSession(async e=>{const{data:{session:a},error:r}=e;if(r)return this._returnResult({data:null,error:r});if(!a)return this._returnResult({data:null,error:new he});const{data:n,error:s}=await z(this.fetch,"POST",`${this.url}/passkeys/registration/options`,{headers:this.headers,jwt:a.access_token,body:{}});return s?this._returnResult({data:null,error:s}):this._returnResult({data:n,error:null})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyRegistration(e){Le(this.experimental);try{return await this._useSession(async a=>{const{data:{session:r},error:n}=a;if(n)return this._returnResult({data:null,error:n});if(!r)return this._returnResult({data:null,error:new he});const{data:s,error:i}=await z(this.fetch,"POST",`${this.url}/passkeys/registration/verify`,{headers:this.headers,jwt:r.access_token,body:{challenge_id:e.challengeId,credential:e.credential}});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _startPasskeyAuthentication(e){var a;Le(this.experimental);try{const{data:r,error:n}=await z(this.fetch,"POST",`${this.url}/passkeys/authentication/options`,{headers:this.headers,body:{gotrue_meta_security:{captcha_token:(a=e==null?void 0:e.options)===null||a===void 0?void 0:a.captchaToken}}});return n?this._returnResult({data:null,error:n}):this._returnResult({data:r,error:null})}catch(r){if(U(r))return this._returnResult({data:null,error:r});throw r}}async _verifyPasskeyAuthentication(e){Le(this.experimental);try{const{data:a,error:r}=await z(this.fetch,"POST",`${this.url}/passkeys/authentication/verify`,{headers:this.headers,body:{challenge_id:e.challengeId,credential:e.credential},xform:Se});return r?this._returnResult({data:null,error:r}):(a.session&&(await this._saveSession(a.session),await this._notifyAllSubscribers("SIGNED_IN",a.session)),this._returnResult({data:a,error:null}))}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _listPasskeys(){Le(this.experimental);try{return await this._useSession(async e=>{const{data:{session:a},error:r}=e;if(r)return this._returnResult({data:null,error:r});if(!a)return this._returnResult({data:null,error:new he});const{data:n,error:s}=await z(this.fetch,"GET",`${this.url}/passkeys`,{headers:this.headers,jwt:a.access_token,xform:i=>({data:i,error:null})});return s?this._returnResult({data:null,error:s}):this._returnResult({data:n,error:null})})}catch(e){if(U(e))return this._returnResult({data:null,error:e});throw e}}async _updatePasskey(e){Le(this.experimental);try{return await this._useSession(async a=>{const{data:{session:r},error:n}=a;if(n)return this._returnResult({data:null,error:n});if(!r)return this._returnResult({data:null,error:new he});const{data:s,error:i}=await z(this.fetch,"PATCH",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:r.access_token,body:{friendly_name:e.friendlyName}});return i?this._returnResult({data:null,error:i}):this._returnResult({data:s,error:null})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}async _deletePasskey(e){Le(this.experimental);try{return await this._useSession(async a=>{const{data:{session:r},error:n}=a;if(n)return this._returnResult({data:null,error:n});if(!r)return this._returnResult({data:null,error:new he});const{error:s}=await z(this.fetch,"DELETE",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:r.access_token,noResolveJson:!0});return s?this._returnResult({data:null,error:s}):this._returnResult({data:null,error:null})})}catch(a){if(U(a))return this._returnResult({data:null,error:a});throw a}}}Aa.nextInstanceID={};const ap=Aa,rp="2.116.0";let fa="",fr;if(typeof Deno<"u"){var an;fa="deno",fr=(an=Deno.version)===null||an===void 0?void 0:an.deno}else if(typeof document<"u")fa="web";else if(typeof navigator<"u"&&navigator.product==="ReactNative")fa="react-native";else{var rn;fa="node";const t=globalThis.process;fr=t==null||(rn=t.version)===null||rn===void 0?void 0:rn.replace(/^v/,"")}const go=[`runtime=${fa}`];fr&&go.push(`runtime-version=${fr}`);const np={"X-Client-Info":`supabase-js/${rp}; ${go.join("; ")}`},sp={headers:np},ip={schema:"public"},op={autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,flowType:"implicit"},cp={},lp={enabled:!1,respectSamplingDecision:!0};function dp(t){if(!t||typeof t!="string")return null;const e=t.split("-");if(e.length!==4)return null;const[a,r,n,s]=e;if(a.length!==2||r.length!==32||n.length!==16||s.length!==2)return null;const i=/^[0-9a-f]+$/i;return!i.test(a)||!i.test(r)||!i.test(n)||!i.test(s)||r==="00000000000000000000000000000000"||n==="0000000000000000"?null:{version:a,traceId:r,parentId:n,traceFlags:s,isSampled:(parseInt(s,16)&1)===1}}function up(t,e){if(!t||!e||e.length===0)return!1;let a;if(t instanceof URL)a=t;else try{a=new URL(t)}catch{return!1}for(const r of e)try{if(typeof r=="string"){if(pp(a.hostname,r))return!0}else if(r instanceof RegExp){if(r.test(a.hostname))return!0}else if(typeof r=="function"&&r(a))return!0}catch{continue}return!1}function pp(t,e){if(e===t)return!0;if(e.startsWith("*.")){const a=e.slice(2);if(t.endsWith(a)&&(t===a||t.endsWith("."+a)))return!0}return!1}function hp(t){const e=[];try{const a=new URL(t);e.push(a.hostname)}catch{}return e.push("*.supabase.co","*.supabase.in"),e.push("localhost","127.0.0.1","[::1]"),e}function Ca(t){"@babel/helpers - typeof";return Ca=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ca(t)}function mp(t,e){if(Ca(t)!="object"||!t)return t;var a=t[Symbol.toPrimitive];if(a!==void 0){var r=a.call(t,e);if(Ca(r)!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function fp(t){var e=mp(t,"string");return Ca(e)=="symbol"?e:e+""}function vp(t,e,a){return(e=fp(e))in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function Ks(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(n){return Object.getOwnPropertyDescriptor(t,n).enumerable})),a.push.apply(a,r)}return a}function de(t){for(var e=1;e<arguments.length;e++){var a=arguments[e]!=null?arguments[e]:{};e%2?Ks(Object(a),!0).forEach(function(r){vp(t,r,a[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):Ks(Object(a)).forEach(function(r){Object.defineProperty(t,r,Object.getOwnPropertyDescriptor(a,r))})}return t}const gp=t=>t?(...e)=>t(...e):(...e)=>fetch(...e),yp=()=>Headers,yo=t=>t.startsWith("sb_publishable_")||t.startsWith("sb_secret_"),_p="sb_temp_",Js=new Set,bp=t=>{var e,a;if(!t.startsWith("sb_")||yo(t)||t.startsWith(_p))return;const r=(e=(a=t.match(/^sb_[a-zA-Z0-9]+_/))===null||a===void 0?void 0:a[0])!==null&&e!==void 0?e:"unknown";Js.has(r)||(Js.add(r),console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type."))},Qs=(t,e,a,r,n,s)=>{const i=gp(r),o=yp(),c=(n==null?void 0:n.enabled)===!0,l=(n==null?void 0:n.respectSamplingDecision)!==!1,d=c?hp(e):null,u=!(s!=null&&s.omitApiKeyAsBearer&&yo(t));return async(p,m)=>{const f=await a();let v=new o(m==null?void 0:m.headers);if(v.has("apikey")||v.set("apikey",t),!v.has("Authorization")){const _=f??(u?t:null);_&&v.set("Authorization",`Bearer ${_}`)}if(d){const _=wp(p,d,l);_&&(_.traceparent&&!v.has("traceparent")&&v.set("traceparent",_.traceparent),_.tracestate&&!v.has("tracestate")&&v.set("tracestate",_.tracestate),_.baggage&&!v.has("baggage")&&v.set("baggage",_.baggage))}return i(p,de(de({},m),{},{headers:v}))}};let Ys=!1,Zs=!1;function wp(t,e,a){const r=_l();if(!r)return Ys||(Ys=!0,console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")),null;if(!up(typeof t=="string"||t instanceof URL?t:t.url,e))return null;const n=r();if(!n||!n.traceparent){var s;if(!(n==null||(s=n.carrierKeys)===null||s===void 0)&&s.length&&!Zs){Zs=!0;const i=n.carrierKeys.includes("sentry-trace")?" Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it.":" Configure your tracing SDK to emit W3C trace context on outgoing requests.";console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${n.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.`+i)}return null}if(a){const i=dp(n.traceparent);if(i&&!i.isSampled)return{traceparent:n.traceparent}}return n}function Xs(t){return typeof t=="boolean"?{enabled:t}:t}function $p(t){return t.endsWith("/")?t:t+"/"}let ei=!1;function Sp(t){ei||typeof t!="object"||t===null||!("schema"in t)||t.schema===void 0||(ei=!0,console.warn(`@supabase/supabase-js: The "schema" option must be nested under "db", e.g. createClient(url, key, { db: { schema: 'myschema' } }). A top-level "schema" is ignored and queries go to the default schema.`))}function Ep(t,e){var a,r,n,s,i,o;const{db:c,auth:l,realtime:d,global:u}=t,{db:p,auth:m,realtime:f,global:v}=e,_=Xs(t.tracePropagation),w=Xs(e.tracePropagation),k={db:de(de({},p),c),auth:de(de({},m),l),realtime:de(de({},f),d),storage:{},global:de(de(de({},v),u),{},{headers:de(de({},(a=v==null?void 0:v.headers)!==null&&a!==void 0?a:{}),(r=u==null?void 0:u.headers)!==null&&r!==void 0?r:{})}),tracePropagation:{enabled:(n=(s=_==null?void 0:_.enabled)!==null&&s!==void 0?s:w==null?void 0:w.enabled)!==null&&n!==void 0?n:!1,respectSamplingDecision:(i=(o=_==null?void 0:_.respectSamplingDecision)!==null&&o!==void 0?o:w==null?void 0:w.respectSamplingDecision)!==null&&i!==void 0?i:!0},accessToken:async()=>""};return t.accessToken?k.accessToken=t.accessToken:delete k.accessToken,k}function kp(t){const e=t==null?void 0:t.trim();if(!e)throw new Error("supabaseUrl is required.");if(!e.match(/^https?:\/\//i))throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");try{return new URL($p(e))}catch{throw Error("Invalid supabaseUrl: Provided URL is malformed.")}}var Ap=class extends ap{constructor(t){super(t)}},Cp=class{constructor(t,e,a){var r,n;this.supabaseUrl=t,this.supabaseKey=e;const s=kp(t);if(!e)throw new Error("supabaseKey is required.");bp(e),Sp(a),this.realtimeUrl=new URL("realtime/v1",s),this.realtimeUrl.protocol=this.realtimeUrl.protocol.replace("http","ws"),this.authUrl=new URL("auth/v1",s),this.storageUrl=new URL("storage/v1",s),this.functionsUrl=new URL("functions/v1",s);const i=`sb-${s.hostname.split(".")[0]}-auth-token`,o={db:ip,realtime:cp,auth:de(de({},op),{},{storageKey:i}),global:sp,tracePropagation:lp},c=Ep(a??{},o);if(this.settings=c,this.storageKey=(r=c.auth.storageKey)!==null&&r!==void 0?r:"",this.headers=(n=c.global.headers)!==null&&n!==void 0?n:{},c.accessToken)this.accessToken=c.accessToken,this.auth=new Proxy({},{get:(d,u)=>{throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(u)} is not possible`)}});else{var l;this.auth=this._initSupabaseAuthClient((l=c.auth)!==null&&l!==void 0?l:{},this.headers,c.global.fetch)}this.fetch=Qs(e,t,this._getSessionToken.bind(this),c.global.fetch,c.tracePropagation),this.functionsFetch=Qs(e,t,this._getSessionToken.bind(this),c.global.fetch,c.tracePropagation,{omitApiKeyAsBearer:!0}),this.realtime=this._initRealtimeClient(de({headers:this.headers,accessToken:this._getAccessToken.bind(this),fetch:this.fetch},c.realtime)),this.accessToken&&Promise.resolve(this.accessToken()).then(d=>this.realtime.setAuth(d)).catch(d=>console.warn("Failed to set initial Realtime auth token:",d)),this.rest=new xl(new URL("rest/v1",s).href,{headers:this.headers,schema:c.db.schema,fetch:this.fetch,timeout:c.db.timeout,urlLengthLimit:c.db.urlLengthLimit,retry:c.db.retry}),this.storage=new eu(this.storageUrl.href,this.headers,this.fetch,a==null?void 0:a.storage),c.accessToken||this._listenForAuthEvents()}get functions(){return new Sl(this.functionsUrl.href,{headers:this.headers,customFetch:this.functionsFetch})}from(t){return this.rest.from(t)}schema(t){return this.rest.schema(t)}getOpenApiSpec(){return this.rest.getOpenApiSpec()}rpc(t,e={},a={head:!1,get:!1,count:void 0}){return this.rest.rpc(t,e,a)}channel(t,e={config:{}}){return this.realtime.channel(t,e)}getChannels(){return this.realtime.getChannels()}removeChannel(t){return this.realtime.removeChannel(t)}removeAllChannels(){return this.realtime.removeAllChannels()}async _getSessionToken(){var t=this,e,a;if(t.accessToken)return await t.accessToken();const{data:r}=await t.auth.getSession();return(e=(a=r.session)===null||a===void 0?void 0:a.access_token)!==null&&e!==void 0?e:null}async _getAccessToken(){var t=this,e;return(e=await t._getSessionToken())!==null&&e!==void 0?e:t.supabaseKey}_initSupabaseAuthClient({autoRefreshToken:t,persistSession:e,detectSessionInUrl:a,storage:r,userStorage:n,storageKey:s,flowType:i,lock:o,debug:c,throwOnError:l,experimental:d,lockAcquireTimeout:u,skipAutoInitialize:p},m,f){const v={Authorization:`Bearer ${this.supabaseKey}`,apikey:`${this.supabaseKey}`};return new Ap({url:this.authUrl.href,headers:de(de({},v),m),storageKey:s,autoRefreshToken:t,persistSession:e,detectSessionInUrl:a,storage:r,userStorage:n,flowType:i,lock:o,debug:c,throwOnError:l,experimental:d,fetch:f,lockAcquireTimeout:u,skipAutoInitialize:p,hasCustomAuthorizationHeader:Object.keys(this.headers).some(_=>_.toLowerCase()==="authorization")})}_initRealtimeClient(t){return new Ed(this.realtimeUrl.href,de(de({},t),{},{params:de(de({},{apikey:this.supabaseKey}),t==null?void 0:t.params)}))}_listenForAuthEvents(){return this.auth.onAuthStateChange((t,e)=>{this._handleTokenChanged(t,"CLIENT",e==null?void 0:e.access_token)})}_handleTokenChanged(t,e,a){(t==="TOKEN_REFRESHED"||t==="SIGNED_IN"||t==="INITIAL_SESSION")&&this.changedAccessToken!==a?(this.changedAccessToken=a,this.realtime.setAuth(a)):t==="SIGNED_OUT"&&(this.realtime.setAuth(),e=="STORAGE"&&this.auth.signOut(),this.changedAccessToken=void 0)}};const Tp=(t,e,a)=>new Cp(t,e,a);function Lp(){if(typeof window<"u"||globalThis.Deno!==void 0)return!1;const t=globalThis.process;if(!t)return!1;const e=t.version;if(e==null)return!1;const a=e.match(/^v(\d+)\./);return a?parseInt(a[1],10)<=20:!1}Lp()&&console.warn("⚠️  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");const _o="https://hojnbibjbicrfuytfypo.supabase.co".trim(),bo="sb_publishable_cHF1gyRXnIQyPYY0SdPWUg_Xch_CZNm".trim();function Rp(){const t=[];return _o||t.push("VITE_SUPABASE_URL não foi definida."),bo||t.push("VITE_SUPABASE_PUBLISHABLE_KEY não foi definida."),{isValid:t.length===0,errors:t}}const Tn=Rp();Tn.isValid||console.error("Configuração do Supabase inválida:",Tn.errors);const V=Tn.isValid?Tp(_o,bo,{db:{schema:"public"},auth:{autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!1}}):null,Pp=new Set(["/callback","/recovery","/login","/reset-password"]),qp=new Set(["/auth/callback","/auth/recovery","/login","/reset-password"]);function wo(t,{native:e=!1,origin:a}={}){try{const r=new URL(t);return r.username||r.password||r.port&&e?!1:e?r.protocol==="meuagro:"&&r.hostname==="auth"&&Pp.has(r.pathname):["https:","http:"].includes(r.protocol)&&r.origin===a&&qp.has(r.pathname)}catch{return!1}}function xp(t){const e=new URL(t),a=new URLSearchParams(e.hash.slice(1));return e.pathname.startsWith("/auth/")||["code","error","error_description","access_token","refresh_token"].some(r=>e.searchParams.has(r)||a.has(r))}async function $o(t,e,a){var c;if(!wo(t,a))throw new Error("Link de autenticação inválido.");if(!e)throw new Error("O serviço de autenticação não está configurado.");const r=new URL(t),n=new URLSearchParams(r.hash.slice(1)),s=l=>r.searchParams.get(l)||n.get(l);if(s("error")||s("error_description"))throw new Error("Este link expirou, já foi utilizado ou foi cancelado. Solicite um novo e-mail.");let i;if(s("code"))i=await e.auth.exchangeCodeForSession(s("code"));else if(n.get("access_token")&&n.get("refresh_token"))i=await e.auth.setSession({access_token:n.get("access_token"),refresh_token:n.get("refresh_token")});else throw new Error("Link incompleto. Abra o link enviado no e-mail ou solicite um novo.");if(i.error)throw new Error("Não foi possível validar o link. Solicite um novo e-mail e abra-o no dispositivo que iniciou a solicitação.");if(!((c=i.data)!=null&&c.session))throw new Error("O link não criou uma sessão válida. Solicite um novo e-mail.");return["/recovery","/auth/recovery","/reset-password"].includes(r.pathname)||s("type")==="recovery"||i.data.redirectType==="recovery"?"/reset-password":"/dashboard"}/*! Capacitor: https://capacitorjs.com/ - MIT License */var Gt;(function(t){t.Unimplemented="UNIMPLEMENTED",t.Unavailable="UNAVAILABLE"})(Gt||(Gt={}));class Xe extends Error{constructor(e,a,r){super(e),this.message=e,this.code=a,this.data=r}}const Np=t=>{var e,a;return t!=null&&t.androidBridge?"android":!((a=(e=t==null?void 0:t.webkit)===null||e===void 0?void 0:e.messageHandlers)===null||a===void 0)&&a.bridge?"ios":"web"},Ip=t=>{const e=t.CapacitorCustomPlatform||null,a=t.Capacitor||{},r=a.Plugins=a.Plugins||{},n=()=>e!==null?e.name:Np(t),s=()=>n()!=="web",i=u=>{const p=l.get(u);return!!(p!=null&&p.platforms.has(n())||o(u))},o=u=>{var p;return(p=a.PluginHeaders)===null||p===void 0?void 0:p.find(m=>m.name===u)},c=u=>t.console.error(u),l=new Map,d=(u,p={})=>{const m=l.get(u);if(m)return console.warn(`Capacitor plugin "${u}" already registered. Cannot register plugins twice.`),m.proxy;const f=n(),v=o(u);let _;const w=async()=>(!_&&f in p?_=typeof p[f]=="function"?_=await p[f]():_=p[f]:e!==null&&!_&&"web"in p&&(_=typeof p.web=="function"?_=await p.web():_=p.web),_),k=(E,L)=>{var q,$;if(v){const b=v==null?void 0:v.methods.find(g=>L===g.name);if(b)return b.rtype==="promise"?g=>a.nativePromise(u,L.toString(),g):(g,R)=>a.nativeCallback(u,L.toString(),g,R);if(E)return(q=E[L])===null||q===void 0?void 0:q.bind(E)}else{if(E)return($=E[L])===null||$===void 0?void 0:$.bind(E);throw new Xe(`"${u}" plugin is not implemented on ${f}`,Gt.Unimplemented)}},S=E=>{let L;const q=(...$)=>{const b=w().then(g=>{const R=k(g,E);if(R){const x=R(...$);return L=x==null?void 0:x.remove,x}else throw new Xe(`"${u}.${E}()" is not implemented on ${f}`,Gt.Unimplemented)});return E==="addListener"&&(b.remove=async()=>L()),b};return q.toString=()=>`${E.toString()}() { [capacitor code] }`,Object.defineProperty(q,"name",{value:E,writable:!1,configurable:!1}),q},T=S("addListener"),A=S("removeListener"),C=(E,L)=>{const q=T({eventName:E},L),$=async()=>{const g=await q;A({eventName:E,callbackId:g},L)},b=new Promise(g=>q.then(()=>g({remove:$})));return b.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await $()},b},I=new Proxy({},{get(E,L){switch(L){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return v?C:T;case"removeListener":return A;default:return S(L)}}});return r[u]=I,l.set(u,{name:u,proxy:I,platforms:new Set([...Object.keys(p),...v?[f]:[]])}),I};return a.convertFileSrc||(a.convertFileSrc=u=>u),a.getPlatform=n,a.handleError=c,a.isNativePlatform=s,a.isPluginAvailable=i,a.registerPlugin=d,a.Exception=Xe,a.DEBUG=!!a.DEBUG,a.isLoggingEnabled=!!a.isLoggingEnabled,a},Op=t=>t.Capacitor=Ip(t),Ee=Op(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),wt=Ee.registerPlugin;class Ir{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,a){let r=!1;this.listeners[e]||(this.listeners[e]=[],r=!0),this.listeners[e].push(a);const s=this.windowListeners[e];s&&!s.registered&&this.addWindowListener(s),r&&this.sendRetainedArgumentsForEvent(e);const i=async()=>this.removeListener(e,a);return Promise.resolve({remove:i})}async removeAllListeners(){this.listeners={};for(const e in this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,a,r){const n=this.listeners[e];if(!n){if(r){let s=this.retainedEventArguments[e];s||(s=[]),s.push(a),this.retainedEventArguments[e]=s}return}n.forEach(s=>s(a))}hasListeners(e){var a;return!!(!((a=this.listeners[e])===null||a===void 0)&&a.length)}registerWindowListener(e,a){this.windowListeners[a]={registered:!1,windowEventName:e,pluginEventName:a,handler:r=>{this.notifyListeners(a,r)}}}unimplemented(e="not implemented"){return new Ee.Exception(e,Gt.Unimplemented)}unavailable(e="not available"){return new Ee.Exception(e,Gt.Unavailable)}async removeListener(e,a){const r=this.listeners[e];if(!r)return;const n=r.indexOf(a);n!==-1&&this.listeners[e].splice(n,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){const a=this.retainedEventArguments[e];a&&(delete this.retainedEventArguments[e],a.forEach(r=>{this.notifyListeners(e,r)}))}}const ti=t=>encodeURIComponent(t).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),ai=t=>t.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class jp extends Ir{async getCookies(){const e=document.cookie,a={};return e.split(";").forEach(r=>{if(r.length<=0)return;let[n,s]=r.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");n=ai(n).trim(),s=ai(s).trim(),a[n]=s}),a}async setCookie(e){try{const a=ti(e.key),r=ti(e.value),n=e.expires?`; expires=${e.expires.replace("expires=","")}`:"",s=(e.path||"/").replace("path=",""),i=e.url!=null&&e.url.length>0?`domain=${e.url}`:"";document.cookie=`${a}=${r||""}${n}; path=${s}; ${i};`}catch(a){return Promise.reject(a)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(a){return Promise.reject(a)}}async clearCookies(){try{const e=document.cookie.split(";")||[];for(const a of e)document.cookie=a.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}}wt("CapacitorCookies",{web:()=>new jp});const Dp=async t=>new Promise((e,a)=>{const r=new FileReader;r.onload=()=>{const n=r.result;e(n.indexOf(",")>=0?n.split(",")[1]:n)},r.onerror=n=>a(n),r.readAsDataURL(t)}),Mp=(t={})=>{const e=Object.keys(t);return Object.keys(t).map(n=>n.toLocaleLowerCase()).reduce((n,s,i)=>(n[s]=t[e[i]],n),{})},Up=(t,e=!0)=>t?Object.entries(t).reduce((r,n)=>{const[s,i]=n;let o,c;return Array.isArray(i)?(c="",i.forEach(l=>{o=e?encodeURIComponent(l):l,c+=`${s}=${o}&`}),c.slice(0,-1)):(o=e?encodeURIComponent(i):i,c=`${s}=${o}`),`${r}&${c}`},"").substr(1):null,Hp=(t,e={})=>{const a=Object.assign({method:t.method||"GET",headers:t.headers},e),n=Mp(t.headers)["content-type"]||"";if(typeof t.data=="string")a.body=t.data;else if(n.includes("application/x-www-form-urlencoded")){const s=new URLSearchParams;for(const[i,o]of Object.entries(t.data||{}))s.set(i,o);a.body=s.toString()}else if(n.includes("multipart/form-data")||t.data instanceof FormData){const s=new FormData;if(t.data instanceof FormData)t.data.forEach((o,c)=>{s.append(c,o)});else for(const o of Object.keys(t.data))s.append(o,t.data[o]);a.body=s;const i=new Headers(a.headers);i.delete("content-type"),a.headers=i}else(n.includes("application/json")||typeof t.data=="object")&&(a.body=JSON.stringify(t.data));return a};class Fp extends Ir{async request(e){const a=Hp(e,e.webFetchExtra),r=Up(e.params,e.shouldEncodeUrlParams),n=r?`${e.url}?${r}`:e.url,s=await fetch(n,a),i=s.headers.get("content-type")||"";let{responseType:o="text"}=s.ok?e:{};i.includes("application/json")&&(o="json");let c,l;switch(o){case"arraybuffer":case"blob":l=await s.blob(),c=await Dp(l);break;case"json":c=await s.json();break;case"document":case"text":default:c=await s.text()}const d={};return s.headers.forEach((u,p)=>{d[p]=u}),{data:c,headers:d,status:s.status,url:s.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:"GET"}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:"POST"}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:"PUT"}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:"PATCH"}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:"DELETE"}))}}wt("CapacitorHttp",{web:()=>new Fp});var ri;(function(t){t.Dark="DARK",t.Light="LIGHT",t.Default="DEFAULT"})(ri||(ri={}));var ni;(function(t){t.StatusBar="StatusBar",t.NavigationBar="NavigationBar"})(ni||(ni={}));class Bp extends Ir{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}wt("SystemBars",{web:()=>new Bp});const zp="modulepreload",Vp=function(t,e){return new URL(t,e).href},si={},Or=function(e,a,r){let n=Promise.resolve();if(a&&a.length>0){let i=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};const o=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),l=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));n=i(a.map(d=>{if(d=Vp(d,r),d in si)return;si[d]=!0;const u=d.endsWith(".css"),p=u?'[rel="stylesheet"]':"";if(!!r)for(let v=o.length-1;v>=0;v--){const _=o[v];if(_.href===d&&(!u||_.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${p}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":zp,u||(f.as="script"),f.crossOrigin="",f.href=d,l&&f.setAttribute("nonce",l),document.head.appendChild(f),u)return new Promise((v,_)=>{f.addEventListener("load",v),f.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return n.then(i=>{for(const o of i||[])o.status==="rejected"&&s(o.reason);return e().catch(s)})},Ne=wt("PushNotifications",{});let ga=null,yt=0,nn=null,sr=!1,vr=!1,xe={items:[],unread_count:0},gr="";const Ya=()=>xe.unread_count,ii=()=>({...xe,error:gr,loaded:vr});function Ln(){var t;for(const e of document.querySelectorAll("[data-trade-unread]"))e.textContent=xe.unread_count>99?"99+":xe.unread_count?String(xe.unread_count):"",(t=e.closest(".trade-bell"))==null||t.setAttribute("aria-label","Avisos de compras"+(xe.unread_count?", "+xe.unread_count+" não lidos":""));document.dispatchEvent(new CustomEvent("trade-notifications-updated"))}function Wp(t){var s;(s=document.querySelector("#trade-toast"))==null||s.remove();const e=document.createElement("aside");e.id="trade-toast",e.className="trade-toast",e.setAttribute("role","status");const a=document.createElement("button");a.type="button",a.textContent="×",a.setAttribute("aria-label","Fechar aviso"),a.onclick=()=>e.remove();const r=document.createElement("p");r.textContent=t;const n=document.createElement("a");n.href="/notificacoes/compras",n.dataset.link="",n.className="button button--secondary",n.textContent="Ver avisos",n.onclick=()=>e.remove(),e.append(a,r,n),document.body.append(e),window.setTimeout(()=>e.remove(),12e3)}async function lt(){if(!V||!ga||sr)return;const t=yt;sr=!0;try{const{data:e,error:a}=await V.rpc("trade_notification_inbox");if(t!==yt)return;if(a)throw a;const r=new Set(xe.items.map(o=>o.id)),n={items:Array.isArray(e==null?void 0:e.items)?e.items:[],unread_count:Number(e==null?void 0:e.unread_count)||0},s=Math.max(0,...xe.items.map(o=>new Date(o.created_at).getTime())),i=vr?n.items.filter(o=>!o.read_at&&!r.has(o.id)&&new Date(o.created_at).getTime()>=s):[];xe=n,gr="",vr=!0,Ln(),i.length&&Wp(i.length>1?`${i.length} novas atualizações de compras`:i[0].title)}catch(e){t===yt&&(gr=["42P01","PGRST202","PGRST205"].includes(e==null?void 0:e.code)?"Instale a atualização de entregas e avisos para ativar esta central.":"Não foi possível atualizar os avisos. Verifique sua conexão.",Ln())}finally{t===yt&&(sr=!1)}}function Gp(t){var a,r;const e=((a=t==null?void 0:t.user)==null?void 0:a.id)||null;e!==ga&&(ga=e,yt++,sr=!1,vr=!1,gr="",xe={items:[],unread_count:0},clearInterval(nn),nn=null,(r=document.querySelector("#trade-toast"))==null||r.remove(),Ln(),ga&&(lt(),nn=setInterval(()=>{document.hidden||lt()},15e3)))}async function Kp(t){if(!V||!ga)return;const e=yt,{error:a}=await V.rpc("trade_mark_notification_read",{p_id:t});if(a)throw a;e===yt&&await lt()}window.addEventListener("focus",()=>void lt());document.addEventListener("visibilitychange",()=>{document.hidden||lt()});const Ta=()=>Ee.getPlatform()==="android",Jp=()=>!0;let we=null,_t=null,oa=[],ir=0,ca=null,tt="";const xa=t=>"meuagro.push."+t,Kt=()=>document.dispatchEvent(new CustomEvent("trade-push-updated"));function So(){return{available:Ta()&&Jp(),enabled:!!we&&localStorage.getItem(xa(we))==="true",message:tt||(Ta()?"Ative os alertas para acompanhar mensagens, propostas e entregas com o aplicativo fechado.":"Os avisos permanecem disponíveis nesta central. Ative os alertas do celular no aplicativo Android.")}}async function Qp(){if(!oa.length)return ca||(ca=(async()=>{oa.push(await Ne.addListener("registration",async t=>{const e=we,a=ir;if(!(!e||localStorage.getItem(xa(e))!=="true")){_t=t.value;try{const r=await V.rpc("trade_register_push",{p_token:_t});if(r.error)throw r.error;if(e!==we||a!==ir)return;tt="Alertas do celular ativados."}catch{e===we&&a===ir&&(tt="Não foi possível registrar os alertas. Confira a conexão e tente ativar novamente.")}Kt()}})),oa.push(await Ne.addListener("registrationError",()=>{tt="Não foi possível ativar os alertas. Confira a configuração e tente novamente.",Kt()})),oa.push(await Ne.addListener("pushNotificationReceived",()=>void lt())),oa.push(await Ne.addListener("pushNotificationActionPerformed",async t=>{var o;const e=t.notification.data,a=(await V.auth.getSession()).data.session;if(!a||a.user.id!==(e==null?void 0:e.recipient_id))return;const{data:r,error:n}=await V.rpc("trade_notification_inbox"),s=(o=r==null?void 0:r.items)==null?void 0:o.find(c=>c.id===e.notification_id),{navigate:i}=await Or(async()=>{const{navigate:c}=await Promise.resolve().then(()=>iy);return{navigate:c}},void 0,import.meta.url);!n&&s&&/^\/(compras|consultor\/negociacoes)\?request=[0-9a-f-]+$/.test(s.route)?i(s.route):i("/notificacoes/compras")}))})().finally(()=>{ca=null}),ca)}async function Hn(){if(!we||!Ta())return;await Qp();const t=we;let e=await Ne.checkPermissions();if((e.receive==="prompt"||e.receive==="prompt-with-rationale")&&(e=await Ne.requestPermissions()),we===t){if(e.receive!=="granted"){tt="Permita notificações nas configurações do Android para receber alertas.",Kt();return}localStorage.setItem(xa(we),"true"),await Ne.createChannel({id:"trade_updates",name:"Compras e conversas",description:"Mensagens, propostas e entregas",importance:4,visibility:0}),tt="Ativando alertas…",Kt(),await Ne.register()}}async function Eo({forget:t=!0}={}){if(!Ta())return;const e=we,a=await Promise.allSettled([_t?V.rpc("trade_unregister_push",{p_token:_t}).then(r=>{if(r.error)throw r.error}):Promise.resolve(),Ne.unregister()]);if(!_t&&a[1].status==="rejected"||a.every(r=>r.status==="rejected"))throw new Error("Não foi possível desativar os alertas. Confira a conexão e tente novamente.");t&&e&&localStorage.removeItem(xa(e)),_t=null,tt="Alertas do celular desativados.",Kt()}function ko(t){var a;const e=((a=t==null?void 0:t.user)==null?void 0:a.id)||null;if(e!==we&&(we=e,ir++,_t=null,tt="",!!Ta())){if(!we){Ne.unregister().catch(()=>{});return}localStorage.getItem(xa(we))==="true"?Hn().catch(()=>{tt="Não foi possível retomar os alertas. Tente ativá-los novamente.",Kt()}):Ne.unregister().catch(()=>{})}}const Yp=Object.freeze(Object.defineProperty({__proto__:null,disableTradePush:Eo,enableTradePush:Hn,pushStatus:So,setPushSession:ko},Symbol.toStringTag,{value:"Module"})),oi={home:`
    <path d="M3 10.8 12 3l9 7.8" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9 21v-7h6v7" />
  `,map:`
    <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" />
    <path d="M8 3v15" />
    <path d="M16 6v15" />
  `,sprout:`
    <path d="M12 22V12" />
    <path d="M7 12c-3.5 0-5-2-5-6 4 0 7 1.5 7 5" />
    <path d="M17 12c3.5 0 5-2 5-6-4 0-7 1.5-7 5" />
  `,box:`
    <path d="m21 8-9 5-9-5" />
    <path d="M3 8 12 3l9 5v10l-9 5-9-5Z" />
    <path d="M12 13v10" />
  `,more:`
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  `,plus:`
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  `,calendar:`
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 10h18" />
  `,leaf:`
    <path d="M20 4c-8 0-14 4-14 10 0 3 2 5 5 5 6 0 9-7 9-15Z" />
    <path d="M5 21c2-5 6-8 11-11" />
  `,users:`
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  `,harvest:`
    <path d="M8 22V8" />
    <path d="M16 22V8" />
    <path d="M8 10C5 10 3 8 3 5c3 0 5 1 5 3" />
    <path d="M16 10c3 0 5-2 5-5-3 0-5 1-5 3" />
    <path d="M8 16c-3 0-5-2-5-5 3 0 5 1 5 3" />
    <path d="M16 16c3 0 5-2 5-5-3 0-5 1-5 3" />
  `,cart:`
    <circle cx="9" cy="20" r="1" />
    <circle cx="19" cy="20" r="1" />
    <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 7H6" />
  `,chart:`
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  `,settings:`
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6V21H10v-.1A1.8 1.8 0 0 0 8.9 19a1.8 1.8 0 0 0-2 .4l-.1.1L4 16.7l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.5H3V10h.1A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1L7 4.1l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10.2 3V3h3.6v.1A1.8 1.8 0 0 0 15 4.7a1.8 1.8 0 0 0 2-.4l.1-.1L20 7l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 10.2h.1v3.6H21A1.8 1.8 0 0 0 19.4 15Z" />
  `,user:`
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  `,chevronRight:`
    <path d="m9 18 6-6-6-6" />
  `,logout:`
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  `,arrowLeft:`
    <path d="m15 18-6-6 6-6" />
    <path d="M9 12h11" />
  `,edit:`
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  `,archive:`
    <path d="M4 7h16" />
    <path d="M5 7v13h14V7" />
    <path d="M3 3h18v4H3Z" />
    <path d="M9 11h6" />
  `,sun:`
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  `,moon:`
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  `,bell:`
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  `,clock:`
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  `,refresh:`
    <path d="M20 6v5h-5" />
    <path d="M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 11" />
    <path d="M17.9 15a7 7 0 0 1-11.6 2.6L4 13" />
  `,location:`
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  `,ruler:`
    <path d="M4 18 18 4l2 2L6 20H4Z" />
    <path d="m11 11 2 2" />
    <path d="m14 8 2 2" />
    <path d="m8 14 2 2" />
  `,layers:`
    <path d="m12 2 9 5-9 5-9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  `,search:`
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  `,lock:`
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  `,camera:`
    <path d="M14.5 5 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2Z" />
    <circle cx="12" cy="13" r="3.5" />
  `,image:`
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m21 15-5-5L5 20" />
    <path d="m14 13 2 2" />
  `,droplets:`
    <path d="M12 3s-5 5.3-5 9a5 5 0 0 0 10 0c0-3.7-5-9-5-9Z" />
    <path d="M5 16c-1.7 1.7-2 3-2 4a3 3 0 0 0 6 0c0-1-2-4-2-4" />
  `,flask:`
    <path d="M9 3h6" />
    <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
    <path d="M7 15h10" />
  `,spray:`
    <path d="M8 7h8" />
    <path d="M10 7V4h4v3" />
    <path d="M9 10h6l2 11H7Z" />
    <path d="M16 5h4" />
    <path d="M20 5h2" />
  `,shield:`
    <path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z" />
    <path d="m9 12 2 2 4-4" />
  `,scissors:`
    <circle cx="6" cy="7" r="3" />
    <circle cx="6" cy="17" r="3" />
    <path d="m8.5 8.5 12 8.5" />
    <path d="m8.5 15.5 12-8.5" />
  `,bug:`
    <path d="M8 8h8" />
    <path d="M9 4l1.5 3" />
    <path d="M15 4l-1.5 3" />
    <rect x="7" y="7" width="10" height="12" rx="5" />
    <path d="M4 10h3" />
    <path d="M17 10h3" />
    <path d="M4 15h3" />
    <path d="M17 15h3" />
    <path d="M12 7v12" />
  `,alertTriangle:`
    <path d="M12 3 2.5 20h19Z" />
    <path d="M12 9v5" />
    <path d="M12 18h.01" />
  `,trash:`
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M7 7l1 14h8l1-14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  `,info:`
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <path d="M12 7h.01" />
  `,history:`
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  `,arrowUp:`
    <path d="M12 20V5" />
    <path d="m6 11 6-6 6 6" />
  `,arrowDown:`
    <path d="M12 4v15" />
    <path d="m18 13-6 6-6-6" />
  `,receipt:`
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  `,phone:`
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  `,mail:`
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  `,messageCircle:`
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.9L3 21l1.7-4.8A8.5 8.5 0 1 1 21 11.5Z" />
  `,briefcase:`
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V4h8v3" />
    <path d="M3 12h18" />
  `,clipboard:`
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
  `};function y(t,e=""){const a=oi[t]||oi.more;return`
    <svg
      class="icon ${e}"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      ${a}
    </svg>
  `}const Zp=[{key:"home",label:"Início",path:"/dashboard",icon:"home"},{key:"properties",label:"Propriedades",path:"/properties",icon:"map"},{key:"plantings",label:"Plantios",path:"/plantings",icon:"sprout"},{key:"inventory",label:"Barracão",path:"/inventory",icon:"box"},{key:"more",label:"Mais",path:"/more",icon:"more"}];function Xp(t){return`
    <div class="bottom-nav-wrap">
      <nav
        class="bottom-nav"
        aria-label="Navegação principal"
      >
        ${Zp.map(e=>{const a=e.key===t;return`
              <a
                href="${e.path}"
                class="
                  bottom-nav__item
                  ${a?"bottom-nav__item--active":""}
                "
                ${a?'aria-current="page"':""}
                data-link
              >
                ${y(e.icon)}
                <span class="bottom-nav__label">
                  ${e.label}
                </span>
              </a>
            `}).join("")}
      </nav>
    </div>
  `}function eh(t){var r,n,s,i;const e=(s=(n=(r=t==null?void 0:t.user)==null?void 0:r.user_metadata)==null?void 0:n.full_name)==null?void 0:s.trim();if(e){const o=e.split(/\s+/).filter(Boolean);return(o.length>1?`${o[0][0]}${o[o.length-1][0]}`:o[0].slice(0,2)).toUpperCase()}return(((i=t==null?void 0:t.user)==null?void 0:i.email)||"MA").slice(0,2).toUpperCase()}function O({session:t,title:e,eyebrow:a="Meu Agro",activeNav:r,content:n}){const s=eh(t);return`
    <div class="mobile-app ${r==="commerce"?"commercial-app":""}">
      <div class="app-topbar-wrap">
        <header class="app-topbar">
          <div class="app-topbar__identity">
            <p class="app-topbar__eyebrow">
              ${a}
            </p>

            <h1 class="app-topbar__title">
              ${e}
            </h1>
            <button type="button" class="button commerce-mode-button" data-app-route="${r==="commerce"?"/dashboard":"/consultor"}">${y(r==="commerce"?"sprout":"briefcase")}<span>${r==="commerce"?"Ir para produtor":"Ir para consultor"}</span></button>
          </div>

          <div class="app-topbar__actions"><a href="/notificacoes/compras" class="trade-bell" aria-label="Avisos de compras${Ya()?", "+Ya()+" não lidos":""}" title="Avisos de compras" data-link>${y("bell")}<span data-trade-unread aria-hidden="true">${Ya()>99?"99+":Ya()||""}</span></a>
          <a
            href="/more/profile"
            class="button button--secondary user-avatar"
            aria-label="Abrir meu perfil"
            data-link
          >
            ${s}
          </a>
          </div>
        </header>
      </div>

      <main class="app-content">
        ${n}
      </main>

      ${r==="commerce"?`<div class="bottom-nav-wrap"><nav class="commerce-nav" aria-label="Navegação comercial">${[["/consultor","briefcase","Meu espaço"],["/consultor/negociacoes","clipboard","Negociações"],["/consultor/resultados","chart","Resultados"]].map(([i,o,c])=>`<a href="${i}" data-link ${location.pathname===i||i==="/consultor"&&location.pathname==="/consultor/empresa"?'aria-current="page"':""}>${y(o)}<span>${c}</span></a>`).join("")}</nav></div>`:Xp(r)}
    </div>
  `}function h(t){return t==null?"":String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Ao(t){if(!t)return null;if(typeof t=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(t)){const[e,a,r]=t.split("-").map(Number);return new Date(e,a-1,r,12,0,0,0)}return new Date(t)}function ne(t){if(!t)return"-";const e=Ao(t);return!e||Number.isNaN(e.getTime())?"-":new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(e)}function Yt(t){if(!t)return"-";const e=Ao(t);return!e||Number.isNaN(e.getTime())?"-":new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(e)}function ae(t,{maximumFractionDigits:e=4}={}){if(t==null||t==="")return"-";const a=Number(t);return Number.isFinite(a)?new Intl.NumberFormat("pt-BR",{maximumFractionDigits:e}).format(a):"-"}function ya(t=new Date){const e=t instanceof Date?t:new Date(t);if(Number.isNaN(e.getTime()))return"";const a=r=>String(r).padStart(2,"0");return[e.getFullYear(),"-",a(e.getMonth()+1),"-",a(e.getDate()),"T",a(e.getHours()),":",a(e.getMinutes())].join("")}function Fn(t){if(!t)return null;const e=new Date(t);return Number.isNaN(e.getTime())?null:e.toISOString()}function X(t){if(t==null||t==="")return"-";const e=Number(t);return Number.isFinite(e)?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e):"-"}const ci={ordered:"Pedido confirmado",awaiting:"Aguardando orçamento",awaiting_buyer:"Aguardando esclarecimento",quoted:"Proposta recebida",revision_requested:"Revisão solicitada",declined:"Proposta recusada",cancelled:"Cancelada pelo produtor",rejected:"Recusada pelo vendedor"},th={mark_delivery:"Entrega informada",report_delivery_issue:"Problema na entrega",confirm_receipt:"Recebimento confirmado",accept_quote:"Pedido confirmado",create_request:"Solicitação enviada",send_quote:"Orçamento enviado",request_revision:"Revisão solicitada",decline_quote:"Proposta recusada",ask_clarification:"Esclarecimento solicitado",answer_clarification:"Esclarecimento respondido",cancel_request:"Solicitação cancelada",reject_request:"Atendimento recusado"};function sn(t){return["42P01","PGRST202","PGRST205"].includes(t==null?void 0:t.code)?"A atualização de entregas e avisos ainda não foi instalada pelo responsável pelo sistema.":["22P02","22007","22003"].includes(t==null?void 0:t.code)?"Confira o código, as datas e os valores informados.":(t==null?void 0:t.message)||"Falha de conexão. Tente novamente; o mesmo envio não será duplicado."}async function on(){if(!V)throw new Error("Autenticação indisponível.");const t=["commerce_accounts","commerce_sellers","commerce_memberships","trade_products","trade_connections","trade_invitations","trade_requests","trade_quotes","trade_events","trade_orders","trade_messages","trade_inventory_links","trade_receipt_items","agricultural_inputs"],e=async s=>{const i=[],o=s==="commerce_accounts"?"user_id":s==="trade_inventory_links"?"product_id":"id";for(let c=0;;c+=500){const l=await V.from(s).select("*").order(o).range(c,c+499);if(l.error)throw l.error;if(i.push(...l.data),l.data.length<500)return{data:i}}},a=await Promise.all(t.map(e)),r={};a.forEach((s,i)=>{if(s.error)throw s.error;r[t[i]]=s.data||[]});const n=await V.from("properties").select("id,name").is("deleted_at",null).order("name");if(n.error)throw n.error;return r.properties=n.data||[],r}async function ah(t,e,a){const{data:r,error:n}=await V.rpc(["mark_delivery","report_delivery_issue","confirm_receipt"].includes(t)?"fulfillment_command":"trade_command",{p_action:t,p_data:e,p_operation_id:a});if(n)throw n;return r}const ee=t=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(t)),Na=async(t,e={})=>{const{data:a,error:r}=await V.rpc(t,e);if(r)throw r;return a},rh=()=>Na("management_companies"),nh=(t,e,a,r={},n=0)=>Na("management_report",{p_seller:t,p_from:e,p_to:a,p_filter:r,p_offset:n}),sh=(t,e="",a=0)=>Na("management_wallet",{p_seller:t,p_search:e,p_offset:a}),li=t=>Na("management_workspace",{p_request:t}),Co=(t,e,a)=>Na("management_command",{p_action:t,p_data:e,p_operation_id:a}),yr=t=>["42P01","PGRST202","PGRST205","42703"].includes(t==null?void 0:t.code)?"A gestão da empresa precisa ser atualizada pelo responsável pelo sistema.":(t==null?void 0:t.message)||"Não foi possível concluir. Verifique a conexão.",Ce=t=>Number(t).toLocaleString("pt-BR"),di=(t,e)=>{const a=Math.max(1,...t.map(r=>Number(r.value)));return`<ol class="sales-chart" aria-label="${h(e)}">${t.map(r=>`<li><div class="sales-chart-label"><span>${h(r.name)}</span><strong>${ee(r.value)}</strong></div><div class="sales-chart-track" aria-hidden="true"><span class="sales-chart-bar" style="width:${Math.max(0,Math.min(100,Number(r.value)/a*100))}%"></span></div></li>`).join("")}</ol>`},la=t=>t==null?"Pendente":ee(t),Dt=t=>t?new Date(t).toLocaleString("pt-BR"):"Não informado",Re=(t,e,a,r="",n="text",s="")=>`<div class="field"><label for="${t}">${a}</label><input id="${t}" name="${e}" type="${n}" value="${h(r)}" ${s}></div>`,ze=(t,e,a,r,n="")=>`<div class="field"><label for="${t}">${a}</label><select id="${t}" name="${e}">${r.map(([s,i])=>`<option value="${h(s)}" ${String(s)===String(n)?"selected":""}>${h(i)}</option>`).join("")}</select></div>`,cn=(t,e)=>`<input type="hidden" name="${t}" value="${h(e)}">`,De=t=>`<button type="submit" class="button button--primary">${t}</button>`,ui={open:"Em andamento",all:"Criadas no período",awaiting:"Nova solicitação",awaiting_buyer:"Aguardando produtor",quoted:"Proposta enviada",revision_requested:"Revisão solicitada",confirmed:"Aguardando entrega",awaiting_receipt:"Aguardando recebimento",delivery_issue:"Divergência na entrega",received:"Recebidas no período",declined:"Recusadas pelo produtor",cancelled:"Canceladas",rejected:"Recusadas pelo vendedor",stale:"Sem movimentação",followup_due:"Retorno vencido",quote_expiring:"Proposta vence em 48h",quoted_valid:"Propostas abertas válidas",to_deliver:"Pedidos a entregar"},ih={pending:"Aguardando aprovação",approved:"Aprovada e enviada",rejected:"Recusada",superseded:"Substituída ou invalidada"};async function oh({session:t}){const e=document.querySelector("#app"),a=new URLSearchParams(location.search),r=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date);let n=[],s,i,o,c=!1,l=!1;const d=new Map,u=a.get("from")||r.slice(0,7)+"-01",p=a.get("to")||r,m=Math.max(0,Number(a.get("offset"))||0),f=Math.max(0,Number(a.get("walletOffset"))||0),v=a.get("walletSearch")||"",_={agent:a.get("agent")||"",product:a.get("product")||"",buyer:a.get("buyer")||"",state:a.get("state")||"open"},w=E=>"/consultor/gestao?"+new URLSearchParams({seller:s.id,from:u,to:p,..._,...E}),k=E=>O({session:t,title:"Gestão da empresa",activeNav:"commerce",content:`<div class="commerce-page manager-page">${E}</div>`}),S=(E,L=!1)=>{const q=e.querySelector("#manager-feedback");q&&(q.hidden=!E,q.textContent=E,q.className=L?"form-message form-message--error":"form-message form-message--success")},T=()=>i.team.filter(E=>E.active).map(E=>[E.id,E.name]);function A(){if(l)return;if(!s){e.innerHTML=k('<section class="commerce-card"><h2>Gestão da empresa</h2><p>Esta área é exclusiva do dono e dos gestores autorizados de uma empresa. Seu acesso de consultor continua disponível.</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço</a></section>');return}const E=i.totals,L=i.goals.items.find(g=>!g.agent_id),q=E.quote_requests?Ce(E.converted_requests/E.quote_requests*100)+"%":"Sem propostas";let $=`<div id="manager-feedback" role="status" hidden></div><section class="commerce-hero"><p class="section-eyebrow">${i.owner?"Dono da empresa":"Gestor"} • ${h(s.name)}</p><h2>Uma visão da sua equipe</h2><p>Resultados, negociações e próximos passos em um só lugar.</p><form data-manager-filter class="manager-filters">${ze("mg-company","seller","Empresa",n.map(g=>[g.id,g.name]),s.id)}${Re("mg-from","from","Início",u,"date","required")}${Re("mg-to","to","Fim",p,"date","required")}${De("Atualizar painel")}</form></section>`;const b=(g,R,x)=>`<a class="commerce-card manager-metric" href="${w({state:x,offset:0})}#manager-queue" data-link><span>${g}</span><strong>${R}</strong><small>Ver negociações →</small></a>`;$+=`<div class="commerce-grid">${b("Vendas recebidas",ee(E.sales_total),"received")}${b("Propostas abertas válidas",ee(E.open_quotes),"quoted_valid")}${b("Pedidos a entregar",E.to_deliver,"to_deliver")}${b("Aguardando recebimento",E.to_receive,"awaiting_receipt")}</div><section class="commerce-card"><p>Vendas no intervalo anterior equivalente: <strong>${ee(E.previous_sales)}</strong>. ${E.previous_sales>0?"Variação: "+Ce((E.sales_total/E.previous_sales-1)*100)+"%.":"Sem base anterior para variação percentual."}</p><p>Conversão: <strong>${q}</strong> (${E.converted_requests} de ${E.quote_requests} solicitações criadas no período que tiveram proposta). Revisões não contam como novas oportunidades.</p><p>Vendas pela data de recebimento em Brasília. Carteira, propostas abertas e alertas representam a posição atual, inclusive negociações antigas.</p>${i.finance?`<p>Comissões: ${la(E.commission)} • Custos informados: ${la(E.cost)} • Resultado: ${la(E.result)}</p>${E.missing_financials?`<p>${E.missing_financials} venda(s) sem apuração completa.</p>`:""}`:"<p>Seu acesso é operacional. Custos, comissões e resultados financeiros privados não são exibidos.</p>"}</section>`,$+=`<div class="commerce-grid manager-alerts">${b("Sem movimentação",E.stale,"stale")}${b("Retorno vencido",E.followup_due,"followup_due")}${b("Propostas vencendo em 48h",E.quote_expiring,"quote_expiring")}${b("Problemas de entrega",E.delivery_issues,"delivery_issue")}</div>`,$+=`<section class="commerce-card"><h2>Vendas por consultor</h2><p>Até dez maiores valores recebidos no período. Consulte a equipe completa na tabela abaixo.</p>${di(i.team.filter(g=>g.revenue>0).slice(0,10).map(g=>({name:g.name,value:g.revenue})),"Vendas recebidas por consultor")}${i.totals.received_count?"":"<p>Ainda não há vendas recebidas neste período.</p>"}</section>`,$+=`<section class="commerce-card"><h2>Metas do mês ${i.goals.month.slice(0,7)}</h2><p>Recebido no mês completo: ${ee(i.goals.company_sales)}. Meta da empresa: ${L?ee(L.amount):"Não definida"}${(L==null?void 0:L.amount)>0?" • "+Ce(i.goals.company_sales/L.amount*100)+"% atingida":""}.</p><p>As metas usam o mês da data inicial do painel, independentemente do intervalo escolhido.</p><form data-manager-command="goal" class="manager-filters">${ze("mg-goal-agent","agent_id","Meta para",[["","Empresa"],...T()])}${Re("mg-goal-amount","amount","Valor da meta (R$)","","number",'required min="0" max="1000000000000" step="0.01"')}${De("Salvar meta")}</form></section>`,$+=`<section class="commerce-card"><h2>Desempenho da equipe</h2><p>Vendas e comissões ficam com o consultor no aceite. A conversão é atribuída a quem enviou a primeira proposta da solicitação criada no período. O tempo médio considera a primeira resposta efetiva, em horas corridas, atribuída a quem respondeu; solicitações sem resposta não entram na média.</p><div class="manager-table" role="region" aria-label="Comparação dos consultores" tabindex="0"><table><thead><tr><th>Consultor</th><th>Carteira</th><th>Abertas</th><th>Vendas recebidas</th><th>Conversão</th><th>Primeira resposta</th><th>Meta mensal</th>${i.finance?"<th>Comissão</th>":""}</tr></thead><tbody>${i.team.map(g=>`<tr><th scope="row">${h(g.name)}${g.active?"":" • Inativo"}</th><td>${g.customers}</td><td>${g.open_requests}</td><td>${ee(g.revenue)}</td><td>${g.quoted?Ce(g.converted/g.quoted*100)+"%":"—"} (${g.converted}/${g.quoted})</td><td>${g.response_hours===null?"—":Ce(g.response_hours)+" h"}</td><td>${g.goal===null?"Não definida":ee(g.goal)}<br>${ee(g.month_sales)} recebido</td>${i.finance?`<td>${la(g.commission)}</td>`:""}</tr>`).join("")}</tbody></table></div></section>`,$+=`<section class="commerce-card" id="manager-queue"><h2>Fila de negociações</h2><form data-manager-queue class="manager-filters">${ze("mg-agent","agent","Consultor",[["","Todos"],...i.team.map(g=>[g.id,g.name])],_.agent)}${ze("mg-product","product","Produto",[["","Todos"],...i.catalog.map(g=>[g.id,g.name])],_.product)}${Re("mg-buyer","buyer","Produtor",_.buyer)}${ze("mg-state","state","Situação",Object.entries(ui),_.state)}${De("Filtrar negociações")}</form><p>${i.queue.count} negociação(ões). Filtros desta lista não alteram os indicadores gerais. Recebidas usa o período de recebimento; Criadas no período usa a criação. As demais situações mostram a posição atual.</p>${i.queue.items.map(g=>`<article class="commerce-row"><div><strong>${h(g.buyer_name)}</strong><p>${h(g.agent_name)} • ${h(ui[g.stage]||g.stage)}${g.approval_pending?" • Desconto em aprovação":""}</p><p>${g.order_total!==null?ee(g.order_total):g.quote_total!==null?ee(g.quote_total):"Sem proposta"} • Última movimentação: ${Dt(g.last_activity)}</p>${g.attention?`<p class="manager-attention">${h(g.attention)}</p>`:""}<p>Próxima ação: ${h(g.next_action||"Não definida")}${g.due_at?" • "+Dt(g.due_at):""}</p></div><div class="commerce-actions"><a class="button button--secondary" href="/consultor/negociacoes?request=${g.id}" data-link>Abrir negociação</a><a class="button button--primary" href="/consultor/acompanhamento?request=${g.id}" data-link>Acompanhamento interno</a></div></article>`).join("")||"<p>Nenhuma negociação encontrada.</p>"}<nav class="commerce-actions" aria-label="Páginas das negociações">${m?`<a class="button button--secondary" href="${w({offset:Math.max(0,m-50)})}#manager-queue" data-link>Anterior</a>`:""}${m+50<i.queue.count?`<a class="button button--secondary" href="${w({offset:m+50})}#manager-queue" data-link>Próxima</a>`:""}</nav></section>`,$+=`<section class="commerce-card"><h2>Aprovações de desconto</h2><p>${i.approvals.length} pendente(s). Aprovar publica a proposta para o produtor com os termos exibidos. A justificativa fica no acompanhamento interno.</p>${i.approvals.map(g=>`<article class="commerce-card"><h3>Solicitação ${h(g.request_id)}</h3><p>Produtos: ${ee(g.summary.subtotal)} • Desconto: ${ee(g.summary.discount)} • Frete: ${ee(g.summary.freight)} • Total: ${ee(g.summary.total)}</p>${g.summary.items.map(R=>`<p>${h(R.name)} × ${Ce(R.quantity)}: ${ee(R.line_total)}</p>`).join("")}<p>Validade: ${Dt(g.summary.valid_until)} • Entrega: ${g.summary.delivery_days} dia(s) • Pagamento: ${h(g.summary.payment_terms)}</p>${g.summary.notes?`<p class="manager-note">Observações: ${h(g.summary.notes)}</p>`:""}<form data-manager-command="approve">${cn("approval_id",g.id)}${Re("mg-approval-"+g.id,"reason","Justificativa","","text",'required minlength="5" maxlength="500"')}<div class="commerce-actions">${De("Aprovar e enviar proposta")}<button class="button button--secondary" type="submit" data-command="reject">Recusar desconto</button></div></form></article>`).join("")||"<p>Nenhuma aprovação pendente.</p>"}</section>`,$+=`<section class="commerce-card" id="manager-wallet"><h2>Carteira de produtores</h2><form data-manager-wallet class="manager-filters">${Re("mg-wallet-search","walletSearch","Buscar produtor na carteira",v)}${De("Buscar na carteira")}</form><p>${o.count} produtor(es). Transferir muda o responsável pela carteira e pelos atendimentos em andamento, preservando a atribuição das vendas já aceitas.</p>${o.items.map(g=>`<details class="commerce-card"><summary>${h(g.buyer_name)} • ${h(g.agent_name)}</summary><form data-manager-command="transfer">${cn("connection_id",g.id)}${cn("expected_agent",g.agent_id)}${ze("mg-transfer-"+g.id,"agent_id","Novo responsável",T(),g.agent_id)}${Re("mg-transfer-reason-"+g.id,"reason","Motivo da transferência","","text",'required minlength="5" maxlength="500"')}${De("Transferir carteira")}</form></details>`).join("")}<nav class="commerce-actions" aria-label="Páginas da carteira">${f?`<a class="button button--secondary" href="${w({walletSearch:v,walletOffset:Math.max(0,f-50)})}#manager-wallet" data-link>Carteira anterior</a>`:""}${f+50<o.count?`<a class="button button--secondary" href="${w({walletSearch:v,walletOffset:f+50})}#manager-wallet" data-link>Próxima carteira</a>`:""}</nav></section>`,$+=`<section class="commerce-card"><h2>Análise de produtos</h2><p>Receita após desconto, sem frete. Volumes separados por embalagem e unidade.${i.finance?" Resultado do produto = receita do produto menos seu custo de aquisição; não deduz entrega, comissão ou outras despesas.":""}</p>${di(i.products.slice(0,5).map(g=>({name:g.name+" • "+g.package_name+" "+g.package_size+" "+g.base_unit,value:g.revenue})),"Cinco produtos com maior receita no período")}<p>Gráfico: até cinco produtos com maior receita. A lista abaixo apresenta todos os produtos vendidos.</p>${i.products.map(g=>`<article class="commerce-row"><div><strong>${h(g.name)}</strong><p>${h(g.package_name)} • ${Ce(g.package_size)} ${h(g.base_unit)} • ${Ce(g.packages)} embalagem(ns) • ${Ce(g.volume)} ${h(g.base_unit)}</p><p>Receita: ${ee(g.revenue)} • Desconto médio ponderado: ${Ce(g.discount_percent)}%</p>${i.finance?`<p>Resultado do produto: ${la(g.product_result)}${g.revenue>0&&g.product_result!==null?" • Margem: "+Ce(g.product_result/g.revenue*100)+"%":""}${g.missing?" • Custos incompletos":""}</p>`:""}</div></article>`).join("")||"<p>Nenhuma venda recebida no período.</p>"}</section><details class="commerce-card"><summary>Negociações encerradas e motivos registrados</summary><p>Até 100 solicitações mais recentes, criadas no período. Motivos são os textos registrados pelas partes, sem classificação automática.</p>${i.losses.map(g=>`<article class="commerce-row"><div><strong>${h(g.buyer_name)} • ${h(g.agent_name)}</strong><p>${g.items.map(R=>h(R.name)).join(", ")}</p><p>${h(g.reason||"Sem motivo informado")}</p></div></article>`).join("")||"<p>Nenhum encerramento encontrado.</p>"}</details>`,i.owner&&($+=`<section class="commerce-card"><h2>Permissões e limites</h2><form data-manager-command="settings" class="manager-filters">${Re("mg-limit","discount_limit","Desconto sem aprovação (%)",i.settings.discount_limit,"number",'required min="0" max="100" step="0.01"')}${Re("mg-stale","stale_hours","Atenção após quantas horas sem movimentação?",i.settings.stale_hours,"number",'required min="1" max="720" step="1"')}${De("Salvar limites")}</form><p>O limite considera o campo Desconto da proposta, não alterações do preço de referência do catálogo. Dono e gestores podem aprovar descontos. Por padrão, 100% preserva o fluxo anterior.</p>${i.team.some(g=>g.role!=="owner"&&g.active)?`<form data-manager-command="grant">${ze("mg-permission-agent","agent_id","Representante para alterar acesso",i.team.filter(g=>g.role!=="owner"&&g.active).map(g=>[g.id,g.name+" • "+(g.role==="manager"?"Gestor":"Consultor")]))}${ze("mg-role","role","Papel",[["representative","Consultor"],["manager","Gestor"]])}${ze("mg-finance","finance","Pode consultar custos e comissões?",[["false","Não"],["true","Sim"]])}${De("Salvar permissões")}</form>`:"<p>Convide representantes pelo cadastro da empresa para delegar acesso de gestor.</p>"}</section>`),$+=`<details class="commerce-card"><summary>Histórico gerencial recente</summary><p>Últimas 50 ações. As notas internas podem ser lidas no acompanhamento da negociação.</p>${i.audit.map(g=>`<p>${Dt(g.created_at)} • ${h(g.actor)} • ${h({grant:"Permissões alteradas",settings:"Limites alterados",goal:"Meta alterada",transfer:"Carteira transferida",note:"Nota interna",followup:"Próxima ação alterada",approve:"Proposta aprovada",reject:"Desconto recusado",request_approval:"Aprovação solicitada"}[g.action]||"Atualização")}${g.details.reason?" • "+h(g.details.reason):""}</p>`).join("")}</details>`,e.innerHTML=k($),["#manager-queue","#manager-wallet"].includes(location.hash)&&requestAnimationFrame(()=>{var g;return(g=document.getElementById(location.hash.slice(1)))==null?void 0:g.scrollIntoView({block:"start"})})}async function C(){[i,o]=await Promise.all([nh(s.id,u,p,_,m),sh(s.id,v,f)])}const I=async E=>{var x,H;const L=E.target.closest("form");if(!L||(E.preventDefault(),c||!L.reportValidity()))return;const q=Object.fromEntries(new FormData(L));if(L.hasAttribute("data-manager-filter")){Q("/consultor/gestao?"+new URLSearchParams(q));return}if(L.hasAttribute("data-manager-queue")){Q(w({...q,offset:0})+"#manager-queue");return}if(L.hasAttribute("data-manager-wallet")){Q(w({...q,walletOffset:0})+"#manager-wallet");return}const $=((x=E.submitter)==null?void 0:x.dataset.command)||L.dataset.managerCommand;if(!$)return;q.seller_id=s.id,$==="goal"&&(q.month=i.goals.month,q.expected_version=((H=i.goals.items.find(P=>(P.agent_id||"")===q.agent_id))==null?void 0:H.version)||0);const b=$+JSON.stringify(q);d.has(b)||d.set(b,crypto.randomUUID()),c=!0;const g=[...L.querySelectorAll("button")];g.forEach(P=>P.disabled=!0);let R=!1;S("Salvando…");try{await Co($,q,d.get(b)),R=!0,await C(),l||(d.clear(),A(),S($==="approve"?"Proposta aprovada e enviada ao produtor.":"Alteração salva."))}catch(P){l||S(R?"A alteração foi salva. Reabra a tela antes de repetir.":yr(P),!0)}finally{c=!1,g.forEach(P=>P.disabled=!1)}};e.innerHTML=k('<p role="status">Carregando gestão…</p>');try{n=await rh(),s=n.find(E=>E.id===a.get("seller"))||n[0],s&&await C(),A()}catch(E){l||(e.innerHTML=k(`<section class="commerce-card"><h2>Não foi possível abrir a gestão</h2><p role="alert">${h(yr(E))}</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço</a></section>`))}return e.addEventListener("submit",I),()=>{l=!0,e.removeEventListener("submit",I)}}async function ch({session:t}){const e=document.querySelector("#app"),a=new URLSearchParams(location.search).get("request");let r,n=!1,s=!1;const i=new Map,o=d=>O({session:t,title:"Acompanhamento interno",activeNav:"commerce",content:`<div class="commerce-page">${d}</div>`}),c=()=>{if(s)return;const d=r.followup,u=d!=null&&d.due_at?new Date(new Date(d.due_at).getTime()-new Date(d.due_at).getTimezoneOffset()*6e4).toISOString().slice(0,16):"";e.innerHTML=o(`<a class="button button--secondary" href="/consultor/negociacoes?request=${h(a)}" data-link>Voltar à negociação</a><section class="commerce-card"><h2>Somente para a equipe</h2><p>O produtor não recebe estas notas nem os lembretes internos. ${r.notes.length===100?"Exibindo as últimas 100 notas.":""}</p><div id="workspace-feedback" role="status"></div><form data-workspace="followup">${Re("ws-next","body","Próxima ação",(d==null?void 0:d.next_action)||"","text",'maxlength="500"')}${Re("ws-due","due_at","Data e hora do retorno",u,"datetime-local")}${De("Salvar próxima ação")}</form></section><section class="commerce-card"><h2>Notas internas</h2><form data-workspace="note"><div class="field"><label for="ws-body">Nova nota interna</label><textarea id="ws-body" name="body" required maxlength="2000" rows="3"></textarea></div>${De("Adicionar nota")}</form>${r.notes.map(p=>`<article class="commerce-row"><div><strong>${h(p.author)}</strong><p>${Dt(p.created_at)}</p><p class="manager-note">${h(p.body)}</p></div></article>`).join("")||"<p>Nenhuma nota interna.</p>"}</section><section class="commerce-card"><h2>Solicitações de desconto</h2>${r.approvals.map(p=>`<p>${Dt(p.created_at)} • ${ih[p.status]}${p.reason?" • "+h(p.reason):""}</p>`).join("")||"<p>Nenhuma solicitação.</p>"}</section>`)},l=async d=>{var _;const u=d.target.closest("[data-workspace]");if(!u||(d.preventDefault(),n||!u.reportValidity()))return;const p=u.dataset.workspace,m=Object.fromEntries(new FormData(u));m.request_id=a,p==="followup"&&(m.expected_version=((_=r.followup)==null?void 0:_.version)||0,m.due_at=m.due_at?new Date(m.due_at).toISOString():"");const f=p+JSON.stringify(m);i.has(f)||i.set(f,crypto.randomUUID()),n=!0;let v=!1;try{await Co(p,m,i.get(f)),v=!0,r=await li(a),s||(i.clear(),c(),e.querySelector("#workspace-feedback").textContent="Acompanhamento salvo.")}catch(w){s||(e.querySelector("#workspace-feedback").textContent=v?"Salvo. Reabra a tela antes de repetir.":yr(w))}finally{n=!1}};e.innerHTML=o("<p>Carregando acompanhamento…</p>");try{r=await li(a),c()}catch(d){s||(e.innerHTML=o(`<p role="alert">${h(yr(d))}</p>`))}return e.addEventListener("submit",l),()=>{s=!0,e.removeEventListener("submit",l)}}async function lh(t){var n;const[e,a,r]=await Promise.all([V.from("commerce_sellers").select("*"),V.from("commerce_memberships").select("*"),V.from("commerce_accounts").select("*").eq("user_id",t).maybeSingle()]);for(const s of[e,a,r])if(s.error)throw s.error;return(n=r.data)!=null&&n.enabled?e.data.filter(s=>s.owner_id===t||a.data.some(i=>i.seller_id===s.id&&i.user_id===t&&i.active)):[]}async function dh(t,e,a,r=0){const{data:n,error:s}=await V.rpc("trade_sales_report",{p_seller:t,p_from:e,p_to:a,p_offset:r});if(s)throw s;return n}async function pi(t){const e=await V.from("trade_orders").select("*").eq("id",t).single();if(e.error)throw e.error;const a=[];for(let r=0;;r+=500){const n=await V.from("trade_financial_versions").select("*").eq("order_id",t).order("version",{ascending:!1}).range(r,r+499);if(n.error)throw n.error;if(a.push(...n.data),n.data.length<500)break}return{order:e.data,versions:a}}async function uh(t,e){const a=await V.rpc("trade_save_financials",{p_data:t,p_operation_id:e});if(a.error)throw a.error;return a.data}const hi=t=>["42P01","PGRST202","PGRST205"].includes(t==null?void 0:t.code)?"Instale a atualização de vendas e resultados para usar este painel.":(t==null?void 0:t.message)||"Não foi possível carregar os resultados. Verifique a conexão.";async function ph(t,e,a){const{data:r,error:n}=await V.rpc("trade_product_ranking",{p_seller:t,p_year:e,p_month:a});if(n)throw n;return r}const mi={confirmed:"Aguardando entrega",awaiting_receipt:"Aguardando recebimento",delivery_issue:"Problema na entrega",received:"Recebido"},da=t=>t==null?"Pendente":ee(t),Ve=(t,e,a="",r="number",n="")=>`<div class="field"><label for="sales-${t}">${e}</label><input id="sales-${t}" name="${t}" value="${h(a)}" type="${r}" ${n}></div>`,ln='required min="0" max="1000000000" step="0.01"',fi=t=>new Date(t).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"});async function hh({session:t}){const e=document.querySelector("#app"),a=new URLSearchParams(location.search),r=a.get("order");let n=!1,s=!1,i=[],o,c,l,d;const u=new Map,p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date),m=Number(a.get("year"))||Number(p.slice(0,4)),f=Number(a.get("month"))||Number(p.slice(5,7));let v=a.get("from")||p.slice(0,7)+"-01",_=a.get("to")||p,w=Math.max(0,Number(a.get("offset"))||0);const k=(E={})=>"/consultor/resultados?"+new URLSearchParams({seller:o.id,from:v,to:_,year:m,month:f,...E}),S=E=>O({session:t,title:"Vendas e resultados",activeNav:"commerce",content:`<div class="commerce-page trade-page">${E}</div>`}),T=(E,L=!1)=>{const q=e.querySelector("#sales-feedback");q&&(q.textContent=E,q.hidden=!E,q.className=L?"form-message form-message--error":"form-message form-message--success")};function A(){const E=(L,q)=>`<section class="commerce-card sales-chart-card"><h3>${L}</h3>${q.length?`<p class="sales-champion"><span aria-hidden="true">★</span><strong>${q.filter($=>$.rank===1).length>1?"Líderes empatados":"Campeão de vendas"}: ${q.filter($=>$.rank===1).map($=>h($.name)).join(", ")}</strong></p><ol class="sales-chart" aria-label="${L}">${q.map($=>`<li><div class="sales-chart-label"><span>${h($.name)}</span><strong>${ee($.revenue)}</strong></div><small>${$.orders} pedido(s)</small><div class="sales-chart-track" aria-hidden="true"><span class="sales-chart-bar" style="width:${q[0].revenue>0?Math.max(0,Math.min(100,Number($.revenue)/Number(q[0].revenue)*100)):0}%"></span></div></li>`).join("")}</ol>`:"<p>Nenhuma venda recebida neste período.</p>"}</section>`;return`<section class="commerce-card sales-ranking"><h2>Produtos campeões de vendas</h2><p>Até 10 produtos por valor vendido após desconto, sem frete. Somente recebimentos confirmados, no horário de Brasília. ${d.owner?"Resultados desta atuação.":"Somente vendas atribuídas a você no aceite."}</p><form data-ranking-filter>${Ve("year","Ano",m,"number",'required min="2000" max="2200" step="1"')}${Ve("month","Mês (1 a 12)",f,"number",'required min="1" max="12" step="1"')}<button class="button button--secondary" type="submit">Atualizar gráfico</button></form><div class="commerce-grid">${E("No mês "+String(f).padStart(2,"0")+"/"+m,d.monthly)}${E("No ano "+m,d.annual)}</div></section>`}function C(){if(n)return;let E='<div id="sales-feedback" role="status" hidden></div>';if(!o){e.innerHTML=S('<section class="commerce-card"><h2>Ative sua atuação comercial</h2><p>Use seu espaço de consultor para cadastrar uma atuação própria ou aceitar o convite de uma empresa.</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço</a></section>');return}if(r){const{order:L,versions:q}=l,$=q[0];E+=`<a class="button button--secondary" href="${k()}" data-link>← Resultados</a><section class="commerce-card"><h2>Apuração do pedido</h2><p>${h(o.name)} • ${h(L.buyer_name)}</p><p>Pedido ${h(L.id)} • ${mi[L.state]}</p><p>Receita acordada: <strong>${ee(L.total)}</strong>. ${L.state==="received"?"Incluída nas vendas concluídas.":"Os valores permanecem previstos até o recebimento."}</p><p>Informe seus custos como vendedor. Estes dados não são mostrados ao produtor.</p><form data-sales-save>${L.quote_snapshot.items.map(b=>{var g;return Ve("cost_"+b.product_id,`Custo por ${h(b.package_name)} de ${h(b.name)} (${Number(b.quantity).toLocaleString("pt-BR")} embalagem/ns)`,((g=$==null?void 0:$.items.find(R=>R.product_id===b.product_id))==null?void 0:g.unit_cost)??"","number",ln)}).join("")}${Ve("delivery_cost","Custo da entrega para o vendedor (R$)",($==null?void 0:$.delivery_cost)??0,"number",ln)}${Ve("other_cost","Outros custos deste pedido (R$)",($==null?void 0:$.other_cost)??0,"number",ln)}${Ve("commission_percent","Comissão do consultor (%)",($==null?void 0:$.commission_percent)??0,"number",'required min="0" max="100" step="0.01"')}<p>A comissão incide sobre os produtos após desconto, sem o frete. Fica atribuída ao consultor responsável no momento do aceite, mesmo que o atendimento seja transferido depois. Na atuação própria, mantenha 0% se não houver comissão separada.</p>${Ve("reason",$?"Motivo da correção":"Descrição da apuração",$?"":"Apuração inicial","text",'required minlength="5" maxlength="500"')}<p>Cada gravação cria uma versão. Os preços aceitos e o estoque permanecem como foram registrados.</p><button class="button button--primary" type="submit">Salvar apuração</button></form></section>`,E+=`<section><h2>Histórico de apurações</h2>${q.map(b=>`<article class="commerce-card"><h3>Versão ${b.version}${b===$?" • Atual":""}</h3><p>${fi(b.created_at)} • ${h(b.reason)}</p>${b.items.map(g=>`<p>${h(g.name)}: ${ee(g.unit_cost)} por embalagem • ${ee(g.line_cost)} de custo</p>`).join("")}<p>Produtos: ${ee(b.product_cost)} • Entrega: ${ee(b.delivery_cost)} • Outros: ${ee(b.other_cost)}</p><p>Comissão: ${Number(b.commission_percent).toLocaleString("pt-BR")}% = ${ee(b.commission_amount)}</p><p><strong>Resultado sobre custos informados: ${ee(b.result_amount)}</strong></p></article>`).join("")||"<p>Nenhuma apuração registrada.</p>"}</section>`}else{const L=c.totals;E+=`<section class="commerce-card sales-filter"><h2>${c.owner?"Resultados do vendedor":"Minhas vendas e comissões"}</h2><form data-sales-filter><div class="field"><label for="sales-seller">Atuação</label><select id="sales-seller" name="seller">${i.map($=>`<option value="${$.id}" ${$.id===o.id?"selected":""}>${h($.name)}</option>`).join("")}</select></div>${Ve("from","Início",v,"date","required")}${Ve("to","Fim",_,"date","required")}<button type="submit" class="button button--secondary">Atualizar resultados</button></form><p>Vendas pelo dia do recebimento (horário de Brasília). Pedidos em andamento pelo dia de criação. Período de até 366 dias.</p>${c.owner?"":"<p>Você vê as vendas atribuídas a você no aceite, mesmo após transferência do atendimento. Custos e resultados da empresa são restritos ao responsável.</p>"}</section>`;const q=[["Vendas recebidas",ee(L.sales_total)],["Pedidos recebidos",L.received_count],["Em andamento",`${L.pending_count} • ${ee(L.pending_total)}`],["Comissões das vendas recebidas",da(L.commission_total)]];c.owner&&q.push(["Custos informados (sem comissão)",da(L.cost_total)],["Resultado sobre custos informados",da(L.result_total)],["Margem sobre a receita",L.margin_percent===null?"Pendente":Number(L.margin_percent).toLocaleString("pt-BR")+"%"]),E+=`<div class="commerce-grid sales-metrics">${q.map(([$,b],g)=>`<section class="commerce-card sales-metric ${g===0?"sales-metric--primary":""}"><span class="sales-metric-icon">${y(g===0?"chart":g===1?"box":g===2?"clock":"briefcase")}</span><h3>${$}</h3><strong>${b}</strong></section>`).join("")}</div>${L.missing_count?`<p role="status">${L.missing_count} venda(s) recebida(s) ainda sem apuração. ${c.owner?"Informe os custos e comissões para concluir os totais.":"Aguarde a apuração pelo responsável."}</p>`:""}<p>Este painel registra valores; não comprova pagamentos nem inclui despesas ou tributos que você não informou.</p>`,E+=A(),E+=`<section class="commerce-card"><h2>Produtos vendidos e recebidos</h2>${c.products.map($=>`<article class="commerce-row"><div><strong>${h($.name)}</strong><p>${h($.package_name)} • ${Number($.package_size).toLocaleString("pt-BR")} ${h($.base_unit)}</p><p>${Number($.packages).toLocaleString("pt-BR")} embalagem(ns) • ${Number($.base_quantity).toLocaleString("pt-BR")} ${h($.base_unit)}</p></div></article>`).join("")||"<p>Nenhum produto recebido neste período.</p>"}</section><section class="commerce-card"><h2>Pedidos do período</h2>${c.orders.map($=>`<article class="commerce-row"><div><strong>${h($.buyer_name)} • ${ee($.total)}</strong><p>${fi($.date)} • ${mi[$.state]}</p><p>Consultor no aceite: ${h($.agent_name)}</p><p>Comissão ${$.state==="received"?"apurada":"prevista"}: ${da($.commission_amount)}${$.commission_percent!==null?" ("+Number($.commission_percent).toLocaleString("pt-BR")+"%)":""}</p>${c.owner?`<p>Resultado ${$.state==="received"?"apurado":"previsto"}: ${da($.result_amount)}</p>`:""}<p>Pedido ${h($.id)}</p></div><div class="commerce-actions">${$.can_open?`<a class="button button--secondary" href="/consultor/negociacoes?request=${$.request_id}" data-link>Abrir pedido</a>`:""}${c.owner?`<a class="button button--primary" href="${k({order:$.id})}" data-link>${$.version?"Revisar apuração":"Informar custos"}</a>`:""}</div></article>`).join("")||"<p>Nenhum pedido neste período.</p>"}<nav class="commerce-actions" aria-label="Páginas de pedidos">${w?`<a class="button button--secondary" href="${k({offset:Math.max(0,w-50)})}" data-link>Anterior</a>`:""}${w+50<Number(L.order_count)?`<a class="button button--secondary" href="${k({offset:w+50})}" data-link>Próxima</a>`:""}</nav></section>`}e.innerHTML=S(E)}const I=async E=>{var g;const L=E.target.closest("form");if(!L||(E.preventDefault(),s||!L.reportValidity()))return;const q=Object.fromEntries(new FormData(L));if(L.matches("[data-ranking-filter]")){Q(k(q));return}if(L.matches("[data-sales-filter]")){Q("/consultor/resultados?"+new URLSearchParams(q));return}if(!L.matches("[data-sales-save]"))return;q.order_id=r,q.expected_version=((g=l.versions[0])==null?void 0:g.version)||0,q.items=Object.entries(q).filter(([R])=>R.startsWith("cost_")).map(([R,x])=>({product_id:R.slice(5),unit_cost:x}));for(const R of Object.keys(q))R.startsWith("cost_")&&delete q[R];const $=JSON.stringify(q);u.has($)||u.set($,crypto.randomUUID()),s=!0,L.querySelector("button").disabled=!0;let b=!1;T("Salvando…");try{await uh(q,u.get($)),b=!0,l=await pi(r),n||(u.clear(),C(),T("Apuração salva."))}catch(R){n||T(b?"A apuração foi salva. Reabra a página antes de repetir.":hi(R),!0)}finally{s=!1,!n&&L.isConnected&&(L.querySelector("button").disabled=!1)}};e.innerHTML=S('<p role="status">Carregando resultados…</p>');try{if(i=await lh(t.user.id),o=i.find(E=>E.id===a.get("seller"))||i[0],o)if(r){if(o.owner_id!==t.user.id)throw new Error("Somente o responsável pode acessar esta apuração.");if(l=await pi(r),l.order.seller_id!==o.id)throw new Error("O pedido não pertence à atuação selecionada.")}else[c,d]=await Promise.all([dh(o.id,v,_,w),ph(o.id,m,f)]);C()}catch(E){n||(e.innerHTML=S(`<section class="commerce-card"><h2>Não foi possível carregar resultados</h2><p role="alert">${h(hi(E))}</p><a class="button button--secondary" href="/consultor" data-link>Voltar ao meu espaço</a></section>`))}return e.addEventListener("submit",I),()=>{n=!0,e.removeEventListener("submit",I)}}async function mh({session:t}){const e=document.querySelector("#app");let a=!1;const r=()=>{if(a)return;const s=ii(),i=So();e.innerHTML=O({session:t,title:"Avisos de compras",activeNav:"more",content:`<div class="commerce-page trade-page"><section class="commerce-card"><h2>Compras e conversas</h2><p>${s.unread_count} aviso(s) não lido(s). Até 100 avisos por vez, priorizando os não lidos.</p><p>${h(i.message)}</p>${i.available?`<div class="commerce-actions"><button type="button" class="button button--primary" data-enable-push>${i.enabled?"Reativar alertas do celular":"Ativar alertas do celular"}</button>${i.enabled?'<button type="button" class="button button--secondary" data-disable-push>Desativar alertas do celular</button>':""}</div>`:""}<button type="button" class="button button--secondary" data-update-inbox>Atualizar avisos</button>${s.error?`<p role="alert">${h(s.error)}</p>`:""}</section>${s.items.map(o=>`<article class="commerce-card ${o.read_at?"":"trade-unread"}"><h3>${h(o.title)}</h3><p>${h(o.body)}</p><p>${new Date(o.created_at).toLocaleString("pt-BR")} • ${o.read_at?"Lido":"Não lido"}</p><a class="button button--secondary" href="${h(o.route)}" data-notification="${o.id}">Abrir negociação</a></article>`).join("")||"<p>Nenhum aviso de compra disponível.</p>"}</div>`})},n=async s=>{const i=s.target.closest("[data-enable-push],[data-disable-push]");if(i){i.disabled=!0;try{await(i.matches("[data-enable-push]")?Hn():Eo())}catch{i.textContent="Não foi possível concluir. Tentar novamente"}finally{i.disabled=!1}return}if(s.target.closest("[data-update-inbox]")){lt();return}const o=s.target.closest("[data-notification]");if(!o)return;s.preventDefault();const c=ii().items.find(l=>l.id===o.dataset.notification);if(c){try{await Kp(c.id)}catch{}!a&&/^\/(compras|consultor\/negociacoes)\?request=[0-9a-f-]+$/.test(c.route)&&Q(c.route)}};return document.addEventListener("trade-push-updated",r),document.addEventListener("trade-notifications-updated",r),e.addEventListener("click",n),r(),lt(),()=>{a=!0,document.removeEventListener("trade-push-updated",r),document.removeEventListener("trade-notifications-updated",r),e.removeEventListener("click",n)}}function ie({title:t,message:e,confirmLabel:a="Confirmar",cancelLabel:r="Cancelar",danger:n=!1}){return new Promise(s=>{const i=document.querySelector("#modal-root");if(!i){s(!1);return}i.innerHTML=`
      <div
        class="modal-backdrop"
        role="presentation"
      >
        <section
          class="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <h2 id="confirm-modal-title">
            ${h(t)}
          </h2>

          <p>
            ${h(e)}
          </p>

          <div class="modal-actions">
            <button
              id="confirm-modal-cancel"
              class="button button--secondary"
              type="button"
            >
              ${h(r)}
            </button>

            <button
              id="confirm-modal-confirm"
              class="
                button
                ${n?"button--danger":"button--primary"}
              "
              type="button"
            >
              ${h(a)}
            </button>
          </div>
        </section>
      </div>
    `;const o=i.querySelector(".modal-backdrop"),c=i.querySelector("#confirm-modal-cancel"),l=i.querySelector("#confirm-modal-confirm");let d=!1;const u=m=>{d||(d=!0,document.removeEventListener("keydown",p),i.innerHTML="",s(m))},p=m=>{m.key==="Escape"&&u(!1)};c.addEventListener("click",()=>u(!1),{once:!0}),l.addEventListener("click",()=>u(!0),{once:!0}),o.addEventListener("click",m=>{m.target===o&&u(!1)}),document.addEventListener("keydown",p),l.focus()})}let Bn=0;const me=(t,e,a="",r="",n="text")=>{const s="trade-control-"+ ++Bn;return`<div class="field"><label for="${s}">${e}</label><input id="${s}" name="${t}" type="${n}" value="${h(a)}" ${r}></div>`},je=(t,e,a="",r=2e3)=>{const n="trade-control-"+ ++Bn;return`<div class="field"><label for="${n}">${e}</label><textarea id="${n}" name="${t}" maxlength="${r}" rows="3">${h(a)}</textarea></div>`},ua=(t,e,a,r="")=>{const n="trade-control-"+ ++Bn;return`<div class="field"><label for="${n}">${e}</label><select id="${n}" name="${t}">${a.map(([s,i])=>`<option value="${h(s)}" ${String(s)===String(r)?"selected":""}>${h(i)}</option>`).join("")}</select></div>`},fe=(t,e="",a=!1)=>`<button class="button button--${a?"secondary":"primary"}" ${e}>${t}</button>`,pe=(t,e)=>`<input type="hidden" name="${t}" value="${h(e)}">`,We=t=>new Date(t).toLocaleString("pt-BR"),pa=t=>`${t.package_name} • ${Number(t.package_size).toLocaleString("pt-BR")} ${t.base_unit}`,vi={available:"Disponível",on_request:"Sob consulta",unavailable:"Indisponível"},fh={confirmed:"Aguardando entrega",awaiting_receipt:"Aguardando confirmação do produtor",delivery_issue:"Problema na entrega",received:"Recebido e adicionado ao barracão"},vh=t=>({kg:"kg",L:"l",un:"unit"})[t],gh=["ordered","declined","cancelled","rejected"];async function gi({session:t}){const e=document.querySelector("#app"),a=t.user.id,r=window.location.pathname.startsWith("/consultor"),n=r?"/consultor/negociacoes":"/compras",s=new URLSearchParams(window.location.search),i=s.get("request"),o=s.get("seller");let c,l=!1,d=!1;const u=new Map,p=b=>O({session:t,title:r?"Catálogo e propostas":"Minhas compras",activeNav:r?"commerce":"more",content:`<div class="commerce-page trade-page">${b}</div>`});e.innerHTML=p('<p role="status">Carregando negociações…</p>');const m=(b,g=!1)=>{const R=e.querySelector("#trade-feedback");R&&(R.textContent=b,R.hidden=!b,R.className=`form-message form-message--${g?"error":"success"}`)},f=b=>b.owner_id===a,v=b=>f(b)||c.commerce_memberships.some(g=>g.user_id===a&&g.seller_id===b.id&&g.active),_=b=>{var g;return((g=c.commerce_sellers.find(R=>R.id===b))==null?void 0:g.name)||"Vendedor"},w=(b,g="")=>`<a class="button button--secondary" href="${n}${g}" data-link>${b}</a>`;function k(b){const g=new Date(b.valid_until)<=new Date;return`<details class="commerce-card trade-quote" open><summary><strong>Versão ${b.version} • ${ee(b.total)}</strong> — ${b.status==="accepted"?"Aceita":b.status==="superseded"?"Substituída":b.status==="declined"?"Recusada":g?"Validade encerrada":"Enviada"}</summary><p>${h(b.seller_name)} • ${We(b.created_at)}</p>${b.items.map(R=>`<div class="commerce-row"><div><strong>${h(R.name)}</strong><p>${h(pa(R))} × ${Number(R.quantity).toLocaleString("pt-BR")}</p><p>${ee(R.unit_price)} por embalagem</p></div><strong>${ee(R.line_total)}</strong></div>`).join("")}<dl class="trade-totals"><dt>Produtos</dt><dd>${ee(b.subtotal)}</dd><dt>Desconto</dt><dd>${ee(b.discount)}</dd><dt>Frete</dt><dd>${ee(b.freight)}</dd><dt>Total</dt><dd><strong>${ee(b.total)}</strong></dd></dl><p>Válida até ${We(b.valid_until)}. Entrega estimada: ${b.delivery_days} dia(s) após confirmação do pedido.</p><p>Pagamento: ${h(b.payment_terms)}</p>${b.notes?`<p>Observações: ${h(b.notes)}</p>`:""}</details>`}function S(){const b=c.trade_requests.find(M=>M.id===i);if(!b)return'<section class="commerce-card"><h2>Solicitação indisponível</h2><p>Atualize a página ou verifique seu acesso.</p></section>';const g=c.trade_connections.find(M=>M.id===b.connection_id),R=(g==null?void 0:g.buyer_id)===a,x=c.trade_quotes.filter(M=>M.request_id===b.id).sort((M,le)=>le.version-M.version),H=x[0],P=c.trade_orders.find(M=>M.request_id===b.id);let N=`${w("← Negociações")}<section class="commerce-card"><span class="commerce-badge">${ci[b.state]}</span><h2>${h(_(g==null?void 0:g.seller_id))}</h2><p>Solicitação ${h(b.id.slice(0,8))} • ${We(b.created_at)}</p><p>Produtor: ${h((g==null?void 0:g.buyer_name)||"Produtor")}</p><p>Destino: ${h(b.delivery_address)}${b.property_name?" • "+h(b.property_name):""}</p>${b.desired_date?`<p>Data desejada: ${h(b.desired_date.split("-").reverse().join("/"))}</p>`:""}<p>${h(b.notes)}</p>${b.items.map(M=>`<div class="commerce-row"><div><strong>${h(M.name)}</strong><p>${h(pa(M))}</p></div><strong>${Number(M.quantity).toLocaleString("pt-BR")} embalagem(ns)</strong></div>`).join("")}</section>`;if(R||(N+=`<a class="button button--secondary" href="/consultor/acompanhamento?request=${h(b.id)}" data-link>Acompanhamento interno</a>`),!gh.includes(b.state)){if(!R&&["awaiting","revision_requested"].includes(b.state)){const M=new Date(Date.now()+6048e5),le=new Date(M.getTime()-M.getTimezoneOffset()*6e4).toISOString().slice(0,16);N+=`<section class="commerce-card"><h3>Enviar ${H?"nova versão do":"o"} orçamento</h3><p>Os valores são por embalagem. Cada proposta fica registrada no histórico.</p><form data-command="send_quote">${pe("request_id",b.id)}${b.items.map(J=>{const Y=H==null?void 0:H.items.find(ye=>ye.product_id===J.product_id),re=c.trade_products.find(ye=>ye.id===J.product_id);return me("price_"+J.product_id,`Preço de ${h(J.name)} (${h(pa(J))})`,(Y==null?void 0:Y.unit_price)??(re==null?void 0:re.reference_price)??"",'required min="0" max="1000000000" step="0.01"',"number")}).join("")}${me("discount","Desconto total (R$)",(H==null?void 0:H.discount)??0,'min="0" step="0.01"',"number")}${me("freight","Frete (R$)",(H==null?void 0:H.freight)??0,'min="0" max="1000000000" step="0.01"',"number")}${me("valid_until","Validade da proposta",le,"required","datetime-local")}${me("delivery_days","Prazo de entrega após confirmação (dias)",(H==null?void 0:H.delivery_days)??3,'required min="0" max="365" step="1"',"number")}${me("payment_terms","Condições de pagamento",(H==null?void 0:H.payment_terms)||"",'required maxlength="500"')}${je("message","Observações do orçamento",(H==null?void 0:H.notes)||"")}${fe("Enviar orçamento",'type="submit"')}</form></section>`}R&&b.state==="quoted"&&H&&(N+=`<section class="commerce-card"><h3>Responder à proposta</h3><p>${new Date(H.valid_until)<=new Date?"A validade terminou. Solicite uma nova versão se desejar continuar.":"Confira os produtos e as condições antes de continuar."}</p><form data-command="request_revision">${pe("request_id",b.id)}${pe("quote_id",H.id)}${je("message","Motivo da revisão ou recusa")}<div class="commerce-actions">${fe("Pedir revisão",'type="submit"')}${fe("Recusar proposta",'type="submit" data-command="decline_quote"',!0)}</div></form>${new Date(H.valid_until)>new Date?`<form data-command="accept_quote">${pe("request_id",b.id)}${pe("quote_id",H.id)}<p>Ao aceitar, você confirma o pedido de ${ee(H.total)} conforme esta proposta. Nenhum pagamento será realizado pelo app.</p>${fe("Aceitar proposta e criar pedido",'type="submit"')}</form>`:""}</section>`),(!R&&["awaiting","revision_requested"].includes(b.state)||R&&b.state==="awaiting_buyer")&&(N+=`<section class="commerce-card"><h3>${R?"Responder ao consultor":"Pedir esclarecimento"}</h3><form data-command="${R?"answer_clarification":"ask_clarification"}">${pe("request_id",b.id)}${je("message","Esclarecimento")}${fe(R?"Enviar resposta":"Solicitar esclarecimento",'type="submit"',!0)}</form></section>`),N+=`<details class="commerce-card"><summary>Encerrar solicitação</summary><form data-command="${R?"cancel_request":"reject_request"}">${pe("request_id",b.id)}${je("message","Motivo do encerramento")}${fe(R?"Cancelar solicitação":"Recusar atendimento",'type="submit"',!0)}</form></details>`}P&&(N+=`<section class="commerce-card"><h3>Pedido confirmado</h3><strong>${fh[P.state]}</strong><p>Número do pedido: <strong>${h(P.id)}</strong></p><p>Confirmado em ${We(P.created_at)} por ${h(P.buyer_name)}</p><p>Vendedor: ${h(P.seller_name)}</p><p>Total confirmado: <strong>${ee(P.total)}</strong></p><p>Pagamento: ${h(P.quote_snapshot.payment_terms)}</p><p>Destino: ${h(P.delivery_snapshot.address)}</p><p>Prazo combinado: ${P.quote_snapshot.delivery_days} dia(s) após a confirmação.</p><p>Os produtos e valores estão na proposta aceita abaixo. Combine o pagamento e a entrega diretamente com o consultor. O estoque só entra no barracão depois que o produtor confirmar o recebimento integral.</p></section>`),P&&!R&&["confirmed","delivery_issue"].includes(P.state)&&(N+=`<section class="commerce-card"><h3>Informar entrega</h3><p>Informe somente após entregar todos os produtos. O produtor ainda deverá confirmar o recebimento.</p><form data-command="mark_delivery">${pe("order_id",P.id)}${je("message","Observações da entrega")}${fe("Informar que entreguei",'type="submit"')}</form></section>`),P&&R&&P.state==="awaiting_receipt"&&(N+=`<section class="commerce-card"><h3>Conferir recebimento</h3><p>Confira todos os itens antes de confirmar. Se faltou algo, informe um problema: nenhuma quantidade entrará no barracão.</p><form data-command="confirm_receipt">${pe("order_id",P.id)}${pe("delivery_version",P.delivery_version)}${P.quote_snapshot.items.map(M=>{var Y;const le=c.agricultural_inputs.filter(re=>re.active&&!re.deleted_at&&re.base_unit===vh(M.base_unit)),J=(Y=c.trade_inventory_links.find(re=>re.product_id===M.product_id))==null?void 0:Y.agricultural_input_id;return`<p><strong>${h(M.name)}</strong>: ${Number(M.quantity).toLocaleString("pt-BR")} × ${Number(M.package_size).toLocaleString("pt-BR")} ${h(M.base_unit)} = ${(Number(M.quantity)*Number(M.package_size)).toLocaleString("pt-BR",{maximumFractionDigits:6})} ${h(M.base_unit)}</p>`+ua("input_"+M.product_id,"Destino de "+h(M.name),[["","Vincular automaticamente"],...le.map(re=>[re.id,re.name])],le.some(re=>re.id===J)?J:"")}).join("")}<p>A vinculação automática reutiliza um vínculo anterior válido ou cadastra um insumo na categoria Outros. Escolha um insumo existente para evitar duplicatas.</p>${fe("Confirmar recebimento integral",'type="submit"')}</form><form data-command="report_delivery_issue">${pe("order_id",P.id)}${pe("delivery_version",P.delivery_version)}${je("message","Problema encontrado")}${fe("Informar problema na entrega",'type="submit"',!0)}</form></section>`),(P==null?void 0:P.state)==="delivery_issue"&&(N+='<section class="commerce-card"><h3>Entrega em ajuste</h3><p>Consulte o problema no histórico e combine a solução na conversa. Nenhuma entrada no barracão foi feita. O consultor deve informar a entrega novamente após resolver.</p></section>'),(P==null?void 0:P.state)==="received"&&(N+=`<section class="commerce-card"><h3>Recebimento concluído</h3><p>Confirmado pelo produtor em ${We(P.received_at)}.</p>${R?c.trade_receipt_items.filter(M=>M.order_id===P.id).map(M=>`<p>${Number(M.quantity).toLocaleString("pt-BR")} ${h(M.unit)} • ${ee(M.total_cost)} <a class="button button--secondary" href="/inventory/${M.agricultural_input_id}/lots/${M.inventory_lot_id}" data-link>Ver lote no barracão</a></p>`).join(""):"<p>O produtor confirmou o recebimento dos produtos.</p>"}</section>`);const F=c.trade_messages.filter(M=>M.request_id===b.id).sort((M,le)=>new Date(M.created_at)-new Date(le.created_at)||M.id.localeCompare(le.id));return N+=`<section class="commerce-card"><h3>Conversa da negociação</h3><p>Use Atualizar conversa para buscar novas mensagens. As mensagens ficam registradas e não podem ser editadas.</p><button class="button button--secondary" type="button" data-refresh>Atualizar conversa</button><div class="trade-messages">${F.map(M=>`<article class="trade-message ${M.sender_id===a?"trade-message--own":""}"><strong>${M.sender_id===a?"Você":M.sender_role==="buyer"?"Produtor":"Equipe do vendedor"}</strong><time>${We(M.created_at)}</time><p>${h(M.body)}</p></article>`).join("")||"<p>Nenhuma mensagem nesta conversa.</p>"}</div>${!["declined","cancelled","rejected"].includes(b.state)&&(g!=null&&g.active)?`<form data-command="send_message">${pe("request_id",b.id)}${je("message","Sua mensagem")}${fe("Enviar mensagem",'type="submit"')}</form>`:"<p>Conversa encerrada. O histórico permanece disponível.</p>"}</section>`,N+=`<section><h3 class="trade-section-title">Histórico de orçamentos</h3>${x.length?x.map(k).join(""):"<p>Nenhum orçamento enviado.</p>"}</section><section class="commerce-card"><h3>Atividades da negociação</h3>${c.trade_events.filter(M=>M.request_id===b.id).sort((M,le)=>new Date(M.created_at)-new Date(le.created_at)).map(M=>`<article class="commerce-row"><div><strong>${th[M.action]||"Atualização"}</strong><p>${We(M.created_at)}</p><p>${h(M.message)}</p></div></article>`).join("")}</section>`,N}function T(b){const g=f(b),R=c.trade_products.filter(P=>P.seller_id===b.id),x=R.find(P=>P.id===s.get("product"));let H=`<section class="commerce-card"><h3>Catálogo de ${h(b.name)}</h3>${R.filter(P=>r||!P.archived).map(P=>`<article class="commerce-row"><div><strong>${h(P.name)}</strong><p>${h(P.category)}${P.brand?" • "+h(P.brand):""}</p><p>${h(pa(P))}</p><p>${P.archived?"Arquivado":vi[P.availability]}${P.reference_price!==null?" • Referência: "+ee(P.reference_price):""}</p>${P.description?`<p>${h(P.description)}</p>`:""}</div>${g&&r&&!P.archived?`<div class="commerce-actions">${w("Editar",`?seller=${b.id}&product=${P.id}`)}${fe("Arquivar",`type="button" data-action="archive_product" data-id="${P.id}" data-seller="${b.id}"`,!0)}</div>`:""}</article>`).join("")||"<p>Nenhum produto cadastrado.</p>"}</section>`;if(r&&g&&(H+=`<section class="commerce-card"><h3>${x?"Editar produto":"Novo produto"}</h3><form data-command="save_product">${pe("seller_id",b.id)}${pe("product_id",(x==null?void 0:x.id)||"")}${me("name","Nome do produto",(x==null?void 0:x.name)||"",'required minlength="2" maxlength="120"')}${me("category","Categoria",(x==null?void 0:x.category)||"",'maxlength="80"')}${me("brand","Marca",(x==null?void 0:x.brand)||"",'maxlength="80"')}${je("description","Descrição",(x==null?void 0:x.description)||"")}${me("package_name","Embalagem (ex.: saco, frasco, unidade)",(x==null?void 0:x.package_name)||"",'required maxlength="60"')}${me("package_size","Conteúdo de cada embalagem",(x==null?void 0:x.package_size)||1,'required min="0.001" max="1000000" step="0.001"',"number")}${ua("base_unit","Unidade do conteúdo",[["kg","Quilogramas (kg)"],["L","Litros (L)"],["un","Unidades"]],(x==null?void 0:x.base_unit)||"kg")}${me("reference_price","Preço de referência por embalagem (opcional)",(x==null?void 0:x.reference_price)??"",'min="0" max="1000000000" step="0.01"',"number")}${ua("availability","Disponibilidade",Object.entries(vi),(x==null?void 0:x.availability)||"on_request")}${fe("Salvar produto",'type="submit"')}</form></section>`),!r){const P=c.trade_connections.find(F=>F.seller_id===b.id&&F.buyer_id===a&&F.active),N=R.filter(F=>!F.archived&&F.availability!=="unavailable");P&&N.length&&(H+=`<section class="commerce-card"><h3>Solicitar orçamento</h3><p>Informe a quantidade de embalagens de cada produto desejado. Deixe os demais em zero.</p><form data-command="create_request">${pe("connection_id",P.id)}${N.map(F=>me("qty_"+F.id,`${h(F.name)} — ${h(pa(F))}`,0,'min="0" max="1000000" step="0.001"',"number")).join("")}${ua("property_id","Propriedade de destino (opcional)",[["","Outro local"],...c.properties.map(F=>[F.id,F.name])])}${je("delivery_address","Endereço ou instruções de entrega","",500)}${me("desired_date","Data desejada (opcional)","","","date")}${je("notes","Observações")}${fe("Enviar solicitação",'type="submit"')}</form></section>`)}return H}function A(){var x;const b=c.commerce_sellers.filter(H=>r?v(H):c.trade_connections.some(P=>P.seller_id===H.id&&P.buyer_id===a&&P.active)),g=b.find(H=>H.id===o)||b.find(H=>{var P;return H.id===((P=c.commerce_accounts[0])==null?void 0:P.active_seller_id)})||b[0];let R=`<section class="page-heading"><div><h2>${r?"Atenda seus clientes":"Consulte produtos e preços"}</h2><p>${r?"Escolha o vendedor para gerenciar catálogo e negociações.":"Conecte-se ao consultor pelo código recebido para acessar o catálogo."}</p></div></section><nav class="commerce-actions" aria-label="Vendedores">${b.map(H=>w(h(H.name),`?seller=${H.id}`)).join("")}</nav>`;if(g){R+=`<section class="commerce-card"><h3>${h(g.name)}</h3><p>${r?f(g)?"Você é responsável pelo catálogo.":"Você atende seus clientes; alterações de catálogo são feitas pelo responsável.":"Vendedor conectado"}</p></section>`;const H=c.trade_connections.filter(F=>F.seller_id===g.id&&(r?F.buyer_id!==a:F.buyer_id===a)),P=new Set(H.map(F=>F.id)),N=c.trade_requests.filter(F=>P.has(F.connection_id)).sort((F,M)=>new Date(M.created_at)-new Date(F.created_at));R+=`<section class="commerce-card"><h3>Solicitações, propostas e pedidos</h3>${N.length?N.map(F=>{var M;return`<article class="commerce-row"><div><strong>${r?h((M=H.find(le=>le.id===F.connection_id))==null?void 0:M.buyer_name):"Solicitação "+F.id.slice(0,8)}</strong><p>${ci[F.state]} • ${We(F.created_at)}</p></div>${w("Abrir",`?request=${F.id}`)}</article>`}).join(""):"<p>Nenhuma solicitação para este vendedor.</p>"}</section>`,R+=T(g),r&&(R+=`<section class="commerce-card"><h3>Convidar produtor</h3><p>O código conecta o produtor a este vendedor e a você como consultor responsável. Compartilhe-o com a pessoa; nenhum e-mail é enviado.</p><form data-command="invite_buyer">${pe("seller_id",g.id)}${me("email","E-mail do produtor","",'required maxlength="254"',"email")}${fe("Gerar código",'type="submit"')}</form>${c.trade_invitations.filter(F=>F.seller_id===g.id).map(F=>{const M=F.status==="pending"&&new Date(F.expires_at)>new Date;return`<article class="commerce-row"><div class="commerce-invite-code"><strong>${h(F.email)}</strong><p>${F.status==="accepted"?"Aceito":F.status==="revoked"?"Cancelado":M?"Válido até "+We(F.expires_at):"Expirado"}</p>${M?`<label class="commerce-code-label">Código para o produtor<input class="commerce-code" readonly value="${h(F.token)}" aria-label="Código para ${h(F.email)}"></label>`:""}</div>${M?fe("Cancelar convite",`type="button" data-action="revoke_connection_invite" data-id="${F.id}"`,!0):""}</article>`}).join("")}</section><section class="commerce-card"><h3>Clientes conectados</h3>${H.map(F=>`<article class="commerce-row"><div><strong>${h(F.buyer_name)}</strong><p>${F.agent_id===a?"Atendimento sob sua responsabilidade":"Atendimento por representante"}</p></div>${f(g)?`<form data-command="assign_agent">${pe("connection_id",F.id)}${ua("agent_id","Responsável por "+h(F.buyer_name),[[g.owner_id,"Responsável pela empresa"],...c.commerce_memberships.filter(M=>M.seller_id===g.id&&M.active).map(M=>[M.user_id,M.representative_name])],F.agent_id)}${fe("Transferir atendimento",'type="submit"',!0)}</form>`:""}</article>`).join("")||"<p>Nenhum cliente conectado.</p>"}</section>`)}else r&&(R+='<section class="commerce-card"><p>Ative seu perfil e cadastre uma atuação própria ou aceite um convite de empresa.</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço de consultor</a></section>');return r||(R+=`<section class="commerce-card"><h3>Conectar a um consultor</h3><form data-command="accept_connection">${me("name","Seu nome de contato",((x=t.user.user_metadata)==null?void 0:x.full_name)||"",'required minlength="2" maxlength="120"')}${me("token","Código recebido","",'required maxlength="36" autocomplete="off"')}${fe("Conectar",'type="submit"')}</form></section>`),R}function C(b=""){d||(e.innerHTML=p(`<div id="trade-feedback" role="status" aria-live="polite" hidden></div>${i?S():A()}`),m(b))}function I(){return[...e.querySelectorAll("form[data-command]")].filter(b=>b.dataset.command!=="send_message").map(b=>({command:b.dataset.command,fields:[...b.elements].filter(g=>g.name&&g.type!=="hidden").map(g=>[g.name,g.value])}))}function E(b){if(!d)for(const g of b){const R=[...e.querySelectorAll("form[data-command]")].find(x=>x.dataset.command===g.command);if(R)for(const[x,H]of g.fields){const P=R.elements.namedItem(x);P&&(P.value=H)}}}async function L(b,g){if(l||d)return;const R=JSON.stringify([b,g]);u.has(R)||u.set(R,crypto.randomUUID()),l=!0;const x=[...e.querySelectorAll("button")];x.forEach(N=>N.disabled=!0),m("Salvando…");const H=b==="send_message"?I():[];let P=!1;try{const N=await ah(b,g,u.get(R));if(P=!0,d)return;if(b==="create_request"){Q(`${n}?request=${N.request_id}`);return}c=await on(),u.clear(),C(N.approval_pending?"Proposta enviada para aprovação interna. O produtor receberá a proposta após a aprovação.":b==="send_message"?"Mensagem enviada.":"Alteração salva."),E(H)}catch(N){d||m(P?"A alteração foi salva. Reabra a página para atualizar os dados antes de repetir.":sn(N),!0)}finally{l=!1,d||x.forEach(N=>N.disabled=!1)}}const q=async b=>{var H;const g=b.target.closest("form[data-command]");if(!g||(b.preventDefault(),l||!g.reportValidity()))return;const R=((H=b.submitter)==null?void 0:H.dataset.command)||g.dataset.command,x=Object.fromEntries(new FormData(g));if(R==="create_request"){x.items=Object.entries(x).filter(([P,N])=>P.startsWith("qty_")&&Number(N)>0).map(([P,N])=>({product_id:P.slice(4),quantity:Number(N)}));for(const P of Object.keys(x))P.startsWith("qty_")&&delete x[P];if(!x.items.length){m("Escolha ao menos um produto com quantidade maior que zero.",!0);return}}if(R==="send_quote"){x.items=Object.entries(x).filter(([P])=>P.startsWith("price_")).map(([P,N])=>({product_id:P.slice(6),unit_price:Number(N)}));for(const P of Object.keys(x))P.startsWith("price_")&&delete x[P];x.valid_until=new Date(x.valid_until).toISOString()}if(x.token&&(x.token=x.token.trim()),R==="confirm_receipt"){x.items=Object.entries(x).filter(([P])=>P.startsWith("input_")).map(([P,N])=>({product_id:P.slice(6),input_id:N}));for(const P of Object.keys(x))P.startsWith("input_")&&delete x[P];if(!await ie({title:"Recebeu todos os produtos?",message:"As quantidades serão adicionadas ao seu barracão. Confirme somente após conferir a entrega completa e os insumos escolhidos.",confirmLabel:"Sim, recebi tudo"}))return}if(!(R==="mark_delivery"&&!await ie({title:"Todos os produtos foram entregues?",message:"O produtor será avisado para conferir e confirmar o recebimento.",confirmLabel:"Sim, entreguei"}))){if(R==="accept_quote"){const P=c.trade_quotes.find(N=>N.id===x.quote_id);if(!P||!await ie({title:"Confirmar este pedido?",message:`Você está aceitando a proposta de ${ee(P.total)}. Confira os produtos, o endereço e as condições de pagamento. O app não cobra nem transfere dinheiro.`,confirmLabel:"Confirmar pedido"}))return}["cancel_request","decline_quote","reject_request"].includes(R)&&!await ie({title:"Encerrar esta negociação?",message:"O histórico será preservado. Para retomar depois, será necessário criar outra solicitação.",confirmLabel:"Confirmar",danger:!0})||d||await L(R,x)}},$=async b=>{var P;if(b.target.closest("[data-refresh]")){if(l)return;if((P=e.querySelector('form[data-command="send_message"] textarea'))!=null&&P.value.trim()){m("Envie sua mensagem ou limpe o rascunho antes de atualizar.",!0);return}const N=I();l=!0,m("Atualizando…");try{c=await on(),C("Conversa atualizada."),E(N)}catch(F){d||m(sn(F),!0)}finally{l=!1}return}const g=b.target.closest("[data-action]");if(!g||l)return;const{action:R,id:x,seller:H}=g.dataset;await ie({title:R==="archive_product"?"Arquivar produto?":"Cancelar convite?",message:R==="archive_product"?"O produto sairá das novas solicitações. As propostas anteriores serão preservadas.":"O código deixará de funcionar.",confirmLabel:"Confirmar",danger:!0})&&(d||await L(R,R==="archive_product"?{seller_id:H,product_id:x}:{invitation_id:x}))};try{c=await on(),C()}catch(b){e.innerHTML=p('<section class="commerce-card"><h2>Não foi possível carregar negociações</h2><p id="trade-load-error" role="alert"></p><a class="button button--secondary" href="/more" data-link>Voltar</a></section>'),e.querySelector("#trade-load-error").textContent=sn(b)}return e.addEventListener("submit",q),e.addEventListener("click",$),()=>{d=!0,e.removeEventListener("submit",q),e.removeEventListener("click",$)}}function yi(t){return["42P01","PGRST202","PGRST205"].includes(t==null?void 0:t.code)?"O módulo Consultor ainda precisa ser instalado pelo responsável pelo sistema. Seu modo produtor continua disponível.":(t==null?void 0:t.code)==="22P02"?"Confira o código do convite e tente novamente.":(t==null?void 0:t.code)==="23505"?"Este cadastro ou convite já existe. Atualize a página antes de tentar novamente.":(t==null?void 0:t.message)||"Não foi possível concluir. Verifique sua conexão e tente novamente."}async function _i(){if(!V)throw new Error("Não foi possível conectar à sua conta.");const t=await Promise.all([V.from("commerce_accounts").select("*").maybeSingle(),V.from("commerce_sellers").select("*").order("created_at"),V.from("commerce_memberships").select("*").order("joined_at"),V.from("commerce_invitations").select("*").order("created_at",{ascending:!1})]);for(const e of t)if(e.error)throw e.error;return{account:t[0].data,sellers:(t[1].data||[]).filter(e=>{var a;return e.owner_id===((a=t[0].data)==null?void 0:a.user_id)||(t[2].data||[]).some(r=>{var n;return r.user_id===((n=t[0].data)==null?void 0:n.user_id)&&r.seller_id===e.id})}),memberships:t[2].data||[],invitations:t[3].data||[]}}async function yh(t,e={}){if(!V)throw new Error("Não foi possível conectar à sua conta.");const a=await V.rpc("commerce_command",{p_action:t,p_data:e});if(a.error)throw a.error;return a.data}function bi(t,e,a){if(t.owner_id===a)return{owner:!0,active:!0,label:t.kind==="personal"?"Por conta própria":"Responsável pela empresa"};const r=e.find(n=>n.seller_id===t.id&&n.user_id===a);return{owner:!1,active:!!(r!=null&&r.active),label:r!=null&&r.active?"Representante":"Vínculo encerrado"}}const Ge=(t,e,a="",r="text",n="")=>`<div class="field"><label for="commerce-${t}">${e}</label><input id="commerce-${t}" name="${t}" type="${r}" value="${h(a)}" ${n}></div>`,Ke=(t,e="",a=!1)=>`<button class="button button--${a?"secondary":"primary"}" ${e}>${t}</button>`,dn=t=>new Date(t).toLocaleDateString("pt-BR");async function wi({session:t}){const e=document.querySelector("#app"),a=t.user.id,r=new URLSearchParams(window.location.search).get("id");let n,s=!1,i=!1;const o=m=>O({session:t,title:"Consultor",eyebrow:"Meu Agro • Comercial",activeNav:"commerce",content:`<div class="commerce-page">${m}</div>`});e.innerHTML=o('<p role="status">Carregando seu espaço comercial…</p>');const c=(m,f=!1)=>{const v=e.querySelector("#commerce-feedback");v&&(v.textContent=m,v.className=`form-message form-message--${f?"error":"success"}`,v.hidden=!m)};function l(m=""){var k,S,T,A;if(s)return;const v=`<section class="page-heading commerce-hero"><div><p class="section-eyebrow">Seu espaço comercial</p><h2>${r?((k=n.sellers.find(C=>C.id===r))==null?void 0:k.kind)==="personal"?"Minha atuação própria":"Empresa e representantes":"Seu negócio, em um só lugar"}</h2><p>Trabalhe por conta própria e represente empresas com a mesma conta.</p></div></section><div id="commerce-feedback" role="status" aria-live="polite" hidden></div>`;let _;if(!((S=n.account)!=null&&S.enabled))_=`<section class="commerce-card"><h3>Ative seu perfil de consultor</h3><p>Seu acesso como produtor e seus registros serão mantidos.</p><form data-command="enable">${Ge("name","Nome profissional",((T=t.user.user_metadata)==null?void 0:T.full_name)||"","text",'required minlength="2" maxlength="120" autocomplete="name"')}${Ke("Ativar modo consultor",'type="submit"')}</form></section>`;else if(r){const C=n.sellers.find(I=>I.id===r);if(!C)_='<section class="commerce-card"><h3>Cadastro indisponível</h3><p>Você não possui acesso a este vendedor.</p><a class="button button--secondary" href="/consultor" data-link>Voltar ao meu espaço</a></section>';else{const I=bi(C,n.memberships,a),E=n.memberships.filter(q=>q.seller_id===C.id),L=n.invitations.filter(q=>q.seller_id===C.id);_=`<a href="/consultor" class="button button--secondary link" data-link>← Meu espaço</a><section class="commerce-card"><span class="commerce-badge">${I.label}</span><h3>${h(C.name)}</h3>${I.owner?`<form data-command="update_seller"><input type="hidden" name="seller_id" value="${h(C.id)}">${Ge("name","Nome comercial",C.name,"text",'required minlength="2" maxlength="120"')}${Ge("email","E-mail de contato",C.email,"email",'maxlength="254"')}${Ge("phone","Telefone",C.phone,"tel",'maxlength="40"')}${Ke("Salvar dados",'type="submit"')}</form>`:`<p>${h(C.email||"E-mail não informado")}</p><p>${h(C.phone||"Telefone não informado")}</p><p>${I.active?"Seu vínculo permite atuar em nome desta empresa.":"Seu vínculo foi encerrado. Este cadastro permanece no histórico."}</p>`}</section>`,C.kind==="company"&&(I.owner&&(_+=`<section class="commerce-card"><h3>Convidar representante</h3><p>Gere um código e compartilhe com a pessoa. Ela precisa entrar com o e-mail confirmado indicado abaixo. O código vale por 7 dias.</p><form data-command="invite"><input type="hidden" name="seller_id" value="${h(C.id)}">${Ge("invite-email","E-mail do representante","","email",'required maxlength="254"')}${Ke("Gerar convite",'type="submit"')}</form></section>`),_+=`<section class="commerce-card"><h3>${I.owner?"Representantes":"Meu vínculo"}</h3>${E.length?E.map(q=>`<article class="commerce-row"><div><strong>${h(q.representative_name)}</strong><p>${q.active?"Ativo desde "+dn(q.joined_at):"Encerrado em "+dn(q.ended_at)}</p></div>${q.active?Ke(I.owner?"Encerrar vínculo":"Sair da empresa",`type="button" data-action="end_membership" data-id="${h(q.id)}"`,!0):""}</article>`).join(""):"<p>Nenhum representante vinculado.</p>"}</section>`,I.owner&&(_+=`<section class="commerce-card"><h3>Convites</h3>${L.length?L.map(q=>{const $=q.status==="pending"&&new Date(q.expires_at)>new Date,b=q.status==="accepted"?"Aceito":q.status==="revoked"?"Cancelado":$?"Pendente até "+dn(q.expires_at):"Expirado";return`<article class="commerce-row"><div class="commerce-invite-code"><strong>${h(q.email)}</strong><p>${b}</p>${$?`<label class="commerce-code-label">Código do convite<input class="commerce-code" readonly value="${h(q.token)}" aria-label="Código para ${h(q.email)}"></label>`:""}</div>${$?`<div class="commerce-actions">${Ke("Copiar",`type="button" data-action="copy" data-id="${h(q.id)}"`,!0)}${Ke("Cancelar",`type="button" data-action="revoke_invite" data-id="${h(q.id)}"`,!0)}</div>`:""}</article>`}).join(""):"<p>Nenhum convite gerado.</p>"}</section>`))}}else _=`<section class="commerce-grid">${n.sellers.map(C=>{const I=bi(C,n.memberships,a),E=n.account.active_seller_id===C.id&&I.active;return`<article class="commerce-card commerce-identity ${E?"is-selected":""}"><span class="commerce-badge">${E?"Atuação atual • ":""}${I.label}</span><h3>${h(C.name)}</h3><p>${E?"Atuação selecionada":C.kind==="personal"?"Sua identidade de vendedor independente.":"Identidade comercial da empresa."}</p><div class="commerce-actions">${I.active&&!E?Ke("Selecionar atuação",`type="button" data-action="select_seller" data-id="${h(C.id)}"`):""}<a class="button button--secondary" href="/consultor/empresa?id=${encodeURIComponent(C.id)}" data-link>${I.owner?"Gerenciar cadastro":"Ver vínculo"}</a>${C.kind==="company"&&(I.owner||n.memberships.some(L=>L.seller_id===C.id&&L.user_id===a&&L.active&&L.management_role==="manager"))?`<a class="button button--primary" href="/consultor/gestao?seller=${encodeURIComponent(C.id)}" data-link>Gestão da empresa</a>`:""}</div></article>`}).join("")}</section><section class="commerce-grid"><section class="commerce-card"><h3>Cadastrar minha empresa</h3><p>Você será responsável pelo cadastro e pelos convites dos representantes.</p><form data-command="create_company">${Ge("name","Nome da empresa","","text",'required minlength="2" maxlength="120"')}${Ge("email","E-mail comercial","","email",'maxlength="254"')}${Ge("phone","Telefone comercial","","tel",'maxlength="40"')}${Ke("Criar empresa",'type="submit"')}</form></section><section class="commerce-card"><h3>Aceitar convite</h3><p>Use o código recebido da empresa. Sua conta deve utilizar o e-mail confirmado do destinatário.</p><form data-command="accept_invite">${Ge("token","Código do convite","","text",'required maxlength="36" autocomplete="off" spellcheck="false"')}${Ke("Aceitar convite",'type="submit"')}</form></section></section><section class="commerce-card"><h3>Seu acesso de produtor continua aqui</h3><p>As propriedades, plantios, barracão e contatos existentes permanecem disponíveis.</p><a class="button button--secondary" href="/dashboard" data-link>Ir para o modo produtor</a></section>`;const w=!r&&((A=n.account)!=null&&A.enabled)?`<nav class="commerce-shortcuts" aria-label="Atalhos comerciais"><a href="/consultor/negociacoes" data-link>${y("clipboard")}<span><strong>Negociações</strong><small>Catálogo, propostas e conversas</small></span><span aria-hidden="true">→</span></a><a href="/consultor/resultados" data-link>${y("chart")}<span><strong>Vendas e resultados</strong><small>Comissões e produtos campeões</small></span><span aria-hidden="true">→</span></a></nav>`:"";e.innerHTML=o(v+w+_),c(m)}async function d(m,f){if(i||s)return;i=!0;const v=[...e.querySelectorAll("button")];v.forEach(w=>{w.disabled=!0}),c("Salvando…");let _=!1;try{await yh(m,f),_=!0,n=await _i(),l("Alteração salva.")}catch(w){s||c(_?"A alteração foi salva, mas a atualização da tela falhou. Reabra esta página antes de repetir a ação.":yi(w),!0)}finally{i=!1,s||v.forEach(w=>{w.disabled=!1})}}const u=m=>{const f=m.target.closest("form[data-command]");if(!f||(m.preventDefault(),!f.reportValidity()))return;const v=Object.fromEntries(new FormData(f));v["invite-email"]&&(v.email=v["invite-email"],delete v["invite-email"]),v.token&&(v.token=v.token.trim()),d(f.dataset.command,v)},p=async m=>{const f=m.target.closest("[data-action]");if(!f||i)return;const{action:v,id:_}=f.dataset;if(v==="copy"){try{await navigator.clipboard.writeText(n.invitations.find(w=>w.id===_).token),c("Código copiado. Compartilhe com o destinatário.")}catch{c("Selecione e copie o código exibido no convite.",!0)}return}["end_membership","revoke_invite"].includes(v)&&(!await ie({title:v==="end_membership"?"Encerrar vínculo?":"Cancelar convite?",message:v==="end_membership"?"A pessoa não poderá atuar pela empresa. O histórico será preservado.":"Este código não poderá mais ser utilizado.",confirmLabel:"Confirmar",danger:!0})||s)||await d(v,{[v==="select_seller"?"seller_id":v==="end_membership"?"membership_id":"invitation_id"]:_})};try{n=await _i(),l()}catch(m){e.innerHTML=o('<section class="commerce-card"><h2>Não foi possível abrir o modo consultor</h2><p id="commerce-load-error" role="alert"></p><a class="button button--secondary" href="/consultor" data-link>Tentar novamente</a><a class="button button--secondary" href="/dashboard" data-link>Voltar ao produtor</a></section>'),e.querySelector("#commerce-load-error").textContent=yi(m)}return e.addEventListener("submit",u),e.addEventListener("click",p),()=>{s=!0,e.removeEventListener("submit",u),e.removeEventListener("click",p)}}const un={};function To(t="confirmation",{native:e=Ee.isNativePlatform(),webUrl:a=un==null?void 0:un.VITE_APP_URL,origin:r=(s=>(s=globalThis.location)==null?void 0:s.origin)(),development:n=!1}={}){if(!["confirmation","recovery","oauth"].includes(t))throw new Error("Fluxo de autenticação inválido.");const i=t==="recovery"?"recovery":"callback";if(e)return"meuagro://auth/"+i;const o=new URL((a==null?void 0:a.trim())||r),c=["localhost","127.0.0.1","[::1]"].includes(o.hostname);if(o.username||o.password||!(o.protocol==="https:"||n&&o.protocol==="http:")||c&&!n)throw new Error("Configure VITE_APP_URL com o endereço HTTPS publicado do Meu Agro.");return new URL("/auth/"+i,o.origin).href}function at(){if(!V)throw new Error("O Supabase não foi inicializado. Verifique o arquivo .env.");return V}async function _h({fullName:t,email:e,password:a}){const r=at(),{data:n,error:s}=await r.auth.signUp({email:e.trim().toLowerCase(),password:a,options:{emailRedirectTo:To("confirmation"),data:{full_name:t.trim()}}});if(s)throw s;return n}async function bh({email:t,password:e}){const a=at(),{data:r,error:n}=await a.auth.signInWithPassword({email:t.trim().toLowerCase(),password:e});if(n)throw n;return r}async function Lo(){const t=at(),{disableTradePush:e}=await Or(async()=>{const{disableTradePush:r}=await Promise.resolve().then(()=>Yp);return{disableTradePush:r}},void 0,import.meta.url);await e({forget:!1});const{error:a}=await t.auth.signOut();if(a)throw a}async function wh(t){const e=at(),{data:a,error:r}=await e.auth.resetPasswordForEmail(t.trim().toLowerCase(),{redirectTo:To("recovery")});if(r)throw r;return a}async function $h(t){const e=at(),{data:a,error:r}=await e.auth.updateUser({password:t});if(r)throw r;return a}async function Ro(){const t=at(),{data:{session:e},error:a}=await t.auth.getSession();if(a)throw a;return e}async function Z(){const t=at(),{data:{user:e},error:a}=await t.auth.getUser();if(a)throw a;return e}async function Sh(){const t=at(),e=await Z();if(!e)return null;const{data:a,error:r}=await t.from("profiles").select("id, full_name, phone, avatar_url, onboarding_completed, created_at, updated_at").eq("id",e.id).maybeSingle();if(r)throw r;return a}function Eh(t){const e=at(),{data:a}=e.auth.onAuthStateChange((r,n)=>{t(r,n)});return()=>{a.subscription.unsubscribe()}}const kh='<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';function zn(t){const e=[];for(const a of t.querySelectorAll('input[type="password"]')){if(a.parentElement.classList.contains("password-input"))continue;const r=document.createElement("div");r.className="password-input",a.before(r),r.append(a);const n=document.createElement("button");n.type="button",n.className="password-input__toggle",n.setAttribute("aria-controls",a.id);const s=()=>{const o=a.type==="text",c=(o?"Ocultar":"Mostrar")+" senha";n.setAttribute("aria-label",c),n.setAttribute("aria-pressed",String(o)),n.title=c,n.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+kh+(o?"":'<path d="m3 3 18 18"/>')+"</svg>"},i=()=>{const o=a.selectionStart,c=a.selectionEnd;a.type=a.type==="password"?"text":"password",s(),a.focus({preventScroll:!0}),o!==null&&a.setSelectionRange(o,c)};n.addEventListener("click",i),r.append(n),s(),e.push(()=>{a.type="password",n.removeEventListener("click",i)})}return()=>e.forEach(a=>a())}function Oe(t){var a,r;const e=((r=(a=t==null?void 0:t.message)==null?void 0:a.toLowerCase)==null?void 0:r.call(a))??"";return e.includes("invalid login credentials")?"E-mail ou senha inválidos.":e.includes("email not confirmed")||e.includes("email_not_confirmed")?"Confirme seu e-mail antes de entrar.":e.includes("user already registered")||e.includes("already registered")?"Já existe uma conta cadastrada com este e-mail.":e.includes("password should be at least")||e.includes("weak password")?"A senha não atende aos requisitos mínimos de segurança.":e.includes("rate limit")||e.includes("too many requests")?"Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.":e.includes("network")?"Não foi possível conectar ao servidor. Verifique sua internet.":(t==null?void 0:t.message)||"Não foi possível concluir a operação."}function jr({eyebrow:t="Meu Agro",title:e="Cultive informação. Colha decisões melhores.",description:a="Gerencie propriedades, plantios, estoque e colheitas em um só lugar."}={}){return`
    <header class="auth-brand">
      <div
        class="brand__mark"
        aria-hidden="true"
      >
        🌱
      </div>

      <div>
        <p class="brand__eyebrow">
          ${t}
        </p>

        <h1 class="auth-brand__title">
          ${e}
        </h1>

        <p class="auth-brand__description">
          ${a}
        </p>
      </div>
    </header>
  `}function te(t,e,a="Aguarde…"){t&&(e?(t.dataset.originalText=t.textContent,t.textContent=a,t.disabled=!0,t.setAttribute("aria-busy","true")):(t.textContent=t.dataset.originalText||t.textContent,t.disabled=!1,t.removeAttribute("aria-busy")))}function D(t,e,a="error"){if(t){if(!e){t.hidden=!0,t.textContent="",t.className="form-message";return}t.hidden=!1,t.textContent=e,t.className=`form-message form-message--${a}`}}function Po(t){return t.length<8?"A senha deve possuir pelo menos 8 caracteres.":null}const Ah=3500;function j(t,{type:e="default",duration:a=Ah}={}){const r=document.querySelector("#toast-container");if(!r)return;const n=document.createElement("div");n.className=`toast${e==="error"?" toast--error":e==="success"?" toast--success":""}`,n.setAttribute("role","status"),n.textContent=t,r.appendChild(n),window.setTimeout(()=>{n.remove()},a)}function Ch(){const t=document.querySelector("#app");t.innerHTML=`
    <main class="auth-layout">
      <section class="auth-shell">
        ${jr({title:"Bem-vindo ao Meu Agro",description:"Entre para acompanhar sua produção, estoque e próximas colheitas."})}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Acessar conta
            </p>

            <h2>Entrar</h2>

            <p>
              Informe seu e-mail e senha.
            </p>
          </div>

          <div
            id="login-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="login-form"
            novalidate
          >
            <div class="field">
              <label for="login-email">
                E-mail
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <div class="field">
              <div class="field__label-row">
                <label for="login-password">
                  Senha
                </label>

                <a
                  href="/forgot-password"
                  class="button button--secondary link"
                  data-link
                >
                  Esqueci minha senha
                </a>
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="Sua senha"
                required
              />
            </div>

            <button
              id="login-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Entrar
            </button>
          </form>

          <p class="auth-alternative">
            Ainda não possui conta?

            <a
              href="/register"
              class="button button--secondary link link--strong"
              data-link
            >
              Criar conta
            </a>
          </p>
        </div>
      </section>
    </main>
  `;const e=new URLSearchParams(window.location.search),a=document.querySelector("#login-feedback");e.get("confirmed")==="1"&&D(a,"E-mail confirmado. Agora você já pode entrar.","success");const r=e.get("nativeError");r&&D(a,r),e.get("passwordUpdated")==="1"&&D(a,"Senha alterada com sucesso. Entre novamente.","success");const n=zn(t),s=document.querySelector("#login-form"),i=document.querySelector("#login-submit"),o=async c=>{c.preventDefault(),D(a,"");const l=new FormData(s),d=String(l.get("email")||"").trim(),u=String(l.get("password")||"");if(!d||!u){D(a,"Informe o e-mail e a senha.");return}te(i,!0,"Entrando…");try{await bh({email:d,password:u}),j("Login realizado com sucesso.",{type:"success"});const p=e.get("redirect");Q(p&&p.startsWith("/")?p:"/dashboard",{replace:!0})}catch(p){D(a,Oe(p))}finally{te(i,!1)}};return s.addEventListener("submit",o),()=>{n(),s.removeEventListener("submit",o)}}function Th(){const t=document.querySelector("#app");t.innerHTML=`
    <main class="auth-layout">
      <section class="auth-shell">
        ${jr({title:"Crie sua conta",description:"Comece organizando sua propriedade e mantenha o histórico de cada ciclo produtivo."})}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Primeiro acesso
            </p>

            <h2>Cadastro</h2>

            <p>
              São necessários apenas alguns dados para começar.
            </p>
          </div>

          <div
            id="register-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="register-form"
            novalidate
          >
            <div class="field">
              <label for="register-name">
                Nome
              </label>

              <input
                id="register-name"
                name="fullName"
                type="text"
                autocomplete="name"
                placeholder="Seu nome"
                minlength="2"
                maxlength="120"
                required
              />
            </div>

            <div class="field">
              <label for="register-email">
                E-mail
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <div class="field">
              <label for="register-password">
                Senha
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                autocomplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                minlength="8"
                required
              />

              <small class="field__hint">
                Utilize pelo menos 8 caracteres.
              </small>
            </div>

            <div class="field">
              <label for="register-password-confirm">
                Confirmar senha
              </label>

              <input
                id="register-password-confirm"
                name="passwordConfirm"
                type="password"
                autocomplete="new-password"
                placeholder="Repita sua senha"
                minlength="8"
                required
              />
            </div>

            <button
              id="register-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Criar minha conta
            </button>
          </form>

          <p class="auth-alternative">
            Já possui conta?

            <a
              href="/login"
              class="button button--secondary link link--strong"
              data-link
            >
              Entrar
            </a>
          </p>
        </div>
      </section>
    </main>
  `;const e=zn(t),a=document.querySelector("#register-form"),r=document.querySelector("#register-feedback"),n=document.querySelector("#register-submit"),s=async i=>{i.preventDefault(),D(r,"");const o=new FormData(a),c=String(o.get("fullName")||"").trim(),l=String(o.get("email")||"").trim(),d=String(o.get("password")||""),u=String(o.get("passwordConfirm")||"");if(c.length<2||!l||!d||!u){D(r,"Preencha todos os campos obrigatórios.");return}const p=Po(d);if(p){D(r,p);return}if(d!==u){D(r,"As senhas informadas são diferentes.");return}te(n,!0,"Criando conta…");try{if((await _h({fullName:c,email:l,password:d})).session){Q("/dashboard",{replace:!0});return}a.reset(),D(r,"Conta criada. Enviamos um e-mail para confirmação. Depois de confirmar, volte ao Meu Agro para entrar.","success")}catch(m){D(r,Oe(m))}finally{te(n,!1)}};return a.addEventListener("submit",s),()=>{e(),a.removeEventListener("submit",s)}}function Lh(){const t=document.querySelector("#app");t.innerHTML=`
    <main class="auth-layout">
      <section class="auth-shell">
        ${jr({title:"Recupere seu acesso",description:"Informe o e-mail cadastrado e enviaremos as instruções de recuperação."})}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Recuperação
            </p>

            <h2>
              Esqueci minha senha
            </h2>

            <p>
              O link de recuperação será enviado por e-mail.
            </p>
          </div>

          <div
            id="forgot-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="forgot-form"
            novalidate
          >
            <div class="field">
              <label for="forgot-email">
                E-mail
              </label>

              <input
                id="forgot-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <button
              id="forgot-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Enviar recuperação
            </button>
          </form>

          <p class="auth-alternative">
            <a
              href="/login"
              class="button button--secondary link link--strong"
              data-link
            >
              Voltar para o login
            </a>
          </p>
        </div>
      </section>
    </main>
  `;const e=document.querySelector("#forgot-form"),a=document.querySelector("#forgot-feedback"),r=document.querySelector("#forgot-submit"),n=async s=>{s.preventDefault(),D(a,"");const i=new FormData(e),o=String(i.get("email")||"").trim();if(!o){D(a,"Informe seu e-mail.");return}te(r,!0,"Enviando…");try{await wh(o),e.reset(),D(a,"Se existir uma conta com esse e-mail, enviaremos as instruções para redefinir a senha.","success")}catch(c){D(a,Oe(c))}finally{te(r,!1)}};return e.addEventListener("submit",n),()=>{e.removeEventListener("submit",n)}}async function Rh(){const t=document.querySelector("#app");t.innerHTML=`
    <main class="auth-layout">
      <section class="auth-shell">
        ${jr({title:"Defina uma nova senha",description:"Escolha uma nova senha para continuar utilizando sua conta."})}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Segurança
            </p>

            <h2>Nova senha</h2>
          </div>

          <div
            id="reset-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="reset-form"
            novalidate
          >
            <div class="field">
              <label for="reset-password">
                Nova senha
              </label>

              <input
                id="reset-password"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </div>

            <div class="field">
              <label for="reset-password-confirm">
                Confirmar nova senha
              </label>

              <input
                id="reset-password-confirm"
                name="passwordConfirm"
                type="password"
                autocomplete="new-password"
                minlength="8"
                placeholder="Repita a nova senha"
                required
              />
            </div>

            <button
              id="reset-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Alterar senha
            </button>
          </form>

          <p class="auth-alternative">
            <a
              href="/login"
              class="button button--secondary link link--strong"
              data-link
            >
              Voltar para o login
            </a>
          </p>
        </div>
      </section>
    </main>
  `;const e=zn(t),a=document.querySelector("#reset-form"),r=document.querySelector("#reset-feedback"),n=document.querySelector("#reset-submit");try{await Ro()||(D(r,"Abra esta página pelo link de recuperação enviado ao seu e-mail.","info"),n.disabled=!0)}catch(i){D(r,Oe(i)),n.disabled=!0}const s=async i=>{i.preventDefault(),D(r,"");const o=new FormData(a),c=String(o.get("password")||""),l=String(o.get("passwordConfirm")||""),d=Po(c);if(d){D(r,d);return}if(c!==l){D(r,"As senhas informadas são diferentes.");return}te(n,!0,"Alterando…");try{await $h(c),await Lo(),Q("/login?passwordUpdated=1",{replace:!0})}catch(u){D(r,Oe(u))}finally{te(n,!1)}};return a.addEventListener("submit",s),()=>{e(),a.removeEventListener("submit",s)}}const Ph=1440*60*1e3;function _r(t){if(!t)return null;if(t instanceof Date)return Number.isNaN(t.getTime())?null:new Date(t.getFullYear(),t.getMonth(),t.getDate(),12,0,0,0);const e=String(t);if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[r,n,s]=e.split("-").map(Number);return!r||!n||!s?null:new Date(r,n-1,s,12,0,0,0)}const a=new Date(e);return Number.isNaN(a.getTime())?null:new Date(a.getFullYear(),a.getMonth(),a.getDate(),12,0,0,0)}function qh(){const t=new Date;return new Date(t.getFullYear(),t.getMonth(),t.getDate(),12,0,0,0)}function br(t,e){const a=t instanceof Date?t:_r(t),r=e instanceof Date?e:_r(e);return!a||!r?null:Math.round((a.getTime()-r.getTime())/Ph)}function Vn(t){var u;const e=qh(),a=_r(t==null?void 0:t.planting_date),r=_r(t==null?void 0:t.current_harvest_forecast),n=Number((u=t==null?void 0:t.crop)==null?void 0:u.average_cycle_days);let s="Data de plantio não informada",i=null;if(a)if(i=br(e,a),i>0)s=`Plantado há ${i} ${i===1?"dia":"dias"}`;else if(i===0)s="Plantado hoje";else{const p=Math.abs(i);s=`Plantio em ${p} ${p===1?"dia":"dias"}`}let o="Sem previsão de colheita",c=null,l=0;r&&(c=br(r,e),c>0?o=`Previsão em ${c} ${c===1?"dia":"dias"}`:c===0?o="Previsão para hoje":(l=Math.abs(c),o=`Previsão atrasada há ${l} ${l===1?"dia":"dias"}`));let d=null;return Number.isFinite(n)&&n>0&&i!==null&&(d=Math.max(0,Math.min(100,Math.round(Math.max(0,i)/n*100)))),{elapsedDays:i,daysRemaining:c,delayedDays:l,progressPercent:d,plantingText:s,forecastText:o}}const Wn=[["planting","Plantio","sprout"],["irrigation","Irrigação","droplets"],["manuring","Adubação","leaf"],["fertilization","Fertilização","flask"],["spraying","Pulverização","spray"],["defensive_application","Aplicação de defensivo","shield"],["weeding","Capina","sprout"],["pruning","Poda","scissors"],["pest","Ocorrência de praga","bug"],["disease","Ocorrência de doença","alertTriangle"],["analysis","Análise","chart"],["observation","Observação","clipboard"],["photo","Fotografia","camera"],["harvest","Colheita","harvest"],["other","Outro","more"]];function Rn(t){var e;return((e=Wn.find(([a])=>a===t))==null?void 0:e[1])||t||"Evento"}function qo(t){var e;return((e=Wn.find(([a])=>a===t))==null?void 0:e[2])||"clipboard"}const xh={properties_count:0,active_areas_count:0,active_cycles_count:0,near_harvest_count:0,low_stock_count:0,month_harvests_count:0};function Ia(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function $i(t){return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function Nh(){const t=new Date;t.setHours(12,0,0,0);const e=new Date(t);return e.setDate(e.getDate()+7),{start:$i(t),end:$i(e)}}function Nt(t){const e=Number(t);return Number.isFinite(e)?e:0}async function Ih(){const t=Ia(),{data:e,error:a}=await t.rpc("dashboard_summary");if(a)throw a;const r=Array.isArray(e)?e[0]:e;return{properties_count:Nt(r==null?void 0:r.properties_count),active_areas_count:Nt(r==null?void 0:r.active_areas_count),active_cycles_count:Nt(r==null?void 0:r.active_cycles_count),near_harvest_count:Nt(r==null?void 0:r.near_harvest_count),low_stock_count:Nt(r==null?void 0:r.low_stock_count),month_harvests_count:Nt(r==null?void 0:r.month_harvests_count)}}function Oh(){return{...xh}}async function jh(t=4){const e=Ia(),{start:a,end:r}=Nh(),{data:n,error:s}=await e.from("production_cycles").select(`
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
      `).is("deleted_at",null).not("status","in","(closed,cancelled,harvested)").gte("current_harvest_forecast",a).lte("current_harvest_forecast",r).order("current_harvest_forecast",{ascending:!0}).limit(t);if(s)throw s;return n??[]}async function Dh(t=4){const e=Ia(),{data:a,error:r}=await e.from("inventory_balances").select(`
        agricultural_input_id,
        name,
        brand,
        base_unit,
        minimum_stock,
        current_quantity,
        stock_status,
        active
      `).eq("active",!0).in("stock_status",["low_stock","out_of_stock"]).order("current_quantity",{ascending:!0}).limit(t);if(r)throw r;return a??[]}async function Mh(t){const e=Ia(),{data:a,error:r}=await e.from("production_events").select(`
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
      `).order("occurred_at",{ascending:!1}).limit(t);if(r)throw r;return(a??[]).map(n=>{var s,i,o,c,l;return{id:`event-${n.id}`,occurredAt:n.occurred_at,type:n.event_type||"event",iconName:qo(n.event_type),title:n.title||"Atividade registrada",detail:[(i=(s=n.production_cycle)==null?void 0:s.crop)==null?void 0:i.name,(c=(o=n.production_cycle)==null?void 0:o.area)==null?void 0:c.name].filter(Boolean).join(" • "),href:(l=n.production_cycle)!=null&&l.id?`/plantings/${n.production_cycle.id}#timeline`:"/plantings"}})}async function Uh(t){const e=Ia(),{data:a,error:r}=await e.from("harvest_sales").select(`
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
      `).order("created_at",{ascending:!1}).limit(t);if(r)throw r;return(a??[]).map(n=>{var s,i,o,c,l,d;return{id:`sale-${n.id}`,occurredAt:n.created_at,type:"sale",iconName:"cart",title:(o=(i=(s=n.harvest)==null?void 0:s.production_cycle)==null?void 0:i.crop)!=null&&o.name?`Venda de ${n.harvest.production_cycle.crop.name}`:"Venda registrada",detail:[n.buyer,(d=(l=(c=n.harvest)==null?void 0:c.production_cycle)==null?void 0:l.area)==null?void 0:d.name].filter(Boolean).join(" • "),href:`/more/sales/${n.id}`}})}async function Hh(t=6){const e=Math.max(4,t),a=await Promise.allSettled([Mh(e),Uh(e)]),r=[];for(const n of a)n.status==="fulfilled"?r.push(...n.value):console.warn("Uma fonte de atividades recentes não pôde ser carregada:",n.reason);return r.filter(n=>n.occurredAt).sort((n,s)=>new Date(s.occurredAt).getTime()-new Date(n.occurredAt).getTime()).slice(0,t)}function K(t,e="Não foi possível concluir a operação."){const a=(t==null?void 0:t.code)||"",r=(t==null?void 0:t.message)||"",n=r.toLowerCase();return a==="23505"?n.includes("uq_areas_property_name_active")?"Já existe uma área ativa com este nome nesta propriedade.":n.includes("uq_area_types_user_name")?"Você já possui um tipo de área com este nome.":n.includes("uq_crops_user_name")?"Você já possui uma cultura personalizada com este nome.":n.includes("uq_inputs_user_name_brand_active")?"Já existe um insumo ativo com este nome e marca.":"Já existe um registro com estes dados.":a==="23503"?"Este registro está relacionado a outros dados e não pode ser alterado dessa forma.":a==="P0001"||n.includes("propriedade inválida")||n.includes("tipo de área inválido")||n.includes("área inválida")||n.includes("safra inválida")||n.includes("cultura inválida")||n.includes("propriedade inválida")||n.includes("quantidade total vendida")||n.includes("quantidade já vendida")||n.includes("destino desta colheita")||n.includes("data da venda")||n.includes("data da colheita")||n.includes("ciclo produtivo já está encerrado")||n.includes("saldo insuficiente")||n.includes("lote inválido")||n.includes("unidade do lote")||n.includes("lote deve usar a unidade principal")||n.includes("insumo inativo")?r:n.includes("jwt")||n.includes("session")?"Sua sessão não é mais válida. Entre novamente.":r||e}function Fh(t){var a,r,n,s,i;const e=(n=(r=(a=t==null?void 0:t.user)==null?void 0:a.user_metadata)==null?void 0:r.full_name)==null?void 0:n.trim();return e?e.split(/\s+/)[0]:((i=(s=t==null?void 0:t.user)==null?void 0:s.email)==null?void 0:i.split("@")[0])||"produtor"}function Si(t,e,a){return t===1?e:a}function Bh(t){return t.properties_count===0?{eyebrow:"Seu campo começa aqui",title:"Cadastre sua primeira propriedade.",description:"Depois dela, você poderá organizar áreas, safras, culturas e ciclos produtivos.",href:"/properties/new",action:"Cadastrar propriedade",iconName:"plus"}:t.near_harvest_count>0?{eyebrow:"Atenção à produção",title:`${t.near_harvest_count} ${Si(t.near_harvest_count,"ciclo está","ciclos estão")} próximo${t.near_harvest_count===1?"":"s"} da colheita.`,description:"Confira as previsões dos próximos 7 dias e atualize o andamento dos plantios quando necessário.",href:"/plantings?open=1",action:"Acompanhar plantios",iconName:"harvest"}:t.active_cycles_count>0?{eyebrow:"Produção em andamento",title:`${t.active_cycles_count} ${Si(t.active_cycles_count,"ciclo produtivo ativo","ciclos produtivos ativos")}.`,description:"Acompanhe o tempo de cultivo, as previsões de colheita e os próximos registros da produção.",href:"/plantings?open=1",action:"Ver ciclos ativos",iconName:"sprout"}:t.active_areas_count>0?{eyebrow:"Estrutura pronta",title:"Registre o próximo plantio.",description:"Você já possui áreas cadastradas. Agora escolha uma cultura e inicie um novo ciclo produtivo.",href:"/plantings/new",action:"Novo plantio",iconName:"sprout"}:{eyebrow:"Próximo passo",title:"Cadastre as áreas da propriedade.",description:"Talhões, hortas, piquetes e outros espaços serão usados para organizar os futuros plantios.",href:"/properties",action:"Ver propriedades",iconName:"layers"}}function It({iconName:t,value:e,label:a,description:r,href:n,tone:s="default"}){const i=`
    <span
      class="dashboard-metric__icon dashboard-metric__icon--${s}"
    >
      ${y(t)}
    </span>

    <span class="dashboard-metric__value">
      ${e}
    </span>

    <span class="dashboard-metric__label">
      ${a}
    </span>

    <span class="dashboard-metric__description">
      ${r}
    </span>
  `;return n?`
    <a
      href="${n}"
      class="button button--secondary dashboard-metric dashboard-metric--link"
      data-link
    >
      ${i}
    </a>
  `:`
      <article class="dashboard-metric">
        ${i}
      </article>
    `}function zh(t){return`
    ${It({iconName:"map",value:t.properties_count,label:"Propriedades",description:"ativas",href:"/properties"})}

    ${It({iconName:"layers",value:t.active_areas_count,label:"Áreas ativas",description:"em suas propriedades",href:"/properties"})}

    ${It({iconName:"sprout",value:t.active_cycles_count,label:"Ciclos ativos",description:"em produção",href:"/plantings?open=1",tone:"success"})}

    ${It({iconName:"harvest",value:t.near_harvest_count,label:"Próximos da colheita",description:"nos próximos 7 dias",href:"/more/harvest-forecast?filter=harvest_week",tone:t.near_harvest_count>0?"warning":"default"})}

    ${It({iconName:"box",value:t.low_stock_count,label:"Estoque baixo",description:"itens em atenção",href:"/inventory",tone:t.low_stock_count>0?"danger":"default"})}

    ${It({iconName:"calendar",value:t.month_harvests_count,label:"Colheitas do mês",description:"registros no período",href:"/more/harvests"})}
  `}function Vh(t){return t.length?`
    <div class="dashboard-attention-list">
      ${t.map(e=>{var s,i,o;const a=Vn(e),r=((s=e.crop)==null?void 0:s.name)||"Cultura",n=e.variety?` • ${e.variety}`:"";return`
              <a
                href="/plantings/${e.id}"
                class="button button--secondary dashboard-attention-row"
                data-link
              >
                <span class="dashboard-attention-row__icon dashboard-attention-row__icon--harvest">
                  ${y("harvest")}
                </span>

                <span class="dashboard-attention-row__content">
                  <strong>
                    ${h(`${r}${n}`)}
                  </strong>

                  <span>
                    ${h(((i=e.area)==null?void 0:i.name)||((o=e.property)==null?void 0:o.name)||"Área não informada")}
                  </span>

                  <small>
                    ${h(a.forecastText)}
                    • ${ne(e.current_harvest_forecast)}
                  </small>
                </span>

                ${y("chevronRight")}
              </a>
            `}).join("")}
    </div>
  `:`
      <div class="dashboard-empty-inline">
        <span class="dashboard-empty-inline__icon">
          ${y("harvest")}
        </span>

        <div>
          <strong>
            Nenhuma colheita prevista para os próximos 7 dias
          </strong>

          <span>
            Quando um ciclo entrar nessa janela ele aparecerá aqui automaticamente.
          </span>
        </div>
      </div>
    `}function Wh(t){return t.length?`
    <div class="dashboard-attention-list">
      ${t.map(e=>{const a=e.stock_status==="out_of_stock";return`
              <a
                href="/inventory"
                class="button button--secondary dashboard-attention-row"
                data-link
              >
                <span class="dashboard-attention-row__icon dashboard-attention-row__icon--${a?"danger":"warning"}">
                  ${y("box")}
                </span>

                <span class="dashboard-attention-row__content">
                  <strong>
                    ${h(e.name)}
                  </strong>

                  <span>
                    ${a?"Sem estoque disponível":"Estoque baixo"}
                  </span>

                  <small>
                    ${ae(e.current_quantity)} ${h(e.base_unit||"")} restantes
                  </small>
                </span>

                ${y("chevronRight")}
              </a>
            `}).join("")}
    </div>
  `:`
      <div class="dashboard-empty-inline">
        <span class="dashboard-empty-inline__icon">
          ${y("box")}
        </span>

        <div>
          <strong>
            Nenhum item com estoque baixo
          </strong>

          <span>
            Alertas do Barracão aparecerão aqui quando houver itens abaixo do estoque mínimo.
          </span>
        </div>
      </div>
    `}function Gh(t){const e=new Date(t);if(Number.isNaN(e.getTime()))return"";const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),a.getDate(),12),n=new Date(e.getFullYear(),e.getMonth(),e.getDate(),12),s=Math.round((r.getTime()-n.getTime())/(1440*60*1e3));return s===0?"Hoje":s===1?"Ontem":s>1&&s<=7?`Há ${s} dias`:ne(t)}function Kh(t){return t.length?`
    <div class="dashboard-activity-list">
      ${t.map(e=>`
            <a
              href="${e.href}"
              class="button button--secondary dashboard-activity"
              data-link
            >
              <span class="dashboard-activity__timeline">
                <span class="dashboard-activity__icon">
                  ${y(e.iconName)}
                </span>
              </span>

              <span class="dashboard-activity__content">
                <span class="dashboard-activity__header">
                  <strong>
                    ${h(e.title)}
                  </strong>

                  <small>
                    ${h(Gh(e.occurredAt))}
                  </small>
                </span>

                ${e.detail?`
                      <span>
                        ${h(e.detail)}
                      </span>
                    `:""}
              </span>

              ${y("chevronRight")}
            </a>
          `).join("")}
    </div>
  `:`
      <div class="dashboard-empty-inline dashboard-empty-inline--wide">
        <span class="dashboard-empty-inline__icon">
          ${y("clipboard")}
        </span>

        <div>
          <strong>
            Ainda não há atividades recentes
          </strong>

          <span>
            Eventos dos plantios e, futuramente, colheitas aparecerão nesta linha do tempo.
          </span>
        </div>
      </div>
    `}function Jh(t){return`
    <a
      href="/properties"
      class="button button--secondary dashboard-quick-action"
      data-link
    >
      <span>
        ${y("map")}
      </span>

      <strong>Propriedades</strong>
      <small>
        ${t.properties_count} ativas
      </small>
    </a>

    <a
      href="/plantings/new"
      class="button button--secondary dashboard-quick-action"
      data-link
    >
      <span>
        ${y("plus")}
      </span>

      <strong>Novo plantio</strong>
      <small>Registrar ciclo</small>
    </a>

    <a
      href="/more/crops"
      class="button button--secondary dashboard-quick-action"
      data-link
    >
      <span>
        ${y("leaf")}
      </span>

      <strong>Culturas</strong>
      <small>Catálogo produtivo</small>
    </a>

    <a
      href="/inventory"
      class="button button--secondary dashboard-quick-action"
      data-link
    >
      <span>
        ${y("box")}
      </span>

      <strong>Barracão</strong>
      <small>
        ${t.low_stock_count} alertas
      </small>
    </a>
  `}async function Qh({session:t}){const e=document.querySelector("#app"),a=Fh(t);e.innerHTML=O({session:t,title:`Olá, ${a}`,eyebrow:"Meu Agro",activeNav:"home",content:`
        <section class="dashboard-loading-card">
          <span class="dashboard-loading-card__pulse"></span>

          <div>
            <strong>
              Atualizando sua visão geral…
            </strong>
            <span>
              Consultando propriedades, plantios e alertas.
            </span>
          </div>
        </section>
      `});const[r,n,s,i]=await Promise.allSettled([Ih(),jh(),Dh(),Hh()]),o=r.status==="fulfilled"?r.value:Oh(),c=n.status==="fulfilled"?n.value:[],l=s.status==="fulfilled"?s.value:[],d=i.status==="fulfilled"?i.value:[],u=[r,n,s,i].filter(m=>m.status==="rejected");r.status==="rejected"?(console.error("Erro ao carregar resumo do dashboard:",r.reason),j(K(r.reason),{type:"error"})):u.length>0&&console.warn("Algumas informações complementares do dashboard não puderam ser carregadas.",u);const p=Bh(o);return e.innerHTML=O({session:t,title:`Olá, ${a}`,eyebrow:"Meu Agro",activeNav:"home",content:`
        <section class="dashboard-hero">
          <div class="dashboard-hero__content">
            <p class="dashboard-hero__eyebrow">
              ${h(p.eyebrow)}
            </p>

            <h2>
              ${h(p.title)}
            </h2>

            <p>
              ${h(p.description)}
            </p>

            <a
              href="${p.href}"
              class="button dashboard-hero__button"
              data-link
            >
              ${y(p.iconName)}
              ${h(p.action)}
            </a>
          </div>

          <span class="dashboard-hero__visual">
            ${y("sprout")}
          </span>
        </section>

        <div class="dashboard-section-heading">
          <div>
            <p class="section-eyebrow">
              Visão geral
            </p>
            <h2>Indicadores da produção</h2>
          </div>
        </div>

        <section
          class="dashboard-metrics"
          aria-label="Indicadores da produção"
        >
          ${zh(o)}
        </section>

        <div class="dashboard-section-heading dashboard-section-heading--with-link">
          <div>
            <p class="section-eyebrow">
              Prioridades
            </p>
            <h2>Atenção agora</h2>
          </div>

          <a class="button button--secondary"
            href="/more/harvest-forecast"
            data-link
          >
            Ver previsões
          </a>
        </div>

        <section class="dashboard-attention-grid">
          <article class="dashboard-panel">
            <div class="dashboard-panel__header">
              <div>
                <span class="dashboard-panel__icon dashboard-panel__icon--harvest">
                  ${y("harvest")}
                </span>

                <div>
                  <h3>
                    Próximos da colheita
                  </h3>
                  <p>
                    Janela dos próximos 7 dias
                  </p>
                </div>
              </div>

              <strong class="dashboard-panel__count">
                ${o.near_harvest_count}
              </strong>
            </div>

            ${Vh(c)}
          </article>

          <article class="dashboard-panel">
            <div class="dashboard-panel__header">
              <div>
                <span class="dashboard-panel__icon dashboard-panel__icon--stock">
                  ${y("box")}
                </span>

                <div>
                  <h3>
                    Estoque em atenção
                  </h3>
                  <p>
                    Abaixo do mínimo ou esgotado
                  </p>
                </div>
              </div>

              <strong class="dashboard-panel__count">
                ${o.low_stock_count}
              </strong>
            </div>

            ${Wh(l)}
          </article>
        </section>

        <div class="dashboard-section-heading">
          <div>
            <p class="section-eyebrow">
              Atalhos
            </p>
            <h2>Acesso rápido</h2>
          </div>
        </div>

        <section class="dashboard-quick-actions">
          ${Jh(o)}
        </section>

        <div class="dashboard-section-heading dashboard-section-heading--with-link">
          <div>
            <p class="section-eyebrow">
              Histórico
            </p>
            <h2>Atividades recentes</h2>
          </div>

          <a class="button button--secondary"
            href="/plantings"
            data-link
          >
            Ver plantios
          </a>
        </div>

        <section class="dashboard-panel dashboard-panel--activity">
          ${Kh(d)}
        </section>
      `}),null}function B({iconName:t,title:e,description:a,actionLabel:r,actionHref:n}){return`
    <section class="empty-state">
      <div class="empty-state__icon">
        ${y(t)}
      </div>

      <h2>${e}</h2>
      <p>${a}</p>

      ${r&&n?`
            <a
              href="${n}"
              class="button button--primary"
              data-link
            >
              ${y("plus")}
              ${r}
            </a>
          `:""}
    </section>
  `}function ce({label:t="Carregando…"}={}){return`
    <div
      class="page-loader"
      role="status"
      aria-live="polite"
    >
      <span class="page-loader__spinner"></span>
      <span>${t}</span>
    </div>
  `}const Yh=[["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"]],xo=[["hectare","Hectare (ha)"],["alqueire_paulista","Alqueire paulista"],["alqueire_mineiro","Alqueire mineiro"],["alqueire_baiano","Alqueire baiano"],["metro_quadrado","Metro quadrado (m²)"],["quilometro_quadrado","Quilômetro quadrado (km²)"],["outro","Outra unidade"]];function Zh(t){var e;return((e=xo.find(([a])=>a===t))==null?void 0:e[1])||t||""}function Pn(t){const e=[t.city,t.state].filter(Boolean);return e.length?e.join(" - "):"Localização não informada"}function No(t){if(t.total_area===null||t.total_area===void 0)return null;const e=Zh(t.area_unit);return`${ae(t.total_area)}${e?` • ${e}`:""}`}function Xh(t,{archived:e=!1}={}){const a=No(t);return`
    <article class="property-card">
      <a
        href="/properties/${t.id}"
        class="property-card__main"
        data-link
        style="
          display: block;
          color: inherit;
          text-decoration: none;
        "
      >
        <div class="property-card__top">
          <div class="property-card__title">
            <h3>
              ${h(t.name)}
            </h3>

            <p class="property-card__location">
              ${y("location")}
              ${h(Pn(t))}
            </p>
          </div>

          <span class="property-card__chevron">
            ${y("chevronRight")}
          </span>
        </div>

        ${t.description?`
              <p class="property-card__description">
                ${h(t.description)}
              </p>
            `:""}

        <div class="property-card__meta">
          ${a?`
                <span class="property-chip">
                  ${y("ruler")}
                  ${h(a)}
                </span>
              `:""}

          <span class="property-chip">
            ${e?"Arquivada":"Ativa"}
          </span>
        </div>
      </a>

      ${e?`
            <div class="property-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-property"
                data-property-id="${t.id}"
              >
                ${y("refresh")}
                Restaurar
              </button>
            </div>
          `:""}
    </article>
  `}const $t=`
  id,
  user_id,
  name,
  description,
  city,
  state,
  total_area,
  area_unit,
  notes,
  image_url,
  status,
  deleted_at,
  created_at,
  updated_at
`;function St(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Io(t){var e,a,r,n,s,i,o;return{name:((e=t.name)==null?void 0:e.trim())||"",description:((a=t.description)==null?void 0:a.trim())||null,city:((r=t.city)==null?void 0:r.trim())||null,state:((s=(n=t.state)==null?void 0:n.trim())==null?void 0:s.toUpperCase())||null,total_area:t.totalArea===""||t.totalArea===null||t.totalArea===void 0?null:Number(t.totalArea),area_unit:((i=t.areaUnit)==null?void 0:i.trim())||null,notes:((o=t.notes)==null?void 0:o.trim())||null}}async function rt(){const t=St(),{data:e,error:a}=await t.from("properties").select($t).is("deleted_at",null).neq("status","archived").order("name",{ascending:!0});if(a)throw a;return e??[]}async function em(){const t=St(),{data:e,error:a}=await t.from("properties").select($t).eq("status","archived").order("updated_at",{ascending:!1});if(a)throw a;return e??[]}async function Oa(t){const e=St(),{data:a,error:r}=await e.from("properties").select($t).eq("id",t).maybeSingle();if(r)throw r;return a}async function tm(t){const e=St(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=Io(t),{data:n,error:s}=await e.from("properties").insert({...r,user_id:a.id,status:"active"}).select($t).single();if(s)throw s;return n}async function am(t,e){const a=St(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const n=Io(e),{data:s,error:i}=await a.from("properties").update(n).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select($t).single();if(i)throw i;return s}async function rm(t){const e=St(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=new Date().toISOString(),{data:n,error:s}=await e.from("properties").update({status:"archived",deleted_at:r}).eq("id",t).eq("user_id",a.id).select($t).single();if(s)throw s;return n}async function Oo(t){const e=St(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("properties").update({status:"active",deleted_at:null}).eq("id",t).eq("user_id",a.id).select($t).single();if(n)throw n;return r}async function nm({session:t}){const e=document.querySelector("#app");e.innerHTML=O({session:t,title:"Propriedades",eyebrow:"Gestão rural",activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Propriedades
            </p>

            <h2>
              Seus sítios e fazendas
            </h2>

            <p>
              Cadastre cada propriedade para depois organizar suas áreas, plantios e safras.
            </p>
          </div>

          <a
            href="/properties/new"
            class="icon-button"
            aria-label="Cadastrar propriedade"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <div class="property-toolbar">
          <div
            class="segmented-control"
            role="tablist"
            aria-label="Filtro de propriedades"
          >
            <button
              id="filter-active"
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              role="tab"
              aria-selected="true"
              data-filter="active"
            >
              Ativas
            </button>

            <button
              id="filter-archived"
              class="segmented-control__button"
              type="button"
              role="tab"
              aria-selected="false"
              data-filter="archived"
            >
              Arquivadas
            </button>
          </div>

          <a
            href="/properties/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova
          </a>
        </div>

        <div id="properties-content">
          ${ce({label:"Carregando propriedades…"})}
        </div>
      `});const a=document.querySelector("#properties-content"),r=[...document.querySelectorAll("[data-filter]")];let n="active",s=!1;async function i(){a.innerHTML=ce({label:n==="active"?"Carregando propriedades…":"Carregando arquivadas…"});try{const d=n==="active"?await rt():await em();if(s)return;if(!d.length){a.innerHTML=B(n==="active"?{iconName:"map",title:"Cadastre sua primeira propriedade",description:"A partir dela você poderá criar talhões, hortas, piquetes e outros tipos de área.",actionLabel:"Cadastrar propriedade",actionHref:"/properties/new"}:{iconName:"archive",title:"Nenhuma propriedade arquivada",description:"Quando uma propriedade for arquivada, ela aparecerá aqui e poderá ser restaurada."});return}a.innerHTML=`
        <section class="property-list">
          ${d.map(u=>Xh(u,{archived:n==="archived"})).join("")}
        </section>
      `}catch(d){console.error("Erro ao listar propriedades:",d),a.innerHTML=B({iconName:"map",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(Oe(d),{type:"error"})}}function o(d){n=d;for(const u of r){const p=u.dataset.filter===d;u.classList.toggle("segmented-control__button--active",p),u.setAttribute("aria-selected",String(p))}i()}const c=d=>{const u=d.target.closest("[data-filter]");u&&o(u.dataset.filter)},l=async d=>{const u=d.target.closest('[data-action="restore-property"]');if(!u)return;d.preventDefault(),d.stopPropagation();const p=u.dataset.propertyId;if(await ie({title:"Restaurar propriedade?",message:"Ela voltará a aparecer entre as propriedades ativas.",confirmLabel:"Restaurar"})){u.disabled=!0;try{await Oo(p),j("Propriedade restaurada.",{type:"success"}),await i()}catch(f){console.error("Erro ao restaurar propriedade:",f),j(Oe(f),{type:"error"}),u.disabled=!1}}};return document.addEventListener("click",c),document.addEventListener("click",l),await i(),()=>{s=!0,document.removeEventListener("click",c),document.removeEventListener("click",l)}}function sm(t){return`
    <option value="">
      Selecione
    </option>

    ${Yh.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${e} - ${a}
          </option>
        `).join("")}
  `}function im(t){return`
    <option value="">
      Selecione
    </option>

    ${xo.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function om(t){const e=String(t||"").trim().replace(",",".");return e?Number(e):""}function cm(t){return t.name?t.name.length<2?"O nome deve possuir pelo menos 2 caracteres.":t.totalArea!==""&&(!Number.isFinite(t.totalArea)||t.totalArea<0)?"Informe uma área total válida.":t.totalArea!==""&&!t.areaUnit?"Selecione a unidade da área total.":null:"Informe o nome da propriedade."}async function jo({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null;if(n){try{s=await Oa(e.id)}catch(u){console.error("Erro ao carregar propriedade:",u)}if(!s||s.deleted_at)return r.innerHTML=O({session:t,title:"Propriedade",eyebrow:"Gestão rural",activeNav:"properties",content:`
            <section class="empty-state">
              <h2>
                Propriedade não encontrada
              </h2>

              <p>
                Ela pode ter sido arquivada ou não pertencer à sua conta.
              </p>

              <a
                href="/properties"
                class="button button--primary"
                data-link
              >
                Voltar
              </a>
            </section>
          `}),null}const i=n?"Editar propriedade":"Nova propriedade";r.innerHTML=O({session:t,title:i,eyebrow:"Propriedades",activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              ${n?"Edição":"Cadastro"}
            </p>

            <h2>${i}</h2>

            <p>
              ${n?"Atualize os dados principais da propriedade.":"Comece pelos dados gerais. Depois criaremos as áreas dentro dela."}
            </p>
          </div>

          <a
            href="${n?`/properties/${s.id}`:"/properties"}"
            class="icon-button"
            aria-label="Voltar"
            data-link
          >
            ${y("arrowLeft")}
          </a>
        </section>

        <div
          id="property-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="property-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Como você reconhece esta propriedade no dia a dia?
              </p>
            </div>

            <div class="field">
              <label for="property-name">
                Nome *
              </label>

              <input
                id="property-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                autocomplete="organization"
                placeholder="Ex.: Sítio Boa Esperança"
                value="${h((s==null?void 0:s.name)||"")}"
                required
              />
            </div>

            <div class="field">
              <label for="property-description">
                Descrição
              </label>

              <textarea
                id="property-description"
                name="description"
                maxlength="600"
                placeholder="Uma breve descrição da propriedade."
              >${h((s==null?void 0:s.description)||"")}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Localização</h2>
              <p>
                Município e estado ajudam a identificar rapidamente a propriedade.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="property-city">
                  Município
                </label>

                <input
                  id="property-city"
                  name="city"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: Ribeirão Preto"
                  value="${h((s==null?void 0:s.city)||"")}"
                />
              </div>

              <div class="field">
                <label for="property-state">
                  Estado
                </label>

                <select
                  id="property-state"
                  name="state"
                >
                  ${sm((s==null?void 0:s.state)||"")}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Área</h2>
              <p>
                Informe a área total e a unidade utilizada.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="property-total-area">
                  Área total
                </label>

                <input
                  id="property-total-area"
                  name="totalArea"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 12.5"
                  value="${(s==null?void 0:s.total_area)??""}"
                />
              </div>

              <div class="field">
                <label for="property-area-unit">
                  Unidade
                </label>

                <select
                  id="property-area-unit"
                  name="areaUnit"
                >
                  ${im((s==null?void 0:s.area_unit)||"")}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Informações adicionais que sejam úteis para você.
              </p>
            </div>

            <div class="field">
              <label for="property-notes">
                Observações
              </label>

              <textarea
                id="property-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: acesso pela estrada municipal, possui poço artesiano..."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/properties/${s.id}`:"/properties"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="property-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar propriedade"}
            </button>
          </div>
        </form>
      `});const o=document.querySelector("#property-form"),c=document.querySelector("#property-form-feedback"),l=document.querySelector("#property-submit"),d=async u=>{u.preventDefault(),D(c,"");const p=new FormData(o),m={name:String(p.get("name")||"").trim(),description:String(p.get("description")||"").trim(),city:String(p.get("city")||"").trim(),state:String(p.get("state")||"").trim(),totalArea:om(p.get("totalArea")),areaUnit:String(p.get("areaUnit")||"").trim(),notes:String(p.get("notes")||"").trim()},f=cm(m);if(f){D(c,f),c.scrollIntoView({behavior:"smooth",block:"center"});return}te(l,!0,n?"Salvando…":"Cadastrando…");try{const v=n?await am(s.id,m):await tm(m);j(n?"Propriedade atualizada.":"Propriedade cadastrada.",{type:"success"}),Q(`/properties/${v.id}`,{replace:!0})}catch(v){console.error("Erro ao salvar propriedade:",v),D(c,Oe(v)),c.scrollIntoView({behavior:"smooth",block:"center"})}finally{te(l,!1)}};return o.addEventListener("submit",d),()=>{o.removeEventListener("submit",d)}}const Zt=`
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
`;function nt(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Do(t){var e,a,r,n,s;return{area_type_id:t.areaTypeId||null,name:((e=t.name)==null?void 0:e.trim())||"",size:t.size===""||t.size===null||t.size===void 0?null:Number(t.size),unit:((a=t.unit)==null?void 0:a.trim())||null,description:((r=t.description)==null?void 0:r.trim())||null,location_description:((n=t.locationDescription)==null?void 0:n.trim())||null,notes:((s=t.notes)==null?void 0:s.trim())||null}}async function lm(){const t=nt(),{data:e,error:a}=await t.from("area_types").select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).order("is_system",{ascending:!1}).order("name",{ascending:!0});if(a)throw a;return e??[]}async function dm({name:t,description:e}){const a=nt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("area_types").insert({user_id:r.id,name:t.trim(),description:(e==null?void 0:e.trim())||null,is_system:!1}).select(`
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `).single();if(s)throw s;return n}async function Gn(t,{archived:e=!1,limit:a=null}={}){let n=nt().from("areas").select(Zt).eq("property_id",t);e?n=n.eq("status","archived"):n=n.is("deleted_at",null).neq("status","archived"),n=n.order("name",{ascending:!0}),Number.isInteger(a)&&a>0&&(n=n.limit(a));const{data:s,error:i}=await n;if(i)throw i;return s??[]}async function um(t=null){let a=nt().from("areas").select("id",{count:"exact",head:!0}).is("deleted_at",null).neq("status","archived");t&&(a=a.eq("property_id",t));const{count:r,error:n}=await a;if(n)throw n;return r??0}async function Mo(t){const e=nt(),{data:a,error:r}=await e.from("areas").select(Zt).eq("id",t).maybeSingle();if(r)throw r;return a}async function pm(t,e){const a=nt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const n=Do(e),{data:s,error:i}=await a.from("areas").insert({...n,user_id:r.id,property_id:t,status:"active"}).select(Zt).single();if(i)throw i;return s}async function hm(t,e){const a=nt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const n=Do(e),{data:s,error:i}=await a.from("areas").update(n).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Zt).single();if(i)throw i;return s}async function mm(t){const e=nt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("areas").update({status:"archived",deleted_at:new Date().toISOString()}).eq("id",t).eq("user_id",a.id).select(Zt).single();if(n)throw n;return r}async function Uo(t){const e=nt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("areas").update({status:"active",deleted_at:null}).eq("id",t).eq("user_id",a.id).select(Zt).single();if(n)throw n;return r}const Et=`
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
`;function dt(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Ho(t){var e,a;return{property_id:t.propertyId,name:((e=t.name)==null?void 0:e.trim())||"",start_date:t.startDate||null,end_date:t.endDate||null,description:((a=t.description)==null?void 0:a.trim())||null,status:t.status||"planned"}}async function Fo({propertyId:t=null,status:e=null,archived:a=!1}={}){let n=dt().from("seasons").select(Et);a?n=n.not("deleted_at","is",null):n=n.is("deleted_at",null),t&&(n=n.eq("property_id",t)),e&&(n=n.eq("status",e)),n=n.order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1});const{data:s,error:i}=await n;if(i)throw i;return s??[]}async function Bo(t){const e=dt(),{data:a,error:r}=await e.from("seasons").select(Et).eq("id",t).maybeSingle();if(r)throw r;return a}async function fm(t){const e=dt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=Ho(t),{data:n,error:s}=await e.from("seasons").insert({...r,user_id:a.id}).select(Et).single();if(s)throw s;return n}async function vm(t,e){const a=dt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const n=Ho(e),{data:s,error:i}=await a.from("seasons").update(n).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Et).single();if(i)throw i;return s}async function gm(t){const e=dt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("seasons").update({deleted_at:new Date().toISOString()}).eq("id",t).eq("user_id",a.id).select(Et).single();if(n)throw n;return r}async function zo(t){const e=dt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("seasons").update({deleted_at:null}).eq("id",t).eq("user_id",a.id).select(Et).single();if(n)throw n;return r}async function ym(t=null){let a=dt().from("seasons").select("id",{count:"exact",head:!0}).is("deleted_at",null).in("status",["planned","active"]);t&&(a=a.eq("property_id",t));const{count:r,error:n}=await a;if(n)throw n;return r??0}async function _m(t,e=3){const a=dt(),{data:r,error:n}=await a.from("seasons").select(Et).eq("property_id",t).is("deleted_at",null).order("start_date",{ascending:!1,nullsFirst:!1}).order("created_at",{ascending:!1}).limit(e);if(n)throw n;return r??[]}const Dr=[["planned","Planejada"],["active","Em andamento"],["closed","Encerrada"],["cancelled","Cancelada"]];function wr(t){var e;return((e=Dr.find(([a])=>a===t))==null?void 0:e[1])||t||"Não informado"}function Vo(t){switch(t){case"active":return"season-status--active";case"closed":return"season-status--closed";case"cancelled":return"season-status--cancelled";case"planned":default:return"season-status--planned"}}const Wo=[["hectare","Hectare (ha)"],["alqueire_paulista","Alqueire paulista"],["alqueire_mineiro","Alqueire mineiro"],["alqueire_baiano","Alqueire baiano"],["metro_quadrado","Metro quadrado (m²)"],["quilometro_quadrado","Quilômetro quadrado (km²)"],["metro_linear","Metro linear (m)"],["unidade","Unidade"],["outro","Outra unidade"]];function bm(t){var e;return((e=Wo.find(([a])=>a===t))==null?void 0:e[1])||t||""}function $r(t){var e;return((e=t.area_type)==null?void 0:e.name)||"Sem tipo"}function Go(t){if(t.size===null||t.size===void 0)return null;const e=bm(t.unit);return`${ae(t.size)}${e?` • ${e}`:""}`}function wm(t,{propertyId:e,archived:a=!1}){const r=Go(t);return`
    <article class="area-card">
      <a
        href="/properties/${e}/areas/${t.id}"
        class="area-card__main"
        data-link
      >
        <div class="area-card__top">
          <span class="area-type-icon">
            ${y("layers")}
          </span>

          <div class="area-card__identity">
            <h3>
              ${h(t.name)}
            </h3>

            <p>
              ${h($r(t))}
            </p>
          </div>

          <span class="area-card__arrow">
            ${y("chevronRight")}
          </span>
        </div>

        ${t.description?`
              <p class="area-card__description">
                ${h(t.description)}
              </p>
            `:""}

        <div class="area-card__meta">
          ${r?`
                <span class="property-chip">
                  ${y("ruler")}
                  ${h(r)}
                </span>
              `:""}

          ${t.location_description?`
                <span class="property-chip">
                  ${y("location")}
                  ${h(t.location_description)}
                </span>
              `:""}

          <span class="property-chip">
            ${a?"Arquivada":"Ativa"}
          </span>
        </div>
      </a>

      ${a?`
            <div class="property-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-area"
                data-area-id="${t.id}"
              >
                ${y("refresh")}
                Restaurar
              </button>
            </div>
          `:""}
    </article>
  `}async function $m({session:t,params:e}){const a=document.querySelector("#app");let r;try{r=await Oa(e.id)}catch(f){console.error("Erro ao carregar propriedade:",f)}if(!r)return a.innerHTML=O({session:t,title:"Propriedade",eyebrow:"Gestão rural",activeNav:"properties",content:`
          <section class="empty-state">
            <h2>
              Propriedade não encontrada
            </h2>

            <p>
              Este registro não existe ou não pertence à sua conta.
            </p>

            <a
              href="/properties"
              class="button button--primary"
              data-link
            >
              Voltar para propriedades
            </a>
          </section>
        `}),null;const n=r.status==="archived"||!!r.deleted_at,s=No(r);let i=[],o=0,c=[],l=0;if(!n)try{[i,o,c,l]=await Promise.all([Gn(r.id,{limit:3}),um(r.id),_m(r.id,3),ym(r.id)])}catch(f){console.error("Erro ao carregar áreas da propriedade:",f)}a.innerHTML=O({session:t,title:"Propriedade",eyebrow:"Gestão rural",activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <a
              href="/properties"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>
          </div>
        </section>

        <section class="property-detail-hero">
          <div class="property-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${n?"Propriedade arquivada":"Propriedade ativa"}
              </p>

              <h2>
                ${h(r.name)}
              </h2>

              <p>
                ${h(Pn(r))}
              </p>
            </div>

            <span
              class="
                property-status
                ${n?"property-status--archived":"property-status--active"}
              "
            >
              ${n?"Arquivada":"Ativa"}
            </span>
          </div>

          ${n?`
                <div class="property-detail-actions">
                  <button
                    id="restore-property"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("refresh")}
                    Restaurar propriedade
                  </button>
                </div>
              `:`
                <div class="property-detail-actions">
                  <a
                    href="/properties/${r.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>

                  <button
                    id="archive-property"
                    class="button button--danger"
                    type="button"
                  >
                    ${y("archive")}
                    Arquivar
                  </button>
                </div>
              `}
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Localização
            </p>

            <p class="detail-card__value">
              ${h(Pn(r))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Área total
            </p>

            <p class="detail-card__value">
              ${h(s||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Áreas cadastradas
            </p>

            <p class="detail-card__value">
              ${n?"-":o}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Safras em aberto
            </p>

            <p class="detail-card__value">
              ${n?"-":l}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.description||"Nenhuma descrição informada.")}
          </p>
        </article>

        <article
          class="detail-card"
          style="margin-top: 12px;"
        >
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        ${n?"":`
              <section class="property-areas-summary">
                <div class="property-areas-summary__header">
                  <div>
                    <h2>
                      Áreas da propriedade
                    </h2>

                    <p>
                      ${o} ${o===1?"área ativa":"áreas ativas"}
                    </p>
                  </div>

                  <a
                    href="/properties/${r.id}/areas/new"
                    class="icon-button"
                    aria-label="Cadastrar área"
                    data-link
                  >
                    ${y("plus")}
                  </a>
                </div>

                ${i.length?`
                      <div class="area-preview-list">
                        ${i.map(f=>`
                              <a
                                href="/properties/${r.id}/areas/${f.id}"
                                class="button button--secondary area-preview"
                                data-link
                              >
                                <span class="area-preview__icon">
                                  ${y("layers")}
                                </span>

                                <span class="area-preview__content">
                                  <strong>
                                    ${h(f.name)}
                                  </strong>

                                  <span>
                                    ${h($r(f))}
                                  </span>
                                </span>

                                ${y("chevronRight")}
                              </a>
                            `).join("")}
                      </div>
                    `:`
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${y("layers")}
                        </div>

                        <h2>
                          Nenhuma área cadastrada
                        </h2>

                        <p>
                          Comece criando um talhão, horta, piquete ou outro espaço desta propriedade.
                        </p>

                        <a
                          href="/properties/${r.id}/areas/new"
                          class="button button--primary"
                          data-link
                        >
                          ${y("plus")}
                          Cadastrar área
                        </a>
                      </div>
                    `}

                ${o>0?`
                      <a
                        href="/properties/${r.id}/areas"
                        class="button button--secondary button--full"
                        style="margin-top: 14px;"
                        data-link
                      >
                        Gerenciar todas as áreas
                      </a>
                    `:""}
              </section>

              <section class="property-seasons-summary">
                <div class="property-seasons-summary__header">
                  <div>
                    <h2>
                      Safras
                    </h2>

                    <p>
                      ${l} ${l===1?"safra em aberto":"safras em aberto"}
                    </p>
                  </div>

                  <a
                    href="/more/seasons/new?property=${r.id}"
                    class="icon-button"
                    aria-label="Cadastrar safra"
                    data-link
                  >
                    ${y("plus")}
                  </a>
                </div>

                ${c.length?`
                      <div class="season-preview-list">
                        ${c.map(f=>`
                              <a
                                href="/more/seasons/${f.id}"
                                class="button button--secondary season-preview"
                                data-link
                              >
                                <span class="season-preview__icon">
                                  ${y("calendar")}
                                </span>

                                <span class="season-preview__content">
                                  <strong>
                                    ${h(f.name)}
                                  </strong>

                                  <span>
                                    ${h(wr(f.status))}
                                  </span>
                                </span>

                                ${y("chevronRight")}
                              </a>
                            `).join("")}
                      </div>
                    `:`
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${y("calendar")}
                        </div>

                        <h2>
                          Nenhuma safra cadastrada
                        </h2>

                        <p>
                          Organize os próximos ciclos produtivos criando uma safra para esta propriedade.
                        </p>

                        <a
                          href="/more/seasons/new?property=${r.id}"
                          class="button button--primary"
                          data-link
                        >
                          ${y("plus")}
                          Cadastrar safra
                        </a>
                      </div>
                    `}

                ${c.length?`
                      <a
                        href="/more/seasons?property=${r.id}"
                        class="button button--secondary button--full"
                        style="margin-top: 14px;"
                        data-link
                      >
                        Gerenciar safras
                      </a>
                    `:""}
              </section>
            `}
      `});const d=document.querySelector("#archive-property"),u=document.querySelector("#restore-property"),p=async()=>{if(await ie({title:"Arquivar propriedade?",message:"Ela deixará de aparecer entre as propriedades ativas, mas o histórico será preservado.",confirmLabel:"Arquivar",danger:!0})){d.disabled=!0;try{await rm(r.id),j("Propriedade arquivada.",{type:"success"}),Q("/properties",{replace:!0})}catch(v){console.error("Erro ao arquivar:",v),j(Oe(v),{type:"error"}),d.disabled=!1}}},m=async()=>{if(await ie({title:"Restaurar propriedade?",message:"Ela voltará a ficar disponível entre as propriedades ativas.",confirmLabel:"Restaurar"})){u.disabled=!0;try{await Oo(r.id),j("Propriedade restaurada.",{type:"success"}),Q(`/properties/${r.id}`,{replace:!0})}catch(v){console.error("Erro ao restaurar:",v),j(Oe(v),{type:"error"}),u.disabled=!1}}};return d==null||d.addEventListener("click",p),u==null||u.addEventListener("click",m),()=>{d==null||d.removeEventListener("click",p),u==null||u.removeEventListener("click",m)}}async function Sm({session:t,params:e}){const a=document.querySelector("#app");let r=null;try{r=await Oa(e.propertyId)}catch(u){console.error("Erro ao carregar propriedade:",u)}if(!r||r.deleted_at)return a.innerHTML=O({session:t,title:"Áreas",eyebrow:"Propriedades",activeNav:"properties",content:`
          ${B({iconName:"map",title:"Propriedade não encontrada",description:"A propriedade pode ter sido arquivada ou não pertencer à sua conta.",actionLabel:"Voltar para propriedades",actionHref:"/properties"})}
        `}),null;a.innerHTML=O({session:t,title:"Áreas",eyebrow:h(r.name),activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <a
              href="/properties/${r.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Propriedade
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Áreas da propriedade
            </h2>

            <p>
              Talhões, hortas, piquetes e outros espaços ficam organizados sob a mesma entidade Área.
            </p>
          </div>

          <a
            href="/properties/${r.id}/areas/new"
            class="icon-button"
            aria-label="Cadastrar área"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <div class="property-toolbar">
          <div
            class="segmented-control"
            role="tablist"
            aria-label="Filtro de áreas"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-area-filter="active"
              aria-selected="true"
            >
              Ativas
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-area-filter="archived"
              aria-selected="false"
            >
              Arquivadas
            </button>
          </div>

          <a
            href="/properties/${r.id}/areas/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova área
          </a>
        </div>

        <div id="areas-content">
          ${ce({label:"Carregando áreas…"})}
        </div>
      `});const n=document.querySelector("#areas-content"),s=[...document.querySelectorAll("[data-area-filter]")];let i="active",o=!1;async function c(){n.innerHTML=ce({label:i==="active"?"Carregando áreas…":"Carregando áreas arquivadas…"});try{const u=await Gn(r.id,{archived:i==="archived"});if(o)return;if(!u.length){n.innerHTML=B(i==="active"?{iconName:"layers",title:"Cadastre a primeira área",description:"Crie um talhão, horta, piquete, pomar, estufa ou outro espaço da propriedade.",actionLabel:"Cadastrar área",actionHref:`/properties/${r.id}/areas/new`}:{iconName:"archive",title:"Nenhuma área arquivada",description:"Áreas arquivadas continuarão preservadas e aparecerão aqui."});return}n.innerHTML=`
        <section class="area-list">
          ${u.map(p=>wm(p,{propertyId:r.id,archived:i==="archived"})).join("")}
        </section>
      `}catch(u){console.error("Erro ao listar áreas:",u),n.innerHTML=B({iconName:"layers",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(u),{type:"error"})}}const l=u=>{const p=u.target.closest("[data-area-filter]");if(p){i=p.dataset.areaFilter;for(const m of s){const f=m===p;m.classList.toggle("segmented-control__button--active",f),m.setAttribute("aria-selected",String(f))}c()}},d=async u=>{const p=u.target.closest('[data-action="restore-area"]');if(!(!p||(u.preventDefault(),u.stopPropagation(),!await ie({title:"Restaurar área?",message:"Ela voltará a aparecer entre as áreas ativas desta propriedade.",confirmLabel:"Restaurar"})))){p.disabled=!0;try{await Uo(p.dataset.areaId),j("Área restaurada.",{type:"success"}),await c()}catch(f){console.error("Erro ao restaurar área:",f),j(K(f),{type:"error"}),p.disabled=!1}}};return document.addEventListener("click",l),document.addEventListener("click",d),await c(),()=>{o=!0,document.removeEventListener("click",l),document.removeEventListener("click",d)}}function Em(){return new Promise(t=>{const e=document.querySelector("#modal-root");if(!e){t(null);return}e.innerHTML=`
        <div
          class="modal-backdrop"
          role="presentation"
        >
          <section
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-type-modal-title"
          >
            <h2
              id="area-type-modal-title"
            >
              Novo tipo de área
            </h2>

            <p>
              Crie um tipo personalizado para usar nas suas propriedades.
            </p>

            <form
              id="area-type-form"
              class="modal-form"
              novalidate
            >
              <div class="field">
                <label
                  for="area-type-name"
                >
                  Nome *
                </label>

                <input
                  id="area-type-name"
                  name="name"
                  type="text"
                  minlength="2"
                  maxlength="80"
                  placeholder="Ex.: Viveiro"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="area-type-description"
                >
                  Descrição
                </label>

                <textarea
                  id="area-type-description"
                  name="description"
                  maxlength="300"
                  placeholder="Ex.: Área destinada à produção de mudas."
                ></textarea>
              </div>

              <div
                id="area-type-feedback"
                class="form-message"
                hidden
              ></div>

              <div class="modal-actions">
                <button
                  id="area-type-cancel"
                  class="button button--secondary"
                  type="button"
                >
                  Cancelar
                </button>

                <button
                  class="button button--primary"
                  type="submit"
                >
                  Criar tipo
                </button>
              </div>
            </form>
          </section>
        </div>
      `;const a=e.querySelector(".modal-backdrop"),r=e.querySelector("#area-type-form"),n=e.querySelector("#area-type-cancel"),s=e.querySelector("#area-type-name");let i=!1;const o=d=>{i||(i=!0,document.removeEventListener("keydown",c),e.innerHTML="",t(d))},c=d=>{d.key==="Escape"&&o(null)},l=d=>{d.preventDefault();const u=new FormData(r),p=String(u.get("name")||"").trim(),m=String(u.get("description")||"").trim();if(p.length<2){const f=e.querySelector("#area-type-feedback");f.hidden=!1,f.className="form-message form-message--error",f.textContent="Informe um nome com pelo menos 2 caracteres.";return}o({name:(h(p),p),description:m})};n.addEventListener("click",()=>o(null),{once:!0}),a.addEventListener("click",d=>{d.target===a&&o(null)}),r.addEventListener("submit",l),document.addEventListener("keydown",c),s.focus()})}function km(t){return`
    <option value="">
      Selecione
    </option>

    ${Wo.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Ei(t,e){const a=t.filter(s=>s.is_system),r=t.filter(s=>!s.is_system),n=s=>s.map(i=>`
            <option
              value="${i.id}"
              ${e===i.id?"selected":""}
            >
              ${h(i.name)}
            </option>
          `).join("");return`
    <option value="">
      Selecione
    </option>

    ${a.length?`
          <optgroup label="Tipos do Meu Agro">
            ${n(a)}
          </optgroup>
        `:""}

    ${r.length?`
          <optgroup label="Meus tipos">
            ${n(r)}
          </optgroup>
        `:""}
  `}function Am(t){const e=String(t||"").trim().replace(",",".");return e?Number(e):""}function Cm(t){return t.name.length<2?"Informe um nome com pelo menos 2 caracteres.":t.areaTypeId?t.size!==""&&(!Number.isFinite(t.size)||t.size<0)?"Informe um tamanho válido.":t.size!==""&&!t.unit?"Selecione a unidade do tamanho.":null:"Selecione o tipo da área."}async function ki({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null;try{s=await Oa(e.propertyId)}catch(S){console.error("Erro ao carregar propriedade:",S)}if(!s||s.deleted_at)return r.innerHTML=O({session:t,title:"Área",eyebrow:"Propriedades",activeNav:"properties",content:`
          <section class="empty-state">
            <h2>
              Propriedade não encontrada
            </h2>

            <p>
              Não é possível cadastrar áreas nesta propriedade.
            </p>

            <a
              href="/properties"
              class="button button--primary"
              data-link
            >
              Voltar
            </a>
          </section>
        `}),null;let i=null;if(n){try{i=await Mo(e.areaId)}catch(S){console.error("Erro ao carregar área:",S)}if(!i||i.property_id!==s.id||i.deleted_at)return r.innerHTML=O({session:t,title:"Área",eyebrow:h(s.name),activeNav:"properties",content:`
            <section class="empty-state">
              <h2>
                Área não encontrada
              </h2>

              <p>
                Ela pode ter sido arquivada ou não pertencer a esta propriedade.
              </p>

              <a
                href="/properties/${s.id}/areas"
                class="button button--primary"
                data-link
              >
                Voltar para áreas
              </a>
            </section>
          `}),null}let o=[];try{o=await lm()}catch(S){console.error("Erro ao carregar tipos:",S)}const c=n?"Editar área":"Nova área";r.innerHTML=O({session:t,title:c,eyebrow:h(s.name),activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/properties/${s.id}/areas/${i.id}`:`/properties/${s.id}/areas`}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${c}
            </h2>

            <p>
              Cadastre qualquer espaço produtivo ou de manejo usando a entidade genérica Área.
            </p>
          </div>
        </section>

        <div
          id="area-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="area-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Dê um nome fácil de reconhecer e escolha o tipo da área.
              </p>
            </div>

            <div class="field">
              <label
                for="area-name"
              >
                Nome *
              </label>

              <input
                id="area-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Talhão 01"
                value="${h((i==null?void 0:i.name)||"")}"
                required
              />
            </div>

            <div class="field">
              <div class="field__label-row">
                <label
                  for="area-type"
                >
                  Tipo *
                </label>

                <button
                  id="create-area-type"
                  class="button button--secondary button--compact"
                  type="button"
                >
                  + Novo tipo
                </button>
              </div>

              <select
                id="area-type"
                name="areaTypeId"
                required
              >
                ${Ei(o,(i==null?void 0:i.area_type_id)||"")}
              </select>

              <small
                id="area-type-description"
                class="field__hint"
              ></small>
            </div>

            <div class="field">
              <label
                for="area-description"
              >
                Descrição
              </label>

              <textarea
                id="area-description"
                name="description"
                maxlength="600"
                placeholder="Ex.: Área utilizada para plantio de milho."
              >${h((i==null?void 0:i.description)||"")}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Tamanho
              </h2>

              <p>
                Informe a dimensão da área quando souber.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="area-size"
                >
                  Tamanho
                </label>

                <input
                  id="area-size"
                  name="size"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 2.5"
                  value="${(i==null?void 0:i.size)??""}"
                />
              </div>

              <div class="field">
                <label
                  for="area-unit"
                >
                  Unidade
                </label>

                <select
                  id="area-unit"
                  name="unit"
                >
                  ${km((i==null?void 0:i.unit)||"")}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Localização interna
              </h2>

              <p>
                Ajude a identificar onde esta área fica dentro da propriedade.
              </p>
            </div>

            <div class="field">
              <label
                for="area-location"
              >
                Localização / referência
              </label>

              <input
                id="area-location"
                name="locationDescription"
                type="text"
                maxlength="240"
                placeholder="Ex.: Após o curral, lado norte"
                value="${h((i==null?void 0:i.location_description)||"")}"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Observações
              </h2>

              <p>
                Registre informações adicionais úteis para o manejo.
              </p>
            </div>

            <div class="field">
              <label
                for="area-notes"
              >
                Observações
              </label>

              <textarea
                id="area-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: solo argiloso, irrigação por gotejamento..."
              >${h((i==null?void 0:i.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/properties/${s.id}/areas/${i.id}`:`/properties/${s.id}/areas`}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="area-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar área"}
            </button>
          </div>
        </form>
      `});const l=document.querySelector("#area-form"),d=document.querySelector("#area-form-feedback"),u=document.querySelector("#area-submit"),p=document.querySelector("#area-type"),m=document.querySelector("#area-type-description"),f=document.querySelector("#create-area-type");function v(){const S=o.find(T=>T.id===p.value);m.textContent=(S==null?void 0:S.description)||(S!=null&&S.is_system?"Tipo padrão do Meu Agro.":S?"Tipo personalizado.":"")}v();const _=()=>{v()},w=async()=>{const S=await Em();if(S){f.disabled=!0;try{const T=await dm(S);o=[...o,T].sort((A,C)=>A.name.localeCompare(C.name,"pt-BR")),p.innerHTML=Ei(o,T.id),p.value=T.id,v(),j("Tipo de área criado.",{type:"success"})}catch(T){console.error("Erro ao criar tipo:",T),j(K(T),{type:"error"})}finally{f.disabled=!1}}},k=async S=>{S.preventDefault(),D(d,"");const T=new FormData(l),A={name:String(T.get("name")||"").trim(),areaTypeId:String(T.get("areaTypeId")||"").trim(),description:String(T.get("description")||"").trim(),size:Am(T.get("size")),unit:String(T.get("unit")||"").trim(),locationDescription:String(T.get("locationDescription")||"").trim(),notes:String(T.get("notes")||"").trim()},C=Cm(A);if(C){D(d,C),d.scrollIntoView({behavior:"smooth",block:"center"});return}te(u,!0,n?"Salvando…":"Cadastrando…");try{const I=n?await hm(i.id,A):await pm(s.id,A);j(n?"Área atualizada.":"Área cadastrada.",{type:"success"}),Q(`/properties/${s.id}/areas/${I.id}`,{replace:!0})}catch(I){console.error("Erro ao salvar área:",I),D(d,K(I)),d.scrollIntoView({behavior:"smooth",block:"center"})}finally{te(u,!1)}};return p.addEventListener("change",_),f.addEventListener("click",w),l.addEventListener("submit",k),()=>{p.removeEventListener("change",_),f.removeEventListener("click",w),l.removeEventListener("submit",k)}}const Mr=[["planned","Planejado"],["planted","Plantado"],["developing","Em desenvolvimento"],["near_harvest","Próximo da colheita"],["ready_to_harvest","Pronto para colher"],["harvested","Colhido"],["closed","Encerrado"],["cancelled","Cancelado"]],Ko=["planned","planted","developing","near_harvest","ready_to_harvest"];function kt(t){var e;return((e=Mr.find(([a])=>a===t))==null?void 0:e[1])||t||"Não informado"}function Jo(t){switch(t){case"planned":return"cycle-status--planned";case"planted":return"cycle-status--planted";case"developing":return"cycle-status--developing";case"near_harvest":return"cycle-status--near-harvest";case"ready_to_harvest":return"cycle-status--ready";case"harvested":return"cycle-status--harvested";case"closed":return"cycle-status--closed";case"cancelled":return"cycle-status--cancelled";default:return"cycle-status--planned"}}var Ai;(function(t){t[t.Sunday=1]="Sunday",t[t.Monday=2]="Monday",t[t.Tuesday=3]="Tuesday",t[t.Wednesday=4]="Wednesday",t[t.Thursday=5]="Thursday",t[t.Friday=6]="Friday",t[t.Saturday=7]="Saturday"})(Ai||(Ai={}));const Ie=wt("LocalNotifications",{web:()=>Or(()=>import("./web-CWvv2NvN.js"),[],import.meta.url).then(t=>new t.LocalNotificationsWeb)}),Kn="harvest-reminders",Qo="ic_stat_meu_agro",Yo="#39705F";function Ur(){return Ee.getPlatform()==="android"}function Fe(){return Ee.isNativePlatform()}function Tm(){return Fe()?Ur()?"Android":Ee.getPlatform():"Navegador"}function Zo(t){const e=String(t||"");let a=2166136261;for(let r=0;r<e.length;r+=1)a^=e.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0)%2147483646+1}async function Xo(){return Fe()?(await Ie.checkPermissions()).display:"web"}async function ec(){return Fe()?Ie.requestPermissions():{display:"web"}}async function Sr(){if(!Fe()||!Ur())return"not_applicable";try{return(await Ie.checkExactNotificationSetting()).exact_alarm}catch(t){return console.warn("Não foi possível consultar alarmes exatos:",t),"unknown"}}async function Lm(){return!Fe()||!Ur()?{exact_alarm:"not_applicable"}:Ie.changeExactNotificationSetting()}async function tc(){!Fe()||!Ur()||await Ie.createChannel({id:Kn,name:"Lembretes de colheita",description:"Avisos diários sobre ciclos próximos da colheita.",importance:4,visibility:1,vibration:!0})}function Rm(t){var e;return((e=t==null?void 0:t.extra)==null?void 0:e.meuAgroType)==="harvest_reminder"}async function Pm(t){var o;if(!Fe())return{native:!1,scheduled:t.length,permission:"web",exactAlarm:"not_applicable",warning:null};const e=await Xo();if(e!=="granted")return{native:!0,scheduled:0,permission:e,exactAlarm:await Sr(),warning:"Permissão de notificações ainda não concedida."};await tc();const a=await Sr(),n=(await Ie.getPending()).notifications.filter(Rm);if(n.length&&await Ie.cancel({notifications:n.map(c=>({id:c.id}))}),!t.length)return{native:!0,scheduled:0,permission:e,exactAlarm:a,warning:null};const s=t.map(c=>{var l;return{title:c.title,body:c.body,id:Zo(c.id),schedule:{at:new Date(c.scheduled_for),allowWhileIdle:!0},smallIcon:Qo,iconColor:Yo,channelId:Kn,autoCancel:!0,isExactNotification:a==="granted",isExactMandatory:!1,extra:{meuAgroType:"harvest_reminder",notificationDbId:c.id,route:((l=c.metadata)==null?void 0:l.route)||(c.production_cycle_id?`/plantings/${c.production_cycle_id}`:"/more/harvest-forecast")}}}).filter(c=>c.schedule.at>new Date);if(!s.length)return{native:!0,scheduled:0,permission:e,exactAlarm:a,warning:null};const i=await Ie.schedule({notifications:s});return{native:!0,scheduled:((o=i.notifications)==null?void 0:o.length)??s.length,permission:e,exactAlarm:a,warning:i.warning||null}}async function qm(){if(!Fe())throw new Error("O teste nativo estará disponível quando o projeto estiver executando dentro do aplicativo Android.");if((await ec()).display!=="granted")throw new Error("A permissão de notificações não foi concedida.");await tc();const e=await Sr();return Ie.schedule({notifications:[{id:Zo(`test-${Date.now()}`),title:"Meu Agro",body:"As notificações de colheita estão funcionando.",schedule:{at:new Date(Date.now()+3e3),allowWhileIdle:!0},smallIcon:Qo,iconColor:Yo,channelId:Kn,autoCancel:!0,isExactNotification:e==="granted",isExactMandatory:!1,extra:{meuAgroType:"test",route:"/more/settings"}}]})}async function xm({onReceived:t,onAction:e}){if(!Fe())return[];const a=[];return a.push(await Ie.addListener("localNotificationReceived",r=>{t==null||t(r)})),a.push(await Ie.addListener("localNotificationActionPerformed",r=>{e==null||e(r)})),a}const Nm={harvest_reminders_enabled:!0,harvest_reminder_hour:8,harvest_reminder_minute:0,harvest_alert_days_before:7,timezone:"America/Sao_Paulo"};function Xt(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Im(t){var e;return{harvest_reminders_enabled:!!t.harvestRemindersEnabled,harvest_reminder_hour:Number(t.harvestReminderHour),harvest_reminder_minute:Number(t.harvestReminderMinute),harvest_alert_days_before:Number(t.harvestAlertDaysBefore),timezone:((e=t.timezone)==null?void 0:e.trim())||"America/Sao_Paulo"}}async function Om(){const t=Xt(),e=await Z();if(!e)return null;let{data:a,error:r}=await t.from("notification_preferences").select("*").eq("user_id",e.id).maybeSingle();if(r)throw r;if(!a){const n=await t.from("notification_preferences").insert({user_id:e.id,...Nm}).select("*").single();if(n.error)throw n.error;a=n.data}return a}async function jm(t){const e=Xt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const r=Im(t);if(!Number.isInteger(r.harvest_reminder_hour)||r.harvest_reminder_hour<0||r.harvest_reminder_hour>23)throw new Error("Informe uma hora válida.");if(!Number.isInteger(r.harvest_reminder_minute)||r.harvest_reminder_minute<0||r.harvest_reminder_minute>59)throw new Error("Informe minutos válidos.");if(!Number.isInteger(r.harvest_alert_days_before)||r.harvest_alert_days_before<0||r.harvest_alert_days_before>60)throw new Error("Os dias de antecedência devem ficar entre 0 e 60.");const{data:n,error:s}=await e.from("notification_preferences").upsert({user_id:a.id,...r},{onConflict:"user_id"}).select("*").single();if(s)throw s;return n}async function Dm(t=30){const e=Xt(),{data:a,error:r}=await e.rpc("refresh_harvest_notification_queue",{p_horizon_days:t});if(r)throw r;return a??[]}async function Mm(t=20){const e=Xt(),{data:a,error:r}=await e.from("notifications").select(`
        id,
        production_cycle_id,
        notification_type,
        title,
        body,
        scheduled_for,
        delivered_at,
        read_at,
        cancelled_at,
        metadata,
        created_at
      `).eq("notification_type","harvest_reminder").is("cancelled_at",null).gte("scheduled_for",new Date().toISOString()).order("scheduled_for",{ascending:!0}).limit(t);if(r)throw r;return a??[]}async function Um(t){if(!t)return;const e=Xt(),{error:a}=await e.from("notifications").update({delivered_at:new Date().toISOString()}).eq("id",t).is("delivered_at",null);a&&console.warn("Não foi possível registrar entrega da notificação:",a)}async function Hm(t){if(!t)return;const e=Xt(),a=new Date().toISOString(),{error:r}=await e.from("notifications").update({delivered_at:a,read_at:a}).eq("id",t);r&&console.warn("Não foi possível marcar a notificação como lida:",r)}async function bt({horizonDays:t=30}={}){if(!await Z())return{authenticated:!1,queueCount:0,nativeResult:null};const a=await Dm(t),r=await Pm(a);return{authenticated:!0,queueCount:a.length,nativeResult:r}}function ja(){window.setTimeout(()=>{bt().catch(t=>{console.warn("Não foi possível sincronizar lembretes de colheita:",t)})},0)}async function Fm(){return{native:Fe(),platform:Tm(),permission:await Xo(),exactAlarm:await Sr()}}let Ci=!1;async function Bm({navigate:t}={}){Ci||(Ci=!0,await xm({onReceived:e=>{var r;const a=(r=e.extra)==null?void 0:r.notificationDbId;Um(a)},onAction:e=>{var s,i;const a=e.notification,r=(s=a.extra)==null?void 0:s.notificationDbId,n=(i=a.extra)==null?void 0:i.route;Hm(r),n&&typeof t=="function"&&window.setTimeout(()=>{t(n)},0)}}))}async function zm({navigate:t}={}){try{return await Bm({navigate:t}),await bt()}catch(e){return console.warn("Inicialização das notificações não concluída:",e),null}}const ea=`
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
`;function ut(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function ac(t){var e,a,r;return{property_id:t.propertyId,area_id:t.areaId,season_id:t.seasonId||null,crop_id:t.cropId,variety:((e=t.variety)==null?void 0:e.trim())||null,planted_quantity:t.plantedQuantity===""||t.plantedQuantity===null||t.plantedQuantity===void 0?null:Number(t.plantedQuantity),planted_unit:((a=t.plantedUnit)==null?void 0:a.trim())||null,planting_date:t.plantingDate,initial_harvest_forecast:t.initialHarvestForecast||null,current_harvest_forecast:t.currentHarvestForecast||null,final_harvest_date:t.finalHarvestDate||null,status:t.status||"planted",notes:((r=t.notes)==null?void 0:r.trim())||null}}async function Hr({propertyId:t=null,areaId:e=null,seasonId:a=null,cropId:r=null,status:n=null,openOnly:s=!1,archived:i=!1,limit:o=null}={}){let l=ut().from("production_cycles").select(ea);i?l=l.not("deleted_at","is",null):l=l.is("deleted_at",null),t&&(l=l.eq("property_id",t)),e&&(l=l.eq("area_id",e)),a&&(l=l.eq("season_id",a)),r&&(l=l.eq("crop_id",r)),s&&!i?l=l.in("status",Ko):n&&!i&&(l=l.eq("status",n)),l=l.order("planting_date",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(o)&&o>0&&(l=l.limit(o));const{data:d,error:u}=await l;if(u)throw u;return d??[]}async function ta(t){const e=ut(),{data:a,error:r}=await e.from("production_cycles").select(ea).eq("id",t).maybeSingle();if(r)throw r;return a}async function Vm(t){const e=ut(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("production_cycles").insert({...ac(t),user_id:a.id}).select(ea).single();if(n)throw n;return ja(),r}async function Wm(t,e){const a=ut(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("production_cycles").update(ac(e)).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(ea).single();if(s)throw s;return ja(),n}async function Gm(t){const e=ut(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("production_cycles").update({deleted_at:new Date().toISOString()}).eq("id",t).eq("user_id",a.id).select(ea).single();if(n)throw n;return ja(),r}async function rc(t){const e=ut(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("production_cycles").update({deleted_at:null}).eq("id",t).eq("user_id",a.id).select(ea).single();if(n)throw n;return ja(),r}async function Km(t,e){if(!t||!e)return null;const a=ut(),{data:r,error:n}=await a.rpc("suggest_harvest_date",{p_crop_id:t,p_planting_date:e});if(n)throw n;return r||null}async function Jn(t={}){let a=ut().from("production_cycles").select("id",{count:"exact",head:!0}).is("deleted_at",null).in("status",Ko);t.propertyId&&(a=a.eq("property_id",t.propertyId)),t.areaId&&(a=a.eq("area_id",t.areaId)),t.seasonId&&(a=a.eq("season_id",t.seasonId)),t.cropId&&(a=a.eq("crop_id",t.cropId));const{count:r,error:n}=await a;if(n)throw n;return r??0}async function Jm(t){return Jn({cropId:t})}const nc=[["unit","Unidade"],["seed","Semente"],["seedling","Muda"],["kg","Quilograma (kg)"],["g","Grama (g)"],["bag","Saco"],["tray","Bandeja"],["meter","Metro linear (m)"],["liter","Litro (L)"],["other","Outra unidade"]];function Qm(t){var e;return((e=nc.find(([a])=>a===t))==null?void 0:e[1])||t||""}function Fr(t){var r,n;const e=((r=t.crop)==null?void 0:r.name)||"Cultura",a=(n=t.variety)==null?void 0:n.trim();return a?`${e} • ${a}`:e}function sc(t){var r,n;const e=(r=t.property)==null?void 0:r.name,a=(n=t.area)==null?void 0:n.name;return[e,a].filter(Boolean).join(" • ")||"Local não informado"}function ic(t){if(t.planted_quantity===null||t.planted_quantity===void 0)return null;const e=Qm(t.planted_unit);return`${ae(t.planted_quantity)}${e?` • ${e}`:""}`}function Ym(t,{archived:e=!1}={}){var n;const a=Vn(t),r=ic(t);return`
    <article class="cycle-card">
      <a
        href="/plantings/${t.id}"
        class="cycle-card__main"
        data-link
      >
        <div class="cycle-card__top">
          <span class="cycle-card__icon">
            ${y("sprout")}
          </span>

          <div class="cycle-card__identity">
            <h3>
              ${h(Fr(t))}
            </h3>

            <p>
              ${h(sc(t))}
            </p>
          </div>

          <span class="cycle-card__arrow">
            ${y("chevronRight")}
          </span>
        </div>

        <div class="cycle-card__meta">
          <span
            class="
              cycle-status
              ${Jo(t.status)}
            "
          >
            ${e?"Arquivado":h(kt(t.status))}
          </span>

          ${(n=t.season)!=null&&n.name?`
                <span class="cycle-chip">
                  ${y("calendar")}
                  ${h(t.season.name)}
                </span>
              `:""}

          ${r?`
                <span class="cycle-chip">
                  ${h(r)}
                </span>
              `:""}
        </div>

        <div class="cycle-timing">
          <span>
            ${a.plantingText}
          </span>

          <span
            class="${a.delayedDays>0?"cycle-timing__late":""}"
          >
            ${a.forecastText}
          </span>
        </div>

        ${a.progressPercent!==null?`
              <div class="cycle-progress">
                <div class="cycle-progress__row">
                  <span>
                    Ciclo estimado
                  </span>

                  <strong>
                    ${a.progressPercent}%
                  </strong>
                </div>

                <div class="cycle-progress__track">
                  <span
                    style="width: ${a.progressPercent}%"
                  ></span>
                </div>
              </div>
            `:""}
      </a>

      ${e?`
            <div class="cycle-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-cycle"
                data-cycle-id="${t.id}"
              >
                ${y("refresh")}
                Restaurar
              </button>
            </div>
          `:""}
    </article>
  `}async function Zm({session:t,params:e}){const a=document.querySelector("#app");let r=null,n=null;try{[r,n]=await Promise.all([Oa(e.propertyId),Mo(e.areaId)])}catch(m){console.error("Erro ao carregar área:",m)}if(!r||!n||n.property_id!==r.id)return a.innerHTML=O({session:t,title:"Área",eyebrow:"Propriedades",activeNav:"properties",content:B({iconName:"layers",title:"Área não encontrada",description:"Este registro não existe ou não pertence à propriedade informada.",actionLabel:"Voltar para propriedades",actionHref:"/properties"})}),null;const s=n.status==="archived"||!!n.deleted_at,i=Go(n);let o=[],c=0;if(!s)try{[o,c]=await Promise.all([Hr({areaId:n.id,archived:!1,limit:3}),Jn({areaId:n.id})])}catch(m){console.error("Erro ao carregar ciclos da área:",m)}a.innerHTML=O({session:t,title:"Área",eyebrow:h(r.name),activeNav:"properties",content:`
        <section class="page-heading">
          <div>
            <a
              href="/properties/${r.id}/areas"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Áreas
            </a>
          </div>
        </section>

        <section class="area-detail-hero">
          <div class="property-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h($r(n))}
              </p>

              <h2>
                ${h(n.name)}
              </h2>

              <p>
                ${h(r.name)}
              </p>
            </div>

            <span
              class="
                property-status
                ${s?"property-status--archived":"property-status--active"}
              "
            >
              ${s?"Arquivada":"Ativa"}
            </span>
          </div>

          ${s?`
                <div class="property-detail-actions">
                  <button
                    id="restore-area"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("refresh")}
                    Restaurar área
                  </button>
                </div>
              `:`
                <div class="property-detail-actions">
                  <a
                    href="/properties/${r.id}/areas/${n.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>

                  <button
                    id="archive-area"
                    class="button button--danger"
                    type="button"
                  >
                    ${y("archive")}
                    Arquivar
                  </button>
                </div>
              `}
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Tipo
            </p>

            <p class="detail-card__value">
              ${h($r(n))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Tamanho
            </p>

            <p class="detail-card__value">
              ${h(i||"Não informado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Localização interna
            </p>

            <p class="detail-card__value">
              ${h(n.location_description||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrada em
            </p>

            <p class="detail-card__value">
              ${ne(n.created_at)}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(n.description||"Nenhuma descrição informada.")}
          </p>
        </article>

        <article
          class="detail-card"
          style="margin-top: 12px;"
        >
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(n.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        ${s?"":`
              <section class="property-areas-summary">
                <div class="property-areas-summary__header">
                  <div>
                    <h2>
                      Ciclos produtivos
                    </h2>

                    <p>
                      ${c} ${c===1?"ciclo em aberto":"ciclos em aberto"}
                    </p>
                  </div>

                  <a
                    href="/plantings/new?property=${r.id}&area=${n.id}"
                    class="icon-button"
                    aria-label="Registrar plantio"
                    data-link
                  >
                    ${y("plus")}
                  </a>
                </div>

                ${o.length?`
                      <div class="area-preview-list">
                        ${o.map(m=>`
                              <a
                                href="/plantings/${m.id}"
                                class="button button--secondary area-preview"
                                data-link
                              >
                                <span class="area-preview__icon">
                                  ${y("sprout")}
                                </span>

                                <span class="area-preview__content">
                                  <strong>
                                    ${h(Fr(m))}
                                  </strong>

                                  <span>
                                    ${h(kt(m.status))}
                                  </span>
                                </span>

                                ${y("chevronRight")}
                              </a>
                            `).join("")}
                      </div>
                    `:`
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${y("sprout")}
                        </div>

                        <h2>
                          Nenhum plantio nesta área
                        </h2>

                        <p>
                          Registre o primeiro ciclo produtivo sem perder os plantios futuros desta mesma área.
                        </p>

                        <a
                          href="/plantings/new?property=${r.id}&area=${n.id}"
                          class="button button--primary"
                          data-link
                        >
                          ${y("plus")}
                          Registrar plantio
                        </a>
                      </div>
                    `}
              </section>
            `}
      `});const l=document.querySelector("#archive-area"),d=document.querySelector("#restore-area"),u=async()=>{if(await ie({title:"Arquivar área?",message:"Ela sairá da lista de áreas ativas, mas o histórico permanecerá preservado.",confirmLabel:"Arquivar",danger:!0})){l.disabled=!0;try{await mm(n.id),j("Área arquivada.",{type:"success"}),Q(`/properties/${r.id}/areas`,{replace:!0})}catch(f){console.error("Erro ao arquivar área:",f),j(K(f),{type:"error"}),l.disabled=!1}}},p=async()=>{if(await ie({title:"Restaurar área?",message:"Ela voltará a aparecer entre as áreas ativas desta propriedade.",confirmLabel:"Restaurar"})){d.disabled=!0;try{await Uo(n.id),j("Área restaurada.",{type:"success"}),Q(`/properties/${r.id}/areas/${n.id}`,{replace:!0})}catch(f){console.error("Erro ao restaurar área:",f),j(K(f),{type:"error"}),d.disabled=!1}}};return l==null||l.addEventListener("click",u),d==null||d.addEventListener("click",p),()=>{l==null||l.removeEventListener("click",u),d==null||d.removeEventListener("click",p)}}const Da=`
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
`;function Ma(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function oc(t){var e,a,r;return{name:((e=t.name)==null?void 0:e.trim())||"",category:((a=t.category)==null?void 0:a.trim())||null,average_cycle_days:t.averageCycleDays===""||t.averageCycleDays===null||t.averageCycleDays===void 0?null:Number(t.averageCycleDays),notes:((r=t.notes)==null?void 0:r.trim())||null}}async function cc({activeOnly:t=!1}={}){let a=Ma().from("crops").select(Da);t&&(a=a.eq("active",!0)),a=a.order("is_system",{ascending:!1}).order("name",{ascending:!0});const{data:r,error:n}=await a;if(n)throw n;return r??[]}async function lc(){return cc({activeOnly:!0})}async function Qn(t){const e=Ma(),{data:a,error:r}=await e.from("crops").select(Da).eq("id",t).maybeSingle();if(r)throw r;return a}async function Xm(t){const e=Ma(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("crops").insert({...oc(t),user_id:a.id,is_system:!1,active:!0}).select(Da).single();if(n)throw n;return r}async function ef(t,e){const a=Ma(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("crops").update(oc(e)).eq("id",t).eq("user_id",r.id).eq("is_system",!1).select(Da).single();if(s)throw s;return n}async function tf(t,e){const a=Ma(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("crops").update({active:!!e}).eq("id",t).eq("user_id",r.id).eq("is_system",!1).select(Da).single();if(s)throw s;return n}function Ti(t,{selected:e="",emptyLabel:a}){return`
    <option value="">
      ${a}
    </option>

    ${t.map(r=>`
          <option
            value="${r.id}"
            ${e===r.id?"selected":""}
          >
            ${h(r.name)}
          </option>
        `).join("")}
  `}async function af({session:t}){const e=document.querySelector("#app");let a=[],r=[];try{[a,r]=await Promise.all([rt(),lc()])}catch(A){console.error("Erro ao carregar filtros:",A)}const n=new URLSearchParams(window.location.search);let s=n.get("property")||"",i=n.get("crop")||"",o=n.get("status")||"",c=n.get("open")==="1",l=n.get("archived")==="1";if(e.innerHTML=O({session:t,title:"Plantios",eyebrow:"Ciclos produtivos",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Plantios
            </p>

            <h2>
              Histórico de ciclos produtivos
            </h2>

            <p>
              Cada plantio é um ciclo independente, preservando o histórico da área ao longo do tempo.
            </p>
          </div>

          <a
            href="/plantings/new${s?`?property=${encodeURIComponent(s)}`:""}"
            class="icon-button"
            aria-label="Registrar plantio"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        ${a.length?`
              <section class="cycle-filters">
                <div class="field cycle-filter-field">
                  <label
                    for="cycle-property-filter"
                  >
                    Propriedade
                  </label>

                  <select
                    id="cycle-property-filter"
                  >
                    ${Ti(a,{selected:s,emptyLabel:"Todas as propriedades"})}
                  </select>
                </div>

                <div class="field cycle-filter-field">
                  <label
                    for="cycle-crop-filter"
                  >
                    Cultura
                  </label>

                  <select
                    id="cycle-crop-filter"
                  >
                    ${Ti(r,{selected:i,emptyLabel:"Todas as culturas"})}
                  </select>
                </div>

                <div class="field cycle-filter-field">
                  <label
                    for="cycle-status-filter"
                  >
                    Status
                  </label>

                  <select
                    id="cycle-status-filter"
                    ${l||c?"disabled":""}
                  >
                    <option value="">
                      Todos os status
                    </option>

                    ${Mr.map(([A,C])=>`
                          <option
                            value="${A}"
                            ${o===A?"selected":""}
                          >
                            ${C}
                          </option>
                        `).join("")}
                  </select>
                </div>
              </section>

              <section class="cycle-filter-toggles">
                <label>
                  <input
                    id="cycle-open-filter"
                    type="checkbox"
                    ${c?"checked":""}
                    ${l?"disabled":""}
                  />
                  <span>
                    Somente em aberto
                  </span>
                </label>

                <label>
                  <input
                    id="cycle-archived-filter"
                    type="checkbox"
                    ${l?"checked":""}
                  />
                  <span>
                    Mostrar arquivados
                  </span>
                </label>

                <a
                  href="/plantings/new${s?`?property=${encodeURIComponent(s)}`:""}"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${y("plus")}
                  Novo plantio
                </a>
              </section>

              <div id="cycles-content">
                ${ce({label:"Carregando plantios…"})}
              </div>
            `:B({iconName:"map",title:"Cadastre uma propriedade primeiro",description:"Para registrar um plantio você precisa de uma propriedade e pelo menos uma área.",actionLabel:"Cadastrar propriedade",actionHref:"/properties/new"})}
      `}),!a.length)return null;const d=document.querySelector("#cycles-content"),u=document.querySelector("#cycle-property-filter"),p=document.querySelector("#cycle-crop-filter"),m=document.querySelector("#cycle-status-filter"),f=document.querySelector("#cycle-open-filter"),v=document.querySelector("#cycle-archived-filter");let _=!1;function w(){const A=new URLSearchParams;s&&A.set("property",s),i&&A.set("crop",i),o&&!c&&!l&&A.set("status",o),c&&!l&&A.set("open","1"),l&&A.set("archived","1");const C=A.toString();window.history.replaceState({},"",C?`/plantings?${C}`:"/plantings")}async function k(){d.innerHTML=ce({label:l?"Carregando plantios arquivados…":"Carregando plantios…"});try{const A=await Hr({propertyId:s||null,cropId:i||null,status:o||null,openOnly:c,archived:l});if(_)return;if(!A.length){d.innerHTML=B(l?{iconName:"archive",title:"Nenhum plantio arquivado",description:"Ciclos arquivados permanecerão preservados e aparecerão aqui."}:{iconName:"sprout",title:"Nenhum plantio encontrado",description:"Registre um novo ciclo produtivo ou altere os filtros.",actionLabel:"Registrar plantio",actionHref:`/plantings/new${s?`?property=${encodeURIComponent(s)}`:""}`});return}d.innerHTML=`
        <section class="cycle-list">
          ${A.map(C=>Ym(C,{archived:l})).join("")}
        </section>
      `}catch(A){console.error("Erro ao listar plantios:",A),d.innerHTML=B({iconName:"sprout",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(A),{type:"error"})}}const S=()=>{s=u.value,i=p.value,o=m.value,c=f.checked,l=v.checked,l&&(c=!1,f.checked=!1),m.disabled=l||c,f.disabled=l,w(),k()},T=async A=>{const C=A.target.closest('[data-action="restore-cycle"]');if(!(!C||(A.preventDefault(),A.stopPropagation(),!await ie({title:"Restaurar plantio?",message:"O ciclo voltará ao histórico normal. As referências atuais de propriedade, área, safra e cultura serão validadas novamente.",confirmLabel:"Restaurar"})))){C.disabled=!0;try{await rc(C.dataset.cycleId),j("Plantio restaurado.",{type:"success"}),await k()}catch(E){console.error("Erro ao restaurar ciclo:",E),j(K(E),{type:"error"}),C.disabled=!1}}};return[u,p,m,f,v].forEach(A=>{A.addEventListener("change",S)}),document.addEventListener("click",T),await k(),()=>{_=!0,[u,p,m,f,v].forEach(A=>{A.removeEventListener("change",S)}),document.removeEventListener("click",T)}}const Ua=`
  id,
  user_id,
  name,
  brand,
  category,
  base_unit,
  description,
  notes,
  minimum_stock,
  ideal_stock,
  active,
  deleted_at,
  created_at,
  updated_at
`;function aa(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Li(t){if(t===""||t===null||t===void 0)return null;const e=Number(t);return Number.isFinite(e)?e:null}function dc(t){var e,a,r,n;return{name:((e=t.name)==null?void 0:e.trim())||"",brand:((a=t.brand)==null?void 0:a.trim())||null,category:t.category,base_unit:t.baseUnit,description:((r=t.description)==null?void 0:r.trim())||null,notes:((n=t.notes)==null?void 0:n.trim())||null,minimum_stock:Li(t.minimumStock)??0,ideal_stock:Li(t.idealStock)}}async function uc(){const t=aa(),{data:e,error:a}=await t.from("inventory_balances").select(`
        agricultural_input_id,
        current_quantity,
        stock_status,
        minimum_stock,
        ideal_stock,
        base_unit
      `);if(a)throw a;return new Map((e??[]).map(r=>[r.agricultural_input_id,r]))}function pc(t,e){return{...t,current_quantity:(e==null?void 0:e.current_quantity)??0,stock_status:(e==null?void 0:e.stock_status)??"out_of_stock"}}async function Br({includeInactive:t=!0}={}){let a=aa().from("agricultural_inputs").select(Ua).is("deleted_at",null);t||(a=a.eq("active",!0)),a=a.order("name",{ascending:!0});const[r,n]=await Promise.all([a,uc()]);if(r.error)throw r.error;return(r.data??[]).map(s=>pc(s,n.get(s.id)))}async function At(t){const e=aa(),[a,r]=await Promise.all([e.from("agricultural_inputs").select(Ua).eq("id",t).maybeSingle(),uc()]);if(a.error)throw a.error;return a.data?pc(a.data,r.get(t)):null}async function rf(t){const e=aa(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("agricultural_inputs").insert({...dc(t),user_id:a.id,active:!0}).select(Ua).single();if(n)throw n;return r}async function nf(t,e){const a=aa(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("agricultural_inputs").update(dc(e)).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Ua).single();if(s)throw s;return n}async function sf(t,e){const a=aa(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("agricultural_inputs").update({active:!!e}).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Ua).single();if(s)throw s;return n}const hc=[["seeds","Sementes"],["seedlings","Mudas"],["fertilizers","Fertilizantes"],["manures","Adubos"],["herbicides","Herbicidas"],["fungicides","Fungicidas"],["insecticides","Inseticidas"],["defensives","Defensivos"],["biologicals","Produtos biológicos"],["soil_amendments","Corretivos"],["other","Outros"]];function Er(t){var e;return((e=hc.find(([a])=>a===t))==null?void 0:e[1])||t||"Não informada"}const mc=[["kg","Quilograma (kg)"],["g","Grama (g)"],["l","Litro (L)"],["ml","Mililitro (mL)"],["unit","Unidade"],["bag","Saco"],["box","Caixa"],["bottle","Frasco"],["package","Pacote"],["seed","Semente"],["seedling","Muda"],["other","Outra unidade"]];function kr(t){var e;return((e=mc.find(([a])=>a===t))==null?void 0:e[1])||t||""}function fc(t){switch(t){case"normal":return"Estoque normal";case"low_stock":return"Estoque baixo";case"out_of_stock":return"Sem estoque";default:return"Sem estoque"}}function vc(t){switch(t){case"normal":return"input-stock--normal";case"low_stock":return"input-stock--low";case"out_of_stock":default:return"input-stock--out"}}function gc(t){return`${ae(t.current_quantity??0)} ${h(t.base_unit||"")}`.trim()}function of(t){return`
    <article class="input-card">
      <a
        href="/inventory/${t.id}"
        class="input-card__main"
        data-link
      >
        <div class="input-card__top">
          <span class="input-card__icon">
            ${y("box")}
          </span>

          <div class="input-card__identity">
            <h3>
              ${h(t.name)}
            </h3>

            <p>
              ${h([t.brand,Er(t.category)].filter(Boolean).join(" • "))}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="input-card__meta">
          <span
            class="
              input-stock
              ${vc(t.stock_status)}
            "
          >
            ${h(fc(t.stock_status))}
          </span>

          <span class="input-card__quantity">
            ${h(gc(t))}
          </span>

          <span
            class="
              crop-active-badge
              ${t.active?"crop-active-badge--active":"crop-active-badge--inactive"}
            "
          >
            ${t.active?"Ativo":"Inativo"}
          </span>
        </div>

        <p class="input-card__unit">
          Unidade principal:
          ${h(kr(t.base_unit))}
        </p>
      </a>
    </article>
  `}async function cf({session:t}){const e=document.querySelector("#app");e.innerHTML=O({session:t,title:"Barracão",eyebrow:"Insumos",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Barracão
            </p>

            <h2>
              Insumos agrícolas
            </h2>

            <p>
              Cadastre insumos, acompanhe lotes de compra e consulte o histórico completo de movimentações do estoque.
            </p>
          </div>

          <a
            href="/inventory/new"
            class="icon-button"
            aria-label="Cadastrar insumo"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <section class="input-toolbar">
          <div class="crop-search">
            ${y("search")}

            <input
              id="input-search"
              type="search"
              placeholder="Buscar insumo, marca ou categoria..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control"
            role="tablist"
            aria-label="Situação dos insumos"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-input-filter="active"
              aria-selected="true"
            >
              Ativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-input-filter="inactive"
              aria-selected="false"
            >
              Inativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-input-filter="all"
              aria-selected="false"
            >
              Todos
            </button>
          </div>
        </section>

        <div class="input-info-note">
          ${y("lock")}

          <div>
            <strong>
              Estoque por movimentações
            </strong>

            <span>
              A quantidade atual nunca é editada diretamente. Compras criam entradas automáticas e demais alterações ficam registradas no histórico.
            </span>
          </div>
        </div>

        <section class="inventory-hub-actions">
          <a
            href="/inventory/transactions"
            class="button button--secondary inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${y("history")}
            </span>

            <span class="inventory-hub-action__content">
              <strong>Movimentações</strong>
              <span>Histórico completo de entradas, saídas e ajustes</span>
            </span>

            ${y("chevronRight")}
          </a>

          <a
            href="/inventory/transactions/new"
            class="button button--secondary inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${y("plus")}
            </span>

            <span class="inventory-hub-action__content">
              <strong>Nova movimentação</strong>
              <span>Ajuste, perda, vencimento ou devolução</span>
            </span>

            ${y("chevronRight")}
          </a>
        </section>

        <div class="season-list-actions">
          <a
            href="/inventory/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Novo insumo
          </a>
        </div>

        <div id="inputs-content">
          ${ce({label:"Carregando insumos…"})}
        </div>
      `});const a=document.querySelector("#inputs-content"),r=document.querySelector("#input-search"),n=[...document.querySelectorAll("[data-input-filter]")];let s=[],i="active";function o(){const u=r.value.trim().toLocaleLowerCase("pt-BR");return s.filter(p=>i==="active"&&!p.active||i==="inactive"&&p.active?!1:u?[p.name,p.brand,Er(p.category)].filter(Boolean).some(m=>String(m).toLocaleLowerCase("pt-BR").includes(u)):!0)}function c(){const u=o();if(!u.length){a.innerHTML=B({iconName:"box",title:i==="active"?"Nenhum insumo ativo":"Nenhum insumo encontrado",description:i==="active"?"Cadastre sementes, fertilizantes, defensivos e outros produtos utilizados na produção.":"Altere os filtros ou a busca para localizar outros registros.",actionLabel:i==="active"?"Cadastrar insumo":null,actionHref:i==="active"?"/inventory/new":null});return}a.innerHTML=`
      <section class="input-list">
        ${u.map(of).join("")}
      </section>
    `}const l=u=>{const p=u.target.closest("[data-input-filter]");if(p){i=p.dataset.inputFilter;for(const m of n){const f=m===p;m.classList.toggle("segmented-control__button--active",f),m.setAttribute("aria-selected",String(f))}c()}},d=()=>{c()};n.forEach(u=>{u.addEventListener("click",l)}),r.addEventListener("input",d);try{s=await Br(),c()}catch(u){console.error("Erro ao carregar insumos:",u),a.innerHTML=B({iconName:"box",title:"Não foi possível carregar os insumos",description:"Verifique sua conexão com o Supabase e tente novamente."}),j(K(u),{type:"error"})}return()=>{n.forEach(u=>{u.removeEventListener("click",l)}),r.removeEventListener("input",d)}}function Te({iconName:t,title:e,description:a,href:r}){return`
    <a
      href="${r}"
      class="button button--secondary more-item"
      data-link
    >
      <span class="more-item__icon">
        ${y(t)}
      </span>

      <span class="more-item__content">
        <strong>${e}</strong>
        <span>${a}</span>
      </span>

      <span class="more-item__arrow">
        ${y("chevronRight")}
      </span>
    </a>
  `}function lf({session:t}){const e=document.querySelector("#app");return e.innerHTML=O({session:t,title:"Mais",eyebrow:"Meu Agro",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Mais recursos
            </p>

            <h2>
              Gestão e configurações
            </h2>

            <p>
              Acesse cadastros complementares, produção, vendas e sua conta.
            </p>
          </div>
        </section>

        <section class="more-list">
          ${Te({iconName:"cart",title:"Minhas compras",description:"Consultores, produtos e orçamentos",href:"/compras"})}
          ${Te({iconName:"users",title:"Meu espaço de consultor",description:"Atuação própria, empresas e representantes",href:"/consultor"})}
        </section>
        <section class="more-list">
          <p class="more-list__label">
            Produção
          </p>

          ${Te({iconName:"calendar",title:"Safras",description:"Agrupe ciclos produtivos",href:"/more/seasons"})}

          ${Te({iconName:"leaf",title:"Culturas",description:"Ciclos médios e variedades",href:"/more/crops"})}

          ${Te({iconName:"harvest",title:"Previsão de colheita",description:"Atrasos, semana da colheita e lembretes",href:"/more/harvest-forecast"})}

          ${Te({iconName:"users",title:"Consultores",description:"Contatos, especialidades e WhatsApp",href:"/more/consultants"})}

          ${Te({iconName:"harvest",title:"Colheitas",description:"Registros e produtividade",href:"/more/harvests"})}
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Gestão
          </p>

          ${Te({iconName:"cart",title:"Vendas",description:"Destino e comercialização",href:"/more/sales"})}

          ${Te({iconName:"chart",title:"Financeiro",description:"Insumos, receitas e resultado por ciclo",href:"/more/finance"})}
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Conta
          </p>

          ${Te({iconName:"settings",title:"Configurações",description:"Lembretes de colheita e notificações",href:"/more/settings"})}

          ${Te({iconName:"user",title:"Perfil",description:"Sua conta e sessão",href:"/more/profile"})}
        </section>
      `}),null}function df(t,e){var a,r,n,s;return(e==null?void 0:e.full_name)||((r=(a=t==null?void 0:t.user)==null?void 0:a.user_metadata)==null?void 0:r.full_name)||((s=(n=t==null?void 0:t.user)==null?void 0:n.email)==null?void 0:s.split("@")[0])||"Usuário"}function uf(t){const e=t.trim().split(/\s+/).filter(Boolean);return e.length?(e.length>1?`${e[0][0]}${e[e.length-1][0]}`:e[0].slice(0,2)).toUpperCase():"MA"}async function pf({session:t}){var i;const e=document.querySelector("#app");let a=null;try{a=await Sh()}catch(o){console.error("Erro ao carregar perfil:",o)}const r=df(t,a);e.innerHTML=O({session:t,title:"Perfil",eyebrow:"Minha conta",activeNav:"more",content:`
        <section class="profile-summary">
          <div class="profile-summary__avatar">
            ${h(uf(r))}
          </div>

          <div class="profile-summary__content">
            <strong>${h(r)}</strong>
            <span>${h(((i=t==null?void 0:t.user)==null?void 0:i.email)||"-")}</span>
          </div>
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Conta
          </p>

          <button
            id="logout-button"
            class="more-item"
            type="button"
            style="
              width: 100%;
              text-align: left;
              background: transparent;
            "
          >
            <span class="more-item__icon">
              ${y("logout")}
            </span>

            <span class="more-item__content">
              <strong>Sair da conta</strong>
              <span>
                Encerrar a sessão neste dispositivo
              </span>
            </span>

            <span class="more-item__arrow">
              ${y("chevronRight")}
            </span>
          </button>
        </section>
      `});const n=document.querySelector("#logout-button"),s=async()=>{n.disabled=!0;try{await Lo(),Q("/login",{replace:!0})}catch(o){j(Oe(o),{type:"error"}),n.disabled=!1}};return n.addEventListener("click",s),()=>{n.removeEventListener("click",s)}}function yc(t){const e=t.start_date?ne(t.start_date):null,a=t.end_date?ne(t.end_date):null;return e&&a?`${e} até ${a}`:e?`Início em ${e}`:a?`Até ${a}`:"Período não informado"}function _c(t){const e=t.property;if(!e)return"Propriedade não encontrada";const a=[e.city,e.state].filter(Boolean).join(" - ");return a?`${e.name} • ${a}`:e.name}function hf(t,{archived:e=!1}={}){return`
    <article class="season-card">
      <a
        href="/more/seasons/${t.id}"
        class="season-card__main"
        data-link
      >
        <div class="season-card__top">
          <span class="season-card__icon">
            ${y("calendar")}
          </span>

          <div class="season-card__identity">
            <h3>
              ${h(t.name)}
            </h3>

            <p>
              ${h(_c(t))}
            </p>
          </div>

          <span class="season-card__arrow">
            ${y("chevronRight")}
          </span>
        </div>

        <div class="season-card__meta">
          <span
            class="
              season-status
              ${Vo(t.status)}
            "
          >
            ${h(wr(t.status))}
          </span>

          <span class="season-period">
            ${y("calendar")}
            ${h(yc(t))}
          </span>
        </div>

        ${t.description?`
              <p class="season-card__description">
                ${h(t.description)}
              </p>
            `:""}
      </a>

      ${e?`
            <div class="season-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-season"
                data-season-id="${t.id}"
              >
                ${y("refresh")}
                Restaurar
              </button>
            </div>
          `:""}
    </article>
  `}function mf(t,e){return`
    <option value="">
      Todas as propriedades
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}function ff(t){return`
    <option value="">
      Todos os status
    </option>

    ${Dr.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}async function vf({session:t}){const e=document.querySelector("#app");let a=[];try{a=await rt()}catch(_){console.error("Erro ao carregar propriedades:",_)}const r=new URLSearchParams(window.location.search);let n=r.get("property")||"",s=r.get("status")||"",i=r.get("archived")==="1";if(n&&!a.some(_=>_.id===n)&&(n=""),e.innerHTML=O({session:t,title:"Safras",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Safras
            </p>

            <h2>
              Organize períodos produtivos
            </h2>

            <p>
              Agrupe ciclos produtivos por período e propriedade, como Safra Verão 2026 ou Safra 2026/2027.
            </p>
          </div>

          <a
            href="/more/seasons/new${n?`?property=${encodeURIComponent(n)}`:""}"
            class="icon-button"
            aria-label="Cadastrar safra"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        ${a.length?`
              <section class="season-filters">
                <div class="field season-filter-field">
                  <label for="season-property-filter">
                    Propriedade
                  </label>

                  <select
                    id="season-property-filter"
                  >
                    ${mf(a,n)}
                  </select>
                </div>

                <div class="field season-filter-field">
                  <label for="season-status-filter">
                    Status
                  </label>

                  <select
                    id="season-status-filter"
                    ${i?"disabled":""}
                  >
                    ${ff(s)}
                  </select>
                </div>

                <div class="season-filter-archive">
                  <label>
                    <input
                      id="season-archived-filter"
                      type="checkbox"
                      ${i?"checked":""}
                    />

                    <span>
                      Mostrar arquivadas
                    </span>
                  </label>
                </div>
              </section>

              <div class="season-list-actions">
                <a
                  href="/more/seasons/new${n?`?property=${encodeURIComponent(n)}`:""}"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${y("plus")}
                  Nova safra
                </a>
              </div>

              <div id="seasons-content">
                ${ce({label:"Carregando safras…"})}
              </div>
            `:`
              ${B({iconName:"map",title:"Cadastre uma propriedade primeiro",description:"Toda safra precisa estar vinculada a uma propriedade.",actionLabel:"Cadastrar propriedade",actionHref:"/properties/new"})}
            `}
      `}),!a.length)return null;const o=document.querySelector("#seasons-content"),c=document.querySelector("#season-property-filter"),l=document.querySelector("#season-status-filter"),d=document.querySelector("#season-archived-filter");let u=!1;async function p(){o.innerHTML=ce({label:i?"Carregando safras arquivadas…":"Carregando safras…"});try{const _=await Fo({propertyId:n||null,status:i?null:s||null,archived:i});if(u)return;if(!_.length){o.innerHTML=B(i?{iconName:"archive",title:"Nenhuma safra arquivada",description:"As safras arquivadas continuarão preservadas e aparecerão aqui."}:{iconName:"calendar",title:"Nenhuma safra encontrada",description:n?"Cadastre a primeira safra desta propriedade ou altere os filtros.":"Cadastre sua primeira safra para começar a organizar os ciclos produtivos.",actionLabel:"Cadastrar safra",actionHref:`/more/seasons/new${n?`?property=${encodeURIComponent(n)}`:""}`});return}o.innerHTML=`
        <section class="season-list">
          ${_.map(w=>hf(w,{archived:i})).join("")}
        </section>
      `}catch(_){console.error("Erro ao listar safras:",_),o.innerHTML=B({iconName:"calendar",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(_),{type:"error"})}}function m(){const _=new URLSearchParams;n&&_.set("property",n),s&&!i&&_.set("status",s),i&&_.set("archived","1");const w=_.toString();window.history.replaceState({},"",w?`/more/seasons?${w}`:"/more/seasons")}const f=()=>{n=c.value,s=l.value,i=d.checked,l.disabled=i,m(),p()},v=async _=>{const w=_.target.closest('[data-action="restore-season"]');if(!(!w||(_.preventDefault(),_.stopPropagation(),!await ie({title:"Restaurar safra?",message:"Ela voltará a aparecer na listagem normal de safras.",confirmLabel:"Restaurar"})))){w.disabled=!0;try{await zo(w.dataset.seasonId),j("Safra restaurada.",{type:"success"}),await p()}catch(S){console.error("Erro ao restaurar safra:",S),j(K(S),{type:"error"}),w.disabled=!1}}};return c.addEventListener("change",f),l.addEventListener("change",f),d.addEventListener("change",f),document.addEventListener("click",v),await p(),()=>{u=!0,c.removeEventListener("change",f),l.removeEventListener("change",f),d.removeEventListener("change",f),document.removeEventListener("click",v)}}function gf(t,e){return`
    <option value="">
      Selecione
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}function yf(t){return Dr.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${a}
        </option>
      `).join("")}function _f(t){return t.propertyId?t.name.length<2?"Informe um nome com pelo menos 2 caracteres.":t.startDate&&t.endDate&&t.endDate<t.startDate?"A data final não pode ser anterior à data inicial.":Dr.some(([e])=>e===t.status)?null:"Selecione um status válido.":"Selecione a propriedade."}async function bc({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=[];try{s=await rt()}catch(v){console.error("Erro ao carregar propriedades:",v)}if(!s.length)return r.innerHTML=O({session:t,title:n?"Editar safra":"Nova safra",eyebrow:"Safras",activeNav:"more",content:B({iconName:"map",title:"Cadastre uma propriedade primeiro",description:"Toda safra precisa estar vinculada a uma propriedade ativa.",actionLabel:"Cadastrar propriedade",actionHref:"/properties/new"})}),null;let i=null;if(n){try{i=await Bo(e.seasonId)}catch(v){console.error("Erro ao carregar safra:",v)}if(!i||i.deleted_at)return r.innerHTML=O({session:t,title:"Safra",eyebrow:"Produção",activeNav:"more",content:B({iconName:"calendar",title:"Safra não encontrada",description:"Ela pode ter sido arquivada ou não pertencer à sua conta.",actionLabel:"Voltar para safras",actionHref:"/more/seasons"})}),null}const c=new URLSearchParams(window.location.search).get("property"),l=(i==null?void 0:i.property_id)||(s.some(v=>v.id===c)?c:""),d=n?"Editar safra":"Nova safra";r.innerHTML=O({session:t,title:d,eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/more/seasons/${i.id}`:"/more/seasons"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${d}
            </h2>

            <p>
              Defina o período produtivo e a propriedade à qual esta safra pertence.
            </p>
          </div>
        </section>

        <div
          id="season-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="season-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Use um nome claro, como Safra Verão 2026 ou Safra 2026/2027.
              </p>
            </div>

            <div class="field">
              <label
                for="season-property"
              >
                Propriedade *
              </label>

              <select
                id="season-property"
                name="propertyId"
                required
              >
                ${gf(s,l)}
              </select>
            </div>

            <div class="field">
              <label
                for="season-name"
              >
                Nome *
              </label>

              <input
                id="season-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Safra Verão 2026"
                value="${h((i==null?void 0:i.name)||"")}"
                required
              />
            </div>

            <div class="field">
              <label
                for="season-description"
              >
                Descrição
              </label>

              <textarea
                id="season-description"
                name="description"
                maxlength="800"
                placeholder="Ex.: Safra destinada ao cultivo de milho e feijão."
              >${h((i==null?void 0:i.description)||"")}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Período
              </h2>

              <p>
                As datas podem ser preenchidas agora ou atualizadas depois.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="season-start-date"
                >
                  Data inicial
                </label>

                <input
                  id="season-start-date"
                  name="startDate"
                  type="date"
                  value="${(i==null?void 0:i.start_date)||""}"
                />
              </div>

              <div class="field">
                <label
                  for="season-end-date"
                >
                  Data final
                </label>

                <input
                  id="season-end-date"
                  name="endDate"
                  type="date"
                  value="${(i==null?void 0:i.end_date)||""}"
                />
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Situação
              </h2>

              <p>
                O status ajuda a distinguir safras planejadas, atuais e encerradas.
              </p>
            </div>

            <div class="field">
              <label
                for="season-status"
              >
                Status *
              </label>

              <select
                id="season-status"
                name="status"
                required
              >
                ${yf((i==null?void 0:i.status)||"planned")}
              </select>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/more/seasons/${i.id}`:"/more/seasons"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="season-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar safra"}
            </button>
          </div>
        </form>
      `});const u=document.querySelector("#season-form"),p=document.querySelector("#season-form-feedback"),m=document.querySelector("#season-submit"),f=async v=>{v.preventDefault(),D(p,"");const _=new FormData(u),w={propertyId:String(_.get("propertyId")||"").trim(),name:String(_.get("name")||"").trim(),description:String(_.get("description")||"").trim(),startDate:String(_.get("startDate")||""),endDate:String(_.get("endDate")||""),status:String(_.get("status")||"")},k=_f(w);if(k){D(p,k),p.scrollIntoView({behavior:"smooth",block:"center"});return}te(m,!0,n?"Salvando…":"Cadastrando…");try{const S=n?await vm(i.id,w):await fm(w);j(n?"Safra atualizada.":"Safra cadastrada.",{type:"success"}),Q(`/more/seasons/${S.id}`,{replace:!0})}catch(S){console.error("Erro ao salvar safra:",S),D(p,K(S)),p.scrollIntoView({behavior:"smooth",block:"center"})}finally{te(m,!1)}};return u.addEventListener("submit",f),()=>{u.removeEventListener("submit",f)}}async function bf({session:t,params:e}){var u;const a=document.querySelector("#app");let r=null;try{r=await Bo(e.seasonId)}catch(p){console.error("Erro ao carregar safra:",p)}if(!r)return a.innerHTML=O({session:t,title:"Safra",eyebrow:"Produção",activeNav:"more",content:B({iconName:"calendar",title:"Safra não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para safras",actionHref:"/more/seasons"})}),null;const n=!!r.deleted_at;let s=[],i=0;if(!n)try{[s,i]=await Promise.all([Hr({seasonId:r.id,archived:!1,limit:3}),Jn({seasonId:r.id})])}catch(p){console.error("Erro ao carregar ciclos da safra:",p)}a.innerHTML=O({session:t,title:"Safra",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/seasons"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Safras
            </a>
          </div>
        </section>

        <section class="season-detail-hero">
          <div class="season-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(_c(r))}
              </p>

              <h2>
                ${h(r.name)}
              </h2>

              <p>
                ${h(yc(r))}
              </p>
            </div>

            ${n?`
                  <span class="property-status property-status--archived">
                    Arquivada
                  </span>
                `:`
                  <span
                    class="
                      season-status
                      ${Vo(r.status)}
                    "
                  >
                    ${h(wr(r.status))}
                  </span>
                `}
          </div>

          ${n?`
                <div class="property-detail-actions">
                  <button
                    id="restore-season"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("refresh")}
                    Restaurar safra
                  </button>
                </div>
              `:`
                <div class="property-detail-actions">
                  <a
                    href="/more/seasons/${r.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>

                  <button
                    id="archive-season"
                    class="button button--danger"
                    type="button"
                  >
                    ${y("archive")}
                    Arquivar
                  </button>
                </div>
              `}
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Propriedade
            </p>

            <p class="detail-card__value">
              ${h(((u=r.property)==null?void 0:u.name)||"Não encontrada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Status
            </p>

            <p class="detail-card__value">
              ${h(wr(r.status))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data inicial
            </p>

            <p class="detail-card__value">
              ${ne(r.start_date)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data final
            </p>

            <p class="detail-card__value">
              ${ne(r.end_date)}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.description||"Nenhuma descrição informada.")}
          </p>
        </article>

        ${n?"":`
              <section class="property-seasons-summary">
                <div class="property-seasons-summary__header">
                  <div>
                    <h2>
                      Ciclos desta safra
                    </h2>

                    <p>
                      ${i} ${i===1?"ciclo em aberto":"ciclos em aberto"}
                    </p>
                  </div>

                  <a
                    href="/plantings/new?property=${r.property_id}&season=${r.id}"
                    class="icon-button"
                    aria-label="Registrar plantio"
                    data-link
                  >
                    ${y("plus")}
                  </a>
                </div>

                ${s.length?`
                      <div class="season-preview-list">
                        ${s.map(p=>`
                              <a
                                href="/plantings/${p.id}"
                                class="button button--secondary season-preview"
                                data-link
                              >
                                <span class="season-preview__icon">
                                  ${y("sprout")}
                                </span>

                                <span class="season-preview__content">
                                  <strong>
                                    ${h(Fr(p))}
                                  </strong>

                                  <span>
                                    ${h(kt(p.status))}
                                  </span>
                                </span>

                                ${y("chevronRight")}
                              </a>
                            `).join("")}
                      </div>
                    `:`
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${y("sprout")}
                        </div>

                        <h2>
                          Nenhum ciclo nesta safra
                        </h2>

                        <p>
                          Vincule o primeiro plantio desta safra a uma área e cultura.
                        </p>

                        <a
                          href="/plantings/new?property=${r.property_id}&season=${r.id}"
                          class="button button--primary"
                          data-link
                        >
                          ${y("plus")}
                          Registrar plantio
                        </a>
                      </div>
                    `}
              </section>
            `}
      `});const o=document.querySelector("#archive-season"),c=document.querySelector("#restore-season"),l=async()=>{if(await ie({title:"Arquivar safra?",message:"A safra deixará de aparecer na listagem principal, mas continuará preservada para manter o histórico.",confirmLabel:"Arquivar",danger:!0})){o.disabled=!0;try{await gm(r.id),j("Safra arquivada.",{type:"success"}),Q("/more/seasons",{replace:!0})}catch(m){console.error("Erro ao arquivar safra:",m),j(K(m),{type:"error"}),o.disabled=!1}}},d=async()=>{if(await ie({title:"Restaurar safra?",message:"Ela voltará a aparecer entre as safras da sua conta.",confirmLabel:"Restaurar"})){c.disabled=!0;try{await zo(r.id),j("Safra restaurada.",{type:"success"}),Q(`/more/seasons/${r.id}`,{replace:!0})}catch(m){console.error("Erro ao restaurar safra:",m),j(K(m),{type:"error"}),c.disabled=!1}}};return o==null||o.addEventListener("click",l),c==null||c.addEventListener("click",d),()=>{o==null||o.removeEventListener("click",l),c==null||c.removeEventListener("click",d)}}function qn(t){const e=Number(t.average_cycle_days);return!Number.isFinite(e)||e<=0?"Ciclo médio não informado":`${e} ${e===1?"dia":"dias"}`}function wf(t){return`
    <article class="crop-card">
      <a
        href="/more/crops/${t.id}"
        class="crop-card__main"
        data-link
      >
        <div class="crop-card__top">
          <span class="crop-card__icon">
            ${y("leaf")}
          </span>

          <div class="crop-card__identity">
            <h3>
              ${h(t.name)}
            </h3>

            <p>
              ${h(t.category||"Sem categoria")}
            </p>
          </div>

          <span class="crop-card__arrow">
            ${y("chevronRight")}
          </span>
        </div>

        <div class="crop-card__meta">
          <span
            class="
              crop-source-badge
              ${t.is_system?"crop-source-badge--system":"crop-source-badge--custom"}
            "
          >
            ${t.is_system?"Meu Agro":"Personalizada"}
          </span>

          <span
            class="
              crop-active-badge
              ${t.active?"crop-active-badge--active":"crop-active-badge--inactive"}
            "
          >
            ${t.active?"Ativa":"Inativa"}
          </span>
        </div>

        <p class="crop-cycle-label">
          ${y("calendar")}
          ${h(qn(t))}
        </p>
      </a>
    </article>
  `}async function $f({session:t}){const e=document.querySelector("#app");e.innerHTML=O({session:t,title:"Culturas",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Culturas
            </p>

            <h2>
              Catálogo de culturas
            </h2>

            <p>
              Use as culturas padrão do Meu Agro ou cadastre culturas personalizadas para os seus plantios.
            </p>
          </div>

          <a
            href="/more/crops/new"
            class="icon-button"
            aria-label="Cadastrar cultura"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <section class="crop-toolbar">
          <div class="crop-search">
            ${y("search")}

            <input
              id="crop-search"
              type="search"
              placeholder="Buscar cultura..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control crop-source-filter"
            role="tablist"
            aria-label="Origem das culturas"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-crop-source="all"
              aria-selected="true"
            >
              Todas
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-crop-source="system"
              aria-selected="false"
            >
              Padrão
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-crop-source="custom"
              aria-selected="false"
            >
              Minhas
            </button>
          </div>
        </section>

        <div class="crop-inactive-toggle">
          <label>
            <input
              id="crop-show-inactive"
              type="checkbox"
            />
            <span>
              Mostrar culturas personalizadas inativas
            </span>
          </label>

          <a
            href="/more/crops/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova cultura
          </a>
        </div>

        <div id="crops-content">
          ${ce({label:"Carregando culturas…"})}
        </div>
      `});const a=document.querySelector("#crops-content"),r=document.querySelector("#crop-search"),n=document.querySelector("#crop-show-inactive"),s=[...document.querySelectorAll("[data-crop-source]")];let i=[],o="all",c="",l=!1;function d(){const v=c.trim().toLocaleLowerCase("pt-BR");return i.filter(_=>o==="system"&&!_.is_system||o==="custom"&&_.is_system||!_.is_system&&!_.active&&!l?!1:v?[_.name,_.category].filter(Boolean).some(w=>String(w).toLocaleLowerCase("pt-BR").includes(v)):!0)}function u(){const v=d();if(!v.length){a.innerHTML=B({iconName:"leaf",title:"Nenhuma cultura encontrada",description:o==="custom"?"Cadastre uma cultura personalizada ou altere os filtros.":"Tente alterar a busca ou os filtros.",actionLabel:o==="custom"?"Cadastrar cultura":null,actionHref:o==="custom"?"/more/crops/new":null});return}a.innerHTML=`
      <section class="crop-list">
        ${v.map(wf).join("")}
      </section>
    `}const p=v=>{const _=v.target.closest("[data-crop-source]");if(_){o=_.dataset.cropSource;for(const w of s){const k=w===_;w.classList.toggle("segmented-control__button--active",k),w.setAttribute("aria-selected",String(k))}u()}},m=()=>{c=r.value,u()},f=()=>{l=n.checked,u()};s.forEach(v=>{v.addEventListener("click",p)}),r.addEventListener("input",m),n.addEventListener("change",f);try{i=await cc(),u()}catch(v){console.error("Erro ao carregar culturas:",v),a.innerHTML=B({iconName:"leaf",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(v),{type:"error"})}return()=>{s.forEach(v=>{v.removeEventListener("click",p)}),r.removeEventListener("input",m),n.removeEventListener("change",f)}}const Sf=["Grãos","Hortaliças","Frutas","Raízes","Tubérculos","Perenes","Leguminosas","Cereais","Forrageiras","Ervas","Flores","Outros"];function Ef(t){return t.name.length<2?"Informe um nome com pelo menos 2 caracteres.":t.averageCycleDays!==""&&(!Number.isInteger(t.averageCycleDays)||t.averageCycleDays<=0)?"O ciclo médio deve ser informado em dias inteiros maiores que zero.":null}async function wc({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null;if(n){try{s=await Qn(e.cropId)}catch(d){console.error("Erro ao carregar cultura:",d)}if(!s||s.is_system)return r.innerHTML=O({session:t,title:"Cultura",eyebrow:"Produção",activeNav:"more",content:B({iconName:"leaf",title:"Cultura não editável",description:"Culturas padrão do Meu Agro são somente leitura. Apenas culturas personalizadas podem ser alteradas.",actionLabel:"Voltar para culturas",actionHref:"/more/crops"})}),null}r.innerHTML=O({session:t,title:n?"Editar cultura":"Nova cultura",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/more/crops/${s.id}`:"/more/crops"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar cultura":"Nova cultura personalizada"}
            </h2>

            <p>
              O ciclo médio poderá sugerir automaticamente a previsão inicial de colheita nos plantios.
            </p>
          </div>
        </section>

        <div
          id="crop-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="crop-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Informe o nome e uma categoria para facilitar a organização.
              </p>
            </div>

            <div class="field">
              <label for="crop-name">
                Nome *
              </label>

              <input
                id="crop-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Abóbora"
                value="${h((s==null?void 0:s.name)||"")}"
                required
              />
            </div>

            <div class="field">
              <label for="crop-category">
                Categoria
              </label>

              <input
                id="crop-category"
                name="category"
                type="text"
                maxlength="100"
                list="crop-category-options"
                placeholder="Ex.: Hortaliças"
                value="${h((s==null?void 0:s.category)||"")}"
              />

              <datalist
                id="crop-category-options"
              >
                ${Sf.map(d=>`
                      <option
                        value="${h(d)}"
                      ></option>
                    `).join("")}
              </datalist>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Ciclo médio</h2>
              <p>
                Quantos dias, em média, esta cultura leva do plantio até a colheita?
              </p>
            </div>

            <div class="field">
              <label
                for="crop-average-cycle-days"
              >
                Ciclo médio em dias
              </label>

              <input
                id="crop-average-cycle-days"
                name="averageCycleDays"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                placeholder="Ex.: 90"
                value="${(s==null?void 0:s.average_cycle_days)??""}"
              />

              <small class="field__hint">
                Se informado, o Meu Agro poderá sugerir a previsão de colheita.
              </small>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Registre informações gerais úteis sobre a cultura.
              </p>
            </div>

            <div class="field">
              <label for="crop-notes">
                Observações
              </label>

              <textarea
                id="crop-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: variedade mais utilizada, particularidades de manejo..."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/more/crops/${s.id}`:"/more/crops"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="crop-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar cultura"}
            </button>
          </div>
        </form>
      `});const i=document.querySelector("#crop-form"),o=document.querySelector("#crop-form-feedback"),c=document.querySelector("#crop-submit"),l=async d=>{d.preventDefault(),D(o,"");const u=new FormData(i),p=String(u.get("averageCycleDays")||"").trim(),m={name:String(u.get("name")||"").trim(),category:String(u.get("category")||"").trim(),averageCycleDays:p?Number(p):"",notes:String(u.get("notes")||"").trim()},f=Ef(m);if(f){D(o,f);return}te(c,!0,n?"Salvando…":"Cadastrando…");try{const v=n?await ef(s.id,m):await Xm(m);j(n?"Cultura atualizada.":"Cultura cadastrada.",{type:"success"}),Q(`/more/crops/${v.id}`,{replace:!0})}catch(v){console.error("Erro ao salvar cultura:",v),D(o,K(v))}finally{te(c,!1)}};return i.addEventListener("submit",l),()=>{i.removeEventListener("submit",l)}}async function kf({session:t,params:e}){const a=document.querySelector("#app");let r=null,n=0;try{r=await Qn(e.cropId),r&&(n=await Jm(r.id))}catch(o){console.error("Erro ao carregar cultura:",o)}if(!r)return a.innerHTML=O({session:t,title:"Cultura",eyebrow:"Produção",activeNav:"more",content:B({iconName:"leaf",title:"Cultura não encontrada",description:"Este registro não existe ou não está disponível para sua conta.",actionLabel:"Voltar para culturas",actionHref:"/more/crops"})}),null;a.innerHTML=O({session:t,title:"Cultura",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/crops"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Culturas
            </a>
          </div>
        </section>

        <section class="crop-detail-hero">
          <div class="crop-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(r.category||"Cultura")}
              </p>

              <h2>
                ${h(r.name)}
              </h2>

              <p>
                ${h(qn(r))}
              </p>
            </div>

            <span
              class="
                crop-active-badge
                ${r.active?"crop-active-badge--active":"crop-active-badge--inactive"}
              "
            >
              ${r.active?"Ativa":"Inativa"}
            </span>
          </div>

          ${r.is_system?`
                <div class="crop-readonly-note">
                  ${y("lock")}
                  Cultura padrão do Meu Agro. Somente leitura.
                </div>
              `:`
                <div class="property-detail-actions">
                  <a
                    href="/more/crops/${r.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>

                  <button
                    id="toggle-crop-active"
                    class="
                      button
                      ${r.active?"button--danger":"button--secondary"}
                    "
                    type="button"
                  >
                    ${r.active?y("archive"):y("refresh")}

                    ${r.active?"Desativar":"Reativar"}
                  </button>
                </div>
              `}
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Origem
            </p>
            <p class="detail-card__value">
              ${r.is_system?"Padrão do Meu Agro":"Personalizada"}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Categoria
            </p>
            <p class="detail-card__value">
              ${h(r.category||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo médio
            </p>
            <p class="detail-card__value">
              ${h(qn(r))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclos em aberto
            </p>
            <p class="detail-card__value">
              ${n}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <article
          class="detail-card"
          style="margin-top: 12px;"
        >
          <p class="detail-card__label">
            Última atualização
          </p>
          <p class="detail-card__value">
            ${ne(r.updated_at)}
          </p>
        </article>

        <a
          href="/plantings?crop=${r.id}"
          class="button button--secondary button--full"
          style="margin-top: 16px;"
          data-link
        >
          ${y("sprout")}
          Ver plantios desta cultura
        </a>
      `});const s=document.querySelector("#toggle-crop-active"),i=async()=>{const o=!r.active;let c=o?"A cultura voltará a aparecer no cadastro de novos plantios.":"A cultura deixará de aparecer no cadastro de novos plantios. O histórico existente será preservado.";if(!o&&n>0&&(c=`${c} Existem ${n} ${n===1?"ciclo em aberto usando esta cultura.":"ciclos em aberto usando esta cultura."}`),!!await ie({title:o?"Reativar cultura?":"Desativar cultura?",message:c,confirmLabel:o?"Reativar":"Desativar",danger:!o})){s.disabled=!0;try{await tf(r.id,o),j(o?"Cultura reativada.":"Cultura desativada.",{type:"success"}),Q(`/more/crops/${r.id}`,{replace:!0})}catch(d){console.error("Erro ao alterar cultura:",d),j(K(d),{type:"error"}),s.disabled=!1}}};return s==null||s.addEventListener("click",i),()=>{s==null||s.removeEventListener("click",i)}}function Af(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function st(t,{selected:e="",emptyLabel:a="Selecione",label:r}={}){return`
    <option value="">
      ${a}
    </option>

    ${t.filter(Boolean).map(n=>`
          <option
            value="${n.id}"
            ${n.id===e?"selected":""}
          >
            ${h(r?r(n):n.name)}
          </option>
        `).join("")}
  `}function Cf(t){return`
    <option value="">
      Selecione
    </option>

    ${nc.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Tf(t){return Mr.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${a}
        </option>
      `).join("")}function Lf(t){const e=String(t||"").trim().replace(",",".");return e?Number(e):""}function Rf(t){if(!t.propertyId)return"Selecione a propriedade.";if(!t.areaId)return"Selecione a área.";if(!t.cropId)return"Selecione a cultura.";if(!t.plantingDate)return"Informe a data do plantio.";if(t.plantedQuantity!==""&&(!Number.isFinite(t.plantedQuantity)||t.plantedQuantity<0))return"Informe uma quantidade plantada válida.";if(t.plantedQuantity!==""&&!t.plantedUnit)return"Selecione a unidade da quantidade plantada.";const e=[[t.initialHarvestForecast,"A previsão inicial"],[t.currentHarvestForecast,"A previsão atual"],[t.finalHarvestDate,"A data real da colheita"]];for(const[a,r]of e)if(a&&a<t.plantingDate)return`${r} não pode ser anterior à data do plantio.`;return null}async function $c({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=[],i=[],o=null;try{[s,i]=await Promise.all([rt(),lc()]),n&&(o=await ta(e.cycleId))}catch(J){console.error("Erro ao preparar formulário:",J)}if(!s.length)return r.innerHTML=O({session:t,title:"Plantio",eyebrow:"Ciclos produtivos",activeNav:"plantings",content:B({iconName:"map",title:"Cadastre uma propriedade primeiro",description:"O plantio precisa estar ligado a uma propriedade e uma área.",actionLabel:"Cadastrar propriedade",actionHref:"/properties/new"})}),null;if(n&&(!o||o.deleted_at))return r.innerHTML=O({session:t,title:"Plantio",eyebrow:"Ciclos produtivos",activeNav:"plantings",content:B({iconName:"sprout",title:"Plantio não encontrado",description:"O ciclo pode ter sido arquivado ou não pertencer à sua conta.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;if(n&&(o!=null&&o.crop)&&!i.some(J=>J.id===o.crop.id)){const J=await Qn(o.crop.id);J&&i.push(J)}const c=new URLSearchParams(window.location.search),l=c.get("property"),d=c.get("area"),u=c.get("season");let p=(o==null?void 0:o.property_id)||(s.some(J=>J.id===l)?l:""),m=(o==null?void 0:o.area_id)||d||"",f=(o==null?void 0:o.season_id)||u||"",v=[],_=[];async function w(J){if(!J)return{areas:[],seasons:[]};const[Y,re]=await Promise.all([Gn(J),Fo({propertyId:J,archived:!1})]);return{areas:Y,seasons:re}}try{const J=await w(p);v=J.areas,_=J.seasons,v.some(Y=>Y.id===m)||(m=""),_.some(Y=>Y.id===f)||(f="")}catch(J){console.error("Erro ao carregar áreas/safras:",J)}r.innerHTML=O({session:t,title:n?"Editar plantio":"Novo plantio",eyebrow:"Ciclos produtivos",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/plantings/${o.id}`:"/plantings"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar ciclo produtivo":"Registrar novo plantio"}
            </h2>

            <p>
              O plantio permanece como um ciclo independente para que o histórico da área nunca seja perdido.
            </p>
          </div>
        </section>

        <div
          id="cycle-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="cycle-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Local e safra
              </h2>

              <p>
                A área é obrigatória. A safra é opcional e precisa pertencer à mesma propriedade.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-property"
              >
                Propriedade *
              </label>

              <select
                id="cycle-property"
                name="propertyId"
                required
              >
                ${st(s,{selected:p})}
              </select>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="cycle-area"
                >
                  Área *
                </label>

                <select
                  id="cycle-area"
                  name="areaId"
                  required
                  ${p?"":"disabled"}
                >
                  ${st(v,{selected:m,emptyLabel:v.length?"Selecione":"Nenhuma área disponível",label:J=>{var Y;return`${J.name}${(Y=J.area_type)!=null&&Y.name?` • ${J.area_type.name}`:""}`}})}
                </select>
              </div>

              <div class="field">
                <label
                  for="cycle-season"
                >
                  Safra
                </label>

                <select
                  id="cycle-season"
                  name="seasonId"
                  ${p?"":"disabled"}
                >
                  ${st(_,{selected:f,emptyLabel:"Sem safra"})}
                </select>
              </div>
            </div>

            <div
              id="cycle-no-area-warning"
              class="form-message form-message--info"
              ${p&&!v.length?"":"hidden"}
            >
              Esta propriedade ainda não possui áreas ativas.
              <a
                id="cycle-create-area-link"
                href="${p?`/properties/${p}/areas/new`:"#"}"
                class="button button--secondary link link--strong"
                data-link
              >
                Cadastrar área
              </a>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Cultura</h2>
              <p>
                Escolha uma cultura padrão ou personalizada e, se necessário, informe a variedade.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-crop"
              >
                Cultura *
              </label>

              <select
                id="cycle-crop"
                name="cropId"
                required
              >
                ${st(i,{selected:(o==null?void 0:o.crop_id)||"",label:J=>`${J.name}${J.is_system?"":" • personalizada"}${J.active?"":" • inativa"}`})}
              </select>

              <small
                id="cycle-crop-hint"
                class="field__hint"
              ></small>
            </div>

            <div class="field">
              <label
                for="cycle-variety"
              >
                Variedade
              </label>

              <input
                id="cycle-variety"
                name="variety"
                type="text"
                maxlength="160"
                placeholder="Ex.: Milho AG 8700"
                value="${h((o==null?void 0:o.variety)||"")}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="cycle-quantity"
                >
                  Quantidade plantada
                </label>

                <input
                  id="cycle-quantity"
                  name="plantedQuantity"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 5"
                  value="${(o==null?void 0:o.planted_quantity)??""}"
                />
              </div>

              <div class="field">
                <label
                  for="cycle-unit"
                >
                  Unidade
                </label>

                <select
                  id="cycle-unit"
                  name="plantedUnit"
                >
                  ${Cf((o==null?void 0:o.planted_unit)||"")}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Datas e previsão
              </h2>

              <p>
                A previsão sugerida usa a data do plantio + ciclo médio da cultura e continua editável.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-planting-date"
              >
                Data do plantio *
              </label>

              <input
                id="cycle-planting-date"
                name="plantingDate"
                type="date"
                value="${(o==null?void 0:o.planting_date)||Af()}"
                required
              />
            </div>

            <div class="cycle-forecast-grid">
              <div class="field">
                <label
                  for="cycle-initial-forecast"
                >
                  Previsão inicial
                </label>

                <input
                  id="cycle-initial-forecast"
                  name="initialHarvestForecast"
                  type="date"
                  value="${(o==null?void 0:o.initial_harvest_forecast)||""}"
                />
              </div>

              <div class="field">
                <div class="field__label-row">
                  <label
                    for="cycle-current-forecast"
                  >
                    Previsão atual
                  </label>

                  <button
                    id="cycle-recalculate-forecast"
                    class="button button--secondary button--compact"
                    type="button"
                  >
                    Recalcular
                  </button>
                </div>

                <input
                  id="cycle-current-forecast"
                  name="currentHarvestForecast"
                  type="date"
                  value="${(o==null?void 0:o.current_harvest_forecast)||""}"
                />
              </div>
            </div>

            <div class="field">
              <label
                for="cycle-final-harvest-date"
              >
                Data real da colheita
              </label>

              <input
                id="cycle-final-harvest-date"
                name="finalHarvestDate"
                type="date"
                value="${(o==null?void 0:o.final_harvest_date)||""}"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Situação</h2>
              <p>
                O status poderá evoluir ao longo do ciclo sem apagar os registros anteriores.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-status"
              >
                Status *
              </label>

              <select
                id="cycle-status"
                name="status"
                required
              >
                ${Tf((o==null?void 0:o.status)||"planted")}
              </select>
            </div>

            <div class="field">
              <label
                for="cycle-notes"
              >
                Observações
              </label>

              <textarea
                id="cycle-notes"
                name="notes"
                maxlength="2000"
                placeholder="Ex.: plantio realizado após preparo do solo..."
              >${h((o==null?void 0:o.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/plantings/${o.id}`:"/plantings"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="cycle-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Registrar plantio"}
            </button>
          </div>
        </form>
      `});const k=document.querySelector("#cycle-form"),S=document.querySelector("#cycle-form-feedback"),T=document.querySelector("#cycle-submit"),A=document.querySelector("#cycle-property"),C=document.querySelector("#cycle-area"),I=document.querySelector("#cycle-season"),E=document.querySelector("#cycle-crop"),L=document.querySelector("#cycle-crop-hint"),q=document.querySelector("#cycle-planting-date"),$=document.querySelector("#cycle-initial-forecast"),b=document.querySelector("#cycle-current-forecast"),g=document.querySelector("#cycle-recalculate-forecast"),R=document.querySelector("#cycle-no-area-warning");function x(){const J=i.find(Y=>Y.id===E.value);if(!J){L.textContent="";return}L.textContent=J.average_cycle_days?`Ciclo médio cadastrado: ${J.average_cycle_days} dias.`:"Esta cultura não possui ciclo médio cadastrado."}async function H({fillInitial:J=!1,silent:Y=!1}={}){if(!E.value||!q.value){Y||j("Selecione a cultura e informe a data do plantio.",{type:"error"});return}g.disabled=!0;try{const re=await Km(E.value,q.value);if(!re){Y||j("A cultura selecionada não possui ciclo médio para sugerir a colheita.");return}J&&!$.value&&($.value=re),b.value=re,Y||j("Previsão recalculada pelo ciclo médio da cultura.",{type:"success"})}catch(re){console.error("Erro ao sugerir colheita:",re),Y||j(K(re),{type:"error"})}finally{g.disabled=!1}}async function P(){if(p=A.value,C.disabled=!p,I.disabled=!p,!p){v=[],_=[],C.innerHTML=st([],{emptyLabel:"Selecione a propriedade"}),I.innerHTML=st([],{emptyLabel:"Sem safra"}),R.hidden=!0;return}try{const J=await w(p);v=J.areas,_=J.seasons,C.innerHTML=st(v,{emptyLabel:v.length?"Selecione":"Nenhuma área disponível",label:re=>{var ye;return`${re.name}${(ye=re.area_type)!=null&&ye.name?` • ${re.area_type.name}`:""}`}}),I.innerHTML=st(_,{emptyLabel:"Sem safra"}),R.hidden=v.length>0;const Y=document.querySelector("#cycle-create-area-link");Y&&(Y.href=`/properties/${p}/areas/new`)}catch(J){console.error("Erro ao carregar dependências:",J),j(K(J),{type:"error"})}}const N=async()=>{x(),n||($.value="",b.value="",await H({fillInitial:!0,silent:!0}))},F=async()=>{n||($.value="",b.value="",await H({fillInitial:!0,silent:!0}))},M=()=>H({fillInitial:!0}),le=async J=>{J.preventDefault(),D(S,"");const Y=new FormData(k),re={propertyId:String(Y.get("propertyId")||""),areaId:String(Y.get("areaId")||""),seasonId:String(Y.get("seasonId")||""),cropId:String(Y.get("cropId")||""),variety:String(Y.get("variety")||"").trim(),plantedQuantity:Lf(Y.get("plantedQuantity")),plantedUnit:String(Y.get("plantedUnit")||""),plantingDate:String(Y.get("plantingDate")||""),initialHarvestForecast:String(Y.get("initialHarvestForecast")||""),currentHarvestForecast:String(Y.get("currentHarvestForecast")||""),finalHarvestDate:String(Y.get("finalHarvestDate")||""),status:String(Y.get("status")||""),notes:String(Y.get("notes")||"").trim()},ye=Rf(re);if(ye){D(S,ye);return}te(T,!0,n?"Salvando…":"Registrando…");try{const ke=n?await Wm(o.id,re):await Vm(re);j(n?"Plantio atualizado.":"Plantio registrado.",{type:"success"}),Q(`/plantings/${ke.id}`,{replace:!0})}catch(ke){console.error("Erro ao salvar plantio:",ke),D(S,K(ke))}finally{te(T,!1)}};return x(),A.addEventListener("change",P),E.addEventListener("change",N),q.addEventListener("change",F),g.addEventListener("click",M),k.addEventListener("submit",le),!n&&E.value&&q.value&&!b.value&&await H({fillInitial:!0,silent:!0}),()=>{A.removeEventListener("change",P),E.removeEventListener("change",N),q.removeEventListener("change",F),g.removeEventListener("click",M),k.removeEventListener("submit",le)}}const Yn="meu-agro-photos",Pf=8*1024*1024,qf=new Set(["image/jpeg","image/png","image/webp"]);function ra(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function xf(t){var n;const a=((t==null?void 0:t.name)||"").match(/\.([a-zA-Z0-9]+)$/),r=(n=a==null?void 0:a[1])==null?void 0:n.toLowerCase();return r&&["jpg","jpeg","png","webp"].includes(r)?r==="jpeg"?"jpg":r:(t==null?void 0:t.type)==="image/png"?"png":(t==null?void 0:t.type)==="image/webp"?"webp":"jpg"}function Nf(){var t;return(t=globalThis.crypto)!=null&&t.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}function xn(t){return t?t.size>Pf?"A imagem deve possuir no máximo 8 MB.":t.type&&!qf.has(t.type)||!t.type&&!/\.(jpe?g|png|webp)$/i.test(t.name||"")?"Use uma imagem JPG, PNG ou WebP.":null:"Selecione uma imagem."}async function If({file:t,cycle:e}){const a=xn(t);if(a)throw new Error(a);const r=ra(),n=await Z();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");if(!(e!=null&&e.id)||!(e!=null&&e.property_id))throw new Error("Ciclo produtivo inválido.");const s=[n.id,e.property_id,e.id,`${Date.now()}-${Nf()}.${xf(t)}`].join("/"),{error:i}=await r.storage.from(Yn).upload(s,t,{cacheControl:"3600",upsert:!1,contentType:t.type||void 0});if(i)throw i;return s}async function Sc(t){if(!t)return;const e=ra(),{error:a}=await e.storage.from(Yn).remove([t]);if(a)throw a}async function Of({cycle:t,eventId:e=null,storagePath:a,description:r,capturedAt:n}){const s=ra(),i=await Z();if(!i)throw new Error("Sua sessão expirou. Entre novamente.");const{data:o,error:c}=await s.from("event_photos").insert({user_id:i.id,property_id:t.property_id,area_id:t.area_id,production_cycle_id:t.id,production_event_id:e||null,storage_path:a,description:(r==null?void 0:r.trim())||null,captured_at:n||new Date().toISOString()}).select(`
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
      `).single();if(c)throw c;return o}async function jf(t){const e=ra(),{data:a,error:r}=await e.from("event_photos").select(`
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
      `).eq("production_cycle_id",t).order("captured_at",{ascending:!0});if(r)throw r;return Ec(a??[])}async function Ec(t,e=3600){const a=ra();return Promise.all((t??[]).map(async r=>{if(!(r!=null&&r.storage_path))return{...r,signed_url:null};const{data:n,error:s}=await a.storage.from(Yn).createSignedUrl(r.storage_path,e);return s?(console.warn("Não foi possível assinar a URL da foto:",s),{...r,signed_url:null}):{...r,signed_url:(n==null?void 0:n.signedUrl)||null}}))}async function Df(t){const e=ra(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{error:r}=await e.from("event_photos").delete().eq("id",t.id).eq("user_id",a.id);if(r)throw r;try{await Sc(t.storage_path)}catch(n){console.warn("O registro da foto foi removido, mas o arquivo não pôde ser apagado do Storage:",n)}}const zr=`
  id,
  user_id,
  production_cycle_id,
  event_type,
  title,
  description,
  notes,
  occurred_at,
  created_at,
  updated_at,
  event_photos (
    id,
    user_id,
    property_id,
    area_id,
    production_cycle_id,
    production_event_id,
    storage_path,
    description,
    captured_at,
    created_at
  ),
  event_inputs (
    id,
    user_id,
    production_event_id,
    agricultural_input_id,
    inventory_lot_id,
    quantity,
    unit,
    unit_cost,
    total_cost,
    inventory_transaction_id,
    notes,
    created_at,
    agricultural_input:agricultural_inputs (
      id,
      name,
      brand,
      base_unit
    ),
    inventory_lot:inventory_lots (
      id,
      batch_number,
      supplier,
      unit,
      unit_price,
      purchase_date
    ),
    inventory_transaction:inventory_transactions (
      id,
      transaction_type,
      occurred_at,
      quantity,
      unit,
      unit_cost,
      total_cost
    )
  )
`;function Ha(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function kc(t){var e,a,r;return{event_type:t.eventType,title:((e=t.title)==null?void 0:e.trim())||"",description:((a=t.description)==null?void 0:a.trim())||null,notes:((r=t.notes)==null?void 0:r.trim())||null,occurred_at:t.occurredAt||new Date().toISOString()}}async function Ac(t){const e=t.flatMap(n=>n.event_photos||[]),a=await Ec(e),r=new Map(a.map(n=>[n.id,n]));return t.map(n=>({...n,event_photos:(n.event_photos||[]).map(s=>r.get(s.id)||s)}))}async function Zn(t){const e=Ha(),{data:a,error:r}=await e.from("production_events").select(zr).eq("production_cycle_id",t).order("occurred_at",{ascending:!1});if(r)throw r;return Ac(a??[])}async function Cc(t){const e=Ha(),{data:a,error:r}=await e.from("production_events").select(zr).eq("id",t).maybeSingle();if(r)throw r;if(!a)return null;const[n]=await Ac([a]);return n}async function Tc(t,e){const a=Ha(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("production_events").insert({...kc(e),user_id:r.id,production_cycle_id:t}).select(zr).single();if(s)throw s;return n}async function Mf(t,e,a){const r=Ha(),n=await Z();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const{data:s,error:i}=await r.from("production_events").update(kc(a)).eq("id",t).eq("production_cycle_id",e).eq("user_id",n.id).select(zr).single();if(i)throw i;return s}async function Uf(t){const e=Ha(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{error:r}=await e.from("production_events").delete().eq("id",t).eq("user_id",a.id);if(r)throw r}function Hf(t,{cycleId:e,readonly:a=!1}={}){const r=t.event_photos||[],n=t.event_inputs||[],s=n.reduce((i,o)=>i+Number(o.total_cost||0),0);return`
    <article class="timeline-event">
      <div class="timeline-event__rail">
        <span class="timeline-event__icon">
          ${y(qo(t.event_type))}
        </span>

        <span class="timeline-event__line"></span>
      </div>

      <div class="timeline-event__card">
        <div class="timeline-event__header">
          <div>
            <span class="timeline-event__type">
              ${h(Rn(t.event_type))}
            </span>

            <h3>
              ${h(t.title)}
            </h3>
          </div>

          <time>
            ${Yt(t.occurred_at)}
          </time>
        </div>

        ${t.description?`
              <p class="timeline-event__description">
                ${h(t.description)}
              </p>
            `:""}

        ${t.notes?`
              <div class="timeline-event__notes">
                <strong>
                  Observações
                </strong>

                <p>
                  ${h(t.notes)}
                </p>
              </div>
            `:""}

        ${r.length?`
              <div class="timeline-event__photos">
                ${r.filter(i=>i.signed_url).slice(0,4).map(i=>`
                      <button
                        class="timeline-event__photo"
                        type="button"
                        data-photo-view="${h(i.signed_url)}"
                        data-photo-alt="${h(i.description||t.title||"Foto do evento")}"
                      >
                        <img
                          src="${h(i.signed_url)}"
                          alt="${h(i.description||t.title||"Foto do evento")}"
                          loading="lazy"
                        />
                      </button>
                    `).join("")}
              </div>
            `:""}

        ${n.length?`
              <div class="timeline-event__inputs">
                <div class="timeline-event__inputs-title">
                  <span>
                    Insumos utilizados
                  </span>

                  ${s>0?`
                        <span>
                          Custo:
                          ${X(s)}
                        </span>
                      `:""}
                </div>

                ${n.map(i=>{var o,c;return`
                      <div class="timeline-event__input">
                        <span class="timeline-event__input-icon">
                          ${y("box")}
                        </span>

                        <div class="timeline-event__input-content">
                          <strong>
                            ${h(((o=i.agricultural_input)==null?void 0:o.name)||"Insumo")}
                          </strong>

                          <span>
                            ${ae(i.quantity)}
                            ${h(i.unit)}
                            ${(c=i.inventory_lot)!=null&&c.batch_number?` • Lote ${h(i.inventory_lot.batch_number)}`:""}
                          </span>
                        </div>

                        ${i.total_cost!==null&&i.total_cost!==void 0?`
                              <span class="timeline-event__input-cost">
                                ${X(i.total_cost)}
                              </span>
                            `:""}
                      </div>
                    `}).join("")}
              </div>
            `:""}

        ${a?"":`
              <div class="timeline-event__actions">
                <a
                  href="/plantings/${e}/events/${t.id}/edit"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${y("edit")}
                  Editar
                </a>

                <a
                  href="/plantings/${e}/events/${t.id}/inputs/new"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${y("box")}
                  Adicionar insumo
                </a>

                <a
                  href="/plantings/${e}/evolution/new?event=${t.id}"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${y("camera")}
                  Adicionar foto
                </a>
              </div>
            `}
      </div>
    </article>
  `}function Lc({src:t,alt:e="Imagem da evolução"}){const a=document.querySelector("#modal-root");if(!a||!t)return;a.innerHTML=`
    <div
      class="photo-viewer"
      role="presentation"
    >
      <div
        class="photo-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Visualização da foto"
      >
        <button
          id="close-photo-viewer"
          class="photo-viewer__close"
          type="button"
          aria-label="Fechar imagem"
        >
          ×
        </button>

        <img
          src="${h(t)}"
          alt="${h(e)}"
        />
      </div>
    </div>
  `;const r=a.querySelector(".photo-viewer"),n=a.querySelector("#close-photo-viewer"),s=()=>{document.removeEventListener("keydown",i),a.innerHTML=""},i=o=>{o.key==="Escape"&&s()};n==null||n.addEventListener("click",s,{once:!0}),r==null||r.addEventListener("click",o=>{o.target===r&&s()}),document.addEventListener("keydown",i)}const Xn=[["own_consumption","Consumo próprio"],["sale","Venda"],["own_consumption_and_sale","Consumo próprio e venda"],["donation","Doação"],["loss","Perda"],["other","Outro"]];function Ar(t){var e;return((e=Xn.find(([a])=>a===t))==null?void 0:e[1])||t||"Não informado"}function La(t){return["sale","own_consumption_and_sale"].includes(t)}const Vr=`
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
`,Ff=`
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
`,Bf=["planted","developing","near_harvest","ready_to_harvest"];function na(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Rc(t){var e,a,r;return{harvest_date:t.harvestDate,quantity:Number(t.quantity),unit:((e=t.unit)==null?void 0:e.trim())||"",quality_classification:((a=t.qualityClassification)==null?void 0:a.trim())||null,destination:t.destination,notes:((r=t.notes)==null?void 0:r.trim())||null}}function zf(t){if(!t||!/^\d{4}-\d{2}$/.test(t))return null;const[e,a]=t.split("-").map(Number),r=`${e}-${String(a).padStart(2,"0")}-01`,n=new Date(e,a,1,12,0,0,0),s=[n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),"01"].join("-");return{start:r,end:s}}function es(t){const e=(t==null?void 0:t.sales)??[],a=e.reduce((s,i)=>s+Number(i.quantity||0),0),r=e.reduce((s,i)=>s+Number(i.total_value||0),0),n=Number((t==null?void 0:t.quantity)||0);return{salesCount:e.length,soldQuantity:a,grossRevenue:r,remainingQuantity:Math.max(0,n-a),allowsSales:La(t==null?void 0:t.destination)}}async function ts({cycleId:t=null,propertyId:e=null,destination:a=null,month:r=null,limit:n=null}={}){let i=na().from("harvests").select(Vr).order("harvest_date",{ascending:!1}).order("created_at",{ascending:!1});t&&(i=i.eq("production_cycle_id",t)),a&&(i=i.eq("destination",a));const o=zf(r);o&&(i=i.gte("harvest_date",o.start).lt("harvest_date",o.end)),Number.isInteger(n)&&n>0&&(i=i.limit(n));const{data:c,error:l}=await i;if(l)throw l;const d=c??[];return e?d.filter(u=>{var p;return((p=u.production_cycle)==null?void 0:p.property_id)===e}):d}async function Cr(t){const e=na(),{data:a,error:r}=await e.from("harvests").select(Vr).eq("id",t).maybeSingle();if(r)throw r;return a}async function Vf(){const t=na(),{data:e,error:a}=await t.from("production_cycles").select(Ff).is("deleted_at",null).in("status",Bf).order("current_harvest_forecast",{ascending:!0,nullsFirst:!1}).order("planting_date",{ascending:!1});if(a)throw a;return e??[]}async function Wf(t,e){const a=na(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("harvests").insert({...Rc(e),user_id:r.id,production_cycle_id:t}).select(Vr).single();if(s)throw s;return n}async function Gf(t,e){const a=na(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("harvests").update(Rc(e)).eq("id",t).eq("user_id",r.id).select(Vr).single();if(s)throw s;return n}async function Kf(t){const e=na(),{data:a,error:r}=await e.rpc("finalize_cycle_from_harvest",{p_harvest_id:t});if(r)throw r;return ja(),a}function Nn(t){var r,n,s,i;const e=((n=(r=t.production_cycle)==null?void 0:r.crop)==null?void 0:n.name)||"Colheita",a=(i=(s=t.production_cycle)==null?void 0:s.variety)==null?void 0:i.trim();return a?`${e} • ${a}`:e}function Pc(t){var e,a,r,n;return[(a=(e=t.production_cycle)==null?void 0:e.property)==null?void 0:a.name,(n=(r=t.production_cycle)==null?void 0:r.area)==null?void 0:n.name].filter(Boolean).join(" • ")||"Local não informado"}function qc(t){const e=es(t);return`
    <article class="harvest-card">
      <a
        href="/more/harvests/${t.id}"
        class="harvest-card__main"
        data-link
      >
        <div class="harvest-card__top">
          <span class="harvest-card__icon">
            ${y("harvest")}
          </span>

          <div class="harvest-card__identity">
            <h3>
              ${h(Nn(t))}
            </h3>

            <p>
              ${h(Pc(t))}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="harvest-card__metrics">
          <div>
            <span>Data</span>
            <strong>
              ${ne(t.harvest_date)}
            </strong>
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              ${ae(t.quantity)}
              ${h(t.unit)}
            </strong>
          </div>

          <div>
            <span>Destino</span>
            <strong>
              ${h(Ar(t.destination))}
            </strong>
          </div>
        </div>

        ${e.salesCount>0?`
              <div class="harvest-card__sales">
                <span>
                  ${e.salesCount} ${e.salesCount===1?"venda":"vendas"}
                </span>

                <strong>
                  ${X(e.grossRevenue)}
                </strong>
              </div>
            `:""}
      </a>
    </article>
  `}const xc=[["all","Todos"],["positive","Positivo"],["negative","Negativo"],["break_even","Empate"],["no_activity","Sem movimento"]];function Nc(t){const e=Number((t==null?void 0:t.input_cost)||0),a=Number((t==null?void 0:t.sales_revenue)||0),r=Number((t==null?void 0:t.estimated_result)||0);return e===0&&a===0?"no_activity":r>0?"positive":r<0?"negative":"break_even"}function Ic(t){switch(t){case"positive":return"Resultado positivo";case"negative":return"Resultado negativo";case"break_even":return"Empate";default:return"Sem movimentação financeira"}}function Oc(t){return`financial-result--${t}`}const jc=`
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
`,as=`
  production_cycle_id,
  user_id,
  input_cost,
  sales_revenue,
  estimated_result,
  usage_transactions_count,
  harvests_count,
  sales_count,
  gross_margin_percent
`;function Wr(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function oe(t){const e=Number(t);return Number.isFinite(e)?e:0}function Ra(t){const e={production_cycle_id:t.production_cycle_id,user_id:t.user_id,input_cost:oe(t.input_cost),sales_revenue:oe(t.sales_revenue),estimated_result:oe(t.estimated_result),usage_transactions_count:oe(t.usage_transactions_count),harvests_count:oe(t.harvests_count),sales_count:oe(t.sales_count),gross_margin_percent:t.gross_margin_percent===null||t.gross_margin_percent===void 0?null:oe(t.gross_margin_percent)};return{...e,result_state:Nc(e)}}async function Jf(){const t=Wr(),{data:e,error:a}=await t.rpc("financial_overview");if(a)throw a;const r=Array.isArray(e)?e[0]:e;return{cycles_count:oe(r==null?void 0:r.cycles_count),cycles_with_activity_count:oe(r==null?void 0:r.cycles_with_activity_count),positive_result_count:oe(r==null?void 0:r.positive_result_count),negative_result_count:oe(r==null?void 0:r.negative_result_count),break_even_count:oe(r==null?void 0:r.break_even_count),input_cost:oe(r==null?void 0:r.input_cost),sales_revenue:oe(r==null?void 0:r.sales_revenue),estimated_result:oe(r==null?void 0:r.estimated_result)}}async function Qf(){const t=Wr(),[e,a]=await Promise.all([t.from("production_cycle_financial_summary").select(as),t.from("production_cycles").select(jc).is("deleted_at",null).order("planting_date",{ascending:!1})]);if(e.error)throw e.error;if(a.error)throw a.error;const r=new Map((e.data??[]).map(n=>[n.production_cycle_id,Ra(n)]));return(a.data??[]).map(n=>{const s=r.get(n.id)||Ra({production_cycle_id:n.id,user_id:n.user_id,input_cost:0,sales_revenue:0,estimated_result:0,usage_transactions_count:0,harvests_count:0,sales_count:0,gross_margin_percent:null});return{...n,finance:s}})}async function Yf(t){const e=Wr(),{data:a,error:r}=await e.from("production_cycle_financial_summary").select(as).eq("production_cycle_id",t).maybeSingle();if(r)throw r;return a?Ra(a):null}async function Zf(t){const e=Wr(),[a,r,n,s,i]=await Promise.all([e.from("production_cycles").select(jc).eq("id",t).maybeSingle(),e.from("production_cycle_financial_summary").select(as).eq("production_cycle_id",t).maybeSingle(),e.from("production_cycle_input_cost_summary").select(`
          production_cycle_id,
          agricultural_input_id,
          input_name,
          brand,
          unit,
          quantity_used,
          usage_count,
          total_cost
        `).eq("production_cycle_id",t).order("total_cost",{ascending:!1}),e.from("production_cycle_harvest_quantity_summary").select(`
          production_cycle_id,
          unit,
          harvested_quantity,
          sold_quantity,
          remaining_quantity,
          gross_revenue,
          harvests_count,
          sales_count
        `).eq("production_cycle_id",t).order("unit",{ascending:!0}),e.from("harvests").select(`
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
        `).eq("production_cycle_id",t).order("harvest_date",{ascending:!1})]);for(const l of[a,r,n,s,i])if(l.error)throw l.error;if(!a.data)return null;const o=r.data?Ra(r.data):Ra({production_cycle_id:t,user_id:a.data.user_id,input_cost:0,sales_revenue:0,estimated_result:0,usage_transactions_count:0,harvests_count:0,sales_count:0,gross_margin_percent:null}),c=(i.data??[]).flatMap(l=>(l.sales??[]).map(d=>({...d,harvest:{...l,production_cycle:a.data}}))).sort((l,d)=>String(d.sale_date).localeCompare(String(l.sale_date)));return{cycle:a.data,summary:o,inputCosts:(n.data??[]).map(l=>({...l,quantity_used:oe(l.quantity_used),usage_count:oe(l.usage_count),total_cost:oe(l.total_cost)})),production:(s.data??[]).map(l=>({...l,harvested_quantity:oe(l.harvested_quantity),sold_quantity:oe(l.sold_quantity),remaining_quantity:oe(l.remaining_quantity),gross_revenue:oe(l.gross_revenue),harvests_count:oe(l.harvests_count),sales_count:oe(l.sales_count)})),harvests:i.data??[],sales:c}}async function Xf({session:t,params:e}){var _,w,k,S,T;const a=document.querySelector("#app");let r=null;try{r=await ta(e.cycleId)}catch(A){console.error("Erro ao carregar plantio:",A)}if(!r)return a.innerHTML=O({session:t,title:"Plantio",eyebrow:"Ciclos produtivos",activeNav:"plantings",content:B({iconName:"sprout",title:"Plantio não encontrado",description:"Este ciclo não existe ou não pertence à sua conta.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;const n=!!r.deleted_at,s=Vn(r),i=ic(r);let o=[],c=[],l=null;try{[o,c]=await Promise.all([Zn(r.id),ts({cycleId:r.id})])}catch(A){console.error("Erro ao carregar linha do tempo:",A)}try{l=await Yf(r.id)}catch(A){console.warn("Resumo financeiro ainda não disponível:",A)}a.innerHTML=O({session:t,title:"Plantio",eyebrow:"Ciclo produtivo",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="/plantings"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Plantios
            </a>
          </div>
        </section>

        <section class="cycle-detail-hero">
          <div class="cycle-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(sc(r))}
              </p>

              <h2>
                ${h(Fr(r))}
              </h2>

              <p>
                ${h(((_=r.season)==null?void 0:_.name)||"Sem safra vinculada")}
              </p>
            </div>

            ${n?`
                  <span class="property-status property-status--archived">
                    Arquivado
                  </span>
                `:`
                  <span
                    class="
                      cycle-status
                      ${Jo(r.status)}
                    "
                  >
                    ${h(kt(r.status))}
                  </span>
                `}
          </div>

          ${n?`
                <div class="property-detail-actions">
                  <button
                    id="restore-cycle"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("refresh")}
                    Restaurar plantio
                  </button>
                </div>
              `:`
                <div class="property-detail-actions">
                  <a
                    href="/plantings/${r.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>

                  <button
                    id="archive-cycle"
                    class="button button--danger"
                    type="button"
                  >
                    ${y("archive")}
                    Arquivar
                  </button>
                </div>
              `}
        </section>

        <section class="cycle-metrics-grid">
          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${y("calendar")}
            </span>

            <div>
              <strong>
                ${h(s.plantingText)}
              </strong>

              <span>
                Plantio: ${ne(r.planting_date)}
              </span>
            </div>
          </article>

          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${y("harvest")}
            </span>

            <div>
              <strong
                class="${s.delayedDays>0?"text-danger":""}"
              >
                ${h(s.forecastText)}
              </strong>

              <span>
                Atual: ${ne(r.current_harvest_forecast)}
              </span>
            </div>
          </article>

          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${y("chart")}
            </span>

            <div>
              <strong>
                ${s.progressPercent!==null?`${s.progressPercent}%`:"-"}
              </strong>

              <span>
                Ciclo estimado concluído
              </span>
            </div>
          </article>
        </section>

        ${s.progressPercent!==null?`
              <section class="cycle-detail-progress">
                <div class="cycle-progress__row">
                  <span>
                    Progresso aproximado
                  </span>

                  <strong>
                    ${s.progressPercent}%
                  </strong>
                </div>

                <div class="cycle-progress__track">
                  <span
                    style="width: ${s.progressPercent}%"
                  ></span>
                </div>
              </section>
            `:""}

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Propriedade
            </p>
            <p class="detail-card__value">
              ${h(((w=r.property)==null?void 0:w.name)||"-")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Área
            </p>
            <p class="detail-card__value">
              ${h(((k=r.area)==null?void 0:k.name)||"-")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Safra
            </p>
            <p class="detail-card__value">
              ${h(((S=r.season)==null?void 0:S.name)||"Sem safra")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cultura
            </p>
            <p class="detail-card__value">
              ${h(((T=r.crop)==null?void 0:T.name)||"-")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Variedade
            </p>
            <p class="detail-card__value">
              ${h(r.variety||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Quantidade plantada
            </p>
            <p class="detail-card__value">
              ${h(i||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Previsão inicial
            </p>
            <p class="detail-card__value">
              ${ne(r.initial_harvest_forecast)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data real da colheita
            </p>
            <p class="detail-card__value">
              ${ne(r.final_harvest_date)}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <section class="cycle-harvest-section">
          <div class="cycle-harvest-section__header">
            <div>
              <p class="section-eyebrow">
                Colheitas
              </p>

              <h2>
                Produção colhida
              </h2>

              <p>
                ${c.length} ${c.length===1?"colheita registrada":"colheitas registradas"} neste ciclo.
              </p>
            </div>

            ${n||["harvested","closed","cancelled"].includes(r.status)?"":`
                  <a
                    href="/plantings/${r.id}/harvests/new"
                    class="button button--primary button--compact"
                    data-link
                  >
                    ${y("plus")}
                    Registrar colheita
                  </a>
                `}
          </div>

          ${c.length?`
                <div class="cycle-harvest-list">
                  ${c.slice(0,3).map(qc).join("")}
                </div>

                ${c.length>3?`
                      <a
                        href="/more/harvests?cycle=${r.id}"
                        class="button button--ghost button--full"
                        data-link
                      >
                        Ver todas as colheitas
                      </a>
                    `:""}
              `:`
                <div class="dashboard-empty-inline dashboard-empty-inline--wide">
                  <span class="dashboard-empty-inline__icon">
                    ${y("harvest")}
                  </span>

                  <div>
                    <strong>
                      Nenhuma colheita registrada
                    </strong>

                    <span>
                      Registre cada retirada separadamente para preservar colheitas parciais e sucessivas.
                    </span>
                  </div>
                </div>
              `}
        </section>

        ${l?`
              <section class="cycle-finance-summary">
                <div class="cycle-finance-summary__header">
                  <div>
                    <p class="section-eyebrow">
                      Financeiro
                    </p>

                    <h2>
                      Resultado básico do ciclo
                    </h2>

                    <p>
                      Considera receitas de vendas e custos dos insumos consumidos.
                    </p>
                  </div>

                  <a
                    href="/more/finance/${r.id}"
                    class="button button--secondary button--compact"
                    data-link
                  >
                    ${y("chart")}
                    Ver detalhes
                  </a>
                </div>

                <div class="cycle-finance-summary__metrics">
                  <div>
                    <span>
                      Custos
                    </span>

                    <strong class="finance-value--cost">
                      ${X(l.input_cost)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Receita
                    </span>

                    <strong class="finance-value--revenue">
                      ${X(l.sales_revenue)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Resultado
                    </span>

                    <strong
                      class="${l.estimated_result>0?"finance-value--positive":l.estimated_result<0?"finance-value--negative":""}"
                    >
                      ${X(l.estimated_result)}
                    </strong>
                  </div>
                </div>
              </section>
            `:""}

        <section
          id="timeline"
          class="timeline-section"
        >
          <div class="timeline-section__header">
            <div>
              <h2>
                Linha do tempo
              </h2>

              <p>
                ${o.length} ${o.length===1?"evento registrado":"eventos registrados"} neste ciclo.
              </p>
            </div>

            <div class="timeline-section__actions">
              <a
                href="/plantings/${r.id}/evolution"
                class="button button--secondary button--compact"
                data-link
              >
                ${y("camera")}
                Evolução
              </a>

              ${n?"":`
                    <a
                      href="/plantings/${r.id}/events/new"
                      class="button button--primary button--compact"
                      data-link
                    >
                      ${y("plus")}
                      Novo evento
                    </a>
                  `}
            </div>
          </div>

          ${o.length?`
                <div class="timeline-list">
                  ${o.map(A=>Hf(A,{cycleId:r.id,readonly:n})).join("")}
                </div>
              `:`
                <div class="dashboard-empty-inline dashboard-empty-inline--wide">
                  <span class="dashboard-empty-inline__icon">
                    ${y("clipboard")}
                  </span>

                  <div>
                    <strong>
                      Nenhum evento registrado
                    </strong>

                    <span>
                      O evento inicial é criado com o plantio. Registre novas atividades aqui.
                    </span>
                  </div>
                </div>
              `}
        </section>
      `});const d=document.querySelector("#archive-cycle"),u=document.querySelector("#restore-cycle"),p=async()=>{if(await ie({title:"Arquivar plantio?",message:"O ciclo deixará a listagem normal, mas permanecerá armazenado para preservar todo o histórico.",confirmLabel:"Arquivar",danger:!0})){d.disabled=!0;try{await Gm(r.id),j("Plantio arquivado.",{type:"success"}),Q("/plantings",{replace:!0})}catch(C){console.error("Erro ao arquivar plantio:",C),j(K(C),{type:"error"}),d.disabled=!1}}},m=async()=>{if(await ie({title:"Restaurar plantio?",message:"As referências da propriedade, área, safra e cultura serão verificadas novamente antes da restauração.",confirmLabel:"Restaurar"})){u.disabled=!0;try{await rc(r.id),j("Plantio restaurado.",{type:"success"}),Q(`/plantings/${r.id}`,{replace:!0})}catch(C){console.error("Erro ao restaurar plantio:",C),j(K(C),{type:"error"}),u.disabled=!1}}};d==null||d.addEventListener("click",p),u==null||u.addEventListener("click",m);const f=document.querySelector("#timeline"),v=A=>{const C=A.target.closest("[data-photo-view]");C&&Lc({src:C.dataset.photoView,alt:C.dataset.photoAlt||"Foto do evento"})};return f==null||f.addEventListener("click",v),()=>{d==null||d.removeEventListener("click",p),u==null||u.removeEventListener("click",m),f==null||f.removeEventListener("click",v)}}function ev(t){return Wn.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${h(a)}
        </option>
      `).join("")}function tv(t){return t.eventType?t.title.length<2?"Informe um título com pelo menos 2 caracteres.":t.occurredAt?null:"Informe a data e o horário do evento.":"Selecione o tipo do evento."}async function Ri({session:t,params:e,mode:a}){var w,k;const r=document.querySelector("#app"),n=a==="edit";let s=null,i=null;try{s=await ta(e.cycleId),n&&(i=await Cc(e.eventId))}catch(S){console.error("Erro ao preparar evento:",S)}if(!s||s.deleted_at)return r.innerHTML=O({session:t,title:"Evento",eyebrow:"Linha do tempo",activeNav:"plantings",content:B({iconName:"clipboard",title:"Ciclo indisponível",description:"Novos eventos só podem ser registrados em ciclos produtivos ativos.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;if(n&&(!i||i.production_cycle_id!==s.id))return r.innerHTML=O({session:t,title:"Evento",eyebrow:"Linha do tempo",activeNav:"plantings",content:B({iconName:"clipboard",title:"Evento não encontrado",description:"Este evento não pertence ao ciclo informado.",actionLabel:"Voltar para o plantio",actionHref:`/plantings/${s.id}`})}),null;const o=(i==null?void 0:i.event_type)||"observation";r.innerHTML=O({session:t,title:n?"Editar evento":"Novo evento",eyebrow:((w=s.crop)==null?void 0:w.name)||"Ciclo produtivo",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${s.id}#timeline"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Linha do tempo
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar evento":"Registrar atividade"}
            </h2>

            <p>
              Cada operação fica armazenada como um evento independente do ciclo produtivo.
            </p>
          </div>
        </section>

        <div
          id="event-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="event-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Atividade
              </h2>

              <p>
                Informe o tipo, o título e quando a atividade ocorreu.
              </p>
            </div>

            <div class="field">
              <label
                for="event-type"
              >
                Tipo *
              </label>

              <select
                id="event-type"
                name="eventType"
                required
              >
                ${ev(o)}
              </select>
            </div>

            <div class="field">
              <label
                for="event-title"
              >
                Título *
              </label>

              <input
                id="event-title"
                name="title"
                type="text"
                minlength="2"
                maxlength="180"
                placeholder="Ex.: Irrigação do talhão"
                value="${h((i==null?void 0:i.title)||"")}"
                required
              />
            </div>

            <div class="field">
              <label
                for="event-occurred-at"
              >
                Data e horário *
              </label>

              <input
                id="event-occurred-at"
                name="occurredAt"
                type="datetime-local"
                value="${h(ya((i==null?void 0:i.occurred_at)||new Date))}"
                required
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Detalhes
              </h2>

              <p>
                Descreva o que foi feito e registre observações importantes.
              </p>
            </div>

            <div class="field">
              <label
                for="event-description"
              >
                Descrição
              </label>

              <textarea
                id="event-description"
                name="description"
                maxlength="1600"
                placeholder="Ex.: Irrigação realizada por 40 minutos."
              >${h((i==null?void 0:i.description)||"")}</textarea>
            </div>

            <div class="field">
              <label
                for="event-notes"
              >
                Observações
              </label>

              <textarea
                id="event-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: solo ainda apresentava boa umidade na parte baixa."
              >${h((i==null?void 0:i.notes)||"")}</textarea>
            </div>
          </section>

          ${n&&((k=i==null?void 0:i.event_photos)!=null&&k.length)?`
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Fotos relacionadas
                    </h2>

                    <p>
                      Este evento possui ${i.event_photos.length} ${i.event_photos.length===1?"foto relacionada":"fotos relacionadas"}.
                    </p>
                  </div>

                  <a
                    href="/plantings/${s.id}/evolution/new?event=${i.id}"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("camera")}
                    Adicionar outra foto
                  </a>
                </section>
              `:""}

          ${n?`
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Insumos utilizados
                    </h2>

                    <p>
                      O consumo gera automaticamente uma saída de estoque e captura o custo do lote.
                    </p>
                  </div>

                  <a
                    href="/plantings/${s.id}/events/${i.id}/inputs/new"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("box")}
                    Adicionar insumo utilizado
                  </a>
                </section>
              `:""}

          <div class="property-form-actions">
            <a
              href="/plantings/${s.id}#timeline"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="event-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Registrar evento"}
            </button>
          </div>
        </form>
      `});const c=document.querySelector("#event-form"),l=document.querySelector("#event-form-feedback"),d=document.querySelector("#event-submit"),u=document.querySelector("#event-type"),p=document.querySelector("#event-title");let m=!!(i!=null&&i.title);const f=()=>{m=p.value.trim().length>0},v=()=>{!n&&!m&&(p.value=Rn(u.value))},_=async S=>{S.preventDefault(),D(l,"");const T=new FormData(c),A={eventType:String(T.get("eventType")||""),title:String(T.get("title")||"").trim(),occurredAt:Fn(String(T.get("occurredAt")||"")),description:String(T.get("description")||"").trim(),notes:String(T.get("notes")||"").trim()},C=tv(A);if(C){D(l,C);return}te(d,!0,n?"Salvando…":"Registrando…");try{n?await Mf(i.id,s.id,A):await Tc(s.id,A),j(n?"Evento atualizado.":"Evento registrado na linha do tempo.",{type:"success"}),Q(`/plantings/${s.id}#timeline`,{replace:!0})}catch(I){console.error("Erro ao salvar evento:",I),D(l,K(I))}finally{te(d,!1)}};return p.addEventListener("input",f),u.addEventListener("change",v),c.addEventListener("submit",_),!n&&!p.value&&(p.value=Rn(o),m=!1),()=>{p.removeEventListener("input",f),u.removeEventListener("change",v),c.removeEventListener("submit",_)}}function pn(t,e){const a=br(e.captured_at,t.planting_date);return a===null?"Evolução":a<0?"Antes do plantio":`Dia ${a+1}`}function Pi(t,e,a){return e.length?`
    <section class="evolution-gallery">
      ${e.map(r=>{var n;return`
            <article class="evolution-photo-card">
              <button
                class="evolution-photo-card__image"
                type="button"
                ${r.signed_url?`data-photo-view="${h(r.signed_url)}"`:"disabled"}
                data-photo-alt="${h(r.description||pn(t,r))}"
              >
                ${r.signed_url?`
                      <img
                        src="${h(r.signed_url)}"
                        alt="${h(r.description||pn(t,r))}"
                        loading="lazy"
                      />
                    `:`
                      <span class="evolution-photo-card__missing">
                        ${y("camera")}
                        Imagem indisponível
                      </span>
                    `}
              </button>

              <div class="evolution-photo-card__body">
                <div class="evolution-photo-card__heading">
                  <strong>
                    ${h(pn(t,r))}
                  </strong>

                  <time>
                    ${Yt(r.captured_at)}
                  </time>
                </div>

                ${r.description?`
                      <p>
                        ${h(r.description)}
                      </p>
                    `:""}

                ${(n=r.production_event)!=null&&n.title?`
                      <span class="evolution-photo-card__event">
                        ${y("clipboard")}
                        ${h(r.production_event.title)}
                      </span>
                    `:""}

                ${a?"":`
                      <button
                        class="button button--ghost button--compact evolution-photo-card__delete"
                        type="button"
                        data-delete-photo="${r.id}"
                      >
                        ${y("trash")}
                        Remover foto
                      </button>
                    `}
              </div>
            </article>
          `}).join("")}
    </section>
  `:B({iconName:"camera",title:"Nenhuma foto registrada",description:"Adicione imagens ao longo do ciclo para acompanhar visualmente a evolução da área.",actionLabel:a?null:"Adicionar primeira foto",actionHref:a?null:`/plantings/${t.id}/evolution/new`})}async function av({session:t,params:e}){var c,l;const a=document.querySelector("#app");let r=null,n=[];try{r=await ta(e.cycleId),r&&(n=await jf(r.id))}catch(d){console.error("Erro ao carregar evolução:",d)}if(!r)return a.innerHTML=O({session:t,title:"Evolução",eyebrow:"Fotos",activeNav:"plantings",content:B({iconName:"camera",title:"Ciclo não encontrado",description:"Não foi possível carregar a evolução visual.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;const s=!!r.deleted_at;a.innerHTML=O({session:t,title:"Evolução",eyebrow:((c=r.crop)==null?void 0:c.name)||"Ciclo produtivo",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${r.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Plantio
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Evolução visual
            </h2>

            <p>
              Fotos em ordem cronológica para acompanhar as mudanças do ciclo produtivo.
            </p>
          </div>

          ${s?"":`
                <a
                  href="/plantings/${r.id}/evolution/new"
                  class="icon-button"
                  aria-label="Adicionar foto"
                  data-link
                >
                  ${y("camera")}
                </a>
              `}
        </section>

        <section class="evolution-summary">
          <div>
            <strong>
              ${n.length}
            </strong>

            <span>
              ${n.length===1?"foto registrada":"fotos registradas"}
            </span>
          </div>

          <div>
            <strong>
              ${h(((l=r.area)==null?void 0:l.name)||"-")}
            </strong>

            <span>
              Área acompanhada
            </span>
          </div>

          ${s?`
                <span class="property-status property-status--archived">
                  Somente leitura
                </span>
              `:`
                <a
                  href="/plantings/${r.id}/evolution/new"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${y("plus")}
                  Adicionar foto
                </a>
              `}
        </section>

        <div id="evolution-gallery-root">
          ${Pi(r,n,s)}
        </div>
      `});const i=document.querySelector("#evolution-gallery-root"),o=async d=>{const u=d.target.closest("[data-photo-view]");if(u){Lc({src:u.dataset.photoView,alt:u.dataset.photoAlt||"Foto da evolução"});return}const p=d.target.closest("[data-delete-photo]");if(!p||s)return;const m=n.find(v=>v.id===p.dataset.deletePhoto);if(!(!m||!await ie({title:"Remover foto?",message:"O arquivo será removido da evolução visual. O evento relacionado continuará preservado na linha do tempo.",confirmLabel:"Remover",danger:!0}))){p.disabled=!0;try{await Df(m),n=n.filter(v=>v.id!==m.id),i.innerHTML=Pi(r,n,s),j("Foto removida.",{type:"success"})}catch(v){console.error("Erro ao remover foto:",v),j(K(v),{type:"error"}),p.disabled=!1}}};return i.addEventListener("click",o),()=>{i.removeEventListener("click",o)}}var Mt;(function(t){t.Prompt="PROMPT",t.Camera="CAMERA",t.Photos="PHOTOS"})(Mt||(Mt={}));var Ut;(function(t){t.Rear="REAR",t.Front="FRONT"})(Ut||(Ut={}));var qi;(function(t){t.Uri="uri",t.Base64="base64",t.DataUrl="dataUrl"})(qi||(qi={}));var Tr;(function(t){t[t.Photo=0]="Photo",t[t.Video=1]="Video"})(Tr||(Tr={}));var _a;(function(t){t[t.Photo=0]="Photo",t[t.Video=1]="Video",t[t.All=2]="All"})(_a||(_a={}));var xi;(function(t){t[t.JPEG=0]="JPEG",t[t.PNG=1]="PNG"})(xi||(xi={}));var Ni;(function(t){t.CameraPermissionDenied="OS-PLUG-CAMR-0003",t.GalleryPermissionDenied="OS-PLUG-CAMR-0005",t.NoCameraAvailable="OS-PLUG-CAMR-0007",t.TakePhotoCancelled="OS-PLUG-CAMR-0006",t.TakePhotoFailed="OS-PLUG-CAMR-0010",t.TakePhotoInvalidArguments="OS-PLUG-CAMR-0014",t.InvalidImageData="OS-PLUG-CAMR-0008",t.EditPhotoFailed="OS-PLUG-CAMR-0009",t.EditPhotoCancelled="OS-PLUG-CAMR-0013",t.EditPhotoEmptyUri="OS-PLUG-CAMR-0024",t.ImageNotFound="OS-PLUG-CAMR-0011",t.ProcessImageFailed="OS-PLUG-CAMR-0012",t.ChooseMediaFailed="OS-PLUG-CAMR-0018",t.ChooseMediaCancelled="OS-PLUG-CAMR-0020",t.MediaPathError="OS-PLUG-CAMR-0021",t.FetchImageFromUriFailed="OS-PLUG-CAMR-0028",t.RecordVideoFailed="OS-PLUG-CAMR-0016",t.RecordVideoCancelled="OS-PLUG-CAMR-0017",t.VideoNotFound="OS-PLUG-CAMR-0025",t.PlayVideoFailed="OS-PLUG-CAMR-0023",t.EncodeResultFailed="OS-PLUG-CAMR-0019",t.FileNotFound="OS-PLUG-CAMR-0027",t.InvalidArgument="OS-PLUG-CAMR-0031",t.GeneralError="OS-PLUG-CAMR-0026"})(Ni||(Ni={}));class rv extends Ir{async takePhoto(e){return new Promise(async(a,r)=>{e.webUseInput?this.takePhotoCameraInputExperience(e,a,r):this.takePhotoCameraExperience(e,a,r)})}async recordVideo(e){throw this.unimplemented("recordVideo is not implemented on Web.")}async playVideo(e){throw this.unimplemented("playVideo is not implemented on Web.")}async chooseFromGallery(e){return new Promise(async(a,r)=>{this.galleryInputExperience(e,a,r)})}async editPhoto(e){throw this.unimplemented("editPhoto is not implemented on Web.")}async editURIPhoto(e){throw this.unimplemented("editURIPhoto is not implemented on Web.")}async getPhoto(e){return new Promise(async(a,r)=>{if(e.webUseInput||e.source===Mt.Photos)this.fileInputExperience(e,a,r);else if(e.source===Mt.Prompt){let n=document.querySelector("pwa-action-sheet");n||(n=document.createElement("pwa-action-sheet"),document.body.appendChild(n)),n.header=e.promptLabelHeader||"Photo",n.cancelable=!1,n.options=[{title:e.promptLabelPhoto||"From Photos"},{title:e.promptLabelPicture||"Take Picture"}],n.addEventListener("onSelection",async s=>{s.detail===0?this.fileInputExperience(e,a,r):this.cameraExperience(e,a,r)})}else this.cameraExperience(e,a,r)})}async pickImages(e){return new Promise(async(a,r)=>{this.multipleFileInputExperience(a,r)})}async cameraExperience(e,a,r){await this._setupPWACameraModal(e.direction,n=>this._getCameraPhoto(n,e),()=>this.fileInputExperience(e,a,r),a,r)}fileInputExperience(e,a,r){let n=document.querySelector("#_capacitor-camera-input");const s=()=>{var i;(i=n.parentNode)===null||i===void 0||i.removeChild(n)};n||(n=document.createElement("input"),n.id="_capacitor-camera-input",n.type="file",n.hidden=!0,document.body.appendChild(n),n.addEventListener("change",i=>{const o=n.files[0];let c="jpeg";if(o.type==="image/png"?c="png":o.type==="image/gif"&&(c="gif"),e.resultType==="dataUrl"||e.resultType==="base64"){const l=new FileReader;l.addEventListener("load",()=>{if(e.resultType==="dataUrl")a({dataUrl:l.result,format:c});else if(e.resultType==="base64"){const d=l.result.split(",")[1];a({base64String:d,format:c})}s()}),l.readAsDataURL(o)}else a({webPath:URL.createObjectURL(o),format:c}),s()}),n.addEventListener("cancel",i=>{r(new Xe("User cancelled photos app")),s()})),n.accept="image/*",n.capture=!0,e.source===Mt.Photos||e.source===Mt.Prompt?n.removeAttribute("capture"):e.direction===Ut.Front?n.capture="user":e.direction===Ut.Rear&&(n.capture="environment"),n.click()}multipleFileInputExperience(e,a){let r=document.querySelector("#_capacitor-camera-input-multiple");const n=()=>{var s;(s=r.parentNode)===null||s===void 0||s.removeChild(r)};r||(r=document.createElement("input"),r.id="_capacitor-camera-input-multiple",r.type="file",r.hidden=!0,r.multiple=!0,document.body.appendChild(r),r.addEventListener("change",s=>{const i=[];for(let o=0;o<r.files.length;o++){const c=r.files[o];let l="jpeg";c.type==="image/png"?l="png":c.type==="image/gif"&&(l="gif"),i.push({webPath:URL.createObjectURL(c),format:l})}e({photos:i}),n()}),r.addEventListener("cancel",s=>{a(new Xe("User cancelled photos app")),n()})),r.accept="image/*",r.click()}_getCameraPhoto(e,a){return new Promise((r,n)=>{const s=new FileReader,i=this._getFileFormat(e);a.resultType==="uri"?r({webPath:URL.createObjectURL(e),format:i,saved:!1}):(s.readAsDataURL(e),s.onloadend=()=>{const o=s.result;a.resultType==="dataUrl"?r({dataUrl:o,format:i,saved:!1}):r({base64String:o.split(",")[1],format:i,saved:!1})},s.onerror=o=>{n(o)})})}async takePhotoCameraExperience(e,a,r){await this._setupPWACameraModal(e.cameraDirection,n=>{var s;return this._buildPhotoMediaResult(n,(s=e.includeMetadata)!==null&&s!==void 0?s:!1)},()=>this.takePhotoCameraInputExperience(e,a,r),a,r)}takePhotoCameraInputExperience(e,a,r){const n=this._createFileInput("_capacitor-camera-input-takephoto"),s=()=>{var i;(i=n.parentNode)===null||i===void 0||i.removeChild(n)};n.onchange=async i=>{var o;if(!this._validateFileInput(n,r,s))return;const c=n.files[0];a(await this._buildPhotoMediaResult(c,(o=e.includeMetadata)!==null&&o!==void 0?o:!1)),s()},n.oncancel=()=>{r(new Xe("User cancelled photos app")),s()},n.accept="image/*",e.cameraDirection===Ut.Front?n.capture="user":n.capture="environment",n.click()}galleryInputExperience(e,a,r){var n,s;const i=this._createFileInput("_capacitor-camera-input-gallery");i.multiple=(n=e.allowMultipleSelection)!==null&&n!==void 0?n:!1;const o=()=>{var l;(l=i.parentNode)===null||l===void 0||l.removeChild(i)};i.onchange=async l=>{var d;if(!this._validateFileInput(i,r,o))return;const u=[];for(let p=0;p<i.files.length;p++){const m=i.files[p];if(m.type.startsWith("image/"))u.push(await this._buildPhotoMediaResult(m,(d=e.includeMetadata)!==null&&d!==void 0?d:!1));else if(m.type.startsWith("video/")){const f=this._getFileFormat(m);let v,_,w;try{const S=await this._getVideoMetadata(m);v=S.thumbnail,e.includeMetadata&&(_=S.resolution,w=S.duration)}catch(S){console.warn("Failed to get video metadata:",S)}const k={type:Tr.Video,thumbnail:v,webPath:URL.createObjectURL(m),saved:!1};e.includeMetadata&&(k.metadata={format:f,resolution:_,size:m.size,creationDate:new Date(m.lastModified).toISOString(),duration:w}),u.push(k)}}a({results:u}),o()},i.oncancel=()=>{r(new Xe("User cancelled photos app")),o()};const c=(s=e.mediaType)!==null&&s!==void 0?s:_a.Photo;c===_a.Photo?i.accept="image/*":c===_a.Video?i.accept="video/*":i.accept="image/*,video/*",i.click()}_getFileFormat(e){return e.type==="image/png"?"png":e.type==="image/gif"?"gif":e.type.startsWith("video/")?e.type.split("/")[1]:e.type.startsWith("image/")?"jpeg":e.type.split("/")[1]||"jpeg"}async _buildPhotoMediaResult(e,a){const r=this._getFileFormat(e),n=await this._getBase64FromFile(e),s={type:Tr.Photo,thumbnail:n,webPath:URL.createObjectURL(e),saved:!1};if(a){const i=await this._getImageResolution(e);s.metadata={format:r,resolution:i,size:e.size,creationDate:"lastModified"in e?new Date(e.lastModified).toISOString():new Date().toISOString()}}return s}_validateFileInput(e,a,r){if(!e.files||e.files.length===0){const n=e.multiple?"No files selected":"No file selected";return a(new Xe(n)),r(),!1}return!0}async _setupPWACameraModal(e,a,r,n,s){if(customElements.get("pwa-camera-modal")){const i=document.createElement("pwa-camera-modal");i.facingMode=e===Ut.Front?"user":"environment",document.body.appendChild(i);try{await i.componentOnReady(),i.addEventListener("onPhoto",async o=>{const c=o.detail;c===null?s(new Xe("User cancelled photos app")):c instanceof Error?s(c):n(await a(c)),i.dismiss(),document.body.removeChild(i)}),i.present()}catch{r()}}else console.error("Unable to load PWA Element 'pwa-camera-modal'. See the docs: https://capacitorjs.com/docs/web/pwa-elements."),r()}_createFileInput(e){let a=document.querySelector(`#${e}`);return a||(a=document.createElement("input"),a.id=e,a.type="file",a.hidden=!0,document.body.appendChild(a)),a}async _getImageResolution(e){try{const a=await createImageBitmap(e),r=`${a.width}x${a.height}`;return a.close(),r}catch(a){console.warn("Failed to get image resolution:",a);return}}_getBase64FromFile(e){return new Promise((a,r)=>{const n=new FileReader;n.onloadend=()=>{const i=n.result.split(",")[1];a(i)},n.onerror=s=>{r(s)},n.readAsDataURL(e)})}_getVideoMetadata(e){return new Promise(a=>{const r=document.createElement("video");r.preload="metadata",r.muted=!0,r.onloadedmetadata=()=>{const n=Math.min(1,r.duration*.1);r.currentTime=n},r.onseeked=()=>{const n={resolution:`${r.videoWidth}x${r.videoHeight}`,duration:r.duration};try{const s=document.createElement("canvas");s.width=r.videoWidth,s.height=r.videoHeight;const i=s.getContext("2d");i&&(i.drawImage(r,0,0,s.width,s.height),n.thumbnail=s.toDataURL("image/jpeg",.8).split(",")[1])}catch(s){console.warn("Failed to generate video thumbnail:",s)}URL.revokeObjectURL(r.src),a(n)},r.onerror=()=>{URL.revokeObjectURL(r.src),a({})},r.src=URL.createObjectURL(e)})}async checkPermissions(){if(typeof navigator>"u"||!navigator.permissions)throw this.unavailable("Permissions API not available in this browser");try{return{camera:(await window.navigator.permissions.query({name:"camera"})).state,photos:"granted"}}catch{throw this.unavailable("Camera permissions are not available in this browser")}}async requestPermissions(){throw this.unimplemented("Not implemented on web.")}async pickLimitedLibraryPhotos(){throw this.unavailable("Not implemented on web.")}async getLimitedLibraryPhotos(){throw this.unavailable("Not implemented on web.")}}const Dc=wt("Camera",{web:()=>new rv});function rs(){return Ee.isNativePlatform()}function nv(t){const e=String(t||"").trim().toLowerCase();return e==="jpeg"||e==="jpg"?{extension:"jpg",mime:"image/jpeg"}:e==="png"?{extension:"png",mime:"image/png"}:e==="webp"?{extension:"webp",mime:"image/webp"}:{extension:"jpg",mime:"image/jpeg"}}async function Mc(t,e){var c,l,d,u,p;const a=(t==null?void 0:t.webPath)||(t!=null&&t.path?Ee.convertFileSrc(t.path):null);if(!a)throw new Error("A imagem retornada pelo dispositivo não possui um caminho de leitura válido.");const r=await fetch(a);if(!r.ok)throw new Error("Não foi possível ler a imagem selecionada no dispositivo.");const n=await r.blob(),s=nv(t.format||((l=(c=n.type)==null?void 0:c.split("/"))==null?void 0:l[1])),i=(d=n.type)!=null&&d.startsWith("image/")?n.type:s.mime;return{file:new File([n],`${e}-${Date.now()}.${s.extension}`,{type:i,lastModified:Date.now()}),previewPath:a,webPath:t.webPath||a,capturedAt:((u=t.exif)==null?void 0:u.DateTimeOriginal)||((p=t.exif)==null?void 0:p.DateTimeDigitized)||null}}function sv(){return rs()}async function iv(){if(!rs())throw new Error("A câmera nativa está disponível no aplicativo Android.");const t=await Dc.takePhoto({quality:88,targetWidth:1920,targetHeight:1920,correctOrientation:!0,saveToGallery:!1,editable:"no",includeMetadata:!0});return Mc(t,"meu-agro-camera")}async function ov(){var a;if(!rs())throw new Error("Use o seletor de arquivo do navegador para escolher uma imagem.");const e=(a=(await Dc.chooseFromGallery({allowMultipleSelection:!1,quality:90,targetWidth:1920,targetHeight:1920,correctOrientation:!0,editable:"no",includeMetadata:!0})).results)==null?void 0:a[0];return e?Mc(e,"meu-agro-galeria"):null}function cv(t,e){return`
    <option value="__auto__">
      Criar evento fotográfico automaticamente
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(`${Yt(a.occurred_at)} • ${a.title}`)}
          </option>
        `).join("")}
  `}async function lv({session:t,params:e}){var P;const a=document.querySelector("#app");let r=null,n=[];try{r=await ta(e.cycleId),r&&(n=await Zn(r.id))}catch(N){console.error("Erro ao preparar foto:",N)}if(!r||r.deleted_at)return a.innerHTML=O({session:t,title:"Adicionar foto",eyebrow:"Evolução",activeNav:"plantings",content:B({iconName:"camera",title:"Ciclo indisponível",description:"Fotos novas só podem ser adicionadas a ciclos ativos.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;const i=new URLSearchParams(window.location.search).get("event"),o=n.some(N=>N.id===i)?i:"__auto__",c=n.find(N=>N.id===o),l=sv();a.innerHTML=O({session:t,title:"Adicionar foto",eyebrow:((P=r.crop)==null?void 0:P.name)||"Evolução visual",activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${r.id}/evolution"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Evolução
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Registrar imagem
            </h2>

            <p>
              A foto será armazenada no bucket privado do Meu Agro e ligada ao ciclo produtivo.
            </p>
          </div>
        </section>

        <div
          id="photo-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="photo-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Imagem
              </h2>

              <p>
                Formatos aceitos: JPG, PNG e WebP. Tamanho máximo: 8 MB.
              </p>
            </div>

            <div class="photo-source-actions">
              ${l?`
                    <button
                      id="take-photo"
                      class="photo-source-button photo-source-button--camera"
                      type="button"
                    >
                      ${y("camera")}

                      <span>
                        <strong>
                          Tirar foto
                        </strong>

                        <small>
                          Abrir a câmera do dispositivo
                        </small>
                      </span>
                    </button>
                  `:""}

              <button
                id="choose-photo"
                class="photo-source-button"
                type="button"
              >
                ${y("image")}

                <span>
                  <strong>
                    Escolher da galeria
                  </strong>

                  <small>
                    Usar uma imagem já existente
                  </small>
                </span>
              </button>
            </div>

            <div
              class="photo-upload-field"
              id="photo-upload-field"
            >
              <span
                id="photo-upload-placeholder"
                class="photo-upload-field__placeholder"
              >
                ${y("camera")}

                <strong>
                  Nenhuma imagem selecionada
                </strong>

                <small>
                  ${l?"Tire uma foto agora ou escolha uma imagem da galeria.":"Escolha uma imagem do dispositivo."}
                </small>
              </span>

              <img
                id="photo-preview"
                class="photo-upload-field__preview"
                alt=""
                hidden
              />
            </div>

            <p
              id="photo-source-status"
              class="photo-source-status"
              hidden
            ></p>

            <input
              id="photo-file"
              name="file"
              class="photo-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              tabindex="-1"
              aria-hidden="true"
            />
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Registro
              </h2>

              <p>
                Relacione a imagem a um evento existente ou deixe o Meu Agro criar um evento de fotografia.
              </p>
            </div>

            <div class="field">
              <label
                for="photo-event"
              >
                Evento relacionado
              </label>

              <select
                id="photo-event"
                name="eventId"
              >
                ${cv(n,o)}
              </select>
            </div>

            <div class="field">
              <label
                for="photo-captured-at"
              >
                Data e horário da foto *
              </label>

              <input
                id="photo-captured-at"
                name="capturedAt"
                type="datetime-local"
                value="${h(ya((c==null?void 0:c.occurred_at)||new Date))}"
                required
              />
            </div>

            <div class="field">
              <label
                for="photo-description"
              >
                Descrição
              </label>

              <textarea
                id="photo-description"
                name="description"
                maxlength="800"
                placeholder="Ex.: Desenvolvimento das folhas após 30 dias."
              ></textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="/plantings/${r.id}/evolution"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="photo-submit"
              class="button button--primary"
              type="submit"
            >
              Salvar foto
            </button>
          </div>
        </form>
      `});const d=document.querySelector("#photo-form"),u=document.querySelector("#photo-form-feedback"),p=document.querySelector("#photo-file"),m=document.querySelector("#take-photo"),f=document.querySelector("#choose-photo"),v=document.querySelector("#photo-source-status"),_=document.querySelector("#photo-preview"),w=document.querySelector("#photo-upload-placeholder"),k=document.querySelector("#photo-event"),S=document.querySelector("#photo-captured-at"),T=document.querySelector("#photo-submit");let A=null,C=!1,I=null,E=!1;const L=(N,F,M)=>{if(N){if(F){N.dataset.originalHtml=N.innerHTML,N.innerHTML=`
          ${y("refresh")}
          <span>
            <strong>${M}</strong>
          </span>
        `,N.disabled=!0,N.setAttribute("aria-busy","true");return}N.dataset.originalHtml&&(N.innerHTML=N.dataset.originalHtml),N.disabled=!1,N.removeAttribute("aria-busy")}},q=()=>{A&&C&&URL.revokeObjectURL(A),A=null,C=!1,_.removeAttribute("src"),_.alt="",_.hidden=!0},$=(N,{sourceLabel:F="Imagem selecionada",capturedAt:M=null,previewPath:le=null}={})=>{if(E)return!1;q();const J=xn(N);if(J)return I=null,D(u,J),q(),w.hidden=!1,v.hidden=!0,!1;if(I=N,D(u,""),le?(A=le,C=!1):(A=URL.createObjectURL(N),C=!0),_.src=A,_.alt=F,_.hidden=!1,w.hidden=!0,v.textContent=`${F} • ${N.name}`,v.hidden=!1,M&&k.value==="__auto__"){const Y=new Date(M);Number.isNaN(Y.getTime())||(S.value=ya(Y))}return!0},b=()=>{var F;const N=(F=p.files)==null?void 0:F[0];N&&$(N,{sourceLabel:"Imagem da galeria"})},g=async()=>{if(!l){p.click();return}L(f,!0,"Abrindo galeria…");try{const N=await ov();if(!N||E)return;$(N.file,{sourceLabel:"Imagem da galeria",capturedAt:N.capturedAt,previewPath:N.previewPath||N.webPath})}catch(N){console.warn("Seleção de imagem cancelada ou não concluída:",N),String((N==null?void 0:N.message)||"").toLocaleLowerCase("pt-BR").includes("cancel")||D(u,K(N))}finally{L(f,!1)}},R=async()=>{L(m,!0,"Abrindo câmera…");try{const N=await iv();if(E)return;$(N.file,{sourceLabel:"Foto tirada agora",capturedAt:N.capturedAt||new Date().toISOString(),previewPath:N.previewPath||N.webPath})}catch(N){console.warn("Captura de foto cancelada ou não concluída:",N),String((N==null?void 0:N.message)||"").toLocaleLowerCase("pt-BR").includes("cancel")||D(u,K(N))}finally{L(m,!1)}},x=()=>{const N=n.find(F=>F.id===k.value);N&&(S.value=ya(N.occurred_at))},H=async N=>{N.preventDefault(),D(u,"");const F=I,M=xn(F);if(M){D(u,M);return}const le=new FormData(d),J=String(le.get("capturedAt")||""),Y=Fn(J);if(!Y){D(u,"Informe a data e o horário da foto.");return}const re=String(le.get("description")||"").trim();te(T,!0,"Enviando…");let ye=null,ke=null;try{ye=await If({file:F,cycle:r});let Lt=k.value;Lt==="__auto__"&&(ke=await Tc(r.id,{eventType:"photo",title:"Registro fotográfico",description:re||"Foto adicionada à evolução visual do ciclo.",notes:"",occurredAt:Y}),Lt=ke.id),await Of({cycle:r,eventId:Lt||null,storagePath:ye,description:re,capturedAt:Y}),j("Foto adicionada à evolução.",{type:"success"}),Q(`/plantings/${r.id}/evolution`,{replace:!0})}catch(Lt){if(console.error("Erro ao salvar foto:",Lt),ye)try{await Sc(ye)}catch(Yr){console.warn("Não foi possível limpar o arquivo após a falha:",Yr)}if(ke!=null&&ke.id)try{await Uf(ke.id)}catch(Yr){console.warn("Não foi possível desfazer o evento fotográfico:",Yr)}D(u,K(Lt))}finally{te(T,!1)}};return p.addEventListener("change",b),f.addEventListener("click",g),m==null||m.addEventListener("click",R),k.addEventListener("change",x),d.addEventListener("submit",H),()=>{E=!0,q(),p.removeEventListener("change",b),f.removeEventListener("click",g),m==null||m.removeEventListener("click",R),k.removeEventListener("change",x),d.removeEventListener("submit",H)}}const Gr=`
  id,
  user_id,
  agricultural_input_id,
  supplier,
  purchased_quantity,
  unit,
  total_price,
  unit_price,
  purchase_date,
  expiration_date,
  batch_number,
  notes,
  deleted_at,
  created_at,
  updated_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active,
    deleted_at
  )
`;function Fa(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Ii(t){if(t===""||t===null||t===void 0)return null;const e=Number(t);return Number.isFinite(e)?e:null}async function Uc({inputId:t=null}={}){let a=Fa().from("inventory_lot_balances").select(`
        inventory_lot_id,
        agricultural_input_id,
        current_quantity,
        unit,
        unit_price,
        purchase_date,
        expiration_date,
        batch_number
      `);t&&(a=a.eq("agricultural_input_id",t));const{data:r,error:n}=await a;if(n)throw n;return new Map((r??[]).map(s=>[s.inventory_lot_id,s]))}function Hc(t,e){return{...t,current_quantity:(e==null?void 0:e.current_quantity)??0}}async function Jt({inputId:t=null,includeEmpty:e=!0,limit:a=null}={}){let n=Fa().from("inventory_lots").select(Gr).is("deleted_at",null);t&&(n=n.eq("agricultural_input_id",t)),n=n.order("purchase_date",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(a)&&a>0&&(n=n.limit(a));const[s,i]=await Promise.all([n,Uc({inputId:t})]);if(s.error)throw s.error;const o=(s.data??[]).map(c=>Hc(c,i.get(c.id)));return e?o:o.filter(c=>Number(c.current_quantity)>0)}async function ns(t){const e=Fa(),[a,r]=await Promise.all([e.from("inventory_lots").select(Gr).eq("id",t).maybeSingle(),Uc()]);if(a.error)throw a.error;return a.data?Hc(a.data,r.get(t)):null}async function dv(t,e){var d,u,p;const a=Fa(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("agricultural_inputs").select(`
      id,
      user_id,
      name,
      base_unit,
      active,
      deleted_at
    `).eq("id",t).eq("user_id",r.id).maybeSingle();if(s)throw s;if(!n||n.deleted_at)throw new Error("Insumo inválido para o lote.");if(!n.active)throw new Error("O insumo está inativo. Reative-o antes de cadastrar um novo lote.");const i=Ii(e.purchasedQuantity),o=Ii(e.totalPrice),{data:c,error:l}=await a.from("inventory_lots").insert({user_id:r.id,agricultural_input_id:n.id,supplier:((d=e.supplier)==null?void 0:d.trim())||null,purchased_quantity:i,unit:n.base_unit,total_price:o,purchase_date:e.purchaseDate,expiration_date:e.expirationDate||null,batch_number:((u=e.batchNumber)==null?void 0:u.trim())||null,notes:((p=e.notes)==null?void 0:p.trim())||null}).select(Gr).single();if(l)throw l;return c}async function uv(t,e){var i,o,c;const a=Fa(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("inventory_lots").update({supplier:((i=e.supplier)==null?void 0:i.trim())||null,expiration_date:e.expirationDate||null,batch_number:((o=e.batchNumber)==null?void 0:o.trim())||null,notes:((c=e.notes)==null?void 0:c.trim())||null}).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Gr).single();if(s)throw s;return n}const pv=`
  id,
  user_id,
  production_event_id,
  agricultural_input_id,
  inventory_lot_id,
  quantity,
  unit,
  unit_cost,
  total_cost,
  inventory_transaction_id,
  notes,
  created_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    category,
    base_unit,
    active,
    deleted_at
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    purchase_date,
    expiration_date,
    unit,
    unit_price
  ),
  inventory_transaction:inventory_transactions (
    id,
    transaction_type,
    occurred_at,
    quantity,
    unit,
    unit_cost,
    total_cost
  )
`;function Fc(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}async function hv(t){const e=Fc(),{data:a,error:r}=await e.from("inventory_balances").select(`
        agricultural_input_id,
        current_quantity,
        base_unit,
        stock_status,
        minimum_stock,
        ideal_stock
      `).eq("agricultural_input_id",t).maybeSingle();if(r)throw r;return{agricultural_input_id:t,current_quantity:Number((a==null?void 0:a.current_quantity)??0),base_unit:(a==null?void 0:a.base_unit)||"",stock_status:(a==null?void 0:a.stock_status)||"out_of_stock",minimum_stock:Number((a==null?void 0:a.minimum_stock)??0),ideal_stock:(a==null?void 0:a.ideal_stock)===null||(a==null?void 0:a.ideal_stock)===void 0?null:Number(a.ideal_stock)}}async function mv(t,e){var c;const a=Fc(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const n=Number(e.quantity);if(!Number.isFinite(n)||n<=0)throw new Error("Informe uma quantidade maior que zero.");const s=await ns(e.lotId);if(!s||s.deleted_at||s.agricultural_input_id!==e.inputId)throw new Error("Lote inválido para o insumo selecionado.");if(Number(s.current_quantity)<n)throw new Error(`Saldo insuficiente no lote. Disponível: ${s.current_quantity} ${s.unit}.`);const{data:i,error:o}=await a.from("event_inputs").insert({user_id:r.id,production_event_id:t,agricultural_input_id:e.inputId,inventory_lot_id:e.lotId,quantity:n,unit:s.unit,notes:((c=e.notes)==null?void 0:c.trim())||null}).select(pv).single();if(o)throw o;return i}const Ct=`
  id,
  user_id,
  name,
  company,
  phone,
  whatsapp,
  email,
  specialty,
  notes,
  active,
  deleted_at,
  created_at,
  updated_at
`;function Tt(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function Bc(t){var e,a,r,n,s,i,o;return{name:((e=t.name)==null?void 0:e.trim())||"",company:((a=t.company)==null?void 0:a.trim())||null,phone:((r=t.phone)==null?void 0:r.trim())||null,whatsapp:((n=t.whatsapp)==null?void 0:n.trim())||null,email:((s=t.email)==null?void 0:s.trim())||null,specialty:((i=t.specialty)==null?void 0:i.trim())||null,notes:((o=t.notes)==null?void 0:o.trim())||null}}async function In({active:t=null,archived:e=!1}={}){let r=Tt().from("consultants").select(Ct);e?r=r.not("deleted_at","is",null):r=r.is("deleted_at",null),typeof t=="boolean"&&!e&&(r=r.eq("active",t)),r=r.order("name",{ascending:!0});const{data:n,error:s}=await r;if(s)throw s;return n??[]}async function fv(){return(await In({active:!0,archived:!1})).filter(e=>!!e.whatsapp)}async function zc(t){const e=Tt(),{data:a,error:r}=await e.from("consultants").select(Ct).eq("id",t).maybeSingle();if(r)throw r;return a}async function vv(t){const e=Tt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("consultants").insert({...Bc(t),user_id:a.id,active:!0}).select(Ct).single();if(n)throw n;return r}async function gv(t,e){const a=Tt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("consultants").update(Bc(e)).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Ct).single();if(s)throw s;return n}async function yv(t,e){const a=Tt(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("consultants").update({active:!!e}).eq("id",t).eq("user_id",r.id).is("deleted_at",null).select(Ct).single();if(s)throw s;return n}async function _v(t){const e=Tt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("consultants").update({active:!1,deleted_at:new Date().toISOString()}).eq("id",t).eq("user_id",a.id).select(Ct).single();if(n)throw n;return r}async function bv(t){const e=Tt(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");const{data:r,error:n}=await e.from("consultants").update({active:!0,deleted_at:null}).eq("id",t).eq("user_id",a.id).select(Ct).single();if(n)throw n;return r}function wv(t){return String(t||"").replace(/\D/g,"")}function Vc(t){let e=wv(t);return e?((e.length===10||e.length===11)&&!e.startsWith("55")&&(e=`55${e}`),e):""}function Wc(t){const e=Vc(t);return e.length>=10&&e.length<=15}function $v({number:t,message:e=""}){const a=Vc(t);if(!Wc(a))return null;const r=`https://wa.me/${a}`,n=String(e||"").trim();return n?`${r}?text=${encodeURIComponent(n)}`:r}function Sv({consultantName:t,productName:e}){return`Olá, ${t}. Estou precisando repor o produto ${e}. Meu estoque atual está zerado. Poderia me informar preço e disponibilidade?`}function Ev({consultantName:t}){return`Olá, ${t}. Gostaria de conversar sobre uma orientação agrícola.`}function Lr(t,{productName:e=null}={}){if(!t)return null;const a=e?Sv({consultantName:t.name,productName:e}):Ev({consultantName:t.name});return $v({number:t.whatsapp,message:a})}async function ss({inputName:t}){const e=document.querySelector("#modal-root");if(!e)return;let a=[];try{a=await fv()}catch(r){console.error("Erro ao carregar consultores:",r)}return new Promise(r=>{let n=!1;const s=()=>{n||(n=!0,document.removeEventListener("keydown",i),e.innerHTML="",r())},i=w=>{w.key==="Escape"&&s()},o=a.map(w=>`
              <option
                value="${w.id}"
              >
                ${h(w.name)}${w.company?` • ${h(w.company)}`:""}
              </option>
            `).join(""),c=a.length===1?a[0]:null,l=c?Lr(c,{productName:t}):null;e.innerHTML=`
        <div
          class="modal-backdrop"
          role="presentation"
        >
          <section
            class="modal-card restock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-modal-title"
          >
            <div class="restock-modal__icon">
              ${y("alertTriangle")}
            </div>

            <h2
              id="restock-modal-title"
            >
              Estoque zerado
            </h2>

            <p>
              Seu estoque de
              <strong>
                ${h(t)}
              </strong>
              acabou.
            </p>

            <p>
              Deseja solicitar reposição a um consultor?
            </p>

            ${a.length===0?`
                  <div class="restock-modal__empty">
                    <p>
                      Nenhum consultor ativo com WhatsApp foi cadastrado.
                    </p>

                    <a
                      href="/more/consultants/new"
                      class="button button--primary button--full"
                      data-link
                      data-restock-close
                    >
                      ${y("users")}
                      Cadastrar consultor
                    </a>
                  </div>
                `:a.length===1?`
                    <div class="restock-consultant-option">
                      <strong>
                        ${h(c.name)}
                      </strong>

                      <span>
                        ${h(c.specialty||c.company||"Consultor agrícola")}
                      </span>
                    </div>

                    <a
                      href="${h(l||"#")}"
                      class="button button--whatsapp button--full"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-restock-close
                    >
                      ${y("messageCircle")}
                      Falar no WhatsApp
                    </a>
                  `:`
                    <div class="field">
                      <label
                        for="restock-consultant-select"
                      >
                        Selecione o consultor
                      </label>

                      <select
                        id="restock-consultant-select"
                      >
                        <option value="">
                          Selecione
                        </option>

                        ${o}
                      </select>
                    </div>

                    <a
                      id="restock-whatsapp-link"
                      href="#"
                      class="button button--whatsapp button--full button--disabled"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled="true"
                    >
                      ${y("messageCircle")}
                      Abrir WhatsApp
                    </a>
                  `}

            <button
              id="restock-later"
              class="button button--ghost button--full"
              type="button"
            >
              Agora não
            </button>
          </section>
        </div>
      `;const d=e.querySelector(".modal-backdrop"),u=e.querySelector("#restock-later"),p=e.querySelector("#restock-consultant-select"),m=e.querySelector("#restock-whatsapp-link"),f=()=>{if(!p||!m)return;const w=a.find(S=>S.id===p.value),k=w?Lr(w,{productName:t}):null;if(!k){m.href="#",m.classList.add("button--disabled"),m.setAttribute("aria-disabled","true");return}m.href=k,m.classList.remove("button--disabled"),m.setAttribute("aria-disabled","false")},v=w=>{w.target.closest("[data-restock-close]")&&window.setTimeout(s,0)},_=w=>{if((m==null?void 0:m.getAttribute("aria-disabled"))==="true"){w.preventDefault();return}window.setTimeout(s,0)};u.addEventListener("click",s,{once:!0}),d.addEventListener("click",w=>{w.target===d&&s()}),e.addEventListener("click",v,{once:!1}),p==null||p.addEventListener("change",f),m==null||m.addEventListener("click",_),document.addEventListener("keydown",i)})}function kv(t,e){return`
    <option value="">
      Selecione
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}${a.brand?` • ${h(a.brand)}`:""}
          </option>
        `).join("")}
  `}function Av(t){return`${t.batch_number?`Lote ${t.batch_number}`:`Compra de ${ne(t.purchase_date)}`} • ${ae(t.current_quantity)} ${t.unit} disponíveis`}function hn(t,e){return`
    <option value="">
      ${t.length?"Selecione":"Nenhum lote com saldo"}
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(Av(a))}
          </option>
        `).join("")}
  `}async function Cv({session:t,params:e}){var L,q;const a=document.querySelector("#app");let r=null,n=null,s=[];try{[r,n,s]=await Promise.all([ta(e.cycleId),Cc(e.eventId),Br({includeInactive:!1})])}catch($){console.error("Erro ao preparar uso de insumo:",$)}if(!r||r.deleted_at||!n||n.production_cycle_id!==r.id)return a.innerHTML=O({session:t,title:"Uso de insumo",eyebrow:"Linha do tempo",activeNav:"plantings",content:B({iconName:"box",title:"Evento indisponível",description:"O consumo de insumo precisa estar ligado a um evento de um ciclo produtivo ativo.",actionLabel:"Voltar para plantios",actionHref:"/plantings"})}),null;const o=new URLSearchParams(window.location.search).get("input")||"",c=s.some($=>$.id===o)?o:"";let l=[];if(c)try{l=await Jt({inputId:c,includeEmpty:!1})}catch($){console.error("Erro ao carregar lotes:",$)}if(a.innerHTML=O({session:t,title:"Usar insumo",eyebrow:n.title,activeNav:"plantings",content:`
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${r.id}#timeline"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Linha do tempo
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Registrar insumo utilizado
            </h2>

            <p>
              A confirmação gera automaticamente uma saída de estoque associada ao ciclo e ao evento.
            </p>
          </div>
        </section>

        <section class="event-input-context">
          <span class="event-input-context__icon">
            ${y("clipboard")}
          </span>

          <div>
            <strong>
              ${h(n.title)}
            </strong>

            <span>
              ${h(((L=r.crop)==null?void 0:L.name)||"Ciclo produtivo")}
              •
              ${h(((q=r.area)==null?void 0:q.name)||"Área")}
            </span>
          </div>
        </section>

        <div
          id="event-input-feedback"
          class="form-message"
          hidden
        ></div>

        ${s.length?`
              <form
                id="event-input-form"
                class="property-form"
                novalidate
              >
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Insumo e lote
                    </h2>

                    <p>
                      O lote define de qual compra o produto será baixado e qual custo será capturado.
                    </p>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-product"
                    >
                      Insumo *
                    </label>

                    <select
                      id="event-input-product"
                      name="inputId"
                      required
                    >
                      ${kv(s,c)}
                    </select>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-lot"
                    >
                      Lote *
                    </label>

                    <select
                      id="event-input-lot"
                      name="lotId"
                      ${c?"":"disabled"}
                      required
                    >
                      ${hn(l,"")}
                    </select>
                  </div>

                  <div
                    id="event-input-lot-info"
                    class="event-input-lot-info"
                    hidden
                  ></div>
                </section>

                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Quantidade utilizada
                    </h2>

                    <p>
                      O valor deve estar disponível no lote selecionado.
                    </p>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-quantity"
                    >
                      Quantidade *
                    </label>

                    <input
                      id="event-input-quantity"
                      name="quantity"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      inputmode="decimal"
                      placeholder="Ex.: 3"
                      required
                    />

                    <small
                      id="event-input-quantity-hint"
                      class="field__hint"
                    ></small>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-notes"
                    >
                      Observações
                    </label>

                    <textarea
                      id="event-input-notes"
                      name="notes"
                      maxlength="1000"
                      placeholder="Ex.: aplicação distribuída em cobertura."
                    ></textarea>
                  </div>
                </section>

                <div class="event-input-immutable-note">
                  ${y("lock")}

                  <div>
                    <strong>
                      Registro auditável
                    </strong>

                    <span>
                      Depois de confirmado, o consumo não poderá ser editado ou excluído. Correções devem ser feitas por movimentação de ajuste e novo consumo.
                    </span>
                  </div>
                </div>

                <div class="property-form-actions">
                  <a
                    href="/plantings/${r.id}#timeline"
                    class="button button--secondary"
                    data-link
                  >
                    Cancelar
                  </a>

                  <button
                    id="event-input-submit"
                    class="button button--primary"
                    type="submit"
                  >
                    Registrar uso
                  </button>
                </div>
              </form>
            `:B({iconName:"box",title:"Nenhum insumo ativo",description:"Cadastre um insumo e um lote com saldo antes de registrar o uso em um evento.",actionLabel:"Abrir Barracão",actionHref:"/inventory"})}
      `}),!s.length)return null;const d=document.querySelector("#event-input-form"),u=document.querySelector("#event-input-feedback"),p=document.querySelector("#event-input-submit"),m=document.querySelector("#event-input-product"),f=document.querySelector("#event-input-lot"),v=document.querySelector("#event-input-quantity"),_=document.querySelector("#event-input-quantity-hint"),w=document.querySelector("#event-input-lot-info");let k=l;function S(){return k.find($=>$.id===f.value)}function T(){const $=S();if(!$){w.hidden=!0,w.innerHTML="",_.textContent="",v.removeAttribute("max");return}w.hidden=!1,w.innerHTML=`
      <div>
        <span>Saldo disponível</span>
        <strong>
          ${ae($.current_quantity)}
          ${h($.unit)}
        </strong>
      </div>

      <div>
        <span>Custo unitário</span>
        <strong>
          ${$.unit_price===null||$.unit_price===void 0?"Não informado":X($.unit_price)}
        </strong>
      </div>

      <div>
        <span>Lote</span>
        <strong>
          ${h($.batch_number||"Sem número")}
        </strong>
      </div>
    `,_.textContent=`Disponível: ${ae($.current_quantity)} ${$.unit}.`,v.max=String($.current_quantity)}async function A(){const $=m.value;if(f.disabled=!0,f.innerHTML=hn([],""),k=[],T(),!!$)try{k=await Jt({inputId:$,includeEmpty:!1}),f.innerHTML=hn(k,""),f.disabled=k.length===0}catch(b){console.error("Erro ao carregar lotes:",b),j(K(b),{type:"error"})}}const C=()=>{A()},I=()=>{T()},E=async $=>{$.preventDefault(),D(u,"");const b=new FormData(d),g={inputId:String(b.get("inputId")||""),lotId:String(b.get("lotId")||""),quantity:Number(b.get("quantity")),notes:String(b.get("notes")||"").trim()},R=S();if(!g.inputId){D(u,"Selecione o insumo.");return}if(!R){D(u,"Selecione um lote com saldo.");return}if(!Number.isFinite(g.quantity)||g.quantity<=0){D(u,"Informe uma quantidade maior que zero.");return}if(g.quantity>Number(R.current_quantity)){D(u,`Saldo insuficiente no lote. Disponível: ${ae(R.current_quantity)} ${R.unit}.`);return}te(p,!0,"Registrando…");try{const x=s.find(P=>P.id===g.inputId);await mv(n.id,g);const H=await hv(g.inputId);j("Uso de insumo registrado e estoque atualizado.",{type:"success"}),H.current_quantity<=0&&await ss({inputName:(x==null?void 0:x.name)||"Insumo"}),Q(`/plantings/${r.id}#timeline`,{replace:!0})}catch(x){console.error("Erro ao registrar uso:",x),D(u,K(x))}finally{te(p,!1)}};return m.addEventListener("change",C),f.addEventListener("change",I),d.addEventListener("submit",E),T(),()=>{m.removeEventListener("change",C),f.removeEventListener("change",I),d.removeEventListener("submit",E)}}function Tv(t){return`
    <option value="">
      Selecione
    </option>

    ${hc.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Lv(t){return`
    <option value="">
      Selecione
    </option>

    ${mc.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Oi(t){const e=String(t||"").trim().replace(",",".");return e?Number(e):""}function Rv(t){return t.name.length<2?"Informe o nome do insumo.":t.category?t.baseUnit?t.minimumStock!==""&&(!Number.isFinite(t.minimumStock)||t.minimumStock<0)?"Informe um estoque mínimo válido.":t.idealStock!==""&&(!Number.isFinite(t.idealStock)||t.idealStock<0)?"Informe um estoque ideal válido.":t.minimumStock!==""&&t.idealStock!==""&&t.idealStock<t.minimumStock?"O estoque ideal não pode ser menor que o estoque mínimo.":null:"Selecione a unidade principal.":"Selecione a categoria."}async function Gc({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null;if(n){try{s=await At(e.inputId)}catch(d){console.error("Erro ao carregar insumo:",d)}if(!s)return r.innerHTML=O({session:t,title:"Insumo",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Insumo não encontrado",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para o Barracão",actionHref:"/inventory"})}),null}r.innerHTML=O({session:t,title:n?"Editar insumo":"Novo insumo",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/inventory/${s.id}`:"/inventory"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar insumo":"Cadastrar insumo"}
            </h2>

            <p>
              Cadastre o produto sem informar quantidade atual. O saldo será calculado pelas movimentações de estoque.
            </p>
          </div>
        </section>

        <div
          id="input-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="input-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Nome, marca e categoria ajudam a diferenciar produtos semelhantes.
              </p>
            </div>

            <div class="field">
              <label
                for="input-name"
              >
                Nome *
              </label>

              <input
                id="input-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="160"
                placeholder="Ex.: NPK 10-10-10"
                value="${h((s==null?void 0:s.name)||"")}"
                required
              />
            </div>

            <div class="field">
              <label
                for="input-brand"
              >
                Marca
              </label>

              <input
                id="input-brand"
                name="brand"
                type="text"
                maxlength="160"
                placeholder="Ex.: Marca Rural"
                value="${h((s==null?void 0:s.brand)||"")}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="input-category"
                >
                  Categoria *
                </label>

                <select
                  id="input-category"
                  name="category"
                  required
                >
                  ${Tv((s==null?void 0:s.category)||"")}
                </select>
              </div>

              <div class="field">
                <label
                  for="input-unit"
                >
                  Unidade principal *
                </label>

                <select
                  id="input-unit"
                  name="baseUnit"
                  required
                >
                  ${Lv((s==null?void 0:s.base_unit)||"")}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Estoque de referência
              </h2>

              <p>
                Estes valores serão usados pelos alertas quando os lotes e movimentações estiverem ativos.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="input-minimum-stock"
                >
                  Estoque mínimo
                </label>

                <input
                  id="input-minimum-stock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 5"
                  value="${(s==null?void 0:s.minimum_stock)??0}"
                />
              </div>

              <div class="field">
                <label
                  for="input-ideal-stock"
                >
                  Estoque ideal
                </label>

                <input
                  id="input-ideal-stock"
                  name="idealStock"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 20"
                  value="${(s==null?void 0:s.ideal_stock)??""}"
                />
              </div>
            </div>

            <small class="field__hint">
              O saldo atual não aparece neste formulário porque nunca deve ser alterado diretamente.
            </small>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Informações adicionais
              </h2>

              <p>
                Registre características do produto e observações de uso.
              </p>
            </div>

            <div class="field">
              <label
                for="input-description"
              >
                Descrição
              </label>

              <textarea
                id="input-description"
                name="description"
                maxlength="1200"
                placeholder="Ex.: Fertilizante granulado para aplicação em cobertura."
              >${h((s==null?void 0:s.description)||"")}</textarea>
            </div>

            <div class="field">
              <label
                for="input-notes"
              >
                Observações
              </label>

              <textarea
                id="input-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: armazenar em local seco e ventilado."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/inventory/${s.id}`:"/inventory"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="input-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar insumo"}
            </button>
          </div>
        </form>
      `});const i=document.querySelector("#input-form"),o=document.querySelector("#input-form-feedback"),c=document.querySelector("#input-submit"),l=async d=>{d.preventDefault(),D(o,"");const u=new FormData(i),p={name:String(u.get("name")||"").trim(),brand:String(u.get("brand")||"").trim(),category:String(u.get("category")||""),baseUnit:String(u.get("baseUnit")||""),minimumStock:Oi(u.get("minimumStock")),idealStock:Oi(u.get("idealStock")),description:String(u.get("description")||"").trim(),notes:String(u.get("notes")||"").trim()},m=Rv(p);if(m){D(o,m);return}te(c,!0,n?"Salvando…":"Cadastrando…");try{const f=n?await nf(s.id,p):await rf(p);j(n?"Insumo atualizado.":"Insumo cadastrado.",{type:"success"}),Q(`/inventory/${f.id}`,{replace:!0})}catch(f){console.error("Erro ao salvar insumo:",f),D(o,K(f))}finally{te(c,!1)}};return i.addEventListener("submit",l),()=>{i.removeEventListener("submit",l)}}const Kc=[["entry","Entrada"],["usage","Saída por uso"],["positive_adjustment","Ajuste positivo"],["negative_adjustment","Ajuste negativo"],["loss","Perda"],["expiration","Vencimento"],["return","Devolução"]],Jc=[["positive_adjustment","Ajuste positivo"],["negative_adjustment","Ajuste negativo"],["loss","Perda"],["expiration","Vencimento"],["return","Devolução"]],Pv=["entry","positive_adjustment","return"];function Qc(t){var e;return((e=Kc.find(([a])=>a===t))==null?void 0:e[1])||t||"Movimentação"}function ba(t){return Pv.includes(t)?1:-1}function Rr(t){return ba(t)>0?"stock-transaction--positive":"stock-transaction--negative"}function Yc(t){switch(t){case"entry":case"positive_adjustment":case"return":return"arrowUp";case"usage":case"negative_adjustment":case"loss":case"expiration":return"arrowDown";default:return"history"}}const is=`
  id,
  user_id,
  agricultural_input_id,
  inventory_lot_id,
  production_cycle_id,
  production_event_id,
  transaction_type,
  quantity,
  unit,
  unit_cost,
  total_cost,
  occurred_at,
  notes,
  created_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    unit,
    unit_price,
    purchase_date,
    expiration_date
  ),
  production_cycle:production_cycles (
    id,
    variety,
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
    )
  ),
  production_event:production_events (
    id,
    title,
    event_type,
    occurred_at
  )
`;function os(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function qv(){return new Set(Jc.map(([t])=>t))}async function cs({inputId:t=null,lotId:e=null,type:a=null,limit:r=null}={}){let s=os().from("inventory_transactions").select(is);t&&(s=s.eq("agricultural_input_id",t)),e&&(s=s.eq("inventory_lot_id",e)),a&&(s=s.eq("transaction_type",a)),s=s.order("occurred_at",{ascending:!1}).order("created_at",{ascending:!1}),Number.isInteger(r)&&r>0&&(s=s.limit(r));const{data:i,error:o}=await s;if(o)throw o;return i??[]}async function xv(t){const e=os(),{data:a,error:r}=await e.from("inventory_transactions").select(is).eq("id",t).maybeSingle();if(r)throw r;return a}async function Nv(t){var c;const e=os(),a=await Z();if(!a)throw new Error("Sua sessão expirou. Entre novamente.");if(!qv().has(t.transactionType))throw new Error("Este tipo de movimentação não pode ser criado manualmente.");const{data:r,error:n}=await e.from("inventory_lots").select(`
      id,
      user_id,
      agricultural_input_id,
      unit,
      unit_price,
      deleted_at
    `).eq("id",t.lotId).eq("user_id",a.id).maybeSingle();if(n)throw n;if(!r||r.deleted_at||r.agricultural_input_id!==t.inputId)throw new Error("Lote inválido para o insumo informado.");const s=Number(t.quantity),{data:i,error:o}=await e.from("inventory_transactions").insert({user_id:a.id,agricultural_input_id:t.inputId,inventory_lot_id:r.id,production_cycle_id:t.productionCycleId||null,production_event_id:t.productionEventId||null,transaction_type:t.transactionType,quantity:s,unit:r.unit,unit_cost:r.unit_price,occurred_at:t.occurredAt||new Date().toISOString(),notes:((c=t.notes)==null?void 0:c.trim())||null}).select(is).single();if(o)throw o;return i}function Iv(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function Zc(t){return Number(t.current_quantity??0)<=0?{label:"Sem saldo",className:"inventory-lot-status--empty"}:t.expiration_date&&t.expiration_date<Iv()?{label:"Vencido",className:"inventory-lot-status--expired"}:{label:"Disponível",className:"inventory-lot-status--available"}}function Xc(t){return t.batch_number?`Lote ${t.batch_number}`:`Compra de ${ne(t.purchase_date)}`}function el(t){const e=Zc(t);return`
    <article class="inventory-lot-card">
      <a
        href="/inventory/${t.agricultural_input_id}/lots/${t.id}"
        class="inventory-lot-card__main"
        data-link
      >
        <div class="inventory-lot-card__top">
          <span class="inventory-lot-card__icon">
            ${y("box")}
          </span>

          <div class="inventory-lot-card__identity">
            <h3>
              ${h(Xc(t))}
            </h3>

            <p>
              ${h(t.supplier||"Fornecedor não informado")}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="inventory-lot-card__meta">
          <span
            class="inventory-lot-status ${e.className}"
          >
            ${h(e.label)}
          </span>

          <span class="inventory-lot-card__balance">
            ${ae(t.current_quantity??0)}
            ${h(t.unit)}
          </span>
        </div>

        <div class="inventory-lot-card__details">
          <span>
            Compra:
            ${ae(t.purchased_quantity)}
            ${h(t.unit)}
          </span>

          <span>
            ${X(t.total_price)}
          </span>

          <span>
            ${ne(t.purchase_date)}
          </span>
        </div>
      </a>
    </article>
  `}function tl(t){const e=t.inventory_lot;return e?e.batch_number?`Lote ${e.batch_number}`:`Compra ${e.purchase_date||""}`.trim():"Sem lote"}function al(t){return`${ba(t.transaction_type)>0?"+":"-"}${ae(t.quantity)} ${h(t.unit||"")}`.trim()}function ls(t){var e;return`
    <article class="stock-transaction-card">
      <a
        href="/inventory/transactions/${t.id}"
        class="stock-transaction-card__main"
        data-link
      >
        <span
          class="stock-transaction-card__icon ${Rr(t.transaction_type)}"
        >
          ${y(Yc(t.transaction_type))}
        </span>

        <div class="stock-transaction-card__content">
          <div class="stock-transaction-card__title-row">
            <div>
              <h3>
                ${h(Qc(t.transaction_type))}
              </h3>

              <p>
                ${h(((e=t.agricultural_input)==null?void 0:e.name)||"Insumo")}
                •
                ${h(tl(t))}
              </p>
            </div>

            <strong
              class="stock-transaction-card__quantity ${Rr(t.transaction_type)}"
            >
              ${al(t)}
            </strong>
          </div>

          <div class="stock-transaction-card__meta">
            <span>
              ${Yt(t.occurred_at)}
            </span>

            ${t.total_cost!==null?`
                  <span>
                    ${X(t.total_cost)}
                  </span>
                `:""}
          </div>
        </div>

        ${y("chevronRight")}
      </a>
    </article>
  `}async function Ov({session:t,params:e}){const a=document.querySelector("#app");let r=null,n=[],s=[];try{r=await At(e.inputId),r&&([n,s]=await Promise.all([Jt({inputId:r.id,limit:3}),cs({inputId:r.id,limit:4})]))}catch(d){console.error("Erro ao carregar insumo:",d)}if(!r)return a.innerHTML=O({session:t,title:"Insumo",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Insumo não encontrado",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para o Barracão",actionHref:"/inventory"})}),null;a.innerHTML=O({session:t,title:"Insumo",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="/inventory"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Barracão
            </a>
          </div>
        </section>

        <section class="input-detail-hero">
          <div class="input-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(Er(r.category))}
              </p>

              <h2>
                ${h(r.name)}
              </h2>

              <p>
                ${h(r.brand||"Sem marca informada")}
              </p>
            </div>

            <span
              class="input-stock ${vc(r.stock_status)}"
            >
              ${h(fc(r.stock_status))}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/inventory/${r.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${y("edit")}
              Editar
            </a>

            <button
              id="toggle-input-active"
              class="button ${r.active?"button--danger":"button--secondary"}"
              type="button"
            >
              ${r.active?y("archive"):y("refresh")}
              ${r.active?"Desativar":"Reativar"}
            </button>
          </div>
        </section>

        <section class="input-stock-summary">
          <div class="input-stock-summary__main">
            <span>Saldo atual</span>
            <strong>
              ${h(gc(r))}
            </strong>
            <small>
              Calculado pelas movimentações
            </small>
          </div>

          <div>
            <span>Estoque mínimo</span>
            <strong>
              ${ae(r.minimum_stock)}
            </strong>
            <small>
              ${h(r.base_unit)}
            </small>
          </div>

          <div>
            <span>Estoque ideal</span>
            <strong>
              ${r.ideal_stock===null?"-":ae(r.ideal_stock)}
            </strong>
            <small>
              ${h(r.base_unit)}
            </small>
          </div>
        </section>

        ${r.active&&Number(r.current_quantity)<=0&&s.length>0?`
              <section class="stock-restock-alert">
                <div class="stock-restock-alert__content">
                  ${y("alertTriangle")}

                  <div>
                    <strong>
                      Seu estoque de ${h(r.name)} acabou.
                    </strong>

                    <p>
                      Você pode abrir o WhatsApp de um consultor para solicitar preço e disponibilidade.
                    </p>
                  </div>
                </div>

                <button
                  id="request-restock"
                  class="button button--whatsapp"
                  type="button"
                >
                  ${y("messageCircle")}
                  Solicitar reposição
                </button>
              </section>
            `:""}

        <section class="inventory-hub-actions">
          <a
            href="/inventory/${r.id}/lots"
            class="button button--secondary inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${y("box")}
            </span>
            <span class="inventory-hub-action__content">
              <strong>
                Lotes de estoque
              </strong>
              <span>
                ${n.length} ${n.length===1?"lote recente carregado":"lotes recentes carregados"}
              </span>
            </span>
            ${y("chevronRight")}
          </a>

          <a
            href="/inventory/${r.id}/transactions"
            class="button button--secondary inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${y("history")}
            </span>
            <span class="inventory-hub-action__content">
              <strong>
                Movimentações
              </strong>
              <span>
                Entradas, ajustes, perdas, vencimentos e devoluções
              </span>
            </span>
            ${y("chevronRight")}
          </a>
        </section>

        <div class="property-detail-actions" style="margin-bottom: 14px;">
          ${r.active?`
                <a
                  href="/inventory/${r.id}/lots/new"
                  class="button button--primary"
                  data-link
                >
                  ${y("plus")}
                  Novo lote
                </a>
              `:""}

          <a
            href="/inventory/transactions/new?input=${r.id}"
            class="button button--secondary"
            data-link
          >
            ${y("history")}
            Nova movimentação
          </a>
        </div>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Categoria
            </p>
            <p class="detail-card__value">
              ${h(Er(r.category))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Unidade principal
            </p>
            <p class="detail-card__value">
              ${h(kr(r.base_unit))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Situação
            </p>
            <p class="detail-card__value">
              ${r.active?"Ativo":"Inativo"}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrado em
            </p>
            <p class="detail-card__value">
              ${ne(r.created_at)}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${h(r.description||"Nenhuma descrição informada.")}
          </p>
        </article>

        <article class="detail-card" style="margin-top: 12px;">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>Lotes recentes</h2>
              <p>
                Compras separadas com saldo e custo próprios.
              </p>
            </div>

            <a
              href="/inventory/${r.id}/lots"
              class="button button--secondary button--compact"
              data-link
            >
              Ver todos
            </a>
          </div>

          ${n.length?`
                <div class="inventory-lot-list">
                  ${n.map(el).join("")}
                </div>
              `:B({iconName:"box",title:"Nenhum lote cadastrado",description:"Cadastre uma compra para gerar a primeira entrada automática de estoque.",actionLabel:r.active?"Cadastrar lote":null,actionHref:r.active?`/inventory/${r.id}/lots/new`:null})}
        </section>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>
                Movimentações recentes
              </h2>
              <p>
                Histórico que compõe o saldo atual.
              </p>
            </div>

            <a
              href="/inventory/${r.id}/transactions"
              class="button button--secondary button--compact"
              data-link
            >
              Ver todas
            </a>
          </div>

          ${s.length?`
                <div class="stock-transaction-list">
                  ${s.map(ls).join("")}
                </div>
              `:B({iconName:"history",title:"Nenhuma movimentação",description:"O cadastro de um lote criará automaticamente a primeira entrada."})}
        </section>
      `});const i=document.querySelector("#toggle-input-active"),o=document.querySelector("#request-restock"),c=async()=>{await ss({inputName:r.name})},l=async()=>{const d=!r.active;if(await ie({title:d?"Reativar insumo?":"Desativar insumo?",message:d?"O insumo voltará a aceitar novos lotes.":"O histórico, lotes e movimentações serão preservados. Novos lotes ficarão bloqueados até a reativação.",confirmLabel:d?"Reativar":"Desativar",danger:!d})){i.disabled=!0;try{await sf(r.id,d),j(d?"Insumo reativado.":"Insumo desativado.",{type:"success"}),Q(`/inventory/${r.id}`,{replace:!0})}catch(p){console.error("Erro ao alterar insumo:",p),j(K(p),{type:"error"}),i.disabled=!1}}};if(i==null||i.addEventListener("click",l),o==null||o.addEventListener("click",c),o&&Number(r.current_quantity)<=0){const d=`meu-agro-restock-shown:${r.id}`;sessionStorage.getItem(d)||(sessionStorage.setItem(d,"1"),window.setTimeout(()=>{c()},250))}return()=>{i==null||i.removeEventListener("click",l),o==null||o.removeEventListener("click",c)}}async function jv({session:t,params:e}){const a=document.querySelector("#app");let r=null;try{r=await At(e.inputId)}catch(s){console.error("Erro ao carregar insumo:",s)}if(!r)return a.innerHTML=O({session:t,title:"Lotes",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Insumo não encontrado",description:"Não foi possível localizar o insumo deste lote.",actionLabel:"Voltar ao Barracão",actionHref:"/inventory"})}),null;a.innerHTML=O({session:t,title:"Lotes de estoque",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${r.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              ${h(r.name)}
            </a>

            <h2 style="margin-top: 10px;">
              Lotes de estoque
            </h2>

            <p>
              Cada compra é preservada em um lote próprio, com custo, fornecedor, validade e saldo individual.
            </p>
          </div>

          ${r.active?`
                <a
                  href="/inventory/${r.id}/lots/new"
                  class="icon-button"
                  aria-label="Cadastrar lote"
                  data-link
                >
                  ${y("plus")}
                </a>
              `:""}
        </section>

        ${r.active?`
              <div class="season-list-actions">
                <a
                  href="/inventory/${r.id}/lots/new"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${y("plus")}
                  Novo lote
                </a>
              </div>
            `:`
              <div class="input-info-note">
                ${y("info")}
                <div>
                  <strong>
                    Insumo inativo
                  </strong>
                  <span>
                    Reative o insumo antes de registrar uma nova compra. Os lotes existentes continuam disponíveis para consulta e movimentações de correção/saída.
                  </span>
                </div>
              </div>
            `}

        <div id="inventory-lots-content">
          ${ce({label:"Carregando lotes…"})}
        </div>
      `});const n=document.querySelector("#inventory-lots-content");try{const s=await Jt({inputId:r.id});s.length?n.innerHTML=`
        <section class="inventory-lot-list">
          ${s.map(el).join("")}
        </section>
      `:n.innerHTML=B({iconName:"box",title:"Nenhum lote registrado",description:"Cadastre uma compra para gerar automaticamente a primeira entrada de estoque deste insumo.",actionLabel:r.active?"Cadastrar lote":null,actionHref:r.active?`/inventory/${r.id}/lots/new`:null})}catch(s){console.error("Erro ao listar lotes:",s),n.innerHTML=B({iconName:"box",title:"Não foi possível carregar os lotes",description:"Verifique sua conexão e tente novamente."}),j(K(s),{type:"error"})}return null}function Dv(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function Za(t){const e=String(t??"").trim().replace(",",".");if(!e)return null;const a=Number(e);return Number.isFinite(a)?a:null}function Mv(t,e){return e?t.expirationDate&&t.expirationDate<t.purchaseDate?"A validade não pode ser anterior à data da compra.":null:!Number.isFinite(t.purchasedQuantity)||t.purchasedQuantity<=0?"Informe uma quantidade comprada maior que zero.":t.totalPrice!==null&&(!Number.isFinite(t.totalPrice)||t.totalPrice<0)?"Informe um preço total válido.":t.purchaseDate?t.expirationDate&&t.expirationDate<t.purchaseDate?"A validade não pode ser anterior à data da compra.":null:"Informe a data da compra."}async function ji({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null,i=null;try{s=await At(e.inputId),n&&(i=await ns(e.lotId))}catch(_){console.error("Erro ao preparar lote:",_)}if(!s||n&&(!i||i.agricultural_input_id!==s.id))return r.innerHTML=O({session:t,title:"Lote",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Lote não encontrado",description:"Não foi possível localizar os dados solicitados.",actionLabel:"Voltar ao Barracão",actionHref:"/inventory"})}),null;if(!n&&!s.active)return r.innerHTML=O({session:t,title:"Novo lote",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Insumo inativo",description:"Reative o insumo antes de cadastrar uma nova compra.",actionLabel:"Voltar ao insumo",actionHref:`/inventory/${s.id}`})}),null;const o=(i==null?void 0:i.purchase_date)||Dv();r.innerHTML=O({session:t,title:n?"Editar lote":"Novo lote",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/inventory/${s.id}/lots/${i.id}`:`/inventory/${s.id}/lots`}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2 style="margin-top: 10px;">
              ${n?"Editar informações do lote":"Registrar compra / lote"}
            </h2>

            <p>
              ${h(s.name)} •
              ${h(kr(s.base_unit))}
            </p>
          </div>
        </section>

        ${n?`
              <div class="input-info-note">
                ${y("lock")}
                <div>
                  <strong>
                    Dados de estoque protegidos
                  </strong>
                  <span>
                    Quantidade comprada, unidade, preço e data da compra permanecem somente leitura. Correções de saldo devem ser feitas por movimentações.
                  </span>
                </div>
              </div>
            `:`
              <div class="input-info-note">
                ${y("info")}
                <div>
                  <strong>
                    Entrada automática
                  </strong>
                  <span>
                    Ao salvar este lote, o PostgreSQL criará automaticamente uma movimentação de entrada com a quantidade comprada.
                  </span>
                </div>
              </div>
            `}

        <div
          id="lot-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="lot-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Compra</h2>
              <p>
                Informações financeiras e quantidade original do lote.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-quantity">
                  Quantidade comprada *
                </label>

                <input
                  id="lot-quantity"
                  name="purchasedQuantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  value="${(i==null?void 0:i.purchased_quantity)??""}"
                  ${n?"readonly":"required"}
                />
              </div>

              <div class="field">
                <label>
                  Unidade
                </label>

                <input
                  type="text"
                  value="${h(kr(s.base_unit))}"
                  readonly
                />
              </div>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-total-price">
                  Preço total
                </label>

                <input
                  id="lot-total-price"
                  name="totalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  inputmode="decimal"
                  placeholder="Ex.: 250.00"
                  value="${(i==null?void 0:i.total_price)??""}"
                  ${n?"readonly":""}
                />
              </div>

              <div class="field">
                <label>
                  Preço unitário
                </label>

                <div
                  id="lot-unit-price-preview"
                  class="stock-readonly-value"
                >
                  ${n?X(i.unit_price):"-"}
                </div>

                <small class="field__hint">
                  Calculado automaticamente.
                </small>
              </div>
            </div>

            <div class="field">
              <label for="lot-purchase-date">
                Data da compra *
              </label>

              <input
                id="lot-purchase-date"
                name="purchaseDate"
                type="date"
                value="${o}"
                ${n?"readonly":"required"}
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação do lote</h2>
              <p>
                Dados que ajudam a localizar fisicamente o produto no barracão.
              </p>
            </div>

            <div class="field">
              <label for="lot-supplier">
                Fornecedor
              </label>

              <input
                id="lot-supplier"
                name="supplier"
                type="text"
                maxlength="180"
                placeholder="Ex.: Agropecuária Central"
                value="${h((i==null?void 0:i.supplier)||"")}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-batch-number">
                  Número do lote
                </label>

                <input
                  id="lot-batch-number"
                  name="batchNumber"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: LT-2026-09"
                  value="${h((i==null?void 0:i.batch_number)||"")}"
                />
              </div>

              <div class="field">
                <label for="lot-expiration-date">
                  Validade
                </label>

                <input
                  id="lot-expiration-date"
                  name="expirationDate"
                  type="date"
                  value="${(i==null?void 0:i.expiration_date)||""}"
                />
              </div>
            </div>

            <div class="field">
              <label for="lot-notes">
                Observações
              </label>

              <textarea
                id="lot-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: armazenado na prateleira 2..."
              >${h((i==null?void 0:i.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/inventory/${s.id}/lots/${i.id}`:`/inventory/${s.id}/lots`}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="lot-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar informações":"Cadastrar lote"}
            </button>
          </div>
        </form>
      `});const c=document.querySelector("#lot-form"),l=document.querySelector("#lot-form-feedback"),d=document.querySelector("#lot-submit"),u=document.querySelector("#lot-quantity"),p=document.querySelector("#lot-total-price"),m=document.querySelector("#lot-unit-price-preview");function f(){if(n)return;const _=Za(u.value),w=Za(p.value);if(!_||_<=0||w===null){m.textContent="-";return}m.textContent=`${X(w/_)} / ${s.base_unit}`}const v=async _=>{_.preventDefault(),D(l,"");const w=new FormData(c),k={purchasedQuantity:n?Number(i.purchased_quantity):Za(w.get("purchasedQuantity")),totalPrice:n?i.total_price===null?null:Number(i.total_price):Za(w.get("totalPrice")),purchaseDate:n?i.purchase_date:String(w.get("purchaseDate")||""),supplier:String(w.get("supplier")||"").trim(),batchNumber:String(w.get("batchNumber")||"").trim(),expirationDate:String(w.get("expirationDate")||""),notes:String(w.get("notes")||"").trim()},S=Mv(k,n);if(S){D(l,S);return}te(d,!0,n?"Salvando…":"Registrando compra…");try{const T=n?await uv(i.id,k):await dv(s.id,k);j(n?"Informações do lote atualizadas.":"Lote cadastrado e entrada de estoque gerada.",{type:"success"}),Q(`/inventory/${s.id}/lots/${T.id}`,{replace:!0})}catch(T){console.error("Erro ao salvar lote:",T),D(l,K(T))}finally{te(d,!1)}};return n||(u.addEventListener("input",f),p.addEventListener("input",f),f()),c.addEventListener("submit",v),()=>{n||(u.removeEventListener("input",f),p.removeEventListener("input",f)),c.removeEventListener("submit",v)}}async function Uv({session:t,params:e}){const a=document.querySelector("#app");let r=null,n=null,s=[];try{[r,n]=await Promise.all([At(e.inputId),ns(e.lotId)]),n&&n.agricultural_input_id===e.inputId&&(s=await cs({lotId:n.id,limit:5}))}catch(o){console.error("Erro ao carregar lote:",o)}if(!r||!n||n.agricultural_input_id!==r.id)return a.innerHTML=O({session:t,title:"Lote",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Lote não encontrado",description:"Este lote não existe ou não pertence a este insumo.",actionLabel:"Voltar ao Barracão",actionHref:"/inventory"})}),null;const i=Zc(n);return a.innerHTML=O({session:t,title:"Lote de estoque",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${r.id}/lots"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Lotes
            </a>
          </div>
        </section>

        <section class="inventory-lot-detail-hero">
          <div>
            <p class="hero-card__eyebrow">
              ${h(r.name)}
            </p>

            <h2>
              ${h(Xc(n))}
            </h2>

            <p>
              ${h(n.supplier||"Fornecedor não informado")}
            </p>
          </div>

          <span
            class="inventory-lot-status ${i.className}"
          >
            ${h(i.label)}
          </span>

          <div class="property-detail-actions">
            <a
              href="/inventory/${r.id}/lots/${n.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${y("edit")}
              Editar identificação
            </a>

            <a
              href="/inventory/transactions/new?input=${r.id}&lot=${n.id}"
              class="button button--primary"
              data-link
            >
              ${y("history")}
              Movimentar estoque
            </a>
          </div>
        </section>

        <section class="inventory-lot-summary-grid">
          <article>
            <span>Saldo do lote</span>
            <strong>
              ${ae(n.current_quantity??0)}
              ${h(n.unit)}
            </strong>
            <small>
              Calculado pelas movimentações
            </small>
          </article>

          <article>
            <span>Quantidade comprada</span>
            <strong>
              ${ae(n.purchased_quantity)}
              ${h(n.unit)}
            </strong>
          </article>

          <article>
            <span>Preço total</span>
            <strong>
              ${X(n.total_price)}
            </strong>
          </article>

          <article>
            <span>Preço unitário</span>
            <strong>
              ${X(n.unit_price)}
            </strong>
            <small>
              por ${h(n.unit)}
            </small>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Data da compra
            </p>
            <p class="detail-card__value">
              ${ne(n.purchase_date)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Validade
            </p>
            <p class="detail-card__value">
              ${ne(n.expiration_date)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Número do lote
            </p>
            <p class="detail-card__value">
              ${h(n.batch_number||"-")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Fornecedor
            </p>
            <p class="detail-card__value">
              ${h(n.supplier||"-")}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${h(n.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>
                Movimentações do lote
              </h2>
              <p>
                O cadastro inicial do lote aparece como uma Entrada automática.
              </p>
            </div>

            <a
              href="/inventory/${r.id}/transactions?lot=${n.id}"
              class="button button--secondary button--compact"
              data-link
            >
              Ver todas
            </a>
          </div>

          ${s.length?`
                <div class="stock-transaction-list">
                  ${s.map(ls).join("")}
                </div>
              `:B({iconName:"history",title:"Nenhuma movimentação encontrada",description:"Se a entrada automática deste lote não aparecer, solicite ao responsável a verificação do barracão."})}
        </section>
      `}),null}function Hv(t,e){return`
    <option value="">
      Todos os insumos
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}${a.active?"":" • inativo"}
          </option>
        `).join("")}
  `}function Fv(t){return`
    <option value="">
      Todos os tipos
    </option>

    ${Kc.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}async function rl({session:t,params:e={}}){const a=document.querySelector("#app"),r=e.inputId||null;let n=null,s=[];try{s=await Br(),r&&(n=await At(r))}catch(w){console.error("Erro ao preparar movimentações:",w)}if(r&&!n)return a.innerHTML=O({session:t,title:"Movimentações",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"history",title:"Insumo não encontrado",description:"Não foi possível localizar o insumo solicitado.",actionLabel:"Voltar ao Barracão",actionHref:"/inventory"})}),null;const i=new URLSearchParams(window.location.search);let o=r||i.get("input")||"",c=i.get("type")||"";const l=i.get("lot")||"";a.innerHTML=O({session:t,title:"Movimentações",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/inventory/${n.id}`:"/inventory"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              ${n?h(n.name):"Barracão"}
            </a>

            <h2 style="margin-top: 10px;">
              ${n?`Movimentações de ${h(n.name)}`:"Histórico de movimentações"}
            </h2>

            <p>
              Toda entrada, saída, ajuste, perda, vencimento ou devolução fica registrada no histórico.
            </p>
          </div>

          <a
            href="/inventory/transactions/new${o?`?input=${encodeURIComponent(o)}${l?`&lot=${encodeURIComponent(l)}`:""}`:""}"
            class="icon-button"
            aria-label="Nova movimentação"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <div class="input-info-note">
          ${y("lock")}
          <div>
            <strong>
              Histórico auditável
            </strong>
            <span>
              Movimentações não são editadas nem apagadas pelo frontend. Correções são feitas com uma nova movimentação de ajuste.
            </span>
          </div>
        </div>

        <section class="stock-transaction-filters">
          ${n?"":`
                <div class="field">
                  <label
                    for="transaction-input-filter"
                  >
                    Insumo
                  </label>

                  <select
                    id="transaction-input-filter"
                  >
                    ${Hv(s,o)}
                  </select>
                </div>
              `}

          <div class="field">
            <label
              for="transaction-type-filter"
            >
              Tipo
            </label>

            <select
              id="transaction-type-filter"
            >
              ${Fv(c)}
            </select>
          </div>
        </section>

        <div class="season-list-actions">
          <a
            href="/inventory/transactions/new${o?`?input=${encodeURIComponent(o)}${l?`&lot=${encodeURIComponent(l)}`:""}`:""}"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova movimentação
          </a>
        </div>

        <div id="stock-transactions-content">
          ${ce({label:"Carregando movimentações…"})}
        </div>
      `});const d=document.querySelector("#stock-transactions-content"),u=document.querySelector("#transaction-input-filter"),p=document.querySelector("#transaction-type-filter");let m=!1;function f(){const w=new URLSearchParams;o&&!n&&w.set("input",o),c&&w.set("type",c),l&&w.set("lot",l);const k=n?`/inventory/${n.id}/transactions`:"/inventory/transactions",S=w.toString();window.history.replaceState({},"",S?`${k}?${S}`:k)}async function v(){d.innerHTML=ce({label:"Carregando movimentações…"});try{const w=await cs({inputId:o||null,lotId:l||null,type:c||null});if(m)return;if(!w.length){d.innerHTML=B({iconName:"history",title:"Nenhuma movimentação encontrada",description:l?"Este lote ainda não possui movimentações compatíveis com o filtro.":"Cadastre um lote para gerar uma entrada automática ou registre um ajuste, perda, vencimento ou devolução.",actionLabel:"Nova movimentação",actionHref:`/inventory/transactions/new${o?`?input=${encodeURIComponent(o)}${l?`&lot=${encodeURIComponent(l)}`:""}`:""}`});return}d.innerHTML=`
        <section class="stock-transaction-list">
          ${w.map(ls).join("")}
        </section>
      `}catch(w){console.error("Erro ao listar movimentações:",w),d.innerHTML=B({iconName:"history",title:"Não foi possível carregar as movimentações",description:"Verifique sua conexão e tente novamente."}),j(K(w),{type:"error"})}}const _=()=>{u&&(o=u.value),c=p.value,f(),v()};return u==null||u.addEventListener("change",_),p.addEventListener("change",_),await v(),()=>{m=!0,u==null||u.removeEventListener("change",_),p.removeEventListener("change",_)}}function Bv(t,e){return`
    <option value="">
      Selecione
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}${a.active?"":" • inativo"}
          </option>
        `).join("")}
  `}function zv(t){return Jc.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${a}
        </option>
      `).join("")}function Vv(t){var a,r,n;return[((a=t.crop)==null?void 0:a.name)||"Ciclo",t.variety,(r=t.area)==null?void 0:r.name,(n=t.property)==null?void 0:n.name].filter(Boolean).join(" • ")}async function Wv({session:t}){const e=document.querySelector("#app");let a=[],r=[];try{[a,r]=await Promise.all([Br(),Hr({archived:!1})])}catch(b){console.error("Erro ao preparar movimentação:",b)}if(!a.length)return e.innerHTML=O({session:t,title:"Movimentação",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"box",title:"Cadastre um insumo primeiro",description:"É necessário possuir um insumo e um lote para registrar movimentações manuais.",actionLabel:"Cadastrar insumo",actionHref:"/inventory/new"})}),null;const n=new URLSearchParams(window.location.search);let s=n.get("input")||"",i=n.get("lot")||"";s&&!a.some(b=>b.id===s)&&(s="",i="");let o=[];if(s)try{o=await Jt({inputId:s})}catch(b){console.error("Erro ao carregar lotes:",b)}i&&!o.some(b=>b.id===i)&&(i=""),e.innerHTML=O({session:t,title:"Nova movimentação",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="${s?`/inventory/${s}/transactions`:"/inventory/transactions"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Movimentações
            </a>

            <h2 style="margin-top: 10px;">
              Registrar movimentação
            </h2>

            <p>
              Ajustes e baixas alteram o saldo somente através deste histórico.
            </p>
          </div>
        </section>

        <div class="input-info-note">
          ${y("info")}
          <div>
            <strong>
              Entrada e saída por uso são automáticas
            </strong>
            <span>
              A entrada é criada ao cadastrar um lote. A saída por uso é registrada quando um insumo é utilizado em uma atividade produtiva.
            </span>
          </div>
        </div>

        <div
          id="transaction-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="transaction-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Movimentação</h2>
              <p>
                Selecione o insumo, lote e o tipo de alteração.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-input"
              >
                Insumo *
              </label>

              <select
                id="transaction-input"
                name="inputId"
                required
              >
                ${Bv(a,s)}
              </select>
            </div>

            <div class="field">
              <label
                for="transaction-lot"
              >
                Lote *
              </label>

              <select
                id="transaction-lot"
                name="lotId"
                required
                ${s?"":"disabled"}
              ></select>

              <small
                id="transaction-lot-hint"
                class="field__hint"
              ></small>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="transaction-type"
                >
                  Tipo *
                </label>

                <select
                  id="transaction-type"
                  name="transactionType"
                  required
                >
                  ${zv("negative_adjustment")}
                </select>
              </div>

              <div class="field">
                <label
                  for="transaction-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="transaction-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 2.5"
                  required
                />
              </div>
            </div>

            <div class="stock-transaction-preview">
              <div>
                <span>
                  Efeito no saldo
                </span>
                <strong
                  id="transaction-effect-preview"
                >
                  -
                </strong>
              </div>

              <div>
                <span>
                  Custo estimado
                </span>
                <strong
                  id="transaction-cost-preview"
                >
                  -
                </strong>
              </div>
            </div>

            <div class="field">
              <label
                for="transaction-occurred-at"
              >
                Data e horário *
              </label>

              <input
                id="transaction-occurred-at"
                name="occurredAt"
                type="datetime-local"
                value="${ya()}"
                required
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Relação com produção</h2>
              <p>
                Opcional. Vincule a movimentação a um ciclo e, se houver, a um evento específico.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-cycle"
              >
                Ciclo produtivo
              </label>

              <select
                id="transaction-cycle"
                name="productionCycleId"
              >
                <option value="">
                  Sem ciclo relacionado
                </option>

                ${r.map(b=>`
                      <option
                        value="${b.id}"
                      >
                        ${h(Vv(b))}
                      </option>
                    `).join("")}
              </select>
            </div>

            <div class="field">
              <label
                for="transaction-event"
              >
                Evento produtivo
              </label>

              <select
                id="transaction-event"
                name="productionEventId"
                disabled
              >
                <option value="">
                  Selecione um ciclo primeiro
                </option>
              </select>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Explique o motivo do ajuste, perda, vencimento ou devolução.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-notes"
              >
                Observações
              </label>

              <textarea
                id="transaction-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: ajuste após conferência física do barracão..."
              ></textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${s?`/inventory/${s}/transactions`:"/inventory/transactions"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="transaction-submit"
              class="button button--primary"
              type="submit"
            >
              Registrar movimentação
            </button>
          </div>
        </form>
      `});const c=document.querySelector("#transaction-form"),l=document.querySelector("#transaction-form-feedback"),d=document.querySelector("#transaction-submit"),u=document.querySelector("#transaction-input"),p=document.querySelector("#transaction-lot"),m=document.querySelector("#transaction-lot-hint"),f=document.querySelector("#transaction-type"),v=document.querySelector("#transaction-quantity"),_=document.querySelector("#transaction-effect-preview"),w=document.querySelector("#transaction-cost-preview"),k=document.querySelector("#transaction-cycle"),S=document.querySelector("#transaction-event");let T=o;function A(){return T.find(b=>b.id===p.value)}function C(){const b=i;p.innerHTML=`
      <option value="">
        ${T.length?"Selecione":"Nenhum lote disponível"}
      </option>

      ${T.map(g=>`
            <option
              value="${g.id}"
              ${b===g.id?"selected":""}
            >
              ${h(g.batch_number?`Lote ${g.batch_number}`:`Compra ${g.purchase_date}`)}
              • saldo ${ae(g.current_quantity??0)} ${h(g.unit)}
            </option>
          `).join("")}
    `,p.disabled=!u.value,i=p.value,I(),E()}function I(){const b=A();if(!b){m.textContent=u.value&&!T.length?"Este insumo ainda não possui lotes. Cadastre uma compra antes de movimentar o estoque.":"";return}m.textContent=`Saldo disponível: ${ae(b.current_quantity??0)} ${b.unit}. Custo do lote: ${X(b.unit_price)} / ${b.unit}.`}function E(){const b=A(),g=Number(v.value);if(!b||!Number.isFinite(g)||g<=0){_.textContent="-",w.textContent="-";return}const R=ba(f.value);_.textContent=`${R>0?"+":"-"}${ae(g)} ${b.unit}`,w.textContent=b.unit_price===null?"-":X(g*Number(b.unit_price))}async function L(){if(s=u.value,i="",!s){T=[],C();return}try{T=await Jt({inputId:s}),C()}catch(b){console.error("Erro ao carregar lotes:",b),j(K(b),{type:"error"})}}async function q(){const b=k.value;if(!b){S.disabled=!0,S.innerHTML=`
        <option value="">
          Selecione um ciclo primeiro
        </option>
      `;return}S.disabled=!0,S.innerHTML=`
      <option value="">
        Carregando eventos...
      </option>
    `;try{const g=await Zn(b);S.innerHTML=`
        <option value="">
          Sem evento específico
        </option>

        ${g.map(R=>`
              <option
                value="${R.id}"
              >
                ${h(R.title)}
              </option>
            `).join("")}
      `,S.disabled=!1}catch(g){console.error("Erro ao carregar eventos:",g),S.innerHTML=`
        <option value="">
          Não foi possível carregar
        </option>
      `}}const $=async b=>{b.preventDefault(),D(l,"");const g=new FormData(c),R=A(),x=Number(g.get("quantity")),H=String(g.get("transactionType")||"");if(!u.value){D(l,"Selecione o insumo.");return}if(!R){D(l,"Selecione um lote.");return}if(!Number.isFinite(x)||x<=0){D(l,"Informe uma quantidade maior que zero.");return}if(ba(H)<0&&x>Number(R.current_quantity??0)){D(l,`Saldo insuficiente no lote. Disponível: ${ae(R.current_quantity??0)} ${R.unit}.`);return}const P=Fn(String(g.get("occurredAt")||""));if(!P){D(l,"Informe uma data e horário válidos.");return}te(d,!0,"Registrando…");try{const N=await Nv({inputId:u.value,lotId:R.id,transactionType:H,quantity:x,productionCycleId:String(g.get("productionCycleId")||""),productionEventId:String(g.get("productionEventId")||""),occurredAt:P,notes:String(g.get("notes")||"").trim()});j("Movimentação registrada. O saldo foi recalculado.",{type:"success"});const F=await At(u.value);F&&Number(F.current_quantity)<=0&&ba(H)<0&&await ss({inputName:F.name}),Q(`/inventory/transactions/${N.id}`,{replace:!0})}catch(N){console.error("Erro ao registrar movimentação:",N),D(l,K(N))}finally{te(d,!1)}};return u.addEventListener("change",L),p.addEventListener("change",()=>{i=p.value,I(),E()}),f.addEventListener("change",E),v.addEventListener("input",E),k.addEventListener("change",q),c.addEventListener("submit",$),C(),()=>{u.removeEventListener("change",L),f.removeEventListener("change",E),v.removeEventListener("input",E),k.removeEventListener("change",q),c.removeEventListener("submit",$)}}async function Gv({session:t,params:e}){var s,i,o,c,l;const a=document.querySelector("#app");let r=null;try{r=await xv(e.transactionId)}catch(d){console.error("Erro ao carregar movimentação:",d)}if(!r)return a.innerHTML=O({session:t,title:"Movimentação",eyebrow:"Barracão",activeNav:"inventory",content:B({iconName:"history",title:"Movimentação não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar às movimentações",actionHref:"/inventory/transactions"})}),null;const n=r.production_cycle;return a.innerHTML=O({session:t,title:"Movimentação",eyebrow:"Barracão",activeNav:"inventory",content:`
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${r.agricultural_input_id}/transactions"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Movimentações
            </a>
          </div>
        </section>

        <section class="stock-transaction-detail-hero">
          <span
            class="stock-transaction-detail-hero__icon ${Rr(r.transaction_type)}"
          >
            ${y(Yc(r.transaction_type))}
          </span>

          <div>
            <p class="hero-card__eyebrow">
              ${h(((s=r.agricultural_input)==null?void 0:s.name)||"Insumo")}
            </p>

            <h2>
              ${h(Qc(r.transaction_type))}
            </h2>

            <p>
              ${Yt(r.occurred_at)}
            </p>
          </div>

          <strong
            class="stock-transaction-detail-hero__quantity ${Rr(r.transaction_type)}"
          >
            ${al(r)}
          </strong>
        </section>

        <div class="input-info-note">
          ${y("lock")}
          <div>
            <strong>
              Registro imutável
            </strong>
            <span>
              Esta movimentação não possui ações de editar ou excluir. Se houver divergência, registre uma nova movimentação de ajuste.
            </span>
          </div>
        </div>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Insumo
            </p>
            <p class="detail-card__value">
              ${h(((i=r.agricultural_input)==null?void 0:i.name)||"-")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Lote
            </p>
            <p class="detail-card__value">
              ${h(tl(r))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Custo unitário
            </p>
            <p class="detail-card__value">
              ${X(r.unit_cost)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Custo total
            </p>
            <p class="detail-card__value">
              ${X(r.total_cost)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo produtivo
            </p>
            <p class="detail-card__value">
              ${h(n?[(o=n.crop)==null?void 0:o.name,n.variety,(c=n.area)==null?void 0:c.name].filter(Boolean).join(" • "):"Sem ciclo relacionado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Evento produtivo
            </p>
            <p class="detail-card__value">
              ${h(((l=r.production_event)==null?void 0:l.title)||"Sem evento relacionado")}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <div class="inventory-transaction-detail-actions">
          <a
            href="/inventory/${r.agricultural_input_id}"
            class="button button--secondary"
            data-link
          >
            Ver insumo
          </a>

          ${r.inventory_lot_id?`
                <a
                  href="/inventory/${r.agricultural_input_id}/lots/${r.inventory_lot_id}"
                  class="button button--secondary"
                  data-link
                >
                  Ver lote
                </a>
              `:""}
        </div>
      `}),null}function Kv(t,{archived:e=!1}={}){const a=Lr(t);return`
    <article class="consultant-card">
      <a
        href="/more/consultants/${t.id}"
        class="consultant-card__main"
        data-link
      >
        <div class="consultant-card__top">
          <span class="consultant-card__icon">
            ${y("user")}
          </span>

          <div class="consultant-card__identity">
            <h3>
              ${h(t.name)}
            </h3>

            <p>
              ${h(t.specialty||t.company||"Consultor agrícola")}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="consultant-card__meta">
          ${t.company?`
                <span>
                  ${y("briefcase")}
                  ${h(t.company)}
                </span>
              `:""}

          ${t.whatsapp||t.phone?`
                <span>
                  ${y("phone")}
                  ${h(t.whatsapp||t.phone)}
                </span>
              `:""}
        </div>
      </a>

      <div class="consultant-card__footer">
        <span
          class="
            consultant-status
            ${e?"consultant-status--archived":t.active?"consultant-status--active":"consultant-status--inactive"}
          "
        >
          ${e?"Arquivado":t.active?"Ativo":"Inativo"}
        </span>

        ${!e&&t.active&&a?`
              <a
                href="${h(a)}"
                class="button button--whatsapp button--compact"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${y("messageCircle")}
                WhatsApp
              </a>
            `:""}
      </div>
    </article>
  `}async function Jv({session:t}){const e=document.querySelector("#app");e.innerHTML=O({session:t,title:"Consultores",eyebrow:"Rede de apoio",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Consultores agrícolas
            </p>

            <h2>
              Contatos e suporte técnico
            </h2>

            <p>
              Cadastre consultores e abra conversas no WhatsApp sempre por ação explícita do usuário.
            </p>
          </div>

          <a
            href="/more/consultants/new"
            class="icon-button"
            aria-label="Cadastrar consultor"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <section class="consultant-toolbar">
          <div class="crop-search">
            ${y("search")}

            <input
              id="consultant-search"
              type="search"
              placeholder="Buscar nome, empresa ou especialidade..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control"
            role="tablist"
            aria-label="Situação dos consultores"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-consultant-filter="active"
              aria-selected="true"
            >
              Ativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-consultant-filter="inactive"
              aria-selected="false"
            >
              Inativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-consultant-filter="archived"
              aria-selected="false"
            >
              Arquivados
            </button>
          </div>
        </section>

        <div class="season-list-actions">
          <a
            href="/more/consultants/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Novo consultor
          </a>
        </div>

        <div id="consultants-content">
          ${ce({label:"Carregando consultores…"})}
        </div>
      `});const a=document.querySelector("#consultants-content"),r=document.querySelector("#consultant-search"),n=[...document.querySelectorAll("[data-consultant-filter]")];let s="active",i=[];function o(){const p=r.value.trim().toLocaleLowerCase("pt-BR");return i.filter(m=>p?[m.name,m.company,m.specialty,m.email,m.phone,m.whatsapp].filter(Boolean).some(f=>String(f).toLocaleLowerCase("pt-BR").includes(p)):!0)}function c(){const p=o();if(!p.length){a.innerHTML=B({iconName:"users",title:s==="active"?"Nenhum consultor ativo":"Nenhum consultor encontrado",description:s==="active"?"Cadastre um contato para ter acesso rápido ao WhatsApp quando precisar de suporte ou reposição.":"Altere o filtro ou a busca.",actionLabel:s==="active"?"Cadastrar consultor":null,actionHref:s==="active"?"/more/consultants/new":null});return}a.innerHTML=`
      <section class="consultant-list">
        ${p.map(m=>Kv(m,{archived:s==="archived"})).join("")}
      </section>
    `}async function l(){a.innerHTML=ce({label:"Carregando consultores…"});try{s==="archived"?i=await In({archived:!0}):i=await In({active:s==="active"}),c()}catch(p){console.error("Erro ao listar consultores:",p),a.innerHTML=B({iconName:"users",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(p),{type:"error"})}}const d=p=>{const m=p.target.closest("[data-consultant-filter]");m&&(s=m.dataset.consultantFilter,n.forEach(f=>{const v=f===m;f.classList.toggle("segmented-control__button--active",v),f.setAttribute("aria-selected",String(v))}),l())},u=()=>{c()};return n.forEach(p=>{p.addEventListener("click",d)}),r.addEventListener("input",u),await l(),()=>{n.forEach(p=>{p.removeEventListener("click",d)}),r.removeEventListener("input",u)}}function Qv(t){return t.name.length<2?"Informe um nome com pelo menos 2 caracteres.":t.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)?"Informe um e-mail válido.":t.whatsapp&&!Wc(t.whatsapp)?"Informe um número de WhatsApp válido, preferencialmente com DDD.":null}async function nl({session:t,params:e,mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null;if(n){try{s=await zc(e.consultantId)}catch(d){console.error("Erro ao carregar consultor:",d)}if(!s||s.deleted_at)return r.innerHTML=O({session:t,title:"Consultor",eyebrow:"Rede de apoio",activeNav:"more",content:B({iconName:"users",title:"Consultor não encontrado",description:"Este registro não existe ou foi arquivado.",actionLabel:"Voltar para consultores",actionHref:"/more/consultants"})}),null}r.innerHTML=O({session:t,title:n?"Editar consultor":"Novo consultor",eyebrow:"Rede de apoio",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/more/consultants/${s.id}`:"/more/consultants"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar consultor":"Cadastrar consultor agrícola"}
            </h2>

            <p>
              Guarde os contatos usados para orientação técnica e reposição de insumos.
            </p>
          </div>
        </section>

        <div
          id="consultant-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="consultant-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Nome, empresa e área principal de atuação.
              </p>
            </div>

            <div class="field">
              <label for="consultant-name">
                Nome *
              </label>

              <input
                id="consultant-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="140"
                placeholder="Ex.: Carlos Almeida"
                value="${h((s==null?void 0:s.name)||"")}"
                required
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="consultant-company"
                >
                  Empresa
                </label>

                <input
                  id="consultant-company"
                  name="company"
                  type="text"
                  maxlength="140"
                  placeholder="Ex.: Agro Consultoria"
                  value="${h((s==null?void 0:s.company)||"")}"
                />
              </div>

              <div class="field">
                <label
                  for="consultant-specialty"
                >
                  Especialidade
                </label>

                <input
                  id="consultant-specialty"
                  name="specialty"
                  type="text"
                  maxlength="160"
                  placeholder="Ex.: Nutrição de plantas"
                  value="${h((s==null?void 0:s.specialty)||"")}"
                />
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Contato</h2>
              <p>
                O WhatsApp será usado apenas para abrir a conversa após sua ação.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="consultant-phone"
                >
                  Telefone
                </label>

                <input
                  id="consultant-phone"
                  name="phone"
                  type="tel"
                  maxlength="30"
                  placeholder="Ex.: (16) 3333-4444"
                  value="${h((s==null?void 0:s.phone)||"")}"
                />
              </div>

              <div class="field">
                <label
                  for="consultant-whatsapp"
                >
                  WhatsApp
                </label>

                <input
                  id="consultant-whatsapp"
                  name="whatsapp"
                  type="tel"
                  maxlength="30"
                  placeholder="Ex.: (16) 99999-8888"
                  value="${h((s==null?void 0:s.whatsapp)||"")}"
                />

                <small class="field__hint">
                  Se informar apenas DDD + número, o Meu Agro considera o DDI do Brasil (+55).
                </small>
              </div>
            </div>

            <div class="field">
              <label
                for="consultant-email"
              >
                E-mail
              </label>

              <input
                id="consultant-email"
                name="email"
                type="email"
                maxlength="180"
                placeholder="consultor@empresa.com"
                value="${h((s==null?void 0:s.email)||"")}"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Registre informações úteis sobre atendimento, regiões ou produtos.
              </p>
            </div>

            <div class="field">
              <label
                for="consultant-notes"
              >
                Observações
              </label>

              <textarea
                id="consultant-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: atende de segunda a sexta e trabalha com fertilizantes e defensivos."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/more/consultants/${s.id}`:"/more/consultants"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="consultant-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Cadastrar consultor"}
            </button>
          </div>
        </form>
      `});const i=document.querySelector("#consultant-form"),o=document.querySelector("#consultant-form-feedback"),c=document.querySelector("#consultant-submit"),l=async d=>{d.preventDefault(),D(o,"");const u=new FormData(i),p={name:String(u.get("name")||"").trim(),company:String(u.get("company")||"").trim(),phone:String(u.get("phone")||"").trim(),whatsapp:String(u.get("whatsapp")||"").trim(),email:String(u.get("email")||"").trim(),specialty:String(u.get("specialty")||"").trim(),notes:String(u.get("notes")||"").trim()},m=Qv(p);if(m){D(o,m);return}te(c,!0,n?"Salvando…":"Cadastrando…");try{const f=n?await gv(s.id,p):await vv(p);j(n?"Consultor atualizado.":"Consultor cadastrado.",{type:"success"}),Q(`/more/consultants/${f.id}`,{replace:!0})}catch(f){console.error("Erro ao salvar consultor:",f),D(o,K(f))}finally{te(c,!1)}};return i.addEventListener("submit",l),()=>{i.removeEventListener("submit",l)}}async function Yv({session:t,params:e}){const a=document.querySelector("#app");let r=null;try{r=await zc(e.consultantId)}catch(p){console.error("Erro ao carregar consultor:",p)}if(!r)return a.innerHTML=O({session:t,title:"Consultor",eyebrow:"Rede de apoio",activeNav:"more",content:B({iconName:"users",title:"Consultor não encontrado",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para consultores",actionHref:"/more/consultants"})}),null;const n=!!r.deleted_at,s=Lr(r);a.innerHTML=O({session:t,title:"Consultor",eyebrow:"Rede de apoio",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/consultants"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Consultores
            </a>
          </div>
        </section>

        <section class="consultant-detail-hero">
          <div class="consultant-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(r.specialty||"Consultor agrícola")}
              </p>

              <h2>
                ${h(r.name)}
              </h2>

              <p>
                ${h(r.company||"Sem empresa informada")}
              </p>
            </div>

            <span
              class="
                consultant-status
                ${n?"consultant-status--archived":r.active?"consultant-status--active":"consultant-status--inactive"}
              "
            >
              ${n?"Arquivado":r.active?"Ativo":"Inativo"}
            </span>
          </div>

          ${n?`
                <div class="property-detail-actions">
                  <button
                    id="restore-consultant"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("refresh")}
                    Restaurar
                  </button>
                </div>
              `:`
                <div class="property-detail-actions">
                  ${s&&r.active?`
                        <a
                          href="${h(s)}"
                          class="button button--whatsapp"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ${y("messageCircle")}
                          Falar no WhatsApp
                        </a>
                      `:""}

                  <a
                    href="/more/consultants/${r.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${y("edit")}
                    Editar
                  </a>
                </div>
              `}
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Empresa
            </p>

            <p class="detail-card__value">
              ${h(r.company||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Especialidade
            </p>

            <p class="detail-card__value">
              ${h(r.specialty||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Telefone
            </p>

            <p class="detail-card__value">
              ${h(r.phone||"Não informado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              WhatsApp
            </p>

            <p class="detail-card__value">
              ${h(r.whatsapp||r.phone||"Não informado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              E-mail
            </p>

            <p class="detail-card__value">
              ${h(r.email||"Não informado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrado em
            </p>

            <p class="detail-card__value">
              ${ne(r.created_at)}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        ${n?"":`
              <section class="consultant-management-card">
                <div>
                  <strong>
                    Situação do contato
                  </strong>

                  <p>
                    Consultores inativos deixam de aparecer no fluxo de reposição, mas continuam preservados.
                  </p>
                </div>

                <div class="consultant-management-card__actions">
                  <button
                    id="toggle-consultant-active"
                    class="button button--secondary"
                    type="button"
                  >
                    ${r.active?y("archive"):y("refresh")}

                    ${r.active?"Desativar":"Reativar"}
                  </button>

                  <button
                    id="archive-consultant"
                    class="button button--danger"
                    type="button"
                  >
                    ${y("trash")}
                    Arquivar
                  </button>
                </div>
              </section>
            `}
      `});const i=document.querySelector("#toggle-consultant-active"),o=document.querySelector("#archive-consultant"),c=document.querySelector("#restore-consultant"),l=async()=>{const p=!r.active;if(await ie({title:p?"Reativar consultor?":"Desativar consultor?",message:p?"Ele voltará a aparecer nos fluxos de contato e reposição.":"O contato será preservado, mas deixará de aparecer no fluxo de reposição.",confirmLabel:p?"Reativar":"Desativar",danger:!p})){i.disabled=!0;try{await yv(r.id,p),j(p?"Consultor reativado.":"Consultor desativado.",{type:"success"}),Q(`/more/consultants/${r.id}`,{replace:!0})}catch(f){console.error("Erro ao alterar consultor:",f),j(K(f),{type:"error"}),i.disabled=!1}}},d=async()=>{if(await ie({title:"Arquivar consultor?",message:"O registro sairá das listas normais, mas continuará preservado.",confirmLabel:"Arquivar",danger:!0})){o.disabled=!0;try{await _v(r.id),j("Consultor arquivado.",{type:"success"}),Q("/more/consultants",{replace:!0})}catch(m){console.error("Erro ao arquivar consultor:",m),j(K(m),{type:"error"}),o.disabled=!1}}},u=async()=>{if(await ie({title:"Restaurar consultor?",message:"O consultor voltará ativo e disponível nos fluxos de contato.",confirmLabel:"Restaurar"})){c.disabled=!0;try{await bv(r.id),j("Consultor restaurado.",{type:"success"}),Q(`/more/consultants/${r.id}`,{replace:!0})}catch(m){console.error("Erro ao restaurar consultor:",m),j(K(m),{type:"error"}),c.disabled=!1}}};return i==null||i.addEventListener("click",l),o==null||o.addEventListener("click",d),c==null||c.addEventListener("click",u),()=>{i==null||i.removeEventListener("click",l),o==null||o.removeEventListener("click",d),c==null||c.removeEventListener("click",u)}}const Di=[["all","Todos"],["overdue","Atrasados"],["today","Hoje"],["harvest_week","7 dias"],["upcoming","Próximos"]];function Zv(t){return t==null?"no_forecast":t<0?"overdue":t===0?"today":t<=7?"harvest_week":"upcoming"}function Xv(t){switch(t){case"overdue":return"Previsão atrasada";case"today":return"Previsto para hoje";case"harvest_week":return"Semana da colheita";case"upcoming":return"Próxima colheita";default:return"Sem previsão"}}function eg(t){return`harvest-forecast-status--${t}`}const tg=["harvested","closed","cancelled"],ag=`
  id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  initial_harvest_forecast,
  current_harvest_forecast,
  final_harvest_date,
  status,
  deleted_at,
  crop:crops (
    id,
    name,
    category,
    average_cycle_days
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
`;function rg(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function ng(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function sg(t){const e=ng(),a=t.current_harvest_forecast?br(t.current_harvest_forecast,e):null,r=Zv(a);return{...t,days_to_harvest:a,forecast_state:r}}async function sl({propertyId:t=null,filter:e="all"}={}){let r=rg().from("production_cycles").select(ag).is("deleted_at",null).not("status","in",`(${tg.join(",")})`).not("current_harvest_forecast","is",null).order("current_harvest_forecast",{ascending:!0});t&&(r=r.eq("property_id",t));const{data:n,error:s}=await r;if(s)throw s;const i=(n??[]).map(sg);return e==="all"?i:i.filter(o=>o.forecast_state===e)}async function ig(){const t=await sl(),e={total:t.length,overdue:0,today:0,harvest_week:0,upcoming:0};for(const a of t)Object.hasOwn(e,a.forecast_state)&&(e[a.forecast_state]+=1);return e}function og(t){const e=t.days_to_harvest;if(e<0){const a=Math.abs(e);return`Atrasada há ${a} ${a===1?"dia":"dias"}`}return e===0?"Prevista para hoje":e===1?"Falta 1 dia":`Faltam ${e} dias`}function cg(t){var a,r,n,s;const e=t.variety?`${((a=t.crop)==null?void 0:a.name)||"Cultura"} • ${t.variety}`:((r=t.crop)==null?void 0:r.name)||"Cultura";return`
    <article class="harvest-forecast-card">
      <a
        href="/plantings/${t.id}"
        class="harvest-forecast-card__main"
        data-link
      >
        <div class="harvest-forecast-card__top">
          <span class="harvest-forecast-card__icon">
            ${y("harvest")}
          </span>

          <div class="harvest-forecast-card__identity">
            <h3>
              ${h(e)}
            </h3>

            <p>
              ${h(((n=t.property)==null?void 0:n.name)||"Propriedade")}
              •
              ${h(((s=t.area)==null?void 0:s.name)||"Área")}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="harvest-forecast-card__status-row">
          <span
            class="
              harvest-forecast-status
              ${eg(t.forecast_state)}
            "
          >
            ${h(Xv(t.forecast_state))}
          </span>

          <strong>
            ${h(og(t))}
          </strong>
        </div>

        <div class="harvest-forecast-card__date">
          ${y("calendar")}

          <span>
            Previsão atual:
            <strong>
              ${ne(t.current_harvest_forecast)}
            </strong>
          </span>
        </div>

        ${t.initial_harvest_forecast&&t.initial_harvest_forecast!==t.current_harvest_forecast?`
              <p class="harvest-forecast-card__initial">
                Previsão inicial:
                ${ne(t.initial_harvest_forecast)}
              </p>
            `:""}
      </a>
    </article>
  `}function lg(t,e){return`
    <option value="">
      Todas as propriedades
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${a.id===e?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}async function dg({session:t}){const e=document.querySelector("#app");let a=[],r={total:0,overdue:0,today:0,harvest_week:0,upcoming:0};try{[a,r]=await Promise.all([rt(),ig()])}catch(v){console.error("Erro ao preparar previsão de colheita:",v)}const n=new URLSearchParams(window.location.search);let s=n.get("filter")||"all",i=n.get("property")||"";Di.some(([v])=>v===s)||(s="all"),e.innerHTML=O({session:t,title:"Previsão de colheita",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Previsão de colheita
            </p>

            <h2>
              Acompanhe o que está próximo de colher
            </h2>

            <p>
              A previsão atual do ciclo é comparada com a data de hoje para destacar atrasos, colheitas do dia e a semana de colheita.
            </p>
          </div>

          <a
            href="/more/settings"
            class="icon-button"
            aria-label="Configurar lembretes"
            data-link
          >
            ${y("bell")}
          </a>
        </section>

        <section class="harvest-summary-grid">
          <article class="harvest-summary-card harvest-summary-card--danger">
            <span>Atrasadas</span>
            <strong>
              ${r.overdue}
            </strong>
          </article>

          <article class="harvest-summary-card harvest-summary-card--today">
            <span>Hoje</span>
            <strong>
              ${r.today}
            </strong>
          </article>

          <article class="harvest-summary-card harvest-summary-card--week">
            <span>Próximos 7 dias</span>
            <strong>
              ${r.harvest_week}
            </strong>
          </article>

          <article class="harvest-summary-card">
            <span>Com previsão</span>
            <strong>
              ${r.total}
            </strong>
          </article>
        </section>

        <section class="harvest-forecast-toolbar">
          <div
            class="segmented-control harvest-forecast-tabs"
            role="tablist"
            aria-label="Filtro de previsão"
          >
            ${Di.map(([v,_])=>`
                  <button
                    type="button"
                    class="
                      segmented-control__button
                      ${v===s?"segmented-control__button--active":""}
                    "
                    data-harvest-filter="${v}"
                    aria-selected="${v===s}"
                  >
                    ${_}
                  </button>
                `).join("")}
          </div>

          <div class="field harvest-forecast-property-filter">
            <label
              for="harvest-property"
            >
              Propriedade
            </label>

            <select
              id="harvest-property"
            >
              ${lg(a,i)}
            </select>
          </div>
        </section>

        <div
          id="harvest-forecast-content"
        >
          ${ce({label:"Carregando previsões…"})}
        </div>
      `});const o=document.querySelector("#harvest-forecast-content"),c=document.querySelector("#harvest-property"),l=[...document.querySelectorAll("[data-harvest-filter]")];let d=!1;function u(){const v=new URLSearchParams;s!=="all"&&v.set("filter",s),i&&v.set("property",i);const _=v.toString();window.history.replaceState({},"",_?`/more/harvest-forecast?${_}`:"/more/harvest-forecast")}async function p(){o.innerHTML=ce({label:"Carregando previsões…"});try{const v=await sl({propertyId:i||null,filter:s});if(d)return;if(!v.length){o.innerHTML=B({iconName:"harvest",title:"Nenhum ciclo neste filtro",description:s==="all"?"Os ciclos com previsão atual de colheita aparecerão aqui.":"Altere o filtro ou atualize a previsão de um plantio.",actionLabel:"Abrir plantios",actionHref:"/plantings"});return}o.innerHTML=`
        <section class="harvest-forecast-list">
          ${v.map(cg).join("")}
        </section>
      `}catch(v){console.error("Erro ao carregar previsões:",v),o.innerHTML=B({iconName:"harvest",title:"Não foi possível carregar",description:"Verifique sua conexão e tente novamente."}),j(K(v),{type:"error"})}}const m=v=>{const _=v.target.closest("[data-harvest-filter]");_&&(s=_.dataset.harvestFilter,l.forEach(w=>{const k=w===_;w.classList.toggle("segmented-control__button--active",k),w.setAttribute("aria-selected",String(k))}),u(),p())},f=()=>{i=c.value,u(),p()};return l.forEach(v=>{v.addEventListener("click",m)}),c.addEventListener("change",f),await p(),()=>{d=!0,l.forEach(v=>{v.removeEventListener("click",m)}),c.removeEventListener("change",f)}}const ct={LIGHT:"light",DARK:"dark"},ug=[{value:ct.LIGHT,label:"Claro",description:"Visual padrão do Meu Agro, com fundo claro.",iconName:"sun"},{value:ct.DARK,label:"Escuro",description:"Fundo escuro e menor luminosidade para uso noturno.",iconName:"moon"}],il="meu-agro:appearance-theme",pg={[ct.LIGHT]:"#1f5d3a",[ct.DARK]:"#0f1511"};function ds(t){return t===ct.DARK?ct.DARK:ct.LIGHT}function ol(){try{return ds(window.localStorage.getItem(il))}catch{return ct.LIGHT}}function hg(){return ds(document.documentElement.dataset.theme||ol())}function cl(t,{persist:e=!1}={}){const a=ds(t);document.documentElement.dataset.theme=a,document.documentElement.style.colorScheme=a;const r=document.querySelector('meta[name="theme-color"]');if(r&&r.setAttribute("content",pg[a]),e)try{window.localStorage.setItem(il,a)}catch{}return window.dispatchEvent(new CustomEvent("meu-agro:theme-change",{detail:{theme:a}})),a}function mg(t){return cl(t,{persist:!0})}function fg(){return cl(ol(),{persist:!1})}const mn=()=>{window.dispatchEvent(new PopStateEvent("popstate"))};function Mi(t){return String(t).padStart(2,"0")}function vg(t){return`${Mi(t.harvest_reminder_hour)}:${Mi(t.harvest_reminder_minute)}`}function gg(t){switch(t){case"granted":return"Permitida";case"denied":return"Negada";case"prompt":case"prompt-with-rationale":return"Aguardando permissão";case"web":return"Disponível no Android";default:return"Não verificada"}}function yg(t){switch(t){case"granted":return"Horário exato permitido";case"denied":return"Horário aproximado";case"prompt":case"prompt-with-rationale":return"Pode ser ativado";case"not_applicable":return"Não se aplica";default:return"Não verificado"}}function _g(t){var e;return`
    <a
      href="${((e=t.metadata)==null?void 0:e.route)||`/plantings/${t.production_cycle_id}`}"
      class="button button--secondary notification-preview"
      data-link
    >
      <span class="notification-preview__icon">
        ${y("bell")}
      </span>

      <span class="notification-preview__content">
        <strong>
          ${h(t.title)}
        </strong>

        <span>
          ${h(t.body)}
        </span>

        <small>
          ${Yt(t.scheduled_for)}
        </small>
      </span>

      ${y("chevronRight")}
    </a>
  `}async function bg({session:t}){const e=document.querySelector("#app");let a,r,n=[];try{[a,r]=await Promise.all([Om(),Fm()]),await bt(),n=await Mm(12)}catch(A){console.error("Erro ao carregar configurações:",A),a={harvest_reminders_enabled:!0,harvest_reminder_hour:8,harvest_reminder_minute:0,harvest_alert_days_before:7,timezone:"America/Sao_Paulo"},r={native:!1,platform:"Navegador",permission:"web",exactAlarm:"not_applicable"}}const s=Intl.DateTimeFormat().resolvedOptions().timeZone||"America/Sao_Paulo",i=hg();e.innerHTML=O({session:t,title:"Configurações",eyebrow:"Meu Agro",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Configurações
            </p>

            <h2>
              Aparência e preferências
            </h2>

            <p>
              Escolha o tema do aplicativo e configure os lembretes de colheita.
            </p>
          </div>
        </section>

        <section class="appearance-card">
          <div class="appearance-card__header">
            <p class="section-eyebrow">
              Aparência
            </p>

            <h2>
              Tema do aplicativo
            </h2>

            <p>
              Escolha entre o visual claro padrão e o tema escuro. A preferência fica salva neste dispositivo.
            </p>
          </div>

          <div
            class="appearance-options"
            role="radiogroup"
            aria-label="Tema do aplicativo"
          >
            ${ug.map(A=>`
                  <label class="appearance-option">
                    <input
                      type="radio"
                      name="appearanceTheme"
                      value="${A.value}"
                      ${A.value===i?"checked":""}
                    />

                    <span class="appearance-option__content">
                      <span
                        class="
                          appearance-option__preview
                          appearance-option__preview--${A.value}
                        "
                      >
                        ${y(A.iconName)}
                      </span>

                      <span class="appearance-option__text">
                        <strong>
                          ${h(A.label)}
                        </strong>

                        <span>
                          ${h(A.description)}
                        </span>
                      </span>
                    </span>
                  </label>
                `).join("")}
          </div>
        </section>

        <div
          id="settings-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="notification-settings-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="settings-toggle-row">
              <div>
                <h2>
                  Lembretes de colheita
                </h2>

                <p>
                  Durante a janela de colheita, o aplicativo agenda um aviso diário até o ciclo ser colhido, encerrado ou cancelado.
                </p>
              </div>

              <label class="switch-control">
                <input
                  id="harvest-reminders-enabled"
                  name="harvestRemindersEnabled"
                  type="checkbox"
                  ${a.harvest_reminders_enabled?"checked":""}
                />

                <span
                  class="switch-control__track"
                  aria-hidden="true"
                ></span>
              </label>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Quando avisar
              </h2>

              <p>
                O padrão do Meu Agro é iniciar os lembretes 7 dias antes da previsão, às 08:00.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-reminder-time"
                >
                  Horário diário
                </label>

                <input
                  id="harvest-reminder-time"
                  name="harvestReminderTime"
                  type="time"
                  value="${vg(a)}"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-alert-days"
                >
                  Antecedência
                </label>

                <div class="field-with-suffix">
                  <input
                    id="harvest-alert-days"
                    name="harvestAlertDaysBefore"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value="${a.harvest_alert_days_before}"
                    required
                  />

                  <span>
                    dias
                  </span>
                </div>
              </div>
            </div>

            <div class="field">
              <label
                for="notification-timezone"
              >
                Fuso horário
              </label>

              <input
                id="notification-timezone"
                name="timezone"
                type="text"
                value="${h(a.timezone||s)}"
                list="timezone-suggestions"
                required
              />

              <datalist
                id="timezone-suggestions"
              >
                <option
                  value="${h(s)}"
                ></option>
                <option
                  value="America/Sao_Paulo"
                ></option>
              </datalist>

              <small class="field__hint">
                Fuso detectado neste dispositivo:
                ${h(s)}.
              </small>
            </div>
          </section>

          <div class="property-form-actions">
            <button
              id="settings-save"
              class="button button--primary"
              type="submit"
            >
              Salvar e sincronizar
            </button>
          </div>
        </form>

        <section class="notification-runtime-card">
          <div class="notification-runtime-card__header">
            <div>
              <p class="section-eyebrow">
                Lembretes de colheita
              </p>

              <h2>
                Notificações Android
              </h2>
            </div>

            <span class="notification-platform-badge">
              ${h(r.platform)}
            </span>
          </div>

          <div class="notification-runtime-grid">
            <div>
              <span>
                Permissão
              </span>

              <strong
                id="notification-permission-label"
              >
                ${gg(r.permission)}
              </strong>
            </div>

            <div>
              <span>
                Horário
              </span>

              <strong
                id="exact-alarm-label"
              >
                ${yg(r.exactAlarm)}
              </strong>
            </div>
          </div>

          ${r.native?`
                <div class="notification-runtime-actions">
                  <button
                    id="request-notification-permission"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("bell")}
                    Permitir notificações
                  </button>

                  <button
                    id="request-exact-alarm"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("clock")}
                    Ativar horário exato
                  </button>

                  <button
                    id="test-notification"
                    class="button button--secondary"
                    type="button"
                  >
                    ${y("bell")}
                    Enviar teste
                  </button>

                  <button
                    id="sync-notifications"
                    class="button button--ghost"
                    type="button"
                  >
                    ${y("refresh")}
                    Sincronizar
                  </button>
                </div>
              `:`
                <div class="notification-browser-note">
                  ${y("info")}

                  <div>
                    <strong>
                      Modo navegador
                    </strong>

                    <p>
                      Os lembretes agendados são exibidos no aplicativo Android quando as notificações estão permitidas.
                    </p>
                  </div>
                </div>
              `}
        </section>

        <section class="scheduled-notifications-card">
          <div class="scheduled-notifications-card__header">
            <div>
              <p class="section-eyebrow">
                Próximos lembretes
              </p>

              <h2>
                Fila de colheita
              </h2>
            </div>

            <span>
              ${n.length}
            </span>
          </div>

          ${n.length?`
                <div class="notification-preview-list">
                  ${n.map(_g).join("")}
                </div>
              `:`
                <div class="settings-empty-state">
                  ${y("bell")}

                  <p>
                    Nenhum lembrete está agendado neste momento.
                  </p>
                </div>
              `}
        </section>
      `});const o=document.querySelector("#notification-settings-form"),c=document.querySelector("#settings-feedback"),l=document.querySelector("#settings-save"),d=document.querySelector("#request-notification-permission"),u=document.querySelector("#request-exact-alarm"),p=document.querySelector("#test-notification"),m=document.querySelector("#sync-notifications"),f=[...document.querySelectorAll('input[name="appearanceTheme"]')],v=A=>{const C=A.currentTarget;if(!C.checked)return;const I=mg(C.value);j(I==="dark"?"Tema escuro ativado.":"Tema claro ativado.",{type:"success"})},_=async A=>{var $;A.preventDefault(),D(c,"");const C=new FormData(o),I=String(C.get("harvestReminderTime")||"08:00"),[E,L]=I.split(":").map(Number),q={harvestRemindersEnabled:o.querySelector("#harvest-reminders-enabled").checked,harvestReminderHour:E,harvestReminderMinute:L,harvestAlertDaysBefore:Number(C.get("harvestAlertDaysBefore")),timezone:String(C.get("timezone")||s).trim()};te(l,!0,"Sincronizando…");try{await jm(q);const b=await bt();j(($=b.nativeResult)!=null&&$.native?`${b.queueCount} lembretes sincronizados com o dispositivo.`:`${b.queueCount} lembretes preparados na fila.`,{type:"success"}),mn()}catch(b){console.error("Erro ao salvar preferências:",b),D(c,K(b))}finally{te(l,!1)}},w=async()=>{try{const A=await ec();j(A.display==="granted"?"Permissão de notificações concedida.":"A permissão de notificações não foi concedida.",{type:A.display==="granted"?"success":"error"}),await bt(),mn()}catch(A){j(K(A),{type:"error"})}},k=async()=>{try{await Lm(),j("Configuração de horário exato atualizada. O aplicativo pode reiniciar ao alterar essa permissão."),window.setTimeout(()=>{mn()},700)}catch(A){j(K(A),{type:"error"})}},S=async()=>{try{await qm(),j("Notificação de teste agendada para daqui a alguns segundos.",{type:"success"})}catch(A){j(K(A),{type:"error"})}},T=async()=>{try{const A=await bt();j(`${A.queueCount} lembretes sincronizados.`,{type:"success"})}catch(A){j(K(A),{type:"error"})}};return f.forEach(A=>{A.addEventListener("change",v)}),o.addEventListener("submit",_),d==null||d.addEventListener("click",w),u==null||u.addEventListener("click",k),p==null||p.addEventListener("click",S),m==null||m.addEventListener("click",T),()=>{f.forEach(A=>{A.removeEventListener("change",v)}),o.removeEventListener("submit",_),d==null||d.removeEventListener("click",w),u==null||u.removeEventListener("click",k),p==null||p.removeEventListener("click",S),m==null||m.removeEventListener("click",T)}}function wg(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0")].join("-")}function $g(t,e){return`
    <option value="">
      Todas as propriedades
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${a.id===e?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}function Sg(t){return`
    <option value="">
      Todos os destinos
    </option>

    ${Xn.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}async function Eg({session:t}){const e=document.querySelector("#app");let a=[];try{a=await rt()}catch(T){console.error("Erro ao carregar propriedades:",T)}const r=new URLSearchParams(window.location.search);let n=r.get("property")||"",s=r.get("cycle")||"",i=r.get("destination")||"",o=r.get("month")||"";e.innerHTML=O({session:t,title:"Colheitas",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Colheitas
            </p>

            <h2>
              Colheitas registradas
            </h2>

            <p>
              Um mesmo ciclo pode receber várias colheitas sem perder o histórico das anteriores.
            </p>
          </div>

          <a
            href="/more/harvests/new"
            class="icon-button"
            aria-label="Registrar colheita"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <section class="harvest-toolbar">
          <div class="field">
            <label
              for="harvest-property-filter"
            >
              Propriedade
            </label>

            <select
              id="harvest-property-filter"
            >
              ${$g(a,n)}
            </select>
          </div>

          <div class="field">
            <label
              for="harvest-destination-filter"
            >
              Destino
            </label>

            <select
              id="harvest-destination-filter"
            >
              ${Sg(i)}
            </select>
          </div>

          <div class="field">
            <label
              for="harvest-month-filter"
            >
              Mês
            </label>

            <input
              id="harvest-month-filter"
              type="month"
              value="${h(o)}"
            />
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="harvest-current-month"
            class="button button--ghost button--compact"
            type="button"
          >
            ${y("calendar")}
            Mês atual
          </button>

          <button
            id="harvest-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/harvests/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova colheita
          </a>
        </div>

        <div
          id="harvests-content"
        >
          ${ce({label:"Carregando colheitas…"})}
        </div>
      `});const c=document.querySelector("#harvests-content"),l=document.querySelector("#harvest-property-filter"),d=document.querySelector("#harvest-destination-filter"),u=document.querySelector("#harvest-month-filter"),p=document.querySelector("#harvest-current-month"),m=document.querySelector("#harvest-clear-filters");let f=!1;function v(){const T=new URLSearchParams;n&&T.set("property",n),s&&T.set("cycle",s),i&&T.set("destination",i),o&&T.set("month",o);const A=T.toString();window.history.replaceState({},"",A?`/more/harvests?${A}`:"/more/harvests")}async function _(){c.innerHTML=ce({label:"Carregando colheitas…"});try{const T=await ts({cycleId:s||null,propertyId:n||null,destination:i||null,month:o||null});if(f)return;if(!T.length){c.innerHTML=B({iconName:"harvest",title:"Nenhuma colheita encontrada",description:"Registre a primeira colheita ou altere os filtros.",actionLabel:"Registrar colheita",actionHref:"/more/harvests/new"});return}const A=T.reduce((I,E)=>I+(E.sales||[]).reduce((L,q)=>L+Number(q.total_value||0),0),0),C=T.filter(I=>(I.sales||[]).length>0).length;c.innerHTML=`
        <section class="harvest-list-summary">
          <article>
            <span>Registros</span>
            <strong>
              ${T.length}
            </strong>
          </article>

          <article>
            <span>Com vendas</span>
            <strong>
              ${C}
            </strong>
          </article>

          <article>
            <span>Receita vinculada</span>
            <strong>
              ${X(A)}
            </strong>
          </article>
        </section>

        <section class="harvest-list">
          ${T.map(qc).join("")}
        </section>
      `}catch(T){console.error("Erro ao listar colheitas:",T),c.innerHTML=B({iconName:"harvest",title:"Não foi possível carregar",description:"Verifique a conexão e tente novamente."}),j(K(T),{type:"error"})}}const w=()=>{n=l.value,i=d.value,o=u.value,v(),_()},k=()=>{o=wg(),u.value=o,v(),_()},S=()=>{n="",s="",i="",o="",l.value="",d.value="",u.value="",v(),_()};return l.addEventListener("change",w),d.addEventListener("change",w),u.addEventListener("change",w),p.addEventListener("click",k),m.addEventListener("click",S),await _(),()=>{f=!0,l.removeEventListener("change",w),d.removeEventListener("change",w),u.removeEventListener("change",w),p.removeEventListener("click",k),m.removeEventListener("click",S)}}const kg=[["kg","Quilograma (kg)"],["g","Grama (g)"],["t","Tonelada (t)"],["bag","Saca"],["box","Caixa"],["crate","Engradado"],["unit","Unidade"],["dozen","Dúzia"],["bunch","Maço"],["arroba","Arroba"],["liter","Litro (L)"],["other","Outra unidade"]];function Ag(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function ll(t){var r,n,s;const e=((r=t.crop)==null?void 0:r.name)||"Cultura",a=t.variety?` • ${t.variety}`:"";return`${e}${a} — ${((n=t.property)==null?void 0:n.name)||"Propriedade"} • ${((s=t.area)==null?void 0:s.name)||"Área"}`}function Cg(t,e){return`
    <option value="">
      Selecione o ciclo produtivo
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(ll(a))}
          </option>
        `).join("")}
  `}function Tg(t){return Xn.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${a}
        </option>
      `).join("")}function Lg(t){return kg.map(([e,a])=>`
        <option
          value="${e}"
          ${t===e?"selected":""}
        >
          ${a}
        </option>
      `).join("")}function Rg(t){const e=String(t||"").trim().replace(",",".");return e?Number(e):NaN}function Pg(t,e){return e?t.harvestDate?e.planting_date&&t.harvestDate<e.planting_date?"A colheita não pode ser anterior à data do plantio.":!Number.isFinite(t.quantity)||t.quantity<=0?"Informe uma quantidade colhida maior que zero.":t.unit?t.destination?null:"Selecione o destino da colheita.":"Selecione a unidade da colheita.":"Informe a data da colheita.":"Selecione o ciclo produtivo."}async function On({session:t,params:e={},mode:a}){var q;const r=document.querySelector("#app"),n=a==="edit";let s=null,i=[];try{n?(s=await Cr(e.harvestId),s!=null&&s.production_cycle&&(i=[s.production_cycle])):i=await Vf()}catch($){console.error("Erro ao preparar formulário de colheita:",$)}if(n&&!s)return r.innerHTML=O({session:t,title:"Colheita",eyebrow:"Produção",activeNav:"more",content:B({iconName:"harvest",title:"Colheita não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para colheitas",actionHref:"/more/harvests"})}),null;if(!n&&!i.length)return r.innerHTML=O({session:t,title:"Nova colheita",eyebrow:"Produção",activeNav:"more",content:B({iconName:"harvest",title:"Nenhum ciclo disponível",description:"Para registrar uma colheita, mantenha um ciclo como plantado, em desenvolvimento, próximo ou pronto para colher.",actionLabel:"Abrir plantios",actionHref:"/plantings"})}),null;const o=new URLSearchParams(window.location.search),c=e.cycleId||o.get("cycle")||"",l=n?s.production_cycle_id:i.some($=>$.id===c)?c:"",d=(s==null?void 0:s.destination)||"own_consumption",u=(s==null?void 0:s.unit)||"kg";r.innerHTML=O({session:t,title:n?"Editar colheita":"Nova colheita",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/more/harvests/${s.id}`:c?`/plantings/${c}`:"/more/harvests"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar colheita":"Registrar colheita"}
            </h2>

            <p>
              Registre cada retirada separadamente. O mesmo ciclo pode ter várias colheitas.
            </p>
          </div>
        </section>

        <div
          id="harvest-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="harvest-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Ciclo produtivo
              </h2>

              <p>
                A colheita será vinculada permanentemente ao ciclo selecionado.
              </p>
            </div>

            ${n?`
                  <div class="harvest-cycle-readonly">
                    <span class="harvest-cycle-readonly__icon">
                      ${y("sprout")}
                    </span>

                    <div>
                      <strong>
                        ${h(ll(s.production_cycle))}
                      </strong>

                      <span>
                        Plantio:
                        ${ne((q=s.production_cycle)==null?void 0:q.planting_date)}
                      </span>
                    </div>
                  </div>
                `:`
                  <div class="field">
                    <label
                      for="harvest-cycle"
                    >
                      Ciclo *
                    </label>

                    <select
                      id="harvest-cycle"
                      name="cycleId"
                      required
                    >
                      ${Cg(i,l)}
                    </select>

                    <small
                      id="harvest-cycle-hint"
                      class="field__hint"
                    ></small>
                  </div>
                `}
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Dados da colheita
              </h2>

              <p>
                Informe a data, quantidade e unidade efetivamente colhidas.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-date"
                >
                  Data *
                </label>

                <input
                  id="harvest-date"
                  name="harvestDate"
                  type="date"
                  value="${(s==null?void 0:s.harvest_date)||Ag()}"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-quality"
                >
                  Classificação / qualidade
                </label>

                <input
                  id="harvest-quality"
                  name="qualityClassification"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: Premium, primeira, comercial..."
                  value="${h((s==null?void 0:s.quality_classification)||"")}"
                />
              </div>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="harvest-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 150"
                  value="${(s==null?void 0:s.quantity)??""}"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-unit"
                >
                  Unidade *
                </label>

                <select
                  id="harvest-unit"
                  name="unit"
                  required
                >
                  ${Lg(u)}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Destino
              </h2>

              <p>
                O destino define se esta colheita poderá receber registros de venda.
              </p>
            </div>

            <div class="field">
              <label
                for="harvest-destination"
              >
                Destino *
              </label>

              <select
                id="harvest-destination"
                name="destination"
                required
              >
                ${Tg(d)}
              </select>
            </div>

            <div
              id="harvest-sale-hint"
              class="harvest-sale-hint"
              hidden
            >
              ${y("cart")}

              <div>
                <strong>
                  Venda habilitada
                </strong>

                <span>
                  Depois de salvar, você poderá registrar uma ou várias vendas vinculadas a esta colheita.
                </span>
              </div>
            </div>

            <div class="field">
              <label
                for="harvest-notes"
              >
                Observações
              </label>

              <textarea
                id="harvest-notes"
                name="notes"
                maxlength="1800"
                placeholder="Ex.: colheita parcial, condições do produto, separação por qualidade..."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/more/harvests/${s.id}`:c?`/plantings/${c}`:"/more/harvests"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="harvest-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Registrar colheita"}
            </button>
          </div>
        </form>
      `});const p=document.querySelector("#harvest-form"),m=document.querySelector("#harvest-form-feedback"),f=document.querySelector("#harvest-submit"),v=document.querySelector("#harvest-cycle"),_=document.querySelector("#harvest-cycle-hint"),w=document.querySelector("#harvest-date"),k=document.querySelector("#harvest-destination"),S=document.querySelector("#harvest-sale-hint");function T(){return n?s.production_cycle:i.find($=>$.id===v.value)}function A(){const $=T();!$||!_||(_.textContent=`Plantio em ${ne($.planting_date)}${$.current_harvest_forecast?` • previsão atual ${ne($.current_harvest_forecast)}`:""}`,w.min=$.planting_date||"")}function C(){S.hidden=!La(k.value)}const I=()=>{A()},E=()=>{C()},L=async $=>{$.preventDefault(),D(m,"");const b=new FormData(p),g=T(),R={harvestDate:String(b.get("harvestDate")||""),quantity:Rg(b.get("quantity")),unit:String(b.get("unit")||""),qualityClassification:String(b.get("qualityClassification")||"").trim(),destination:String(b.get("destination")||""),notes:String(b.get("notes")||"").trim()},x=Pg(R,g);if(x){D(m,x);return}te(f,!0,n?"Salvando…":"Registrando…");try{const H=n?await Gf(s.id,R):await Wf(g.id,R);j(n?"Colheita atualizada.":"Colheita registrada.",{type:"success"}),Q(`/more/harvests/${H.id}`,{replace:!0})}catch(H){console.error("Erro ao salvar colheita:",H),D(m,K(H))}finally{te(f,!1)}};return v==null||v.addEventListener("change",I),k.addEventListener("change",E),p.addEventListener("submit",L),A(),C(),()=>{v==null||v.removeEventListener("change",I),k.removeEventListener("change",E),p.removeEventListener("submit",L)}}const dl=[["cash","Dinheiro"],["pix","Pix"],["bank_transfer","Transferência bancária"],["boleto","Boleto"],["card","Cartão"],["installments","Venda a prazo"],["other","Outro"]];function ul(t){var e;return((e=dl.find(([a])=>a===t))==null?void 0:e[1])||t||"Não informado"}function pl(t){var n,s;const e=(n=t.harvest)==null?void 0:n.production_cycle,a=((s=e==null?void 0:e.crop)==null?void 0:s.name)||"Colheita",r=e!=null&&e.variety?` • ${e.variety}`:"";return`${a}${r}`}function hl(t){var a,r,n;const e=(a=t.harvest)==null?void 0:a.production_cycle;return[(r=e==null?void 0:e.property)==null?void 0:r.name,(n=e==null?void 0:e.area)==null?void 0:n.name].filter(Boolean).join(" • ")||"Local não informado"}function us(t){return`
    <article class="sale-card">
      <a
        href="/more/sales/${t.id}"
        class="sale-card__main"
        data-link
      >
        <div class="sale-card__top">
          <span class="sale-card__icon">
            ${y("cart")}
          </span>

          <div class="sale-card__identity">
            <h3>
              ${h(t.buyer||"Venda sem comprador informado")}
            </h3>

            <p>
              ${h(pl(t))}
              •
              ${h(hl(t))}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="sale-card__metrics">
          <div>
            <span>Data</span>
            <strong>
              ${ne(t.sale_date)}
            </strong>
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              ${ae(t.quantity)}
              ${h(t.unit)}
            </strong>
          </div>

          <div>
            <span>Preço unitário</span>
            <strong>
              ${X(t.unit_price)}
            </strong>
          </div>

          <div>
            <span>Total</span>
            <strong>
              ${X(t.total_value)}
            </strong>
          </div>
        </div>

        ${t.payment_method?`
              <div class="sale-card__payment">
                ${y("receipt")}
                ${h(ul(t.payment_method))}
              </div>
            `:""}
      </a>
    </article>
  `}const qg=["harvested","closed","cancelled"];async function xg({session:t,params:e}){var d;const a=document.querySelector("#app");let r=null;try{r=await Cr(e.harvestId)}catch(u){console.error("Erro ao carregar colheita:",u)}if(!r)return a.innerHTML=O({session:t,title:"Colheita",eyebrow:"Produção",activeNav:"more",content:B({iconName:"harvest",title:"Colheita não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para colheitas",actionHref:"/more/harvests"})}),null;const n=r.production_cycle,s=es(r),i=La(r.destination),o=qg.includes(n==null?void 0:n.status);a.innerHTML=O({session:t,title:"Colheita",eyebrow:"Produção",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/harvests"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Colheitas
            </a>
          </div>
        </section>

        <section class="harvest-detail-hero">
          <div class="harvest-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(Pc(r))}
              </p>

              <h2>
                ${h(Nn(r))}
              </h2>

              <p>
                ${ne(r.harvest_date)}
              </p>
            </div>

            <span class="harvest-destination-badge">
              ${h(Ar(r.destination))}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/more/harvests/${r.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${y("edit")}
              Editar
            </a>

            ${i&&s.remainingQuantity>0?`
                  <a
                    href="/more/harvests/${r.id}/sales/new"
                    class="button button--primary"
                    data-link
                  >
                    ${y("cart")}
                    Registrar venda
                  </a>
                `:""}
          </div>
        </section>

        <section class="harvest-detail-summary">
          <article>
            <span>Quantidade colhida</span>
            <strong>
              ${ae(r.quantity)}
              ${h(r.unit)}
            </strong>
          </article>

          <article>
            <span>Quantidade vendida</span>
            <strong>
              ${ae(s.soldQuantity)}
              ${h(r.unit)}
            </strong>
          </article>

          <article>
            <span>Disponível para venda</span>
            <strong>
              ${i?`${ae(s.remainingQuantity)} ${h(r.unit)}`:"Não se aplica"}
            </strong>
          </article>

          <article>
            <span>Receita vinculada</span>
            <strong>
              ${X(s.grossRevenue)}
            </strong>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo produtivo
            </p>

            <p class="detail-card__value">
              ${h(Nn(r))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Situação do ciclo
            </p>

            <p class="detail-card__value">
              ${h(kt(n==null?void 0:n.status))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Classificação
            </p>

            <p class="detail-card__value">
              ${h(r.quality_classification||"Não informada")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Destino
            </p>

            <p class="detail-card__value">
              ${h(Ar(r.destination))}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <section class="harvest-links-card">
          <a
            href="/plantings/${n.id}"
            class="button button--secondary harvest-link-row"
            data-link
          >
            <span>
              ${y("sprout")}
              Abrir ciclo produtivo
            </span>

            ${y("chevronRight")}
          </a>

          ${r.production_event_id?`
                <a
                  href="/plantings/${n.id}#timeline"
                  class="button button--secondary harvest-link-row"
                  data-link
                >
                  <span>
                    ${y("clipboard")}
                    Ver evento na linha do tempo
                  </span>

                  ${y("chevronRight")}
                </a>
              `:""}
        </section>

        ${o?"":`
              <section class="harvest-finalize-card">
                <div>
                  <strong>
                    Esta foi a colheita final?
                  </strong>

                  <p>
                    Como um ciclo pode possuir várias colheitas, registrar uma colheita não encerra o plantio automaticamente.
                  </p>
                </div>

                <button
                  id="finalize-harvest-cycle"
                  class="button button--secondary"
                  type="button"
                >
                  ${y("harvest")}
                  Marcar ciclo como colhido
                </button>
              </section>
            `}

        <section class="harvest-sales-section">
          <div class="harvest-sales-section__header">
            <div>
              <p class="section-eyebrow">
                Vendas
              </p>

              <h2>
                Vendas desta colheita
              </h2>

              <p>
                ${s.salesCount} ${s.salesCount===1?"venda registrada":"vendas registradas"}.
              </p>
            </div>

            ${i&&s.remainingQuantity>0?`
                  <a
                    href="/more/harvests/${r.id}/sales/new"
                    class="button button--primary button--compact"
                    data-link
                  >
                    ${y("plus")}
                    Nova venda
                  </a>
                `:""}
          </div>

          ${(d=r.sales)!=null&&d.length?`
                <div class="sale-list">
                  ${r.sales.slice().sort((u,p)=>String(p.sale_date).localeCompare(String(u.sale_date))).map(u=>us({...u,harvest:r})).join("")}
                </div>
              `:i?`
                      <div class="settings-empty-state">
                        ${y("cart")}

                        <p>
                          Nenhuma venda foi registrada para esta colheita.
                        </p>
                      </div>
                    `:`
                      <div class="settings-empty-state">
                        ${y("info")}

                        <p>
                          O destino desta colheita não permite vendas. Edite o destino para "Venda" ou "Consumo próprio e venda" se necessário.
                        </p>
                      </div>
                    `}
        </section>
      `});const c=document.querySelector("#finalize-harvest-cycle"),l=async()=>{if(await ie({title:"Marcar ciclo como colhido?",message:"Use esta ação somente quando esta tiver sido a colheita final. O ciclo será marcado como Colhido e os lembretes futuros serão cancelados.",confirmLabel:"Marcar como colhido"})){c.disabled=!0;try{await Kf(r.id),j("Ciclo marcado como colhido.",{type:"success"}),Q(`/more/harvests/${r.id}`,{replace:!0})}catch(p){console.error("Erro ao finalizar ciclo:",p),j(K(p),{type:"error"}),c.disabled=!1}}};return c==null||c.addEventListener("click",l),()=>{c==null||c.removeEventListener("click",l)}}const Kr=`
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
  updated_at,
  harvest:harvests (
    id,
    user_id,
    production_cycle_id,
    harvest_date,
    quantity,
    unit,
    quality_classification,
    destination,
    notes,
    production_cycle:production_cycles (
      id,
      property_id,
      area_id,
      variety,
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
      )
    )
  )
`;function Jr(){if(!V)throw new Error("O Supabase não foi inicializado.");return V}function ml(t,e){var a,r;return{harvest_id:e.id,buyer:((a=t.buyer)==null?void 0:a.trim())||null,quantity:Number(t.quantity),unit:e.unit,unit_price:Number(t.unitPrice),sale_date:t.saleDate,payment_method:t.paymentMethod||null,notes:((r=t.notes)==null?void 0:r.trim())||null}}function Ng(t){if(!t||!/^\d{4}-\d{2}$/.test(t))return null;const[e,a]=t.split("-").map(Number),r=`${e}-${String(a).padStart(2,"0")}-01`,n=new Date(e,a,1,12,0,0,0),s=[n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),"01"].join("-");return{start:r,end:s}}async function Ig({harvestId:t=null,propertyId:e=null,month:a=null,limit:r=null}={}){let s=Jr().from("harvest_sales").select(Kr).order("sale_date",{ascending:!1}).order("created_at",{ascending:!1});t&&(s=s.eq("harvest_id",t));const i=Ng(a);i&&(s=s.gte("sale_date",i.start).lt("sale_date",i.end)),Number.isInteger(r)&&r>0&&(s=s.limit(r));const{data:o,error:c}=await s;if(c)throw c;const l=o??[];return e?l.filter(d=>{var u,p;return((p=(u=d.harvest)==null?void 0:u.production_cycle)==null?void 0:p.property_id)===e}):l}async function fl(t){const e=Jr(),{data:a,error:r}=await e.from("harvest_sales").select(Kr).eq("id",t).maybeSingle();if(r)throw r;return a}async function Og(){return(await ts()).filter(e=>{var r;const a=es(e);return!((r=e.production_cycle)!=null&&r.deleted_at)&&a.allowsSales&&a.remainingQuantity>0})}function fn(t,{currentSaleId:e=null}={}){const r=((t==null?void 0:t.sales)??[]).filter(n=>n.id!==e).reduce((n,s)=>n+Number(s.quantity||0),0);return Math.max(0,Number((t==null?void 0:t.quantity)||0)-r)}async function jg(t,e){const a=Jr(),r=await Z();if(!r)throw new Error("Sua sessão expirou. Entre novamente.");const{data:n,error:s}=await a.from("harvest_sales").insert({...ml(e,t),user_id:r.id}).select(Kr).single();if(s)throw s;return n}async function Dg(t,e,a){const r=Jr(),n=await Z();if(!n)throw new Error("Sua sessão expirou. Entre novamente.");const s=ml(a,e);delete s.harvest_id;const{data:i,error:o}=await r.from("harvest_sales").update(s).eq("id",t).eq("user_id",n.id).select(Kr).single();if(o)throw o;return i}function Mg(t,e){return`
    <option value="">
      Todas as propriedades
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}function Ug(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0")].join("-")}async function Hg({session:t}){const e=document.querySelector("#app");let a=[];try{a=await rt()}catch(w){console.error("Erro ao carregar propriedades:",w)}const r=new URLSearchParams(window.location.search);let n=r.get("property")||"",s=r.get("month")||"";e.innerHTML=O({session:t,title:"Vendas",eyebrow:"Comercialização",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Vendas
            </p>

            <h2>
              Vendas das colheitas
            </h2>

            <p>
              Cada venda pertence a uma colheita e calcula o valor total automaticamente.
            </p>
          </div>

          <a
            href="/more/sales/new"
            class="icon-button"
            aria-label="Registrar venda"
            data-link
          >
            ${y("plus")}
          </a>
        </section>

        <section class="sale-toolbar">
          <div class="field">
            <label
              for="sale-property-filter"
            >
              Propriedade
            </label>

            <select
              id="sale-property-filter"
            >
              ${Mg(a,n)}
            </select>
          </div>

          <div class="field">
            <label
              for="sale-month-filter"
            >
              Mês
            </label>

            <input
              id="sale-month-filter"
              type="month"
              value="${h(s)}"
            />
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="sale-current-month"
            class="button button--ghost button--compact"
            type="button"
          >
            ${y("calendar")}
            Mês atual
          </button>

          <button
            id="sale-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/sales/new"
            class="button button--primary button--compact"
            data-link
          >
            ${y("plus")}
            Nova venda
          </a>
        </div>

        <div
          id="sales-content"
        >
          ${ce({label:"Carregando vendas…"})}
        </div>
      `});const i=document.querySelector("#sales-content"),o=document.querySelector("#sale-property-filter"),c=document.querySelector("#sale-month-filter"),l=document.querySelector("#sale-current-month"),d=document.querySelector("#sale-clear-filters");let u=!1;function p(){const w=new URLSearchParams;n&&w.set("property",n),s&&w.set("month",s);const k=w.toString();window.history.replaceState({},"",k?`/more/sales?${k}`:"/more/sales")}async function m(){i.innerHTML=ce({label:"Carregando vendas…"});try{const w=await Ig({propertyId:n||null,month:s||null});if(u)return;if(!w.length){i.innerHTML=B({iconName:"cart",title:"Nenhuma venda encontrada",description:"Registre uma venda a partir de uma colheita destinada à comercialização.",actionLabel:"Registrar venda",actionHref:"/more/sales/new"});return}const k=w.reduce((A,C)=>A+Number(C.total_value||0),0),S=w.length?k/w.length:0,T=new Set(w.map(A=>{var C;return(C=A.buyer)==null?void 0:C.trim().toLocaleLowerCase("pt-BR")}).filter(Boolean)).size;i.innerHTML=`
        <section class="sale-list-summary">
          <article>
            <span>Vendas</span>
            <strong>
              ${w.length}
            </strong>
          </article>

          <article>
            <span>Compradores</span>
            <strong>
              ${T}
            </strong>
          </article>

          <article>
            <span>Receita bruta</span>
            <strong>
              ${X(k)}
            </strong>
          </article>

          <article>
            <span>Ticket médio</span>
            <strong>
              ${X(S)}
            </strong>
          </article>
        </section>

        <section class="sale-list">
          ${w.map(us).join("")}
        </section>
      `}catch(w){console.error("Erro ao carregar vendas:",w),i.innerHTML=B({iconName:"cart",title:"Não foi possível carregar",description:"Verifique a conexão e tente novamente."}),j(K(w),{type:"error"})}}const f=()=>{n=o.value,s=c.value,p(),m()},v=()=>{s=Ug(),c.value=s,p(),m()},_=()=>{n="",s="",o.value="",c.value="",p(),m()};return o.addEventListener("change",f),c.addEventListener("change",f),l.addEventListener("click",v),d.addEventListener("click",_),await m(),()=>{u=!0,o.removeEventListener("change",f),c.removeEventListener("change",f),l.removeEventListener("click",v),d.removeEventListener("click",_)}}function Fg(){const t=new Date;return[t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-")}function vl(t){var n;const e=t.production_cycle,a=((n=e==null?void 0:e.crop)==null?void 0:n.name)||"Colheita",r=e!=null&&e.variety?` • ${e.variety}`:"";return`${a}${r} — ${ne(t.harvest_date)} — ${ae(t.quantity)} ${t.unit}`}function Bg(t,e){return`
    <option value="">
      Selecione a colheita
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${e===a.id?"selected":""}
          >
            ${h(vl(a))}
          </option>
        `).join("")}
  `}function zg(t){return`
    <option value="">
      Não informado
    </option>

    ${dl.map(([e,a])=>`
          <option
            value="${e}"
            ${t===e?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Xa(t){const e=String(t||"").trim().replace(",",".");return Number(e)}async function jn({session:t,params:e={},mode:a}){const r=document.querySelector("#app"),n=a==="edit";let s=null,i=[],o=null;try{if(n)s=await fl(e.saleId),s!=null&&s.harvest&&(o=await Cr(s.harvest.id),i=[o]);else if(e.harvestId)o=await Cr(e.harvestId),o&&(i=[o]);else{i=await Og();const b=new URLSearchParams(window.location.search).get("harvest");o=i.find(g=>g.id===b)||null}}catch($){console.error("Erro ao preparar venda:",$)}if(n&&!s)return r.innerHTML=O({session:t,title:"Venda",eyebrow:"Comercialização",activeNav:"more",content:B({iconName:"cart",title:"Venda não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para vendas",actionHref:"/more/sales"})}),null;if(!n&&e.harvestId&&(!o||!La(o.destination)||fn(o)<=0))return r.innerHTML=O({session:t,title:"Nova venda",eyebrow:"Comercialização",activeNav:"more",content:B({iconName:"cart",title:"Colheita não disponível para venda",description:o&&La(o.destination)?"Toda a quantidade desta colheita já está comprometida em vendas.":"O destino precisa ser Venda ou Consumo próprio e venda.",actionLabel:"Voltar para colheitas",actionHref:"/more/harvests"})}),null;if(!n&&!e.harvestId&&!i.length)return r.innerHTML=O({session:t,title:"Nova venda",eyebrow:"Comercialização",activeNav:"more",content:B({iconName:"cart",title:"Nenhuma colheita disponível",description:"Registre uma colheita com destino de venda e quantidade ainda disponível.",actionLabel:"Abrir colheitas",actionHref:"/more/harvests"})}),null;const c=n||!!e.harvestId,l=(o==null?void 0:o.id)||"";r.innerHTML=O({session:t,title:n?"Editar venda":"Nova venda",eyebrow:"Comercialização",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="${n?`/more/sales/${s.id}`:o?`/more/harvests/${o.id}`:"/more/sales"}"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${n?"Editar venda":"Registrar venda"}
            </h2>

            <p>
              A quantidade vendida nunca pode ultrapassar o volume disponível da colheita.
            </p>
          </div>
        </section>

        <div
          id="sale-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="sale-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Colheita
              </h2>

              <p>
                A unidade da venda é sempre a mesma unidade da colheita.
              </p>
            </div>

            ${c?`
                  <div
                    id="sale-harvest-readonly"
                    class="harvest-cycle-readonly"
                  ></div>
                `:`
                  <div class="field">
                    <label
                      for="sale-harvest"
                    >
                      Colheita *
                    </label>

                    <select
                      id="sale-harvest"
                      name="harvestId"
                      required
                    >
                      ${Bg(i,l)}
                    </select>
                  </div>
                `}

            <div
              id="sale-harvest-info"
              class="sale-harvest-info"
              hidden
            ></div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Dados comerciais
              </h2>

              <p>
                O valor total será calculado como quantidade × preço unitário.
              </p>
            </div>

            <div class="field">
              <label
                for="sale-buyer"
              >
                Comprador
              </label>

              <input
                id="sale-buyer"
                name="buyer"
                type="text"
                maxlength="180"
                placeholder="Ex.: Cooperativa São José"
                value="${h((s==null?void 0:s.buyer)||"")}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="sale-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="sale-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  value="${(s==null?void 0:s.quantity)??""}"
                  required
                />

                <small
                  id="sale-quantity-hint"
                  class="field__hint"
                ></small>
              </div>

              <div class="field">
                <label
                  for="sale-unit-price"
                >
                  Preço unitário *
                </label>

                <input
                  id="sale-unit-price"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.000001"
                  inputmode="decimal"
                  placeholder="Ex.: 4.50"
                  value="${(s==null?void 0:s.unit_price)??""}"
                  required
                />
              </div>
            </div>

            <div class="sale-total-preview">
              <span>
                Valor total estimado
              </span>

              <strong
                id="sale-total-value"
              >
                ${X((s==null?void 0:s.total_value)||0)}
              </strong>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="sale-date"
                >
                  Data da venda *
                </label>

                <input
                  id="sale-date"
                  name="saleDate"
                  type="date"
                  value="${(s==null?void 0:s.sale_date)||Fg()}"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="sale-payment-method"
                >
                  Forma de pagamento
                </label>

                <select
                  id="sale-payment-method"
                  name="paymentMethod"
                >
                  ${zg((s==null?void 0:s.payment_method)||"")}
                </select>
              </div>
            </div>

            <div class="field">
              <label
                for="sale-notes"
              >
                Observações
              </label>

              <textarea
                id="sale-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: pagamento em duas parcelas, retirada pelo comprador..."
              >${h((s==null?void 0:s.notes)||"")}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${n?`/more/sales/${s.id}`:o?`/more/harvests/${o.id}`:"/more/sales"}"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="sale-submit"
              class="button button--primary"
              type="submit"
            >
              ${n?"Salvar alterações":"Registrar venda"}
            </button>
          </div>
        </form>
      `});const d=document.querySelector("#sale-form"),u=document.querySelector("#sale-form-feedback"),p=document.querySelector("#sale-submit"),m=document.querySelector("#sale-harvest"),f=document.querySelector("#sale-harvest-readonly"),v=document.querySelector("#sale-harvest-info"),_=document.querySelector("#sale-quantity"),w=document.querySelector("#sale-quantity-hint"),k=document.querySelector("#sale-unit-price"),S=document.querySelector("#sale-total-value"),T=document.querySelector("#sale-date");function A(){return c?o:i.find($=>$.id===m.value)||null}function C(){const $=A();if(!$){v.hidden=!0,v.innerHTML="",f&&(f.innerHTML=""),w.textContent="",_.removeAttribute("max");return}const b=fn($,{currentSaleId:(s==null?void 0:s.id)||null}),g=vl($);f&&(f.innerHTML=`
        <span class="harvest-cycle-readonly__icon">
          ${y("harvest")}
        </span>

        <div>
          <strong>
            ${h(g)}
          </strong>

          <span>
            Colheita fixa desta venda
          </span>
        </div>
      `),v.hidden=!1,v.innerHTML=`
      <div>
        <span>
          Quantidade colhida
        </span>

        <strong>
          ${ae($.quantity)}
          ${h($.unit)}
        </strong>
      </div>

      <div>
        <span>
          Disponível para esta venda
        </span>

        <strong>
          ${ae(b)}
          ${h($.unit)}
        </strong>
      </div>

      <div>
        <span>
          Data da colheita
        </span>

        <strong>
          ${ne($.harvest_date)}
        </strong>
      </div>
    `,w.textContent=`Máximo disponível: ${ae(b)} ${$.unit}.`,_.max=String(b),T.min=$.harvest_date}function I(){const $=Xa(_.value),b=Xa(k.value),g=Number.isFinite($)&&Number.isFinite(b)?$*b:0;S.textContent=X(g)}const E=()=>{o=A(),C()},L=()=>{I()},q=async $=>{$.preventDefault(),D(u,"");const b=A();if(!b){D(u,"Selecione uma colheita.");return}const g=new FormData(d),R={buyer:String(g.get("buyer")||"").trim(),quantity:Xa(g.get("quantity")),unitPrice:Xa(g.get("unitPrice")),saleDate:String(g.get("saleDate")||""),paymentMethod:String(g.get("paymentMethod")||""),notes:String(g.get("notes")||"").trim()},x=fn(b,{currentSaleId:(s==null?void 0:s.id)||null});if(!Number.isFinite(R.quantity)||R.quantity<=0){D(u,"Informe uma quantidade vendida maior que zero.");return}if(R.quantity>x){D(u,`A quantidade vendida não pode ultrapassar ${ae(x)} ${b.unit}.`);return}if(!Number.isFinite(R.unitPrice)||R.unitPrice<0){D(u,"Informe um preço unitário válido.");return}if(!R.saleDate){D(u,"Informe a data da venda.");return}if(R.saleDate<b.harvest_date){D(u,"A data da venda não pode ser anterior à colheita.");return}te(p,!0,n?"Salvando…":"Registrando…");try{const H=n?await Dg(s.id,b,R):await jg(b,R);j(n?"Venda atualizada.":"Venda registrada.",{type:"success"}),Q(`/more/sales/${H.id}`,{replace:!0})}catch(H){console.error("Erro ao salvar venda:",H),D(u,K(H))}finally{te(p,!1)}};return m==null||m.addEventListener("change",E),_.addEventListener("input",L),k.addEventListener("input",L),d.addEventListener("submit",q),C(),I(),()=>{m==null||m.removeEventListener("change",E),_.removeEventListener("input",L),k.removeEventListener("input",L),d.removeEventListener("submit",q)}}async function Vg({session:t,params:e}){const a=document.querySelector("#app");let r=null;try{r=await fl(e.saleId)}catch(s){console.error("Erro ao carregar venda:",s)}if(!r)return a.innerHTML=O({session:t,title:"Venda",eyebrow:"Comercialização",activeNav:"more",content:B({iconName:"cart",title:"Venda não encontrada",description:"Este registro não existe ou não pertence à sua conta.",actionLabel:"Voltar para vendas",actionHref:"/more/sales"})}),null;const n=r.harvest;return a.innerHTML=O({session:t,title:"Venda",eyebrow:"Comercialização",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/sales"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Vendas
            </a>
          </div>
        </section>

        <section class="sale-detail-hero">
          <div class="sale-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(hl(r))}
              </p>

              <h2>
                ${h(r.buyer||"Venda registrada")}
              </h2>

              <p>
                ${h(pl(r))}
              </p>
            </div>

            <strong class="sale-detail-hero__value">
              ${X(r.total_value)}
            </strong>
          </div>

          <div class="property-detail-actions">
            <a
              href="/more/sales/${r.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${y("edit")}
              Editar
            </a>
          </div>
        </section>

        <section class="sale-detail-summary">
          <article>
            <span>Quantidade</span>
            <strong>
              ${ae(r.quantity)}
              ${h(r.unit)}
            </strong>
          </article>

          <article>
            <span>Preço unitário</span>
            <strong>
              ${X(r.unit_price)}
            </strong>
          </article>

          <article>
            <span>Total</span>
            <strong>
              ${X(r.total_value)}
            </strong>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Data da venda
            </p>

            <p class="detail-card__value">
              ${ne(r.sale_date)}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Comprador
            </p>

            <p class="detail-card__value">
              ${h(r.buyer||"Não informado")}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Forma de pagamento
            </p>

            <p class="detail-card__value">
              ${h(ul(r.payment_method))}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Destino da colheita
            </p>

            <p class="detail-card__value">
              ${h(Ar(n.destination))}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${h(r.notes||"Nenhuma observação informada.")}
          </p>
        </article>

        <section class="harvest-links-card">
          <a
            href="/more/harvests/${n.id}"
            class="button button--secondary harvest-link-row"
            data-link
          >
            <span>
              ${y("harvest")}
              Abrir colheita
            </span>

            ${y("chevronRight")}
          </a>

          <a
            href="/plantings/${n.production_cycle.id}"
            class="button button--secondary harvest-link-row"
            data-link
          >
            <span>
              ${y("sprout")}
              Abrir ciclo produtivo
            </span>

            ${y("chevronRight")}
          </a>
        </section>
      `}),null}function Wg(t){var r,n;const e=((r=t.crop)==null?void 0:r.name)||"Ciclo produtivo",a=(n=t.variety)==null?void 0:n.trim();return a?`${e} • ${a}`:e}function Gg(t){var e,a;return[(e=t.property)==null?void 0:e.name,(a=t.area)==null?void 0:a.name].filter(Boolean).join(" • ")||"Local não informado"}function Kg(t){const e=t.finance;return`
    <article class="finance-cycle-card">
      <a
        href="/more/finance/${t.id}"
        class="finance-cycle-card__main"
        data-link
      >
        <div class="finance-cycle-card__top">
          <span class="finance-cycle-card__icon">
            ${y("chart")}
          </span>

          <div class="finance-cycle-card__identity">
            <h3>
              ${h(Wg(t))}
            </h3>

            <p>
              ${h(Gg(t))}
            </p>
          </div>

          ${y("chevronRight")}
        </div>

        <div class="finance-cycle-card__badges">
          <span class="cycle-chip">
            ${h(kt(t.status))}
          </span>

          <span
            class="
              financial-result
              ${Oc(e.result_state)}
            "
          >
            ${h(Ic(e.result_state))}
          </span>
        </div>

        <div class="finance-cycle-card__metrics">
          <div>
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${X(e.input_cost)}
            </strong>
          </div>

          <div>
            <span>
              Receita
            </span>

            <strong class="finance-value--revenue">
              ${X(e.sales_revenue)}
            </strong>
          </div>

          <div class="finance-cycle-card__result">
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${e.estimated_result>0?"finance-value--positive":e.estimated_result<0?"finance-value--negative":""}
              "
            >
              ${X(e.estimated_result)}
            </strong>
          </div>
        </div>

        <div class="finance-cycle-card__footer">
          <span>
            ${e.usage_transactions_count}
            ${e.usage_transactions_count===1?"uso de insumo":"usos de insumo"}
          </span>

          <span>
            ${e.harvests_count}
            ${e.harvests_count===1?"colheita":"colheitas"}
          </span>

          <span>
            ${e.sales_count}
            ${e.sales_count===1?"venda":"vendas"}
          </span>
        </div>
      </a>
    </article>
  `}function Jg(t,e){return`
    <option value="">
      Todas as propriedades
    </option>

    ${t.map(a=>`
          <option
            value="${a.id}"
            ${a.id===e?"selected":""}
          >
            ${h(a.name)}
          </option>
        `).join("")}
  `}function Qg(t){return`
    <option value="">
      Todos os status
    </option>

    ${Mr.map(([e,a])=>`
          <option
            value="${e}"
            ${e===t?"selected":""}
          >
            ${a}
          </option>
        `).join("")}
  `}function Yg(t){return xc.map(([e,a])=>`
        <option
          value="${e}"
          ${e===t?"selected":""}
        >
          ${a}
        </option>
      `).join("")}async function Zg({session:t}){const e=document.querySelector("#app");let a=[],r={cycles_count:0,cycles_with_activity_count:0,positive_result_count:0,negative_result_count:0,break_even_count:0,input_cost:0,sales_revenue:0,estimated_result:0};try{[a,r]=await Promise.all([rt(),Jf()])}catch(E){console.error("Erro ao preparar financeiro:",E)}const n=new URLSearchParams(window.location.search);let s=n.get("property")||"",i=n.get("status")||"",o=n.get("result")||"all",c=n.get("search")||"";xc.some(([E])=>E===o)||(o="all"),e.innerHTML=O({session:t,title:"Financeiro",eyebrow:"Resultados básicos",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Resultados financeiros
            </p>

            <h2>
              Custos, receitas e resultados
            </h2>

            <p>
              Consolidação básica por ciclo produtivo usando custos de insumos consumidos e receitas das vendas.
            </p>
          </div>
        </section>

        <section class="finance-overview-grid">
          <article class="finance-overview-card">
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${X(r.input_cost)}
            </strong>

            <small>
              Movimentações de uso registradas
            </small>
          </article>

          <article class="finance-overview-card">
            <span>
              Receita de vendas
            </span>

            <strong class="finance-value--revenue">
              ${X(r.sales_revenue)}
            </strong>

            <small>
              Vendas vinculadas às colheitas
            </small>
          </article>

          <article class="finance-overview-card finance-overview-card--result">
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${r.estimated_result>0?"finance-value--positive":r.estimated_result<0?"finance-value--negative":""}
              "
            >
              ${X(r.estimated_result)}
            </strong>

            <small>
              Receita - custos de insumos
            </small>
          </article>

          <article class="finance-overview-card">
            <span>
              Ciclos com movimento
            </span>

            <strong>
              ${r.cycles_with_activity_count}
            </strong>

            <small>
              ${r.positive_result_count} positivos •
              ${r.negative_result_count} negativos
            </small>
          </article>
        </section>

        <section class="finance-scope-note">
          ${y("info")}

          <div>
            <strong>
              Resultado básico, não lucro contábil
            </strong>

            <p>
              São considerados apenas os custos dos insumos efetivamente consumidos e as receitas das vendas. Mão de obra, combustível, máquinas, energia, frete, impostos e outros custos ainda não entram no cálculo.
            </p>
          </div>
        </section>

        <section class="finance-toolbar">
          <div class="crop-search">
            ${y("search")}

            <input
              id="finance-search"
              type="search"
              value="${h(c)}"
              placeholder="Buscar cultura, variedade, propriedade ou área..."
              autocomplete="off"
            />
          </div>

          <div class="field">
            <label
              for="finance-property"
            >
              Propriedade
            </label>

            <select
              id="finance-property"
            >
              ${Jg(a,s)}
            </select>
          </div>

          <div class="field">
            <label
              for="finance-status"
            >
              Status
            </label>

            <select
              id="finance-status"
            >
              ${Qg(i)}
            </select>
          </div>

          <div class="field">
            <label
              for="finance-result"
            >
              Resultado
            </label>

            <select
              id="finance-result"
            >
              ${Yg(o)}
            </select>
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="finance-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/sales"
            class="button button--secondary button--compact"
            data-link
          >
            ${y("cart")}
            Ver vendas
          </a>
        </div>

        <div
          id="finance-content"
        >
          ${ce({label:"Carregando resultados…"})}
        </div>
      `});const l=document.querySelector("#finance-content"),d=document.querySelector("#finance-search"),u=document.querySelector("#finance-property"),p=document.querySelector("#finance-status"),m=document.querySelector("#finance-result"),f=document.querySelector("#finance-clear-filters");let v=[],_=!1;function w(){const E=new URLSearchParams;s&&E.set("property",s),i&&E.set("status",i),o!=="all"&&E.set("result",o),c.trim()&&E.set("search",c.trim());const L=E.toString();window.history.replaceState({},"",L?`/more/finance?${L}`:"/more/finance")}function k(){const E=c.trim().toLocaleLowerCase("pt-BR");return v.filter(L=>{var $,b,g,R;if(s&&L.property_id!==s||i&&L.status!==i)return!1;const q=Nc(L.finance);return o!=="all"&&q!==o?!1:E?[($=L.crop)==null?void 0:$.name,L.variety,(b=L.property)==null?void 0:b.name,(g=L.area)==null?void 0:g.name,(R=L.season)==null?void 0:R.name].filter(Boolean).some(x=>String(x).toLocaleLowerCase("pt-BR").includes(E)):!0})}function S(){const E=k();if(!E.length){l.innerHTML=B({iconName:"chart",title:"Nenhum ciclo encontrado",description:"Altere os filtros ou registre usos de insumos, colheitas e vendas para gerar resultados.",actionLabel:"Abrir plantios",actionHref:"/plantings"});return}const L=E.reduce((b,g)=>b+Number(g.finance.input_cost||0),0),q=E.reduce((b,g)=>b+Number(g.finance.sales_revenue||0),0),$=q-L;l.innerHTML=`
      <section class="finance-filter-summary">
        <span>
          ${E.length}
          ${E.length===1?"ciclo":"ciclos"}
        </span>

        <span>
          Custos:
          <strong>
            ${X(L)}
          </strong>
        </span>

        <span>
          Receita:
          <strong>
            ${X(q)}
          </strong>
        </span>

        <span>
          Resultado:
          <strong
            class="
              ${$>0?"finance-value--positive":$<0?"finance-value--negative":""}
            "
          >
            ${X($)}
          </strong>
        </span>
      </section>

      <section class="finance-cycle-list">
        ${E.map(Kg).join("")}
      </section>
    `}async function T(){l.innerHTML=ce({label:"Carregando resultados…"});try{if(v=await Qf(),_)return;S()}catch(E){console.error("Erro ao carregar financeiro:",E),l.innerHTML=B({iconName:"chart",title:"Não foi possível carregar o financeiro",description:"Solicite ao responsável a atualização do módulo financeiro e tente novamente."}),j(K(E),{type:"error"})}}const A=()=>{s=u.value,i=p.value,o=m.value,c=d.value,w(),S()},C=()=>{c=d.value,w(),S()},I=()=>{s="",i="",o="all",c="",u.value="",p.value="",m.value="all",d.value="",w(),S()};return u.addEventListener("change",A),p.addEventListener("change",A),m.addEventListener("change",A),d.addEventListener("input",C),f.addEventListener("click",I),await T(),()=>{_=!0,u.removeEventListener("change",A),p.removeEventListener("change",A),m.removeEventListener("change",A),d.removeEventListener("input",C),f.removeEventListener("click",I)}}function Xg(t){var r,n;const e=((r=t.crop)==null?void 0:r.name)||"Ciclo produtivo",a=(n=t.variety)==null?void 0:n.trim();return a?`${e} • ${a}`:e}function ey(t){var e,a;return[(e=t.property)==null?void 0:e.name,(a=t.area)==null?void 0:a.name].filter(Boolean).join(" • ")||"Local não informado"}async function ty({session:t,params:e}){var l,d,u;const a=document.querySelector("#app");let r=null;try{r=await Zf(e.cycleId)}catch(p){console.error("Erro ao carregar resultado do ciclo:",p)}if(!r)return a.innerHTML=O({session:t,title:"Financeiro",eyebrow:"Resultado do ciclo",activeNav:"more",content:B({iconName:"chart",title:"Resultado não encontrado",description:"O ciclo pode não existir, estar arquivado ou o módulo financeiro ainda não estar atualizado.",actionLabel:"Voltar para o financeiro",actionHref:"/more/finance"})}),null;const{cycle:n,summary:s,inputCosts:i,production:o,sales:c}=r;return a.innerHTML=O({session:t,title:"Resultado do ciclo",eyebrow:"Financeiro",activeNav:"more",content:`
        <section class="page-heading">
          <div>
            <a
              href="/more/finance"
              class="button button--ghost button--compact"
              data-link
            >
              ${y("arrowLeft")}
              Financeiro
            </a>
          </div>
        </section>

        <section class="finance-detail-hero">
          <div class="finance-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${h(ey(n))}
              </p>

              <h2>
                ${h(Xg(n))}
              </h2>

              <p>
                ${h(kt(n.status))}
                ${(l=n.season)!=null&&l.name?` • ${h(n.season.name)}`:""}
              </p>
            </div>

            <span
              class="
                financial-result
                ${Oc(s.result_state)}
              "
            >
              ${h(Ic(s.result_state))}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/plantings/${n.id}"
              class="button button--secondary"
              data-link
            >
              ${y("sprout")}
              Abrir ciclo
            </a>

            <a
              href="/more/sales"
              class="button button--secondary"
              data-link
            >
              ${y("cart")}
              Ver vendas
            </a>
          </div>
        </section>

        <section class="finance-detail-summary">
          <article>
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${X(s.input_cost)}
            </strong>

            <small>
              ${s.usage_transactions_count}
              ${s.usage_transactions_count===1?"uso":"usos"}
            </small>
          </article>

          <article>
            <span>
              Receita de vendas
            </span>

            <strong class="finance-value--revenue">
              ${X(s.sales_revenue)}
            </strong>

            <small>
              ${s.sales_count}
              ${s.sales_count===1?"venda":"vendas"}
            </small>
          </article>

          <article>
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${s.estimated_result>0?"finance-value--positive":s.estimated_result<0?"finance-value--negative":""}
              "
            >
              ${X(s.estimated_result)}
            </strong>

            <small>
              Receita - insumos
            </small>
          </article>

          <article>
            <span>
              Margem sobre receita
            </span>

            <strong>
              ${s.gross_margin_percent===null?"-":`${ae(s.gross_margin_percent,{maximumFractionDigits:2})}%`}
            </strong>

            <small>
              Custos dos insumos consumidos
            </small>
          </article>
        </section>

        <section class="finance-scope-note">
          ${y("info")}

          <div>
            <strong>
              Como o resultado é calculado
            </strong>

            <p>
              Resultado estimado = receita das vendas - custos dos insumos consumidos no ciclo. Este valor ainda não inclui mão de obra, combustível, máquinas, energia, frete, impostos ou despesas administrativas.
            </p>
          </div>
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Produção
              </p>

              <h2>
                Colhido, vendido e disponível
              </h2>

              <p>
                Quantidades são separadas por unidade para evitar somar kg, caixas, sacas ou outras unidades incompatíveis.
              </p>
            </div>
          </div>

          ${o.length?`
                <div class="finance-production-grid">
                  ${o.map(p=>`
                        <article class="finance-production-card">
                          <div class="finance-production-card__header">
                            <strong>
                              ${h(p.unit)}
                            </strong>

                            <span>
                              ${p.harvests_count}
                              ${p.harvests_count===1?"colheita":"colheitas"}
                            </span>
                          </div>

                          <div class="finance-production-card__metrics">
                            <div>
                              <span>
                                Colhido
                              </span>

                              <strong>
                                ${ae(p.harvested_quantity)}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Vendido
                              </span>

                              <strong>
                                ${ae(p.sold_quantity)}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Não vendido
                              </span>

                              <strong>
                                ${ae(p.remaining_quantity)}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Receita
                              </span>

                              <strong>
                                ${X(p.gross_revenue)}
                              </strong>
                            </div>
                          </div>
                        </article>
                      `).join("")}
                </div>
              `:`
                <div class="settings-empty-state">
                  ${y("harvest")}

                  <p>
                    Nenhuma colheita foi registrada neste ciclo.
                  </p>
                </div>
              `}
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Custos
              </p>

              <h2>
                Insumos consumidos
              </h2>

              <p>
                O custo é capturado pelo preço do lote no momento em que o insumo é utilizado em um evento.
              </p>
            </div>

            <strong class="finance-section-total">
              ${X(s.input_cost)}
            </strong>
          </div>

          ${i.length?`
                <div class="finance-cost-list">
                  ${i.map(p=>`
                        <article class="finance-cost-row">
                          <span class="finance-cost-row__icon">
                            ${y("box")}
                          </span>

                          <div class="finance-cost-row__content">
                            <strong>
                              ${h(p.input_name)}
                            </strong>

                            <span>
                              ${ae(p.quantity_used)}
                              ${h(p.unit)}
                              •
                              ${p.usage_count}
                              ${p.usage_count===1?"aplicação":"aplicações"}
                              ${p.brand?` • ${h(p.brand)}`:""}
                            </span>
                          </div>

                          <strong class="finance-cost-row__value">
                            ${X(p.total_cost)}
                          </strong>
                        </article>
                      `).join("")}
                </div>
              `:`
                <div class="settings-empty-state">
                  ${y("box")}

                  <p>
                    Nenhum custo de insumo foi registrado neste ciclo.
                  </p>
                </div>
              `}
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Receitas
              </p>

              <h2>
                Vendas do ciclo
              </h2>

              <p>
                Todas as vendas das colheitas deste ciclo são consolidadas aqui.
              </p>
            </div>

            <strong class="finance-section-total finance-value--revenue">
              ${X(s.sales_revenue)}
            </strong>
          </div>

          ${c.length?`
                <div class="sale-list">
                  ${c.map(us).join("")}
                </div>
              `:`
                <div class="settings-empty-state">
                  ${y("cart")}

                  <p>
                    Nenhuma venda foi registrada para as colheitas deste ciclo.
                  </p>
                </div>
              `}
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Referências
              </p>

              <h2>
                Dados do ciclo
              </h2>
            </div>
          </div>

          <section class="detail-grid">
            <article class="detail-card">
              <p class="detail-card__label">
                Propriedade
              </p>

              <p class="detail-card__value">
                ${h(((d=n.property)==null?void 0:d.name)||"-")}
              </p>
            </article>

            <article class="detail-card">
              <p class="detail-card__label">
                Área
              </p>

              <p class="detail-card__value">
                ${h(((u=n.area)==null?void 0:u.name)||"-")}
              </p>
            </article>

            <article class="detail-card">
              <p class="detail-card__label">
                Plantio
              </p>

              <p class="detail-card__value">
                ${ne(n.planting_date)}
              </p>
            </article>

            <article class="detail-card">
              <p class="detail-card__label">
                Colheita final
              </p>

              <p class="detail-card__value">
                ${ne(n.final_harvest_date)}
              </p>
            </article>
          </section>
        </section>
      `}),null}const W=t=>({render:t,requiresAuth:!0}),Ui={"/consultor/gestao":W(oh),"/consultor/acompanhamento":W(ch),"/consultor/resultados":W(hh),"/notificacoes/compras":W(mh),"/compras":W(gi),"/consultor/negociacoes":W(gi),"/consultor":W(wi),"/consultor/empresa":W(wi),"/login":{render:Ch,publicOnly:!0},"/register":{render:Th,publicOnly:!0},"/forgot-password":{render:Lh,publicOnly:!0},"/reset-password":{render:Rh},"/dashboard":W(Qh),"/properties":W(nm),"/properties/new":W(t=>jo({...t,mode:"create"})),"/plantings":W(af),"/plantings/new":W(t=>$c({...t,mode:"create"})),"/inventory":W(cf),"/inventory/new":W(t=>Gc({...t,mode:"create"})),"/inventory/transactions":W(rl),"/inventory/transactions/new":W(Wv),"/more":W(lf),"/more/seasons":W(vf),"/more/seasons/new":W(t=>bc({...t,mode:"create"})),"/more/crops":W($f),"/more/crops/new":W(t=>wc({...t,mode:"create"})),"/more/consultants":W(Jv),"/more/consultants/new":W(t=>nl({...t,mode:"create"})),"/more/harvest-forecast":W(dg),"/more/harvests":W(Eg),"/more/harvests/new":W(t=>On({...t,mode:"create"})),"/more/sales":W(Hg),"/more/sales/new":W(t=>jn({...t,mode:"create"})),"/more/finance":W(Zg),"/more/settings":W(bg),"/more/profile":W(pf)},ay=[{regex:/^\/more\/finance\/([^/]+)$/,route:W(ty),paramNames:["cycleId"]},{regex:/^\/plantings\/([^/]+)\/harvests\/new$/,route:W(t=>On({...t,mode:"create"})),paramNames:["cycleId"]},{regex:/^\/more\/harvests\/([^/]+)\/sales\/new$/,route:W(t=>jn({...t,mode:"create"})),paramNames:["harvestId"]},{regex:/^\/more\/harvests\/([^/]+)\/edit$/,route:W(t=>On({...t,mode:"edit"})),paramNames:["harvestId"]},{regex:/^\/more\/harvests\/([^/]+)$/,route:W(xg),paramNames:["harvestId"]},{regex:/^\/more\/sales\/([^/]+)\/edit$/,route:W(t=>jn({...t,mode:"edit"})),paramNames:["saleId"]},{regex:/^\/more\/sales\/([^/]+)$/,route:W(Vg),paramNames:["saleId"]},{regex:/^\/more\/consultants\/([^/]+)\/edit$/,route:W(t=>nl({...t,mode:"edit"})),paramNames:["consultantId"]},{regex:/^\/more\/consultants\/([^/]+)$/,route:W(Yv),paramNames:["consultantId"]},{regex:/^\/plantings\/([^/]+)\/events\/([^/]+)\/inputs\/new$/,route:W(Cv),paramNames:["cycleId","eventId"]},{regex:/^\/plantings\/([^/]+)\/events\/new$/,route:W(t=>Ri({...t,mode:"create"})),paramNames:["cycleId"]},{regex:/^\/plantings\/([^/]+)\/events\/([^/]+)\/edit$/,route:W(t=>Ri({...t,mode:"edit"})),paramNames:["cycleId","eventId"]},{regex:/^\/plantings\/([^/]+)\/evolution\/new$/,route:W(lv),paramNames:["cycleId"]},{regex:/^\/plantings\/([^/]+)\/evolution$/,route:W(av),paramNames:["cycleId"]},{regex:/^\/inventory\/transactions\/([^/]+)$/,route:W(Gv),paramNames:["transactionId"]},{regex:/^\/inventory\/([^/]+)\/lots\/new$/,route:W(t=>ji({...t,mode:"create"})),paramNames:["inputId"]},{regex:/^\/inventory\/([^/]+)\/lots\/([^/]+)\/edit$/,route:W(t=>ji({...t,mode:"edit"})),paramNames:["inputId","lotId"]},{regex:/^\/inventory\/([^/]+)\/lots\/([^/]+)$/,route:W(Uv),paramNames:["inputId","lotId"]},{regex:/^\/inventory\/([^/]+)\/lots$/,route:W(jv),paramNames:["inputId"]},{regex:/^\/inventory\/([^/]+)\/transactions$/,route:W(rl),paramNames:["inputId"]},{regex:/^\/inventory\/([^/]+)\/edit$/,route:W(t=>Gc({...t,mode:"edit"})),paramNames:["inputId"]},{regex:/^\/inventory\/([^/]+)$/,route:W(Ov),paramNames:["inputId"]},{regex:/^\/more\/crops\/([^/]+)\/edit$/,route:W(t=>wc({...t,mode:"edit"})),paramNames:["cropId"]},{regex:/^\/more\/crops\/([^/]+)$/,route:W(kf),paramNames:["cropId"]},{regex:/^\/plantings\/([^/]+)\/edit$/,route:W(t=>$c({...t,mode:"edit"})),paramNames:["cycleId"]},{regex:/^\/plantings\/([^/]+)$/,route:W(Xf),paramNames:["cycleId"]},{regex:/^\/more\/seasons\/([^/]+)\/edit$/,route:W(t=>bc({...t,mode:"edit"})),paramNames:["seasonId"]},{regex:/^\/more\/seasons\/([^/]+)$/,route:W(bf),paramNames:["seasonId"]},{regex:/^\/properties\/([^/]+)\/areas\/new$/,route:W(t=>ki({...t,mode:"create"})),paramNames:["propertyId"]},{regex:/^\/properties\/([^/]+)\/areas\/([^/]+)\/edit$/,route:W(t=>ki({...t,mode:"edit"})),paramNames:["propertyId","areaId"]},{regex:/^\/properties\/([^/]+)\/areas\/([^/]+)$/,route:W(Zm),paramNames:["propertyId","areaId"]},{regex:/^\/properties\/([^/]+)\/areas$/,route:W(Sm),paramNames:["propertyId"]},{regex:/^\/properties\/([^/]+)\/edit$/,route:W(t=>jo({...t,mode:"edit"})),paramNames:["id"]},{regex:/^\/properties\/([^/]+)$/,route:W($m),paramNames:["id"]}];let er=null,vn=!1,gn=!1;function ry(t){return!t||t==="/"?"/":t.length>1?t.replace(/\/+$/,""):t}function Qr(){return ry(window.location.pathname)}function Q(t,{replace:e=!1}={}){`${window.location.pathname}${window.location.search}${window.location.hash}`!==t&&(e?window.history.replaceState({},"",t):window.history.pushState({},"",t),Pa())}function ny(t){if(Ui[t])return{route:Ui[t],params:{}};for(const e of ay){const a=t.match(e.regex);if(!a)continue;const r={};return e.paramNames.forEach((n,s)=>{r[n]=decodeURIComponent(a[s+1])}),{route:e.route,params:r}}return null}function sy(){const t=document.querySelector("#app");t.innerHTML=`
    <main class="auth-layout">
      <section class="auth-panel--message">
        <p class="brand__eyebrow">
          Meu Agro
        </p>

        <h1>
          Página não encontrada
        </h1>

        <p
          style="
            margin: 16px 0;
            color: var(--color-text-soft);
          "
        >
          O endereço informado não existe.
        </p>

        <a
          href="/"
          class="button button--primary button--full"
          data-link
        >
          Voltar ao início
        </a>
      </section>
    </main>
  `}async function Pa(){if(vn){gn=!0;return}vn=!0;try{typeof er=="function"&&(er(),er=null);let t=null;try{t=await Ro()}catch(o){console.error("Erro ao recuperar sessão:",o)}Gp(t),ko(t);const e=Qr();if(e==="/"){Q(t?"/dashboard":"/login",{replace:!0});return}const a=ny(e);if(!a){sy();return}const{route:r,params:n}=a;if(r.requiresAuth&&!t){Q(`/login?redirect=${encodeURIComponent(e)}`,{replace:!0});return}if(r.publicOnly&&!new URLSearchParams(window.location.search).has("nativeError")&&t){Q("/dashboard",{replace:!0});return}const s=await r.render({session:t,params:n});typeof s=="function"&&(er=s);const i=window.location.hash;if(i){const o=document.getElementById(decodeURIComponent(i.slice(1)));o?o.scrollIntoView({block:"start",behavior:"instant"}):window.scrollTo({top:0,behavior:"instant"})}else window.scrollTo({top:0,behavior:"instant"})}finally{vn=!1,gn&&(gn=!1,Pa())}}function gl(){window.addEventListener("popstate",()=>{Pa()}),document.addEventListener("click",t=>{const e=t.target.closest("a[data-link], button[data-app-route]");if(!e)return;const a=new URL(e.dataset.appRoute||e.href,window.location.origin);a.origin===window.location.origin&&(t.preventDefault(),Q(`${a.pathname}${a.search}${a.hash}`))}),Pa()}const iy=Object.freeze(Object.defineProperty({__proto__:null,getCurrentPath:Qr,initializeRouter:gl,navigate:Q,renderRoute:Pa},Symbol.toStringTag,{value:"Module"})),tr=wt("App",{web:()=>Or(()=>import("./web-CTHAofee.js"),[],import.meta.url).then(t=>new t.AppWeb)});function oy(t){return wo(t,{native:!0})}let Hi=!1,Fi=[];function cy(){return Ee.isNativePlatform()}let Bi=Promise.resolve(),zi=null;function Vi(t,{navigate:e}={}){if(!oy(t))return Promise.resolve(!1);const a=Bi.then(async()=>{if(t===zi)return!0;try{const r=await $o(t,V,{native:!0});return zi=t,e==null||e(r,{replace:!0}),!0}catch{return e==null||e("/login?nativeError="+encodeURIComponent("Não foi possível validar o link. Solicite um novo e-mail e tente novamente."),{replace:!0}),!1}});return Bi=a.catch(()=>!1),a}async function ly({navigate:t,getCurrentPath:e}={}){if(Hi||!cy())return;Hi=!0,Fi.push(await tr.addListener("appUrlOpen",({url:r})=>{Vi(r,{navigate:t})}));const a=await tr.getLaunchUrl();a!=null&&a.url&&await Vi(a.url,{navigate:t}),Fi.push(await tr.addListener("backButton",({canGoBack:r})=>{const n=typeof e=="function"?e():window.location.pathname;if(r&&window.history.length>1){window.history.back();return}if(n!=="/dashboard"&&typeof t=="function"){t("/dashboard");return}tr.exitApp()}))}let Dn=!1;fg();Eh(t=>{window.setTimeout(()=>{if(t==="PASSWORD_RECOVERY"&&!Dn){Q("/reset-password",{replace:!0});return}if(t==="SIGNED_IN"){bt().catch(e=>{console.warn("Não foi possível sincronizar lembretes após o login:",e)});return}if(t==="SIGNED_OUT"){const e=Qr();e!=="/login"&&e!=="/register"&&e!=="/forgot-password"&&Q("/login",{replace:!0});return}},0)});async function dy(){if(!Ee.isNativePlatform()&&xp(window.location.href)){Dn=!0;let t;try{t=await $o(window.location.href,V,{origin:window.location.origin})}catch(e){t="/login?nativeError="+encodeURIComponent(e.message)}finally{window.history.replaceState({},"",t||"/login"),Dn=!1}}gl(),await ly({navigate:Q,getCurrentPath:Qr})}dy().catch(()=>console.error("Não foi possível inicializar o aplicativo."));zm({navigate:Q});export{Ir as W};
