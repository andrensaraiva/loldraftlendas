# Análise comparativa: 7a0 × Draft Lendas

**Data da análise:** 12 de setembro de 2026  
**Objetivo:** identificar o que torna o 7a0 atraente para o público, comparar essas forças com o estado real do Draft Lendas e transformar os achados em uma fila de produção executável.
**Status da decisão:** aprovada para execução em 12 de setembro de 2026.

## Decisão recomendada

A melhor próxima entrega de produto é um pacote chamado **Compartilhar e Desafiar**:

1. gerar um card compartilhável ao fim da campanha;
2. permitir iniciar um desafio com as mesmas condições por meio de uma seed ou código;
3. tornar força, composição e chance de vitória mais visíveis antes e depois das partidas;
4. medir compartilhamentos, entradas por convite, conclusão e revanche com a telemetria anônima já existente.

Esse pacote deve entrar **antes de conta, ranking global ou multiplayer online** e pode ser produzido em paralelo ao backfill histórico de 2021. Ele captura o principal motor de divulgação observado no 7a0 — transformar uma campanha em conversa — enquanto explora uma vantagem própria do Draft Lendas: um motor documentado, probabilidades explícitas e pools de campeões baseados em evidência.

### Estado de execução

- ✅ **1.1 Card compartilhável:** implementado com PNG 1080 × 1350, Web Share, download e fallback de cópia.
- 🟡 **1.2 Métricas sociais:** `share_started`, `share_completed` e `card_downloaded` já chegam ao contrato e ao dashboard; origem do convite entra junto com o link de desafio em 2.2.
- ✅ **1.3 Explicação pré-jogo:** chance, forças, ratings médios, composição e bônus ativos estão visíveis antes do resultado.
- ⏭️ **Próximo pacote técnico:** 2.1 e 2.2, com seed persistida, reprodução determinística e link/código de desafio.
- 🔌 **Ação externa ainda necessária:** aplicar as migrations em um Supabase real e observar o workflow no GitHub Actions.

Adicionar apenas mais anos melhora variedade, mas não resolve sozinho aquisição, compartilhamento ou retorno. A fila atual precisa de duas trilhas: **confiabilidade/dados** e **produto/retenção**.

## Escopo e método

Esta análise cruza três tipos de evidência:

- páginas oficiais do 7a0 consultadas em 12/09/2026;
- cobertura independente e discussões públicas de jogadores;
- código, testes e documentação locais do Draft Lendas no mesmo checkpoint.

Não há acesso aos analytics internos, receita, retenção ou testes A/B do 7a0. Por isso, “o público mais gosta” significa **sinais qualitativos recorrentes e comportamentos observáveis**, não uma medição estatística representativa. Comentários em fóruns tendem a destacar campanhas extraordinárias e frustrações; essa seleção é útil para descobrir motivos de conversa, mas não para estimar percentuais da base inteira.

A listagem “7a0 - Futebol Draft de Lendas” no Google Play não foi tratada como fonte oficial: o desenvolvedor e os contatos exibidos não coincidem com a identidade publicada em `7a0.com.br`, e o FAQ oficial orienta instalar o site como PWA sem loja. Também foram desconsiderados domínios de guias e clones sem vínculo confirmado.

## O produto 7a0 observado hoje

O loop principal do 7a0 é curto: escolher formação, estilo e dificuldade, sortear seleção + edição de Copa, escolher um jogador elegível, completar onze posições e simular sete partidas. A meta memorável é o “7 a 0”: ser campeão vencendo os sete jogos sem sofrer gols.

A página inicial anuncia atualmente **56 seleções, 302 elencos e 7.026 jogadores**. Algumas páginas institucionais ainda exibem contagens anteriores — 52 seleções e aproximadamente 5.700 jogadores —, sinal de deriva entre catálogo e conteúdo editorial. A comparação usa a contagem mais recente da home e não trata esses números como equivalentes às 535 versões de jogadores e aos 2.675 slots de campeão do Draft Lendas.

Além do modo solo, o site apresenta:

