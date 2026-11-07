# MeuAgro PWA para iPhone

## Entrega de 04/11/2026

O MeuAgro agora tem manifesto de instalação, ícones 192/512, ícone Apple 180, instruções de instalação, área de status em **Mais → Configurações → MeuAgro na tela inicial**, abertura offline e aviso de atualização. Android nativo continua disponível.

Nos navegadores que oferecem a instalação por botão, a interface pode abrir o convite após o toque do usuário. No iPhone, a orientação é abrir o endereço no Safari, usar **Compartilhar → Adicionar à Tela de Início** e, se aparecer, manter **Abrir como App da Web** ativado.

Fotos de safra e visitas têm o botão Tirar foto também na versão web, usando o seletor de câmera do navegador. O aparelho pode oferecer outras opções e precisa autorizar o acesso. A validação existente continua aceitando JPG, PNG e WebP de até 8 MB; HEIC não convertido não ganhou suporte nesta etapa.

## Aplicar o patch no seu projeto

Coloque `meuagro-pwa-iphone.patch` na raiz de `C:\src\MeuAgro`, que já deve conter as entregas anteriores, incluindo a base Android/iOS.

```powershell
cd C:\src\MeuAgro
git apply --check meuagro-pwa-iphone.patch
git apply meuagro-pwa-iphone.patch
npm install
npm run test:pwa
```

Não há dependências novas ou migração SQL nesta entrega. Os arquivos `.png` do patch são assets versionáveis: não são arquivos temporários de build. `git apply` deve aplicar também esses arquivos binários.

Não reaplique um patch já instalado. Se `--check` falhar, preserve suas alterações e envie a mensagem: não use `--reject` ou substitua o projeto inteiro por tentativa.

## O que funciona sem conexão

1. O primeiro acesso e a entrada na conta precisam de internet.
2. No iPhone, instale e abra **pelo ícone**, entre na conta e use **Mais → Configurações → Preparar dados de campo**.
3. Espere o preparo terminar. A abertura da interface pronta não significa que os dados da propriedade foram baixados.
4. Depois, use as consultas de campo preparadas e o fluxo offline existente de eventos, fotos e anamneses. Novos registros ficam pendentes no dispositivo.
5. Reabra/mantenha o MeuAgro aberto com internet para sincronizar e confira o resultado.

Cadastros/edições/exclusões que já exigiam conexão, IA, novas imagens de satélite, estoque, pedidos e financeiro continuam dependentes de internet. Imagens externas do mapa não são baixadas pelo cache da interface.

Safari e aplicativo instalado podem usar sessões/armazenamentos separados. Não suponha que as pendências do Safari aparecerão no ícone instalado. Sincronize no mesmo acesso em que os registros foram criados.

Nenhum navegador oferece garantia absoluta contra limpeza de dados, falta de espaço, remoção do aplicativo ou perda do aparelho. A solicitação de armazenamento persistente é uma proteção adicional, sujeita à decisão do navegador. Não é backup. Preserve cópias de recuperação e sincronize assim que possível.

## Atualizações sem recarga forçada

O service worker baixa uma nova versão, mas não chama `skipWaiting`, não recarrega formulários e não apaga IndexedDB. Enquanto houver janelas usando a versão antiga, a nova fica aguardando.

Quando o aviso aparecer:

1. Salve o que estiver editando e confira rascunhos/pendências.
2. Feche todas as abas e janelas do MeuAgro, incluindo a janela instalada. Apenas mandar o aplicativo para segundo plano pode não fechar a janela no iPhone.
3. Abra novamente. O sistema ativa a versão disponível quando os clientes antigos forem liberados.
4. Se o aviso persistir, confira outras abas abertas e aguarde a liberação do navegador. **Não desinstale e não limpe os dados para forçar a atualização.**

O cache guarda somente HTML, JS, CSS, manifesto e ícones públicos da interface. Requisições ao Supabase, fotos privadas, respostas de API e URLs de callback com códigos não são gravadas nele. Os dados de campo continuam no mecanismo offline existente, separado por conta.

## Preparar o endereço HTTPS

Hoje seu acesso é localhost. Isso serve para desenvolvimento no computador, mas não é um endereço de distribuição. `localhost` no iPhone aponta para o próprio iPhone; um endereço HTTP da rede local também não substitui a origem HTTPS necessária.

Escolha uma hospedagem de frontend estático. Incluímos um `netlify.toml` pronto como opção para Netlify, com:

- build `npm run pwa:build` e publicação de `dist`;
- fallback de rotas para `index.html`, incluindo callbacks;
- atualização do `sw.js` sem cache HTTP persistente;
- tipo correto do manifesto;
- cache longo apenas para assets com nomes gerados por hash.

