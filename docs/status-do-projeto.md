# Status do Projeto e Handoff

Atualizado em 2026-09-13. Este documento registra o ponto de parada após as Fases 1, 2, 3.1–3.13 e a expansão da Fase 4. A branch `main` remota contém checkpoints separados de planos, filtros, Desafio Diário, PWA, arquivo público e histórico local.

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
- Eventos implementados: início/resumo de sessão e draft, rolls, trocas, seleção, início de Worlds/séries, jogos, playoffs, vitória mundial, fim de campanha, replay, retomada, ajuda, detalhes de rating e compartilhamento.
- Feedback opcional no fim da campanha: Bom/Ok/Ruim e nota curta, uma vez por campanha anônima.
- Dashboard agregado: funil, resultados, duração média, trocas, intenção/conclusão de compartilhamento, downloads, picks/rejeições, anos, grupos, dispositivos e feedback. Visitantes não podem ler eventos ou feedback brutos.
- Modo local de demonstração: `VITE_ADMIN_DEMO_MODE=true` abre `/admin` sem Supabase, usando métricas ilustrativas e descartando todas as mudanças/eventos ao recarregar.

Migrations Supabase, em ordem:

1. [20260909153000_admin_config.sql](../supabase/migrations/20260909153000_admin_config.sql)
2. [20260909160000_analytics_feedback.sql](../supabase/migrations/20260909160000_analytics_feedback.sql)
3. [20260909170000_admin_dashboard.sql](../supabase/migrations/20260909170000_admin_dashboard.sql)
4. [20260909172000_public_config_and_analytics_validation.sql](../supabase/migrations/20260909172000_public_config_and_analytics_validation.sql)
5. [20260912110000_campaign_sharing_analytics.sql](../supabase/migrations/20260912110000_campaign_sharing_analytics.sql)
6. [20260912120000_deterministic_challenges.sql](../supabase/migrations/20260912120000_deterministic_challenges.sql)
7. [20260912130000_contextual_rating_feedback.sql](../supabase/migrations/20260912130000_contextual_rating_feedback.sql)
8. [20260913120000_almanac_mode.sql](../supabase/migrations/20260913120000_almanac_mode.sql)
9. [20260913130000_game_plans.sql](../supabase/migrations/20260913130000_game_plans.sql)
10. [20260913140000_daily_challenges.sql](../supabase/migrations/20260913140000_daily_challenges.sql)

Documentação operacional: [admin-setup.md](admin-setup.md) e [analytics-privacy.md](analytics-privacy.md).

### Fase 3.1: CI/CD e Qualidade

- Node 22 LTS definido em [.nvmrc](../.nvmrc) e `engines` do [package.json](../package.json).
- Script `npm run typecheck` para TypeScript sem bundle.
- Playwright configurado para Chromium gerenciado, sem Edge.
- Workflow [ci.yml](../.github/workflows/ci.yml) executa `npm ci`, type check, unit tests, validação histórica, build e E2E em Chromium para cada push e pull request.
- Artefatos Playwright são publicados pelo job quando a execução falha ou conclui.

### Fase 3.2: Performance

- A home usa apenas o manifesto de anos/grupos e um jogador de destaque leve; o JSON completo não bloqueia mais a primeira renderização.
- O dataset foi separado em chunks anuais, gerados pelo pipeline e carregados com cache em memória.
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

### Fase 3.4: Compartilhamento e Confiança no Motor

- A tela final gera um card PNG 1080 × 1350 com resultado, campanha, equipe, anos e chamada para o jogo, sem dados pessoais ou dependência de backend.
- O compartilhamento usa Web Share com arquivo quando suportado, texto/link como alternativa e download com cópia do texto como fallback.
- Antes de cada partida, o jogador vê chance de vitória, força das equipes, rating médio, composição e os bônus ativos que formam o cálculo.
- O painel administrativo agrega intenção e conclusão de compartilhamento e downloads do card; a ingestão aceita apenas resultado e método categorizado.
- Testes unitários cobrem o cálculo da composição, o texto/arquivo compartilhável e a privacidade dos eventos; E2E cobre a prévia responsiva, os controles e o download real do PNG.

### Fase 3.5: Campanhas Determinísticas e Desafios

