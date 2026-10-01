# Validação visual e funcional com dados simulados

Execute a partir da raiz do projeto. Nenhum teste usa sua conta real: todas as chamadas ao domínio fictício são interceptadas pelo navegador.

Instale a ferramenta opcional em uma pasta independente:

```powershell
npm install --prefix validation --no-save --package-lock=false playwright
```

O roteiro usa o Google Chrome instalado no computador. Em um terminal PowerShell, inicie uma instância de desenvolvimento exclusiva para estes testes:

```powershell
$env:VITE_SUPABASE_URL='https://trade-test.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY='test-key'
$env:VITE_AUTH_GOOGLE_ENABLED='true'
$env:VITE_PUSH_ENABLED='false'
npm run dev -- --host 127.0.0.1 --port 5205 --strictPort
```

Em outro terminal, na raiz do projeto:

```powershell
node validation/browser-v035.mjs
```

Os resultados ficam em `validation/results`. O roteiro verifica 42 rotas, gera 52 capturas em temas claro/escuro e larguras de 320/1000 pixels, e testa fluxos de gravação, falhas, repetição de pedidos, permissões de interface e formulários. `--flows-only` executa apenas os fluxos e as quatro capturas de autenticação.

Feche o terminal de teste ao terminar: as variáveis acima são apenas para esse processo. Para usar sua conta real, abra outro terminal e execute `npm run dev` normalmente com seu `.env`.

A simulação não comprova as políticas reais do Supabase, recebimento de push, retorno do Google nem acesso à câmera nativa. Siga também o guia de homologação em `GUIA_VUE_0.35.0.md`.
