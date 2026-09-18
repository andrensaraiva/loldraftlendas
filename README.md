# Draft Lendas

Protótipo jogável em português inspirado na referência visual: fundo claro, tipografia editorial, verde lima e cartas de jogadores com pools visíveis. React + TypeScript + Vite, sem conta e sem backend.

Pesquisa e implementação atual: **[Multi-era v1.6: dados, UX e 100.000 campanhas](docs/multi-era-balance-v1.md)**.

Calibração dos quatro planos de jogo: **[Planos de Jogo — Calibração v1](docs/game-plan-balance-v1.md)**.

Cobertura honesta de 2011–2025: **[inventário de readiness histórico](docs/historical-readiness-2011-2025.md)**. 2014–2025 estão validados; os três anos anteriores continuam explicitamente incompletos e nenhum ano é marcado como pronto para produção sem revisão externa registrada.

Admin privado e configuração: [guia de setup do Supabase](docs/admin-setup.md).

Telemetria anônima e feedback: [política e contrato de dados](docs/analytics-privacy.md).

Status técnico e próximos passos: [documento de handoff](docs/status-do-projeto.md).

Base original congelada: [Worlds 2017 / LCK](docs/worlds-2017-lck-research.md) · [Balanceamento de 2017](docs/worlds-2017-balance.md).

Documento do protótipo original, anterior à importação histórica: [PDF](docs/COMO-O-JOGO-FOI-IMPLEMENTADO.pdf) · [Markdown](docs/COMO-O-JOGO-FOI-IMPLEMENTADO.md). As seções de dados desse documento descrevem o antigo conjunto MOCK.

## Rodar

```sh
npm install
npm run dev
```

Abra `http://localhost:5173`. Para gerar a versão de produção: `npm run build`. Para conferir essa versão localmente: `npm run preview`.

O projeto usa Node 22 LTS (`.nvmrc`; `>=22 <23`) e npm 10 ou superior. Em Windows, use `npm.cmd` caso sua política de PowerShell bloqueie o wrapper `npm.ps1`.

## O que está implementado