- Toda campanha recebe uma seed compacta e uma versão explícita do algoritmo. Streams separados por operação tornam draft, trocas, adversários, resultados e relatos independentes do timing da interface.
- O save local passou para v2; saves v1 compatíveis são migrados com uma seed derivada de forma estável em vez de serem descartados.
- O card e o texto final incluem um código curto e um link de desafio com seed, versão do dataset, anos, grupos e trocas. O payload é validado por allowlist antes de ser aceito.
- Quem abre o link escolhe **Aceitar desafio** e recebe as mesmas condições, mantendo livres as escolhas e o resultado pessoal. A interface deixa claro que não se trata de ranking verificado.
- A telemetria mede abertura, início, conclusão e cópia do link sem enviar seed, URL, destinatário ou conteúdo compartilhado. O dashboard mostra a conversão agregada.
- Testes de domínio reproduzem uma campanha completa byte a byte no estado em memória; E2E repete a oferta inicial pelo mesmo link em desktop e mobile e rejeita versões inválidas.

### Fase 3.6: Feedback Contextual de Rating

- Cada slot de evidência G1–G5 oferece **Discorda deste rating?** quando o feedback está habilitado.
- O formulário registra somente jogador/campeão públicos, edição, posição, slot, rating exibido, motivo categorizado e uma nota opcional de até 300 caracteres.
- A nova tabela possui RLS, unicidade por campanha/jogador/slot e RPC anônima com validação estrita; visitantes não conseguem ler as revisões.
- O dashboard administrativo agrega volume e motivos e mostra até dez observações recentes sem expor o identificador anônimo da campanha.
- O E2E exercita abertura, seleção do motivo, envio, confirmação acessível e ausência de seleção acidental do jogador em desktop e mobile.

### Fase 3.7: Modo Almanaque

- A home oferece Clássico, com números visíveis, e Almanaque, com ratings, força, probabilidade e estatísticas ocultos durante a campanha.
- A revelação final permite navegar pelas cinco composições e conferir ratings, sinergia e força após o resultado.
- O modo integra o save v3, links de desafio, texto/card compartilhável e migração compatível de saves e links anteriores para Clássico.
- A telemetria envia somente `classic` ou `almanac`; a migration agrega conclusão e replay por modo no dashboard sem expor campanhas individuais.
- O motor, as probabilidades e a sequência determinística permanecem iguais: o Almanaque altera apenas a informação disponível ao jogador.

### Fase 3.8: Planos de Jogo

- Após fechar o draft, o jogador escolhe Agressão, Teamfight, Controle/Pick ou Escala para toda a campanha.
- A compatibilidade usa somente tags históricas já existentes: todas as tags dão `+1,5`, ao menos uma dá `+0,5` e nenhuma dá a penalidade limitada de `−1,0` na força.
- A interface explica tags, compatibilidade e efeito por composição; o Almanaque preserva a ocultação e inclui o plano na revelação final.
- Save v4, desafio, compartilhamento e telemetria carregam o plano; saves e links anteriores migram sem alterar seus resultados já calculados.
- [A calibração reproduzível](game-plan-balance-v1.md) executou 100 mil campanhas pareadas. As taxas de título por plano ficaram entre 10,35% e 12,53%, e todas as probabilidades respeitaram 8%–92%.

### Fase 3.9: Filtros de Desafio

- A home permite restringir novos drafts por edição e grupo regional, restaurar o catálogo permitido pelo admin e ver quantas combinações permanecem.
- O manifesto contém somente contextos com pelo menos três candidatos em todas as posições; recortes sem interseção elegível são recusados antes do carregamento.
- A disponibilidade filtrada já é o snapshot persistido no save e no link de desafio; o convite lista explicitamente as edições e os grupos recebidos.
- Testes de domínio cobrem 2025 + Outras Regiões e rejeitam 2015 + Outras Regiões; o E2E percorre as cinco posições do recorte válido em desktop e mobile.

### Fase 3.10: Desafio Diário sem Ranking

- A home oferece um desafio diário no modo Almanaque com seed, dataset e regras canônicos; o calendário vira à meia-noite de `America/Sao_Paulo` e se atualiza mesmo com a aba aberta.
- O arquivo expõe os seis dias anteriores como partidas amistosas. A primeira entrada do dia é oficial no armazenamento local; reentradas são amistosas e não substituem o resultado oficial.
- Save v5 preserva identificadores e tipo da tentativa ativa, migrando saves v1–v4. O resultado final identifica claramente uma campanha oficial ou amistosa.
- Eventos `daily_opened`, `daily_started` e `daily_completed` são anônimos e allowlisted. A migration preparada acrescenta os agregados de abertura, oficiais iniciadas/concluídas e amistosas ao dashboard.
- Relógio, storage e gerador de ID são injetáveis nos testes. O E2E verifica a tentativa oficial, a reentrada e o arquivo em desktop e mobile.

