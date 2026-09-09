# Meu Agro — Etapa 2

Base inicial do frontend do Meu Agro usando HTML, CSS, JavaScript, Vite e Supabase.

## Pré-requisitos

- Node.js instalado
- Projeto criado no Supabase
- SQL da Etapa 1 já executado no Supabase

## 1. Instalar dependências

No terminal, dentro da pasta do projeto:

```bash
npm install
```

## 2. Criar o arquivo de ambiente

Copie:

```text
.env.example
```

para:

```text
.env
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_AQUI
```

No Supabase, esses valores podem ser obtidos no painel **Connect** ou em
**Settings > API Keys**.

Nunca use Secret Key ou `service_role` no frontend.

## 3. Executar a verificação SQL

Abra o SQL Editor do Supabase e execute:

```text
supabase/verify_stage_2.sql
```

Esse arquivo apenas consulta a configuração. Ele não altera nem remove dados.

## 4. Iniciar o aplicativo

```bash
npm run dev
```

Abra no navegador o endereço informado pelo Vite, normalmente:

```text
http://localhost:5173
```

A tela inicial deverá mostrar:

```text
Conectado
```

Se aparecer erro, verifique primeiro o `.env` e confirme se o SQL da Etapa 1
foi executado no projeto correto.

## 5. Build de produção

```bash
npm run build
```

O resultado será criado em:

```text
dist/
```

Essa pasta será utilizada mais adiante pelo Capacitor para gerar o aplicativo
Android.

## Estrutura criada nesta etapa

```text
meu-agro/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── supabase/
│   └── verify_stage_2.sql
└── src/
    ├── components/
    │   └── toast.js
    ├── css/
    │   ├── components.css
    │   ├── global.css
    │   ├── reset.css
    │   └── variables.css
    ├── js/
    │   ├── app.js
    │   ├── router.js
    │   └── supabase.js
    └── services/
        └── supabaseHealthService.js
```

## Próxima etapa

Etapa 3: Supabase Authentication.

Serão implementados:

- cadastro com nome, e-mail e senha;
- login;
- logout;
- recuperação de senha;
- permanência da sessão;
- proteção de rotas;
- edição inicial do perfil.
