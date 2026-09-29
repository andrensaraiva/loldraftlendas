# Plano de Prioridades e Execução

Atualizado em 2026-09-29.

Este documento é o checklist operacional para levar o Draft Lendas da situação atual até uma beta pública. Cada item concluído deve passar pelos seus critérios de aceite, ser registrado aqui e enviado ao Git antes do início do próximo item.

## Regras de execução

- Trabalhar em um item por vez, na ordem abaixo, salvo decisão explícita do responsável pelo projeto.
- Não marcar um item como concluído sem executar os testes proporcionais ao risco.
- Fazer commit e push ao concluir cada item.
- Pedir confirmação do responsável antes de iniciar o item seguinte.
- Dependências externas que exijam credenciais, contas ou aparelhos físicos permanecem bloqueadas até que esses recursos sejam fornecidos.

**Mudança de prioridade em 2026-09-29:** o responsável pediu uma nova revisão do 7a0 e a inclusão de multiplayer antes de configurar o Supabase remoto. O item 3A abaixo precede a retomada do item 4. A [revisão atual](revisao-7a0-2026-09-29.md) registra evidências, diferenças e dependências. Um duelo local foi implementado como primeiro incremento; o responsável confirmou a sala online por convite como próximo passo.

## P0 — Restaurar uma baseline confiável

- [x] **1. Estabilizar CI e suíte E2E.**
  - [x] Atualizar o teste de fallback de retratos para o catálogo completo.
  - [x] Remover a corrida entre navegação por teclado, estado e scroll do carrossel mobile.
  - [x] Repetir o teste instável para comprovar estabilidade.
  - [x] Executar unitários, TypeScript, build, auditoria da beta e E2E Chromium.
  - [x] Confirmar a execução do workflow no GitHub após o push.
- [x] **2. Sincronizar documentação e estado real do produto.**
  - [x] Registrar 345/345 identidades e 32 lotes do catálogo de retratos.
  - [x] Corrigir quantidades de conquistas, testes, bundles e retratos.
  - [x] Marcar roadmaps antigos como documentos históricos quando aplicável.
  - [x] Remover pendências que já foram implementadas.
- [x] **3. Fechar orçamento e validação dos assets de jogadores.**
  - [x] Medir retratos e silhuetas contra o orçamento documentado.
  - [x] Reotimizar os arquivos ou aprovar um novo orçamento baseado em medição.
  - [x] Fazer o validador reprovar dimensões, formato ou tamanho fora do contrato.
  - [x] Confirmar impacto no carregamento mobile e no cache da PWA.

## P0 adicional — Produto social antes da ativação remota

- [x] **3A. Revisar o 7a0 atual e entregar o primeiro multiplayer do Draft Lendas.**
  - [x] Conferir o site público atual e registrar recursos, evidências e limites da observação na [revisão de 2026-09-29](revisao-7a0-2026-09-29.md).
  - [x] Adotar o modo local como primeiro incremento executável antes da ativação remota.
  - [x] Especificar regras, fluxo, persistência e critérios de resultado do duelo local.
  - [x] Validar a implementação com suíte completa, mobile e teclado; preservar campanha solo e saves existentes.
  - [x] Registrar o que depende de serviço remoto antes de chamar qualquer fluxo de “online”.
- [ ] **3B. Definir a evolução do multiplayer antes da ativação remota.**
  - [x] Confirmar a [sala assíncrona por convite](duelo-online-convite.md) com o responsável e preparar fluxo, contrato, privacidade e estados de erro revisáveis.
  - [x] Versionar o catálogo de candidatos, as migrations de sala protegida e o contrato tipado de resultado.
  - [x] Preparar interface de convite e draft independente por aparelho atrás de feature flag desligada.
  - [x] Validar replay, lint e isolamento das novas migrations na CI.
  - [ ] Testar a partida em dois aparelhos após configurar o serviço compartilhado.

## P1 — Viabilizar beta fechada real

- [ ] **4. Preparar e ativar a operação real.**
  - [x] Versionar e validar localmente configuração, migrations/RLS, autenticação administrativa, preflight, build protegido, smokes e runbook sem criar recursos remotos.
  - [ ] Criar o projeto Supabase e aplicar as migrations na ordem documentada.
  - [ ] Configurar administrador, allowlist e variáveis públicas.
  - [ ] Validar autenticação, RLS, analytics, feedback e dashboard fora do modo demo.
  - [ ] Publicar em HTTPS e executar o smoke pós-deploy.
  - [ ] Configurar monitoramento operacional e conferir eventos do funil.
