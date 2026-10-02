# Runbook de Preparação e Ativação Operacional

Atualizado em 2026-10-02.

Este runbook registra a preparação reproduzível e a ativação autorizada do Supabase em 2026-09-30. A hospedagem HTTPS do frontend continua pendente.

## Estado atual

### Preparado no repositório

- Supabase CLI fixado na versão do projeto e configuração local sem secrets em `supabase/config.toml`.
- Analytics começa desativado na configuração inicial e só deve ser habilitado após o smoke administrativo e a conferência da política de privacidade.
- Vinte e uma migrations ordenadas, com gate estático para inventário, RLS, `search_path` de funções `SECURITY DEFINER` e grants explícitos.
- Replay integral das dezessete migrations e lint SQL executados em banco local limpo na CI; o smoke da sala por convite confere autorização e entregas ocultas.
- Em 2026-09-30, replay das vinte migrations, lint e smokes SQL de catálogo e salas passaram no banco local. As três migrations de 2026-09-21 foram recuperadas do histórico remoto existente; corrigem dashboard, catálogo inicial e grant de leitura administrativa sob RLS.
- Smoke local aprovado para configuração pública, cinco tabelas sob RLS, bloqueio anônimo dos RPCs administrativos, autenticação, allowlist, leitura protegida e dashboard agregado.
- Preflight de produção que recusa HTTP, domínio de exemplo, ambiente incompleto, modo demo e chave administrativa em variável `VITE_*`.
- Builds da Vercel protegidos por `npm run deploy:build`; Firebase usa o mesmo comando antes do deploy manual.
- Headers equivalentes nos dois provedores e cache imutável restrito a JS, CSS e fontes com hash. Retratos, silhuetas e demais imagens de URL estável continuam revalidáveis.
- Smoke HTTPS para rotas, canonical, sitemap, PWA, headers e cache.
- Smoke Supabase sem gravação válida para configuração pública, isolamento RLS e validações negativas; autenticação, allowlist e dashboard podem ser incluídos com credenciais temporárias de operador.
- O smoke remoto exige a mesma versão de catálogo do frontend e confere acesso anônimo às oito tabelas públicas. Uma configuração antiga personalizada exige revisão explícita antes da ativação.
- Workflow manual `Production smoke`, protegido pelo environment `production` do GitHub.

### Ativação remota em 2026-09-30

- Projeto indicado pelo responsável: `LOLDraftLendas` (`qiduotxlyyilpirvxgvm`). CLI autenticada e projeto vinculado. O banco já continha dezoito migrations, uma conta e um administrador autorizado.
- Recuperadas as três migrations de 2026-09-21 ausentes no checkout a partir dos statements registrados no remoto. Aplicadas somente as duas migrations de salas de 2026-09-29, totalizando vinte versões e 785 candidatos.
- As portas PostgreSQL 5432/6543 não estavam acessíveis nesta máquina; `db push --dry-run` não concluiu. A aplicação usou `supabase db query` pela Management API HTTPS em uma transação com conferência do histórico anterior, locks e registro das versões, nomes e statements canônicos em `supabase_migrations.schema_migrations`. O mesmo lote foi ensaiado no banco local antes da aplicação. Não houve reset remoto nem reaplicação das dezoito versões existentes.
- Habilitado somente `auth.enable_anonymous_sign_ins=true`; o limite `auth.rate_limit.anonymous_users=30` foi mantido. O diff posterior confirmou zero alterações declaradas pendentes. As demais configurações de Auth foram preservadas.
- `.env.local`, ignorado pelo Git, contém URL e chave pública publishable reais, `VITE_SITE_URL=http://localhost:5173` e `VITE_ONLINE_DUEL_ENABLED=true`. A flag pública de exemplo continua desligada até o aceite da hospedagem e dos aparelhos físicos.
- Smoke HTTP remoto aprovado: configuração no dataset `multi-era-v1.6.0`, acesso anônimo bloqueado às oito tabelas, RPCs administrativos protegidos e rejeição de payloads inválidos de analytics e feedback. O smoke SQL de isolamento de salas passou em transação revertida.
- Partida real em dois contextos Chromium independentes, desktop e emulação iPhone 13: convite, retomada do draft, picks ocultos, resultado idêntico de cinco jogos (3 × 2) e recarga. Uma terceira sessão real teve leitura/entrada na sala e acesso administrativo negados; as três tabelas de duelo recusaram leitura direta autenticada. Sem erros de página ou overflow.
- Os três usuários anônimos de teste e sua sala foram removidos com lista explícita de UUIDs e guardas contra contas administrativas ou participantes externos. Conferência final: vinte migrations, oito tabelas com RLS, 785 candidatos, zero salas, uma conta e um administrador. A configuração existente foi preservada, inclusive `analytics_enabled=true`.

### Chat privado ativado em 2026-09-30

