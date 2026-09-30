# Beta Readiness

Atualizado em 2026-09-30.

## Validado localmente

- Build de produção, TypeScript e 113 testes unitários. A suíte E2E completa mantém a evidência dos checkpoints anteriores; convite e chat foram revalidados no incremento abaixo.
- Incremento de 2026-09-30: 14 testes da interface online habilitada com Auth/RPC simulados e seis regressões públicas/duelo em Chromium desktop/mobile. Build, TypeScript, auditoria, preflight e catálogo passaram; suíte completa, Firefox/WebKit e replay SQL preservam a evidência do checkpoint anterior.
- Smoke do fluxo público em Chromium, Firefox e WebKit.
- Catálogo completo com 345 identidades aprovadas e 690 WebPs de 768 px validados na CI, incluindo limites individuais e agregados de bytes.
- Retratos em 31,76/35 MiB e silhuetas lossless em 7,91/9 MiB; somente a primeira carta é eager, e o cache de runtime não pré-carrega o catálogo.
- Home, início do draft e arquivo histórico sem erros de página nos três motores.
- Orçamento estático: JavaScript inicial abaixo de 500 kB e CSS inicial abaixo de 100 kB.
- Manifesto instalável, ícones 192/512, service worker com `/admin` network-only, robots e 584 URLs no sitemap, incluindo `/duelo`.
- Smoke pós-deploy reproduzível para home, arquivo, manifesto, robots e sitemap.
- Preparação operacional reproduzível para migrations/RLS, ambiente de produção, headers, deploy e smoke Supabase. As dezessete migrations do checkpoint anterior passaram na CI; após recuperar três versões do histórico remoto, as vinte migrations, lint e smokes SQL de configuração/salas passaram em banco local limpo em 2026-09-30.
- Movimento reduzido desliga transições/animações globalmente; a celebração de título é decorativa e não captura interação.
- Feedback curto de campanha e feedback contextual de rating já existem, mas só enviam fora do modo demo quando analytics/Supabase estiverem configurados.

## Supabase validado em 2026-09-30

- Projeto `qiduotxlyyilpirvxgvm` conectado; vinte migrations sincronizadas, 785 candidatos e oito tabelas com RLS. Administrador e configuração existentes preservados.
- Auth anônima habilitada com limite 30; `.env.local` configurado com chave pública e convites habilitados para teste local.
- Smoke HTTP remoto e smoke SQL de isolamento aprovados. A configuração pública usa a mesma versão do catálogo do frontend.
- Dois contextos Chromium independentes (desktop e emulação mobile) completaram a mesma BO5 com convite, retomada e recarga. Terceira sessão sem acesso à sala, ao admin ou às tabelas de duelo. Dados de teste removidos.
- O teste não substitui login real do administrador, hospedagem HTTPS, CI do novo commit ou aparelhos físicos. Detalhes em [operations-runbook.md](operations-runbook.md).

## Comandos de aceite

Incremento do chat em 2026-09-30: 21 migrations sincronizadas, replay/lint e três smokes SQL locais aprovados; smoke SQL de chat e teste com duas sessões reais mais um terceiro no Supabase aprovados. A suíte simulada passou 18 E2E desktop/mobile, incluindo mensagens temporárias, mute/unmute privado e recuperação de envio. Os quatro cenários de chat passaram novamente após ajustar reconexão e restauração da página. Nenhuma mensagem foi persistida; dados de teste removidos. Frontend HTTPS e aparelhos físicos continuam pendentes.

```sh
npm test
npm run typecheck
npm run assets:portraits:validate
npm run ops:preflight
npm run build
npm run audit:beta
npm run test:e2e
npm run test:e2e:online
npm run test:e2e:cross-browser
npm run smoke:deploy -- https://seu-dominio.example
```

Instale os três navegadores gerenciados uma vez com:

```sh
npx playwright install chromium firefox webkit
```

## Validações externas pendentes

1. Seguir [operations-runbook.md](operations-runbook.md): validar o login do administrador existente e configurar o ambiente do provedor de hospedagem.
2. Publicar em HTTPS e executar `npm run smoke:deploy -- https://dominio`.
3. Confirmar o funil e os erros reais no painel com eventos de uma sessão de teste.
4. Testar ao menos um iPhone/Safari e um Android/Chrome físicos: instalação, rotação, teclado, compartilhamento e retorno de background.
5. Decidir sobre sons somente após teste com jogadores; nenhum áudio foi incluído sem aprovação.

## Trace de performance pendente

O Chrome DevTools MCP não estava disponível nesta sessão, portanto nenhum valor de LCP, CLS ou INP foi presumido. Para executar a auditoria `web-perf`, adicione ao MCP:

```json
"chrome-devtools": {
  "type": "local",
  "command": ["npx", "-y", "chrome-devtools-mcp@latest"]
}
```

Depois, medir uma build de produção fria, revisar LCP/CLS, cadeia de rede e árvore de acessibilidade. O script `audit:beta` cobre apenas orçamento e integridade estática; não substitui métricas de usuário nem o trace do navegador.
