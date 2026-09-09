# Status do Projeto e Handoff

Atualizado em 2026-09-09. Este documento registra o ponto de parada após as Fases 1, 2 e a subfase 3.1. O commit-base é `76d584c` (`feat: add campaign foundations and admin operations`), publicado em `main` e `origin/main`.

## Objetivo Preservado

O loop central continua intacto: draft de cinco jogadores em TOP → JG → MID → ADC → SUP, pools G1–G5 fixos, BO1/BO3/BO5, Suíço, playoffs, trocas, simulação e força de composição. Não há login para jogadores nem monetização.

## Entregas Concluídas

### Fase 1: Fundação do Produto

- Separação entre região canônica histórica e grupo exibido no draft.
- Manifesto versionado de grupos por ano em [draft-region-groups.json](../src/data/draft-region-groups.json), gerado pelo pipeline em [build_multi_era.py](../scripts/data/build_multi_era.py).
- Grupos determinísticos para Coreia, China, Europa, América do Norte, Outras Regiões e Europa + América do Norte quando necessário.
- Suporte arquitetural para ligas menores, sem escala de rating regional artificial. Os ratings continuam calibrados globalmente por posição.
- Três candidatos válidos por posição/ano/grupo, com preferência por equipes diferentes.
- Cartões de jogador com avatar gráfico original e neutro; fotos e splash art de campeão não são usados como retrato de jogador.
- Save de campanha versionado em armazenamento local: draft, equipe, trocas, série, torneio, resultados e preferências. A home mostra **Continuar campanha** ou **Novo draft**.
- Regra e validação documentadas em [draft-region-grouping.md](draft-region-grouping.md).

Arquivos centrais: [draft.ts](../src/game/draft.ts), [regions.ts](../src/game/regions.ts), [campaign.ts](../src/game/campaign.ts), [App.tsx](../src/App.tsx).

### Fase 2: Admin, Analytics e Configuração

- Rota privada `/admin`, com Supabase Auth e allowlist explícita na tabela `admin_users`.
- Row Level Security e RPCs com `is_admin()`; uma conta autenticada não recebe acesso administrativo por padrão.
- Configuração de produto versionada: trocas iniciais, anos, grupos de draft, analytics, banner de manutenção e versão do dataset.
- Configurações públicas são aceitas pelo jogo apenas quando a versão do dataset coincide e todas as cinco posições ainda possuem pool válido.
- Cada campanha salva o próprio snapshot de regras; alterações administrativas futuras não corrompem draft, trocas ou progresso existentes.
- Analytics anônimo opcional com fila local de até 50 eventos, IDs aleatórios, propriedades allowlisted e falha silenciosa.
- Eventos implementados: início/resumo de sessão e draft, rolls, trocas, seleção, início de Worlds/séries, jogos, playoffs, vitória mundial, fim de campanha, replay, retomada, ajuda e detalhes de rating.
- Feedback opcional no fim da campanha: Bom/Ok/Ruim e nota curta, uma vez por campanha anônima.
- Dashboard agregado: funil, resultados, duração média, trocas, picks/rejeições, anos, grupos, dispositivos e feedback. Visitantes não podem ler eventos ou feedback brutos.
- Modo local de demonstração: `VITE_ADMIN_DEMO_MODE=true` abre `/admin` sem Supabase, usando métricas ilustrativas e descartando todas as mudanças/eventos ao recarregar.

Migrations Supabase, em ordem:

1. [20260909153000_admin_config.sql](../supabase/migrations/20260909153000_admin_config.sql)
2. [20260909160000_analytics_feedback.sql](../supabase/migrations/20260909160000_analytics_feedback.sql)
3. [20260909170000_admin_dashboard.sql](../supabase/migrations/20260909170000_admin_dashboard.sql)
4. [20260909172000_public_config_and_analytics_validation.sql](../supabase/migrations/20260909172000_public_config_and_analytics_validation.sql)

Documentação operacional: [admin-setup.md](admin-setup.md) e [analytics-privacy.md](analytics-privacy.md).

### Fase 3.1: CI/CD e Qualidade

- Node 22 LTS definido em [.nvmrc](../.nvmrc) e `engines` do [package.json](../package.json).
- Script `npm run typecheck` para TypeScript sem bundle.
- Playwright configurado para Chromium gerenciado, sem Edge.
- Workflow [ci.yml](../.github/workflows/ci.yml) executa `npm ci`, type check, unit tests, validação histórica, build e E2E em Chromium para cada push e pull request.
- Artefatos Playwright são publicados pelo job quando a execução falha ou conclui.

