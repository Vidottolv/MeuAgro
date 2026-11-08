# Ícone do broto e central de ajuda

## Entrega de 08/11/2026

O desenho branco antigo foi substituído pelo broto colorido em fundo verde, seguindo a identidade da tela de entrada. O emoji da tela também foi substituído por uma imagem fixa: agora a aparência não depende do conjunto de emojis do Windows, Android ou iPhone.

A referência editável é `native/assets/meu-agro-brand.svg`. Os arquivos PNG são versões de distribuição e devem ser versionados junto com ela. Não é necessário instalar uma nova biblioteca para aplicar o patch ou compilar.

## O que foi padronizado

- Marca na tela de entrada, cadastro e recuperação de senha.
- Favicon e ícone de instalação do PWA em 192 e 512 pixels.
- Ícone Apple de 180 pixels.
- Ícone `maskable` com margem de segurança para os recortes do sistema.
- Recursos Android de launcher em cinco densidades, foreground adaptativo, splash e símbolo monocromático de notificação.

O conteúdo essencial do broto fica dentro da área central segura. O sistema operacional ainda decide se a moldura instalada será circular, quadrada ou arredondada.

Os arquivos em `native/android/res` são a fonte usada pelo comando Android já existente. Não é necessário editar as cópias geradas em `android/app/src/main/res` manualmente. As alterações Android só chegam a um aplicativo instalado depois de sincronizar, compilar e instalar outro pacote; publicar o site não atualiza o APK.

## Como acessar a ajuda

- Antes de entrar: **Como usar o MeuAgro**, na tela de entrada, abre `/help`.
- Depois de entrar: botão **?** no topo das telas internas que usam a estrutura principal.
- Menu **Mais → Conta e suporte → Central de ajuda**, em `/more/help`.
- Um tópico pode ser compartilhado por link, por exemplo `/help?topic=ndvi`.

A ajuda contém **73 tópicos em 10 temas**, com busca que ignora acentos, instruções por etapas, pontos de atenção, indicação de conexão e link para a funcionalidade. No desktop há navegação lateral; no celular há um seletor de tema para evitar uma lista longa antes do conteúdo. Os textos de cada tópico ficam recolhidos até o usuário abri-los; a lista tem carregamento visual em blocos de 12 tópicos.

Temas:

1. Começar e acessar: cadastro, confirmação, Google, senha, navegação, painel e perfil.
2. Propriedades e plantios: propriedades, talhões, safras, culturas, plantios e arquivamento.
3. Safra: eventos, fotos, consumo, previsão, colheita, vendas, orçamento e conferência agrícola.
4. Visitas, tarefas e IA: anamnese, rascunhos, modelos, observações, fotos, retornos, tarefas, IA, relatórios e compartilhamento técnico.
5. Mapas e satélite: desenho, coordenadas, propostas, franquias, cenas, NDVI, RGB, comparação e vínculo com visita.
6. Barracão: insumos, lotes, movimentações, reposição e importação CSV.
7. Comercial: compras, perfil profissional, empresa, catálogo, propostas, pedidos, conversas, entregas, equipe, carteira, notas, descontos, resultados e contatos.
8. Financeiro e clima: custos, despesas, rateio, recebimentos, caixa, previsão e chuva observada.
9. Dispositivo: PWA, preparo offline, pendências, recuperação, atualizações, notificações, aparência e armazenamento.
10. Conta: plano, contratação, pagamentos, renovação, cancelamento, permissões, privacidade, suporte e administração autorizada.

O manual descreve as funções implementadas; a disponibilidade depende de versão, perfil, plano, configuração e permissões. Ele não concede acesso a funções restritas. Preços não foram fixados no texto, para não contradizer a proposta/assinatura válida do usuário.

A ajuda é conteúdo estático do aplicativo, não uma consulta de IA. Não envia a busca ao servidor nem consome tokens. Ela entra no pacote offline da interface e pode ser lida depois que a abertura offline tiver sido preparada. Os links para operações online continuam exigindo conexão e autorização.

O manual é mantido em `src/modules/help/helpContent.js`; alterações futuras das funcionalidades devem ser acompanhadas pela revisão do texto. Um teste verifica a cobertura dos atalhos do menu Mais.

## Aplicar no seu projeto

Copie `meuagro-icone-e-ajuda.patch` para a raiz do seu projeto atualizado, que já deve conter a entrega PWA anterior.

```powershell
cd C:\src\MeuAgro
git apply --check meuagro-icone-e-ajuda.patch
git apply meuagro-icone-e-ajuda.patch
node --test tests/help-brand.test.mjs
npm run typecheck
```

Não há nova dependência, SQL ou segredo de servidor nesta entrega. Os PNGs do patch são arquivos binários legítimos de identidade visual: eles devem subir ao Git. Preserve as alterações já existentes e não reaplique um patch instalado.

## Publicar e receber a atualização

1. Revise e envie as alterações ao seu repositório pelo fluxo habitual.
2. Publique o conjunto em um único deploy de produção na Netlify, evitando gastar créditos em vários deploys pequenos.
3. No aplicativo aberto, salve as edições e confira as pendências; aguarde o aviso de nova versão.
4. Feche todas as janelas/abas do MeuAgro e abra novamente para receber a versão nova.
5. Confira o broto na tela de entrada e abra a central de ajuda.

Ícones instalados podem permanecer em cache do sistema por mais tempo do que as páginas. Isso varia entre Android, Safari e navegadores desktop. Não há promessa de atualização imediata do ícone de uma instalação existente.

**Não remova o app nem limpe os dados se houver pendências ou rascunhos.** Primeiro sincronize e confira a confirmação no servidor; salve/recupere o rascunho e use a cópia de recuperação se necessário. Somente depois, se o ícone antigo persistir, considere remover o atalho/PWA e adicioná-lo novamente. Dados no Safari e no PWA instalado podem estar separados.

Para Android nativo, use `npm run android:sync` e o procedimento de build/assinatura já utilizado. Para uma nova versão distribuída, revise o `versionCode` conforme o fluxo de release. Nenhuma chave de assinatura foi alterada.

## Validação

- 100 testes passaram: ajuda/identidade, PWA, autenticação, OAuth, offline, rascunhos e release Android.
- Typecheck Vue/TypeScript e build web passaram.
- Recursos Android compilaram com AAPT2. Isso valida os recursos, mas não substitui compilação de APK e teste físico.
- Teste de navegador local: tela de entrada com a nova marca, ajuda sem login e autenticada, busca, paginação, tópico direto por URL e leitura offline. Foram conferidas larguras de 320, 390 e 1280 pixels.
- APIs do teste foram simuladas. Nenhuma consulta real de IA, satélite ou pagamento foi feita.
- O patch é conferido em cópia da base e em cópia dos arquivos do projeto local. Não altera automaticamente `C:\src\MeuAgro`, não faz commit e não publica o site.

Depois da publicação, confira também o ícone em um iPhone real e no Android utilizado pelos usuários.
