# Runbook de Preparação e Ativação Operacional

Atualizado em 2026-09-28.

Este runbook separa explicitamente o que já está preparado no repositório do que depende de contas, credenciais e uma autorização posterior. Nenhum projeto remoto, usuário, secret ou deploy é criado pelos passos de preparação local.

## Estado atual

### Preparado no repositório

- Supabase CLI fixado na versão do projeto e configuração local sem secrets em `supabase/config.toml`.
- Analytics começa desativado na configuração inicial e só deve ser habilitado após o smoke administrativo e a conferência da política de privacidade.
- Quinze migrations ordenadas, com gate estático para inventário, RLS, `search_path` de funções `SECURITY DEFINER` e grants explícitos.
- Replay integral das quinze migrations anteriores e lint SQL executados em banco local limpo. Duas migrations de duelo online foram acrescentadas e entram nos mesmos gates de CI antes da ativação remota.
- Smoke local aprovado para configuração pública, cinco tabelas sob RLS, bloqueio anônimo dos RPCs administrativos, autenticação, allowlist, leitura protegida e dashboard agregado.
- Preflight de produção que recusa HTTP, domínio de exemplo, ambiente incompleto, modo demo e chave administrativa em variável `VITE_*`.
- Builds da Vercel protegidos por `npm run deploy:build`; Firebase usa o mesmo comando antes do deploy manual.
- Headers equivalentes nos dois provedores e cache imutável restrito a JS, CSS e fontes com hash. Retratos, silhuetas e demais imagens de URL estável continuam revalidáveis.
- Smoke HTTPS para rotas, canonical, sitemap, PWA, headers e cache.
- Smoke Supabase sem gravação válida para configuração pública, isolamento RLS e validações negativas; autenticação, allowlist e dashboard podem ser incluídos com credenciais temporárias de operador.
- Workflow manual `Production smoke`, protegido pelo environment `production` do GitHub.

### Ainda não executado

- Criar projetos Supabase de staging/produção e escolher Vercel ou Firebase.
- Reaplicar as migrations no projeto remoto vazio.
- Criar a conta administrativa, desativar cadastro público por e-mail e inserir sua UUID na allowlist. Sessões anônimas de jogadores só devem ser habilitadas quando a sala por convite estiver pronta, com limite de taxa e CAPTCHA.
- Cadastrar variáveis e secrets reais nos provedores.
- Publicar, executar os smokes remotos e configurar alertas externos.

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

O `--dry-run` deve listar exatamente as dezessete migrations descritas em [admin-setup.md](admin-setup.md) na primeira ativação. Uma única pessoa deve executar o push por vez.

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
```

Apesar do nome histórico da variável, prefira a chave pública `sb_publishable_...` exibida em **Connect** no Supabase. O cliente envia essa chave apenas em `apikey`; o header `Authorization` fica reservado ao JWT da sessão administrativa.

Não defina `VITE_ADMIN_DEMO_MODE` em staging ou produção. Nunca use `service_role`, `sb_secret_*`, senha, token pessoal ou credencial administrativa em uma variável `VITE_*`.

Valide o arquivo e produza o build:

```sh
node --env-file=.env.production.local scripts/validate-operations-config.mjs --require-env
node --env-file=.env.production.local scripts/smoke-supabase.mjs
node --env-file=.env.production.local --run deploy:build
```

Na Vercel, cadastre as três variáveis no environment de produção; o `vercel.json` executa automaticamente `npm run deploy:build`. No Firebase, execute `node --env-file=.env.production.local --run deploy:build` e só então `firebase deploy --only hosting`.

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

- [x] Replay local das quinze migrations, lint e smoke administrativo concluídos com Docker.
- [ ] Replay, lint e smoke da sala por convite após acrescentar as duas migrations de 2026-09-29.
- [ ] `db push --dry-run`, `db push` e `migration list` conferidos no staging.
- [ ] Cadastro público desativado; conta mantenedora única criada e allowlisted.
- [ ] Leitura anônima das oito tabelas públicas bloqueada por RLS; as três tabelas de duelo também negam leitura direta a usuários autenticados.
- [ ] Configuração pública, analytics e feedback inválido respondendo pelo RPC esperado.
- [ ] Login administrativo, `is_admin()`, configuração e dashboard aprovados.
- [ ] Build protegido aprovado com as três variáveis reais.
- [ ] Deploy HTTPS e smoke público aprovados.
- [ ] Primeira campanha de teste aparece no funil agregado sem expor evento bruto.
- [ ] Alertas de disponibilidade e erros configurados no provedor escolhido.
- [ ] Ao ativar convites online, limitar sessões anônimas, testar três identidades e agendar a remoção de salas vencidas há mais de 30 dias.

## 7. Monitoramento e rollback

Após cada deploy, execute os dois smokes e registre o link da execução no checklist operacional. Nas primeiras 24 horas, confira disponibilidade, erros 4xx/5xx, falhas de Auth/RPC e os totais agregados de início/conclusão do funil.

Se o frontend falhar, reverta para o último deploy aprovado. Se uma migration falhar, não edite uma migration já aplicada nem use reset remoto: interrompa a ativação, registre o erro e crie uma migration corretiva. Se analytics apresentar anomalia, desligue `analytics_enabled` na configuração administrativa sem interromper o jogo.
