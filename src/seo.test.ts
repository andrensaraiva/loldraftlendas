import { describe, expect, it, vi } from 'vitest';
import { applyRouteMetadata } from './seo';

describe('route metadata', () => {
  it('marks the private admin route as noindex', () => {
    const setAttribute = vi.fn();
    const documentRoot = {
      title: 'KingOfRift',
      querySelector: () => ({ setAttribute }),
    } as unknown as Document;
    applyRouteMetadata('/admin/', documentRoot);
    expect(documentRoot.title).toBe('Admin — KingOfRift');
    expect(setAttribute).toHaveBeenCalledWith('content', 'noindex, nofollow');
  });

  it('keeps public route metadata unchanged', () => {
    const querySelector = vi.fn();
    const documentRoot = { title: 'KingOfRift', querySelector } as unknown as Document;
    applyRouteMetadata('/', documentRoot);
    expect(documentRoot.title).toBe('KingOfRift');
    expect(querySelector).not.toHaveBeenCalled();
  });
});
