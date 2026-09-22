-- Execute após publicar send-trade-push e configurar os segredos no Vault.
-- Ative pg_cron e pg_net em Database > Extensions antes de executar.
-- Vault precisa conter: meuagro_project_url e meuagro_push_dispatch_secret.
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='meuagro_project_url')
 or not exists(select 1 from vault.decrypted_secrets where name='meuagro_push_dispatch_secret') then
 raise exception 'Configure os dois segredos do envio no Vault antes de agendar.';
 end if;
 perform cron.unschedule(jobid) from cron.job where jobname='meuagro-trade-push';
end $$;
select cron.schedule('meuagro-trade-push','* * * * *',
$job$
 select net.http_post(
 url:=(select decrypted_secret from vault.decrypted_secrets where name='meuagro_project_url' limit 1)||'/functions/v1/send-trade-push',
 headers:=jsonb_build_object('Content-Type','application/json','x-dispatch-secret',(select decrypted_secret from vault.decrypted_secrets where name='meuagro_push_dispatch_secret' limit 1)),
 body:='{}'::jsonb,timeout_milliseconds:=120000
 );
$job$);
