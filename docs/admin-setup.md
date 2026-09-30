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

Create a Supabase project, then apply these migrations in filename order through the versioned Supabase CLI workflow. Do not apply schema changes manually in the remote SQL Editor, because that bypasses migration history.

- [20260909153000_admin_config.sql](../supabase/migrations/20260909153000_admin_config.sql)
- [20260909160000_analytics_feedback.sql](../supabase/migrations/20260909160000_analytics_feedback.sql)
- [20260909170000_admin_dashboard.sql](../supabase/migrations/20260909170000_admin_dashboard.sql)
- [20260909172000_public_config_and_analytics_validation.sql](../supabase/migrations/20260909172000_public_config_and_analytics_validation.sql)
- [20260912110000_campaign_sharing_analytics.sql](../supabase/migrations/20260912110000_campaign_sharing_analytics.sql)
- [20260912120000_deterministic_challenges.sql](../supabase/migrations/20260912120000_deterministic_challenges.sql)
- [20260912130000_contextual_rating_feedback.sql](../supabase/migrations/20260912130000_contextual_rating_feedback.sql)
- [20260913120000_almanac_mode.sql](../supabase/migrations/20260913120000_almanac_mode.sql)
- [20260913130000_game_plans.sql](../supabase/migrations/20260913130000_game_plans.sql)
- [20260913140000_daily_challenges.sql](../supabase/migrations/20260913140000_daily_challenges.sql)
- [20260918100000_campaign_navigation_analytics.sql](../supabase/migrations/20260918100000_campaign_navigation_analytics.sql)
- [20260918110000_campaign_report_analytics.sql](../supabase/migrations/20260918110000_campaign_report_analytics.sql)
- [20260918120000_campaign_journey_analytics.sql](../supabase/migrations/20260918120000_campaign_journey_analytics.sql)
- [20260918130000_onboarding_analytics.sql](../supabase/migrations/20260918130000_onboarding_analytics.sql)
- [20260919100000_daily_modifiers_analytics.sql](../supabase/migrations/20260919100000_daily_modifiers_analytics.sql)
- [20260921142000_fix_game_plan_dashboard_timestamp.sql](../supabase/migrations/20260921142000_fix_game_plan_dashboard_timestamp.sql)
- [20260921183500_sync_product_config_dataset.sql](../supabase/migrations/20260921183500_sync_product_config_dataset.sql)
- [20260921190000_grant_admin_product_config_select.sql](../supabase/migrations/20260921190000_grant_admin_product_config_select.sql)
- [20260929110000_online_duel_rooms.sql](../supabase/migrations/20260929110000_online_duel_rooms.sql)
- [20260929111000_online_duel_catalog.sql](../supabase/migrations/20260929111000_online_duel_catalog.sql)

The migrations create:

- `public.admin_users`, an explicit allowlist keyed by `auth.users.id`.
- `public.product_config`, the singleton configuration record.
- `public.is_admin()`, a security-definer authorization check.
- RLS that allows only authorized users to read config.
- `public.update_product_config(...)`, an authorized optimistic-locking update RPC.
- Anonymous analytics and feedback ingest RPCs that cannot read stored data.
- Contextual rating-review feedback with public historical IDs, categorized reasons, RLS and an admin-only aggregate/read model.
- An admin-only aggregate dashboard RPC, incluindo intenção/conclusão de compartilhamento, downloads do card e abertura/início/conclusão dos desafios; ele não retorna eventos individuais de visitantes ao navegador.
- A complete public configuration snapshot plus an allowlisted analytics-property schema.
- Aggregate completion and replay comparison between Classic and Almanac modes.
- Aggregate campaign completion and title rates for the four game plans.
- Private invitation rooms for two anonymous players, with server-generated offers and RPCs that release both teams only after both submissions. See [duelo-online-convite.md](duelo-online-convite.md).

The initial product configuration keeps analytics disabled. Enable it from the authenticated admin only after the production RLS, ingestion, dashboard, and privacy checks pass.

The three migrations dated September 21 were recovered from the existing remote migration history on September 30. They fix dashboard ordering, synchronize the legacy dataset/year combination with `multi-era-v1.6.0` and Worlds 2014–2025, and grant authenticated config reads subject to RLS. All twenty migrations passed a fresh local replay and SQL lint. The remote smoke rejects a dataset version that differs from the frontend and checks direct anonymous access to all eight public tables.

Project `qiduotxlyyilpirvxgvm` now has all twenty migrations. Its existing admin account and product configuration were preserved; only the two invitation migrations were pending. Anonymous sign-ins are enabled with `auth.rate_limit.anonymous_users=30`, and a real two-session invitation match passed. The local ignored `.env.local` connects to this project with the online flag enabled. Frontend hosting, physical-device testing, and an actual admin password login remain pending; see the deployment record in [operations-runbook.md](operations-runbook.md).

The repository pins the CLI and includes `supabase/config.toml`. Validate locally with Docker, inspect the remote plan, and only then apply it:

```sh
npx supabase start
npx supabase db reset --local
npx supabase link --project-ref PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

The complete activation and rollback sequence is in [operations-runbook.md](operations-runbook.md).

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

`VITE_SUPABASE_ANON_KEY` is a legacy variable name and accepts the current `sb_publishable_...` key from the project's Connect panel. The key is public. Never use a secret or service-role key in a `VITE_*` variable.

Restart `npm run dev`, then visit `/admin`. The short-lived admin session is kept only in browser `sessionStorage`; Supabase RLS remains the actual authorization boundary.

## Configuration Safety

The admin form writes the next product configuration with a version check. Existing campaigns retain their locally saved players, draft state, tournament progress, results, and playback settings. This does not retroactively modify a campaign save.

Anonymous analytics and optional feedback are collected when the public configuration enables analytics. The complete data contract is in [analytics-privacy.md](analytics-privacy.md).

The dashboard now reports conversion, campaign outcomes, durations, exchanges, sharing, challenge conversion, daily official/friendly attempts, game modes, game plans, historic player picks/rejections, years, draft regions, device type, and anonymous feedback. It uses `get_admin_dashboard_metrics()` and is separately failure-safe: an unavailable dashboard migration cannot block the configuration form.

For the game, public configuration is applied only when a player starts a new draft, only if the configured dataset version matches and every role keeps an eligible pool. The active campaign saves this rules snapshot, so a later admin update cannot corrupt its draft or exchanges. The maintenance banner is displayed independently.
