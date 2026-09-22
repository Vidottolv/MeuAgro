-- Meu Agro 0.20.0 | Consultor 3/5. Requer stage_25 e stage_26 instaladas.
-- Executar integralmente no SQL Editor. Não movimenta estoque ou dinheiro.
begin;
alter table public.trade_requests drop constraint if exists trade_requests_state_check;
alter table public.trade_requests add constraint trade_requests_state_check check(state in ('awaiting','awaiting_buyer','quoted','revision_requested','declined','cancelled','rejected','ordered'));
alter table public.trade_quotes drop constraint if exists trade_quotes_status_check;
alter table public.trade_quotes add constraint trade_quotes_status_check check(status in ('sent','superseded','declined','accepted'));
create table if not exists public.trade_orders (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique references public.trade_requests(id),
 quote_id uuid not null unique references public.trade_quotes(id),
 buyer_id uuid not null references auth.users(id), seller_id uuid not null references public.commerce_sellers(id),
 agent_at_acceptance uuid not null references auth.users(id),
 buyer_name text not null, seller_name text not null,
 quote_snapshot jsonb not null, delivery_snapshot jsonb not null,
 total numeric(16,2) not null check(total>=0), currency text not null default 'BRL' check(currency='BRL'),
 state text not null default 'confirmed' check(state='confirmed'),
 created_at timestamptz not null default now()
);
create table if not exists public.trade_messages (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.trade_requests(id),
 sender_id uuid not null references auth.users(id), sender_role text not null check(sender_role in ('buyer','seller')),
 body text not null check(length(btrim(body)) between 1 and 2000), created_at timestamptz not null default now()
);
create index if not exists trade_message_request on public.trade_messages(request_id,created_at,id);
create index if not exists trade_order_buyer on public.trade_orders(buyer_id);
create index if not exists trade_order_seller on public.trade_orders(seller_id);
alter table public.trade_orders enable row level security;
alter table public.trade_messages enable row level security;
drop policy if exists trade_order_read on public.trade_orders;
create policy trade_order_read on public.trade_orders for select to authenticated using(public.trade_reads_request(request_id));
drop policy if exists trade_message_read on public.trade_messages;
create policy trade_message_read on public.trade_messages for select to authenticated using(public.trade_reads_request(request_id));
revoke all on public.trade_orders,public.trade_messages from public,anon,authenticated;
grant select on public.trade_orders,public.trade_messages to authenticated;