### Fase 3.11: PWA e Recuperação Offline

- `manifest.webmanifest` define identidade estável, janela standalone e ícones PNG de 192/512 px rasterizados de forma reproduzível a partir do favicon vetorial aprovado.
- O service worker usa navegação network-first e assets cache-first, limita o cache de runtime e remove versões antigas. A página mostra instalação, estado offline e atualização disponível.
- Um worker novo permanece em espera até a confirmação **Atualizar com segurança**, evitando trocar código sob uma campanha aberta. Vercel e Firebase enviam `sw.js` com `no-cache`.
- `/admin`, endpoints REST/Auth, origens externas e requests com `Authorization` ou `apikey` são network-only e nunca entram no Cache Storage.
- O E2E inicia um draft, desliga a rede, recarrega e retoma as três ofertas salvas em desktop e mobile; também valida manifesto, ícones e exclusões privadas.

### Fase 3.12: Arquivo Público Histórico

- `/arquivo` oferece busca e navegação para 9 edições, 285 jogadores e 157 campeões; URLs usam formatos allowlisted e nomes de jogador normalizados.
- Um índice reproduzível de 55 kB localiza os anos necessários. Ele só entra no chunk lazy do arquivo; a home não carrega esse catálogo nem os datasets anuais.
- Páginas de edição carregam somente o ano escolhido. Jogadores e campeões carregam apenas os anos presentes no índice e exibem pool, rating estimado e link da fonte por slot.
- O sitemap passou a publicar 453 URLs estáveis. Título, descrição, canonical e Open Graph são atualizados por rota, mantendo `/admin` fora do índice.
- A CI rejeita o índice desatualizado. Testes cobrem busca, rotas, metadados, fontes, overflow e requests anuais em desktop/mobile.

### Fase 3.13: Histórico Local e Conquistas

- Cada campanha concluída gera um resumo versionado no armazenamento local, separado do save ativo e limitado às 30 entradas mais recentes.
- O resumo preserva resultado, placar, origem, modo, plano e as cinco escolhas, mas não armazena seed, e-mail, texto livre ou identificador remoto.
- A home mostra as cinco campanhas mais recentes e seis conquistas reproduzíveis, sempre derivadas dos resumos em vez de flags mutáveis.
- O jogador pode exportar um JSON versionado ou apagar todo o histórico após uma confirmação explícita. Falhas e formatos antigos de storage nunca bloqueiam o jogo.
- Testes unitários cobrem deduplicação, limite, conquistas, privacidade, exportação e dados inválidos; E2E cobre visualização, download real e limpeza em desktop/mobile.

### Fase 4: Cobertura Histórica e Readiness

- Inventário determinístico de 2011–2025 em [readiness-2011-2025.json](../data/research/multi-era/readiness-2011-2025.json), com estados `INCOMPLETE`, `RESEARCHED`, `VALIDATED` e `PRODUCTION_READY`.
- Relatório legível por ano, região, posição, assets, métricas ausentes e confiança em [historical-readiness-2011-2025.md](historical-readiness-2011-2025.md).
- 2015, 2017, 2019, 2020, 2021, 2022, 2023, 2024 e 2025 atingem `VALIDATED`; os outros seis anos permanecem `INCOMPLETE` e nenhum ano é promovido automaticamente a `PRODUCTION_READY`.
- A edição de 2024 adiciona 65 versões de jogadores, 325 slots e 76 pares de assets. O recorte é o Main Event no patch 14.18, com 82 partidas; Europa e América do Norte formam um grupo de draft conjunto porque apenas duas equipes da LCS chegaram ao evento principal.
- A edição de 2025 cobre os 16 times do Main Event no patch 15.20: 80 versões, 400 slots e 78 pares de assets. LCP e LTA Sul entram em Outras Regiões; LTA Norte preserva a continuidade norte-americana e se combina com a Europa por ter somente dois times.
- A edição de 2021 cobre 14 times das quatro grandes regiões no patch 11.19: 70 versões, 350 slots e 75 pares de assets. Bean teve somente quatro campeões distintos no Worlds; o quinto slot usa Aphelios em oito jogos pela Fnatic Rising no EU Masters Summer, com time e evento preservados na evidência.
- Aprovações externas são registros manuais em [external-reviews.json](../data/research/multi-era/external-reviews.json) e exigem revisor, data e evidência.
- O aviso vigente da Riot foi conferido na General Policy oficial, registrado no inventário e exibido no rodapé público. Isso não representa aconselhamento jurídico nem aprovação da Riot.
- As partes específicas de League of Legends e os limites reais de reutilização do motor estão em [game-domain-boundaries.md](game-domain-boundaries.md).
- A CI passa a rejeitar inventário ou relatório de readiness desatualizados.
- Após a integração de 2021 e das entregas de produto da Fase 3.4–3.13, o bundle inicial ficou em 385,62 kB (103,77 kB gzip). O arquivo ficou isolado em 31,48 kB (7,94 kB gzip), sem aviso de chunk acima de 500 kB.

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