O arquivo só configura essa hospedagem. Não cria conta, não publica nada e não contrata plano. Se preferir outro provedor, reproduza essas regras nele. O PWA deve ser publicado na raiz do domínio/origem; subpastas não foram implementadas.

### Roteiro de publicação com Git e Netlify

1. Confira o patch localmente e envie sua versão revisada ao seu repositório pelo fluxo normal de Git. Não envie `.env.production.local` nem segredos.
2. Entre na Netlify, escolha **Add new project → Import an existing project** e conecte o repositório/branch corretos.
3. Defina/confirme um nome disponível para o projeto. Confira no painel qual será a URL HTTPS, por exemplo `https://NOME-CONFIRMADO.netlify.app`. Use o endereço real, não o exemplo.
4. Se o `package.json` está na raiz, deixe a base do projeto nessa raiz; comando de build `npm run pwa:build`; pasta publicada `dist`. Se o repositório contém uma pasta externa a mais, selecione a pasta que contém o `package.json`.
5. Adicione as variáveis públicas da seção seguinte nas configurações de build do projeto. Não importe um arquivo de segredos do servidor.
6. Inicie/reexecute o deploy. Se um primeiro build ocorreu antes de configurar o endereço, ele pode falhar na pré-conferência: corrija as variáveis e faça um novo deploy.
7. Confirme que a URL abre em HTTPS. Complete a configuração de login e das origens do Supabase antes do piloto.
8. Confira limites e condições da hospedagem escolhida. Nenhum custo fixo de hospedagem foi assumido ou contratado por esta implementação.

Evite trocar de domínio depois de começar o uso offline: o armazenamento é vinculado à origem. Sincronize pendências antes de migrar usuários para um novo endereço.

## Variáveis de build

Use `.env.pwa.example` como modelo. Para compilar no seu computador, copie-o para `.env.production.local`; se já existir esse arquivo com configurações válidas, edite-o preservando as outras opções públicas necessárias. Na hospedagem, preencha as variáveis no painel.

```dotenv
VITE_APP_URL=https://SEU-ENDERECO-PUBLICADO
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA-CHAVE-PUBLICA
MEU_AGRO_EXPECTED_SUPABASE_HOST=SEU-PROJETO.supabase.co
VITE_AUTH_GOOGLE_ENABLED=false
```

Substitua os exemplos por valores reais. `MEU_AGRO_EXPECTED_SUPABASE_HOST` contém só o domínio do projeto, sem protocolo ou barras. `VITE_AUTH_GOOGLE_ENABLED` só deve ser `true` se o Google já estiver configurado no Supabase. Preserve as demais flags públicas já utilizadas pelo aplicativo.

OpenAI, Asaas, segredo Copernicus, chave `service_role` e qualquer chave privada continuam somente no servidor. Toda variável `VITE_` é incorporada ao aplicativo e pode ser lida pelo usuário.

Depois de preencher:

```powershell
npm run pwa:check
npm run pwa:build
```

`pwa:check` valida origem HTTPS, host confirmado e uso de chave pública. `pwa:build` também executa o typecheck e gera `dist/`. Não publica automaticamente.

Para testar o build no computador:

```powershell
npm run preview
```

Abra o localhost informado no seu computador. O localhost é considerado um contexto confiável para testes de service worker em navegadores de desktop; isso não transforma o endereço em uma publicação para o iPhone. Não trate acesso via IP HTTP na rede como teste completo de instalação.

## Configurar o Supabase para o novo endereço

### Autenticação

No painel Supabase, em **Authentication → URL Configuration**:

1. Use a origem HTTPS definitiva como **Site URL**, conforme a configuração do seu projeto.
2. Adicione às **Redirect URLs**:

```text
https://SEU-ENDERECO-PUBLICADO/auth/callback
https://SEU-ENDERECO-PUBLICADO/auth/recovery
```

3. Preserve os retornos Android `meuagro://auth/callback` e `meuagro://auth/recovery` se ainda usa o app nativo.
4. O callback do provedor Google continua sendo o HTTPS do Supabase. Não o substitua pelos caminhos acima no Google Cloud por tentativa.
5. Teste confirmação de cadastro, recuperação e login Google na origem definitiva. Inicie e conclua a tentativa no mesmo acesso/aparelho. O fluxo existente continua usando PKCE e não transfere tokens entre Safari e app por URL.

O retorno de Google no PWA instalado precisa de teste físico: o iOS pode abrir janelas externas e isolar armazenamento. Se houver falha, registre o comportamento e use e-mail/senha para o piloto enquanto o fluxo é revisado. Não copie tokens manualmente entre janelas.

