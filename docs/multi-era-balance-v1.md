# Draft Lendas — pesquisa, UX e balanceamento multi-era v1.6

A versão reúne 785 PlayerVersions reais, 3.925 associações jogador–campeão e 235 pools elegíveis. Foram executadas 100.000 campanhas em dez cenários e uma auditoria adicional de 10.000 drafts. A escolha estratégica e as trocas aumentam a chance de título; a LCK e a LPL continuam favorecidas. Este relatório não declara equilíbrio competitivo nem validação de diversão com pessoas reais.

## Escopo e cobertura

| Worlds | Patch | Jogos do evento principal | Jogadores jogáveis | Slots | Regiões |
|---|---|---:|---:|---:|---|
| [2014](https://gol.gg/tournament/tournament-stats/World%20Championship%202014/) | 4.14.2 | 78 | 60 | 300 | EU LCS, LCK, LPL, NA LCS |
| [2015](https://gol.gg/tournament/tournament-stats/World%20Championship%202015/) | 5.18.1 | 73 | 60 | 300 | EU LCS, LCK, LPL, NA LCS |
| [2016](https://gol.gg/tournament/tournament-stats/World%20Championship%202016/) | 6.18.1 | 77 | 60 | 300 | EU LCS, LCK, LPL, NA LCS |
| [2017](https://gol.gg/tournament/tournament-stats/World%20Championship%202017/) | 7.18.1 | 80 | 60 | 300 | EU LCS, LCK, LPL, NA LCS |
| [2018](https://gol.gg/tournament/tournament-stats/World%20Championship%202018/) | 8.19.1 | 77 | 60 | 300 | EU LCS, LCK, LPL, NA LCS |
| [2019](https://gol.gg/tournament/tournament-stats/World%20Championship%202019/) | 9.19.1 | 77 | 60 | 300 | LCK, LCS, LEC, LPL |
| [2020](https://gol.gg/tournament/tournament-stats/World%20Championship%202020/) | 10.19.1 | 76 | 65 | 325 | LCK, LCS, LEC, LPL |
| [2021](https://gol.gg/tournament/tournament-stats/World%20Championship%202021/) | 11.19.1 | 83 | 70 | 350 | LCK, LCS, LEC, LPL |
| [2022](https://gol.gg/tournament/tournament-stats/World%20Championship%202022/) | 12.18.1 | 80 | 70 | 350 | LCK, LCS, LEC, LPL |
| [2023](https://gol.gg/tournament/tournament-stats/Worlds%20Main%20Event%202023/) | 13.19.1 | 79 | 75 | 375 | LCK, LCS, LEC, LPL |
| [2024](https://gol.gg/tournament/tournament-stats/Worlds%20Main%20Event%202024/) | 14.18.1 | 82 | 65 | 325 | LCK, LCS, LEC, LPL |
| [2025](https://gol.gg/tournament/tournament-stats/Worlds%20Main%20Event%202025/) | 15.20.1 | 80 | 80 | 400 | LCK, LCP, LEC, LPL, LTA N, LTA S |

Slots: **3596 WORLDS_DATA** e **329 SEASON_DATA**. Nenhuma associação MOCK na produção. 2019 foi incluído porque a mesma importação cobriu o evento e a temporada sem um fluxo separado.

São apenas participantes do evento principal: grupos até 2022, Suíço a partir de 2023. Play-ins não entram nos pools nem nas estatísticas do Worlds. Cada time contribui com o jogador que disputou mais jogos em cada posição. Empates usam ordem alfabética documentada, sem preferência por fama. Isso seleciona Acorn sobre Flame (3–3) em 2015 e Blaber sobre Svenskeren (3–3) em 2019.

As chaves estáveis LEC/LCS representam Europa/NA em sorteios entre eras. A interface mostra **EU LCS / NA LCS** em 2014–2017. Correções explícitas de nomes de fonte: Royal Club → Star Horn Royal Club e Oh My God → OMG em 2014, ROX Tigers → KOO Tigers em 2015, Dplus Kia → DWG KIA em 2022, MAD Lions KOI → MAD Lions em 2023; TSM é harmonizado com Team SoloMid. O código legado LTC identifica os registros coreanos de 2015 e é normalizado para LCK. Nenhuma dessas correções altera estatísticas.

### Reservas observados, fora das cartas

| Ano | Jogador | Time | Posição | Jogos |
|---|---|---|---|---:|
| 2014 | Da7 | OMG | SUPPORT | 6 |
| 2014 | Svenskeren | SK Gaming | JUNGLE | 3 |
| 2015 | Easyhoon | SK Telecom T1 | MID | 4 |
| 2015 | Korol | EDward Gaming | TOP | 3 |
| 2015 | Time | Invictus Gaming | ADC | 1 |
| 2015 | Flame | LGD Gaming | TOP | 3 |
| 2016 | Blank | SK Telecom T1 | JUNGLE | 10 |
| 2016 | Wraith | Samsung Galaxy | SUPPORT | 2 |
| 2016 | Korol | EDward Gaming | TOP | 4 |
| 2016 | PawN | EDward Gaming | MID | 4 |
| 2016 | BaeMe | I May | MID | 2 |
| 2016 | Athena | I May | SUPPORT | 1 |
| 2017 | Blank | SK Telecom T1 | JUNGLE | 9 |
| 2017 | Haru | Samsung Galaxy | JUNGLE | 1 |
| 2017 | Rascal | Longzhu Gaming | TOP | 1 |
| 2018 | Mowgli | Afreeca Freecs | JUNGLE | 2 |
| 2018 | Ambition | Gen.G | JUNGLE | 1 |
| 2018 | Mlxg | Royal Never Give Up | JUNGLE | 3 |
| 2018 | Duke | Invictus Gaming | TOP | 5 |
| 2018 | Clearlove | EDward Gaming | JUNGLE | 2 |
| 2018 | sOAZ | Fnatic | TOP | 4 |
| 2018 | Blaber | Cloud9 | JUNGLE | 1 |
| 2019 | Mata | SK Telecom T1 | SUPPORT | 2 |
| 2019 | Leyan | Invictus Gaming | JUNGLE | 3 |
| 2019 | Svenskeren | Cloud9 | JUNGLE | 3 |
| 2019 | Deftly | Cloud9 | ADC | 1 |
| 2021 | Burdol | Gen.G | TOP | 3 |
| 2022 | Juhan | DRX | JUNGLE | 1 |
| 2024 | Wei | Bilibili Gaming | JUNGLE | 3 |
| 2025 | Beichuan | Bilibili Gaming | JUNGLE | 2 |
| 2025 | Driver | CTBC Flying Oyster | TOP | 5 |
| 2025 | Pun | Team Secret Whales | TOP | 2 |

### Fontes e rastreabilidade

O produtor estatístico principal é [Oracle’s Elixir / Tim Sevenhuysen](https://lol.timsevenhuysen.com/matchdata/). Os arquivos e suas origens estão fixados por SHA-256 em [downloads.json](../data/research/multi-era/downloads.json). O CSV de 2024 veio da pasta pública do produtor; os demais anos não congelados usam espelhos públicos cuja atribuição não foi autenticada linha a linha. Em 2021 e 2025, as cópias do Drive estavam bloqueadas por cota: as revisões anunciavam respectivamente 109.765.213 e 79.169.638 bytes, enquanto os espelhos fixados têm 91.999.784 e 79.130.187 bytes. Diferenças, datas e hashes permanecem explícitos, sem alegação de identidade com revisões posteriores.

Espelhos: [2014/2015/2016/2018/2019 — competitive-league-analysis](https://github.com/victoraccete/competitive-league-analysis/tree/master/original_data), [2020 — League-of-Legends-Stats-Analyzer](https://github.com/AdamLewis73/League-of-Legends-Stats-Analyzer), [2021 — snapshot Kaggle de 01/02/2022](https://www.kaggle.com/datasets/arthur1511/lol-esports-2021), [2022/2023 — finalLOL](https://github.com/twodotone/finalLOL/tree/main/data/csv) e [2025 — LoL-Esports-Regional-Analyses](https://github.com/cbplexiglass/LoL-Esports-Regional-Analyses). Para 2017, a fonte e o snapshot congelados continuam disponíveis em `data/research/worlds-2017/`.

Cada slot aponta para uma evidência com jogo(s), linha(s) da fonte, evento, métricas, confiança e fórmula. `matches-{year}.json` contém o recorte normalizado necessário para reconstrução offline; `normalization-{year}.json` guarda baselines e ajustes por campeão. `rosters-{year}.json` documenta titulares, reservas e nomes de época. As contagens dos 12 eventos e um agregado por edição foram conferidos com Games of Legends, registrados em `crosschecks.json`; isso não equivale a uma segunda verificação independente de cada partida.

### Oito exceções de cobertura de 2014

O CSV de 2014 não cobre integralmente as ligas chinesa e coreana. Oito slots foram completados com agregados públicos da Leaguepedia: **Watch–Evelynn, Watch–Nocturne, Ggoong–Twisted Fate, NaMei–Caitlyn, FZZF–Morgana, san–Jinx, Cloud–Nami e Cloud–Leona**. [O suplemento](../data/research/multi-era/season-supplement-2014.json) preserva URLs, escopo, contagens e limitações. Esses slots usam B=A e não inventam telemetria por partida. Gilius usa cinco campeões observados diretamente no CSV entre Worlds, EU LCS e EU Challenger, com o time de origem preservado.

O arquivo oficial Data Dragon 4.14.2 contém splash-base para apenas três dos 55 pares usados em 2014. Os outros 52 usam explicitamente o ícone quadrado do mesmo patch como fallback visual, registrado no manifesto; nenhuma arte moderna foi apresentada como splash histórico.

### Cinco exceções de cobertura de 2015

A planilha OE não cobre a temporada chinesa de 2015. Cinco slots foram completados com observações públicas do Games of Legends: **AmazingJ–Shen, Zz1tai–Maokai, Kid–Vayne, Acorn–Shen e Acorn–Maokai**. [O suplemento](../data/research/multi-era/season-supplement-2015.json) contém as URLs, o escopo, as contagens e as limitações.

AmazingJ–Shen tem uma partida comprovada, de 26/06/2015 (2/1/18); não afirmamos que era seu campeão mais frequente no Summer. Zz1tai usa o filtro S5 Summer com playoffs/qualificatórias e Worlds, mas Maokai não aparece no Worlds. Kid e Acorn usam agregados do Summer regular. Não foram fabricadas datas de estreia, partidas ou métricas ausentes. A seleção nesses cinco casos é entre os campeões documentados disponíveis, uma exceção explícita à cobertura sazonal integral desejada.

O coeficiente de confiança de desempenho específico é **zero** nesses cinco slots: B=A, e o componente de frequência é usado apenas quando o denominador está documentado. Isso não significa dúvida de que o campeão foi jogado; significa falta de métricas suficientes para estimar seu desempenho. AmazingJ recebe C=0 por não haver denominador sazonal completo. A interface identifica a evidência parcial.

## Seleção G1–G5 e modelo histórico

Selecionamos os cinco campeões mais usados pelo jogador no evento principal; empates de frequência usam a primeira aparição. Esses cinco são ordenados por estreia para definir G1–G5. Se houver menos de cinco, acrescentamos campeões distintos observados no Summer, depois qualificatórias, MSI, Spring e Winter, conforme disponibilidade; no fallback, frequência e aparição mais recente desempataram. Não há preenchimento aleatório. Os cinco casos complementares acima têm limitações próprias documentadas.

Em 2021, Bean entrou no Worlds pela Fnatic como substituto emergencial e registrou apenas quatro campeões distintos no evento. O quinto slot usa seu Aphelios documentado em oito jogos pela Fnatic Rising no EU Masters Summer, com o time e o evento de origem explícitos na evidência; a normalização desse evento inclui toda a população disponível no CSV, não apenas Bean.

`historicalScore` mantém o modelo de 2017: métricas normalizadas por evento e posição, ajuste empírico de dano/recursos por campeão, regressão à média para amostras pequenas. Eficiência (log de KDA por jogo), participação em abates, dano, parcela de dano, diferenças de ouro/CS/XP aos 15 minutos e visão entram com pesos por posição. Win rate é evidência, sem bônus adicional de sucesso do time.

A = desempenho geral do jogador, reduzido pela amostra N/(N+5). B = A + confiança × (desempenho do campeão − A), com n/(n+5), cobertura de métricas e fator 0,65 para temporada. C = frequência relativa, com redução de 50% para temporada. `historicalScore = 0,35 A + 0,50 B + 0,15 C`. Métricas ausentes reduzem cobertura; não viram zeros fictícios. Pesos e parâmetros completos estão nos scripts e arquivos de normalização.

A versão `worlds-2017-v1.0.0`, seus 75 scores, pools e arquivos originais permanecem congelados. Os testes e a simulação antiga passaram a importar explicitamente esse snapshot; a produção importa o conjunto multi-era.

## Calibração global de gameRating

```text
gameRating = round(clamp(84,5 + 5 × (historicalScore − médiaGlobalDaPosição) / desvioGlobalDaPosição, 70, 99))
```

É a mesma transformação para todos os jogadores, anos e regiões. As médias e desvios são calculados sobre os 3.925 slots, separados apenas por posição para controlar inflação estrutural de roles. Centro 84,5 e dispersão 5 são parâmetros de design publicados, não ajustes por nome. Não se impõe uma quantidade de notas 99 nem se igualam as médias de cada ano/região. Novas edições exigirão uma nova versão de calibração, pois alteram essa população.

| Posição | Média de historicalScore | Desvio | Slots |
|---|---:|---:|---:|
| TOP | 53.9426 | 11.4007 | 785 |
| JUNGLE | 53.4884 | 9.6900 | 785 |
| MID | 54.1670 | 10.5247 | 785 |
| ADC | 55.5763 | 10.7593 | 785 |
| SUPPORT | 54.7332 | 10.4077 | 785 |

O ranking é relativo aos participantes e às métricas disponíveis de cada evento. A transformação melhora a comparabilidade de escala, mas não prova equivalência causal entre eras, metas e adversários. A associação jogador–campeão e o score histórico são distintos da nota usada no jogo.

## Sorteio e trocas

Cada posição sorteia o ano uniformemente entre os elegíveis, depois a região válida daquele ano. Não se força variedade entre posições. Os pools têm de três a cinco candidatos; a oferta mostra exatamente três, com subconjuntos amostrados uniformemente quando há mais opções.

`DRAFT_CONFIG` centraliza três trocas por draft e as durações de feedback. Trocar ano preserva região/posição; trocar região preserva ano/posição; trocar jogadores preserva o contexto e favorece novas pessoas. Ações impossíveis ficam desabilitadas e não consomem saldo. O estado rejeitado inclui o conjunto de IDs, independentemente da ordem. O histórico é local à posição; alternativas ainda não rejeitadas têm prioridade até esgotarem.

## Simulações e estratégias

Foram executadas **100,000 campanhas**: 10.000 por cenário, com streams LCG32 determinísticos separados para sorteio, escolha, trocas e partidas. As mesmas sementes por índice facilitam a comparação entre políticas. A política BO5 e a heurística com orçamento zero são controles equivalentes. Seeds e resultados completos: [simulation.json](../data/research/multi-era/simulation.json).

O estudo reutiliza `teamStrength`, `winProbability`, `formatFor`, `seriesDone` e `advanceTournament`. Adversários são os 157 elencos completos, uniformes e sem repetição até esgotamento, como no motor. Apenas a narrativa/KDA visual é omitida para acelerar; esses recursos são cobertos pelos testes do jogo. Não há antecipação do vencedor para escolher cartas.

G1/BO3/BO5 maximizam a média dos slots correspondentes. Composição avalia cada candidato com o time parcial já escolhido, usando o score real de composição e rating esperado 84,5 para posições faltantes; é uma heurística marginal, não busca ótima nem amostragem das sinergias futuras. Reroll usa BO5 e troca apenas quando a melhora esperada do melhor candidato na oferta supera **1,5 ponto** (`EXCHANGE_GAIN_THRESHOLD`). Ela consulta a distribuição de ofertas possíveis, não a próxima realização do RNG. Sua expectativa não modela perfeitamente o histórico de rejeições.

| Estratégia | Força G1 | Força BO3 | Força BO5 | Título | Eliminação no Suíço | Trocas usadas |
|---|---:|---:|---:|---:|---:|---:|
| random | 84.67 | 84.51 | 84.25 | 7.68% | 50.36% | 0.00 |
| g1 | 87.72 | 87.25 | 86.88 | 23.42% | 26.97% | 0.00 |
| bo3 | 87.42 | 87.46 | 87.14 | 24.68% | 27.18% | 0.00 |
| bo5 | 87.40 | 87.44 | 87.17 | 24.78% | 27.25% | 0.00 |
| composition | 87.33 | 87.39 | 87.14 | 24.49% | 27.83% | 0.00 |
| reroll | 88.99 | 89.09 | 88.85 | 40.25% | 16.95% | 2.38 |

A escolha BO3/BO5 supera o aleatório. A heurística de composição não mostrou ganho robusto sobre BO5 nesta configuração; parte dos bônus satura e a avaliação parcial não antecipa todas as sinergias. Com 10.000 amostras por cenário, a taxa de título BO5 de 24.78% tem erro padrão aproximado de 0.43 ponto percentual; diferenças pequenas entre as heurísticas não sustentam uma superioridade robusta.

### Valor das trocas

| Limite | Título | Eliminação Suíço | Força BO5 | Uso médio |
|---:|---:|---:|---:|---:|
| 0 | 24.78% | 27.25% | 87.17 | 0.00 |
| 1 | 30.56% | 23.07% | 87.84 | 0.96 |
| 2 | 35.95% | 19.53% | 88.42 | 1.78 |
| 3 | 40.25% | 16.95% | 88.85 | 2.38 |
| 5 | 44.65% | 14.46% | 89.30 | 3.00 |

**Recomendação: manter três como padrão inicial de teste**, não como ótimo comprovado. O uso médio é 2.38; subir de três para cinco traz aproximadamente mais 4.40 pontos percentuais de títulos e reduz a dificuldade. Duas trocas são uma alternativa mais exigente (35.95%). Três preservam restrição real e oferecem agência, mas já elevam bastante o sucesso sobre a ausência de trocas.

## Dominância, distribuição e diversidade

| Grupo | Média G1 | Média BO3 | Média BO5 |
|---|---:|---:|---:|
| year: 2014 | 86.70 | 86.05 | 85.46 |
| year: 2015 | 84.63 | 84.42 | 83.89 |
| year: 2016 | 85.15 | 84.97 | 84.65 |
| year: 2017 | 85.58 | 85.46 | 85.13 |
| year: 2018 | 85.08 | 85.35 | 85.12 |
| year: 2019 | 85.12 | 85.26 | 84.88 |
| year: 2020 | 85.60 | 85.34 | 85.06 |
| year: 2021 | 84.71 | 84.36 | 84.17 |
| year: 2022 | 84.29 | 84.40 | 84.03 |
| year: 2023 | 84.57 | 84.33 | 84.06 |
| year: 2024 | 85.26 | 84.80 | 84.45 |
| year: 2025 | 83.59 | 83.66 | 83.56 |
| region: LCK | 87.31 | 87.20 | 86.85 |
| region: LPL | 86.22 | 85.89 | 85.52 |
| region: LEC | 83.09 | 83.11 | 82.85 |
| region: LCS | 82.99 | 82.81 | 82.50 |
| region: LTA S | 80.20 | 80.53 | 80.40 |
| region: LCP | 83.07 | 82.76 | 82.49 |
| role: TOP | 84.94 | 84.78 | 84.48 |
| role: JUNGLE | 85.04 | 84.89 | 84.51 |
| role: MID | 84.93 | 84.69 | 84.49 |
| role: ADC | 85.18 | 84.93 | 84.52 |
| role: SUPPORT | 84.76 | 84.79 | 84.48 |

A diferença entre as médias anuais BO5 é de aproximadamente 1.90 ponto; entre LCK e LCS, 4.35. A média por posição fica perto de 84,5 como consequência da calibração. Isso controla inflação de role, mas **não elimina dominância regional**. Não foram adulterados dados para igualar regiões.

Dominância abaixo significa superar ou empatar G1, BO3 e BO5, sendo estritamente melhor em pelo menos um. Não inclui vantagem de composição contextual.

| Jogador | Dominados no mesmo pool | Dominados de outras eras / mesma posição |
|---|---:|---:|
| dandy-2014-ssw | 2 | 145 |
| rookie-2018-ig | 2 | 145 |
| bang-2016-skt | 2 | 143 |
| mata-2018-kt | 2 | 143 |
| uzi-2019-rng | 2 | 143 |
| canyon-2020-dwg | 2 | 143 |
| uzi-2017-rng | 2 | 142 |
| mata-2014-ssw | 2 | 141 |
| karsa-2020-tes | 3 | 141 |
| 369-2022-jdg | 3 | 141 |

Casos como Uzi 2019 e Canyon 2020 tornam algumas ofertas fáceis de otimizar por rating. Os IDs dominados estão no JSON completo, assim como contagens de oferta/escolha por jogador, distribuições de força, composição e rating por role para cada política.

### Rejeições e escolhas com três trocas

| Região | Ofertas rejeitadas | Jogadores escolhidos |
|---|---:|---:|
| LCK | 0 | 18213 |
| LCP | 0 | 534 |
| LCS | 0 | 6569 |
| LEC | 0 | 7385 |
| LPL | 0 | 17295 |
| LTA S | 0 | 4 |
| [object Object] | 23845 | 0 |

| Ano | Ofertas rejeitadas | Jogadores escolhidos |
|---|---:|---:|
| 2014 | 2572 | 4677 |
| 2015 | 1853 | 3752 |
| 2016 | 1701 | 3621 |
| 2017 | 1403 | 3834 |
| 2018 | 1534 | 4234 |
| 2019 | 2338 | 4163 |
| 2020 | 1803 | 4496 |
| 2021 | 2031 | 4352 |
| 2022 | 2424 | 4487 |
| 2023 | 2476 | 4273 |
| 2024 | 1994 | 3793 |
| 2025 | 1716 | 4318 |

Trocas por tipo: {'players': 2150, 'region': 16018, 'year': 5677}. Os totais de rejeição de jogadores contam as três pessoas presentes em cada oferta rejeitada, não decisões explícitas sobre cada pessoa.

### Distribuição dos 3.925 ratings

| Nota | Quantidade |
|---:|---:|
| 70 | 1 |
| 71 | 1 |
| 72 | 5 |
| 73 | 2 |
| 74 | 29 |
| 75 | 48 |
| 76 | 106 |
| 77 | 163 |
| 78 | 166 |
| 79 | 187 |
| 80 | 225 |
| 81 | 239 |
| 82 | 235 |
| 83 | 286 |
| 84 | 266 |
| 85 | 295 |
| 86 | 277 |
| 87 | 279 |
| 88 | 221 |
| 89 | 204 |
| 90 | 195 |
| 91 | 153 |
| 92 | 112 |
| 93 | 103 |
| 94 | 52 |
| 95 | 32 |
| 96 | 27 |
| 97 | 7 |
| 98 | 5 |
| 99 | 4 |

Em **10,000 drafts adicionais**: 9,439 sequências distintas de ano/região, 10,000 times finais únicos, 505 ofertas distintas. Foram 49,495 repetições de oferta em 50,000 posições: os pools pequenos tornam essa repetição inevitável, mesmo com grande variedade de equipes.

Média de **4.23 eras** e **3.13 regiões** por equipe. A frequência de cada PlayerVersion está no JSON; não há garantia artificial de cinco anos diferentes. A heurística com três trocas ficou em 4.23 eras e 2.90 regiões, indicando concentração regional ao otimizar.

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

850 pares campeão/ano usam assets históricos de arquivos oficiais Riot/Data Dragon: **1700 registros**, com SHA-256, versão, origem e fallbacks explícitos no [manifesto](../data/research/multi-era/asset-manifest.json). Os retratos não validados não foram acrescentados; cada carta mostra o campeão G1. O arquivo e manifesto original de 2017 permanecem intactos. Os novos campeões receberam tags de arquétipo explícitas, que são hipóteses do motor e não estatísticas medidas. Essas tags amplas não modelam todos os reworks entre eras.

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

A auditoria valida cada associação, cinco campeões distintos, 235 pools, limites/calibração, hashes dos assets, evento principal e o congelamento de 2017. Os testes cobrem trocas impossíveis, saldo, contexto, reprodutibilidade do RNG, novas ofertas, escolha única, cinco posições, overflow mobile, BO1/BO3/BO5 e reprodução automática com pausa e KDA. `data:build`, `data:validate`, `data:simulate` e `data:report` continuam disponíveis para o estudo original de 2017.

## Riscos e próxima validação

1. A superioridade regional é substancial; procurar LCK/LPL é uma política forte. Não recomendamos promover esta versão como competitivamente balanceada.
2. As cinco evidências complementares chinesas de 2015 precisam de cobertura sazonal completa para aplicar a mesma seleção/normalização integral aos slots.
3. Comparar estatísticas relativas de diferentes metas não prova capacidade absoluta entre eras. Mudanças de elenco e adversários afetam os scores.
4. A estratégia de composição é simples e não demonstrou ganho mensurável; convém melhorar a busca antes de concluir que composição não importa.
5. Há apenas 505 ofertas distintas: familiaridade pode tornar as escolhas repetitivas, apesar das equipes finais variadas.
6. Não houve teste com usuários reais sobre compreensão, sensação de controle ou vontade de repetir. O próximo teste deve medir abandono, tempo de escolha, uso das trocas e repetição voluntária.
7. O Suíço é a campanha individual do usuário, não uma tabela completa de todos os times. KDA/eventos são apresentação fictícia de um resultado probabilístico, sem combate, ouro ou itens.

A próxima decisão de produto deve usar testes com pessoas e estas métricas como referência, mantendo os dados históricos versionados.
