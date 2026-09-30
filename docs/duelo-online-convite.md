# Duelo online por convite — contrato e fluxo

Decisão confirmada pelo responsável em 2026-09-29 para o item 3B: preparar uma sala assíncrona de duas pessoas por convite. A interface pública só deve ser ligada depois de configurar um Supabase compartilhado e validar a partida em dois aparelhos.

## Experiência

1. O anfitrião escolhe **Criar sala**. Uma sessão anônima identifica seu aparelho, sem pedir e-mail. O servidor sorteia uma seed, cinco contextos e três IDs de lendas para cada posição, usando o catálogo versionado. A sala recebe código de 12 caracteres e expira em sete dias.
2. O anfitrião copia o convite (`/duelo/sala#CODIGO`) ou o código. O fragmento não é enviado ao servidor web. O convidado entra no próprio aparelho; o primeiro acesso válido ocupa a segunda vaga. Outros usuários não conseguem consultar a sala.
3. Ambos montam suas equipes independentemente, a partir das mesmas ofertas, e escolhem um plano. Cada lado envia suas cinco escolhas uma vez. A sala mostra **Aguardando adversário** enquanto falta uma entrega, sem revelar picks ou plano do outro lado.
4. Quando os dois enviam, cada aparelho recebe o estado final e calcula a mesma BO5 determinística com o motor existente. Recarregar a página recupera o estado da sessão anônima. Uma sessão perdida por limpeza dos dados do navegador não pode ser recuperada sem autenticação permanente.
5. Qualquer participante pode cancelar a sala. Convites vencidos ou cancelados não aceitam novas entradas nem entregas. A interface deve explicar o motivo e oferecer criar outra sala.

| Tela/estado           | Informação principal                                                         | Ação disponível                                         |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| Criar convite         | Regras, prazo de sete dias e aviso de que cada aparelho mantém sua sessão    | Criar sala                                              |
| Aguardando convidado  | Código e link copiável; sala ainda sem segunda vaga                          | Copiar convite, atualizar estado, cancelar              |
| Entrar por código     | Código recebido e identificação de sala                                      | Entrar, voltar                                          |
| Meu draft             | Posição, ano, grupo e três cartas por vez; meu progresso                     | Escolher lenda, abrir detalhes, escolher plano e enviar |
| Aguardando adversário | Minha equipe enviada; progresso do outro sem seus picks                      | Atualizar estado, cancelar                              |
| Resultado             | Duas equipes, planos, placar e cada jogo da BO5                              | Novo convite, voltar ao início                          |
| Sala indisponível     | Código inválido, vaga ocupada, expiração ou cancelamento em textos separados | Voltar ou criar nova sala                               |

Os controles seguem o padrão de teclado e toque do duelo local. A ação de enviar exige revisão da própria equipe e confirmação; estados de carregamento usam `role="status"`, erros usam `role="alert"` e o foco vai para o título da próxima etapa.

O primeiro lançamento é amistoso. Não gera ranking nem resultado público. A seed e as ofertas são geradas no banco; o cliente não escolhe candidatos arbitrários. Cada entrega é validada contra os três IDs de cada posição. O placar é reproduzido nos dois clientes, mas a simulação ainda não é uma prova verificável por servidor, requisito para ranking futuro.

## Chat temporário da sala

Em 2026-09-30, o responsável pediu um chat simples e esclareceu que ele deve ser visto somente pelas duas pessoas da mesma sala.

