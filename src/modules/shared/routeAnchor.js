// Vue pages may finish loading after the router has mounted them.
export function scrollToRouteAnchor(hash) {
 let id;
 try {id=decodeURIComponent((hash||'').slice(1));} catch {id='';}
 window.scrollTo({top:0,behavior:'instant'});
 if(!id)return()=>{};
 let observer,timer;
 const stop=()=>{observer?.disconnect();clearTimeout(timer)};
 const locate=()=>{const target=document.getElementById(id);if(!target)return false;target.scrollIntoView({block:'start',behavior:'instant'});stop();return true};
 if(!locate()){observer=new MutationObserver(locate);observer.observe(document.querySelector('#app'),{childList:true,subtree:true});timer=setTimeout(stop,15000)}
 return stop;
}
