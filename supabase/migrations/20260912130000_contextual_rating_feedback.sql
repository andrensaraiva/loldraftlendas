create table if not exists public.rating_feedback (
  id bigint generated always as identity primary key,
  campaign_id uuid not null,
  player_id text not null check (player_id ~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$'),
  worlds_year integer not null check (worlds_year between 2011 and 2100),
  role text not null check (role in ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')),
  game integer not null check (game between 1 and 5),
  champion_id text not null check (champion_id ~ '^[a-z0-9-]{1,80}$'),
  displayed_rating integer not null check (displayed_rating between 0 and 100),
  reason text not null check (reason in (
    'too_high', 'too_low', 'wrong_champion', 'wrong_evidence', 'other'
  )),
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (campaign_id, player_id, game)
);

alter table public.rating_feedback enable row level security;

create policy "admins can read rating feedback"
on public.rating_feedback
for select
to authenticated
using (public.is_admin());

create function public.submit_rating_feedback(
  p_campaign_id uuid,
  p_player_id text,
  p_worlds_year integer,
  p_role text,
  p_game integer,
  p_champion_id text,
  p_displayed_rating integer,
  p_reason text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_player_id !~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$' then
    raise exception 'invalid player ID';
  end if;
  if p_worlds_year not between 2011 and 2100 then
    raise exception 'invalid Worlds year';
  end if;
  if p_role not in ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT') then
    raise exception 'invalid role';
  end if;
  if p_game not between 1 and 5 then
    raise exception 'invalid game slot';
  end if;
  if p_champion_id !~ '^[a-z0-9-]{1,80}$' then
    raise exception 'invalid champion ID';
  end if;
  if p_displayed_rating not between 0 and 100 then
    raise exception 'invalid displayed rating';
  end if;
  if p_reason not in ('too_high', 'too_low', 'wrong_champion', 'wrong_evidence', 'other') then
    raise exception 'invalid feedback reason';
  end if;
  if p_note is not null and char_length(p_note) > 300 then
    raise exception 'rating feedback is too long';
  end if;

  insert into public.rating_feedback (
    campaign_id,
    player_id,
    worlds_year,
    role,
    game,
    champion_id,
    displayed_rating,
    reason,
    note
  )
  values (
    p_campaign_id,
    p_player_id,
    p_worlds_year,
    p_role,
    p_game,
    p_champion_id,
    p_displayed_rating,
    p_reason,
    nullif(btrim(p_note), '')
  )
  on conflict (campaign_id, player_id, game) do nothing;
end;
$$;

revoke all on function public.submit_rating_feedback(uuid, text, integer, text, integer, text, integer, text, text) from public;
grant execute on function public.submit_rating_feedback(uuid, text, integer, text, integer, text, integer, text, text) to anon, authenticated;

alter function public.get_admin_dashboard_metrics()
rename to get_admin_dashboard_metrics_before_rating_feedback;

revoke all on function public.get_admin_dashboard_metrics_before_rating_feedback() from public, anon, authenticated;

create function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  rating_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_rating_feedback();

  with
  reason_catalog(key, label) as (
    values
      ('too_high', 'Rating alto demais'),
      ('too_low', 'Rating baixo demais'),
      ('wrong_champion', 'Campeão não representa'),
      ('wrong_evidence', 'Evidência incorreta'),
      ('other', 'Outro motivo')
  ),
  reason_counts as (
    select reason as key, count(*) as count
    from public.rating_feedback
    group by reason
  ),
  reasons as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'key', catalog.key,
          'label', catalog.label,
          'count', coalesce(counts.count, 0)
        )
        order by catalog.key
      ),
      '[]'::jsonb
    ) as value
    from reason_catalog catalog
    left join reason_counts counts using (key)
  ),
  notes as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'player_id', recent.player_id,
          'worlds_year', recent.worlds_year,
          'game', recent.game,
          'reason', catalog.label,
          'note', recent.note,
          'created_at', recent.created_at
        )
        order by recent.created_at desc
      ),
      '[]'::jsonb
    ) as value
    from (
      select player_id, worlds_year, game, reason, note, created_at
      from public.rating_feedback
      where note is not null
      order by created_at desc
      limit 10
    ) recent
    join reason_catalog catalog on catalog.key = recent.reason
  )
  select jsonb_build_object(
    'total', (select count(*) from public.rating_feedback),
    'reasons', reasons.value,
    'notes', notes.value
  )
  into rating_metrics
  from reasons, notes;

  return jsonb_set(metrics, '{rating_feedback}', rating_metrics, true);
end;
$$;

revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
