# Plano de Finalização — Mecânica, Site e Implementação

**Status:** aprovado para execução

**Atualizado em:** 2026-09-14

**Objetivo:** fechar as partes mais importantes do Draft Lendas, preparar uma beta com jogadores reais e evitar aumentar o escopo com sistemas que não ajudam essa validação.

## Resultado esperado

Ao concluir este plano, o projeto deve oferecer:

- um draft mobile confortável e visualmente forte;
- uma campanha simples, com uma única escolha de plano e sem microgerenciamento;
- explicações claras para buffs, nerfs, probabilidades e resultados;
- uma tela final memorável, inspirada na leitura de jornada de *Detroit: Become Human*, sem copiar sua interface;
- navegação completa, onboarding acessível e histórico fácil de encontrar;
- resultados públicos compartilháveis e comparáveis;
- arquivo histórico mais útil para exploração;
- uma identidade visual própria para os jogadores, com retratos anime e fallback de silhueta;
- instrumentação suficiente para começar testes com outras pessoas.

O foco não é transformar o jogo em um simulador completo de League of Legends. O foco é tornar o loop atual mais claro, bonito, confiável e compartilhável.

---

# Parte 1 — Mecânica e Site

## 1. Decisões de produto fechadas

Estas decisões devem ser preservadas durante a implementação.

### 1.1 Plano de jogo único

- O jogador escolhe **um plano para toda a campanha**.
- Não haverá troca de plano entre partidas, séries ou fases.
- Os quatro planos atuais continuam: Agressão, Teamfight, Controle/Pick e Escala.
- Cada plano apenas aplica um buff ou nerf conforme sua compatibilidade com a composição.
- Os valores atuais (`+1,5`, `+0,5` e `−1,0`) permanecem como baseline até que dados de jogadores reais justifiquem recalibração.
- Não será criado um sistema de plano contra plano ou “pedra, papel e tesoura”.

### 1.2 Campeões sem interação ativa

- O jogador não escolherá campeão, ordem do pool, banimento ou substituição durante a campanha.
- A simplicidade do pool é parte da diversão e deve ser mantida.
- Para a primeira beta externa, a ordem G1–G5 continua fixa e determinística.
- Uma ordem aleatória dos campeões pode ser testada depois como experimento, nunca como mudança silenciosa.

Se o experimento de aleatoriedade for aprovado depois da beta:

- o sorteio deve usar a seed da campanha, sem `Math.random()`;
- cada jogador deve usar os cinco campeões sem repetição dentro de uma BO5;
- o mesmo desafio e as mesmas decisões devem reproduzir a mesma ordem;
- duplicidades impossíveis na mesma composição devem ser evitadas quando houver alternativa;
- toda a simulação de balanceamento deve ser executada novamente;
- a interface deve deixar de chamar o pool de “ordem fixa”.

### 1.3 Torneio deliberadamente simples

- O Suíço continua representando somente a campanha do jogador.
- Não haverá tabela completa de 16 equipes, partidas paralelas ou chave viva de todas as equipes.
- O histórico deve mostrar com clareza o caminho do jogador, sem simular informação desnecessária.

### 1.4 Dificuldade concentrada no Desafio Diário

- A campanha comum não receberá seletor tradicional de dificuldade.
- Variações de dificuldade serão apresentadas como regras visíveis do Desafio Diário.
- Não haverá mudança escondida nas probabilidades para fabricar dificuldade.
- Todos que jogarem o mesmo desafio recebem seed, filtros e regras iguais.

### 1.5 Sem multiplayer neste ciclo

- Comparação de resultados assíncronos faz parte do plano.
- Conta de jogador, ranking verificado e multiplayer em tempo real continuam fora deste ciclo.
- Resultados calculados no navegador devem ser identificados como não verificados.

## 2. Prioridades de mecânica

### P0 — Explicação do plano e do resultado

O jogador precisa entender o efeito do plano sem precisar conhecer a fórmula.

Antes da partida, no modo Clássico, mostrar:

- plano escolhido;
- compatibilidade baixa, média ou alta;
- tags encontradas e tags ausentes;
- força antes e depois do modificador;
- chance estimada de vitória;
- aviso de que probabilidade não garante resultado.

Depois da partida ou série, mostrar uma frase objetiva, por exemplo:

> Seu plano de Teamfight encontrou Linha de Frente e Proteção, adicionando +1,5 à força. Sua equipe era favorita com 63%, mas esta derrota foi uma zebra possível.