## Estado de Validação

Executados com sucesso neste ponto:

```sh
npm test
npm run typecheck
npm run build
py -3 scripts/data/validate_multi_era.py
npx playwright install chromium
npx playwright test tests/admin.spec.ts --project=desktop
```

Resultados registrados: 55 testes unitários passaram; type check e build passaram; a validação histórica confirmou 390 jogadores, 1.950 associações, 120 pools elegíveis e 884 assets históricos; o teste administrativo no Chromium passou.

O Playwright completo foi iniciado durante a implementação e não apresentou falha registrada, mas a saída integrada não devolveu o resumo final de alguns cenários mobile. Antes de um deploy, execute novamente:

```sh
npm run test:e2e
```

O build emite aviso de chunk acima de 500 kB. É esperado com o dataset atual e é o primeiro alvo da próxima subfase de performance.

## Configuração Externa Pendente

O Supabase não foi configurado com credenciais reais durante o desenvolvimento. Para ativar admin, analytics e dashboard fora do modo demo:

1. Crie um projeto Supabase e aplique as quatro migrations na ordem acima.
2. Crie a conta do mantenedor no Supabase Auth.
3. Insira manualmente o UUID dela em `public.admin_users`.
4. Crie `.env.local` a partir de [.env.example](../.env.example) e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Reinicie `npm run dev` e teste `/admin` com uma conta autorizada e uma conta não autorizada.
6. Configure as mesmas variáveis públicas no provedor de deploy. Nunca use a `service_role key` em variáveis `VITE_*`.

O workflow CI foi incluído, mas ainda precisa ser observado no GitHub Actions após push, pois não há token/integração do GitHub disponível localmente.

## Como Retomar

### Próxima Entrega: Fase 3.2, Performance

Começar por [repository.ts](../src/data/repository.ts), [App.tsx](../src/App.tsx) e o manifesto de dados. O objetivo é evitar que o JSON histórico inteiro e todo o código administrativo sejam enviados no primeiro carregamento.

- Criar um manifesto leve de anos/grupos válidos.
- Separar o dataset por ano, ou por ano + grupo regional, carregando apenas o necessário e mantendo cache em memória.
- Prefetch do próximo contexto de draft quando houver valor claro.
- Carregamento inicial prioritário para a experiência acima da dobra; manter lazy loading apenas para arte não crítica.
- Usar code splitting para a rota `/admin` e para superfícies que não pertencem à home/draft.
- Medir bundle, rede e renderização antes/depois. Não alterar regras de rating, draft ou simulação durante essa subfase.

### Depois: Fase 3.3, SEO, Acessibilidade e Resiliência

- Metadados title/description/canonical/OG/Twitter, preview image, favicon, `robots.txt` e sitemap.
- Auditoria de teclado, foco, contraste, alvos de toque e redução de movimento.
- Error boundary e estados seguros de erro de dados/rede; analytics já é fail-safe, mas a aplicação ainda precisa da fronteira de erro visual.

### Fase 4: Cobertura Histórica e Readiness

- Estados de cobertura por ano entre 2011 e 2025: `INCOMPLETE`, `RESEARCHED`, `VALIDATED` e `PRODUCTION_READY`.
- Relatórios por ano, região, posição, assets e confiança, sem alegar completude que ainda não exista.
- Documentação de proveniência, readiness de produção e revisão externa.
- Adicionar o boilerplate de disclaimer vigente da Riot somente após conferir a fonte oficial atual.
- Isolar e documentar as partes específicas de League of Legends sem reescrever o motor para outro jogo.

## Comandos de Trabalho

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run data:multi:validate
npm run build
npx playwright install chromium
npm run test:e2e
```

Em PowerShell com política que bloqueia `npm.ps1`, use `npm.cmd` nos comandos equivalentes. Para demonstração local do painel:

```powershell
$env:VITE_ADMIN_DEMO_MODE = 'true'
npm.cmd run dev
```

## Limites Deliberados

- Não foram adicionados conta, login, perfil ou persistência remota para jogadores.
- O modo demo não autentica, não envia requests e não preserva métricas, feedback ou configurações.
- A fase Suíça é a regra da campanha, não uma tabela histórica completa de todas as equipes.
- Dados remotos de jogadores não foram migrados para Supabase; o jogo continua consumindo o snapshot local pesquisado.
- Não iniciar Fase 3.2, Fase 3.3 ou Fase 4 sem nova aprovação explícita.