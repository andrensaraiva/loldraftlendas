# Draft Lendas — pesquisa, UX e balanceamento multi-era v1.1

A versão reúne 455 PlayerVersions reais, 2.275 associações jogador–campeão e 135 pools elegíveis. Foram executadas 100.000 campanhas em dez cenários e uma auditoria adicional de 10.000 drafts. A escolha estratégica e as trocas aumentam a chance de título; a LCK e a LPL continuam favorecidas. Este relatório não declara equilíbrio competitivo nem validação de diversão com pessoas reais.

## Escopo e cobertura

| Worlds | Patch | Jogos do evento principal | Jogadores jogáveis | Slots | Regiões |
|---|---|---:|---:|---:|---|
| [2015](https://gol.gg/tournament/tournament-stats/World%20Championship%202015/) | 5.18.1 | 73 | 60 | 300 | LCK, LPL, Europa, NA |
| [2017](https://gol.gg/tournament/tournament-stats/World%20Championship%202017/) | 7.18.1 | 80 | 60 | 300 | LCK, LPL, Europa, NA |
| [2019](https://gol.gg/tournament/tournament-stats/World%20Championship%202019/) | 9.19.1 | 77 | 60 | 300 | LCK, LPL, Europa, NA |
| [2020](https://gol.gg/tournament/tournament-stats/World%20Championship%202020/) | 10.19.1 | 76 | 65 | 325 | LCK, LPL, Europa, NA |
| [2022](https://gol.gg/tournament/tournament-stats/World%20Championship%202022/) | 12.18.1 | 80 | 70 | 350 | LCK, LPL, Europa, NA |
| [2023](https://gol.gg/tournament/tournament-stats/Worlds%20Main%20Event%202023/) | 13.19.1 | 79 | 75 | 375 | LCK, LPL, Europa, NA |
| [2024](https://gol.gg/tournament/tournament-stats/Worlds%20Main%20Event%202024/) | 14.18.1 | 82 | 65 | 325 | LCK, LPL, Europa, NA |

Slots: **2078 WORLDS_DATA** e **197 SEASON_DATA**. Nenhuma associação MOCK na produção. 2019 foi incluído porque a mesma importação cobriu o evento e a temporada sem um fluxo separado.

São apenas participantes do evento principal: grupos até 2022, Suíço a partir de 2023. Play-ins não entram nos pools nem nas estatísticas do Worlds. Cada time contribui com o jogador que disputou mais jogos em cada posição. Empates usam ordem alfabética documentada, sem preferência por fama. Isso seleciona Acorn sobre Flame (3–3) em 2015 e Blaber sobre Svenskeren (3–3) em 2019.

As chaves estáveis LEC/LCS representam Europa/NA em sorteios entre eras. A interface mostra **EU LCS / NA LCS** em 2015 e 2017. Correções explícitas de nomes de fonte: ROX Tigers → KOO Tigers em 2015, Dplus Kia → DWG KIA em 2022, MAD Lions KOI → MAD Lions em 2023; TSM é harmonizado com Team SoloMid. O código legado LTC identifica os registros coreanos de 2015 e é normalizado para LCK. Nenhuma dessas correções altera estatísticas.

### Reservas observados, fora das cartas

| Ano | Jogador | Time | Posição | Jogos |
|---|---|---|---|---:|
| 2015 | Easyhoon | SK Telecom T1 | MID | 4 |
| 2015 | Korol | EDward Gaming | TOP | 3 |
| 2015 | Time | Invictus Gaming | ADC | 1 |
| 2015 | Flame | LGD Gaming | TOP | 3 |
| 2017 | Blank | SK Telecom T1 | JUNGLE | 9 |
| 2017 | Haru | Samsung Galaxy | JUNGLE | 1 |
| 2017 | Rascal | Longzhu Gaming | TOP | 1 |
| 2019 | Mata | SK Telecom T1 | SUPPORT | 2 |
| 2019 | Leyan | Invictus Gaming | JUNGLE | 3 |
| 2019 | Svenskeren | Cloud9 | JUNGLE | 3 |
| 2019 | Deftly | Cloud9 | ADC | 1 |
| 2022 | Juhan | DRX | JUNGLE | 1 |
| 2024 | Wei | Bilibili Gaming | JUNGLE | 3 |

### Fontes e rastreabilidade

O produtor estatístico principal é [Oracle’s Elixir / Tim Sevenhuysen](https://lol.timsevenhuysen.com/matchdata/). CSVs anuais foram obtidos de espelhos públicos; os arquivos e suas origens estão fixados por SHA-256 em [downloads.json](../data/research/multi-era/downloads.json). A atribuição não autentica independentemente os espelhos. A distribuição antiga por Drive atingiu a cota pública e não foi contornada.

Espelhos: [2015/2019 — competitive-league-analysis](https://github.com/victoraccete/competitive-league-analysis/tree/master/original_data), [2020 — League-of-Legends-Stats-Analyzer](https://github.com/AdamLewis73/League-of-Legends-Stats-Analyzer), [2022/2023 — finalLOL](https://github.com/twodotone/finalLOL/tree/main/data/csv). Para 2017, a fonte e o snapshot congelados continuam disponíveis em `data/research/worlds-2017/`.

Cada slot aponta para uma evidência com jogo(s), linha(s) da fonte, evento, métricas, confiança e fórmula. `matches-{year}.json` contém o recorte normalizado necessário para reconstrução offline; `normalization-{year}.json` guarda baselines e ajustes por campeão. `rosters-{year}.json` documenta titulares, reservas e nomes de época. As contagens dos 7 eventos e um agregado por edição foram conferidos com Games of Legends, registrados em `crosschecks.json`; isso não equivale a uma segunda verificação independente de cada partida.

### Cinco exceções de cobertura de 2015

A planilha OE não cobre a temporada chinesa de 2015. Cinco slots foram completados com observações públicas do Games of Legends: **AmazingJ–Shen, Zz1tai–Maokai, Kid–Vayne, Acorn–Shen e Acorn–Maokai**. [O suplemento](../data/research/multi-era/season-supplement-2015.json) contém as URLs, o escopo, as contagens e as limitações.

AmazingJ–Shen tem uma partida comprovada, de 26/06/2015 (2/1/18); não afirmamos que era seu campeão mais frequente no Summer. Zz1tai usa o filtro S5 Summer com playoffs/qualificatórias e Worlds, mas Maokai não aparece no Worlds. Kid e Acorn usam agregados do Summer regular. Não foram fabricadas datas de estreia, partidas ou métricas ausentes. A seleção nesses cinco casos é entre os campeões documentados disponíveis, uma exceção explícita à cobertura sazonal integral desejada.

O coeficiente de confiança de desempenho específico é **zero** nesses cinco slots: B=A, e o componente de frequência é usado apenas quando o denominador está documentado. Isso não significa dúvida de que o campeão foi jogado; significa falta de métricas suficientes para estimar seu desempenho. AmazingJ recebe C=0 por não haver denominador sazonal completo. A interface identifica a evidência parcial.

## Seleção G1–G5 e modelo histórico

Selecionamos os cinco campeões mais usados pelo jogador no evento principal; empates de frequência usam a primeira aparição. Esses cinco são ordenados por estreia para definir G1–G5. Se houver menos de cinco, acrescentamos campeões distintos observados no Summer, depois qualificatórias, MSI, Spring e Winter, conforme disponibilidade; no fallback, frequência e aparição mais recente desempataram. Não há preenchimento aleatório. Os cinco casos complementares acima têm limitações próprias documentadas.

`historicalScore` mantém o modelo de 2017: métricas normalizadas por evento e posição, ajuste empírico de dano/recursos por campeão, regressão à média para amostras pequenas. Eficiência (log de KDA por jogo), participação em abates, dano, parcela de dano, diferenças de ouro/CS/XP aos 15 minutos e visão entram com pesos por posição. Win rate é evidência, sem bônus adicional de sucesso do time.

A = desempenho geral do jogador, reduzido pela amostra N/(N+5). B = A + confiança × (desempenho do campeão − A), com n/(n+5), cobertura de métricas e fator 0,65 para temporada. C = frequência relativa, com redução de 50% para temporada. `historicalScore = 0,35 A + 0,50 B + 0,15 C`. Métricas ausentes reduzem cobertura; não viram zeros fictícios. Pesos e parâmetros completos estão nos scripts e arquivos de normalização.

A versão `worlds-2017-v1.0.0`, seus 75 scores, pools e arquivos originais permanecem congelados. Os testes e a simulação antiga passaram a importar explicitamente esse snapshot; a produção importa o conjunto multi-era.

## Calibração global de gameRating

```text
gameRating = round(clamp(84,5 + 5 × (historicalScore − médiaGlobalDaPosição) / desvioGlobalDaPosição, 70, 99))
```

É a mesma transformação para todos os jogadores, anos e regiões. As médias e desvios são calculados sobre os 2.275 slots, separados apenas por posição para controlar inflação estrutural de roles. Centro 84,5 e dispersão 5 são parâmetros de design publicados, não ajustes por nome. Não se impõe uma quantidade de notas 99 nem se igualam as médias de cada ano/região. Novas edições exigirão uma nova versão de calibração, pois alteram essa população.

| Posição | Média de historicalScore | Desvio | Slots |
|---|---:|---:|---:|
| TOP | 53.8460 | 12.1756 | 455 |
| JUNGLE | 53.0270 | 9.6498 | 455 |
| MID | 54.6201 | 9.8938 | 455 |
| ADC | 55.6656 | 10.3544 | 455 |
| SUPPORT | 54.5769 | 10.3151 | 455 |

O ranking é relativo aos participantes e às métricas disponíveis de cada evento. A transformação melhora a comparabilidade de escala, mas não prova equivalência causal entre eras, metas e adversários. A associação jogador–campeão e o score histórico são distintos da nota usada no jogo.

## Sorteio e trocas

Cada posição sorteia o ano uniformemente entre os elegíveis, depois a região válida daquele ano. Não se força variedade entre posições. Os pools têm de três a cinco candidatos; a oferta mostra exatamente três, com subconjuntos amostrados uniformemente quando há mais opções.

`DRAFT_CONFIG` centraliza três trocas por draft e as durações de feedback. Trocar ano preserva região/posição; trocar região preserva ano/posição; trocar jogadores preserva o contexto e favorece novas pessoas. Ações impossíveis ficam desabilitadas e não consomem saldo. O estado rejeitado inclui o conjunto de IDs, independentemente da ordem. O histórico é local à posição; alternativas ainda não rejeitadas têm prioridade até esgotarem.

## Simulações e estratégias

Foram executadas **100,000 campanhas**: 10.000 por cenário, com streams LCG32 determinísticos separados para sorteio, escolha, trocas e partidas. As mesmas sementes por índice facilitam a comparação entre políticas. A política BO5 e a heurística com orçamento zero são controles equivalentes. Seeds e resultados completos: [simulation.json](../data/research/multi-era/simulation.json).

O estudo reutiliza `teamStrength`, `winProbability`, `formatFor`, `seriesDone` e `advanceTournament`. Adversários são os 91 elencos completos, uniformes e sem repetição até esgotamento, como no motor. Apenas a narrativa/KDA visual é omitida para acelerar; esses recursos são cobertos pelos testes do jogo. Não há antecipação do vencedor para escolher cartas.

G1/BO3/BO5 maximizam a média dos slots correspondentes. Composição avalia cada candidato com o time parcial já escolhido, usando o score real de composição e rating esperado 84,5 para posições faltantes; é uma heurística marginal, não busca ótima nem amostragem das sinergias futuras. Reroll usa BO5 e troca apenas quando a melhora esperada do melhor candidato na oferta supera **1,5 ponto** (`EXCHANGE_GAIN_THRESHOLD`). Ela consulta a distribuição de ofertas possíveis, não a próxima realização do RNG. Sua expectativa não modela perfeitamente o histórico de rejeições.

| Estratégia | Força G1 | Força BO3 | Força BO5 | Título | Eliminação no Suíço | Trocas usadas |
|---|---:|---:|---:|---:|---:|---:|
| random | 84.67 | 84.57 | 84.28 | 7.42% | 51.25% | 0.00 |
| g1 | 87.72 | 87.30 | 86.86 | 21.37% | 28.55% | 0.00 |
| bo3 | 87.44 | 87.53 | 87.13 | 22.75% | 28.34% | 0.00 |
| bo5 | 87.43 | 87.46 | 87.12 | 22.75% | 28.83% | 0.00 |
| composition | 87.26 | 87.42 | 87.09 | 22.86% | 29.75% | 0.00 |
| reroll | 89.08 | 89.20 | 88.93 | 38.67% | 17.98% | 2.49 |

A escolha BO3/BO5 supera o aleatório. A heurística de composição não mostrou ganho robusto sobre BO5 nesta configuração; parte dos bônus satura e a avaliação parcial não antecipa todas as sinergias. Com 10.000 amostras por cenário, a taxa de título BO5 de 22.75% tem erro padrão aproximado de 0.42 ponto percentual; diferenças pequenas entre as heurísticas não sustentam uma superioridade robusta.

### Valor das trocas

| Limite | Título | Eliminação Suíço | Força BO5 | Uso médio |
|---:|---:|---:|---:|---:|
| 0 | 22.75% | 28.83% | 87.12 | 0.00 |
| 1 | 29.00% | 24.28% | 87.83 | 0.97 |
| 2 | 33.96% | 20.95% | 88.45 | 1.83 |
| 3 | 38.67% | 17.98% | 88.93 | 2.49 |
| 5 | 43.83% | 15.17% | 89.45 | 3.19 |

**Recomendação: manter três como padrão inicial de teste**, não como ótimo comprovado. O uso médio é 2.49; subir de três para cinco traz aproximadamente mais 5.16 pontos percentuais de títulos e reduz a dificuldade. Duas trocas são uma alternativa mais exigente (33.96%). Três preservam restrição real e oferecem agência, mas já elevam bastante o sucesso sobre a ausência de trocas.

## Dominância, distribuição e diversidade

| Grupo | Média G1 | Média BO3 | Média BO5 |
|---|---:|---:|---:|
| year: 2015 | 84.58 | 84.43 | 83.90 |
| year: 2017 | 85.60 | 85.48 | 85.15 |
| year: 2019 | 85.10 | 85.28 | 84.89 |
| year: 2020 | 85.58 | 85.36 | 85.07 |
| year: 2022 | 84.29 | 84.40 | 84.04 |
| year: 2023 | 84.65 | 84.36 | 84.09 |
| year: 2024 | 85.31 | 84.85 | 84.49 |
| region: LCK | 87.22 | 87.17 | 86.80 |
| region: LPL | 86.66 | 86.35 | 85.96 |
| region: LEC | 83.12 | 83.17 | 82.77 |
| region: LCS | 82.33 | 82.08 | 81.81 |
| role: TOP | 84.82 | 84.77 | 84.50 |
| role: JUNGLE | 85.04 | 84.92 | 84.49 |
| role: MID | 85.09 | 84.86 | 84.51 |
| role: ADC | 85.18 | 84.91 | 84.51 |
| role: SUPPORT | 84.86 | 84.84 | 84.49 |

A diferença entre as médias anuais BO5 é de aproximadamente 1.26 ponto; entre LCK e LCS, 4.99. A média por posição fica perto de 84,5 como consequência da calibração. Isso controla inflação de role, mas **não elimina dominância regional**. Não foram adulterados dados para igualar regiões.

Dominância abaixo significa superar ou empatar G1, BO3 e BO5, sendo estritamente melhor em pelo menos um. Não inclui vantagem de composição contextual.

| Jogador | Dominados no mesmo pool | Dominados de outras eras / mesma posição |
|---|---:|---:|
| uzi-2019-rng | 2 | 78 |
| canyon-2020-dwg | 2 | 78 |
| uzi-2017-rng | 2 | 77 |
| rookie-2019-ig | 1 | 77 |
| karsa-2020-tes | 3 | 77 |
| tian-2019-fpx | 2 | 76 |
| knight-2022-tes | 3 | 76 |
| keria-2023-t1 | 3 | 76 |
| jackeylove-2020-tes | 3 | 75 |
| doinb-2019-fpx | 1 | 74 |

Casos como Uzi 2019 e Canyon 2020 tornam algumas ofertas fáceis de otimizar por rating. Os IDs dominados estão no JSON completo, assim como contagens de oferta/escolha por jogador, distribuições de força, composição e rating por role para cada política.

### Rejeições e escolhas com três trocas

| Região | Ofertas rejeitadas | Jogadores escolhidos |
|---|---:|---:|
| LCK | 0 | 18190 |
| LPL | 0 | 18667 |
| LEC | 0 | 7599 |
| LCS | 0 | 5544 |

| Ano | Ofertas rejeitadas | Jogadores escolhidos |
|---|---:|---:|
| 2015 | 3082 | 6237 |
| 2017 | 2913 | 6122 |
| 2019 | 3539 | 7875 |
| 2020 | 3219 | 7833 |
| 2022 | 4229 | 7925 |
| 2023 | 4870 | 7475 |
| 2024 | 3096 | 6533 |

Trocas por tipo: {'region': 15117, 'players': 2780, 'year': 7051}. Os totais de rejeição de jogadores contam as três pessoas presentes em cada oferta rejeitada, não decisões explícitas sobre cada pessoa.

### Distribuição dos 2.275 ratings

| Nota | Quantidade |
|---:|---:|
| 70 | 1 |
| 71 | 1 |
| 72 | 4 |
| 73 | 3 |
| 74 | 7 |
| 75 | 33 |
| 76 | 66 |
| 77 | 86 |
| 78 | 95 |
| 79 | 105 |
| 80 | 137 |
| 81 | 145 |
| 82 | 141 |
| 83 | 167 |
| 84 | 145 |
| 85 | 167 |
| 86 | 165 |
| 87 | 167 |
| 88 | 122 |
| 89 | 116 |
| 90 | 99 |
| 91 | 98 |
| 92 | 72 |
| 93 | 57 |
| 94 | 37 |
| 95 | 18 |
| 96 | 12 |
| 97 | 6 |
| 98 | 1 |
| 99 | 2 |

Em **10,000 drafts adicionais**: 5,243 sequências distintas de ano/região, 10,000 times finais únicos, 300 ofertas distintas. Foram 49,700 repetições de oferta em 50,000 posições: os pools pequenos tornam essa repetição inevitável, mesmo com grande variedade de equipes.

Média de **3.76 eras** e **3.06 regiões** por equipe. A frequência de cada PlayerVersion está no JSON; não há garantia artificial de cinco anos diferentes. A heurística com três trocas ficou em 3.75 eras e 2.82 regiões, indicando concentração regional ao otimizar.

## UX: inspeção, decisões e medidas

A inspeção pública de [7a0](https://7a0.com.br/en) observou CTA imediato, explicação curta do sorteio e sequência sortear → montar → simular. Foram aproveitados princípios de interação, sem copiar código, marca, imagens ou layout. Não houve login nem interação com outras pessoas.

A versão anterior iniciava as cartas quase 500 px abaixo do topo no desktop. O draft agora concentra o progresso na equipe, reduz cabeçalho e altura das cartas e aproxima ano/região das escolhas. Os próprios campos de contexto permitem trocar; o saldo e a ação de trocar jogadores são compactos. A carta inteira continua clicável, com feedback de 320 ms e bloqueio de duplo clique; não existe confirmação adicional.

No mobile foi mantida uma **lista vertical compacta das três ofertas**, permitindo comparar os cinco ratings sem gesto lateral obrigatório. Evitamos um carrossel que esconderia candidatos. Em 390×844 a última carta exige uma rolagem curta; não afirmamos que todos os detalhes cabem simultaneamente. G1–G5 e ratings ficam expostos; jogos, WR, KDA, confiança e fonte abrem em detalhes. O método fica em “Como calculamos?”.

A escolha é um clique; a home explica SORTEIE / MONTE / DISPUTE. As transições respeitam redução de movimento do sistema. Diálogos usam foco nativo, Escape e retorno à carta/controle de origem.

| Viewport | Topo das cartas antes → depois | Altura antes → depois | Altura da página antes → depois | Overflow horizontal |
|---|---|---|---|---|
| desktop | 497 → 320 px | 489 → 372 px | 1186 → 908 px | não |
| mobile | 440 → 329 px | 253 → 176 px | 1417 → 1111 px | não |

[Desktop depois](screenshots/draft-after-desktop.png) · [Mobile depois](screenshots/draft-after-mobile.png) · [Desktop antes](screenshots/draft-before-desktop.png) · [Mobile antes](screenshots/draft-before-mobile.png). Medidas obtidas com Edge/Playwright em 1366×768 e 390×844, após as animações. São inspeção visual e testes automatizados, não testes de usabilidade com participantes.

## Arte e arquitetura

518 pares campeão/ano usam ícones e splashes históricos extraídos de arquivos oficiais Riot/Data Dragon: **1036 arquivos**, com SHA-256, versão e origem no [manifesto](../data/research/multi-era/asset-manifest.json). Os retratos não validados não foram acrescentados; cada carta mostra o campeão G1. O arquivo e manifesto original de 2017 permanecem intactos. Os novos campeões receberam tags de arquétipo explícitas, que são hipóteses do motor e não estatísticas medidas. Essas tags amplas não modelam todos os reworks entre eras.

O domínio de draft fica em `src/game/draft.ts`, separado do motor de partidas. `PlayerVersion` e `ChampionSlot` receberam dados opcionais de pesquisa para manter fixtures e adaptadores compatíveis. `DataRepository.load()` permanece a fronteira assíncrona para um futuro Supabase/Firestore. O site segue estático, pronto para build Vite em Vercel ou Firebase Hosting; nenhum backend, autenticação ou serviço externo foi criado.

## Validação e reprodução

```sh
npm ci
npm test
npm run test:e2e
npm run build
npm run data:multi:build
npm run data:multi:validate
npm run data:multi:simulate
npm run data:multi:reproduce
npm run data:multi:report
```

O build multi-era usa snapshots e JSONs do Data Dragon versionados, sem rede. Para pesquisa a partir do CSV: `npm run data:multi:download` e `python scripts/data/build_multi_era.py`. Inspeções por lote: `python scripts/data/build_multi_era.py --snapshot --year 2020 --region LPL`; geram `batch-preview.json` sem recalibrar a produção parcial. O rebuild global é deliberadamente feito sobre todas as edições.

A auditoria valida cada associação, cinco campeões distintos, 135 pools, limites/calibração, hashes dos assets, evento principal e o congelamento de 2017. Os testes cobrem trocas impossíveis, saldo, contexto, reprodutibilidade do RNG, novas ofertas, escolha única, cinco posições, overflow mobile, BO1/BO3/BO5 e reprodução automática com pausa e KDA. `data:build`, `data:validate`, `data:simulate` e `data:report` continuam disponíveis para o estudo original de 2017.

## Riscos e próxima validação

1. A superioridade regional é substancial; procurar LCK/LPL é uma política forte. Não recomendamos promover esta versão como competitivamente balanceada.
2. As cinco evidências complementares chinesas de 2015 precisam de cobertura sazonal completa para aplicar a mesma seleção/normalização integral aos slots.
3. Comparar estatísticas relativas de diferentes metas não prova capacidade absoluta entre eras. Mudanças de elenco e adversários afetam os scores.
4. A estratégia de composição é simples e não demonstrou ganho mensurável; convém melhorar a busca antes de concluir que composição não importa.
5. Há apenas 300 ofertas distintas: familiaridade pode tornar as escolhas repetitivas, apesar das equipes finais variadas.
6. Não houve teste com usuários reais sobre compreensão, sensação de controle ou vontade de repetir. O próximo teste deve medir abandono, tempo de escolha, uso das trocas e repetição voluntária.
7. O Suíço é a campanha individual do usuário, não uma tabela completa de todos os times. KDA/eventos são apresentação fictícia de um resultado probabilístico, sem combate, ouro ou itens.

A próxima decisão de produto deve usar testes com pessoas e estas métricas como referência, mantendo os dados históricos versionados.