- modo Clássico, com força visível, e Almanaque, com força oculta;
- formação e estilo ofensivo, equilibrado ou defensivo;
- três tipos de multiplayer: local, final entre dois jogadores e mata-mata de 4 a 16 participantes;
- Desafio do Dia com as mesmas condições para todos, arquivo de desafios e rankings por resultado, força e eficiência;
- Modo Livre para montar um conjunto personalizado de países e Copas;
- perfil opcional por link de e-mail, histórico, conquistas, amigos e cartão de membro;
- artilharia pessoal;
- arquivo navegável por Copa e por seleção;
- instalação no celular como PWA;
- suporte financeiro voluntário e canal para discordar de avaliações.

Essas funcionalidades não parecem ter sido todas necessárias para a viralização inicial. Cobertura e fóruns de junho de 2026 descrevem como núcleo atraente o acesso imediato, o draft histórico, a simulação rápida e o compartilhamento de resultados. Desafio diário, conta e demais camadas mostram como o produto expandiu retenção e comunidade depois de ter um loop reconhecível.

## O que o público parece valorizar mais

| Ordem | Sinal observado | Evidência pública | Confiança | Implicação para o Draft Lendas |
|---:|---|---|---|---|
| 1 | **Campanhas viram histórias para compartilhar** | Uma página de fórum contém repetidos links públicos `/r/...`, escalações, placares, provocações e relatos de vitórias/derrotas. No Reddit, a pergunta “como perdi com esse time?” sustenta boa parte da conversa. | Alta | O resultado precisa sair do navegador como card e convite, não terminar apenas no botão “Jogar novamente”. |
| 2 | **Loop rápido e vontade de tentar de novo** | Cobertura relata várias tentativas na mesma viagem e mais partidas em casa; usuários dizem estar jogando havia uma hora ou há vários dias. | Alta | Preservar o modo rápido e reduzir atrito entre fim, compartilhamento, revanche e novo draft. |
| 3 | **Nostalgia e combinações impossíveis entre eras** | Matérias e comentários citam Pelé, Messi, Maradona, Yashin e outros nomes como a fantasia central. O próprio posicionamento do produto começa por misturar gerações reais. | Alta | O Draft Lendas já entrega isso com jogadores de Worlds e deve destacar ainda mais ano, time, pool e confronto entre eras no card final. |
| 4 | **Conhecimento e escolhas com consequência** | Jogadores discutem equilíbrio defensivo, utilidade em vez de maior overall, formação e dificuldade. O modo de força oculta é citado como mais interessante por quem já dominou o Clássico. | Média-alta | Criar modo Almanaque e uma decisão de plano de jogo, usando as tags de composição já existentes. |
| 5 | **Acesso gratuito, imediato e móvel** | A cobertura destaca explicitamente jogar no navegador do celular ou computador, sem download. | Alta | Manter o início sem login; conta deve ser opcional e pedida somente quando oferecer histórico, ranking ou amigos. |
| 6 | **Comparação em condições iguais** | O Desafio do Dia oficial usa a mesma mão e rankings; é uma proposta forte de retorno recorrente. Não foram encontrados dados públicos de uso que provem seu peso na viralização inicial. | Média | Primeiro validar desafios por seed entre amigos; só depois investir em calendário diário e ranking. |

### O ponto mais importante

O conteúdo compartilhado não é apenas a vitória. **Derrotas improváveis, quase-vitórias e escolhas discutíveis geram mais conversa que um placar previsível.** O produto deve permitir que o jogador conte essa história sem transformar o resultado em uma caixa-preta.

## O que o público critica ou sente falta no 7a0

O tema negativo mais recorrente é a percepção de que “o time não importa” e de que a simulação seria loteria pura. Há jogadores que aceitam zebras como parte do futebol, mas a repetição de derrotas de elencos muito fortes contra adversários inferiores diminui a sensação de domínio e faz a experiência perder valor após a novidade.

Outros sinais menores:

