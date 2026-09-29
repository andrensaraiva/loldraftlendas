import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminClient } from './supabase';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Supabase public key and admin session', () => {
  it('uses the publishable key for login and the user JWT for protected requests', async () => {
    const requests: RequestInit[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        requests.push(init);
        return new Response(
          JSON.stringify(
            requests.length === 1 ? { access_token: 'user-session-jwt', expires_in: 3600 } : true,
          ),
          { status: 200 },
        );
      }),
    );

    const client = new SupabaseAdminClient('https://project.supabase.co', 'sb_publishable_test');
    const session = await client.signIn('admin@example.test', 'test-password');
    expect(await client.isAdmin(session)).toBe(true);

    expect(requests[0].headers).toMatchObject({ apikey: 'sb_publishable_test' });
    expect(requests[0].headers).not.toHaveProperty('Authorization');
    expect(requests[1].headers).toMatchObject({
      apikey: 'sb_publishable_test',
      Authorization: 'Bearer user-session-jwt',
    });
  });
});