- O chat aparece durante o draft, a espera e o resultado; sair, trocar de sala ou recarregar descarta as mensagens daquele navegador. Quem entra depois não recebe histórico. São mantidas no máximo 60 mensagens em memória, com até 300 caracteres cada.
- **Silenciar adversário** remove as mensagens recebidas da tela e ignora novas mensagens dele. A preferência fica apenas no navegador, por sala e posição; não é enviada nem avisada ao adversário. **Mostrar mensagens do adversário** volta a aceitar mensagens novas, sem recuperar as descartadas. O jogador silenciado continua recebendo o que o outro envia.
- Texto é renderizado como texto, sem HTML ou links automáticos. Falha de envio preserva o rascunho para retry; queda de conexão do chat não interrompe o draft. O chat sai da interface ao cancelar ou vencer a sala.
- O transporte usa [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) por WebSocket, sem tabela de chat, gravação em storage, analytics ou replay. A confirmação de envio indica recebimento pelo serviço; mensagens só chegam a participantes conectados naquele instante.
- A migration `20260930150000_room_chat_broadcast.sql` autoriza dois canais privados, `duel-chat:CODIGO:host` e `duel-chat:CODIGO:guest`. A função `can_access_duel_chat` verifica a identidade, participação e validade da sala. Ambos podem receber; só o dono da posição pode publicar no canal dela. A interface identifica o remetente pelo canal autorizado, ignorando identidades declaradas no payload.
- Conforme a [autorização do Realtime](https://supabase.com/docs/guides/realtime/authorization), as permissões são conferidas na conexão e renovação do JWT. Cancelar/expirar impede novas conexões; o cliente normal fecha os canais quando observa o encerramento. Revogação instantânea de um cliente modificado já conectado não é garantida pelo cache do serviço.

`scripts/sql/smoke-room-chat.sql` cobre anfitrião, convidado, terceiro, falsificação de posição, tópicos inválidos, cancelamento e expiração. A suíte `test:e2e:online` inclui chat temporário, silenciamento privado e reversível, recarga, texto sem HTML e recuperação de envio em desktop/mobile.

## Banco das salas

As migrations `20260929110000_online_duel_rooms.sql` e `20260929111000_online_duel_catalog.sql` acrescentam três tabelas com RLS e sem leitura ou escrita direta para clientes. Apenas RPCs `SECURITY DEFINER` com autorização explícita são expostos a usuários autenticados:

| RPC                                   | Entrada                  | Saída          | Regra                                                                                                                       |
| ------------------------------------- | ------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `create_duel_room()`                  | Nenhuma                  | Código         | Máximo de dez salas criadas por usuário em 24 horas. Sorteio e ofertas feitos no banco.                                     |
| `join_duel_room(code)`                | Código                   | Estado visível | Atribui a vaga de convidado uma vez; anfitrião não pode ocupar as duas vagas.                                               |
| `get_duel_room(code)`                 | Código                   | Estado visível | Somente participantes. Picks do outro lado aparecem apenas após ambas as entregas.                                          |
| `submit_duel_team(code, picks, plan)` | Código, cinco IDs, plano | Estado visível | Rejeita picks fora das ofertas, plano inválido, sala vencida e alteração após envio. Repetir a mesma entrega é idempotente. |
| `cancel_duel_room(code)`              | Código                   | Estado visível | Só participante; bloqueia entrada e envio futuros.                                                                          |

O estado visível contém código, seed, versão do dataset, ofertas, vaga do solicitante, prazo, estado da sala, sua entrega e indicadores de conclusão. Quando ambos terminam, inclui as duas equipes e planos. Código de convite não autentica ninguém por si só: o primeiro convidado autenticado ocupa a vaga, e as RPCs passam a exigir a UUID dessa sessão. A sala não aparece em listagens públicas. O catálogo contém apenas IDs, posição, ano, grupo e equipe para o sorteio, sem perfis ou dados privados.

## Autenticação e operação

O cliente faz `signInAnonymously()` somente ao criar ou aceitar um convite. Usuários anônimos usam a role `authenticated`; os RPCs administrativos existentes continuam protegidos por `is_admin()` e allowlist. Na ativação remota, habilitar **anonymous sign-ins** com limite de taxa do Auth, manter cadastro por e-mail desativado para visitantes e testar a RLS com três identidades: anfitrião, convidado e terceiro. O cliente ainda não coleta token de CAPTCHA: se o projeto exigir CAPTCHA/Turnstile no Auth, integrar o desafio e passar seu token a `signInAnonymously()` antes de ligar a flag pública. [Documentação de autenticação anônima](https://supabase.com/docs/guides/auth/auth-anonymous), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Atualizações podem começar com consulta periódica ao RPC a cada alguns segundos enquanto a sala estiver aberta; a correção não depende de WebSocket. Realtime privado só deve ser acrescentado se a latência exigir e após testar suas políticas. Isso preserva reconexão por leitura do estado persistido. [Autorização do Realtime](https://supabase.com/docs/guides/realtime/authorization).

As salas deixam de aceitar ações após sete dias. Na operação remota, agendar a remoção das salas com mais de 30 dias e revisar a retenção de usuários anônimos que não tenham outra atividade. O código do convite não deve entrar em analytics, logs de erro nem parâmetros de campanhas compartilhadas.

## Aceite antes de exibir a opção no produto

### Validação automatizada da interface

Execute `npm run test:e2e:online`. A configuração `playwright.online.config.ts` inicia um servidor separado na porta 5174 com a opção online habilitada e intercepta Auth/RPC com um serviço simulado em memória. Não exige conta, credenciais nem conexão com Supabase. O service worker fica fora desse ambiente para permitir falhas de rede controladas; a suíte pública continua cobrindo a PWA e a opção online desativada.

Em 2026-09-30, passaram sete cenários em cada viewport (14 execuções): duas sessões independentes com retomada e a mesma BO5, catálogo incompatível após polling, falha no download do dataset e recuperação, troca para código vazio/inválido, falhas de consulta/envio com retry e encerramento por cancelamento/expiração. O foco acompanha cada posição do draft; mensagens de carregamento e ações não são apagadas por consultas automáticas. Consultas periódicas não se sobrepõem e respostas de consultas antigas são ignoradas depois de sair da sala.

Esses testes verificam o contrato HTTP e a interface. A autorização real também é coberta pelo smoke SQL. A suíte foi adicionada ao workflow de CI e seus artefatos ficam em `test-results/online`.

### Validação no Supabase compartilhado em 2026-09-30

O projeto `qiduotxlyyilpirvxgvm` recebeu as duas migrations de convite, com catálogo de 785 candidatos e histórico total de vinte versões sincronizado. Auth anônima foi habilitada com limite 30, e o frontend local usa a chave pública publishable com a flag online ligada.

Dois contextos Chromium independentes, desktop e emulação iPhone 13, concluíram convite, draft, retomada, envio e a mesma BO5 de cinco jogos (3 × 2), preservada após recarga. O convidado não recebeu os picks/plano do anfitrião antes da própria entrega. Uma terceira sessão real não conseguiu consultar/ocupar a sala, abrir o dashboard ou ler diretamente as tabelas de duelo. Os smokes SQL e HTTP passaram; os usuários e a sala criados pelo teste foram removidos. O cadastro administrativo existente foi preservado.

Este aceite cobre o backend real com frontend local. Hospedagem HTTPS, dois aparelhos físicos e retenção agendada permanecem pendentes no [runbook](operations-runbook.md).

### Gates remotos e de banco

- Replay e lint das migrations em banco limpo; catálogo gerado de modo reproduzível a partir do dataset atual.
- Anfitrião e convidado terminam em dois navegadores/aparelhos e veem o mesmo placar após atualizar.
- Terceiro participante não lê a sala; convidado não vê as escolhas do anfitrião antes de enviar.
- Corrida por uma vaga, duplicata de envio, código inválido, expiração, cancelamento e versão incompatível são cobertos.
- Smoke remoto confirma configuração de Auth anônima, limitação de abuso e ausência de acesso administrativo para jogadores.

O exemplo de ambiente mantém `VITE_ONLINE_DUEL_ENABLED=false` para builds públicos até concluir os gates externos. Nesta máquina, `.env.local` habilita `/duelo/sala` contra o Supabase compartilhado.
