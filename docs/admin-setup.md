# Admin Setup

This subphase adds the private `/admin` interface, a configuration record, and the database-side authorization boundary. It does not create a normal player account system.

## Local Demonstration Without Supabase

For a visual and functional test of the admin form before creating a Supabase project, add this line to `.env.local`:

```dotenv
VITE_ADMIN_DEMO_MODE=true
```

Run `npm run dev` and open `/admin`. The page clearly shows **MODO DE DEMONSTRAÇÃO LOCAL**. It has no authentication, sends no requests, and keeps configuration only in React memory, so every change disappears after a page refresh. The game also enables in-memory analytics and the end-of-campaign feedback form in this mode, but discards both immediately. The switch is deliberately ignored by production builds.

Remove `VITE_ADMIN_DEMO_MODE` before configuring Supabase or deploying.

## 1. Create the Supabase Project

Create a Supabase project, then run these migrations in filename order in the project's SQL Editor or through the Supabase CLI:

- [20260909153000_admin_config.sql](../supabase/migrations/20260909153000_admin_config.sql)
- [20260909160000_analytics_feedback.sql](../supabase/migrations/20260909160000_analytics_feedback.sql)
- [20260909170000_admin_dashboard.sql](../supabase/migrations/20260909170000_admin_dashboard.sql)
- [20260909172000_public_config_and_analytics_validation.sql](../supabase/migrations/20260909172000_public_config_and_analytics_validation.sql)
- [20260912110000_campaign_sharing_analytics.sql](../supabase/migrations/20260912110000_campaign_sharing_analytics.sql)

The migrations create:

- `public.admin_users`, an explicit allowlist keyed by `auth.users.id`.
- `public.product_config`, the singleton configuration record.
- `public.is_admin()`, a security-definer authorization check.
- RLS that allows only authorized users to read config.
- `public.update_product_config(...)`, an authorized optimistic-locking update RPC.
- Anonymous analytics and feedback ingest RPCs that cannot read stored data.
- An admin-only aggregate dashboard RPC, incluindo intenção/conclusão de compartilhamento e downloads do card; ele não retorna eventos individuais de visitantes ao navegador.
- A complete public configuration snapshot plus an allowlisted analytics-property schema.

Create the maintainer account in Supabase Auth, copy its UUID, and add it in the SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('AUTH_USER_UUID_HERE');
```

Being authenticated alone grants no configuration access. All config reads require `is_admin()` under RLS, and updates execute only through the authorization-checking RPC.

## 2. Configure the Frontend

Create `.env.local` from [.env.example](../.env.example) and set the public project URL and anon key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is expected to be public. Never use a service-role key or any administrative secret in a `VITE_*` variable.

Restart `npm run dev`, then visit `/admin`. The short-lived admin session is kept only in browser `sessionStorage`; Supabase RLS remains the actual authorization boundary.

## Configuration Safety

The admin form writes the next product configuration with a version check. Existing campaigns retain their locally saved players, draft state, tournament progress, results, and playback settings. This does not retroactively modify a campaign save.

Anonymous analytics and optional feedback are collected when the public configuration enables analytics. The complete data contract is in [analytics-privacy.md](analytics-privacy.md).

The dashboard now reports conversion, campaign outcomes, durations, exchanges, sharing, historic player picks/rejections, years, draft regions, device type, and anonymous feedback. It uses `get_admin_dashboard_metrics()` and is separately failure-safe: an unavailable dashboard migration cannot block the configuration form.

For the game, public configuration is applied only when a player starts a new draft, only if the configured dataset version matches and every role keeps an eligible pool. The active campaign saves this rules snapshot, so a later admin update cannot corrupt its draft or exchanges. The maintenance banner is displayed independently.