- Home e instruções.
- Cinco escolhas imediatas: TOP → JUNGLE → MID → ADC → SUPPORT. Cada posição sorteia ano e grupo regional dentre grupos disponíveis.
- No mobile, as três opções usam carrossel com swipe, teclado, setas, indicador e uma prévia da próxima carta. A escolha acontece somente pelo CTA explícito **Escalar esta lenda**.
- Modos **Clássico** e **Almanaque**: o Clássico exibe ratings e força; o Almanaque oculta toda orientação numérica durante a campanha e revela os cinco jogos no resultado final. O modo integra save, desafio e card compartilhável.
- Quatro planos persistentes escolhidos após o draft: **Agressão**, **Teamfight**, **Controle/Pick** e **Escala**. As tags ativas e o efeito limitado de `−1,0` a `+1,5` aparecem na composição e na prévia da partida.
- Filtros opcionais na home restringem o draft e o futuro desafio por edição e grupo regional. Combinações vazias são bloqueadas e cada contexto do manifesto preserva três candidatos por posição.
- Desafio Diário no modo Almanaque com seed e regras iguais para todos, calendário de Brasília e arquivo dos sete dias recentes. A primeira entrada do dia é marcada localmente como oficial; as demais e todo o arquivo são amistosos, sem ranking ou conta.
- PWA instalável com ícones 192/512, manifesto e service worker. A campanha ativa pode ser retomada offline depois de carregada; navegação e assets usam caches separados, enquanto `/admin`, Supabase e requests com credenciais ficam sempre fora deles. Atualizações do worker só assumem o controle após confirmação.
- Arquivo público em `/arquivo`, com páginas indexáveis para 12 edições, 346 jogadores e 160 campeões. A busca usa um índice compacto; cada página carrega apenas os chunks anuais necessários e liga cada slot à sua fonte histórica.
- Histórico local de até 30 campanhas concluídas, com seis conquistas derivadas dos resultados. O jogador pode exportar um JSON portátil ou apagar o histórico mediante confirmação; não há conta, seed ou dado pessoal nesse arquivo.
- 785 versões pesquisadas: Worlds 2014–2025. Regiões canônicas e grupos de draft são separados: Coreia, China, Europa, América do Norte e Outras Regiões, com fusão determinística quando uma cobertura anual não tiver três candidatos por posição. Em 2024 e 2025, Europa e América do Norte formam um grupo conjunto; em 2025, LCP e LTA Sul formam Outras Regiões. Veja [a regra de agrupamento](docs/draft-region-grouping.md).
- Cada posição mostra exatamente três candidatos válidos do ano/grupo sorteado e prioriza combinações de times distintos.
- Três trocas compartilhadas por draft: ano, região ou jogadores. Ações impossíveis não gastam saldo. Configuração em `src/game/draft.ts`.
- Escolha com um clique, confirmação visual de 320 ms e avanço automático. Os cartões priorizam o nome e usam avatares originais e neutros, não fotos ou retratos fotorrealistas.
- Cinco campeões diferentes por jogador, em ordem fixa. Ratings individuais, sem overall do jogador.
- Visão da equipe com as cinco composições e a força de cada jogo.
- Suíço até três vitórias ou três derrotas. BO1 normal e BO3 em classificação/eliminação.
- Quartas, semifinal e final em BO5, com reprodução automática. Séries encerram imediatamente após a vitória necessária; cada série reinicia no G1.
- Dois modos: **Acompanhar partida**, com sete acontecimentos, placar de abates e KDA dos dez jogadores; e **Resultado rápido**, com resultados resumidos e avanço automático até o fim do torneio.
- Velocidades 1×, 2× e 4×, pausa/continuação e troca de modo durante a partida. Abrir instruções ou um relatório suspende os temporizadores até fechar o diálogo.
- Histórico de cada jogo, com relatório completo disponível em ambos os modos e após o fim da campanha.
- Prévia de cada partida com probabilidade de vitória, força, rating médio, composição e bônus ativos antes de revelar o resultado.
- Relatório agregado da campanha com fases, plano, compatibilidade, zebras, composições, destaque narrativo, campeões e retrospecto como favorito ou azarão. O KDA é identificado como apresentação da simulação, não como causa do sorteio.
- Jornada visual no encerramento, com cada confronto, marcos de fase, destaques e acesso ao relatório decisivo de cada série; o caminho pode ser exportado como PNG e comparado ao histórico local.
- Adversários com elencos históricos, sem repetição na mesma campanha enquanto houver opções.
- Card final compartilhável em PNG com equipe, anos e campanha; usa o compartilhamento nativo do dispositivo quando disponível e oferece download/cópia como fallback, sem dados pessoais.
- Seed versionada em toda campanha: ofertas, trocas, adversários, resultados e relatos são reproduzíveis pelas mesmas regras e decisões. O card final inclui um link/código para desafiar amigos nas mesmas condições, sem conta ou ranking não verificável.
- Save de campanha versionado no armazenamento local do navegador: seleções, trocas, draft, série, torneio, resultados e preferências de reprodução são retomados por **Continuar campanha**. Saves incompatíveis com uma nova versão de dados são descartados com segurança.
- A marca e **Continuar depois** voltam ao início preservando um save pausado; abandonar ou substituir uma campanha exige confirmação. O botão Voltar do navegador mantém o progresso.
- Um contrato puro `CampaignReport` deriva os agregados finais sem executar novo sorteio; o histórico local v2 preserva somente destaques categorizados.
- Painel privado em `/admin`: allowlist explícita de administradores, configuração versionada, funil de campanhas, resultados, duração, trocas, compartilhamentos, picks, rejeições, anos, regiões, dispositivos e feedback anônimo. O modo local de demonstração usa métricas ilustrativas e não envia dados.
- Configuração remota opcional para novos drafts: trocas iniciais, anos, grupos regionais, analytics e aviso de manutenção. Um snapshot das regras fica salvo na campanha ativa, evitando alterações retroativas.
- Feedback contextual opcional em cada rating G1–G5: motivo categorizado e observação curta, ligado somente aos IDs históricos públicos e disponível no dashboard agregado para revisão editorial.
- Interface responsiva, navegação por teclado, diálogo nativo, feedback de simulação e proteção contra clique duplo.

O Suíço é uma simulação da campanha do usuário: não existe uma tabela completa de 16 equipes, pareamento por campanha ou simulação paralela das outras chaves.

## Dados e imagens

**Pools comprovados; ratings estimados, não oficiais.** O conjunto padrão tem 3.925 slots com `evidenceId`, `historicalScore` e `gameRating`. O modelo histórico normaliza por evento/posição, com ajuste por campeão e regressão para amostras pequenas. Uma transformação global por posição produz a escala visível de 70–99. Fórmulas, fontes e partidas ficam em `data/research/multi-era/`; os 75 scores e pools originais de 2017 permanecem intactos. As 45 versões MOCK ficam apenas em `src/data/fixtures/mock-players.ts` para testes.

