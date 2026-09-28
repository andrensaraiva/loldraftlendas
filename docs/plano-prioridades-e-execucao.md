# Plano de Prioridades e Execução

Atualizado em 2026-09-28.

Este documento é o checklist operacional para levar o Draft Lendas da situação atual até uma beta pública. Cada item concluído deve passar pelos seus critérios de aceite, ser registrado aqui e enviado ao Git antes do início do próximo item.

## Regras de execução

- Trabalhar em um item por vez, na ordem abaixo, salvo decisão explícita do responsável pelo projeto.
- Não marcar um item como concluído sem executar os testes proporcionais ao risco.
- Fazer commit e push ao concluir cada item.
- Pedir confirmação do responsável antes de iniciar o item seguinte.
- Dependências externas que exijam credenciais, contas ou aparelhos físicos permanecem bloqueadas até que esses recursos sejam fornecidos.

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

## P1 — Viabilizar beta fechada real

- [ ] **4. Preparar e ativar a operação real.**
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

Perfil de jogador, ranking verificado, multiplayer assíncrono, multiplayer em tempo real, chat e monetização continuam fora do escopo. Sons permanecem opcionais e dependem de validação com usuários.

## Registro de execução

| Data | Item | Estado | Evidência |
| --- | --- | --- | --- |
| 2026-09-28 | 1. Estabilizar CI e suíte E2E | Concluído | 104 unitários, TypeScript, build, auditoria, 60 E2E Chromium e cinco repetições dos cenários corrigidos passaram. O [workflow do checkpoint `48fbe23`](https://github.com/andrensaraiva/loldraftlendas/actions/runs/36468094295) passou com a matriz completa. |
| 2026-09-28 | 2. Sincronizar documentação e estado real | Concluído | Estado atual conferido contra código, manifesto e build; relatório multi-era regenerado de forma byte-estável; 104 unitários, TypeScript, build, auditoria e todos os links locais passaram. |
| 2026-09-28 | 3. Fechar orçamento e validação dos assets | Concluído | 345 silhuetas reconstruídas como WebP lossless, de 24,53 para 7,91 MiB (−67,8%), sem recompressão dos 31,76 MiB de retratos; segunda geração com zero divergências de hash. O validador aprovou 690 assets e passou com unitários, TypeScript, build, auditoria e E2E de retrato/PWA em desktop e mobile. |