Resultados registrados: 87 testes unitários passaram; type check e build passaram; a validação histórica confirmou 605 jogadores, chunks anuais, índices compactos, 3.025 associações, 175 pools elegíveis, 1.342 assets históricos e 9 crosschecks de evento; o índice público cobre 9 edições, 285 jogadores, 157 campeões e 453 URLs de sitemap; 60 arquivos multi-era e os 9 arquivos congelados de 2017 foram reproduzidos byte a byte; a calibração de planos executou 100 mil campanhas; o inventário de readiness 2011–2025 está reproduzível; 45 execuções E2E passaram no Chromium, cobrindo desktop e mobile, e 1 teste exclusivamente mobile foi corretamente ignorado no projeto desktop. O bundle inicial deste pacote ficou em 385,62 kB (103,77 kB gzip), sem aviso de chunk acima de 500 kB.

O Playwright completo devolveu resumo final com sucesso. Antes de um deploy, continue executando `npm run test:e2e` para cobrir os dois viewports.

## Configuração Externa Pendente

O Supabase não foi configurado com credenciais reais durante o desenvolvimento. Para ativar admin, analytics e dashboard fora do modo demo:

1. Crie um projeto Supabase e aplique as dez migrations na ordem acima.
2. Crie a conta do mantenedor no Supabase Auth.
3. Insira manualmente o UUID dela em `public.admin_users`.
4. Crie `.env.local` a partir de [.env.example](../.env.example) e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Reinicie `npm run dev` e teste `/admin` com uma conta autorizada e uma conta não autorizada.
6. Configure as mesmas variáveis públicas no provedor de deploy. Nunca use a `service_role key` em variáveis `VITE_*`.

O workflow CI foi incluído, mas ainda precisa ser observado no GitHub Actions após push, pois não há token/integração do GitHub disponível localmente.

## Como Retomar

Fila de produto aprovada: [Análise comparativa 7a0 × Draft Lendas e plano de execução](analise-7a0-e-roadmap-produto.md). A trilha **Compartilhar e Desafiar** deve avançar em paralelo ao backfill histórico, sem relaxar os gates de dados abaixo.

### Próxima Entrega: Fase 4, Backfill Histórico

- Priorizar 2018 como próximo pacote completo de matches, rosters, evidências, normalização, cobertura e assets, sem ativá-lo no draft antes de todos os gates passarem.
- Recalibrar toda a população ao adicionar uma edição e versionar o dataset; não misturar ratings produzidos por populações diferentes.
- Submeter os nove anos atualmente `VALIDATED` a uma revisão externa independente e registrar as evidências sem autoaprovação.

### Próxima Entrega de Produto: Perfil Opcional 4.1 (aguardando Supabase)

- As entregas de produto previstas que funcionam integralmente sem backend, até o Histórico Local 3.4, estão concluídas.
- A próxima fase cria perfil opcional por magic link e sincronização do histórico; ela exige Auth, RLS, recuperação e exclusão de dados no Supabase real.
- Não iniciar ranking verificado ou multiplayer antes de validar a demanda pelos desafios e definir a validação autoritativa dos resultados no servidor.

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
- Não marcar um ano como `PRODUCTION_READY` nem habilitar um ano novo no draft sem todos os gates e a revisão exigida.
