begin;
insert into public.app_plans(code,name,seat_limit,published) values('lite','Consultor Lite',1,false) on conflict do nothing;
create table if not exists public.app_lite_sales(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 producer text not null,sold_on date not null,payment_method text not null,
 items jsonb not null,total_cents bigint not null check(total_cents>0),
 commission_type text not null,commission_rate int not null default 0,
 commission_cents bigint not null check(commission_cents>=0),note text not null default '',
 version int not null default 1,cancelled_at timestamptz,cancel_reason text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists app_lite_sales_owner_date on public.app_lite_sales(user_id,sold_on desc,id);
create table if not exists public.app_lite_installments(
 id uuid primary key default gen_random_uuid(),sale_id uuid not null references public.app_lite_sales(id),
 user_id uuid not null references auth.users(id),number int not null,due_on date not null,
 sale_cents bigint not null,commission_cents bigint not null,unique(sale_id,number));
create index if not exists app_lite_installments_owner_due on public.app_lite_installments(user_id,due_on);
create table if not exists public.app_lite_receipts(
 id uuid primary key default gen_random_uuid(),installment_id uuid not null references public.app_lite_installments(id),
 user_id uuid not null references auth.users(id),amount_cents bigint not null check(amount_cents>0),received_on date not null,
 note text not null default '',reversed_at timestamptz,reverse_reason text,created_at timestamptz not null default now());
create index if not exists app_lite_receipts_owner_date on public.app_lite_receipts(user_id,received_on);
create table if not exists public.app_lite_operations(user_id uuid not null references auth.users(id),id uuid not null,payload jsonb not null,result jsonb not null,primary key(user_id,id));
create or replace function public.app_is_lite(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_subscriptions where user_id=p_user and plan_code='lite');$$;
revoke all on function public.app_is_lite(uuid) from public,anon;
grant execute on function public.app_is_lite(uuid) to authenticated;

-- This boundary also covers SECURITY DEFINER RPCs. Storage/Realtime use restrictive RLS below.
create or replace function public.app_lite_request_guard() returns void language plpgsql security definer set search_path='' as $$
declare p text:=regexp_replace(coalesce(current_setting('request.path',true),''),'^/?(rest/v1/)?','');
begin
 perform set_config('app.lite.guard_checked','1',true);
 if not public.app_is_lite(auth.uid()) then return;end if;
 if p='profiles' or p='rpc/app_is_lite' or p in ('rpc/app_lite_access','rpc/app_lite_context','rpc/app_lite_command','rpc/app_account_context','rpc/app_plan_request','rpc/app_is_platform_admin')
 or p ~ '^rpc/app_(checkout_|commercial_context$|trial_start$|change_|lifecycle_|privacy_)' then return;end if;
 raise exception 'O plano Lite permite somente vendas e comissões do consultor.' using errcode='42501';
end;$$;
revoke all on function public.app_lite_request_guard() from public,anon;
grant execute on function public.app_lite_request_guard() to authenticated,service_role,anon;
do $$declare existing text;t record;begin
 select split_part(x,'=',2) into existing from pg_roles r cross join lateral unnest(r.rolconfig) x where r.rolname='authenticator' and x like 'pgrst.db_pre_request=%';
 if coalesce(existing,'') not in ('','public.app_lite_request_guard') then raise exception 'Existe um db_pre_request customizado (%). Integre app_lite_request_guard ao hook existente antes da etapa 59.',existing;end if;
 execute 'alter role authenticator set pgrst.db_pre_request=''public.app_lite_request_guard''';
 for t in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and c.relrowsecurity and (n.nspname='public' or (n.nspname='storage' and c.relname='objects')) and c.relname<>'profiles' and c.relname not like 'app_lite_%' loop
 execute format('drop policy if exists app_lite_boundary on %I.%I',t.nspname,t.relname);
 execute format('create policy app_lite_boundary on %I.%I as restrictive to authenticated using(not public.app_is_lite(auth.uid())) with check(not public.app_is_lite(auth.uid()))',t.nspname,t.relname);
 end loop;
end;$$;
do $$declare n text;begin foreach n in array array['app_lite_sales','app_lite_installments','app_lite_receipts','app_lite_operations'] loop
 execute format('alter table public.%I enable row level security',n);
 execute format('revoke all on public.%I from public,anon,authenticated',n);
 end loop;end;$$;

create or replace function public.app_lite_access() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('mode',case when public.app_is_lite(auth.uid()) then 'lite' else 'full' end,'active',coalesce(public.app_access_until(auth.uid())>now(),false),'protected',coalesce(current_setting('app.lite.guard_checked',true),'')='1');
end;$$;

create or replace function public.app_lite_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s public.app_lite_sales%rowtype;v_installment public.app_lite_installments%rowtype;v_receipt public.app_lite_receipts%rowtype;
 prior public.app_lite_operations%rowtype;payload jsonb:=jsonb_build_object('action',p_action,'data',p_data);result jsonb;
 item jsonb;v_items jsonb:='[]';v_total bigint:=0;line bigint;qty numeric;price bigint;commission bigint;rate int:=0;
 n int;j int;first_day date;due date;dates jsonb;today date:=(now() at time zone 'America/Sao_Paulo')::date;paid bigint;amount bigint;sid uuid;
begin
 if u is null or not public.app_is_lite(u) then raise exception 'Disponível somente para contas Lite.' using errcode='42501';end if;
 if coalesce(current_setting('app.lite.guard_checked',true),'')<>'1' then raise exception 'Ative o bloqueio de acesso Lite no servidor.';end if;
 if p_operation is null or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>65536 then raise exception 'Dados inválidos.';end if;
 perform pg_advisory_xact_lock(hashtext('lite'),hashtext(u::text));
 select * into prior from public.app_lite_operations where user_id=u and id=p_operation;
 if found then if prior.payload<>payload then raise exception 'Identificador de operação reutilizado com outros dados.';end if;return prior.result;end if;
 if not coalesce(public.app_access_until(u)>now(),false) then raise exception 'Plano sem vigência. Consulte o histórico e renove para registrar alterações.';end if;
 if p_action='save' then
 if length(trim(coalesce(p_data->>'producer',''))) not between 2 and 160 or coalesce(p_data->>'payment_method','') not in ('pix','cash','card','boleto','transfer','other') or length(coalesce(p_data->>'note',''))>2000 then raise exception 'Confira produtor, pagamento e observações.';end if;
 if (p_data->>'sold_on')::date not between date '2000-01-01' and today then raise exception 'Data de venda inválida.';end if;
 if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items') not between 1 and 50 then raise exception 'Informe de 1 a 50 itens.';end if;
 for item in select value from jsonb_array_elements(p_data->'items') loop
 qty:=(item->>'quantity')::numeric;price:=(item->>'unit_price_cents')::bigint;
 if qty is null or qty<=0 or qty>1000000 or qty<>round(qty,3) or price is null or price<=0 or price>100000000 or (item->>'unit_price_cents')::numeric<>price or length(trim(coalesce(item->>'product',''))) not between 1 and 160 or length(trim(coalesce(item->>'unit',''))) not between 1 and 24 then raise exception 'Produto, quantidade, unidade ou preço inválido.';end if;
 line:=round(qty*price);v_total:=v_total+line;
 v_items:=v_items||jsonb_build_array(jsonb_build_object('product',trim(item->>'product'),'quantity',qty,'unit',trim(item->>'unit'),'unit_price_cents',price,'total_cents',line));
 end loop;
 if v_total not between 1 and 100000000000 then raise exception 'Total da venda inválido.';end if;
 if p_data->>'commission_type'='percent' then
 rate:=(p_data->>'commission_rate')::int;
 if rate is null or rate not between 0 and 10000 or (p_data->>'commission_rate')::numeric<>rate then raise exception 'Comissão deve estar entre 0 e 100%%.';end if;
 commission:=round(v_total::numeric*rate/10000);
 elsif p_data->>'commission_type'='fixed' then commission:=(p_data->>'commission_cents')::bigint;
 if (p_data->>'commission_cents')::numeric<>commission then raise exception 'Comissão inválida.';end if;
 else raise exception 'Informe o tipo da comissão.';end if;
 if commission is null or commission not between 0 and v_total then raise exception 'Comissão inválida.';end if;
 dates:=p_data->'dates';if jsonb_typeof(dates) is distinct from 'array' or jsonb_array_length(dates) not between 1 and 36 then raise exception 'Informe de 1 a 36 parcelas.';end if;n:=jsonb_array_length(dates);
 first_day:=null;
 for j in 0..n-1 loop due:=(dates->>j)::date;if due is null or due<date '2000-01-01' or due>today+interval '10 years' or (first_day is not null and due<first_day) then raise exception 'Datas de parcelas inválidas ou fora de ordem.';end if;first_day:=due;end loop;
 if coalesce(p_data->>'id','')<>'' then
 select * into s from public.app_lite_sales where id=(p_data->>'id')::uuid and user_id=u for update;
 if not found or s.cancelled_at is not null or s.version is distinct from (p_data->>'version')::int then raise exception 'Venda alterada. Atualize antes de editar.';end if;
 if exists(select 1 from public.app_lite_receipts r join public.app_lite_installments i on i.id=r.installment_id where i.sale_id=s.id and r.reversed_at is null) then raise exception 'Estorne os recebimentos antes de editar a venda.';end if;
 -- Keep old installment/receipt audit records; only remove schedules without any receipt history.
 if exists(select 1 from public.app_lite_receipts r join public.app_lite_installments i on i.id=r.installment_id where i.sale_id=s.id) then raise exception 'Venda com histórico de recebimentos: cancele e cadastre uma substituição.';end if;
 sid:=s.id;delete from public.app_lite_installments where sale_id=sid;
 update public.app_lite_sales set producer=trim(p_data->>'producer'),sold_on=(p_data->>'sold_on')::date,payment_method=p_data->>'payment_method',items=v_items,total_cents=v_total,commission_type=p_data->>'commission_type',commission_rate=rate,commission_cents=commission,note=coalesce(p_data->>'note',''),version=version+1,updated_at=now() where id=sid;
 else
 insert into public.app_lite_sales(user_id,producer,sold_on,payment_method,items,total_cents,commission_type,commission_rate,commission_cents,note) values(u,trim(p_data->>'producer'),(p_data->>'sold_on')::date,p_data->>'payment_method',v_items,v_total,p_data->>'commission_type',rate,commission,coalesce(p_data->>'note','')) returning id into sid;
 end if;
 for j in 1..n loop insert into public.app_lite_installments(sale_id,user_id,number,due_on,sale_cents,commission_cents) values(sid,u,j,(dates->>(j-1))::date,v_total/n+case when j<=v_total%n then 1 else 0 end,commission/n+case when j<=commission%n then 1 else 0 end);end loop;
 result:=jsonb_build_object('id',sid);
 elsif p_action='receive' then
 select * into v_installment from public.app_lite_installments where id=(p_data->>'installment')::uuid and user_id=u for update;
 if not found then raise exception 'Parcela não encontrada.';end if;
 select * into s from public.app_lite_sales where id=v_installment.sale_id and user_id=u;
 if s.cancelled_at is not null then raise exception 'Venda cancelada.';end if;
 amount:=(p_data->>'amount_cents')::bigint;select coalesce(sum(amount_cents),0) into paid from public.app_lite_receipts where installment_id=v_installment.id and reversed_at is null;
 if amount is null or amount<=0 or amount>v_installment.commission_cents-paid or (p_data->>'amount_cents')::numeric<>amount then raise exception 'Valor excede a comissão pendente ou é inválido.';end if;
 if (p_data->>'received_on') is null or (p_data->>'received_on')::date not between date '2000-01-01' and today or length(coalesce(p_data->>'note',''))>2000 then raise exception 'Data ou observação inválida.';end if;
 insert into public.app_lite_receipts(user_id,installment_id,amount_cents,received_on,note) values(u,v_installment.id,amount,(p_data->>'received_on')::date,coalesce(p_data->>'note','')) returning id into sid;result:=jsonb_build_object('id',sid);
 elsif p_action='reverse' then
 if length(trim(coalesce(p_data->>'reason',''))) not between 3 and 500 then raise exception 'Informe o motivo do estorno.';end if;
 select * into v_receipt from public.app_lite_receipts where id=(p_data->>'receipt')::uuid and user_id=u for update;
 if not found or v_receipt.reversed_at is not null then raise exception 'Recebimento não encontrado ou já estornado.';end if;
 update public.app_lite_receipts set reversed_at=now(),reverse_reason=trim(p_data->>'reason') where id=v_receipt.id;result:=jsonb_build_object('id',v_receipt.id);
 elsif p_action='cancel' then
 select * into s from public.app_lite_sales where id=(p_data->>'id')::uuid and user_id=u for update;
 if not found or s.cancelled_at is not null or s.version is distinct from (p_data->>'version')::int then raise exception 'Venda alterada. Atualize a tela.';end if;
 if length(trim(coalesce(p_data->>'reason',''))) not between 3 and 500 then raise exception 'Informe o motivo do cancelamento.';end if;
 if exists(select 1 from public.app_lite_receipts r join public.app_lite_installments i on i.id=r.installment_id where i.sale_id=s.id and r.reversed_at is null) then raise exception 'Estorne os recebimentos antes de cancelar.';end if;
 update public.app_lite_sales set cancelled_at=now(),cancel_reason=trim(p_data->>'reason'),version=version+1,updated_at=now() where id=s.id;result:=jsonb_build_object('id',s.id);
 else raise exception 'Ação desconhecida.';end if;
 insert into public.app_lite_operations values(u,p_operation,payload,result);return result;
end;$$;

create or replace function public.app_lite_context(p_month date default current_date,p_search text default '',p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();m date:=date_trunc('month',p_month)::date;result jsonb;begin
 if u is null or not public.app_is_lite(u) then raise exception 'Disponível somente para contas Lite.' using errcode='42501';end if;
 if m is null or m not between date '2000-01-01' and date '2200-01-01' or length(coalesce(p_search,''))>160 or p_offset is null or p_offset not between 0 and 1000000 then raise exception 'Filtro inválido.';end if;
 with installments as(select i.*,s.cancelled_at,coalesce((select sum(r.amount_cents) from public.app_lite_receipts r where r.installment_id=i.id and r.reversed_at is null),0) paid from public.app_lite_installments i join public.app_lite_sales s on s.id=i.sale_id where i.user_id=u),
 months as(select (m+make_interval(months=>k))::date month_start from generate_series(-11,11) k),
 filtered as(select s.* from public.app_lite_sales s where s.user_id=u and s.sold_on>=m and s.sold_on<m+interval '1 month' and (coalesce(p_search,'')='' or position(lower(p_search) in lower(s.producer||' '||s.items::text))>0)),
 page as(select * from filtered order by sold_on desc,created_at desc,id limit 20 offset p_offset)
 select jsonb_build_object('access',public.app_lite_access(),'month',m,
 'summary',(select jsonb_build_object('count',count(*),'sales',coalesce(sum(total_cents),0),'earned',coalesce(sum(commission_cents),0)) from public.app_lite_sales where user_id=u and cancelled_at is null and sold_on>=m and sold_on<m+interval '1 month'),
 'received',(select coalesce(sum(amount_cents),0) from public.app_lite_receipts where user_id=u and reversed_at is null and received_on>=m and received_on<m+interval '1 month'),
 'overdue',(select coalesce(sum(commission_cents-paid),0) from installments where cancelled_at is null and due_on<(now() at time zone 'America/Sao_Paulo')::date),
 'months',(select jsonb_agg(jsonb_build_object('month',month_start,'expected',(select coalesce(sum(commission_cents-paid),0) from installments where cancelled_at is null and due_on>=month_start and due_on<month_start+interval '1 month'),'received',(select coalesce(sum(amount_cents),0) from public.app_lite_receipts where user_id=u and reversed_at is null and received_on>=month_start and received_on<month_start+interval '1 month')) order by month_start) from months),
 'count',(select count(*) from filtered),
 'sales',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('installments',(select jsonb_agg(to_jsonb(i)||jsonb_build_object('receipts',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at,r.id) from public.app_lite_receipts r where r.installment_id=i.id),'[]')) order by i.number) from installments i where i.sale_id=p.id)) order by p.sold_on desc,p.created_at desc,p.id) from page p),'[]')) into result;return result;
