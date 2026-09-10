# Status do Projeto e Handoff

Atualizado em 2026-09-09. Este documento registra o ponto de parada após as Fases 1, 2, 3.1, 3.2 e 3.3. O commit-base remoto é `110c43c` (`docs: add project handoff status`).

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

### Fase 3.2: Performance

- A home usa apenas o manifesto de anos/grupos e um jogador de destaque leve; o JSON completo não bloqueia mais a primeira renderização.
- O dataset de 390 jogadores foi separado em seis chunks anuais, gerados pelo pipeline e carregados com cache em memória.
- O draft primeiro sorteia seus contextos usando o manifesto e carrega somente os anos selecionados. Uma troca de ano busca os demais anos habilitados sob demanda.
- Ao terminar o draft, os anos restantes são pré-carregados em idle para que a criação de adversários não atrase o torneio.
- A rota `/admin` usa import dinâmico e um índice compacto de nomes; código, CSS e dados administrativos não entram no carregamento inicial do jogo.
- Relatórios de partida, detalhes de pesquisa e feedback de campanha também são carregados somente quando aparecem.
- O bundle inicial minificado caiu de 1.108,19 kB (160,64 kB gzip) para 314,85 kB (87,59 kB gzip). O aviso de chunk acima de 500 kB foi eliminado.
- Um E2E dedicado garante que a home não solicite datasets anuais e que um draft determinístico carregue apenas o ano sorteado.

### Fase 3.3: SEO, Acessibilidade e Resiliência

- Metadados públicos completos: title, description, canonical, Open Graph e Twitter Card com URLs absolutas definidas no build.
- Preview social original em [og-draft-lendas.jpg](../public/og-draft-lendas.jpg), `robots.txt` e sitemap gerados pelo Vite.
- A rota pública permanece indexável e `/admin` recebe `noindex, nofollow` tanto no HTML quanto nos headers da Vercel.
- Link para pular ao conteúdo, landmarks, nomes acessíveis de diálogos, foco de teclado previsível, contraste revisado e alvos de toque de pelo menos 44 px no mobile.
- A preferência `prefers-reduced-motion` desativa as animações de cartas.
- Uma fronteira de erro global oferece recarregamento seguro e, no jogo, opção para limpar uma campanha salva incompatível.
- Novos testes E2E cobrem teclado, metadados, redução de movimento, alvos de toque e carregamento progressivo dos dados.
- Após as mudanças de SEO e resiliência, o bundle inicial ficou em 316,66 kB (88,15 kB gzip), ainda sem aviso de chunk acima de 500 kB.

## Estado de Validação

Executados com sucesso neste ponto:

```sh
npm test
npm run typecheck
npm run build
py -3 scripts/data/validate_multi_era.py
npx playwright install chromium
npm run test:e2e
```

Resultados registrados: 59 testes unitários passaram; type check e build passaram; a validação histórica confirmou 390 jogadores, chunks anuais, índices compactos, 1.950 associações, 120 pools elegíveis e 884 assets históricos; 23 execuções E2E passaram no Chromium, cobrindo desktop e mobile, e 1 teste exclusivamente mobile foi corretamente ignorado no projeto desktop.

O Playwright completo devolveu resumo final com sucesso. Antes de um deploy, continue executando `npm run test:e2e` para cobrir os dois viewports.

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

### Próxima Entrega: Fase 4, Cobertura Histórica e Readiness

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
- Não iniciar a Fase 4 sem nova aprovação explícita.
