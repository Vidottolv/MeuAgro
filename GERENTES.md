# Gerentes e representantes

## Ativação

1. Requer a base comercial e a migração `supabase/upgrade_0_25_management.sql` já instaladas no mesmo projeto Supabase do MeuAgro.
2. Execute `supabase/stage_32_company_team.sql` no SQL Editor. A migração adiciona os papéis dos convites e os comandos protegidos da equipe e pode ser reaplicada sem apagar os vínculos existentes.
3. Use o frontend atualizado; para Android, gere um novo APK com o fluxo existente de build e sincronização.
4. Na conta do dono, abra **Mais → Meu espaço de consultor**, ative o perfil profissional se necessário e cadastre a empresa. O dono tem acesso gerencial automaticamente.
5. Abra **Mais → Gerentes e representantes**, selecione a empresa e gere um convite com o papel **Gerente**. O acesso a custos e comissões começa em **Não**.
6. Compartilhe o código com a pessoa. Esta versão não envia e-mail automaticamente.
7. O convidado entra com o e-mail confirmado do convite (Google ou e-mail/senha), ativa o perfil profissional e usa **Meu espaço → Aceitar convite**. Não é criada uma senha coletiva ou outra conta da empresa.
8. O gerente passa a acessar **Mais → Gerentes e representantes** e **Painel e carteira de clientes**. A mesma conta pode ter outros papéis em outras empresas.

## Papéis

| Ação | Dono | Gerente | Representante |
|---|---|---|---|
| Consultar equipe da própria empresa | Sim | Sim | Apenas o vínculo pessoal pelo cadastro existente |
| Convidar e remover representantes | Sim | Sim | Não |
| Convidar, promover, rebaixar ou remover gerente | Sim | Não | Não |
| Autorizar custos e comissões para gerentes | Sim | Não | Não |
| Acompanhar indicadores e redistribuir carteira | Sim | Sim | Somente seu atendimento, como antes |
| Consultar custos e comissões gerenciais | Sim | Somente com autorização explícita do dono | Não |
| Editar cadastro e limites da empresa | Sim | Não | Não |

A permissão financeira trata dos dados gerenciais privados, como custos e comissões. O gerente operacional continua vendo os valores comerciais das propostas e das vendas que acompanha. O produtor mantém seu acesso normal e não recebe acesso à gestão da empresa.

## Vínculos e segurança

- Cada convite vale por sete dias e exige a identidade e o e-mail confirmado do destinatário. Convites anteriores à migração continuam sendo convites de representante.
- A criação de convite não promove ninguém até seu aceite. Uma pessoa já vinculada deve ter seu papel alterado na equipe, sem outro convite.
- O dono pode promover representantes existentes ou rebaixar gerentes. O rebaixamento para representante remove automaticamente o acesso financeiro. As alterações de permissão e encerramentos exigem confirmação e recusam uma tela com papel/permissão já desatualizados.
- Um gerente não altera outros gerentes, não concede acesso a si mesmo e não administra outra empresa. Essas verificações ficam no banco, além da interface.
- Encerrar vínculo preserva o histórico. Se houver clientes na carteira, redistribua-os no painel de gestão; a transferência exige um novo responsável ativo e um motivo, conforme a funcionalidade já existente. Não há transferência automática de clientes ao encerrar vínculo.
- Revogar ou rebaixar um gerente cancela os convites pendentes emitidos por ele, inclusive quando a mudança for feita pela tela de gestão antiga. Promovê-lo novamente não reativa códigos cancelados.
- Os comandos de equipe são identificados por operação para que um reenvio não duplique convites. Os eventos são registrados na auditoria gerencial.
- A gestão de equipe exige internet. A nova tela não altera os registros agrícolas offline nem cria cobranças, planos ou limites de licenças.

## Validação

- `npm run test:management`: regressões gerenciais existentes e novos testes de equipe com PostgreSQL/PGlite, incluindo isolamento entre empresas, e-mail confirmado, idempotência, revogação e permissões financeiras.
- `npm run build`: verificação de tipos e compilação.
- `tests/browser/company-team.cjs`: teste em Chrome/Chromium com Supabase simulado. Compilar com `VITE_SUPABASE_URL=http://127.0.0.1:54321` e `VITE_SUPABASE_PUBLISHABLE_KEY=test-key` em um diretório de teste, e executar com Playwright instalado. Aceita `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `TEAM_TEST_DIST` e `TEAM_TEST_SCREENSHOT` para configurar o ambiente. Não publicar a compilação simulada.

A migração e o aceite com contas reais ainda precisam ser validados no seu Supabase. Não foram enviados convites reais, aplicadas migrações no ambiente remoto ou publicados commits nesta etapa.