Classificações possíveis para o resultado:

- vitória esperada;
- vitória como azarão;
- derrota esperada;
- derrota apesar do favoritismo.

No modo Almanaque, números e explicações quantitativas continuam ocultos durante a campanha e aparecem somente na revelação final.

### P0 — Relatório da campanha

Criar agregados derivados dos resultados já sorteados, sem gerar uma segunda narrativa contraditória.

O relatório final deve poder mostrar:

- campanha total: vitórias, derrotas, séries e fase alcançada;
- retrospecto por fase;
- composição mais forte e mais fraca entre G1–G5;
- efeito acumulado e efeito médio do plano;
- quantidade de jogos com compatibilidade alta, média e baixa;
- maior zebra a favor e contra o jogador;
- confronto mais difícil;
- jogo decisivo da campanha;
- jogador com melhor KDA da simulação, rotulado como **destaque da simulação**;
- campeão mais vitorioso e mais utilizado na campanha;
- aproveitamento quando favorito e quando azarão;
- edições e regiões representadas na equipe.

O relatório não deve afirmar que KDA, ouro, objetivos ou acontecimentos causaram o resultado. O resultado probabilístico é sorteado primeiro; KDA e momentos continuam sendo apresentação narrativa.

### P0 — Jornada final inspirada em Detroit

Adicionar uma visualização de “Sua jornada” na tela final.

Direção de experiência:

- sequência visual do draft até o resultado final;
- um nó por confronto, com adversário, placar e resultado;
- nós especiais para classificação, eliminação, quartas, semifinal e final;
- destaque para maior zebra, jogo decisivo e título/eliminação;
- caminho horizontal no desktop e vertical no mobile;
- animação de revelação curta, desativada com `prefers-reduced-motion`;
- possibilidade de abrir o relatório de cada série pelo próprio nó;
- botão para gerar/compartilhar uma imagem da jornada.

Não devem ser desenhados caminhos falsos ou decisões que o jogador nunca tomou. Quando existirem estatísticas globais, percentuais podem aparecer ao lado de nós reais, como “34% dos jogadores chegaram até aqui”.

Antes de haver amostra global suficiente:

- mostrar somente os dados da campanha e do histórico local;
- não inventar percentuais;
- não misturar “seu histórico” com “todos os jogadores”.

### P1 — Desafios diários com variação de dificuldade

Adicionar um modificador determinístico e explicado por dia. Exemplos:

- sem trocas;
- uma única troca;
- somente uma edição;
- somente eras antigas;
- somente uma região ou grupo regional;
- misturar pelo menos quatro edições;
- vencer com um plano definido pelo desafio;
- terminar invicto;
- chegar aos playoffs com uma composição de compatibilidade baixa.

Regras:

- o desafio deve continuar em Almanaque;
- a condição aparece antes do início;
- o resultado informa se o objetivo adicional foi cumprido;
- a tentativa oficial permanece uma por dispositivo/dia;
- tentativas posteriores continuam amistosas;
- não haverá ranking nesta fase;
- o arquivo dos últimos sete dias deve mostrar regra, resultado local e estado concluído/não concluído.

## 3. Prioridades do site

### P0 — Refazer a escolha de jogadores no mobile

A captura fornecida mostra os principais problemas atuais:

- cartas muito altas e com grande área vazia;
- ilustração pequena e sem presença;
- informações concentradas no canto esquerdo;
- três opções empilhadas geram rolagem excessiva;
- ação de escolher e ação de abrir detalhes não possuem hierarquia visual suficiente;
- controles de troca competem por espaço com as cartas;
- a composição não aproveita a largura disponível.

Solução recomendada:

- transformar as três opções em um carrossel horizontal com `scroll-snap`;
- mostrar uma carta principal e uma pequena prévia da próxima;
- incluir indicador “1 de 3”, setas acessíveis e suporte a swipe;
- usar botão explícito **Escalar esta lenda**, com alvo mínimo de 44 px;
- impedir que um gesto de swipe escolha uma carta por acidente;
- manter **Histórico e estatísticas** como ação secundária dentro da carta;
- transformar o retrato em elemento visual principal da carta;
- distribuir nome, equipe, edição e pool sem espaço morto;
- manter a equipe escolhida compacta e visível no topo;
- manter ano, região e trocas fáceis de alcançar sem ocupar a maior parte da tela;
- preservar os três candidatos e a comparação entre eles;
- não criar rolagem horizontal na página; somente o carrossel pode rolar internamente.

