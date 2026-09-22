-- Meu Agro 0.21.0 | Consultor 4/5. Requer stage_27 e estoque das etapas 14/15.
-- Execute integralmente no SQL Editor. Somente o recebimento pelo produtor gera estoque.
begin;
do $$ begin
 if not exists(select 1 from pg_trigger where tgrelid='public.inventory_lots'::regclass and tgname='trg_create_initial_inventory_entry' and tgenabled in ('O','A')) then
  raise exception 'Instale primeiro a etapa 14/15 do barracão (entrada automática de lotes).';
 end if;
end $$;
alter table public.trade_orders drop constraint if exists trade_orders_state_check;
alter table public.trade_orders add constraint trade_orders_state_check check(state in ('confirmed','awaiting_receipt','delivery_issue','received'));
alter table public.trade_orders add column if not exists delivery_version integer not null default 0;
alter table public.trade_orders add column if not exists delivered_at timestamptz;
alter table public.trade_orders add column if not exists delivered_by uuid references auth.users(id);
alter table public.trade_orders add column if not exists received_at timestamptz;
alter table public.trade_orders add column if not exists received_by uuid references auth.users(id);

create table if not exists public.trade_inventory_links (
 buyer_id uuid not null references auth.users(id),product_id uuid not null references public.trade_products(id),
 agricultural_input_id uuid not null references public.agricultural_inputs(id),primary key(buyer_id,product_id)
);
create table if not exists public.trade_receipt_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.trade_orders(id),
 product_id uuid not null references public.trade_products(id),agricultural_input_id uuid not null references public.agricultural_inputs(id),
 inventory_lot_id uuid not null unique references public.inventory_lots(id),quantity numeric not null check(quantity>0),
 unit text not null,total_cost numeric(16,2) not null check(total_cost>=0),created_at timestamptz not null default now(),unique(order_id,product_id)
);
alter table public.trade_inventory_links enable row level security;
alter table public.trade_receipt_items enable row level security;
drop policy if exists trade_inventory_link_read on public.trade_inventory_links;
create policy trade_inventory_link_read on public.trade_inventory_links for select to authenticated using(buyer_id=auth.uid());
drop policy if exists trade_receipt_read on public.trade_receipt_items;
create policy trade_receipt_read on public.trade_receipt_items for select to authenticated using(exists(select 1 from public.trade_orders o where o.id=order_id and o.buyer_id=auth.uid()));
revoke all on public.trade_inventory_links,public.trade_receipt_items from public,anon,authenticated;
grant select on public.trade_inventory_links,public.trade_receipt_items to authenticated;

create table if not exists public.trade_notifications (
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references auth.users(id),
 request_id uuid not null references public.trade_requests(id),source_id uuid not null,
 kind text not null,title text not null,body text not null,read_at timestamptz,
 created_at timestamptz not null default now(),unique(recipient_id,source_id)
);
create index if not exists trade_notification_recipient on public.trade_notifications(recipient_id,created_at desc);
alter table public.trade_notifications enable row level security;
drop policy if exists trade_notification_read on public.trade_notifications;
create policy trade_notification_read on public.trade_notifications for select to authenticated using(recipient_id=auth.uid() and public.trade_reads_request(request_id));
revoke all on public.trade_notifications from public,anon,authenticated;
grant select on public.trade_notifications to authenticated;

-- Conteúdo genérico: a conversa é aberta apenas depois de conferir o acesso atual.
create or replace function public.trade_notify_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor uuid; action text; heading text; c public.trade_connections%rowtype; owner uuid; target uuid;
begin
 if tg_table_name='trade_messages' then actor:=new.sender_id;action:='send_message';else actor:=new.actor_id;action:=new.action;end if;
 select conn.* into c from public.trade_connections conn join public.trade_requests r on r.connection_id=conn.id where r.id=new.request_id;
 select owner_id into owner from public.commerce_sellers where id=c.seller_id;
 heading:=case action when 'send_message' then 'Nova mensagem' when 'create_request' then 'Nova solicitação de compra'
 when 'send_quote' then 'Proposta recebida' when 'request_revision' then 'Revisão solicitada' when 'decline_quote' then 'Proposta recusada'
 when 'ask_clarification' then 'Esclarecimento solicitado' when 'answer_clarification' then 'Esclarecimento respondido'
 when 'accept_quote' then 'Pedido confirmado' when 'cancel_request' then 'Solicitação cancelada' when 'reject_request' then 'Atendimento recusado'
 when 'mark_delivery' then 'Entrega informada: confirme o recebimento' when 'report_delivery_issue' then 'Problema informado na entrega'
 when 'confirm_receipt' then 'Recebimento confirmado' else 'Atualização da negociação' end;
 for target in select distinct value from unnest(array[c.buyer_id,c.agent_id,owner]) value where value is not null and value<>actor loop
  if target=c.buyer_id or public.trade_agent_active(c.seller_id,target) then
   insert into public.trade_notifications(recipient_id,request_id,source_id,kind,title,body)
    values(target,new.request_id,new.id,action,heading,'Abra a negociação para consultar os detalhes.') on conflict do nothing;
  end if;
 end loop;
 return new;
