# Rascunhos locais de visitas técnicas

A tela **Mais → Visitas técnicas → Registrar visita** salva automaticamente os campos da anamnese, fotos e legendas em IndexedDB após uma pausa de 400 ms na edição. **Salvar rascunho agora** permite solicitar uma gravação imediata. Aguarde a mensagem **Rascunho salvo neste dispositivo** antes de fechar o aplicativo. Encerrar o processo antes de uma gravação terminar pode perder as últimas alterações; não há garantia de executar código durante encerramento forçado.

Existe um rascunho por conta, backend e armazenamento do aplicativo/navegador. Ao reabrir uma nova visita, a tela oferece **Continuar rascunho** ou **Descartar rascunho**, com confirmação antes de remover campos e fotos. Rascunhos não entram no histórico de visitas, na sincronização ou no compartilhamento técnico. Não substituem a ficha registrada e não são backup na nuvem.

As fotos seguem os limites existentes: cinco por envio, até 8 MB cada, JPG/PNG/WebP. O armazenamento local precisa ter espaço suficiente. As URLs temporárias de prévia não são persistidas: são recriadas a partir dos arquivos recuperados. Limpar o armazenamento do aplicativo/navegador ou desinstalar o aplicativo pode remover os rascunhos. Outra conta não lê nem sobrescreve o rascunho da primeira; voltar à conta original permite recuperá-lo.

Se duas abas abrirem o mesmo rascunho, uma revisão otimista impede que a segunda sobrescreva ou descarte uma versão gravada pela primeira. Um conflito exige reabrir a tela e recuperar a versão persistida; não há mesclagem automática de textos. O rascunho não permite iniciar uma segunda ficha simultânea na mesma conta sem concluir ou descartar a anterior.

Ao **Registrar anamnese**, a validação completa continua sendo aplicada. A operação offline, a ficha e suas fotos são gravadas na mesma transação que remove o rascunho, conferindo sua revisão. Se a transação abortar, o rascunho permanece e não há operação parcialmente enfileirada. A partir daí, o mecanismo de sincronização existente passa a cuidar da ficha registrada. Erros do servidor continuam visíveis no módulo offline e não são resolvidos por editar o rascunho já concluído.

Não há alteração no Supabase ou nas permissões da etapa 34. Esta entrega implementa rascunhos; edição versionada de fichas registradas, vários talhões numa única visita e tarefas com situação continuam como etapas posteriores.

Validação: testes com IndexedDB simulado em `tests/visit-draft.test.mjs`, testes de visitas/compartilhamento/offline, checagem de tipos, build e Chrome com backend simulado. Validar recuperação e disponibilidade de espaço em aparelhos Android reais antes do uso pela equipe.
