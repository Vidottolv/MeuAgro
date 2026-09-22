import {deliveryFixture} from './delivery-fixture.mjs';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
export async function salesFixture(){
 const f=await deliveryFixture();const migration=fs.readFileSync(new URL('../supabase/stage_29_sales_results.sql',import.meta.url),'utf8');await f.db.exec(migration);
 const save=async(data,op=randomUUID())=>(await f.db.query('select public.trade_save_financials($1::jsonb,$2::uuid) r',[JSON.stringify(data),op])).rows[0].r;
 const from=new Date(Date.now()-180*86400000).toISOString().slice(0,10),to=new Date(Date.now()+180*86400000).toISOString().slice(0,10);
 const report=async(seller,start=from,end=to,offset=0)=>(await f.db.query('select public.trade_sales_report($1,$2::date,$3::date,$4) r',[seller,start,end,offset])).rows[0].r;
 return {...f,migration,save,report,from,to};
}
