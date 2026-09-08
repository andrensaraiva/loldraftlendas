# Draft Lendas — balanceamento e simulação de 2017

Resultados do método `worlds-2017-v1.0.0`. Números gerados localmente pelo motor do projeto; não representam probabilidades históricas. Nenhum rating foi alterado em função destes resultados.

## Comparação por posição

G1, média de G1–G3 e média de G1–G5 usam os ratings individuais. DP é o desvio populacional dos cinco slots, não incerteza estatística da nota.

### TOP

| Jogador | G1 | BO3 | BO5 | DP | Mais forte | Mais fraco |
| --- | --- | --- | --- | --- | --- | --- |
| Huni | 87 | 87.67 | 86.80 | 1.17 | Jayce, Trundle | Camille |
| CuVee | 91 | 90.67 | 91.00 | 1.10 | Kennen, Shen | Maokai |
| Khan | 90 | 88.33 | 87.60 | 1.36 | Jarvan IV | Jax |

### JUNGLE

| Jogador | G1 | BO3 | BO5 | DP | Mais forte | Mais fraco |
| --- | --- | --- | --- | --- | --- | --- |
| Peanut | 84 | 82.67 | 82.00 | 1.26 | Jarvan IV | Gragas, Elise, Rek'Sai |
| Ambition | 87 | 87.33 | 86.60 | 1.02 | Kha'Zix | Lee Sin |
| Cuzz | 84 | 85.67 | 85.40 | 1.96 | Gragas | Kha'Zix, Sejuani, Elise |

### MID

| Jogador | G1 | BO3 | BO5 | DP | Mais forte | Mais fraco |
| --- | --- | --- | --- | --- | --- | --- |
| Faker | 86 | 86.67 | 87.00 | 1.10 | Galio | Cassiopeia, Taliyah |
| Crown | 87 | 84.67 | 84.80 | 1.33 | Taliyah | Ryze |
| Bdd | 91 | 90.33 | 89.60 | 1.20 | Taliyah, Ryze | Orianna |

### ADC

| Jogador | G1 | BO3 | BO5 | DP | Mais forte | Mais fraco |
| --- | --- | --- | --- | --- | --- | --- |
| Bang | 83 | 83.00 | 83.00 | 1.26 | Twitch | Varus |
| Ruler | 88 | 86.67 | 86.80 | 1.17 | Varus, Xayah | Twitch |
| PraY | 88 | 88.67 | 88.20 | 0.98 | Varus | Kog'Maw |

### SUPPORT

| Jogador | G1 | BO3 | BO5 | DP | Mais forte | Mais fraco |
| --- | --- | --- | --- | --- | --- | --- |
| Wolf | 84 | 83.33 | 83.00 | 0.63 | Janna | Leona |
| CoreJJ | 91 | 90.00 | 89.80 | 1.47 | Taric, Lulu, Janna | Rakan, Braum |
| GorillA | 87 | 88.67 | 88.40 | 1.02 | Rakan | Karma |

## Dominância individual

A domina B quando não é inferior em G1, média BO3 e média BO5, e é superior em pelo menos uma dessas medidas. Isso não implica vencer cada G isolado nem ser melhor em toda composição.

| Jogador | Domina nas três medidas |
| --- | --- |
| Huni | Nenhum |
| Peanut | Nenhum |
| Faker | Nenhum |
| Bang | Nenhum |
| Wolf | Nenhum |
| CuVee | Huni, Khan |
| Ambition | Peanut, Cuzz |
| Crown | Nenhum |
| Ruler | Bang |
| CoreJJ | Wolf, GorillA |
| Khan | Huni |
| Cuzz | Peanut |
| Bdd | Faker, Crown |
| PraY | Bang, Ruler |
| GorillA | Wolf |

Pelas notas individuais, CuVee, Ambition, Bdd, PraY e CoreJJ dominam as outras duas opções da própria posição. Portanto, a hipótese de haver sempre uma troca clara entre G1 e séries longas **não foi confirmada** neste recorte. A inclusão de tags modifica parte dessa conclusão.

## Efeito da composição: enumeração exaustiva

Para cada posição, mantivemos todas as 81 combinações possíveis das outras quatro posições. Trocamos apenas o jogador da posição examinada e calculamos a força real de equipe (80% rating, 20% composição). Cada célula informa quantos contextos o jogador lidera estritamente; empates na liderança aparecem entre parênteses. São comparações de força média, não cálculos exatos de chance de ganhar uma série.