Viewports obrigatórios de validação:

- 360 × 800;
- 390 × 844;
- 412 × 915;
- 430 × 932;
- tablet de 768 px;
- desktop atual, sem regressão.

Critérios visuais:

- a primeira opção deve aparecer de maneira útil sem uma rolagem longa;
- nenhuma informação pode ficar cortada com zoom de 200%;
- nomes longos e equipes longas devem truncar ou quebrar de modo previsível;
- ratings ocultos no Almanaque não podem alterar a altura da carta;
- imagens atrasadas ou ausentes não podem deslocar o layout.

### P0 — Navegação completa

Aplicar todas as melhorias de navegação:

- tornar a marca do cabeçalho clicável;
- adicionar ação clara de voltar ao início;
- adicionar **Continuar depois** durante a campanha;
- adicionar **Abandonar campanha**, sempre com confirmação;
- preservar o save ao apenas voltar ao início;
- limpar o save somente ao abandonar ou iniciar um novo draft confirmado;
- tratar o botão Voltar do navegador sem perder a campanha;
- adicionar **Ver histórico** na tela final;
- manter **Jogar novamente**;
- adicionar **Voltar ao início** na tela final;
- garantir comportamento equivalente na PWA instalada.

### P0 — Onboarding em carrossel

Criar um onboarding curto para a primeira visita, reabrível por **Como jogar**.

Slides propostos:

1. Escolha cinco lendas: TOP, JG, MID, ADC e SUP.
2. Entenda o pool G1–G5 e a diferença entre BO1, BO3 e BO5.
3. Use as três trocas de ano, região ou jogadores.
4. Escolha um plano para toda a campanha e receba buff ou nerf.
5. Entenda chance, zebras, save automático, desafio e compartilhamento.

Requisitos:

- avançar por botão, teclado e swipe;
- indicador de progresso;
- opção **Pular**;
- foco acessível e leitura correta por leitor de tela;
- sem autoplay;
- animações removidas com `prefers-reduced-motion`;
- registrar localmente apenas que a versão atual foi concluída ou pulada;
- reiniciar automaticamente o onboarding quando uma futura mudança de regras exigir nova explicação.

### P0 — Tela final mais forte

Além da jornada e do relatório, aplicar:

- destaque da simulação;
- jogo decisivo;
- maior zebra;
- composição mais forte e mais fraca;
- efeito total do plano;
- comparação com as campanhas locais anteriores;
- conquistas desbloqueadas com animação curta;
- próximo desafio ou conquista recomendada;
- ações claras: compartilhar, comparar desafio, histórico, jogar novamente e início.

### P1 — Página pública de resultado

Criar uma URL estável, por exemplo `/resultado/:slug`, contendo apenas dados públicos e categorizados:

- equipe e edições;
- resultado e campanha;
- modo e plano;
- destaques do relatório;
- jornada;
- botão para aceitar o mesmo desafio;
- botão para comparar outra campanha da mesma seed;
- Open Graph específico com imagem do resultado.

Requisitos de confiança e privacidade:

- nenhuma informação pessoal obrigatória;
- nenhum texto livre público na primeira versão;
- slug não sequencial;
- validação estrita de todos os IDs;
- limite de criação por origem/dispositivo no backend;
- resultado marcado como **campanha compartilhada, não verificada**;
- payload incompatível com dataset antigo deve continuar legível, mas não necessariamente rejogável;
- exclusão administrativa para conteúdo inválido, mesmo sem existir texto livre.

O Open Graph dinâmico não deve depender apenas de JavaScript no navegador. Será necessária uma função server-side/edge ou páginas pré-renderizadas a partir do registro público.

### P1 — Comparação de desafios

Na página de resultado, permitir comparar duas campanhas da mesma seed:

- jogadores escolhidos por posição;
- plano;
- placar e fase alcançada;
- maior zebra;
- força média das composições;
- efeito médio do plano;
- caminho das duas campanhas;
- CTA para realizar uma nova tentativa.

Não chamar essa comparação de ranking ou resultado verificado.

### P1 — Arquivo histórico mais explorável

Aplicar as melhorias planejadas:

