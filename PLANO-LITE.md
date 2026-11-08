# Ativar o Consultor Lite

Este pacote acrescenta um plano exclusivo para consultores, com navegação própria. Não publica mudanças, não configura um preço nem cria cobranças automaticamente.

## 1. Aplicar o pacote

Coloque `meuagro-consultor-lite.patch` na raiz de `C:\src\MeuAgro`. No PowerShell dessa pasta:

```powershell
git apply --check meuagro-consultor-lite.patch
git apply meuagro-consultor-lite.patch
```

Se a checagem falhar, não use `--reject` nem descarte arquivos: envie a mensagem para ajustarmos o pacote à sua versão.

## 2. Instalar o banco

No projeto correto do Supabase, abra **SQL Editor → New query**, copie TODO o conteúdo de `supabase/stage_59_consultant_lite.sql` e execute. Ele depende das etapas anteriores de planos/comercial (48–52). Não é necessário fazer deploy de Edge Functions para este pacote.

A etapa pode ser executada novamente. Ela instala um `db_pre_request` no PostgREST e políticas restritivas de acesso. Se já existir um hook personalizado, a etapa interrompe e desfaz a instalação: precisamos integrar os dois hooks antes de prosseguir. Não remova o hook de terceiros para contornar essa proteção.

Confira no SQL Editor:

```sql
select code, name, monthly_cents, published from public.app_plans where code='lite';
select rolname, rolconfig from pg_roles where rolname='authenticator';
```

O plano deve aparecer como `lite`, sem preço e não publicado. A configuração do papel `authenticator` deve conter `pgrst.db_pre_request=public.app_lite_request_guard`.

## 3. Liberar uma conta piloto

Prefira uma conta nova de consultor. Peça para a pessoa criar a conta normalmente e obtenha seu UUID em **Authentication → Users**. A ativação abaixo é administrativa; não exponha esses comandos no aplicativo.

Para localizar os dados necessários:

```sql
-- Administradores já autorizados da plataforma:
select user_id from public.app_platform_admins where active;
-- Veja a versão da assinatura do futuro usuário Lite:
select user_id, plan_code, version, provider_subscription
from public.app_subscriptions where user_id='UUID_DO_CONSULTOR';
```

Se não houver assinatura, use versão `0`; se houver, use a versão retornada. Não use a conta de um cliente com cobrança vinculada: a função recusa substituir essa assinatura. Trocas de assinaturas pagas devem passar pelo fluxo comercial existente.

Substitua os UUIDs e a versão antes de executar o bloco inteiro no SQL Editor:

```sql
begin;
select set_config('request.jwt.claim.sub','UUID_DO_ADMIN_JA_AUTORIZADO',true);
select public.app_lite_admin_assign(
  gen_random_uuid(),
  'UUID_DO_CONSULTOR'::uuid,
  0, -- versão atual; 0 somente se não houver assinatura
  now()+interval '30 days',
  'Piloto autorizado do Consultor Lite por 30 dias'
);
commit;
```

Essa função exige administrador já cadastrado, registra auditoria e não gera pagamento. Se ainda não houver administrador autorizado, configure-o pelo procedimento de administração da plataforma já usado nas etapas anteriores. Não use UUID fictício no lugar do administrador.

Ao migrar uma conta existente, conclua primeiro suas pendências de sincronização no modo completo. A mudança de plano preserva registros agrícolas e rascunhos antigos, mas bloqueia seu acesso enquanto a conta for Lite. O Lite não converte vendas antigas do módulo comercial automaticamente.

## 4. Publicar e conferir

Faça seu commit/push e deploy habituais do PWA. Para Android, gere uma nova versão pelo fluxo de release existente. Nenhuma variável de ambiente nova é necessária.

Entre com a conta Lite. Ela deve abrir **Consultor Lite**, com **Resumo, Vendas, Comissões e Conta**, sem botão para produtor. Tentar abrir `/dashboard`, `/properties` ou `/consultor` deve retornar ao Lite. Se o hook do servidor não estiver ativo, o aplicativo informa que a proteção precisa ser ativada e não libera a conta Lite.