| Jogador | G1 / 81 | BO3 / 81 | BO5 / 81 |
| --- | --- | --- | --- |
| Huni | 0 (0 emp.) | 0 (0 emp.) | 0 (0 emp.) |
| CuVee | 53 (0 emp.) | 39 (6 emp.) | 78 (0 emp.) |
| Khan | 28 (0 emp.) | 36 (6 emp.) | 3 (0 emp.) |
| Peanut | 9 (0 emp.) | 3 (0 emp.) | 0 (0 emp.) |
| Ambition | 72 (0 emp.) | 63 (0 emp.) | 65 (4 emp.) |
| Cuzz | 0 (0 emp.) | 15 (0 emp.) | 12 (4 emp.) |
| Faker | 36 (0 emp.) | 6 (0 emp.) | 24 (0 emp.) |
| Crown | 0 (0 emp.) | 0 (0 emp.) | 0 (0 emp.) |
| Bdd | 45 (0 emp.) | 75 (0 emp.) | 57 (0 emp.) |
| Bang | 0 (0 emp.) | 0 (0 emp.) | 0 (0 emp.) |
| Ruler | 0 (63 emp.) | 0 (0 emp.) | 4 (2 emp.) |
| PraY | 18 (63 emp.) | 81 (0 emp.) | 75 (2 emp.) |
| Wolf | 0 (0 emp.) | 0 (0 emp.) | 0 (0 emp.) |
| CoreJJ | 81 (0 emp.) | 81 (0 emp.) | 57 (3 emp.) |
| GorillA | 0 (0 emp.) | 0 (0 emp.) | 21 (3 emp.) |

Faker lidera 36/81 contextos de G1 e 24/81 de BO5, apesar da dominância individual de Bdd. Khan também pode superar CuVee com a composição. CoreJJ lidera todos os contextos de G1 e BO3; PraY lidera todos os de BO3. Huni, Crown, Bang e Wolf não lideram nenhum dos três horizontes nos contextos enumerados. Isso sinaliza opções pouco competitivas nesta versão; não justifica editar suas estatísticas.

## 10.000 campanhas completas

Seed `201718`; escolhas uniformes e independentes entre as três opções de cada posição. O motor real foi executado até eliminação ou título, incluindo recap e seu consumo de RNG: 49,681 séries e 100,303 partidas. Oponentes são SKT, SSG e LZ; voltam ao sorteio após esgotar os três elencos.

| Métrica | Resultado |
| --- | --- |
| Força média G1 | 86.76 |
| Força média G2 | 87.83 |
| Força média G3 | 86.17 |
| Força média G4 | 86.29 |
| Força média G5 | 86.00 |
| Força média BO3 | 86.92 |
| Força média BO5 / equipe | 86.61 |
| Força média dos jogos efetivamente disputados | 86.95 |
| Taxa de título | 6.59% |
| Margem binomial aproximada de 95% na taxa de título | ±0.49 ponto percentual |

A margem representa apenas erro Monte Carlo sob esse modelo fixo. Não inclui incerteza de ratings, dados, dependência entre jogadores ou hipóteses do jogo. G1–G5 e médias BO3/BO5 são calculados para cada draft antes do torneio, incluindo jogos que talvez não sejam disputados.

| Resultado | Campanhas |
| --- | --- |
| Eliminado no Suíço | 5197 |
| Quartas de final | 2417 |
| Semifinalista | 1122 |
| Campeão mundial | 659 |
| Vice-campeão | 605 |

## Ofertas e escolhas

Todas as versões são oferecidas em 100% dos drafts da posição, porque há apenas um ano/região e três opções fixas. A seleção fica próxima de um terço por construção; não demonstra preferência humana. Títulos condicionais mostram somente as campanhas aleatórias em que aquela versão foi escolhida.

| Jogador | Ofertado | Selecionado | Aparição | Títulos se escolhido |
| --- | --- | --- | --- | --- |
| Huni | 10000 | 3370 | 33.70% | 4.69% |
| Peanut | 10000 | 3342 | 33.42% | 4.76% |
| Faker | 10000 | 3358 | 33.58% | 7.03% |
| Bang | 10000 | 3329 | 33.29% | 4.66% |
| Wolf | 10000 | 3313 | 33.13% | 3.74% |
| CuVee | 10000 | 3316 | 33.16% | 7.60% |
| Ambition | 10000 | 3295 | 32.95% | 8.29% |
| Crown | 10000 | 3284 | 32.84% | 4.38% |
| Ruler | 10000 | 3315 | 33.15% | 7.45% |
| CoreJJ | 10000 | 3357 | 33.57% | 8.58% |
| Khan | 10000 | 3314 | 33.14% | 7.51% |
| Cuzz | 10000 | 3363 | 33.63% | 6.75% |
| Bdd | 10000 | 3358 | 33.58% | 8.31% |
| PraY | 10000 | 3356 | 33.56% | 7.66% |
| GorillA | 10000 | 3330 | 33.30% | 7.42% |

Reprodução: `npm run data:simulate`. Dados completos: `data/research/worlds-2017/simulation.json`. Método, fontes e pools: [relatório de pesquisa](worlds-2017-lck-research.md). A simulação não modifica dados de produção.