- A migration `20260930150000_room_chat_broadcast.sql` foi aplicada por HTTPS com conferência das vinte versões anteriores e registro transacional da versão 21. Acrescenta a função de autorização e duas políticas em `realtime.messages`; não cria tabela ou histórico de mensagens.
- Replay limpo das 21 migrations, lint e os três smokes SQL (catálogo, salas e chat) passaram localmente. O smoke SQL de chat também passou no remoto. Passaram 113 unitários e 18 E2E de convite/chat em desktop/mobile; após ajustar reconexão e descarte ao restaurar a página pelo navegador, os quatro E2E de chat passaram novamente. Build e auditoria passaram.
- Duas sessões Chromium reais trocaram mensagens; entrada tardia e recarga não recuperaram histórico. Silenciamento privado e reversível, falsificação de remetente negada, terceira identidade recusada e encerramento após cancelamento foram verificados. Sete identidades dos testes foram removidas com guardas; usuários/salas fora dessa lista foram preservados. A consulta final encontrou zero mensagens `duel-chat:*` persistidas e duas políticas de chat, mantendo o administrador original.

### Ainda não executado

- Validar login administrativo por senha e o funil com uma campanha real; o smoke remoto não recebeu credenciais do administrador existente.
- Revisar cadastro público por e-mail e definir Site URL/redirects após escolher a hospedagem. CAPTCHA exige integrar o desafio no cliente antes de ligá-lo no Auth.
- Escolher Vercel ou Firebase, cadastrar o ambiente do frontend, publicar em HTTPS e executar o smoke público.
- Testar dois aparelhos físicos, configurar alertas e agendar retenção de salas/usuários anônimos. A emulação mobile não substitui os aparelhos.

## 1. Validar a preparação local

Use Node 22 e Docker Desktop ativo:

```sh
npm ci
npm run ops:preflight
npx supabase start
npx supabase db reset --local
npm run ops:db:lint
npx supabase stop
```

`db reset --local` é destrutivo apenas para o banco local do Supabase. Nunca use `db reset --linked` em produção.

## 2. Criar e migrar o Supabase