- a versão com notas visíveis pode virar apenas “escolher o maior número”;
- o modo difícil é atraente, mas muito punitivo para quem não conhece elencos antigos;
- foram relatados problemas de reprodução/animação em algumas configurações;
- avaliações subjetivas geram discordância suficiente para o próprio site manter um canal específico;
- contagens diferentes entre a home e as páginas institucionais mostram a importância de gerar números públicos a partir de uma única fonte.

### Oportunidade de diferenciação

O Draft Lendas já calcula e guarda a chance de vitória, mostra a força das duas equipes no relatório e oferece detalhes da pesquisa de cada jogador. Em vez de imitar a opacidade que gera reclamações, deve tornar essa explicação parte central da experiência:

- exibir chance pré-jogo sem antecipar o resultado;
- decompor força em rating médio, composição, sinergias ativadas e plano de jogo;
- reforçar que 70% ou 80% não significa resultado garantido;
- manter o detalhamento pós-jogo e a seed verificável em desafios;
- medir se derrotas com alta probabilidade aumentam abandono ou revanche.

## Comparação com o estado atual do Draft Lendas

| Área | 7a0 | Draft Lendas hoje | Diagnóstico |
|---|---|---|---|
| Fantasia central | Misturar lendas de Copas e montar um XI | Misturar jogadores de oito Worlds e montar cinco posições com pools G1–G5 | **Paridade com identidade própria.** Os pools por jogo são uma diferenciação estratégica forte. |
| Acesso | Gratuito, navegador, celular e solo sem conta | Frontend estático, responsivo e sem login de jogador | **Paridade.** Falta instalação como PWA. |
| Draft | Um elenco sorteado por turno, formação e rerolls | Três candidatos por posição; ano, grupo regional e três trocas | **Vantagem de clareza e decisão imediata.** |
| Cobertura histórica | 1950–2026, catálogo amplo e navegável | 2015, 2017, 2019, 2020 e 2022–2025; sete anos de 2011–2025 incompletos | **Lacuna de amplitude**, compensada por evidência e assets por patch. |
| Dificuldade | Clássico e Almanaque | Ratings sempre visíveis | **Lacuna pequena e barata de validar.** |
| Agência tática | Formação e estilo | Composição automática por tags; sistema de estilo foi deliberadamente deixado fora | **Lacuna relevante.** A fundação já existe nas tags `EARLY_GAME`, `TEAMFIGHT`, `SCALING`, `PICK` e `POKE`. |
| Torneio | Sete jogos, placar e artilheiros | Suíço, BO1/BO3, playoffs BO5, modo detalhado/rápido, KDA e histórico | **Vantagem de profundidade narrativa.** |
| Confiança no resultado | Ratings subjetivos; críticas públicas de aleatoriedade | Fórmula documentada, chance de 8%–92%, força e probabilidade no relatório | **Vantagem defensável**, ainda pouco exposta antes da partida. |
| Compartilhamento | URLs de resultado usadas em fóruns e cartas compartilháveis | Open Graph genérico da home; nenhum card ou resultado compartilhável | **Maior lacuna imediata.** |
| Desafio comum | Seed diária, arquivo e rankings | RNG injetável nos testes, mas campanha comum não possui seed pública | **Boa fundação técnica, produto ausente.** |
| Retenção | Diário, histórico, artilharia e conquistas | Um save local da campanha atual e “Jogar novamente” | **Lacuna alta.** |
| Social | Multiplayer local/online, amigos e salas | Nenhum modo social | **Lacuna alta, porém cara.** Não deve ser a primeira implementação. |
| Conta | Opcional, magic link, perfil | Auth apenas para administradores; nenhum perfil de jogador | **Corretamente adiado** até existir valor persistente para o usuário. |
| Exploração/SEO | Arquivo público por edição e seleção | Dados acessíveis dentro do draft e em diálogos; sem catálogo público | **Oportunidade média.** A pesquisa existente pode virar aquisição orgânica. |
| Feedback de rating | Convite específico para contestar avaliação | Feedback geral Bom/Ok/Ruim ao fim e detalhes com fontes | **Quick win:** feedback contextual por jogador/campeão. |
| Operação | Produto público com conteúdo atualizado continuamente | Supabase real e observação da CI ainda pendentes | **Bloqueador operacional para aprender com usuários reais.** |

