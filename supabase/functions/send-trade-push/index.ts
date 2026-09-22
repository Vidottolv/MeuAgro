import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {GoogleAuth} from 'npm:google-auth-library@9.15.1';

Deno.serve(async request=>{
 const secret=Deno.env.get('PUSH_DISPATCH_SECRET');
 if(request.method!=='POST'||!secret||request.headers.get('x-dispatch-secret')!==secret)return new Response('Unauthorized',{status:401});
 const raw=Deno.env.get('FCM_SERVICE_ACCOUNT');
 if(!raw)return new Response('Configure FCM_SERVICE_ACCOUNT',{status:503});
 try{
  const credentials=JSON.parse(raw);
  const auth=new GoogleAuth({credentials,scopes:['https://www.googleapis.com/auth/firebase.messaging']});
  const access=await auth.getAccessToken();
  if(!access)throw new Error('Authentication unavailable');
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:jobs,error}=await db.rpc('trade_claim_push');if(error)throw error;
  let sent=0,retry=0,invalid=0;
  // Bounded parallelism keeps each dispatch inside the worker time limit.
  for(let start=0;start<jobs.length;start+=5)await Promise.all(jobs.slice(start,start+5).map(async (job: Record<string,string>)=>{
   let outcome='retry';
   try{
    const response=await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(credentials.project_id)}/messages:send`,{
     method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
     body:JSON.stringify({message:{token:job.token,notification:{title:job.title,body:job.body},
      data:{notification_id:job.notification_id,recipient_id:job.recipient_id,route:job.route},
      android:{priority:'high',ttl:'86400s',notification:{channel_id:'trade_updates',tag:job.notification_id,icon:'ic_stat_meu_agro'}}}})
    });
    if(response.ok)outcome='sent';else{
     const body=await response.json().catch(()=>({}));
     if(body.error?.details?.some((d: {errorCode?:string})=>d.errorCode==='UNREGISTERED'))outcome='invalid';
    }
   }catch{/* Network failures return to the queue; tokens and credentials are never logged. */}
   const done=await db.rpc('trade_finish_push',{p_id:job.id,p_lease:job.lease,p_outcome:outcome,p_token:job.token});
   if(done.error)throw done.error;
   if(outcome==='sent')sent++;else if(outcome==='invalid')invalid++;else retry++;
  }));
  return Response.json({processed:jobs.length,sent,retry,invalid});
 }catch{
  return Response.json({error:'Falha no envio. Confira a configuração; a fila será tentada novamente.'},{status:503});
 }
});

