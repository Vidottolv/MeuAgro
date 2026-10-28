# Mapas e preparação do adicional de satélite — etapa 35

## Implementado

Em **Mais → Mapas e satélite**, o dono seleciona a propriedade e delimita o sítio ou um talhão já cadastrado. Pode marcar vértices no mapa, informar coordenadas, importar um GeoJSON simples ou salvar um único ponto de referência. O ponto não habilita monitoramento. O contorno do sítio aparece em cinza como referência ao desenhar talhões.

Entrada manual: um vértice por linha, `latitude;longitude` em graus decimais ou `leste;norte` em metros para UTM. Há opções WGS84, coordenadas geográficas SIRGAS2000 e UTM WGS84/SIRGAS2000, com fuso e hemisfério obrigatórios para UTM. A conversão usa Proj4; a geometria operacional é armazenada como longitude/latitude WGS84, com identificação da referência de entrada. A aproximação operacional entre referenciais não inclui transformação por época ou grades oficiais. Não substitui um levantamento georreferenciado certificado, nem valida a autenticidade de documentos de origem.

Importação: Point ou Polygon GeoJSON WGS84, Feature ou FeatureCollection de uma única geometria, até 100 KB. Não aceita CRS legado, furos, MultiPolygon, KML, Shapefile ou coordenadas em graus/minutos/segundos. Polígonos usam de 3 a 200 vértices, com fechamento explícito no arquivo. A entrada manual fecha o contorno automaticamente. O banco valida números, limites geográficos, repetição de vértices, auto-interseção e área degenerada. Limites operacionais: latitude entre -85 e 85, amplitude de até 5 graus por eixo e até um milhão de hectares. Não verifica automaticamente sobreposição entre talhões ou encaixe no perímetro do sítio. A área calculada é aproximada e não altera a área declarada nos cadastros existentes.

Consultores com vínculo ativo da etapa 34 podem consultar contornos aprovados e enviar propostas. Apenas o dono aprova ou rejeita. A aprovação verifica novamente o vínculo, a disponibilidade do talhão e a revisão de base. Uma proposta baseada numa revisão anterior não substitui silenciosamente um contorno mais novo. O histórico guarda autor, origem, referência, geometria, datas, decisão e responsável. A tela mostra até 50 versões por alvo e até mil talhões ativos por propriedade. Não há edição dos cadastros agrícolas por essa permissão.

O módulo exige internet. RPCs não entram no cache offline. Ao perder conexão ou ocultar a página, o conteúdo é removido; desenhos não enviados não são recuperados como rascunhos. A permissão do consultor é revalidada a cada 30 segundos sem sobrescrever o desenho em edição. Falha nessa revalidação oculta os dados; novas leituras e propostas são bloqueadas pelo servidor após revogação. Dados já exportados por usuários não podem ser recolhidos.

## Franquias e consumo

As tabelas do adicional suportam habilitação administrativa, limite de talhões simultâneos, hectares por talhão, requisições mensais e PUs mensais por conta do produtor. Existe também limite global da plataforma. A conta não pode ativar o próprio plano ou modificar seus limites. Empresas com franquia compartilhada entre contas e checkout são etapas posteriores.

Um produtor com franquia administrativamente habilitada pode selecionar ou retirar talhões do pacote. Seleção exige polígono aprovado e área dentro do limite. Não gera imagem nem cobrança. Redesenhar um talhão não restaura franquia mensal. As reservas conferem a revisão atual e o tamanho do contorno, arquivamento e propriedade, a seleção e os limites vigentes.

`satellite_reserve` só pode ser executada por `service_role`, nunca por chave pública ou JWT de usuário. Reserva requisições e PUs numa transação, para o cliente e para a plataforma. UUIDs de operação evitam dupla reserva; reutilizar o mesmo UUID com outro conteúdo é recusado. Falha em qualquer limite desfaz toda a reserva. Contadores usam o mês UTC. São reservas conservadoras, não medição faturada pelo provedor, e não há estorno automático de tentativas com resultado incerto.

O worker de processamento ainda precisa ser implementado. Deverá estimar um teto seguro de PUs, reservar antes de qualquer chamada, persistir resultado e execução para impedir chamadas duplicadas, reutilizar imagens por contorno/revisão/data/camada/resolução, registrar consumo real e respeitar disponibilidade/nuvens. A idempotência da reserva, sozinha, não torna uma chamada ao provedor idempotente. Não armazenar segredo do provedor no frontend ou em variável VITE.

O limite global vem **desativado** e sem cota. Não há pacote gratuito permanente publicado, preços, cobrança automática, credenciais de satélite, chamada ao Sentinel Hub, NDVI, arquivo de imagem, agenda semanal ou SLA implementados nesta entrega. A frequência e retenção precisam ser definidas ao conectar o provedor. O piloto é necessário para precificar custo por talhão. A interface identifica o módulo como preparação.

## Mapa-base e implantação

O mapa usa Leaflet com OpenStreetMap como referência cartográfica; não é uma imagem de satélite. Exibe atribuição e não baixa áreas para uso offline nem faz prefetch em lote. Os tiles são carregados diretamente pelo navegador conforme a visualização, sem cache próprio do aplicativo. Para escala de produção, escolher um fornecedor de mapa-base adequado ao volume e às condições de uso. Referências: [Leaflet](https://leafletjs.com/examples/quick-start/), [política de tiles OSM](https://operations.osmfoundation.org/policies/tiles/), [Proj4](https://proj4js.org/).

Aplicar a migração 35 após a 34 e instalar as dependências do package-lock. A migração não requer PostGIS. Há testes de geometria, SQL/permissões/franquias em PGlite e fluxo visual em Chrome com respostas simuladas. Validar em Supabase remoto e Android físico, incluindo localização, importação de arquivo, touch e troca de conexão, antes de liberar para a equipe.
