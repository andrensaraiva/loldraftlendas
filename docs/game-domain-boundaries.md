# Fronteiras do Domínio: League of Legends e Motor

Este documento identifica o que é específico de League of Legends sem prometer que o produto seja agnóstico a jogos. O objetivo é impedir que regras históricas, nomes e assets vazem para partes que podem continuar puras e testáveis.

## Específico de League of Legends

- `src/data/`: jogadores, campeões, posições, regiões, eventos, Data Dragon e evidências históricas.
- `src/game/types.ts`: as cinco posições, os cinco slots G1–G5 e as tags de composição.
- `src/game/regions.ts`: famílias LCK, LPL, LEC/LCS e os fallbacks de grupos do draft.
- `src/game/recap.ts`: linguagem narrativa como dragão, Barão, rota e KDA.
- `src/App.tsx` e componentes: Worlds, campeões, posições, créditos e o aviso exigido pela Riot Games.
- Scripts em `scripts/data/`: ingestão, normalização, calibração, patches, assets e proveniência do ecossistema de LoL.

## Núcleo reutilizável com adaptações

- O RNG injetável, o avanço de séries e o ciclo Suíço/playoffs em `src/game/engine.ts` são funções puras, mas os parâmetros atuais representam o formato deste produto.
- Save versionado, controles de reprodução e fila de analytics não dependem dos assets da Riot, embora seus eventos ainda usem termos do draft.
- `DataRepository` é a fronteira de carregamento. Outro domínio teria de fornecer contratos equivalentes, não apenas trocar o JSON.
- A escolha de candidatos e as trocas são reutilizáveis como mecânica, mas hoje operam sobre `Role`, `PlayerVersion` e grupos regionais de LoL.

## Regra para futuras mudanças

1. Dados, textos, fontes e assets de LoL permanecem nas camadas acima.
2. Funções puras não devem importar React, navegador, Data Dragon ou arquivos de pesquisa.
3. Não generalizar tipos antecipadamente: outro jogo deve receber um adaptador explícito e testes próprios.
4. Alterar a população histórica exige nova versão de dataset e recalibração global dos ratings.
5. Remover LoL exigiria substituir dados, composição, narrativa e apresentação; não é correto anunciar o motor atual como universal.

## Limite jurídico

Separação arquitetural não concede licença de uso. O produto mantém o aviso oficial visível e registra a fonte vigente no [inventário de readiness](historical-readiness-2011-2025.md). Qualquer monetização, publicação em loja, uso de API ou mudança relevante de distribuição exige nova revisão das políticas atuais e, quando aplicável, registro/aprovação no portal da Riot.