- filtros por edição, posição, equipe e região;
- ordenação por nome e rating;
- páginas de equipe;
- comparação de duas versões do mesmo jogador;
- atalhos para maiores ratings e jogadores recorrentes;
- link das cartas e do diálogo de detalhes diretamente para o arquivo;
- link do arquivo de volta ao draft com filtro equivalente quando possível;
- filtros representados na URL para compartilhamento;
- manter carregamento anual sob demanda e não inflar a home.

### P2 — Polimento visual e emocional

Aplicar de forma controlada:

- animações próprias para classificação, eliminação, semifinal, final e título;
- celebração visual de conquistas;
- transições consistentes entre as telas;
- melhor identidade dos adversários sem depender de logos protegidos;
- efeitos sonoros opcionais, desligados por padrão na primeira visita;
- controle de volume e respeito às preferências do dispositivo;
- revisão de espaçamento, tipografia, estados vazios, loading e erros;
- nenhuma animação pode atrasar a campanha ou impedir interação.

## 4. Direção visual dos jogadores

### 4.1 Estilo desejado

A referência fornecida apresenta:

- retrato anime editorial;
- contraste alto;
- formas gráficas e pinceladas fortes;
- enquadramento de busto/rosto;
- atitude competitiva;
- paleta reduzida.

Adaptar essa linguagem à identidade do Draft Lendas:

- verde lima, verde escuro, preto e creme como base;
- uma cor secundária controlada por função ou era;
- fundo gráfico abstrato, sem logos de times, marcas ou patrocinadores;
- uniforme genérico de esports;
- acabamento ilustrado, não fotorrealista;
- composição consistente entre todos os jogadores;
- sem texto dentro da imagem.

As imagens devem ser apresentadas como **ilustrações artísticas geradas para o projeto**, não como fotografias ou retratos oficiais.

### 4.2 Retrato principal e silhueta derivada

Para cada identidade de jogador:

1. gerar um retrato anime mestre;
2. revisar identidade, anatomia, óculos, cabelo, tom de pele e artefatos;
3. gerar programaticamente uma silhueta a partir da mesma composição/aprovação;
4. exportar as duas versões em tamanhos otimizados;
5. registrar ambas em um manifesto versionado;
6. usar a silhueta quando o retrato estiver reprovado, ausente ou falhar ao carregar;
7. manter o avatar CSS atual como terceiro e último fallback.

A silhueta não deve ser uma segunda interpretação independente. Ela deve preservar contorno, pose e enquadramento do retrato aprovado.

### 4.3 Escala e rollout

O catálogo possui centenas de jogadores distintos. Não gerar tudo antes de validar o estilo.

Etapas:

- lote piloto com 10 jogadores variados por região, posição, gênero de traço, tom de pele, cabelo e uso de óculos;
- revisão visual lado a lado em desktop e mobile;
- congelamento de prompt, enquadramento, paleta e parâmetros;
- criação do manifesto e fallback;
- produção em lotes pequenos, com checklist de aprovação;
- uma imagem por identidade canônica, reutilizada entre versões anuais inicialmente;
- permitir variante por era somente quando houver ganho visual claro;
- iniciar beta com pipeline pronto e cobertura representativa; completar o catálogo sem bloquear testes, usando silhuetas/fallbacks aprovados.

### 4.4 Requisitos técnicos dos assets

- origem local; nenhuma imagem remota em runtime;
- `loading="lazy"` fora da primeira opção visível;
- dimensões reservadas para evitar layout shift;
- recorte consistente e `object-position` configurável no manifesto;
- formato moderno para o retrato e PNG/SVG somente quando necessário para transparência;
- orçamento sugerido de até 120 kB por retrato entregue ao navegador e até 30 kB por silhueta;
- nome de arquivo estável baseado em ID canônico, não no nome exibido;
- hash/versão no manifesto;
- créditos e aviso de imagem gerada atualizados no site;
- revisão de direitos de imagem e de uso de semelhança antes da publicação aberta.

---

# Parte 2 — Implementação

## 5. Princípios técnicos