Não use o login Google em um domínio de preview diferente do `VITE_APP_URL` definitivo esperando que a sessão apareça no outro endereço.

### Origens das funções

As funções existentes têm listas de origens autorizadas. Acrescente sua origem exata, como `https://NOME-CONFIRMADO.netlify.app`, às variáveis de servidor abaixo, preservando os endereços de desenvolvimento/nativos que ainda utiliza:

- `AI_ALLOWED_ORIGINS`: apoio de IA nas visitas.
- `SATELLITE_ALLOWED_ORIGINS`: consulta de imagens de satélite.
- `APP_ALLOWED_ORIGINS`: funções de cobrança/clima que já usam essa lista.

São listas separadas por vírgula, sem caminhos ou barra final. Não use `*` para contornar erros. Se já houver outras origens configuradas, acrescente a nova em vez de substituir a lista inteira. Essas variáveis são segredos/configurações do Supabase, não variáveis `VITE_` da hospedagem.

Se a tela publicada funcionar mas IA/satélite/cobrança retornarem “Origem não autorizada” ou erro de CORS, confira essas listas. Não é necessário recriar as chaves dos provedores por causa do PWA.

## Roteiro no iPhone

1. Abra o endereço HTTPS definitivo no Safari, fora do navegador interno do WhatsApp/Instagram.
2. Toque em Compartilhar e em Adicionar à Tela de Início. Mantenha Abrir como App da Web quando essa opção aparecer e confirme Adicionar.
3. Abra pelo ícone e entre com uma conta de teste. Pode ser necessário entrar novamente em relação ao Safari.
4. Confira a interface em tela estreita, o teclado e os botões inferiores.
5. Faça uma foto de safra e uma foto de visita, salve e reabra. Teste biblioteca, cancelamento e permissão negada. Se uma imagem HEIC for recusada, use JPG/PNG/WebP; o suporte a HEIC não foi incluído.
6. Prepare os dados de campo com conexão e espere a confirmação.
7. Ative modo avião, reabra pelo ícone e confira dados preparados. Crie um registro de teste e confira a indicação de pendência.
8. Reconecte e mantenha aberto até confirmar o envio sem duplicar.
9. Confira IA, satélite, comércio e financeiro com internet e autorização da conta. Consultas externas podem consumir sua franquia; use somente os testes necessários.
10. Em outra publicação de teste, confira o aviso de atualização. Salve e feche todas as janelas; abra novamente. Confira as pendências antes e depois.

Registre modelo do iPhone, versão do iOS, acesso pelo Safari ou pelo ícone, comportamento e mensagem de erro. Capturas ajudam, mas não envie senhas, tokens ou chaves.

## Limites desta etapa

- Não implementa push web, inscrições VAPID, lembretes em segundo plano ou integração de notificações nativas com Safari. A central interna de avisos continua disponível.
- Não promete execução/sincronização com o app fechado.
- Não torna APIs externas ou operações financeiras disponíveis offline.
- Exportação/compartilhamento de arquivos continua usando o fluxo web atual e precisa de homologação no Safari; não foi adicionada API nativa de arquivos.
- Os recursos e arquivos de iOS nativo anteriores foram preservados, mas não são necessários para distribuir este PWA. Não houve uso de Xcode, TestFlight ou publicação na App Store nesta etapa.

## Verificação feita antes da entrega

- 100 testes passaram: PWA, offline, autenticação, OAuth, rascunhos, compatibilidade mobile e política de release Android.
- Typecheck e build web passaram.
- Teste real de service worker no Chrome local: manifesto, instruções em viewport móvel, abertura após recarga offline, atualização aguardando duas abas, formulário preservado, ativação após fechar as abas e IndexedDB/foto de teste preservados.
- As APIs do teste em navegador foram simuladas. Nenhuma consulta real de IA, satélite ou pagamento foi executada.
- Instruções em viewport de iPhone foram testadas por emulação. Instalação pelo Safari, câmera física e login Google no PWA precisam de homologação em iPhone real.
- O domínio HTTPS ainda precisa ser criado/publicado por você. Não foi feito deploy nem contratação de hospedagem.

## Referências

- [Apple: adicionar um site como aplicativo no iPhone](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)
- [WebKit: apps da tela inicial e manifesto](https://webkit.org/blog/13878/)
- [Ciclo de atualização do service worker](https://web.dev/articles/service-worker-lifecycle)
- [Netlify: importar um projeto existente](https://docs.netlify.com/manage/projects/add-new-project/)
- [Netlify: variáveis de ambiente](https://docs.netlify.com/build/environment-variables/get-started/)
- [Netlify: configuração por arquivo](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
