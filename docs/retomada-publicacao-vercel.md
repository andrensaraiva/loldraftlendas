# Retomada da publicação do KingOfRift na Vercel

Atualizado em 2026-10-02. Este é o ponto de retomada da primeira publicação HTTPS. O [runbook operacional](operations-runbook.md) contém os procedimentos completos de Supabase, smoke e monitoramento.

## Estado confirmado

- O nome público **KingOfRift** já está no site, nos metadados, no PWA e no compartilhamento. As mudanças estão na branch `main` do repositório `andrensaraiva/loldraftlendas` (commits `dc10ea5` e `806b280`). A [CI desse checkpoint](https://github.com/andrensaraiva/loldraftlendas/actions/runs/37011737584) passou.
- A Vercel CLI está autenticada como `andrensaraiva-8132`. Este checkout está vinculado ao projeto Vercel `king-of-rift` (`prj_QZLuqZ6GpyWHL1UcqZBf77LwmhZe`), integrado ao GitHub. O projeto usa Vite, raiz `.`, saída `dist` e Node 22.x. O `vercel.json` exige `npm run deploy:build`.
- Em **Production**, `VITE_SUPABASE_URL` aponta para `https://qiduotxlyyilpirvxgvm.supabase.co` e `VITE_ONLINE_DUEL_ENABLED` está em `false` para a primeira publicação. **Falta `VITE_SUPABASE_ANON_KEY`.** Os dois deploys de produção vistos em 2026-10-02 falharam no preflight quando ambas as variáveis do Supabase ainda faltavam; a URL foi cadastrada depois. Ainda não há deploy HTTPS aprovado nem smoke pós-deploy. Novos pushes também falharão até a chave ser configurada.
- O projeto Supabase `qiduotxlyyilpirvxgvm` já recebeu as 21 migrations. Auth anônima, isolamento de sala e chat foram validados em 2026-09-30. Nesta retomada, a CLI do Supabase está sem login; login administrativo e teste em aparelhos físicos continuam pendentes.
- `.vercel/project.json` e `.env.local` são arquivos locais ignorados pelo Git. Após o vínculo da Vercel CLI, o `.env.local` deste checkout contém somente `VERCEL_OIDC_TOKEN`; a configuração pública local anterior do Supabase não está presente. Recrie as variáveis `VITE_*` antes de testar a sala localmente. Não imprima nem versione o token OIDC.

## Próxima ação para publicar

1. No Dashboard do Supabase, abra o projeto `qiduotxlyyilpirvxgvm` e copie a chave **Publishable** (`sb_publishable_...`) em **Connect** ou **Settings → API Keys**. É uma chave pública de cliente. Nunca use `sb_secret_...`, `service_role` ou token pessoal em uma variável `VITE_*`.
2. Na Vercel, abra `king-of-rift` → **Settings → Environment Variables** e adicione `VITE_SUPABASE_ANON_KEY` com essa chave para **Production**. Também é possível usar `npx.cmd --yes vercel@62.1.0 env add VITE_SUPABASE_ANON_KEY production` e inserir o valor no prompt, sem gravá-lo no Git ou no histórico do shell.
3. Confira os nomes das variáveis com `npx.cmd --yes vercel@62.1.0 env ls production`. Depois, em **Deployments**, escolha o deploy de produção mais recente e use **Redeploy**. Mudanças em variáveis de ambiente só entram em um novo deploy. A URL única de um deploy não é o domínio estável do projeto; identifique esse domínio após o primeiro deploy bem-sucedido.
4. Execute `npm.cmd run smoke:deploy -- https://<dominio-estavel>` e registre a URL e o resultado. O smoke confere rotas, canonical, sitemap, PWA, headers e cache. Se falhar, corrija antes de divulgar a beta.

A chave pública ainda não foi fornecida neste checkpoint. Não faça um build com chave fictícia para contornar o preflight.

## Depois do primeiro deploy aprovado

1. No Supabase Auth, defina **Site URL** como o domínio HTTPS estável publicado e confira os redirects necessários ao login administrativo. Revise o cadastro público por e-mail.
2. Valide login, `is_admin()`, configuração e dashboard com a conta administrativa existente; confira uma campanha real no funil. Use as instruções de smoke no [runbook](operations-runbook.md), sem registrar senha em arquivo versionado.
3. Teste a sala por convite e o chat em dois aparelhos físicos; só então considere `VITE_ONLINE_DUEL_ENABLED=true` em Production e faça outro deploy.
4. Configure monitoramento de disponibilidade/erros e retenção de salas vencidas e sessões anônimas. Complete o [checklist da beta](beta-readiness.md) antes de divulgar o endereço.

Referências: [chaves do Supabase](https://supabase.com/docs/guides/getting-started/api-keys), [variáveis da Vercel](https://vercel.com/docs/environment-variables) e [redirects do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).
