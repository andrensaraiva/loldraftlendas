create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  with
  started as (
    select distinct campaign_id from public.analytics_events where event_name = 'draft_started'
  ),
  completed as (
    select distinct campaign_id from public.analytics_events where event_name = 'draft_completed'
  ),
  worlds as (
    select distinct campaign_id from public.analytics_events where event_name = 'worlds_started'
  ),
  finished as (
    select distinct campaign_id, properties from public.analytics_events where event_name = 'campaign_finished'
  ),
  overview as (
    select jsonb_build_object(
      'drafts_started', (select count(*) from started),
      'drafts_completed', (select count(*) from completed),
      'draft_completion_rate', coalesce(round(100.0 * (select count(*) from completed) / nullif((select count(*) from started), 0), 1), 0),
      'worlds_started', (select count(*) from worlds),
      'worlds_start_rate', coalesce(round(100.0 * (select count(*) from worlds) / nullif((select count(*) from completed), 0), 1), 0),
      'play_again_rate', coalesce(round(100.0 * (select count(*) from public.analytics_events where event_name = 'play_again') / nullif((select count(*) from finished), 0), 1), 0),
      'average_draft_seconds', (
        select round(avg((properties ->> 'draft_duration_ms')::numeric) / 1000)
        from public.analytics_events
        where event_name = 'draft_completed' and properties ->> 'draft_duration_ms' ~ '^[0-9]+$'
      ),
      'average_campaign_seconds', (
        select round(avg((properties ->> 'campaign_duration_ms')::numeric) / 1000)
        from public.analytics_events
        where event_name = 'campaign_finished' and properties ->> 'campaign_duration_ms' ~ '^[0-9]+$'
      ),
      'exchanges_used', (select count(*) from public.analytics_events where event_name = 'exchange_used')
    ) as value
  ),
  outcome_catalog(key, label) as (
    values
      ('Eliminado no Suíço', 'Eliminado no Suíço'),
      ('Quartas de final', 'Quartas de final'),
      ('Semifinalista', 'Semifinalista'),
      ('Vice-campeão', 'Vice-campeão'),
      ('Campeão mundial', 'Campeão mundial')
  ),
  outcome_counts as (
    select properties ->> 'outcome' as key, count(distinct campaign_id) as count
    from finished
    group by properties ->> 'outcome'
  ),
  outcomes as (
    select coalesce(jsonb_agg(jsonb_build_object('key', catalog.key, 'label', catalog.label, 'count', coalesce(counts.count, 0)) order by catalog.key), '[]'::jsonb) as value
    from outcome_catalog catalog
    left join outcome_counts counts using (key)
  ),
  exchange_catalog(key, label) as (
    values ('year', 'Ano'), ('region', 'Região'), ('players', 'Jogadores')
  ),
  exchange_counts as (
    select properties ->> 'exchange_type' as key, count(*) as count
    from public.analytics_events
    where event_name = 'exchange_used'
    group by properties ->> 'exchange_type'
  ),
  exchanges as (
    select coalesce(jsonb_agg(jsonb_build_object('key', catalog.key, 'label', catalog.label, 'count', coalesce(counts.count, 0)) order by catalog.key), '[]'::jsonb) as value
    from exchange_catalog catalog
    left join exchange_counts counts using (key)
  ),
  player_picks as (
    select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', key, 'count', count) order by count desc, key), '[]'::jsonb) as value
    from (
      select properties ->> 'player_id' as key, count(*) as count
      from public.analytics_events
      where event_name = 'player_selected' and properties ? 'player_id'
      group by properties ->> 'player_id'
      order by count desc, key
      limit 10
    ) ranked
  ),
  player_rejections as (
    select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', key, 'count', count) order by count desc, key), '[]'::jsonb) as value
    from (
      select candidate as key, count(*) as count
      from public.analytics_events event,
        lateral jsonb_array_elements_text(coalesce(event.properties -> 'rejected_candidate_ids', '[]'::jsonb)) candidate
      where event.event_name = 'exchange_used'
      group by candidate
      order by count desc, candidate
      limit 10
    ) ranked
  ),
  years as (
    select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', key, 'count', count) order by key desc), '[]'::jsonb) as value
    from (
      select properties ->> 'worlds_year' as key, count(*) as count
      from public.analytics_events
      where event_name = 'roll_generated' and properties ->> 'worlds_year' ~ '^20[0-9]{2}$'
      group by properties ->> 'worlds_year'
    ) counted
  ),
  region_groups as (
    select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', replace(initcap(replace(key, '_', ' ')), 'North America', 'América do Norte'), 'count', count) order by count desc, key), '[]'::jsonb) as value
    from (
      select properties ->> 'draft_region_group' as key, count(*) as count
      from public.analytics_events
      where event_name = 'roll_generated' and properties ? 'draft_region_group'
      group by properties ->> 'draft_region_group'
    ) counted
  ),
  devices as (
    select coalesce(jsonb_agg(jsonb_build_object('key', device_type, 'label', case device_type when 'mobile' then 'Mobile' else 'Desktop' end, 'count', count) order by device_type), '[]'::jsonb) as value
    from (
      select device_type, count(distinct session_id) as count
      from public.analytics_events
      where event_name = 'session_started'
      group by device_type
    ) counted
  ),
  feedback as (
    select jsonb_build_object(
      'total', count(*),
      'good', count(*) filter (where rating = 'good'),
      'ok', count(*) filter (where rating = 'ok'),
      'bad', count(*) filter (where rating = 'bad'),
      'notes', coalesce((
        select jsonb_agg(jsonb_build_object('rating', note_data.rating, 'note', note_data.note, 'created_at', note_data.created_at) order by note_data.created_at desc)
        from (
          select rating, note, created_at
          from public.campaign_feedback
          where note is not null
          order by created_at desc
          limit 10
        ) note_data
      ), '[]'::jsonb)
    ) as value
    from public.campaign_feedback
  )
  select jsonb_build_object(
    'generated_at', now(),
    'overview', overview.value,
    'outcomes', outcomes.value,
    'exchanges', exchanges.value,
    'player_picks', player_picks.value,
    'player_rejections', player_rejections.value,
    'years', years.value,
    'region_groups', region_groups.value,
    'devices', devices.value,
    'feedback', feedback.value
  ) into metrics
  from overview, outcomes, exchanges, player_picks, player_rejections, years, region_groups, devices, feedback;

  return metrics;
end;
$$;

revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;