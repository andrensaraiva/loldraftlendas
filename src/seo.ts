export function applyRouteMetadata(pathname: string, documentRoot: Document = document): void {
  const route = pathname.replace(/\/+$/, '');
  if (route === '/admin') {
    documentRoot.title = 'Admin — Draft Lendas';
    const robots = documentRoot.querySelector<HTMLMetaElement>('meta[name="robots"]');
    robots?.setAttribute('content', 'noindex, nofollow');
  }
  if (route === '/duelo') {
    const title = 'Duelo local — Draft Lendas';
    const description =
      'Monte equipes com as mesmas ofertas, passe o aparelho e dispute uma final melhor de cinco com outra pessoa.';
    const canonical = documentRoot.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const url = canonical ? new URL('/duelo', canonical.href).href : null;
    documentRoot.title = title;
    canonical?.setAttribute('href', url ?? '/duelo');
    documentRoot.querySelector('meta[name="description"]')?.setAttribute('content', description);
    documentRoot.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    documentRoot
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', description);
    if (url) documentRoot.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
    documentRoot.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    documentRoot
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute('content', description);
  }
  if (route === '/duelo/sala') {
    documentRoot.title = 'Sala de duelo — Draft Lendas';
    documentRoot.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow');
  }
}
