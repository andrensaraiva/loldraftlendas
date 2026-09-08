# Plano e registro de pesquisa — Worlds 2017 LCK

Escopo: Main Event 2017, três elencos LCK, cinco escolhas por posição; temporadas competitivas de 2017 somente para completar pools. Preservar motor, autoplay e recap. Ratings são estimativas derivadas, não estatísticas oficiais.

Fontes: Riot/arquivos oficiais, Oracle's Elixir, Games of Legends, Leaguepedia; sem rankings opinativos. Não contornar bloqueios.

1. **Concluído:** fontes estruturadas, cobertura, participantes, substitutos e patch.
2. **Concluído:** reconciliação de evidências; 3.130 linhas; agregados e normalização por evento/posição.
3. **Concluído:** metodologia reproduzível, 15 versões / 75 slots e artes oficiais 7.18.1.
4. **Concluído:** relatórios, comparação por posição, 10.000 campanhas, testes e build.

A ferramenta `update_plan` não está disponível nesta sessão (busca por nome sem resultados); este arquivo mantém o planejamento.

## Matriz final de evidências e lacunas

| Questão | Evidência | Próxima ação |
| --- | --- | --- |
| Cobertura estatística | Download público atribuído a OE, hash, espelho de 800 linhas, conferência gol.gg | Alta concordância; autenticação direta pelo produtor indisponível |
| Main Event versus play-in | 80 jogos, 800 linhas, 85 jogadores; 5/out a 4/nov | Resolvido |
| Jungle SKT e substitutos | Peanut 10, Blank 9; Haru 1 e Rascal 1 | Resolvido para participação efetiva; registros administrativos não enumerados |
| Pools de cinco | 69 slots Worlds + seis Summer; todos com IDs de partidas | Resolvido; ratings são estimativas |
| Summer versus promoção | Promoção de abril excluída; 233 jogos incluindo playoffs | Diferença de escopo das páginas gol.gg documentada |
| KP | Zero em jogos sem abates; 108 fatos de jogadores e 21 de associações conferidos | Concordância nas tolerâncias declaradas |
| Assets 7.18 | Arquivo oficial; 120 arquivos para 40 campeões; hashes | Resolvido quanto à procedência; sem presumir licença irrestrita |
| Retratos 2017 | Nenhum conjunto validado; fallback e manifesto individual | Lacuna explicitamente preservada |
| Rating e balanceamento | Regressão, normalização e 10.000 campanhas; enumeração de 81 contextos por opção | Experimental; sem calibração preditiva/causal |

## Acessos limitados

- `https://oracleselixir.com/tools/downloads`: 403 via ferramenta web; não insistir nesse acesso.
- Página do espelho Hugging Face `Finish-him/todas-as-partidas-lol`: 401 via ferramenta web; procurar outra distribuição pública.

## Encerramento

O CSV foi localizado em um download público listado em configuração de terceiro. Leaguepedia teve acesso restrito e a página antiga Riot das equipes foi instável; não servem como prova de conteúdo não lido. A distribuição completa Data Dragon forneceu as artes após o caminho direto de splash não estar disponível. Nenhum bloqueio foi contornado.

Consultas concentradas no arquivo estruturado, tabela completa de agregados, casos Faker/Peanut, cinco páginas Summer e arquivo de assets Riot. Não houve crawl em massa de históricos individuais. As duas pesquisas delegadas inicialmente ficaram indisponíveis; o coordenador retomou e verificou as fontes relevantes diretamente.

Após reconciliar KP, aliases e escopo do Summer, novas buscas amplas não acrescentariam evidência material para estes 75 slots. As lacunas restantes exigem acervo de retratos validado ou outro modelo estatístico.

Relatório: `docs/worlds-2017-lck-research.md`. Afirmações e fontes: `data/research/worlds-2017/claim-ledger.json`. Verificação final: `data/research/worlds-2017/build-verification.json`.