## O que está faltando no projeto

### Falta para publicação e aprendizado confiáveis

1. configurar um Supabase real, aplicar migrations, allowlist e variáveis de ambiente;
2. observar a CI no GitHub após um push real;
3. obter revisão externa independente para os oito anos validados;
4. estabelecer baseline real do funil antes de avaliar novas funcionalidades.

Sem o item 1, analytics e feedback ficam inativos fora do modo de demonstração. Sem baseline, é possível entregar uma função atraente sem saber se ela melhora conclusão, compartilhamento ou replay.

### Falta para aquisição e viralidade

1. card compartilhável de equipe e campanha;
2. resultado público ou payload compartilhável com privacidade;
3. convite “Tente vencer meu draft”;
4. origem de indicação para medir convite → início → conclusão;
5. páginas públicas de anos, jogadores e pools históricos.

### Falta para retenção

1. modo Almanaque;
2. desafios determinísticos entre amigos;
3. plano de jogo compatível com as tags de composição;
4. desafio diário, inicialmente sem ranking competitivo;
5. histórico de campanhas e conquistas;
6. perfil opcional e ranking verificado.

### Falta na cobertura histórica

1. backfill de 2021, já definido como próximo pacote;
2. 2011–2014, 2016 e 2018;
3. recalibração global e versionamento a cada edição;
4. revisão externa registrada antes de `PRODUCTION_READY`.

## Fila integrada aprovada

Os tamanhos abaixo são relativos: **S** (mudança localizada), **M** (vários componentes/contratos), **L** (nova capacidade transversal) e **XL** (backend e operação novos). Não são promessa de prazo.

### Agora — estabilizar e criar o ciclo de divulgação

| Ordem | Item | Prioridade | Tamanho | Dependências | Critério de saída |
|---:|---|---|---|---|---|
| 0.1 | Ativar Supabase real e validar admin/analytics/feedback | P0 | M | Projeto Supabase e credenciais públicas | Funil e feedback aparecem no dashboard real; acesso não autorizado continua bloqueado. |
| 0.2 | Executar e observar CI em push | P0 | S | Repositório remoto | Typecheck, unitários, dados, build e E2E verdes no GitHub Actions. |
| 0.3 | Definir e registrar o primeiro processo de revisão externa | P0 | M | Revisor independente | Ao menos uma revisão reproduzível registrada; plano para os outros sete anos. |
| 1.1 | **Card compartilhável da campanha** | P0 Produto | M | Nenhuma dependência de conta | Imagem/texto contém equipe, anos, resultado e recorde; Web Share quando disponível, download/copiar como fallback; sem PII. |
| 1.2 | Instrumentar `share_started`, `share_completed`, `card_downloaded` e origem do convite | P0 Produto | S | 1.1 e analytics real | Dashboard separa exposição, tentativa e conclusão sem armazenar texto livre ou contato. |
| 1.3 | Explicação pré-jogo de força e chance | P0 Produto | S–M | Motor atual | Jogador vê força média, composição, bônus ativos e probabilidade; E2E cobre mobile e teclado. |
| 1.4 | Feedback contextual “Discorda deste rating?” | P1 | S–M | Endpoint/RLS novo | Feedback registra apenas IDs públicos, edição, slot e motivo categorizado; nota opcional limitada. |

### Em paralelo — continuar a trilha histórica

| Ordem | Item | Prioridade | Tamanho | Observação |
|---:|---|---|---|---|
| D1 | Backfill completo de Worlds 2021 | P0 Dados | L | Não habilitar antes de matches, rosters, evidências, assets, recalibração, reprodução e gates passarem. |
| D2 | Revisão externa dos oito anos validados | P0 Dados | L contínuo | Pode avançar independentemente da UI social. |
| D3 | Backfill de 2018; depois 2016, 2014, 2013, 2012 e 2011 | P1 Dados | XL contínuo | Ordem posterior deve considerar disponibilidade/qualidade de fontes, não apenas cronologia. |

### Próximo — transformar compartilhamento em competição justa

