export function applyRouteMetadata(pathname: string, documentRoot: Document = document): void {
  if (pathname.replace(/\/+$/, '') !== '/admin') return;
  documentRoot.title = 'Admin — Draft Lendas';
  const robots = documentRoot.querySelector<HTMLMetaElement>('meta[name="robots"]');
  robots?.setAttribute('content', 'noindex, nofollow');
}