Cadastre uma venda de teste de 10 unidades a R$ 200,00, comissão de 5%, em três parcelas. Confira: venda de R$ 2.000,00; comissão total de R$ 100,00; parcelas de comissão de R$ 33,34, R$ 33,33 e R$ 33,33. Registre R$ 10,00 recebidos em uma parcela e confira a redução da previsão e o aumento do recebido no mês da data informada. Depois estorne com motivo e confira a recomposição do saldo.

## 5. Definir preço e disponibilizar contratação

Na administração da plataforma, configure o plano de código **lite** com o preço mensal, demais condições e publicação usando a edição de planos existente. Antes de publicar o preço, confirme o funcionamento da cobrança no Sandbox. A contratação utiliza o fluxo Asaas já instalado; os registros de vendas do consultor não geram boletos/Pix para os produtores.

Não foi adotado um preço neste pacote. A conta piloto usa vigência manual; o preço só será cobrado após configuração comercial e contratação explícita pelo fluxo existente.

## Como o usuário trabalha

- **Vendas:** nome do produtor; data; um ou mais produtos; quantidade com até três casas; unidade livre; preço unitário; forma de pagamento; de 1 a 36 parcelas; comissão percentual (até duas casas) ou valor fixo; observações.
- **Parcelas:** a comissão é dividida entre as parcelas do negócio, com ajuste exato de centavos. A primeira data gera um calendário mensal preservando o dia original quando possível; cada data pode ser ajustada antes de salvar. Esta versão usa divisão igual da comissão entre as parcelas.
- **Resumo:** número e valor das vendas, comissão gerada nas vendas do mês e comissão efetivamente recebida no mês. Vendas canceladas não compõem os indicadores.
- **Comissões:** previsão do saldo pendente por 12 meses a partir do mês selecionado; histórico de recebimentos dos 12 meses até esse mês; saldo em atraso em relação ao dia atual.
- **Recebimento:** manual, inclusive parcial, com data real. Para localizar uma venda antiga, selecione o mês em que ela ocorreu em Vendas. O recebimento aparece no mês em que o consultor recebeu, não no mês da venda.
- **Correções:** venda sem histórico de recebimentos pode ser editada; recebimentos podem ser estornados com motivo. Para cancelar uma venda, estorne antes os recebimentos ativos. Venda com histórico de recebimentos exige cancelamento e nova venda para substituição. Os registros anteriores são preservados.
- **Conta vencida:** consulta do histórico liberada; alterações exigem renovação. Não ganha acesso ao modo produtor por estar vencida.
- **Conexão:** Lite requer internet para consultar e salvar os dados financeiros. Não grava essas vendas na fila offline agrícola. Repetir o envio após falha de rede usa identificador idempotente para evitar duplicação.
- **Ajuda:** a central ganhou o tema Consultor Lite, com instruções de cadastro, parcelas, recebimentos, previsão e estornos.

O pacote não inclui funcionalidades dos planos completos no Lite (produção, estoque, equipe, visitas, IA e satélite). Não cria contas para os produtores nem executa pagamentos de comissão.

## Validação local

```powershell
node --test tests/lite.test.mjs tests/help-brand.test.mjs
npx vue-tsc --noEmit
```

O teste do banco usa PostgreSQL local em memória (PGlite), com contas fictícias e a cadeia de migrations de planos. O teste `tests/browser/lite.cjs` usa Chrome/Playwright e API simulada. A validação real de autenticação e cobrança deve ocorrer no seu Supabase e Sandbox após a aplicação.

Proteção da API segue o mecanismo oficial de [pre-request do Supabase](https://supabase.com/docs/guides/api/securing-your-api). O hook cobre a Data API; as políticas restritivas também bloqueiam acesso direto de contas Lite às tabelas agrícolas e ao Storage. O servidor continua sendo a autoridade sobre o plano; o cache local de modo apenas preserva a navegação quando não há conexão.