end $$;
revoke all on function public.trade_notify_change() from public,anon,authenticated;
drop trigger if exists trade_event_notification on public.trade_events;
create trigger trade_event_notification after insert on public.trade_events for each row execute function public.trade_notify_change();
drop trigger if exists trade_message_notification on public.trade_messages;
create trigger trade_message_notification after insert on public.trade_messages for each row execute function public.trade_notify_change();

create or replace function public.trade_notification_inbox() returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('unread_count',(select count(*) from public.trade_notifications where read_at is null),
 'items',coalesce((select jsonb_agg(to_jsonb(n) order by (n.read_at is not null),n.created_at desc,n.id desc) from
  (select t.*,case when c.buyer_id=auth.uid() then '/compras?request=' else '/consultor/negociacoes?request=' end||t.request_id::text as route
   from public.trade_notifications t join public.trade_requests r on r.id=t.request_id join public.trade_connections c on c.id=r.connection_id
   order by (t.read_at is not null),t.created_at desc,t.id desc limit 100) n),'[]'::jsonb));
$$;
create or replace function public.trade_mark_notification_read(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 update public.trade_notifications set read_at=coalesce(read_at,now())
 where id=p_id and recipient_id=auth.uid() and public.trade_reads_request(request_id);
end $$;
revoke all on function public.trade_notification_inbox(),public.trade_mark_notification_read(uuid) from public,anon;
grant execute on function public.trade_notification_inbox(),public.trade_mark_notification_read(uuid) to authenticated;

create or replace function public.fulfillment_command(p_action text,p_data jsonb,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
 u uuid:=auth.uid();o public.trade_orders%rowtype;c public.trade_connections%rowtype;i public.agricultural_inputs%rowtype;
 old_fingerprint text;fingerprint text;result jsonb;message text:=btrim(coalesce(p_data->>'message',''));
 item jsonb;mapping jsonb;pid uuid;input_id uuid;lot_id uuid;qty numeric;unit text;cost numeric;cum_weight numeric:=0;prior_cost numeric:=0;
 weight_total numeric;weight numeric;count_items integer;lot_qty numeric;entry_qty numeric;entry_cost numeric;lot_cost numeric;receipt_date date;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation_id is null then raise exception 'Identificação da operação ausente.';end if;
 perform 1 from auth.users where id=u for update;
 fingerprint:=md5('fulfillment:'||p_action||p_data::text);
 select t.fingerprint,t.result into old_fingerprint,result from public.trade_operations t where user_id=u and operation_id=p_operation_id;
 if found then
  if fingerprint is distinct from old_fingerprint then raise exception 'Esta operação já foi usada com outros dados.';end if;
  return result;
 end if;
 select * into o from public.trade_orders where id=(p_data->>'order_id')::uuid for update;
 if not found or not public.trade_reads_request(o.request_id) then raise exception 'Pedido indisponível.' using errcode='42501';end if;
 select conn.* into c from public.trade_connections conn join public.trade_requests r on r.connection_id=conn.id where r.id=o.request_id for share of conn;
 if length(message)>2000 then raise exception 'Use até 2000 caracteres.';end if;
 if p_action='mark_delivery' then
  if not public.trade_manages_connection(c.id) then raise exception 'Somente o consultor responsável pode informar a entrega.' using errcode='42501';end if;
  if o.state not in ('confirmed','delivery_issue') then raise exception 'A entrega já foi informada. Aguarde a resposta do produtor.';end if;
  update public.trade_orders set state='awaiting_receipt',delivery_version=delivery_version+1,delivered_at=now(),delivered_by=u where id=o.id;
 elsif p_action in ('report_delivery_issue','confirm_receipt') then
  if o.buyer_id<>u then raise exception 'Somente o produtor pode confirmar ou contestar o recebimento.' using errcode='42501';end if;
  if o.state<>'awaiting_receipt' or o.delivery_version is distinct from (p_data->>'delivery_version')::integer then raise exception 'A situação da entrega mudou. Atualize a página.';end if;
  if p_action='report_delivery_issue' then
   if message='' or message !~ '[^[:space:]]' then raise exception 'Descreva o problema com a entrega.';end if;
   update public.trade_orders set state='delivery_issue' where id=o.id;
  else
   count_items:=jsonb_array_length(o.quote_snapshot->'items');
   if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')<>count_items then raise exception 'Escolha o destino de todos os produtos no barracão.';end if;
   weight_total:=(o.quote_snapshot->>'subtotal')::numeric;
   receipt_date:=(now() at time zone 'America/Sao_Paulo')::date;
   for item in select value from jsonb_array_elements(o.quote_snapshot->'items') loop
    pid:=(item->>'product_id')::uuid;
    if (select count(*) from jsonb_array_elements(p_data->'items') x where x->>'product_id'=pid::text)<>1 then raise exception 'Os produtos não correspondem ao pedido.';end if;
    select value into mapping from jsonb_array_elements(p_data->'items') x where x->>'product_id'=pid::text;
    qty:=(item->>'quantity')::numeric*(item->>'package_size')::numeric;
    if qty<=0 or qty>9999999999.9999 or qty<>round(qty,4) then raise exception 'A quantidade convertida excede a precisão do barracão (4 casas decimais). Fale com o responsável.';end if;
    unit:=case item->>'base_unit' when 'kg' then 'kg' when 'L' then 'l' when 'un' then 'unit' end;
    if unit is null then raise exception 'Unidade do produto não suportada.';end if;
    input_id:=nullif(mapping->>'input_id','')::uuid;
    if input_id is null then
     select agricultural_input_id into input_id from public.trade_inventory_links where buyer_id=u and product_id=pid;
     if input_id is not null and not exists(select 1 from public.agricultural_inputs where id=input_id and user_id=u and active and deleted_at is null and base_unit=unit) then input_id:=null;end if;
    end if;
    if input_id is null then
     insert into public.agricultural_inputs(user_id,name,brand,category,base_unit,minimum_stock,active)
       values(u,item->>'name',nullif(item->>'brand',''),'other',unit,0,true) returning id into input_id;
    end if;
    select * into i from public.agricultural_inputs where id=input_id for share;
    if not found or i.user_id<>u or not i.active or i.deleted_at is not null or i.base_unit<>unit then raise exception 'Escolha um insumo ativo da sua conta com a unidade correta.' using errcode='42501';end if;
    weight:=case when weight_total>0 then (item->>'line_total')::numeric else 1 end;
    cum_weight:=cum_weight+weight;
    cost:=round(o.total*cum_weight/(case when weight_total>0 then weight_total else count_items end),2)-prior_cost;
    prior_cost:=prior_cost+cost;
    insert into public.inventory_lots(user_id,agricultural_input_id,supplier,purchased_quantity,unit,total_price,purchase_date,notes)
     values(u,input_id,o.seller_name,qty,unit,cost,receipt_date,'Recebimento do pedido '||o.id::text)
     returning id,purchased_quantity,total_price into lot_id,lot_qty,lot_cost;
    select sum(t.quantity),round(sum(t.total_cost),2) into entry_qty,entry_cost from public.inventory_transactions t where inventory_lot_id=lot_id and transaction_type='entry' and user_id=u;
    if lot_qty is distinct from qty or entry_qty is distinct from qty or lot_cost is distinct from cost or entry_cost is distinct from cost then raise exception 'A estrutura do barracão não preservou a quantidade ou custo. Nenhum recebimento foi gravado.';end if;
    insert into public.trade_receipt_items(order_id,product_id,agricultural_input_id,inventory_lot_id,quantity,unit,total_cost) values(o.id,pid,input_id,lot_id,qty,unit,cost);
    insert into public.trade_inventory_links(buyer_id,product_id,agricultural_input_id) values(u,pid,input_id)
     on conflict(buyer_id,product_id) do update set agricultural_input_id=excluded.agricultural_input_id;
   end loop;
   update public.trade_orders set state='received',received_at=now(),received_by=u where id=o.id;
   message:='Recebimento integral confirmado pelo produtor. Produtos adicionados ao barracão.';
  end if;
 else raise exception 'Operação desconhecida.';end if;
 insert into public.trade_events(request_id,actor_id,action,message) values(o.request_id,u,p_action,message);
 result:=jsonb_build_object('id',o.id,'request_id',o.request_id);
 insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(u,p_operation_id,fingerprint,result);
 return result;
end $$;
revoke all on function public.fulfillment_command(text,jsonb,uuid) from public,anon;
grant execute on function public.fulfillment_command(text,jsonb,uuid) to authenticated;
commit;