| Ordem | Item | Prioridade | Tamanho | Dependências | Critério de saída |
|---:|---|---|---|---|---|
| 2.1 | Gerador determinístico e seed persistida | P0 Produto | L | Atualização do save | A mesma seed + versão do dataset + regras + decisões do jogador reproduz ofertas, adversários e resultados; retomar não altera a sequência. |
| 2.2 | **Desafiar com esta seed** | P0 Produto | M | 2.1 | Link/código abre a mesma configuração; resultado de cada participante continua pessoal e é marcado como não verificado. |
| 2.3 | Modo Almanaque | P1 | S–M | Snapshot de regras da campanha | Ratings e detalhes numéricos ficam ocultos no draft e são revelados ao final; analytics compara conclusão e replay por modo. |
| 2.4 | Plano de jogo: Agressão, Teamfight, Controle/Pick ou Escala | P1 | M–L | Rebalanceamento e simulação em massa | Escolha tem bônus explicado quando combina com as tags e penalidade limitada quando não combina; 100 mil campanhas recalibradas. |
| 2.5 | Filtros de desafio por edição e grupo | P1 | M | Manifesto de elegibilidade atual | Nunca cria uma posição com menos de três candidatos; configuração fica no snapshot do save. |

### Depois — retenção recorrente sem assumir risco competitivo cedo demais

| Ordem | Item | Prioridade | Tamanho | Dependências | Critério de saída |
|---:|---|---|---|---|---|
| 3.1 | Desafio diário sem ranking | P1 | L | 2.1, configuração remota e relógio/ID de desafio | Mesma seed e regras para todos; arquivo recente; uma tentativa oficial local e tentativas amistosas separadas. |
| 3.2 | PWA instalável e recuperação offline da campanha ativa | P1 | M | Política de cache e versionamento de assets | Manifesto, ícones, service worker, atualização segura e teste mobile. |
| 3.3 | Arquivo público por edição, jogador e campeão | P2 | M–L | Estratégia de rotas/SEO | Páginas usam os chunks existentes, exibem fontes e entram no sitemap sem inflar o bundle inicial. |
| 3.4 | Histórico local de campanhas e conquistas básicas | P2 | M | Modelo de armazenamento versionado | Guarda resumos limitados, oferece exportação/limpeza e não exige conta. |

### Mais tarde — somente após validar demanda e integridade

| Ordem | Item | Prioridade | Tamanho | Por que esperar |
|---:|---|---|---|---|
| 4.1 | Perfil opcional por magic link e sincronização do histórico | P2 | XL | Exige Auth de jogadores, RLS, recuperação, exclusão de dados e política de privacidade ampliada. |
| 4.2 | Ranking diário verificado | P2 | XL | O servidor precisa reproduzir ou validar escolhas/resultados; nunca confiar em um placar calculado apenas no navegador. |
| 4.3 | Multiplayer assíncrono | P3 | XL | Salas, convites, reconexão, abandono, abuso e versionamento de estado aumentam muito o custo operacional. |
| 4.4 | Multiplayer em tempo real | P3 | XL+ | Só faz sentido se desafios assíncronos provarem demanda social recorrente. |

## Como implementar o pacote recomendado

### 1. Card compartilhável — MVP sem backend

Na tela final, adicionar **Compartilhar campanha** ao lado de **Jogar novamente**. O card deve ser legível em feed e story e conter:

- resultado: campeão, vice, semifinal, quartas ou eliminado no Suíço;
- vitórias, derrotas e número de confrontos;
- os cinco jogadores, funções, times e edições;
- melhor força alcançada ou composição de destaque;
- marca Draft Lendas e chamada “Você faria um draft melhor?”.

Usar `navigator.share()` com arquivo quando suportado. O fallback deve baixar a imagem e copiar um texto curto. A primeira versão pode compartilhar a imagem sem URL de resultado dinâmica, preservando a arquitetura estática. Um link com Open Graph específico exige uma página/endpoint que entregue metadados por resultado; o Open Graph genérico atual não muda por campanha.

