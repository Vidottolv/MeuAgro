# Acompanhamento de visitas técnicas

Sobre a etapa 33, esta entrega acrescenta relatório de anamnese com fotos, impressão pelo navegador, CSV filtrado, filtro por retorno e exportação individual de retorno em ICS. Não altera o banco nem amplia permissões.

Na ficha, aguarde carregar as fotos e clique em **Visualizar relatório**. No navegador, use **Imprimir / salvar PDF**. No aplicativo Android, a visualização está disponível; impressão nativa ainda não foi integrada. Fotos indisponíveis offline são indicadas no documento. O relatório inclui dados pendentes de sincronização com identificação explícita; não tem assinatura digital e não é receituário agronômico.

Na lista, combine busca, prioridade e retorno. **Próximos sete dias** conta de amanhã até o sétimo dia, inclusive. Datas anteriores não significam tarefas atrasadas: esta etapa não controla conclusão. Filtros e CSV usam apenas as 200 visitas mais recentes carregadas e os registros locais pendentes. CSV usa UTF-8, separador ponto e vírgula e proteção de células interpretáveis como fórmulas.

Na ficha com retorno, exporte um ICS e importe no calendário escolhido. É um evento de dia inteiro, sem alarme, contendo produtor, local e motivo. Não inclui a anamnese completa nem as fotos. Alterações futuras no MeuAgro não atualizam o calendário. O identificador é estável; o comportamento ao importar novamente depende do aplicativo de calendário. CSV e ICS devem ser baixados pela versão no navegador se o WebView Android não disponibilizar o download.

As exportações são arquivos locais com dados da visita. Somente exporte e compartilhe com os destinatários desejados; o aplicativo não publica links nem envia os arquivos automaticamente.

Validação: `npm run test:visits`, `npm run typecheck`, `npm run build`; teste de navegador em `tests/browser/technical-visits.cjs` usando backend simulado. Validar impressão e importação nos dispositivos e calendários utilizados pela equipe antes de uso geral.
