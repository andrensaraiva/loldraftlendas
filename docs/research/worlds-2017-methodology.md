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
