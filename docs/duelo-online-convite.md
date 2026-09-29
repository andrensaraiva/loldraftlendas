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

## Contrato do banco

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

O cliente fará `signInAnonymously()` somente ao criar ou aceitar um convite. Usuários anônimos usam a role `authenticated`; os RPCs administrativos existentes continuam protegidos por `is_admin()` e allowlist. Na ativação remota, habilitar **anonymous sign-ins** com limite de taxa e CAPTCHA/Turnstile, manter cadastro por e-mail desativado para visitantes e testar a RLS com três identidades: anfitrião, convidado e terceiro. [Documentação de autenticação anônima](https://supabase.com/docs/guides/auth/auth-anonymous), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Atualizações podem começar com consulta periódica ao RPC a cada alguns segundos enquanto a sala estiver aberta; a correção não depende de WebSocket. Realtime privado só deve ser acrescentado se a latência exigir e após testar suas políticas. Isso preserva reconexão por leitura do estado persistido. [Autorização do Realtime](https://supabase.com/docs/guides/realtime/authorization).

As salas deixam de aceitar ações após sete dias. Na operação remota, agendar a remoção das salas com mais de 30 dias e revisar a retenção de usuários anônimos que não tenham outra atividade. O código do convite não deve entrar em analytics, logs de erro nem parâmetros de campanhas compartilhadas.

## Aceite antes de exibir a opção no produto

- Replay e lint das migrations em banco limpo; catálogo gerado de modo reproduzível a partir do dataset atual.
- Anfitrião e convidado terminam em dois navegadores/aparelhos e veem o mesmo placar após atualizar.
- Terceiro participante não lê a sala; convidado não vê as escolhas do anfitrião antes de enviar.
- Corrida por uma vaga, duplicata de envio, código inválido, expiração, cancelamento e versão incompatível são cobertos.
- Smoke remoto confirma configuração de Auth anônima, limitação de abuso e ausência de acesso administrativo para jogadores.

Até esses testes, `/duelo` continua oferecendo apenas o duelo local já publicado. A criação e a conexão remotas dependem do item 4 do plano.