end;$$;
revoke all on function public.app_lite_access(),public.app_lite_context(date,text,int),public.app_lite_command(uuid,text,jsonb) from public,anon;
grant execute on function public.app_lite_access(),public.app_lite_context(date,text,int),public.app_lite_command(uuid,text,jsonb) to authenticated;
-- Assisted pilot provisioning, with audit and optimistic version; never changes a billed subscription.
create or replace function public.app_lite_admin_assign(p_operation uuid,p_user uuid,p_version int,p_until timestamptz,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();s public.app_subscriptions%rowtype;a public.app_admin_audit%rowtype;payload jsonb:=jsonb_build_object('user',p_user,'version',p_version,'until',p_until,'reason',p_reason);result jsonb;
begin
 if actor is null or not public.app_is_platform_admin() then raise exception 'Somente administrador da plataforma.' using errcode='42501';end if;
 if p_operation is null or p_user is null or p_until is null or p_until<=now() or p_until>now()+interval '366 days' or length(trim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'Confira usuário, vigência e motivo.';end if;
 perform pg_advisory_xact_lock(hashtext('lite-assignment'),hashtext(p_user::text));
 select * into a from public.app_admin_audit where actor_id=actor and operation_id=p_operation;
 if found then if a.action<>'lite_assign' or a.payload<>payload then raise exception 'Operação reutilizada.';end if;return a.after_data;end if;
 select * into s from public.app_subscriptions where user_id=p_user for update;
 if coalesce(s.version,0) is distinct from p_version then raise exception 'Conta alterada. Confira a versão atual.';end if;
 if s.provider_subscription is not null then raise exception 'Há vínculo de cobrança. Trate a alteração pelo fluxo comercial; não substitua a assinatura pelo piloto.';end if;
 insert into public.app_subscriptions(user_id,plan_code,manual_until) values(p_user,'lite',p_until)
 on conflict(user_id) do update set plan_code='lite',manual_until=p_until,commercial_snapshot=null,expected_cents=null,version=public.app_subscriptions.version+1,updated_at=now();
 select to_jsonb(x) into result from public.app_subscriptions x where user_id=p_user;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(actor,p_operation,'lite_assign',p_user::text,p_reason,payload,to_jsonb(s),result);return result;
end;$$;
revoke all on function public.app_lite_admin_assign(uuid,uuid,int,timestamptz,text) from public,anon;
grant execute on function public.app_lite_admin_assign(uuid,uuid,int,timestamptz,text) to authenticated;
notify pgrst,'reload config';notify pgrst,'reload schema';
commit;