O card não deve conter e-mail, ID administrativo, ID interno de sessão ou texto livre de feedback. Assets devem continuar respeitando a política já adotada: avatares neutros de jogador, artes históricas de campeão e aviso de não endosso na página de destino.

### 2. Seed determinística — base do desafio

O motor já aceita `Random` injetável, o que reduz o risco, mas a seed ainda precisa percorrer toda a campanha. A implementação deve:

- criar um gerador determinístico versionado em `src/game/random.ts`;
- salvar `seed`, versão do algoritmo, versão do dataset e snapshot de regras;
- passar a fonte aleatória explicitamente ao planejamento do draft, trocas, adversários, partidas e recaps;
- evitar depender da ordem acidental de renders ou retomadas para consumir números aleatórios;
- preferir sub-seeds por domínio, como `draft/round/2`, `series/3` e `game/2/recap`, para que uma mudança visual não altere resultados;
- atualizar `CAMPAIGN_SAVE_VERSION` com migração segura ou aviso claro para saves antigos;
- criar testes de reprodução completa, inclusive pausa, modo rápido, relatório e retomada.

O link de desafio deve carregar apenas seed, versão e regras allowlisted. Resultados de cliente são entretenimento, não prova válida para ranking.

### 3. Explicação da partida — vantagem competitiva

Antes do botão de entrar na partida, mostrar:

```text
Suas lendas 86,4 × 83,1 adversário
Chance estimada: 63%
Rating dos picks: 84,8
Composição: 92 — dano misto, engage e teamfight ativos
Plano: Teamfight — compatibilidade alta
```

Depois, manter a chance já exibida no relatório e acrescentar uma frase contextual: “63% favorecia sua equipe, mas ainda representa aproximadamente 37 derrotas a cada 100 partidas equivalentes”. Isso comunica incerteza sem fingir que uma zebra é erro.

### 4. Plano de jogo — agência sem virar simulador complexo

Não copiar formações de futebol. No universo do Draft Lendas, a decisão equivalente é um plano ligado às tags que já alimentam a composição:

- **Agressão:** `EARLY_GAME` e `ENGAGE`;
- **Teamfight:** `TEAMFIGHT`, `FRONTLINE` e `PEEL`;
- **Controle/Pick:** `PICK`, `POKE` e `CONTROL`;
- **Escala:** `SCALING`, `CARRY` e `PEEL`.

A escolha pode ocorrer ao fechar o draft e permanecer por campanha no primeiro experimento. Trocar plano por série aumenta agência, mas também complexidade e deve ser um teste posterior. Os bônus precisam ser pequenos, visíveis e recalibrados; não adicionar um botão cosmético nem um multiplicador oculto.

## Métricas e decisão de continuidade

Antes de lançar o pacote, registrar a linha de base de:

- início → draft completo;
- draft completo → campanha completa;
- campanha completa → jogar novamente;
- duração mediana do draft e da campanha;
- abandono após derrota com probabilidade pré-jogo alta;
- Bom/Ok/Ruim por resultado e modo.

Para o experimento social, acrescentar:

- percentual de campanhas concluídas com tentativa de compartilhar;
- compartilhamento concluído ou card baixado;
- aberturas atribuídas a convite;
- convite aberto → draft iniciado → campanha concluída;
- revanche com a mesma seed;
- diferença de replay entre Clássico e Almanaque;
- feedback negativo após zebras, separado por faixa de probabilidade.

Metas numéricas devem ser definidas depois de uma semana de baseline real. Não há base local suficiente para inventar um benchmark confiável. A decisão de seguir para Desafio Diário deve depender de convites que geram partidas concluídas, não apenas de cliques no botão de compartilhar.

## O que não copiar agora

- **Ranking calculado no cliente:** fácil de manipular e incompatível com uma competição confiável.
- **Conta obrigatória no primeiro acesso:** reduziria a principal vantagem do browser game, que é começar imediatamente.
- **Multiplayer em tempo real antes do desafio assíncrono:** custo alto para uma demanda ainda não medida.
- **Grande volume de modos de uma vez:** fragmenta analytics e dificulta entender por que o núcleo funciona.
- **Ratings sem explicação:** o projeto já investiu em proveniência e deve transformá-la em diferencial visível.
- **Aleatoriedade usada para forçar replay:** replay deve nascer de escolhas, histórias e desafios, não da sensação de resultado arbitrário.
- **Cópia visual, nome ou texto do 7a0:** aproveitar padrões de produto não autoriza reproduzir identidade, conteúdo ou assets.

