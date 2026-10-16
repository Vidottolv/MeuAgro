# Visitas técnicas e anamnese

## Ativação

1. Requer a base agrícola, comercial/gerencial e o offline da etapa 31 já instalados no mesmo Supabase do MeuAgro.
2. Aplicar `supabase/stage_33_technical_visits.sql` no SQL Editor. Cria tabelas privadas, comandos de sincronização e o bucket privado `meu-agro-visit-photos`. Não remove dados anteriores.
3. Atualizar o frontend. No Android, gerar uma nova versão do APK pelo fluxo habitual de build/sync.
4. Abrir **Mais → Visitas técnicas → Registrar visita**. No painel do gerente também existe o atalho **Visitas técnicas da equipe**.
5. Para uso offline, entrar com internet e selecionar **Mais → Configurações → Preparar dados de campo** novamente, depois de instalar a migração. Aguardar a confirmação.

## Ficha

- Data e horário da visita, produtor/pessoa atendida, sítio/propriedade, talhão/setor e cultura/variedade.
- Vínculo opcional com propriedade, talhão, cultura e plantio já cadastrados na conta. Ao selecionar um plantio, seus vínculos são preenchidos em conjunto e validados no banco.
- Para propriedades de clientes não cadastradas na conta do técnico, informar os nomes. Uma conexão comercial não dá acesso aos dados agrícolas privados do produtor.
- Motivo da visita, relato do produtor, sintomas observados, histórico de manejo, tratamentos/aplicações anteriores, condições de solo e irrigação, clima, avaliação técnica, recomendações e pontos para o retorno.
- Prioridade do acompanhamento e data sugerida de retorno. Esta data é informativa; não cria notificações automáticas.
- Até cinco fotos por envio, com legenda, JPG/PNG/WebP de até 8 MB cada. No Android, usar a câmera; no navegador, usar o seletor de arquivos. Mais fotos podem ser acrescentadas depois pelo autor.

Uma ficha cobre um local/talhão/cultura. Para observar vários talhões no mesmo dia, registrar fichas separadas. A ficha fica vinculada ao autor autenticado e preserva o histórico; esta etapa não inclui edição, exclusão, assinatura, exportação PDF nem emissão de receituário. Os campos de avaliação e recomendações são preenchidos pelo responsável técnico, sem diagnóstico ou prescrição automática.

## Acesso e equipe

- Sem empresa selecionada, a ficha é pessoal/independente e somente o autor tem acesso.
- Selecionar uma empresa é uma decisão explícita de compartilhar a ficha e suas fotos com o dono e os gerentes autorizados dessa empresa.
- Outros representantes não leem visitas dos colegas. O produtor atendido não recebe acesso automático; compartilhar com ele exige uma funcionalidade futura específica.
- O gerente usa **Incluir visitas da equipe** para consultar o histórico compartilhado. A consulta exige internet e é validada pelas permissões atuais no servidor.
- Revogar o vínculo com a empresa remove o acesso no servidor às fichas e fotos da empresa, inclusive para seu autor. Fichas pessoais permanecem privadas. Dados já baixados em um dispositivo offline não podem ser apagados remotamente enquanto ele estiver desconectado.
- O nome do responsável é obtido pelo servidor a partir da identidade da conta, sem aceitar autoria arbitrária enviada pelo dispositivo.

## Offline e integridade

A ficha e os bytes das fotos anexadas são persistidos juntos no IndexedDB. A gravação só é confirmada se a transação local for concluída. Ao reconectar com o app aberto, os arquivos são enviados ao bucket privado e a ficha/fotos são confirmadas em uma transação no servidor. O UUID da operação é reutilizado em tentativas posteriores, evitando duplicações após perda da resposta. Fotos adicionais aguardam a sincronização da visita a que pertencem.

Fotos já enviadas são comparadas com os bytes locais em caso de conflito; nenhum arquivo é sobrescrito silenciosamente. Se o vínculo/permissão mudou, o registro fica pendente com erro para análise, sem ser enviado a outra conta ou empresa. Uploads que não chegaram a ser vinculados no banco podem ficar temporariamente como arquivos privados órfãos.

O histórico apresenta as 200 visitas mais recentes carregadas, além dos registros locais ainda não reconciliados. A busca é feita sobre esse conjunto. O preparo offline baixa o histórico do próprio autor e suas fotos, e informa quando o limite de 200 visitas/fotos por consulta impede um preparo completo. Não baixa a carteira inteira de visitas de outros técnicos. A migração precisa estar instalada para o preparo completo da nova versão.

É necessário tocar em **Registrar anamnese** para salvar: não há rascunho automático. Limpar o armazenamento/desinstalar o aplicativo pode apagar dados ainda não enviados. O envio não é garantido com o app encerrado.

## Verificação

O patch entregue não substitui `package.json` nem o arquivo de lock, para preservar as configurações locais. Para adicionar o comando de testes, execute uma vez:

```powershell
npm pkg set "scripts.test:visits=node --test tests/technical-visits.test.mjs tests/offline.test.mjs"
```

- `npm run test:visits`: modelo de anamnese, permissões SQL/PGlite, revogação, storage privado, atomicidade e retomada offline.
- `npm test` e `npm run build`: regressões e compilação.
- `tests/browser/technical-visits.cjs`: teste com backend simulado para preparar dados, preencher uma anamnese com vínculos e foto sem internet, recarregar a ficha offline, reconectar, sincronizar e buscar no histórico. Usa Playwright e aceita `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `VISIT_TEST_DIST` e `VISIT_TEST_SCREENSHOT`; compilar o ambiente de teste com `VITE_SUPABASE_URL=http://127.0.0.1:54321` e `VITE_SUPABASE_PUBLISHABLE_KEY=test-key`. Não publicar essa compilação simulada.

Validar a migração, o upload de fotos e os vínculos com contas reais no seu Supabase antes de publicar. Não foram aplicadas migrações remotas nem publicados commits nesta etapa.
