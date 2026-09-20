# Pipeline de Retratos de Jogadores

## Estado do piloto

O lote `pilot-v1` contém dez identidades e foi **aprovado pelo responsável do projeto em 2026-09-20**. As dez entradas estão como `approved`: o produto mostra o retrato mestre e mantém silhueta e avatar CSS como fallbacks seguros. A direção visual está liberada para expansão gradual do catálogo.

[Abrir a prancha dos dez retratos](screenshots/portrait-pilot-v1.webp)

| Jogador | Função representada | Região de referência | Estado |
| --- | --- | --- | --- |
| Bin | TOP | China | aprovado |
| Caps | MID | Europa | aprovado |
| CoreJJ | SUP | América do Norte/Coreia | aprovado |
| Doublelift | ADC | América do Norte | aprovado |
| Faker | MID | Coreia | aprovado |
| Huni | TOP | Coreia/América do Norte | aprovado |
| Jankos | JG | Europa | aprovado |
| Karsa | JG | Taiwan/LCP | aprovado |
| Meiko | SUP | China | aprovado |
| Zeus | TOP | Coreia | aprovado |

## Direção visual e prompt-base

Os mestres foram produzidos com a ferramenta integrada de geração de imagens, uma chamada independente por identidade. Não foi usada fotografia dentro do produto nem geração por lote que repetisse um único rosto.

```text
Use case: stylized-concept
Asset type: square game player portrait pilot for Draft Lendas
Primary request: original editorial anime-inspired illustrated bust portrait representing <PLAYER>, preserving <REVIEWED TRAITS>
Scene/backdrop: abstract graphic backdrop only, with bold diagonal brush shapes and a subtle circular motif
Subject: one adult esports player, shoulders and head visible, generic logo-free esports jersey
Style/medium: premium 2D editorial illustration, anime influence, strong graphic shapes, clean ink edges, subtle dry-brush texture, illustrated rather than photorealistic
Composition/framing: centered bust, face in upper-middle, generous safe crop on all sides, consistent square framing
Lighting/mood: high contrast studio rim light, composed and formidable
Color palette: deep forest green, near-black, warm cream, vivid lime, plus one restrained role accent
Constraints: exactly one person; coherent anatomy; hands absent; no text, letters, logos, trademarks, sponsors, team branding, game characters or watermark
Avoid: photorealism, 3D render, chibi proportions, fantasy costume, duplicate facial features
```

O acento é ocre para TOP, teal para JG, violeta para MID, coral para ADC e azul-violeta para SUP. O fundo, escala do rosto, enquadramento e uniforme genérico permanecem constantes.

## Processamento reproduzível

Os PNGs mestres ficam preservados no diretório de geração da ferramenta. Para uma rodada aprovada, copie os mestres para uma pasta de trabalho e execute:

```sh
py -3 scripts/build_player_portraits.py <mestres-png> public/assets/players/portraits/pilot-v1 public/assets/players/silhouettes/pilot-v1 --contact-sheet docs/screenshots/portrait-pilot-v1.webp
npm run assets:portraits:validate
```

O script normaliza cada imagem para 768 × 768 WebP e deriva uma versão duotone da mesma composição, sem uma segunda interpretação gerativa. O manifesto [player-portraits.json](../src/data/player-portraits.json) registra versão, estado, caminhos e foco de corte.

## Checklist de aprovação humana

Avaliar cada identidade em 100% de zoom e dentro da carta mobile:

1. semelhança suficiente sem alegar ser retrato oficial;
2. tom de pele, cabelo, óculos e traços sem estereótipos ou troca de identidade;
3. olhos, orelhas, pescoço e uniforme sem artefatos anatômicos;
4. ausência de logos, texto, marcas e símbolos de equipe;
5. rosto legível nos cortes 185 px, 170 px e 33 px;
6. consistência de paleta, fundo, pose e iluminação com o conjunto;
7. silhueta derivada reconhecível e sem perda do contorno principal.

Registre `approved` ou `rejected` em cada entrada. Uma reprovação continua usando a silhueta; uma aprovação libera o retrato. A expansão além das dez identidades exige aprovação explícita do conjunto piloto.

## Contrato de fallback

1. retrato ilustrado, somente quando `approval` for `approved`;
2. silhueta duotone derivada para `pending`, `rejected` ou falha do retrato;
3. avatar CSS original se a entrada não existir ou a silhueta falhar.

As imagens reservam largura e altura, usam `loading="lazy"` fora da primeira carta e não alteram o layout durante carregamento ou erro.