1. **Determinismo:** toda nova aleatoriedade passa por streams derivados da seed da campanha.
2. **Save compatível:** mudanças no estado persistido exigem versão e migração segura.
3. **Sem regressão no Almanaque:** números continuam ocultos até a tela final.
4. **Sem causalidade falsa:** relatórios distinguem cálculo do resultado e narrativa do KDA.
5. **Mobile primeiro:** implementar e validar 360 px antes de adaptar ao desktop.
6. **Performance:** retratos e páginas públicas não entram no bundle inicial da home.
7. **Acessibilidade:** teclado, leitor de tela, alvos de 44 px e movimento reduzido são critérios de aceite.
8. **Privacidade:** resultados públicos usam somente IDs históricos e valores categorizados.
9. **Medição:** cada pacote relevante define eventos antes de entrar na beta.
10. **Mudanças pequenas:** entregar por checkpoints revisáveis, sem um único commit gigante.

## 6. Pacotes de trabalho e ordem recomendada

### Pacote 0 — Baseline e contratos

**Objetivo:** proteger o funcionamento atual antes das mudanças visuais.

Implementar:

- screenshots de referência em 360, 390, 412, 430, 768 e 1440 px;
- inventário dos eventos e dados já disponíveis para relatórios;
- contrato `CampaignReport` puro, derivado de `Tournament`, equipe e plano;
- contrato versionado para os destaques persistidos no histórico;
- orçamento de tamanho e dimensões para retratos;
- decisões de URL para resultado público e comparação.

Arquivos prováveis:

- `src/game/report.ts` e testes;
- `src/game/history.ts`;
- `src/game/types.ts`;
- `tests/` e snapshots em `docs/screenshots/`.

### Pacote 1 — Draft mobile e navegação

**Objetivo:** remover o principal problema visual antes de convidar jogadores.

Implementar:

- componente de carrossel das três opções;
- nova composição mobile das cartas;
- CTA explícito de escolha;
- ações de detalhe acessíveis;
- estado compacto de ano/região/trocas;
- marca clicável, início, continuar depois e abandono confirmado;
- histórico e início na tela final;
- integração com botão Voltar e PWA.

Arquivos prováveis:

- `src/App.tsx`;
- novo `src/components/PlayerChoiceCarousel.tsx`;
- novo `src/components/PlayerCard.tsx` se a extração reduzir a complexidade do `App`;
- `src/components/draft.css`;
- `src/styles.css`;
- `tests/draft.spec.ts`, `tests/game.spec.ts`, `tests/accessibility.spec.ts`.

Critério de saída:

- nenhum overflow da página;
- três candidatos navegáveis por toque e teclado;
- swipe não seleciona acidentalmente;
- fluxo completo aprovado nos seis viewports definidos.

### Pacote 2 — Explicação e relatórios

**Objetivo:** fazer o jogador entender por que o plano ajudou ou atrapalhou.

Implementar:

- `CampaignReport` como função pura;
- classificação de favorito/azarão e resultado esperado/zebra;
- explicação de tags correspondentes e ausentes;
- força base, modificador, força final e chance pré-jogo preservadas no relatório;
- agregados por série, fase, composição, jogador e campeão;
- cards de resumo após série no Clássico;
- revelação completa somente no final para Almanaque;
- versão compacta do relatório no histórico local.

Não usar novo RNG. Todos os dados devem vir do estado já concluído.

Arquivos prováveis:

- `src/game/report.ts`;
- `src/game/engine.ts` apenas se faltar algum valor de breakdown;
- `src/components/MatchReport.tsx`;
- novo `src/components/CampaignReport.tsx`;
- `src/game/history.ts` com migração de schema;
- testes unitários e E2E.

### Pacote 3 — Jornada final

**Objetivo:** transformar o encerramento em uma história legível e compartilhável.

Implementar:

- componente `CampaignJourney`;
- nós de confronto e marcos de fase;
- abertura do relatório pelo nó;
- destaques da campanha;
- comparação com histórico local;
- exportação da jornada como imagem;
- layout vertical mobile e horizontal desktop;
- percentuais globais somente quando houver backend e amostra suficiente.

Arquivos prováveis:

- `src/components/CampaignJourney.tsx`;
- `src/components/campaign-journey.css`;
- `src/game/report.ts`;
- `src/game/share.ts`;
- `src/App.tsx`;
- testes de acessibilidade, layout e exportação.

### Pacote 4 — Onboarding

**Objetivo:** permitir que uma pessoa nova entenda o jogo sem ajuda externa.

Implementar:

- carrossel de cinco slides;
- storage versionado do estado de conclusão;
- abertura automática somente na primeira visita;
- reabertura pelo menu;
- teclado, swipe, foco, pular e movimento reduzido;
- eventos anônimos `onboarding_opened`, `onboarding_completed` e `onboarding_skipped`.