- [ ] **5. Executar validação externa da beta fechada.**
  - [ ] Testar iPhone/Safari e Android/Chrome físicos.
  - [ ] Medir LCP, CLS e INP em build fria e ambiente publicado.
  - [ ] Validar instalação PWA, rotação, teclado, compartilhamento e retorno do background.
  - [ ] Rodar roteiro de entrevistas e estabelecer a primeira baseline real do funil.

## P2 — Abrir a beta pública

- [ ] **6. Implementar resultado público e comparação — Pacote 6.**
  - [ ] Criar persistência mínima com RLS, validação, idempotência e limitação de abuso.
  - [ ] Implementar `/resultado/:slug` e comparação entre resultados compatíveis.
  - [ ] Servir Open Graph específico por resultado.
  - [ ] Adicionar métricas, moderação, exclusão administrativa e compatibilidade de dataset.
  - [ ] Cobrir backend, rotas e compartilhamento com testes.
- [ ] **7. Fechar os gates da beta pública.**
  - [ ] Manter CI, smoke, Firefox, WebKit e aparelhos físicos verdes.
  - [ ] Confirmar monitoramento de erros e recuperação.
  - [ ] Tomar decisão sobre modificadores diários usando dados da beta fechada.
  - [ ] Revisar privacidade, textos públicos, SEO e política de feedback.

## P3 — Readiness histórica

- [ ] **8. Registrar revisão externa independente de 2014–2025.**
  - [ ] Definir protocolo e evidências mínimas de revisão.
  - [ ] Registrar cada aprovação em `external-reviews.json` sem autoaprovação.
  - [ ] Promover somente anos que cumprirem todos os gates.
- [ ] **9. Pesquisar 2013 e avaliar 2012–2011.**
  - [ ] Aceitar somente fontes que sustentem partidas, elencos, evidências, pools e assets.
  - [ ] Recalibrar e versionar o dataset a cada edição aceita.
  - [ ] Manter anos sem evidência suficiente como `INCOMPLETE`.

## Fora do ciclo atual

O primeiro multiplayer entrou no escopo por decisão do responsável em 2026-09-29; o duelo local foi o primeiro incremento. Perfil de jogador, ranking verificado, chat e monetização continuam fora do escopo. Sons permanecem opcionais e dependem de validação com usuários.

## Registro de execução

| Data       | Item                                       | Estado    | Evidência                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-28 | 1. Estabilizar CI e suíte E2E              | Concluído | 104 unitários, TypeScript, build, auditoria, 60 E2E Chromium e cinco repetições dos cenários corrigidos passaram. O [workflow do checkpoint `48fbe23`](https://github.com/andrensaraiva/loldraftlendas/actions/runs/36468094295) passou com a matriz completa.                                                                                 |
| 2026-09-28 | 2. Sincronizar documentação e estado real  | Concluído | Estado atual conferido contra código, manifesto e build; relatório multi-era regenerado de forma byte-estável; 104 unitários, TypeScript, build, auditoria e todos os links locais passaram.                                                                                                                                                   |
| 2026-09-28 | 3. Fechar orçamento e validação dos assets | Concluído | 345 silhuetas reconstruídas como WebP lossless, de 24,53 para 7,91 MiB (−67,8%), sem recompressão dos 31,76 MiB de retratos; segunda geração com zero divergências de hash. O validador aprovou 690 assets e passou com unitários, TypeScript, build, auditoria e E2E de retrato/PWA em desktop e mobile.                                      |
| 2026-09-28 | 4A. Preparar a operação real               | Concluído | Preparação somente local: replay das quinze migrations, lint sem erros, RLS das cinco tabelas, autenticação/allowlist/dashboard, analytics desligado por padrão, ambiente HTTPS sem secrets administrativos, build protegido, headers/cache, smokes, workflow manual e runbook. Contas remotas, deploy e monitoramento permanecem desmarcados. |
| 2026-09-29 | 3A. Revisar 7a0 e entregar duelo local     | Concluído localmente | [Revisão atual](revisao-7a0-2026-09-29.md), rota `/duelo`, ofertas iguais, planos simétricos, BO5 determinística e save isolado. 108 unitários, build, auditoria (493,43 kB de JS inicial), 62 E2E Chromium e dois smokes Firefox/WebKit passaram; 8 pulos condicionais esperados. Preferência pela próxima evolução online registrada no item 3B. |
| 2026-09-29 | 3B. Preparar sala online por convite       | Preparação local concluída; teste remoto pendente | [Contrato e fluxo](duelo-online-convite.md), 17 migrations com replay/lint na CI, smoke SQL de isolamento, catálogo de 785 candidatos e interface sob flag desligada. O serviço Supabase compartilhado e o teste em dois aparelhos seguem no item 4. |
