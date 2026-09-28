# Pipeline de Retratos de Jogadores

## Estado do piloto

O lote `pilot-v1` contém dez identidades e foi **aprovado pelo responsável do projeto em 2026-09-20**. As dez entradas estão como `approved`: o produto mostra o retrato mestre e mantém silhueta e avatar CSS como fallbacks seguros. Essa aprovação liberou a expansão que culminou no catálogo completo descrito abaixo.

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

## Expansão `catalog-v1`

O primeiro lote pós-piloto prioriza dez jogadores recorrentes no arquivo histórico. Os assets foram gerados, normalizados, integrados ao manifesto e **aprovados pelo responsável do projeto em 2026-09-20**. O produto agora mostra seus retratos e mantém as silhuetas como fallback.

[Abrir a prancha do lote de expansão](screenshots/portrait-catalog-v1.webp)

| Jogador | Função representada | Estado |
| --- | --- | --- |
| Bwipo | TOP | aprovado |
| Canyon | JG | aprovado |
| Chovy | MID | aprovado |
| Deft | ADC | aprovado |
| Impact | TOP | aprovado |
| Jensen | MID | aprovado |
| Peanut | JG | aprovado |
| Ruler | ADC | aprovado |
| Scout | MID | aprovado |
| Xiaohu | MID | aprovado |

## Catálogo completo `catalog-v2`

A produção integral foi autorizada pelo responsável do projeto em 2026-09-20. O arquivo histórico contém 346 nomes e 345 identidades visuais, pois `BrokenBlade` e `Broken Blade` compartilham a mesma pessoa e o mesmo asset. A expansão usa lotes versionados, inspeção visual por prancha e checkpoint no Git a cada lote.

- Lote 01: Hans Sama, Hylissang, JackeyLove, Keria, Mikyx, Perkz, Rekkles, ShowMaker, Sneaky e Zven — aprovado e integrado.
- Lote 02: 369, Bdd, Bjergsen, Doran, Gumayusi, Humanoid, Inspired, knight, Ming, Oner, Tarzan, Uzi, Viper, Wunder, Xmithie, BeryL, Blaber, BrokenBlade, Broxah e Clearlove — aprovado e integrado.
- Lotes 03–31: 290 identidades adicionais — aprovadas, integradas e registradas em pranchas individuais por lote.
- Lote 32: cinco identidades finais — aprovadas, integradas e registradas na prancha de encerramento.

[Abrir a prancha do lote 01](screenshots/portrait-catalog-v2-batch-01.webp)
[Abrir a prancha do lote 02](screenshots/portrait-catalog-v2-batch-02.webp)
[Abrir a prancha do lote final](screenshots/portrait-catalog-v2-batch-32.webp)

As demais pranchas usam o padrão `docs/screenshots/portrait-catalog-v2-batch-NN.webp`. Após o lote 32, o manifesto está em `catalog_complete`: 345 das 345 identidades visuais possuem retrato e silhueta aprovados, totalizando 690 WebPs validados.

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
python scripts/build_player_portraits.py <mestres-png> public/assets/players/portraits/<versão> public/assets/players/silhouettes/<versão> --contact-sheet docs/screenshots/portrait-<versão>.webp
npm run assets:portraits:validate
```

O script normaliza cada imagem para 768 × 768 WebP e deriva uma versão duotone lossless da mesma composição, sem uma segunda interpretação gerativa. O manifesto [player-portraits.json](../src/data/player-portraits.json) registra versão, estado, caminhos e foco de corte.

Para reconstruir de forma determinística todas as silhuetas publicadas a partir dos retratos aprovados, execute:

```sh
npm run assets:portraits:optimize
npm run assets:portraits:validate
```

## Contrato de formato, dimensões e bytes

- Retrato: WebP 768 × 768, até 140 KiB por arquivo e até 35 MiB no catálogo completo.
- Silhueta: WebP lossless 768 × 768, até 30 KiB por arquivo e até 9 MiB no catálogo completo.
- O validador abre e decodifica os 690 arquivos, além de reprovar caminho, formato, dimensões, paleta lossless das silhuetas, limite individual ou limite agregado fora do contrato.

A medição de 2026-09-28 encontrou 31,76 MiB nos 345 retratos, com máximo de 135,22 KiB. A troca da compressão lossy por lossless nas silhuetas reduziu esse conjunto de 24,53 MiB para 7,91 MiB (−67,8%), com máximo de 29,79 KiB, sem recomprimir os retratos. Uma segunda execução do otimizador produziu zero divergências de hash.

No draft, somente o primeiro retrato da oferta é eager; os demais usam lazy loading, e a silhueta só é requisitada se o retrato falhar. Uma campanha pode apresentar no máximo 15 retratos nas cinco ofertas, ou até 2,05 MiB pelo teto individual. Os assets são adicionados sob demanda ao cache de runtime da PWA, limitado a 180 entradas, sem pré-cache do catálogo inteiro. O cache foi promovido para `runtime-v2` nesta mudança para remover fallbacks antigos após a atualização segura do service worker.

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
