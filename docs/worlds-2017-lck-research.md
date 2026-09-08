# Draft Lendas — pesquisa Worlds 2017 / LCK

Documento para revisão de dados, desenvolvimento e avaliação do protótipo. Pesquisa em 7 de setembro de 2026. Método `worlds-2017-v1.0.0`.

O conjunto jogável contém 15 versões de jogadores, três opções por posição e 75 associações comprovadas entre jogador e campeão. São 69 slots do Main Event e seis do Summer. **Os ratings são estimativas do modelo, não notas oficiais nem estatísticas históricas observadas.** A distribuição resultante fica entre 81 e 92; não foi ajustada para preencher faixas ou reproduzir reputações.

A evidência histórica melhora a identidade do draft, mas não garante escolhas igualmente atraentes. Pelas três médias individuais, há um favorito em cada posição. A composição produz algumas inversões; outras escolhas continuam dominadas. A seção de balanceamento mostra ambos os resultados. Não alteramos ratings para forçar igualdade.

## Escopo e fontes

O recorte é o Main Event, de 5 de outubro a 4 de novembro de 2017, incluindo desempates dos grupos. São 80 partidas, 800 linhas individuais e 85 jogadores de todas as regiões na população de comparação. O total de partidas coincide com o [Games of Legends — torneio](https://gol.gg/tournament/tournament-stats/World%20Championship%202017/). Todos os registros selecionados indicam patch 7.18. Play-in não entra na normalização.

O arquivo de 2017 atribuído ao Oracle's Elixir foi obtido em um [download público do Google Drive](https://drive.google.com/uc?export=download&id=11fx3nNjSYB0X8vKxLAbYOrS2Bu6avm9A), localizado em uma [configuração pública de pipeline](https://github.com/HerrKurz/Esports_Data_Pipeline/blob/master/config.py). A página atual de downloads do produtor retornou 403. A identidade do arquivo não foi autenticada diretamente pelo produtor; SHA-256 e caminho de descoberta estão preservados em `sources.json`.

O recorte foi comparado com um [espelho público do mesmo conjunto OE](https://github.com/ZD2525/Basic-Exploratory-Data-Analysis). As 800 linhas coincidem nos picks, resultados, K/D/A, DPM, dano relativo e diferenças aos 15 minutos, dentro da precisão decimal. Esse espelho não é uma segunda fonte estatística independente. As diferenças de grafia/codificação estão em `validation.json`: An/Anex, C7N/Optimus, Hans Sama/Hans sama, Ignar/IgNar e Fenerbahçe com codificação corrompida no espelho. O cruzamento usa partida, lado e posição, sem fundir pessoas por semelhança de nome.

A validação independente usa o [Games of Legends — jogadores](https://gol.gg/players/list/season-ALL/split-ALL/tournament-World%20Championship%202017/): jogos, vitórias, KDA, DPM e KP dos 18 participantes coreanos. `crosschecks.json` registra os números arredondados consultados, com tolerâncias explícitas. As seis associações complementares foram conferidas nas páginas individuais do Summer. As estatísticas detalhadas e os IDs por partida vêm do arquivo estruturado, não foram preenchidos manualmente.

Leaguepedia apresentou restrição de acesso durante a pesquisa; não houve tentativa de contorno. A referência antiga da Riot às equipes também não pôde ser recuperada de forma estável. Não as tratamos como prova de conteúdo não lido. Participação efetiva e posições são sustentadas pelos registros de partidas e pelo gol.gg. A pesquisa valida os 18 jogadores que entraram em jogo; não afirma enumerar toda inscrição administrativa, comissão técnica ou reserva sem participação.

## Regras de seleção e ordem

Cada equipe fornece o jogador com mais partidas naquela posição. Peanut tem 10 partidas e Blank, nove; por isso Peanut é a versão jogável inicial de SKT. Ignorar Blank sem explicação distorceria a campanha: ele participou de quase metade dos jogos. A solução proposta para uma etapa futura é uma variante explícita de elenco SKT com Blank, substituindo Peanut dentro da mesma opção de equipe, sem misturar suas estatísticas. Não implementamos essa expansão. Haru e Rascal têm uma partida cada; permanecem no acervo de pesquisa e na normalização, mas não criam uma quarta opção no draft. [Participantes e contagens no gol.gg](https://gol.gg/players/list/season-ALL/split-ALL/tournament-World%20Championship%202017/).

1. Se houver mais de cinco campeões no Worlds, selecionar os cinco mais utilizados. Desempatar pela primeira aparição e, apenas em empate de timestamp, pelo nome do campeão. A frequência identifica escolhas representativas; o rating nunca participa da seleção.
2. Ordenar os campeões selecionados pela primeira aparição cronológica no Main Event. Portanto, G1 é a primeira aparição **entre os cinco selecionados**, não necessariamente o primeiro pick absoluto da campanha. Campeões excluídos continuam na tabela completa de pesquisa.
3. Se houver menos de cinco, manter todos os picks do Worlds e completar com Summer 2017, incluindo playoffs, pela frequência; desempatar pela aparição mais recente e depois pelo nome. Acrescentar ao fim, sem reordenar os slots do Worlds.
4. Os seis complementos foram encontrados no Summer. Não foi necessário avançar para Regional Qualifier, MSI ou Spring. O pipeline desta edição falha se o Summer deixar de fornecer cinco escolhas; não implementa uma busca silenciosa em outros eventos.

O Summer de comparação contém 233 partidas e 2.330 linhas individuais, de 30 de maio a 26 de agosto. O filtro exclui a promoção de abril que o CSV também rotula como Summer. A página “LCK Summer 2017” do gol.gg separa playoffs; por isso alguns totais de jogadores diferem do nosso Summer combinado. Nenhuma das seis associações complementares tem partidas adicionais nos playoffs: suas contagens, vitórias e KDA coincidem diretamente com as páginas consultadas.

G1–G5 são slots de jogo, não a ordem dos cinco primeiros jogos históricos. Cada série reinicia em G1. BO1 usa G1; BO3 pode chegar a G3; BO5 pode chegar a G5. Não há reorder por força, fama ou necessidade de balanceamento.

## Estatísticas e normalização

`matches.json` preserva partida, data, lado, patch, jogador, equipe, posição, campeão, resultado, K/D/A, abates da equipe, duração, DPM, dano relativo, GD/CSD/XPD aos 15, wards por minuto e wards removidas por minuto. Mantém URL original de match history, número da linha do CSV e `sourceId`. URLs antigas de partidas podem ter deixado de funcionar; o snapshot permite auditoria offline.

`player-stats.json` agrega cada jogador por evento/equipe/posição. `player-champion-stats.json` agrega **todos** os campeões efetivamente utilizados, inclusive fora dos 75 slots e pelos substitutos. `normalization.json` registra pesos, médias, desvios e ajustes de cada campeão. Nenhuma métrica necessária está ausente nas 3.130 linhas usadas. Vision score não foi recuperado de forma confiável e não entra no modelo; WPM e WCPM são proxies limitados, não uma reconstrução da qualidade da visão.

KDA exibido = soma(K+A) / max(1, soma(D)). A eficiência usada no rating é a média por partida de `ln(1 + (K+A)/(D+1))`, reduzindo a influência de uma partida sem mortes. KP é a média de `(K+A)/abates da equipe`, convencionada como zero quando a equipe termina sem abates. Excluir essas partidas do denominador inflava o KP e divergia do gol.gg; a regra foi corrigida antes da versão final. `aggregateKp` mantém também a razão entre as somas, que responde a outra pergunta. As duas medidas não são intercambiáveis.

Para dano e recursos de rota, aplicamos uma correção empírica por **campeão + posição + evento**. Para cada métrica `m` (DPM, dano relativo, GD15, CSD15 e XPD15):

```text
offset(campeão, posição, evento, m)
  = n/(n+12) × (média do campeão − média geral da posição)
métrica ajustada por partida = métrica observada − offset
```

São 12 partidas de prior na média da posição. Isso aproxima expectativas de tanques/utility e carries sem conceder bônus subjetivos a Galio. É uma correção parcial, não um controle causal de arquétipo: campeão e jogador continuam confundidos quando poucos jogadores usam um pick. KP e eficiência permanecem observados, pois participação e sobrevivência são parte da contribuição que o modelo quer reconhecer. Supports não recebem peso em dano ou farm.

Agregamos essas métricas por jogador. Em cada evento/posição, cada jogador tem peso igual na média e no desvio populacional da referência, incluindo substitutos. A normalização é `z = (valor − média)/desvio`, limitada a −3…3, seguida de `100 × Φ(z)`, onde Φ é a distribuição normal acumulada. Isso é um escore padronizado, não um percentil empírico nem uma probabilidade de vitória. Desvio zero produz escore 50. Worlds compara todas as regiões entre si na mesma posição; Summer tem sua própria população LCK, sem misturar seus valores brutos com os do Worlds.

Os pesos abaixo são decisões explícitas de modelagem, não parâmetros comprovados por Riot ou por uma previsão fora da amostra:

| Posição | Eficiência | KP | DPM | Dano relativo | GD15 | CSD15 | XPD15 | WPM | WCPM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| TOP | 25% | 15% | 15% | 10% | 15% | 10% | 10% | 0 | 0 |
| JUNGLE | 30% | 30% | 10% | 5% | 10% | 0 | 15% | 0 | 0 |
| MID | 25% | 20% | 10% | 10% | 15% | 10% | 10% | 0 | 0 |
| ADC | 25% | 15% | 20% | 15% | 10% | 10% | 5% | 0 | 0 |
| SUPPORT | 35% | 35% | 0 | 0 | 0 | 0 | 0 | 15% | 15% |

DPM e dano relativo são correlacionados; os pesos representam um orçamento conjunto de dano, não duas provas independentes. O mesmo vale para as três métricas de rota. Não usamos WR no rating: ele permanece auditável nas tabelas, mas não adiciona outra recompensa pelo sucesso coletivo já refletido nas métricas. Assim, 1 vitória em 1 jogo não gera automaticamente uma nota melhor que 6 vitórias em 8 jogos.

## Fórmula do rating e confiança

Se `P` é a média ponderada dos escores normalizados do jogador no Worlds, com `N` partidas:

```text
A = 50 + N/(N+5) × (P−50)
performanceScore = escore ponderado observado da associação jogador/campeão
confidenceScore = n/(n+5) × transferência
transferência = 1 para Worlds; 0,65 para Summer
B = A + confidenceScore × (performanceScore−A)
share = jogos no campeão / jogos do jogador naquele evento
C = 100 × min(1, sqrt(share/0,5)) × relevância do evento
relevância do evento = 1 para Worlds; 0,5 para Summer
score = 0,35A + 0,50B + 0,15C
rating = limitar(70, 99, floor(70 + 29 × score/100 + 0,5))
```

O prior de cinco partidas suaviza **todo** o escore específico, não apenas WR. Uma aparição conserva seu desempenho observado em `performanceScore`, mas contribui apenas 1/6 para o afastamento de B em relação a A. Uma associação Summer de 12 jogos tem confiança `12/17 × 0,65`, inferior à de seis jogos no Worlds (`6/11`). O fator de transferência considera mudanças de patch, adversários e contexto; 0,65 e a meia relevância são hipóteses conservadoras explícitas, não penalidades históricas medidas.

Não aplicamos o componente D de 10% proposto inicialmente. Embora os estágios sejam identificáveis, não há neste MVP um modelo validado de força prévia dos adversários. Premiar fases finais por si só duplicaria sucesso de equipe. Os pesos finais A/B/C são 35/50/15, e D fica `null`, sem “clutch points” manuais. Fases são preservadas na evidência para uma revisão futura.

Confiança é um **peso de regressão heurístico**, não certeza de que a nota está correta nem intervalo estatístico. Na apresentação: baixa <0,35; média de 0,35 até <0,60; alta ≥0,60. Se uma métrica normalizada estiver indisponível, seus pesos são redistribuídos e a cobertura disponível reduz a contribuição específica e a de A; no snapshot atual a cobertura é 100%. Campos observados ausentes não são convertidos em estatísticas inventadas.

O modelo é descritivo e experimental. Não foi calibrado contra partidas futuras; jogadores, adversários, companheiros e picks não foram distribuídos aleatoriamente. A normalização e a correção do campeão usam a própria amostra de 2017, portanto não são validação preditiva fora da amostra. Mais jogos em fases difíceis e contribuições de utility não observadas continuam limitações. Nenhum troféu, ranking de fãs ou reputação entra na fórmula.

## Sanidade histórica: Faker + Galio

O [gol.gg — Faker 2017](https://gol.gg/players/player-stats/48/season-ALL/split-ALL/tournament-World%20Championship%202017/) confirma seis partidas de Galio, quatro vitórias e KDA arredondado 5,4. Os registros individuais mostram 13/9/36, uma partida nas quartas e cinco na semifinal. O pick entra em G4 pela regra cronológica dos cinco selecionados; não foi colocado em G1 para ser mais forte no Suíço.

O cálculo final dá **89**, com performance observada 73,715, confiança 0,5455, A=60,031, B=67,495 e C=79,472. Eficiência e KP têm escores elevados; dano permanece baixo mesmo após ajuste, mas tem peso conjunto de 20% no MID. Isso conserva valor de participação sem inventar uma estatística de proteção ou dar 99 por reputação. Não concluímos que 89 seja uma medida definitiva do impacto histórico de Galio. A ausência de métricas de proteção, roaming e qualidade dos adversários é uma limitação concreta da estimativa.

## Artes, retratos e tags

Ícones e splashes dos 40 campeões utilizados foram extraídos do [arquivo oficial Data Dragon 7.18.1](https://ddragon.leagueoflegends.com/cdn/dragontail-7.18.1.tgz), junto com seus kits em inglês. O manifesto fixa SHA-256 do arquivo e de cada item. O arquivo tem aproximadamente 722 MB e não vai para o bundle nem precisa ser baixado para jogar. O [índice histórico de campeões](https://ddragon.leagueoflegends.com/cdn/7.18.1/data/en_US/champion.json) valida IDs e nomes; “Nunu & Willump” no CSV corresponde ao ID histórico Nunu na população de comparação, sem ser um slot jogável.

`Champion.historicalAssets['2017']` e `championArt(champion, year)` resolvem as imagens em todos os cards, pools, composições e relatórios. Outras eras preservam o caminho padrão existente. Não usamos o endpoint não versionado de splash como prova de arte de 2017. O download direto de um caminho versionado de splash havia falhado; o arquivo completo é uma distribuição pública separada e documentada, não contorno de uma área restrita. Copyright é da Riot: disponibilidade pública não foi interpretada como domínio público ou licença irrestrita.

Não foi validado um conjunto de retratos de 2017 com procedência e uso suficientemente claros. As 15 versões usam o fallback existente de arte do campeão G1, identificado na carta. `portrait-manifest.json` lista individualmente a lacuna, URLs de arquivo conhecidas quando há, crédito, ano real, arquivo e nota de uso. Retratos antigos de Faker 2020/Huni 2018 e outros assets permanecem como acervo/fixtures; não são apresentados como fotos de 2017. Não houve geração de retratos por IA.

As tags foram revisadas como interpretação de composição dos kits 7.18, registrada por campeão em `tag-review.json`. Não são rótulos oficiais da Riot. Foram adicionados 14 campeões ausentes. Entre os já existentes, removemos `AP_DAMAGE` de Lulu: seu dano incidental de suporte não deve, sozinho, satisfazer a recompensa por uma fonte principal de dano mágico. As demais tags relevantes foram conservadas com justificativa no manifesto. A fórmula de composição e o motor não foram alterados.

## Integração e reprodução

`src/data/worlds-2017.json` é o snapshot de produção; `players.ts` o expõe ao mesmo `DataRepository`. Cada slot tem `evidenceId` apontando para `data/research/worlds-2017/evidence.json`. O navegador recebe os 15 jogadores e a identificação da evidência, sem carregar os arquivos extensos de pesquisa. A interface assíncrona continua disponível para uma futura implementação com Firebase ou Supabase, sem adicionar backend nesta etapa.

As 45 versões antigas foram preservadas em `src/data/fixtures/mock-players.ts`, exclusivamente para os testes legados. Draft, ordem de posições, slots fixos, Suíço, BO1/BO3/BO5, sorteio de adversários, autoplay, velocidades e recap continuam com a mesma arquitetura. Com três elencos, adversários voltam a aparecer após esgotar as opções; essa regra já existia. O Suíço é o formato fictício do jogo, não uma reconstrução do formato histórico de 2017. Acontecimentos e KDA gerados no jogo continuam sintéticos.

Com Python 3 e as dependências Node instaladas, execute da raiz:

```text
npm run data:build
npm run data:validate
npm run data:simulate
npm run data:report
npm test
npm run test:e2e
npm run build
```

`data:build` usa o CSV completo quando presente e, caso contrário, o recorte congelado `matches.json`. Os mesmos 3.130 registros regeneram as tabelas, baselines, evidências e ratings offline. Para baixar novamente os originais: `python scripts/data/download_sources.py`; o script verifica os hashes e falha diante de conteúdo alterado. Para extrair as artes novamente: `python scripts/data/import_historical_assets.py --download`; o download grande só ocorre se o arquivo não existir. Os PNG/JPG extraídos já estão no projeto.

`data:simulate` carrega o motor real pelo Vite e usa seed fixa, inclusive o consumo de aleatoriedade do recap. A força média de BO3/BO5 considera todos os slots possíveis com pesos iguais, e não a chance de chegar a cada jogo. A simulação completa respeita encerramento antecipado das séries. Taxa condicional por jogador corresponde a drafts uniformes que o selecionaram, não a uma estimativa causal nem à escolha de pessoas reais.

## Avaliação do produto e limites restantes

Esta edição demonstra viabilidade de um conjunto com evidência rastreável, mas ainda não comprova que todas as decisões do draft sejam interessantes. A dominância de alguns jogadores deve ser avaliada em testes com pessoas. Para uma próxima etapa, vale estudar sensibilidade dos pesos, tratamento de utility/oposição e variantes de elenco como Blank; não há recomendação de alterar silenciosamente o passado para obter igualdade.

As simulações usam somente três adversários históricos e um formato simplificado. Sua taxa de título descreve este jogo e esta política de seleção; não é a probabilidade histórica de qualquer equipe vencer o Worlds. O protótipo conserva a variação aleatória existente de 8% a 92% por partida. Não foram implementados login, ranking, monetização ou publicação.

## Elencos e participação efetiva

| Equipe | Posição | Jogador | Jogos | Vitórias | Versão inicial |
| --- | --- | --- | --- | --- | --- |
| SKT | TOP | Huni | 19 | 11 | Sim |
| SKT | JUNGLE | Peanut | 10 | 6 | Sim |
| SKT | JUNGLE | Blank | 9 | 5 | Substituto documentado |
| SKT | MID | Faker | 19 | 11 | Sim |
| SKT | ADC | Bang | 19 | 11 | Sim |
| SKT | SUPPORT | Wolf | 19 | 11 | Sim |
| SSG | TOP | CuVee | 16 | 13 | Sim |
| SSG | JUNGLE | Ambition | 15 | 12 | Sim |
| SSG | JUNGLE | Haru | 1 | 1 | Substituto documentado |
| SSG | MID | Crown | 16 | 13 | Sim |
| SSG | ADC | Ruler | 16 | 13 | Sim |
| SSG | SUPPORT | CoreJJ | 16 | 13 | Sim |
| LZ | TOP | Khan | 8 | 5 | Sim |
| LZ | TOP | Rascal | 1 | 1 | Substituto documentado |
| LZ | JUNGLE | Cuzz | 9 | 6 | Sim |
| LZ | MID | Bdd | 9 | 6 | Sim |
| LZ | ADC | PraY | 9 | 6 | Sim |
| LZ | SUPPORT | GorillA | 9 | 6 | Sim |

## Estatísticas gerais dos 15 jogadores

Valores observados agregados do Main Event; dano relativo e KP em porcentagem. Fonte das linhas: [Oracle’s Elixir, snapshot](https://drive.google.com/uc?export=download&id=11fx3nNjSYB0X8vKxLAbYOrS2Bu6avm9A).

| Jogador | J/V/D | K/D/A | KDA | DPM | Dano % | KP % | GD15 | CSD15 | XPD15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Huni | 19/11/8 | 36/41/80 | 2.83 | 441.81 | 25.92 | 61.08 | 238.53 | 5.21 | 83.74 |
| Peanut | 10/6/4 | 13/15/47 | 4.00 | 181.62 | 11.40 | 67.40 | -338.70 | -15.30 | -501.80 |
| Faker | 19/11/8 | 45/36/89 | 3.72 | 419.67 | 24.85 | 74.11 | 145.89 | 7.05 | 345.11 |
| Bang | 19/11/8 | 55/26/63 | 4.54 | 587.32 | 32.78 | 59.35 | -293.05 | -0.89 | 22.58 |
| Wolf | 19/11/8 | 8/32/117 | 3.91 | 101.43 | 5.96 | 63.71 | -134.26 | 2.11 | -205.79 |
| CuVee | 16/13/3 | 37/25/80 | 4.68 | 453.50 | 24.94 | 68.66 | 177.00 | 12.25 | 319.81 |
| Ambition | 15/12/3 | 20/29/103 | 4.24 | 232.02 | 12.05 | 75.20 | 52.20 | 9.00 | 49.33 |
| Crown | 16/13/3 | 45/24/76 | 5.04 | 479.39 | 25.33 | 71.89 | -251.00 | -2.88 | -147.44 |
| Ruler | 16/13/3 | 49/17/76 | 7.35 | 651.24 | 32.13 | 67.60 | -1.62 | -1.44 | 125.12 |
| CoreJJ | 16/13/3 | 7/17/128 | 7.94 | 97.62 | 5.34 | 79.69 | 12.81 | 2.50 | 159.12 |
| Khan | 8/5/3 | 24/15/42 | 4.40 | 433.39 | 24.06 | 66.17 | 25.00 | 4.25 | 119.62 |
| Cuzz | 9/6/3 | 15/24/71 | 3.58 | 219.93 | 11.54 | 74.73 | -136.11 | -11.22 | -281.33 |
| Bdd | 9/6/3 | 31/12/55 | 7.17 | 500.23 | 26.02 | 77.69 | 135.44 | 8.67 | 411.00 |
| PraY | 9/6/3 | 36/17/48 | 4.94 | 680.72 | 33.80 | 69.73 | 296.56 | 3.33 | -194.78 |
| GorillA | 9/6/3 | 6/21/89 | 4.52 | 111.21 | 5.72 | 80.13 | 290.22 | 6.78 | 182.56 |

## Pools jogáveis e evidência por slot

WR e KDA referem-se ao evento da linha. “W” é a contagem de jogos no Worlds; complementos têm W=0 e mostram a amostra Summer em N. Confiança é o peso de regressão, não certeza histórica. Todos os cálculos completos estão em `evidence.json`; o ID é `playerId-gN`.

### Huni — SKT — TOP — Worlds 2017

Versão `huni-2017-skt`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/371/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Cho'Gath | 2017-10-06 | 3 | 3 | 66.7% | 2.50 | 20.33 | 87 | Média (0.375) | WORLDS_DATA |
| G2 | Jayce | 2017-10-15 | 4 | 4 | 75.0% | 2.60 | 531.00 | 88 | Média (0.444) | WORLDS_DATA |
| G3 | Trundle | 2017-10-15 | 3 | 3 | 66.7% | 6.80 | 459.33 | 88 | Média (0.375) | WORLDS_DATA |
| G4 | Camille | 2017-10-28 | 2 | 2 | 50.0% | 2.67 | -108.50 | 85 | Baixa (0.286) | WORLDS_DATA |
| G5 | Gnar | 2017-10-28 | 3 | 3 | 66.7% | 3.67 | 173.67 | 86 | Média (0.375) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Gangplank, Jarvan IV, Maokai, Yasuo. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Peanut — SKT — JUNGLE — Worlds 2017

Versão `peanut-2017-skt`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/392/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Jarvan IV | 2017-10-05 | 4 | 4 | 75.0% | 4.29 | -204.75 | 84 | Média (0.444) | WORLDS_DATA |
| G2 | Sejuani | 2017-10-07 | 2 | 2 | 100.0% | 10.50 | -116.00 | 83 | Baixa (0.286) | WORLDS_DATA |
| G3 | Gragas | 2017-10-15 | 4 | 4 | 25.0% | 1.50 | -584.00 | 81 | Média (0.444) | WORLDS_DATA |
| G4 | Elise | 2017-07-02 | 0 | 6 | 66.7% | 3.56 | 99.83 | 81 | Média (0.355) | SEASON_DATA |
| G5 | Rek'Sai | 2017-06-04 | 0 | 4 | 75.0% | 3.89 | 208.00 | 81 | Baixa (0.289) | SEASON_DATA |

Complementos conferidos em [Games of Legends — Summer](https://gol.gg/players/player-stats/392/season-ALL/split-ALL/tournament-LCK%20Summer%202017/).

### Faker — SKT — MID — Worlds 2017

Versão `faker-2017-skt`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/48/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Cassiopeia | 2017-10-05 | 2 | 2 | 50.0% | 2.75 | 533.00 | 86 | Baixa (0.286) | WORLDS_DATA |
| G2 | Orianna | 2017-10-06 | 2 | 2 | 100.0% | 3.50 | -1261.50 | 87 | Baixa (0.286) | WORLDS_DATA |
| G3 | Fizz | 2017-10-07 | 2 | 2 | 100.0% | 9.00 | 288.00 | 87 | Baixa (0.286) | WORLDS_DATA |
| G4 | Galio | 2017-10-20 | 6 | 6 | 66.7% | 5.44 | 141.00 | 89 | Média (0.545) | WORLDS_DATA |
| G5 | Taliyah | 2017-10-20 | 2 | 2 | 50.0% | 3.50 | 319.50 | 86 | Baixa (0.286) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Corki, Karma, Kassadin, Ryze. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Bang — SKT — ADC — Worlds 2017

Versão `bang-2017-skt`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/100/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Kog'Maw | 2017-10-05 | 3 | 3 | 66.7% | 6.33 | -381.00 | 83 | Média (0.375) | WORLDS_DATA |
| G2 | Twitch | 2017-10-06 | 4 | 4 | 100.0% | 17.50 | -598.25 | 85 | Média (0.444) | WORLDS_DATA |
| G3 | Varus | 2017-10-15 | 4 | 4 | 25.0% | 1.67 | 398.00 | 81 | Média (0.444) | WORLDS_DATA |
| G4 | Caitlyn | 2017-10-20 | 2 | 2 | 100.0% | 17.00 | 585.50 | 83 | Baixa (0.286) | WORLDS_DATA |
| G5 | Tristana | 2017-10-20 | 5 | 5 | 40.0% | 2.73 | -300.40 | 83 | Média (0.500) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Vayne. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Wolf — SKT — SUPPORT — Worlds 2017

Versão `wolf-2017-skt`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/101/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Janna | 2017-10-05 | 2 | 2 | 100.0% | 19.00 | 6.50 | 84 | Baixa (0.286) | WORLDS_DATA |
| G2 | Rakan | 2017-10-06 | 1 | 1 | 100.0% | 4.00 | -732.00 | 83 | Baixa (0.167) | WORLDS_DATA |
| G3 | Lulu | 2017-10-07 | 9 | 9 | 44.4% | 2.93 | -109.78 | 83 | Alta (0.643) | WORLDS_DATA |
| G4 | Trundle | 2017-10-20 | 1 | 1 | 100.0% | 13.00 | 333.00 | 83 | Baixa (0.167) | WORLDS_DATA |
| G5 | Leona | 2017-10-28 | 2 | 2 | 50.0% | 4.25 | -196.00 | 82 | Baixa (0.286) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Blitzcrank, Braum, Tahm Kench, Taric. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### CuVee — SSG — TOP — Worlds 2017

Versão `cuvee-2017-ssg`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/216/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Cho'Gath | 2017-10-05 | 4 | 4 | 100.0% | 7.20 | -427.50 | 91 | Média (0.444) | WORLDS_DATA |
| G2 | Maokai | 2017-10-07 | 1 | 1 | 0.0% | 0.00 | -183.00 | 89 | Baixa (0.167) | WORLDS_DATA |
| G3 | Kennen | 2017-10-19 | 3 | 3 | 66.7% | 2.11 | 526.00 | 92 | Média (0.375) | WORLDS_DATA |
| G4 | Shen | 2017-10-19 | 3 | 3 | 100.0% | 31.00 | 217.00 | 92 | Média (0.375) | WORLDS_DATA |
| G5 | Gnar | 2017-10-29 | 3 | 3 | 100.0% | 6.00 | -51.67 | 91 | Média (0.375) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Camille, Trundle. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Ambition — SSG — JUNGLE — Worlds 2017

Versão `ambition-2017-ssg`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/104/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Gragas | 2017-10-05 | 3 | 3 | 100.0% | 11.00 | 49.00 | 87 | Média (0.375) | WORLDS_DATA |
| G2 | Sejuani | 2017-10-07 | 6 | 6 | 66.7% | 3.73 | 134.17 | 87 | Média (0.545) | WORLDS_DATA |
| G3 | Kha'Zix | 2017-10-13 | 2 | 2 | 100.0% | 5.50 | -120.00 | 88 | Baixa (0.286) | WORLDS_DATA |
| G4 | Jarvan IV | 2017-10-29 | 2 | 2 | 50.0% | 2.00 | -101.00 | 86 | Baixa (0.286) | WORLDS_DATA |
| G5 | Lee Sin | 2017-10-29 | 1 | 1 | 100.0% | 2.00 | -399.00 | 85 | Baixa (0.167) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Zac. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Crown — SSG — MID — Worlds 2017

Versão `crown-2017-ssg`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/451/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Taliyah | 2017-10-05 | 4 | 4 | 75.0% | 11.33 | 1.25 | 87 | Média (0.444) | WORLDS_DATA |
| G2 | Ryze | 2017-10-07 | 1 | 1 | 0.0% | 0.00 | -209.00 | 83 | Baixa (0.167) | WORLDS_DATA |
| G3 | Syndra | 2017-10-08 | 2 | 2 | 50.0% | 1.50 | -91.00 | 84 | Baixa (0.286) | WORLDS_DATA |
| G4 | Malzahar | 2017-10-13 | 6 | 6 | 100.0% | 4.36 | -591.67 | 85 | Média (0.545) | WORLDS_DATA |
| G5 | Galio | 2017-10-13 | 2 | 2 | 100.0% | 10.50 | -263.00 | 85 | Baixa (0.286) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Lissandra. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Ruler — SSG — ADC — Worlds 2017

Versão `ruler-2017-ssg`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/685/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Varus | 2017-10-05 | 6 | 6 | 83.3% | 4.80 | 276.83 | 88 | Média (0.545) | WORLDS_DATA |
| G2 | Twitch | 2017-10-07 | 2 | 2 | 50.0% | 3.33 | -447.50 | 85 | Baixa (0.286) | WORLDS_DATA |
| G3 | Tristana | 2017-10-08 | 5 | 5 | 80.0% | 9.75 | -198.80 | 87 | Média (0.500) | WORLDS_DATA |
| G4 | Xayah | 2017-10-13 | 3 | 3 | 100.0% | 28.00 | 67.33 | 88 | Média (0.375) | WORLDS_DATA |
| G5 | Ashe | 2017-06-03 | 0 | 10 | 50.0% | 3.00 | -149.30 | 86 | Média (0.433) | SEASON_DATA |

Complementos conferidos em [Games of Legends — Summer](https://gol.gg/players/player-stats/685/season-ALL/split-ALL/tournament-LCK%20Summer%202017/).

### CoreJJ — SSG — SUPPORT — Worlds 2017

Versão `corejj-2017-ssg`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/257/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Taric | 2017-10-05 | 5 | 5 | 80.0% | 8.40 | -129.80 | 91 | Média (0.500) | WORLDS_DATA |
| G2 | Rakan | 2017-10-07 | 3 | 3 | 66.7% | 3.83 | -48.33 | 88 | Média (0.375) | WORLDS_DATA |
| G3 | Lulu | 2017-10-08 | 4 | 4 | 75.0% | 11.33 | 27.75 | 91 | Média (0.444) | WORLDS_DATA |
| G4 | Janna | 2017-10-13 | 4 | 4 | 100.0% | 12.00 | 222.00 | 91 | Média (0.444) | WORLDS_DATA |
| G5 | Braum | 2017-06-21 | 0 | 12 | 66.7% | 5.67 | 236.33 | 88 | Média (0.459) | SEASON_DATA |

Complementos conferidos em [Games of Legends — Summer](https://gol.gg/players/player-stats/257/season-ALL/split-ALL/tournament-LCK%20Summer%202017/).

### Khan — LZ — TOP — Worlds 2017

Versão `khan-2017-lz`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/982/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Jarvan IV | 2017-10-05 | 3 | 3 | 100.0% | 6.00 | 196.67 | 90 | Média (0.375) | WORLDS_DATA |
| G2 | Nasus | 2017-10-08 | 1 | 1 | 100.0% | 2.00 | 509.00 | 87 | Baixa (0.167) | WORLDS_DATA |
| G3 | Jayce | 2017-10-12 | 1 | 1 | 100.0% | 7.00 | 548.00 | 88 | Baixa (0.167) | WORLDS_DATA |
| G4 | Jax | 2017-10-19 | 1 | 1 | 0.0% | 1.75 | -756.00 | 86 | Baixa (0.167) | WORLDS_DATA |
| G5 | Cho'Gath | 2017-10-19 | 1 | 1 | 0.0% | 3.00 | -418.00 | 87 | Baixa (0.167) | WORLDS_DATA |

Picks do Worlds fora dos cinco selecionados: Trundle. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.

### Cuzz — LZ — JUNGLE — Worlds 2017

Versão `cuzz-2017-lz`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/983/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Kha'Zix | 2017-10-05 | 1 | 1 | 100.0% | 2.00 | -394.00 | 84 | Baixa (0.167) | WORLDS_DATA |
| G2 | Gragas | 2017-10-06 | 4 | 4 | 75.0% | 6.00 | -114.25 | 89 | Média (0.444) | WORLDS_DATA |
| G3 | Sejuani | 2017-10-12 | 1 | 1 | 100.0% | 3.00 | 130.00 | 84 | Baixa (0.167) | WORLDS_DATA |
| G4 | Jarvan IV | 2017-10-12 | 3 | 3 | 33.3% | 2.67 | -168.00 | 86 | Média (0.375) | WORLDS_DATA |
| G5 | Elise | 2017-05-30 | 0 | 12 | 66.7% | 4.04 | -212.75 | 84 | Média (0.459) | SEASON_DATA |

Complementos conferidos em [Games of Legends — Summer](https://gol.gg/players/player-stats/983/season-ALL/split-ALL/tournament-LCK%20Summer%202017/).

### Bdd — LZ — MID — Worlds 2017

Versão `bdd-2017-lz`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/650/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Taliyah | 2017-10-05 | 3 | 3 | 66.7% | 13.50 | -170.33 | 91 | Média (0.375) | WORLDS_DATA |
| G2 | Ryze | 2017-10-06 | 3 | 3 | 100.0% | 13.00 | 420.33 | 91 | Média (0.375) | WORLDS_DATA |
| G3 | Galio | 2017-10-08 | 1 | 1 | 100.0% | 4.00 | 100.00 | 89 | Baixa (0.167) | WORLDS_DATA |
| G4 | Syndra | 2017-10-19 | 1 | 1 | 0.0% | 2.75 | 737.00 | 89 | Baixa (0.167) | WORLDS_DATA |
| G5 | Orianna | 2017-10-19 | 1 | 1 | 0.0% | 1.67 | -368.00 | 88 | Baixa (0.167) | WORLDS_DATA |

### PraY — LZ — ADC — Worlds 2017

Versão `pray-2017-lz`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/221/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Tristana | 2017-10-05 | 1 | 1 | 100.0% | 10.00 | -245.00 | 88 | Baixa (0.167) | WORLDS_DATA |
| G2 | Xayah | 2017-10-06 | 2 | 2 | 50.0% | 4.00 | 903.50 | 88 | Baixa (0.286) | WORLDS_DATA |
| G3 | Varus | 2017-10-08 | 5 | 5 | 60.0% | 4.89 | 96.40 | 90 | Média (0.500) | WORLDS_DATA |
| G4 | Kog'Maw | 2017-10-12 | 1 | 1 | 100.0% | 5.00 | 625.00 | 87 | Baixa (0.167) | WORLDS_DATA |
| G5 | Ashe | 2017-05-30 | 0 | 15 | 73.3% | 5.07 | 486.80 | 88 | Média (0.488) | SEASON_DATA |

Complementos conferidos em [Games of Legends — Summer](https://gol.gg/players/player-stats/221/season-ALL/split-ALL/tournament-LCK%20Summer%202017/).

### GorillA — LZ — SUPPORT — Worlds 2017

Versão `gorilla-2017-lz`. Conferência geral: [Games of Legends](https://gol.gg/players/player-stats/65/season-ALL/split-ALL/tournament-World%20Championship%202017/).

| Slot | Campeão | 1ª aparição | W | N | WR | KDA | GD15 | Rating | Confiança | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Karma | 2017-10-05 | 1 | 1 | 100.0% | 2.50 | -1118.00 | 87 | Baixa (0.167) | WORLDS_DATA |
| G2 | Rakan | 2017-10-06 | 3 | 3 | 66.7% | 5.12 | 611.00 | 90 | Média (0.375) | WORLDS_DATA |
| G3 | Janna | 2017-10-08 | 2 | 2 | 100.0% | 9.00 | 735.00 | 89 | Baixa (0.286) | WORLDS_DATA |
| G4 | Lulu | 2017-10-12 | 2 | 2 | 50.0% | 3.50 | 156.00 | 88 | Baixa (0.286) | WORLDS_DATA |
| G5 | Thresh | 2017-10-19 | 1 | 1 | 0.0% | 4.00 | 115.00 | 88 | Baixa (0.167) | WORLDS_DATA |

## Balanceamento e simulação

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

Reprodução: `npm run data:simulate`. Dados completos: `data/research/worlds-2017/simulation.json`. Método, fontes e pools: este relatório. A simulação não modifica dados de produção.

## Verificação e trilha de auditoria

Conferidos 108 fatos de agregados e 21 fatos de associações com gol.gg, sem divergência nas tolerâncias declaradas. O espelho OE coincide nas 800 linhas para os campos numéricos conferidos. Os testes históricos também validam integridade dos assets, cronologia, origem de cada pick e elencos.

Comandos e resultados finais de verificação ficam em `data/research/worlds-2017/build-verification.json`. Para alterações futuras, os comandos precisam ser executados novamente; este registro descreve o snapshot entregue.

| Arquivo | Finalidade |
| --- | --- |
| matches.json | Recorte congelado para reprodução offline |
| player-stats.json | Agregados por jogador/evento |
| player-champion-stats.json | Todos os picks, não só os cinco selecionados |
| evidence.json | Componentes, rating, confiança e IDs de partidas de cada slot |
| normalization.json | Pesos e referências por evento/posição/campeão |
| rosters.json | Titulares e substitutos que jogaram |
| crosschecks.json / validation.json | Conferência independente e diferenças de aliases |
| sources.json | URLs, editoras e hashes dos originais |
| asset-manifest.json / champion-kits/ | Arquivo histórico e itens extraídos |
| portrait-manifest.json | Lacunas, fotos de arquivo e fallback |
| tag-review.json | Interpretações de composição dos kits 7.18 |
| simulation.json | 10.000 campanhas e todas as comparações |
| claim-ledger.json | Afirmações, fontes e limitações |

## Referências rastreáveis

Consulta em 7 de setembro de 2026; data de publicação dos snapshots estatísticos não informada. Estatísticas correspondem à temporada 2017. URLs individuais de Worlds servem como referência de auditoria; a validação completa de agregados foi feita pela tabela geral, e todos os complementos pelas páginas Summer indicadas.

| ID | Editora / fonte | URL | Observação |
| --- | --- | --- | --- |
| oe-2017 | Oracle's Elixir | [Abrir](https://drive.google.com/uc?export=download&id=11fx3nNjSYB0X8vKxLAbYOrS2Bu6avm9A) | Public download ID located in third-party configuration; publisher downloads page blocked. Archived bytes hashed; not independently authenticated by publisher. |
| oe-worlds-mirror | Oracle's Elixir; mirror by ZD2525 | [Abrir](https://raw.githubusercontent.com/ZD2525/Basic-Exploratory-Data-Analysis/main/2017_LoL_esports_match_data_from_OraclesElixir.csv) | Same underlying statistical producer, not an independent source. |
| ddragon-7.18.1 | Riot Games | [Abrir](https://ddragon.leagueoflegends.com/cdn/7.18.1/data/en_US/champion.json) |  |
| golgg-event | Games of Legends | [Abrir](https://gol.gg/tournament/tournament-stats/World%20Championship%202017/) |  |
| golgg-players | Games of Legends | [Abrir](https://gol.gg/players/list/season-ALL/split-ALL/tournament-World%20Championship%202017/) |  |
| golgg-Huni | Games of Legends | [Abrir](https://gol.gg/players/player-stats/371/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Peanut | Games of Legends | [Abrir](https://gol.gg/players/player-stats/392/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Faker | Games of Legends | [Abrir](https://gol.gg/players/player-stats/48/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Bang | Games of Legends | [Abrir](https://gol.gg/players/player-stats/100/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Wolf | Games of Legends | [Abrir](https://gol.gg/players/player-stats/101/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Blank | Games of Legends | [Abrir](https://gol.gg/players/player-stats/411/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-CuVee | Games of Legends | [Abrir](https://gol.gg/players/player-stats/216/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Ambition | Games of Legends | [Abrir](https://gol.gg/players/player-stats/104/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Crown | Games of Legends | [Abrir](https://gol.gg/players/player-stats/451/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Ruler | Games of Legends | [Abrir](https://gol.gg/players/player-stats/685/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-CoreJJ | Games of Legends | [Abrir](https://gol.gg/players/player-stats/257/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Haru | Games of Legends | [Abrir](https://gol.gg/players/player-stats/683/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Khan | Games of Legends | [Abrir](https://gol.gg/players/player-stats/982/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Cuzz | Games of Legends | [Abrir](https://gol.gg/players/player-stats/983/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Bdd | Games of Legends | [Abrir](https://gol.gg/players/player-stats/650/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-PraY | Games of Legends | [Abrir](https://gol.gg/players/player-stats/221/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-GorillA | Games of Legends | [Abrir](https://gol.gg/players/player-stats/65/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-Rascal | Games of Legends | [Abrir](https://gol.gg/players/player-stats/1061/season-ALL/split-ALL/tournament-World%20Championship%202017/) | Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics. |
| golgg-summer-Peanut | Games of Legends | [Abrir](https://gol.gg/players/player-stats/392/season-ALL/split-ALL/tournament-LCK%20Summer%202017/) | Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games. |
| golgg-summer-Cuzz | Games of Legends | [Abrir](https://gol.gg/players/player-stats/983/season-ALL/split-ALL/tournament-LCK%20Summer%202017/) | Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games. |
| golgg-summer-Ruler | Games of Legends | [Abrir](https://gol.gg/players/player-stats/685/season-ALL/split-ALL/tournament-LCK%20Summer%202017/) | Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games. |
| golgg-summer-CoreJJ | Games of Legends | [Abrir](https://gol.gg/players/player-stats/257/season-ALL/split-ALL/tournament-LCK%20Summer%202017/) | Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games. |
| golgg-summer-PraY | Games of Legends | [Abrir](https://gol.gg/players/player-stats/221/season-ALL/split-ALL/tournament-LCK%20Summer%202017/) | Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games. |

