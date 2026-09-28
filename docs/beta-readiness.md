# Beta Readiness

Atualizado em 2026-09-28.

## Validado localmente

- Build de produção, TypeScript, 104 testes unitários e suíte E2E completa.
- Smoke do fluxo público em Chromium, Firefox e WebKit.
- Catálogo completo com 345 identidades aprovadas e 690 WebPs de 768 px validados na CI, incluindo limites individuais e agregados de bytes.
- Retratos em 31,76/35 MiB e silhuetas lossless em 7,91/9 MiB; somente a primeira carta é eager, e o cache de runtime não pré-carrega o catálogo.
- Home, início do draft e arquivo histórico sem erros de página nos três motores.
- Orçamento estático: JavaScript inicial abaixo de 500 kB e CSS inicial abaixo de 100 kB.
- Manifesto instalável, ícones 192/512, service worker com `/admin` network-only, robots e 583 URLs no sitemap.
- Smoke pós-deploy reproduzível para home, arquivo, manifesto, robots e sitemap.
- Preparação operacional reproduzível para migrations/RLS, ambiente de produção, headers, deploy e smoke Supabase. As quinze migrations, o lint e o fluxo local de autenticação/allowlist/dashboard passaram; nenhuma conta ou infraestrutura remota foi criada.
- Movimento reduzido desliga transições/animações globalmente; a celebração de título é decorativa e não captura interação.
- Feedback curto de campanha e feedback contextual de rating já existem, mas só enviam fora do modo demo quando analytics/Supabase estiverem configurados.

## Comandos de aceite

```sh
npm test
npm run typecheck
npm run assets:portraits:validate
npm run ops:preflight
npm run build
npm run audit:beta
npm run test:e2e
npm run test:e2e:cross-browser
npm run smoke:deploy -- https://seu-dominio.example
```

Instale os três navegadores gerenciados uma vez com:

```sh
npx playwright install chromium firefox webkit
```

## Validações externas pendentes

1. Seguir [operations-runbook.md](operations-runbook.md): criar o Supabase, reaplicar as quinze migrations, cadastrar o administrador e configurar as variáveis públicas.
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