Arquivos prováveis:

- `src/components/OnboardingCarousel.tsx`;
- `src/components/onboarding.css`;
- `src/game/onboarding.ts`;
- `src/App.tsx`;
- testes unitários e E2E.

### Pacote 5 — Pipeline de retratos

**Objetivo:** criar identidade visual sem bloquear a interface quando um asset falhar.

Implementar:

- guia de estilo e prompt-base;
- lote piloto de 10 retratos;
- processo de aprovação humana;
- ferramenta reproduzível para derivar silhueta;
- manifesto `player-portraits.json` com retrato, silhueta, versão e foco de corte;
- componente `PlayerPortrait` com três níveis de fallback;
- lazy loading e dimensões reservadas;
- integração na carta, equipe, resultado e compartilhamento;
- créditos e disclaimer atualizados;
- testes de erro de imagem e ausência no manifesto.

Arquivos prováveis:

- `src/data/player-portraits.json`;
- `src/data/player-art.ts`;
- `src/components/PlayerPortrait.tsx`;
- `public/assets/players/portraits/`;
- `public/assets/players/silhouettes/`;
- `scripts/` para validação/conversão;
- testes de manifesto e E2E.

O lote completo só começa depois da aprovação explícita do piloto.

### Pacote 6 — Resultado público e comparação

**Objetivo:** fazer compartilhamento gerar uma página útil, não apenas um card.

Dependência: definir hospedagem e ativar o backend real.

Implementar:

- tabela/RPC de resultados públicos com schema mínimo;
- criação anônima validada e limitada;
- rota `/resultado/:slug`;
- página lazy separada da home;
- Open Graph dinâmico;
- associação opcional ao código de desafio;
- comparação de dois resultados compatíveis;
- tratamento de dataset antigo;
- métricas de abertura, desafio aceito e comparação;
- moderação/exclusão administrativa.

Arquivos prováveis:

- migration nova em `supabase/migrations/`;
- `src/results/ResultApp.tsx`;
- `src/results/routes.ts`;
- `src/results/result.css`;
- integração em `src/main.tsx` e `src/components/CampaignShare.tsx`;
- função edge/serverless para HTML/OG;
- testes de RLS, payload, rota e compartilhamento.

### Pacote 7 — Arquivo histórico

**Objetivo:** transformar o acervo em ferramenta de descoberta.

Implementar:

- filtros e ordenação na URL;
- índice de equipes;
- rota de equipe;
- comparação de versões;
- links cruzados entre jogo e arquivo;
- novos URLs no sitemap;
- carregamento somente dos chunks necessários.

Arquivos prováveis:

- `src/archive/ArchiveApp.tsx`;
- `src/archive/routes.ts`;
- `src/data/archive-index.json` e gerador;
- `vite.config.ts` para sitemap;
- `tests/archive.spec.ts`.

### Pacote 8 — Desafios diários especiais

**Objetivo:** oferecer dificuldade e retorno diário sem ranking prematuro.

Implementar:

- catálogo versionado de modificadores;
- geração determinística por data de Brasília;
- descrição e objetivo antes do draft;
- validação de elegibilidade;
- resultado cumprido/não cumprido;
- histórico dos últimos sete dias;
- eventos categorizados por modificador;
- suporte no save e no histórico local.

Arquivos prováveis:

- `src/game/daily.ts`;
- `src/game/challenge.ts`;
- `src/game/campaign.ts`;
- `src/game/history.ts`;
- `src/App.tsx`;
- migrations de analytics;
- testes unitários, determinísticos e E2E.

### Pacote 9 — Polimento e preparação da beta

Implementar:

- animações e celebrações finais;
- sons opcionais, se aprovados;
- revisão de textos e estados vazios;
- Firefox e WebKit na matriz de testes;
- teste em aparelhos físicos;
- auditoria de performance, acessibilidade e PWA;
- smoke test pós-deploy;
- painel real de funil e erros;
- formulário curto de feedback para os primeiros jogadores.

## 7. Gates de entrega

### Gate A — Beta interna

Obrigatório:

- Pacotes 0 a 4 concluídos;
- mobile aprovado nos viewports definidos;
- explicação do plano e relatório sem causalidade falsa;
- jornada final funcionando;
- navegação e onboarding completos;
- testes atuais verdes e novos testes adicionados.

