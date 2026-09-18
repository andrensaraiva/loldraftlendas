# Baseline de Produto v1.6

Registrado em 2026-09-18 antes da refatoração mobile e da nova tela final.

## Contratos preservados

- A campanha usa uma seed e streams determinísticos; relatórios não consomem RNG.
- O plano é único para toda a campanha e mantém os modificadores `+1,5`, `+0,5` e `-1,0`.
- G1–G5 continuam fixos e sem repetição dentro do pool de cada jogador.
- O modo Almanaque oculta ratings, forças e probabilidades até a tela final.
- O save da campanha é versionado separadamente do histórico local.
- Dados públicos não incluem texto livre, e-mail, seed bruta ou identificadores pessoais.

## Dados disponíveis para o relatório

| Origem | Dados derivados |
| --- | --- |
| `Tournament.history` | fases, adversários, formato, placares, vitórias e derrotas |
| `GameResult` | força final, força adversária, probabilidade pré-jogo e resultado sorteado |
| `GameResult.recap` | KDA narrativo final e momentos já sorteados |
| `Team` + catálogo | edições, regiões, G1–G5, ratings e campeões utilizados |
| `gamePlanBreakdown` | compatibilidade, modificador, tags presentes e ausentes |

`CampaignReport` é uma projeção pura dessas fontes. Ele nunca reexecuta uma partida nem atribui causalidade ao KDA narrativo.

## Eventos existentes

O funil atual já cobre sessão, início e conclusão do draft, rolagens, trocas, escolhas, plano, entrada no Worlds, séries, jogos, playoffs, conclusão, replay, retomada, ajuda, detalhes, compartilhamento, feedback, desafio e Desafio Diário.

Eventos adicionais previstos nos pacotes seguintes:

- `campaign_report_opened` e `journey_node_opened`;
- `campaign_paused` e `campaign_abandoned`;
- `onboarding_opened`, `onboarding_completed` e `onboarding_skipped`;
- abertura e comparação de resultados públicos;
- modificador e objetivo do Desafio Diário.

## URLs decididas

- Resultado público: `/resultado/:slug`.
- Comparação: `/resultado/:slug/comparar/:otherSlug`.
- Slugs serão opacos e não sequenciais.
- A página pública terá bundle separado e aceitará payloads antigos somente para leitura.
- Open Graph dinâmico será servido por função edge/server-side quando a hospedagem for definida.

## Orçamento de retratos

- retrato moderno: até 120 kB;
- silhueta: até 30 kB;
- proporção mestre: `4 / 5`;
- dimensões entregues: 480 × 600 px;
- uma identidade canônica reutilizável entre edições;
- dimensões sempre reservadas no layout;
- carregamento lazy fora da opção inicialmente visível.

## Baseline visual

As imagens em `docs/screenshots/baseline/` registram o draft antes da refatoração nos viewports obrigatórios: 360 × 800, 390 × 844, 412 × 915, 430 × 932, tablet 768 × 1024 e desktop 1440 × 1000.