Crie primeiro um projeto de staging vazio. Não altere o schema remoto pelo Dashboard: mantenha o histórico exclusivamente nas migrations versionadas, conforme o [fluxo oficial de migrations](https://supabase.com/docs/guides/deployment/database-migrations).

```sh
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Em um projeto vazio, o `--dry-run` deve listar as 21 migrations descritas em [admin-setup.md](admin-setup.md). Em um projeto existente, confira primeiro o histórico remoto e aplique apenas as pendentes. Uma única pessoa deve executar o push por vez. O projeto ativado em 2026-09-30 já contém todas as 21 versões.

No Supabase Auth:

1. defina a Site URL HTTPS do domínio escolhido;
2. crie manualmente a conta mantenedora com senha exclusiva;
3. desative o cadastro público por e-mail; habilite sessões anônimas somente ao ativar a sala por convite e testar as regras de acesso descritas em [duelo-online-convite.md](duelo-online-convite.md);
4. copie a UUID da conta e execute somente a inserção de allowlist documentada em [admin-setup.md](admin-setup.md).

Mantenha `analytics_enabled=false` durante os primeiros smokes. Habilite-o no painel somente depois de confirmar RLS, ingestão, dashboard e o texto público de privacidade.

## 3. Configurar o ambiente do frontend

Crie `.env.production.local`, que já está ignorado pelo Git, a partir de `.env.example`:

```dotenv
VITE_SITE_URL=https://dominio-real.example
VITE_SUPABASE_URL=https://projeto-real.supabase.co
VITE_SUPABASE_ANON_KEY=chave-publishable-ou-anon
VITE_ONLINE_DUEL_ENABLED=false
```

Apesar do nome histórico da variável, prefira a chave pública `sb_publishable_...` exibida em **Connect** no Supabase. O cliente usa essa chave em `apikey`; o header `Authorization` recebe o JWT da sessão administrativa ou da sessão anônima do jogador. Só altere `VITE_ONLINE_DUEL_ENABLED` para `true` no build publicado após habilitar Auth anônima e validar a sala em dois aparelhos no staging.

Não defina `VITE_ADMIN_DEMO_MODE` em staging ou produção. Nunca use `service_role`, `sb_secret_*`, senha, token pessoal ou credencial administrativa em uma variável `VITE_*`.

Valide o arquivo e produza o build:

```sh
node --env-file=.env.production.local scripts/validate-operations-config.mjs --require-env
node --env-file=.env.production.local scripts/smoke-supabase.mjs
node --env-file=.env.production.local --run deploy:build
```

Na Vercel, cadastre as duas variáveis públicas do Supabase em Production. A URL do site pode vir das variáveis de sistema da Vercel no primeiro deploy; depois de escolhida a URL estável, `VITE_SITE_URL` pode defini-la explicitamente. Mantenha `VITE_ONLINE_DUEL_ENABLED=false` até o aceite da sala. O `vercel.json` executa automaticamente `npm run deploy:build`. No Firebase, as três variáveis são necessárias: execute `node --env-file=.env.production.local --run deploy:build` e só então `firebase deploy --only hosting`.

### Primeira publicação do KingOfRift na Vercel

1. Entre na Vercel com a conta GitHub que administra `andrensaraiva/loldraftlendas` e importe esse repositório. Use o preset **Vite**, diretório raiz `.` e a branch `main`. O `vercel.json` já define `npm run deploy:build`, `dist`, rotas SPA e headers.
2. Antes de concluir o primeiro deploy, configure em **Production** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave **publishable** do projeto Supabase existente. Defina `VITE_ONLINE_DUEL_ENABLED=false` para a primeira publicação; não defina `VITE_ADMIN_DEMO_MODE`.
3. Em **Settings → Environment Variables**, mantenha **Automatically expose System Environment Variables** ligado. Enquanto não houver domínio personalizado, o build usa `VERCEL_PROJECT_PRODUCTION_URL` (ou `VITE_VERCEL_PROJECT_PRODUCTION_URL`) para canonical, sitemap e metadados. Depois de conhecer a URL estável, você pode definir `VITE_SITE_URL=https://<dominio-da-vercel>` e fazer novo deploy.
4. No Supabase Auth, defina **Site URL** com a URL HTTPS estável e adicione redirects exatos necessários para o fluxo administrativo. Não use a URL temporária de um commit como Site URL. Execute os smokes da seção 5 contra a URL publicada antes de divulgar a beta.

A [documentação da Vercel](https://vercel.com/docs/git) descreve a importação pelo GitHub e a [exposição das variáveis de sistema](https://vercel.com/docs/environment-variables/system-environment-variables). A [documentação do Supabase](https://supabase.com/docs/guides/auth/redirect-urls) explica Site URL e redirects.

## 4. Validar a conta administrativa

Forneça `OPS_ADMIN_EMAIL` e `OPS_ADMIN_PASSWORD` apenas como variáveis temporárias de sessão ou secrets protegidos, nunca em arquivo versionado:

```sh
node --env-file=.env.production.local scripts/smoke-supabase.mjs --require-admin
```

Esse smoke autentica, confirma `is_admin()`, lê uma única configuração sob RLS e abre o dashboard agregado. Os testes de analytics e feedback usam apenas payloads inválidos e, portanto, não gravam registros válidos.

## 5. Publicar e conferir

Depois do deploy HTTPS:

```sh
npm run smoke:deploy -- https://dominio-real.example
```

O smoke reprova canonical/sitemap apontando para outro domínio, ausência de headers, `/admin` indexável, service worker sem revalidação ou assets de build sem cache imutável.

No GitHub, crie o environment protegido `production`, cadastre `PRODUCTION_SUPABASE_URL` e `PRODUCTION_SUPABASE_ANON_KEY` e execute manualmente o workflow **Production smoke**, informando a origem HTTPS.

## 6. Checklist de ativação

- [x] Replay, lint e smoke da sala por convite com dezessete migrations concluídos no banco local da CI.
- [x] Replay das vinte migrations, lint, catálogo inicial e isolamento das salas validados localmente em 2026-09-30; workflow atualizado para incluir o smoke de catálogo.
- [x] Histórico remoto conferido e duas migrations pendentes aplicadas por HTTPS com registro transacional; vinte versões sincronizadas.
- [x] Conta mantenedora existente e allowlist preservadas.
- [ ] Cadastro público por e-mail revisado e URLs de Auth ajustadas à hospedagem.
- [x] RLS das oito tabelas públicas conferida no remoto; as três tabelas de duelo negam leitura direta inclusive a jogadores autenticados.
- [x] Configuração pública, analytics e feedback inválido respondendo pelo RPC esperado.
- [x] Auth anônima habilitada com limite 30; partida real com duas sessões e isolamento contra uma terceira aprovados.
- [ ] Login administrativo, `is_admin()`, configuração e dashboard aprovados.
- [ ] Build protegido aprovado com as três variáveis reais.
- [ ] Deploy HTTPS e smoke público aprovados.
- [ ] Primeira campanha de teste aparece no funil agregado sem expor evento bruto.
- [ ] Alertas de disponibilidade e erros configurados no provedor escolhido.
- [ ] Antes de publicar convites, testar dois aparelhos físicos e agendar a remoção de salas vencidas há mais de 30 dias.

## 7. Monitoramento e rollback

Após cada deploy, execute os dois smokes e registre o link da execução no checklist operacional. Nas primeiras 24 horas, confira disponibilidade, erros 4xx/5xx, falhas de Auth/RPC e os totais agregados de início/conclusão do funil.

Se o frontend falhar, reverta para o último deploy aprovado. Se uma migration falhar, não edite uma migration já aplicada nem use reset remoto: interrompa a ativação, registre o erro e crie uma migration corretiva. Se analytics apresentar anomalia, desligue `analytics_enabled` na configuração administrativa sem interromper o jogo.