O acervo anterior de 44 campeões permanece em `public/assets/champions` e `public/assets/splash`, para as fixtures e o fallback de outras eras. `scripts/download-assets.mjs` atualiza somente esse acervo padrão; não gera os assets históricos.

Os 850 pares campeão/ano usam assets dos arquivos oficiais Data Dragon de cada edição, com hashes e créditos no [manifesto multi-era](data/research/multi-era/asset-manifest.json). Em 2014, o arquivo 4.14.2 contém apenas três splashes-base usados pelos pools; os outros 52 pares registram o ícone quadrado do mesmo patch como fallback explícito. `championArt` seleciona a arte histórica pelo ano para o pool G1–G5; ela não é usada como retrato do jogador. O manifesto e acervo originais de 2017 permanecem disponíveis. Fontes tipográficas também estão empacotadas localmente.

Participação e estatísticas foram conferidas com Games of Legends; limitações de acesso às demais fontes estão no relatório. Este é um projeto independente, sem vínculo com a Riot Games; League of Legends e seus personagens pertencem à Riot Games. A fase Suíça é a regra do jogo, não o formato histórico de 2017.

## Regras e arquitetura

```text
src/
  data/
    champions.ts   # Identidade, imagens e tags
    players.ts     # Snapshot de produção multi-era
    multi-era.json # Snapshot integral de pesquisa e testes
    years/          # Chunks anuais carregados sob demanda no jogo
    featured-player.json # Destaque leve usado pela home
    player-index.json # Índice compacto usado pelo painel admin
    draft-region-groups.json # Grupos de draft versionados por ano
    worlds-2017.json # Snapshot original congelado
    fixtures/      # MOCK preservado exclusivamente para testes
    repository.ts  # Interface assíncrona e adaptador local
  game/
    types.ts       # Contratos independentes de UI
    draft.ts       # Pools válidos, sorteios, trocas e DRAFT_CONFIG
    regions.ts     # Região canônica, grupos e fallback determinístico
    campaign.ts    # Save versionado no armazenamento local
    challenge.ts   # Payload validado, código e URL de desafio
    daily.ts       # Calendário, seed, arquivo e tentativas diárias locais
    history.ts     # Resumos locais, conquistas, exportação e limpeza
    plan.ts        # Planos, tags-alvo e rótulos
    engine.ts      # Ratings, composição, planos, séries e torneio
    random.ts      # Streams determinísticos separados por operação
    recap.ts       # Narrativa e snapshots cumulativos de KDA
    share.ts       # Texto e card PNG da campanha
    engine.test.ts # Casos de domínio e transições
  components/
    AutoplayControls.tsx # Modos, velocidade e pausa
    CampaignShare.tsx    # Web Share, download e fallback de cópia
    MatchReport.tsx      # Acontecimentos, KDA e linha do tempo
    PwaStatus.tsx        # Instalação, estado offline e atualização segura
  archive/
    ArchiveApp.tsx       # Índice e páginas públicas carregadas sob demanda
    routes.ts            # Rotas allowlisted por edição, jogador e campeão
    ResearchDialog.tsx   # Evidência histórica e método de rating
  App.tsx          # Telas e interações
  styles.css       # Identidade visual e responsividade
```

As funções do motor são puras e recebem o snapshot de dados. `Random` é injetável para testes reprodutíveis. `BALANCE` centraliza os pesos de rating, bônus de composição e parâmetros da probabilidade.

Força-base = 80% da média dos cinco ratings do jogo + 20% da composição. A composição recompensa dano misto, frontline, engage, peel e tags compartilhadas. O plano soma `+1,5`, `+0,5` ou `−1,0` conforme a cobertura explícita das tags-alvo. A chance de vitória usa uma curva logística sobre a força final, limitada a 8%–92%, permitindo zebras. Não há simulação de combate, ouro, itens ou rotas.

O relatório é uma apresentação fictícia gerada depois de sortear o resultado: não é uma reconstrução histórica nem um motor de combate. Abates, mortes e assistências são distribuídos por eventos; cada abate tem uma morte adversária correspondente, e o autor do abate não recebe assistência. Os snapshots são cumulativos, a última luta corresponde ao vencedor e a duração varia de 26 a 37 minutos fictícios. Dragão e Barão são contextos narrativos, sem sistema de objetivos ou economia.

Um único temporizador cancelável controla a reprodução na interface. A partida é sorteada uma vez; mudar velocidade, modo ou pausar não a sorteia novamente. O resultado só entra no placar da série ao terminar sua apresentação. Relatórios e o estado da campanha são mantidos no armazenamento local até começar outro draft; o formato do save é versionado e invalidado quando o dataset muda.

