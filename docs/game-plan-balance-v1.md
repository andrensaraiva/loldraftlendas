# Planos de Jogo — Calibração v1

Atualizado em 14 de setembro de 2026. Este relatório registra a calibração reproduzível da fase 2.4 sobre o dataset `multi-era-v1.6.0`.

## Regra implementada

O plano é escolhido depois do draft e permanece fixo durante a campanha:

| Plano         | Tags procuradas                  |
| ------------- | -------------------------------- |
| Agressão      | `EARLY_GAME`, `ENGAGE`           |
| Teamfight     | `TEAMFIGHT`, `FRONTLINE`, `PEEL` |
| Controle/Pick | `PICK`, `POKE`, `CONTROL`        |
| Escala        | `SCALING`, `CARRY`, `PEEL`       |

A compatibilidade é alta quando todas as tags do plano aparecem na composição, média quando ao menos uma aparece e baixa quando nenhuma aparece. O modificador final é, respectivamente, `+1,5`, `+0,5` ou `−1,0` ponto de força. Ratings e a fórmula 80/20 não mudam. O adversário histórico não recebe um plano artificial.

## Método

O comando `npm run data:plans:simulate` executa cinco cenários de 20.000 campanhas, totalizando 100.000. Cada índice reutiliza seeds independentes e pareadas para draft, escolha, adversário e resultado. As escolhas são uniformes entre as três opções públicas; não há conhecimento antecipado do sorteio seguinte nem seleção do melhor plano para o time.

Isso isola o efeito de manter cada plano fixo sobre equipes variadas. A simulação reutiliza `teamStrength`, `winProbability`, `formatFor`, `seriesDone` e `advanceTournament`; apenas a narrativa visual da partida é omitida.

## Resultado

| Cenário       | Título | Eliminado no Suíço | Força média | Efeito médio | Baixa | Média |  Alta |
| ------------- | -----: | -----------------: | ----------: | -----------: | ----: | ----: | ----: |
| Sem plano     |  8,10% |             50,28% |       84,24 |         0,00 |     — |     — |     — |
| Agressão      | 12,05% |             42,97% |       85,12 |        +0,88 |  6,0% | 47,0% | 47,0% |
| Teamfight     | 12,85% |             41,90% |       85,28 |        +1,04 |  0,7% | 44,0% | 55,3% |
| Controle/Pick | 10,71% |             45,51% |       84,87 |        +0,63 |  3,9% | 77,0% | 19,1% |
| Escala        | 12,59% |             41,73% |       85,24 |        +1,01 |  2,3% | 43,7% | 54,1% |

Todas as probabilidades permaneceram entre 8% e 92%. A maior distância entre planos foi de 2,14 pontos percentuais na taxa de título. Teamfight e Escala encontram todas as suas tags com mais frequência; Controle/Pick é mais situacional. A interface mostra a compatibilidade por composição para que essa diferença seja uma decisão observável, não um multiplicador oculto.

## Limites

- A amostra mede estabilidade e distribuição, não diversão ou entendimento por pessoas reais.
- A política uniforme não representa jogadores que escolhem o plano mais compatível com o time.
- A taxa de título acumulada amplifica modificadores pequenos ao longo de várias séries; por isso o relatório compara também a força média.
- Mudanças futuras nas tags ou no dataset exigem nova execução antes de alterar os pesos.

Dados completos: [`../data/research/game-plans/simulation.json`](../data/research/game-plans/simulation.json).

## Reprodução

```sh
npm ci
npm test
npm run data:plans:simulate
```