## Riscos a controlar

| Risco | Controle proposto |
|---|---|
| Card bonito, mas sem conversão | Incluir convite/CTA, token de origem e medir campanha concluída pelo convidado. |
| Seed quebrar após atualização de dados | Fixar versão do dataset e algoritmo; expirar desafios incompatíveis com mensagem clara. |
| Save atual ser invalidado | Migrar quando possível; se não, avisar antes do deploy e preservar resumo exportável. |
| Novo plano de jogo desbalancear o motor | Testes unitários, 100 mil campanhas, distribuição por plano e limites de probabilidade. |
| Ranking receber resultados forjados | Recalcular no servidor a partir de escolhas e seed; RLS; idempotência por desafio/usuário. |
| Analytics coletar informação indevida | Manter propriedades allowlisted, IDs aleatórios e nenhum e-mail/nome em eventos. |
| Catálogo público inflar a home | Rotas e chunks sob demanda; gerar sitemap sem importar todos os anos no bundle inicial. |
| Crescimento preceder revisão histórica | Manter rótulo “ratings estimados”, registrar revisão independente e não promover anos incompletos. |

## Fontes externas

Consultadas em 12 de setembro de 2026:

- [7a0 — página inicial](https://7a0.com.br/)
- [7a0 — Como jogar](https://7a0.com.br/como-jogar)
- [7a0 — Sobre](https://7a0.com.br/sobre)
- [7a0 — FAQ](https://7a0.com.br/faq)
- [7a0 — Desafio do Dia](https://7a0.com.br/daily)
- [7a0 — Jogar com amigos](https://7a0.com.br/multi)
- [7a0 — Modo Livre](https://7a0.com.br/livre)
- [7a0 — Perfil](https://7a0.com.br/perfil)
- [7a0 — Copas](https://7a0.com.br/copas)
- [Folha Vitória — relato de uso e repetição](https://www.folhavitoria.com.br/copa-do-mundo/joguei-7-a-0-a-nova-febre-da-copa-do-mundo-na-internet-e-fui-humilhado/)
- [The Gaming Era — acesso, duração curta e multiplayer](https://gamingera.biz/esqueca-jogo-netflix-copa-do-mundo-7a0/)
- [Mediavida — resultados compartilhados, repetição, modo difícil e crítica à aleatoriedade](https://www.mediavida.com/foro/deportes/7a0-juego-del-mundial-736204)
- [Reddit r/futebol — recepção, replay e percepção de resultados improváveis](https://www.reddit.com/r/futebol/comments/1u2lwac/jogo_de_navegador_7a0_sete_a_zero/)
- [Reddit r/Futebola — estratégia, Almanaque e críticas à aleatoriedade](https://www.reddit.com/r/Futebola/comments/1u3z2nl/rapaz_isso_aqui_%C3%A9_o_jeito_mais_f%C3%A1cil_de_coringar/)
- [Reddit r/reclamacoesfuteis — confiança no motor](https://www.reddit.com/r/reclamacoesfuteis/comments/1uz0g53/odeio_como_no_jogo_7a0_a_vit%C3%B3ria_%C3%A9_aleat%C3%B3ria_e/)

## Evidência interna do Draft Lendas

- [README](../README.md)
- [Status do projeto](status-do-projeto.md)
- [Readiness histórico](historical-readiness-2011-2025.md)
- [Motor de jogo](../src/game/engine.ts)
- [Save de campanha](../src/game/campaign.ts)
- [Configuração de produto](../src/game/product-config.ts)
- [Analytics](../src/game/analytics.ts)
- [Relatório de partida](../src/components/MatchReport.tsx)
- [Detalhes de pesquisa](../src/components/ResearchDialog.tsx)
- [Política de analytics](analytics-privacy.md)