A campanha ativa fica somente no navegador do jogador e pode ser apagada por **Novo draft**. Os resumos concluídos possuem limpeza explícita e separada em **Seu histórico local**. Nenhuma chave, login, perfil ou persistência remota de usuário foi adicionada.

## Vercel, Firebase e Supabase depois

O frontend é estático e pode ser hospedado em qualquer uma das duas plataformas:

- **Vercel:** importar o repositório, preset Vite, build `npm run build`, saída `dist`. `vercel.json` já está incluído. [Documentação oficial](https://vercel.com/docs/frameworks/frontend/vite).
- **Firebase Hosting:** build igual, `firebase.json` incluído, diretório `dist`. Vincular um projeto Firebase antes de executar `firebase deploy --only hosting`.

O build usa `VITE_SITE_URL` para gerar canonical, Open Graph, Twitter Card, `robots.txt` e sitemap com URLs absolutas. Na Vercel, `VERCEL_PROJECT_PRODUCTION_URL` é usado automaticamente quando `VITE_SITE_URL` não estiver definido. Em outros provedores, configure por exemplo `VITE_SITE_URL=https://seu-dominio.example`, sem barra final.

Quando houver necessidade de dados remotos, implemente `DataRepository.load()` com Supabase ou Firestore e substitua a instância local em `App.tsx`. Retorne `{ players, champions, draftRegionManifest }`; o motor e as telas continuam usando o mesmo contrato. Em Supabase, uma futura modelagem pode separar `champions`, `player_versions` e `champion_pool_slots` (chave composta `player_version_id + game`). Em Firestore, versões podem conter os cinco slots, mantendo a coleção de campeões separada.

Nenhum serviço remoto foi criado e nenhuma publicação foi feita. Se rankings forem adicionados, resultados competitivos precisam ser recalculados por um backend confiável, já que a simulação atual roda no navegador. Não colocar chaves administrativas em variáveis `VITE_*`.

A área `/admin` usa Supabase Auth, uma allowlist explícita em `admin_users` e RLS. A migração e a configuração de variáveis locais estão no [guia de setup do Supabase](docs/admin-setup.md).

## Verificação

Pipeline de pesquisa (Python 3, sem bibliotecas adicionais):

```sh
npm run data:multi:build     # Recria a produção e os grupos de draft a partir de snapshots offline
npm run data:multi:validate  # 3.925 associações, calibração e 1.700 registros de assets
npm run data:multi:simulate  # 100.000 campanhas + 10.000 drafts de diversidade
npm run data:plans:simulate  # 100.000 campanhas pareadas entre quatro planos e baseline
npm run data:multi:reproduce # Reconstrução byte a byte
npm run data:multi:report    # Relatório multi-era a partir das medições
npm run data:readiness:build # Regera o inventário de cobertura 2011–2025
npm run data:readiness:validate # Falha se inventário ou relatório estiverem desatualizados
npm run data:archive:validate # Falha se o índice público estiver desatualizado
npm run pwa:icons          # Rasteriza o favicon aprovado nos tamanhos 192 e 512
```

Para baixar os CSVs de pesquisa: `npm run data:multi:download`. Para inspecionar um lote: `python scripts/data/build_multi_era.py --snapshot --year 2020 --region LPL`. O preview não substitui a produção. O limite de trocas fica em `DRAFT_CONFIG.exchanges`; a simulação aceita `DRAFT_SAMPLES` e `EXCHANGE_GAIN_THRESHOLD`.

Pipeline original congelado de 2017:

```sh
npm run data:build       # Agregados, normalização, evidências e snapshot jogável
npm run data:validate    # Conferência com fontes e espelho
npm run data:simulate    # 10.000 campanhas, seed 201718
npm run data:report      # Relatórios Markdown e manifestos
python scripts/data/verify_reproducibility.py # Compara geração offline byte a byte
```

```sh
npm run typecheck # TypeScript sem emitir bundle
npm test          # Regras do jogo
npm run test:e2e  # Fluxo completo no Playwright Chromium
npm run build     # TypeScript e bundle de produção
```

Para instalar o navegador de testes: `npx playwright install chromium`. O workflow [CI](.github/workflows/ci.yml) executa `npm ci`, type check, testes unitários, validação histórica, build e Playwright Chromium em cada push e pull request. Há testes para campanha campeã, derrota no Suíço, reinício, imagens, ausência de rolagem horizontal, desempates, BO3 e encerramento antecipado de BO5.
