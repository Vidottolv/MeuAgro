# Uso offline — primeira etapa

## Ativação

1. No SQL Editor do projeto Supabase já usado pelo MeuAgro, executar `supabase/stage_31_offline_field.sql`. Não criar outro banco. Aplicar depois das migrações de produção, eventos e fotos já existentes.
2. Compilar e publicar o frontend atualizado na raiz de um domínio HTTPS. A abertura offline no navegador é preparada pelo service worker de produção; `npm run dev` não instala esse worker. Para testar localmente, usar build e preview em localhost.
3. Para Android, gerar uma nova versão com o fluxo de build/sync Capacitor existente. Os arquivos do aplicativo já estão no pacote Android; os dados continuam no IndexedDB do WebView. Não editar as cópias antigas de `android/src`.
4. Entrar com internet, abrir **Mais → Configurações → Uso offline e sincronização**, selecionar **Preparar dados de campo** e aguardar a confirmação.

Não foi executada migração nem publicação no ambiente real durante o desenvolvimento desta mudança.

## O que funciona

- Reabrir o aplicativo web em rotas internas sem rede depois da instalação completa do service worker; no Android, usar o novo pacote do aplicativo.
- Consultar propriedades, áreas/talhões, culturas e plantios baixados; consultar a linha do tempo e a galeria preparadas.
- Registrar novos eventos de campo e fotos nos plantios existentes, inclusive foto com evento fotográfico automático.
- Preservar a fila e as fotos após recarregar a página ou fechar e reabrir o app.
- Enviar automaticamente ao recuperar conexão, voltar ao app ou entrar novamente na conta; também há envio manual em Configurações. O app precisa estar aberto e o sistema operacional precisa permitir sua execução. Não se promete envio com o app encerrado.
- Mostrar pendências, falhas de envio e o último preparo concluído. O retorno da conexão não recarrega formulários em edição.

O primeiro login, novos cadastros de propriedades/plantios, edição e exclusão de eventos existentes, estoque, pedidos, relatórios online e administração continuam dependendo de internet. Preparar os dados novamente é necessário para incluir registros criados em outros dispositivos. Filtros de plantios ativos operam sobre a lista preparada; arquivos/plantios arquivados não integram o pacote de campo.

O preparo usa as mesmas consultas das telas. Uma lista com 1.000 ou mais itens interrompe o preparo com aviso, pois a paginação completa de grandes carteiras fica para uma próxima etapa. Não se marca um download parcial ou com falta de espaço como concluído. O preparo pode consumir dados móveis, principalmente com fotos.

## Persistência e sincronização

- IndexedDB separado por backend, com chaves por usuário. Uma transação grava a operação, os registros visíveis e os bytes da foto juntos. Falha de espaço não é tratada como gravação bem-sucedida.
- Apenas consultas GET/HEAD das tabelas agrícolas autorizadas são armazenadas. Não há cache de autenticação, comandos RPC, informações comerciais ou credenciais no service worker. Um retrato local mínimo do usuário, sem duplicar tokens, permite navegar offline com sessão de rede vencida. Ele não autoriza nenhuma gravação no servidor.
- Cada operação tem UUID estável; `sync_field_operation` autentica o usuário, valida a propriedade do plantio e os vínculos da foto e grava um recibo na mesma transação que os registros. Repetir o envio após perder a resposta não duplica eventos ou fotos. Os recibos não devem ser removidos sem definir uma política de retenção compatível com o tempo máximo offline.
- Upload de foto usa caminho exclusivo e reutiliza os mesmos bytes ao reenviar. Um conflito de arquivo só é aceito depois de comparar o conteúdo. Foto sem confirmação no banco continua na fila; ela pode ficar temporariamente no Storage até que a operação seja corrigida e reenviada.
- Eventos precedem fotos que dependem deles. A primeira falha interrompe a fila para preservar dependências; o painel explica o erro. Um plantio excluído/arquivado ou sem permissão não é recriado automaticamente. Os dados locais são mantidos para análise.
- Registros locais confirmados cobrem a última linha do tempo baixada até a próxima leitura bem-sucedida do servidor. A retomada não sobrescreve registros existentes de outros dispositivos, pois esta etapa cria novos registros e exige conexão para edições.
- O cache local contém dados agrícolas e deve ser usado em dispositivo confiável. A saída explícita é impedida enquanto houver pendências. Sair por outra aba ou perder a autenticação não apaga a fila; entre novamente na conta original. Limpar dados do navegador, desinstalar o app ou perder o dispositivo pode apagar dados ainda não enviados. O armazenamento local não substitui backup do servidor.

## Validação

- `npm run test:offline`: IndexedDB, atomicidade local, isolamento por conta, retomada, dependências, cache, falha de espaço/conexão e validação SQL com PGlite.
- `npm test`: suíte existente e testes offline.
- `npm run build`: TypeScript/Vue e build de produção.
- Teste automatizado em Chrome com backend simulado: preparar, desligar rede, reabrir rota interna, registrar evento e foto, recarregar galeria, vencer sessão de rede, reconectar e confirmar envio sem duplicatas.

O roteiro de navegador está em `tests/browser/offline.cjs` e usa Playwright e Chrome/Chromium. Compilar uma versão de teste com `VITE_SUPABASE_URL=http://127.0.0.1:54321` e `VITE_SUPABASE_PUBLISHABLE_KEY=test-key` (backend interceptado e simulado pelo roteiro). Executar `node tests/browser/offline.cjs`. As variáveis opcionais `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `OFFLINE_TEST_DIST` e `OFFLINE_TEST_SCREENSHOT` permitem usar instalações locais do navegador e do Playwright e diretórios de teste separados. Não publicar essa compilação de teste.

O teste de navegador não substitui a validação contra as políticas e migrações do projeto Supabase real nem um teste em Android físico. Acesso de gerente e visitas técnicas são etapas seguintes; o projeto já contém base de gestão empresarial, que deve ser aproveitada.