O pipeline de retratos deve estar integrado, mas pode usar silhuetas/fallbacks enquanto o piloto é revisado.

### Gate B — Beta fechada com outros jogadores

Obrigatório:

- Gate A;
- lote piloto de retratos aprovado;
- deploy HTTPS estável;
- Supabase e analytics reais;
- eventos de início, conclusão, troca, plano, relatório, replay e compartilhamento confirmados;
- política de feedback e privacidade visível;
- roteiro de entrevista e formulário curto;
- nenhum erro crítico conhecido em mobile.

Não é necessário esperar o catálogo inteiro de retratos para começar a aprender com jogadores.

### Gate C — Beta pública

Obrigatório:

- resultado público e comparação de desafio;
- Open Graph específico funcionando;
- cobertura visual suficiente ou silhuetas aprovadas para todo o restante;
- filtros principais do arquivo;
- monitoramento de erros e smoke test pós-deploy;
- WebKit/Firefox e aparelhos físicos validados;
- decisão sobre os modificadores do Desafio Diário baseada na beta fechada.

## 8. Métricas para decidir se o projeto está pronto

Medir na beta, sem definir metas artificiais antes da primeira amostra:

- abertura → início do draft;
- início → cinco escolhas;
- cinco escolhas → entrada no Worlds;
- entrada → campanha concluída;
- tempo por posição;
- uso e tipo das trocas;
- escolha dos quatro planos;
- abertura dos relatórios;
- conclusão do onboarding e slide de abandono;
- replay;
- card baixado/compartilhado;
- desafio aberto/iniciado/concluído;
- retorno ao Desafio Diário;
- uso do arquivo;
- erros por dispositivo e navegador.

Além dos números, entrevistar jogadores sobre:

- clareza do G1–G5;
- compreensão do buff/nerf do plano;
- confiança no resultado;
- conforto da escolha mobile;
- utilidade do relatório;
- vontade de compartilhar e jogar novamente;
- percepção dos retratos anime e das silhuetas.

## 9. Definição de pronto por pacote

Um pacote só está pronto quando:

- critérios de produto e acessibilidade foram atendidos;
- unitários, TypeScript, build e E2E estão verdes;
- desktop e mobile foram revisados visualmente;
- save antigo possui migração ou descarte seguro documentado;
- analytics não envia texto, seed ou identificador não permitido;
- documentação e screenshots foram atualizados;
- não existe regressão no modo Almanaque, desafio determinístico ou PWA offline;
- o commit é pequeno o bastante para revisão e possui uma única responsabilidade clara.

## 10. Fora de escopo deste ciclo

- troca de plano durante a campanha;
- escolha manual, ban ou draft de campeões;
- simulação de ouro, itens, rotas ou objetivos;
- tabela Suíça completa;
- simulação paralela das outras equipes;
- perfil de jogador;
- ranking verificado;
- multiplayer assíncrono com contas;
- multiplayer em tempo real;
- chat;
- monetização.

## 11. Decisões que precisam ser confirmadas antes dos respectivos pacotes

Estas decisões não bloqueiam o início dos Pacotes 0–4:

1. **Hospedagem:** Vercel ou Firebase para definir a estratégia de resultado/OG dinâmico.
2. **Retratos:** aprovar o lote piloto antes de produzir o catálogo.
3. **Silhueta:** escolher entre recorte sólido ou tratamento duotone depois de comparar no mobile.
4. **Estatística global:** definir amostra mínima antes de exibir percentuais na jornada; recomendação inicial: ocultar abaixo de 30 campanhas válidas.
5. **Campeões aleatórios:** decidir somente depois da primeira baseline externa; recomendação: não incluir na primeira beta.
6. **Som:** validar se acrescenta emoção sem prejudicar uso discreto e mobile; sempre opcional.

## 12. Próxima sessão recomendada

Começar pelo **Pacote 0** e pelo **Pacote 1**:

1. registrar screenshots atuais nos viewports definidos;
2. extrair `PlayerCard` e criar o carrossel mobile;
3. corrigir hierarquia, espaços vazios e ações de escolha/detalhes;
4. implementar navegação segura para início, continuar depois e abandono;
5. adicionar E2E do novo comportamento antes de avançar para relatórios.

Depois disso, implementar Pacotes 2, 3 e 4 em sequência. Essa ordem coloca uma versão clara e confortável nas mãos de jogadores reais sem ampliar o motor além do necessário.
