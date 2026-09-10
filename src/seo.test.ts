import { describe, expect, it, vi } from 'vitest';
import { applyRouteMetadata } from './seo';

describe('route metadata', () => {
  it('marks the private admin route as noindex', () => {
    const setAttribute = vi.fn();
    const documentRoot = {
      title: 'Draft Lendas',
      querySelector: () => ({ setAttribute }),
    } as unknown as Document;
    applyRouteMetadata('/admin/', documentRoot);
    expect(documentRoot.title).toBe('Admin — Draft Lendas');
    expect(setAttribute).toHaveBeenCalledWith('content', 'noindex, nofollow');
  });

  it('keeps public route metadata unchanged', () => {
    const querySelector = vi.fn();
    const documentRoot = { title: 'Draft Lendas', querySelector } as unknown as Document;
    applyRouteMetadata('/', documentRoot);
    expect(documentRoot.title).toBe('Draft Lendas');
    expect(querySelector).not.toHaveBeenCalled();
  });
});