create or replace function public.trade_command(p_action text,p_data jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
 u uuid:=auth.uid(); sid uuid; rid uuid; pid uuid; target uuid; v_id uuid;
 inv public.trade_invitations%rowtype; conn public.trade_connections%rowtype;
 req public.trade_requests%rowtype; product public.trade_products%rowtype; quote public.trade_quotes%rowtype;
 item jsonb; priced jsonb; arr jsonb:='[]'::jsonb; result jsonb:='{}'::jsonb;
 qty numeric; price numeric; size numeric; subtotal numeric:=0; discount numeric; freight numeric;
 email text; name text; message text:=btrim(coalesce(p_data->>'message',''));
 version integer; until_date timestamptz; delivery integer; fingerprint text; old_fingerprint text; prop_name text;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
 if p_operation_id is null then raise exception 'Identificação da operação ausente.'; end if;
 perform 1 from auth.users where id=u for update;
 fingerprint:=md5(p_action||p_data::text);
 select o.fingerprint,o.result into old_fingerprint,result from public.trade_operations o where user_id=u and operation_id=p_operation_id;
 if found then
   if fingerprint<>old_fingerprint then raise exception 'Esta operação já foi usada com outros dados.'; end if;
   return result;
 end if;
 result:='{}'::jsonb;
 if length(message)>2000 then raise exception 'A observação deve ter até 2000 caracteres.'; end if;

 if p_action in ('save_product','archive_product','invite_buyer') then
   sid:=(p_data->>'seller_id')::uuid;
   if not public.trade_agent_active(sid,u) then raise exception 'Selecione uma atuação comercial autorizada.' using errcode='42501'; end if;
   if p_action in ('save_product','archive_product') then
     if not public.commerce_is_owner(sid) then raise exception 'Somente o responsável pode alterar o catálogo.' using errcode='42501'; end if;
     pid:=nullif(p_data->>'product_id','')::uuid;
     if pid is not null and not exists(select 1 from public.trade_products where id=pid and seller_id=sid) then raise exception 'Produto indisponível.'; end if;
     if p_action='archive_product' then
       if pid is null then raise exception 'Produto não informado.'; end if;
       update public.trade_products set archived=true where id=pid;
     else
       name:=btrim(coalesce(p_data->>'name',''));
       size:=(p_data->>'package_size')::numeric;
       price:=nullif(p_data->>'reference_price','')::numeric;
       if length(name) not between 2 and 120 or length(btrim(coalesce(p_data->>'package_name',''))) not between 1 and 60 or
         size is null or size<=0 or size>1000000 or size<>round(size,3) or
         (price is not null and (price<0 or price>1000000000 or price<>round(price,2))) or
         length(coalesce(p_data->>'category',''))>80 or length(coalesce(p_data->>'brand',''))>80 or length(coalesce(p_data->>'description',''))>2000 then raise exception 'Revise os dados, quantidades e preços do produto.'; end if;
       if coalesce(p_data->>'base_unit','') not in ('kg','L','un') or coalesce(p_data->>'availability','') not in ('available','on_request','unavailable') then raise exception 'Unidade ou disponibilidade inválida.'; end if;
       if pid is null then
         insert into public.trade_products(seller_id,name,package_name,base_unit,package_size,availability)
           values(sid,name,p_data->>'package_name',p_data->>'base_unit',size,p_data->>'availability') returning id into pid;
       end if;
       update public.trade_products set name=btrim(p_data->>'name'),category=btrim(coalesce(p_data->>'category','')),brand=btrim(coalesce(p_data->>'brand','')),
         description=btrim(coalesce(p_data->>'description','')),package_name=btrim(p_data->>'package_name'),base_unit=p_data->>'base_unit',package_size=size,
         reference_price=price,availability=p_data->>'availability' where id=pid;
     end if;
     v_id:=pid;
   else
     email:=lower(btrim(coalesce(p_data->>'email','')));
     if length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Informe um e-mail válido.'; end if;
     if exists(select 1 from auth.users where id=u and lower(auth.users.email)=email) then raise exception 'Use a conta do produtor destinatário.'; end if;
     update public.trade_invitations set status='revoked' where seller_id=sid and trade_invitations.email=email and status='pending' and expires_at<=now();
     if exists(select 1 from public.trade_invitations where seller_id=sid and trade_invitations.email=email and status='pending') then raise exception 'Já existe um convite pendente para este e-mail.'; end if;
     insert into public.trade_invitations(seller_id,agent_id,email) values(sid,u,email) returning id into v_id;
   end if;
 elsif p_action='accept_connection' then
   select * into inv from public.trade_invitations where token=(p_data->>'token')::uuid for update;
   if not found or inv.status<>'pending' or inv.expires_at<=now() then raise exception 'Convite inválido, expirado ou utilizado.'; end if;
   if not exists(select 1 from auth.users where id=u and lower(auth.users.email)=inv.email and email_confirmed_at is not null) then raise exception 'Use o e-mail confirmado que recebeu o convite.' using errcode='42501'; end if;
   if not public.trade_agent_active(inv.seller_id,inv.agent_id) then raise exception 'O consultor não está mais autorizado. Solicite um novo convite ao responsável.'; end if;
   if public.commerce_can_act(inv.seller_id) then raise exception 'Você já atua por este vendedor. Não pode comprar de si mesmo.'; end if;
   name:=btrim(coalesce(p_data->>'name',''));
   if length(name) not between 2 and 120 then raise exception 'Informe seu nome de contato.'; end if;
   if exists(select 1 from public.trade_connections where seller_id=inv.seller_id and buyer_id=u) then raise exception 'Você já está conectado a este vendedor.'; end if;
   insert into public.trade_connections(seller_id,buyer_id,agent_id,buyer_name) values(inv.seller_id,u,inv.agent_id,name) returning id into v_id;
   update public.trade_invitations set status='accepted' where id=inv.id; sid:=inv.seller_id;
 elsif p_action='revoke_connection_invite' then
   select * into inv from public.trade_invitations where id=(p_data->>'invitation_id')::uuid for update;
   if not found or not(public.commerce_is_owner(inv.seller_id) or (inv.agent_id=u and public.trade_agent_active(inv.seller_id,u))) then raise exception 'Convite indisponível.' using errcode='42501'; end if;
   if inv.status<>'pending' then raise exception 'Convite não está pendente.'; end if;
   update public.trade_invitations set status='revoked' where id=inv.id; sid:=inv.seller_id; v_id:=inv.id;
 elsif p_action in ('assign_agent','create_request') then
   select * into conn from public.trade_connections where id=(p_data->>'connection_id')::uuid for update;
   if not found then raise exception 'Conexão indisponível.'; end if;
   sid:=conn.seller_id;
   if p_action='assign_agent' then
     if not public.commerce_is_owner(sid) then raise exception 'Somente o responsável pode transferir o atendimento.' using errcode='42501'; end if;
     target:=(p_data->>'agent_id')::uuid;
     if not public.trade_agent_active(sid,target) then raise exception 'O representante escolhido não possui vínculo ativo.'; end if;
     update public.trade_connections set agent_id=target where id=conn.id; v_id:=conn.id;
   else
     if conn.buyer_id<>u or not conn.active then raise exception 'Conexão não autorizada.' using errcode='42501'; end if;
     if public.commerce_can_act(sid) then raise exception 'Você não pode solicitar uma compra ao vendedor pelo qual atua.'; end if;
     if not public.trade_agent_active(sid,conn.agent_id) then raise exception 'Solicite ao responsável pela empresa a troca do consultor antes de enviar uma compra.'; end if;
     if length(btrim(coalesce(p_data->>'delivery_address',''))) not between 5 and 500 or length(coalesce(p_data->>'notes',''))>2000 then raise exception 'Informe o destino e revise as observações.'; end if;
     if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items') not between 1 and 30 then raise exception 'Selecione de 1 a 30 produtos.'; end if;
     if (select count(*) from jsonb_array_elements(p_data->'items'))<>(select count(distinct value->>'product_id') from jsonb_array_elements(p_data->'items')) then raise exception 'Produto repetido na solicitação.'; end if;
     for item in select value from jsonb_array_elements(p_data->'items') loop
       select * into product from public.trade_products where id=(item->>'product_id')::uuid and seller_id=sid and not archived and availability<>'unavailable' for share;
       if not found then raise exception 'Um produto está indisponível. Atualize o catálogo.'; end if;
       qty:=(item->>'quantity')::numeric;
       if qty is null or qty<=0 or qty>1000000 or qty<>round(qty,3) then raise exception 'Informe quantidades positivas, com até 3 casas decimais.'; end if;
       arr:=arr||jsonb_build_array(jsonb_build_object('product_id',product.id,'name',product.name,'brand',product.brand,'package_name',product.package_name,'base_unit',product.base_unit,'package_size',product.package_size,'quantity',qty));
     end loop;
     pid:=nullif(p_data->>'property_id','')::uuid;
     if pid is not null then
       select properties.name into prop_name from public.properties where id=pid and user_id=u and deleted_at is null;
       if not found then raise exception 'A propriedade não pertence à sua conta.' using errcode='42501'; end if;
     end if;
     if nullif(p_data->>'desired_date','')::date<current_date then raise exception 'A data desejada não pode estar no passado.'; end if;
     insert into public.trade_requests(connection_id,property_id,property_name,delivery_address,desired_date,notes,items)
       values(conn.id,pid,prop_name,btrim(p_data->>'delivery_address'),nullif(p_data->>'desired_date','')::date,btrim(coalesce(p_data->>'notes','')),arr) returning id into rid;
     v_id:=rid;
   end if;
 else
   rid:=(p_data->>'request_id')::uuid;
   select * into req from public.trade_requests where id=rid for update;
   if not found or not public.trade_reads_request(rid) then raise exception 'Solicitação indisponível.' using errcode='42501'; end if;
   select * into conn from public.trade_connections where id=req.connection_id for share; sid:=conn.seller_id;
   if req.state in ('declined','cancelled','rejected') then raise exception 'Esta solicitação foi encerrada.'; end if;
   if req.state='ordered' and p_action not in ('send_message','accept_quote') then raise exception 'O pedido já foi confirmado. A negociação não pode mais ser alterada.'; end if;
   if p_action in ('send_quote','ask_clarification','reject_request') then
     if not public.trade_manages_connection(conn.id) then raise exception 'Você não pode atender esta solicitação.' using errcode='42501'; end if;
   elsif p_action in ('request_revision','decline_quote','answer_clarification','cancel_request','accept_quote') then
     if conn.buyer_id<>u then raise exception 'Somente o produtor pode realizar esta ação.' using errcode='42501'; end if;
   elsif p_action='send_message' then
     if not conn.active then raise exception 'O atendimento não está ativo.'; end if;
   else raise exception 'Operação desconhecida.';
   end if;
   if p_action='accept_quote' then
     if not conn.active or not public.trade_agent_active(sid,conn.agent_id) then raise exception 'O atendimento não está ativo. Fale com o responsável pelo vendedor.'; end if;
     if public.commerce_can_act(sid) then raise exception 'Você não pode comprar do vendedor pelo qual atua.'; end if;
     if not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail antes de aceitar a proposta.'; end if;
     select * into quote from public.trade_quotes where request_id=rid order by trade_quotes.version desc limit 1 for update;
     if not found or req.state<>'quoted' or quote.status<>'sent' or quote.id is distinct from nullif(p_data->>'quote_id','')::uuid then raise exception 'A proposta mudou ou já foi aceita. Atualize a página.'; end if;
     if quote.valid_until<=clock_timestamp() then raise exception 'A proposta expirou. Solicite uma nova versão.'; end if;
     insert into public.trade_orders(request_id,quote_id,buyer_id,seller_id,agent_at_acceptance,buyer_name,seller_name,quote_snapshot,delivery_snapshot,total)
       values(rid,quote.id,u,sid,conn.agent_id,conn.buyer_name,quote.seller_name,to_jsonb(quote),
         jsonb_build_object('property_id',req.property_id,'property_name',req.property_name,'address',req.delivery_address,'desired_date',req.desired_date,'notes',req.notes),quote.total)
       returning id into v_id;
     update public.trade_quotes set status='accepted' where id=quote.id;
     update public.trade_requests set state='ordered' where id=rid;
     message:='Proposta aceita pelo produtor. Pedido confirmado.';
   elsif p_action='send_message' then
     if message='' or message !~ '[^[:space:]]' then raise exception 'Escreva uma mensagem antes de enviar.'; end if;
     insert into public.trade_messages(request_id,sender_id,sender_role,body)
       values(rid,u,case when conn.buyer_id=u then 'buyer' else 'seller' end,message) returning id into v_id;
   elsif p_action='send_quote' then
     if req.state not in ('awaiting','revision_requested') then raise exception 'Aguarde a resposta do produtor antes de enviar outra versão.'; end if;
     if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')<>jsonb_array_length(req.items) then raise exception 'Informe preço para todos os itens.'; end if;
     for item in select value from jsonb_array_elements(req.items) loop
       if (select count(*) from jsonb_array_elements(p_data->'items') x where x->>'product_id'=item->>'product_id')<>1 then raise exception 'Os produtos não correspondem à solicitação.'; end if;
       select value into priced from jsonb_array_elements(p_data->'items') where value->>'product_id'=item->>'product_id';
       price:=(priced->>'unit_price')::numeric; qty:=(item->>'quantity')::numeric;
       if price is null or price<0 or price>1000000000 or price<>round(price,2) then raise exception 'Informe preços válidos com até 2 casas decimais.'; end if;
       subtotal:=subtotal+round(price*qty,2);
       arr:=arr||jsonb_build_array(item||jsonb_build_object('unit_price',price,'line_total',round(price*qty,2)));
     end loop;
     if subtotal>1000000000000 then raise exception 'O valor da proposta excede o limite permitido.'; end if;
     discount:=coalesce(nullif(p_data->>'discount','')::numeric,0); freight:=coalesce(nullif(p_data->>'freight','')::numeric,0);
     if discount<0 or discount>subtotal or freight<0 or freight>1000000000 or discount<>round(discount,2) or freight<>round(freight,2) then raise exception 'Desconto ou frete inválido.'; end if;
     until_date:=(p_data->>'valid_until')::timestamptz; delivery:=(p_data->>'delivery_days')::integer;
     if until_date is null or until_date<=now() or until_date>now()+interval '90 days' or delivery is null or delivery<0 or delivery>365 or length(btrim(coalesce(p_data->>'payment_terms',''))) not between 1 and 500 then raise exception 'Revise validade (até 90 dias), prazo e condições de pagamento.'; end if;
     select coalesce(max(q.version),0)+1 into version from public.trade_quotes q where request_id=rid;
     update public.trade_quotes set status='superseded' where request_id=rid and status='sent';
     select s.name into name from public.commerce_sellers s where s.id=sid;
     insert into public.trade_quotes(request_id,version,items,subtotal,discount,freight,total,valid_until,delivery_days,payment_terms,notes,author_id,seller_name)
       values(rid,version,arr,subtotal,discount,freight,subtotal-discount+freight,until_date,delivery,btrim(p_data->>'payment_terms'),message,u,name) returning id into v_id;
     update public.trade_requests set state='quoted' where id=rid;
   elsif p_action in ('request_revision','decline_quote') then
     select * into quote from public.trade_quotes where request_id=rid order by trade_quotes.version desc limit 1;
     if req.state<>'quoted' or not found or quote.id<>(p_data->>'quote_id')::uuid or quote.id is null or p_data->>'quote_id' is null then raise exception 'A proposta mudou. Atualize a página.'; end if;
     if message='' then raise exception 'Informe o motivo para o consultor.'; end if;
     if p_action='decline_quote' then
       update public.trade_quotes set status='declined' where id=quote.id;
       update public.trade_requests set state='declined' where id=rid;
     else update public.trade_requests set state='revision_requested' where id=rid;
     end if;
     v_id:=quote.id;
   elsif p_action='ask_clarification' then
     if req.state not in ('awaiting','revision_requested') or message='' then raise exception 'Informe o esclarecimento necessário enquanto aguarda atendimento.'; end if;
     update public.trade_requests set state='awaiting_buyer' where id=rid;
   elsif p_action='answer_clarification' then
     if req.state<>'awaiting_buyer' or message='' then raise exception 'Informe a resposta solicitada.'; end if;
     update public.trade_requests set state='awaiting' where id=rid;
   else
     if message='' then raise exception 'Informe o motivo do encerramento.'; end if;
     update public.trade_requests set state=case when p_action='cancel_request' then 'cancelled' else 'rejected' end where id=rid;
   end if;
 end if;
 if rid is not null and p_action<>'send_message' then insert into public.trade_events(request_id,actor_id,action,message) values(rid,u,p_action,message); end if;
 insert into public.commerce_audit(actor_id,seller_id,action,subject_id) values(u,sid,'trade:'||p_action,coalesce(v_id,rid));
 result:=jsonb_build_object('id',coalesce(v_id,rid),'request_id',rid,'seller_id',sid);
 insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(u,p_operation_id,fingerprint,result);
 return result;
end;
$$;
revoke all on function public.trade_command(text,jsonb,uuid) from public,anon;
grant execute on function public.trade_command(text,jsonb,uuid) to authenticated;
commit;
