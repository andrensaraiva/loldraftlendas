alter table public.analytics_events
drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
add constraint analytics_events_event_name_check check (event_name in (
  'session_started',
  'draft_started',
  'roll_generated',
  'exchange_used',
  'player_selected',
  'draft_completed',
  'worlds_started',
  'series_started',
  'game_completed',
  'playoffs_reached',
  'worlds_won',
  'campaign_finished',
  'play_again',
  'save_resumed',
  'how_to_play_opened',
  'rating_details_opened',
  'share_started',
  'share_completed',
  'card_downloaded'
));

create or replace function public.record_analytics_event(
  p_client_event_id uuid,
  p_campaign_id uuid,
  p_session_id uuid,
  p_event_name text,
  p_device_type text,
  p_properties jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_name not in (
    'session_started', 'draft_started', 'roll_generated', 'exchange_used',
    'player_selected', 'draft_completed', 'worlds_started', 'series_started',
    'game_completed', 'playoffs_reached', 'worlds_won', 'campaign_finished',
    'play_again', 'save_resumed', 'how_to_play_opened', 'rating_details_opened',
    'share_started', 'share_completed', 'card_downloaded'
  ) then
    raise exception 'invalid analytics event';
  end if;

  if p_device_type not in ('mobile', 'desktop') then
    raise exception 'invalid device type';
  end if;

  if p_properties is null or jsonb_typeof(p_properties) <> 'object' or octet_length(p_properties::text) > 1200 then
    raise exception 'invalid analytics properties';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_properties) property_key
    where property_key not in (
      'role', 'worlds_year', 'draft_region_group', 'candidate_ids', 'roll_source',
      'exchange_type', 'rejected_candidate_ids', 'player_id', 'draft_duration_ms',
      'selected_player_ids', 'stage', 'game', 'best_of', 'won', 'detail_type',
      'outcome', 'campaign_duration_ms', 'draft_step', 'share_method'
    )
  ) then
    raise exception 'analytics property is not allowed';
  end if;

  if p_properties ? 'role' and p_properties ->> 'role' not in ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT') then
    raise exception 'invalid role';
  end if;
  if p_properties ? 'worlds_year' and p_properties ->> 'worlds_year' !~ '^20[0-9]{2}$' then
    raise exception 'invalid Worlds year';
  end if;
  if p_properties ? 'draft_region_group' and p_properties ->> 'draft_region_group' not in (
    'KOREA', 'CHINA', 'EUROPE', 'NORTH_AMERICA', 'OTHER_REGIONS', 'EUROPE_NORTH_AMERICA'
  ) then
    raise exception 'invalid draft region group';
  end if;
  if p_properties ? 'roll_source' and p_properties ->> 'roll_source' not in ('initial', 'exchange') then
    raise exception 'invalid roll source';
  end if;
  if p_properties ? 'exchange_type' and p_properties ->> 'exchange_type' not in ('year', 'region', 'players') then
    raise exception 'invalid exchange type';
  end if;
  if p_properties ? 'stage' and p_properties ->> 'stage' not in ('swiss', 'quarters', 'semis', 'final') then
    raise exception 'invalid stage';
  end if;
  if p_properties ? 'detail_type' and p_properties ->> 'detail_type' not in ('method', 'player') then
    raise exception 'invalid rating detail type';
  end if;
  if p_properties ? 'outcome' and p_properties ->> 'outcome' not in (
    'Eliminado no Suíço', 'Quartas de final', 'Semifinalista', 'Vice-campeão', 'Campeão mundial'
  ) then
    raise exception 'invalid campaign outcome';
  end if;
  if p_properties ? 'share_method' and p_properties ->> 'share_method' not in ('file', 'link', 'download') then
    raise exception 'invalid share method';
  end if;
  if p_properties ? 'won' and jsonb_typeof(p_properties -> 'won') <> 'boolean' then
    raise exception 'invalid game result';
  end if;

  if p_properties ? 'candidate_ids' then
    if jsonb_typeof(p_properties -> 'candidate_ids') <> 'array' or jsonb_array_length(p_properties -> 'candidate_ids') > 5 then
      raise exception 'invalid candidates';
    end if;
    if exists (select 1 from jsonb_array_elements_text(p_properties -> 'candidate_ids') value where value !~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$') then
      raise exception 'invalid candidate ID';
    end if;
  end if;

  if p_properties ? 'rejected_candidate_ids' then
    if jsonb_typeof(p_properties -> 'rejected_candidate_ids') <> 'array' or jsonb_array_length(p_properties -> 'rejected_candidate_ids') > 5 then
      raise exception 'invalid rejected candidates';
    end if;
    if exists (select 1 from jsonb_array_elements_text(p_properties -> 'rejected_candidate_ids') value where value !~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$') then
      raise exception 'invalid rejected candidate ID';
    end if;
  end if;

  if p_properties ? 'selected_player_ids' then
    if jsonb_typeof(p_properties -> 'selected_player_ids') <> 'array' or jsonb_array_length(p_properties -> 'selected_player_ids') > 5 then
      raise exception 'invalid selected players';
    end if;
    if exists (select 1 from jsonb_array_elements_text(p_properties -> 'selected_player_ids') value where value !~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$') then
      raise exception 'invalid selected player ID';
    end if;
  end if;

  if p_properties ? 'player_id' and p_properties ->> 'player_id' !~ '^[a-z0-9-]+-[0-9]{4}-[a-z0-9-]+$' then
    raise exception 'invalid player ID';
  end if;
  if p_properties ? 'game' and p_properties ->> 'game' not in ('1', '2', '3', '4', '5') then
    raise exception 'invalid game number';
  end if;
  if p_properties ? 'best_of' and p_properties ->> 'best_of' not in ('1', '3', '5') then
    raise exception 'invalid series format';
  end if;
  if p_properties ? 'draft_step' and p_properties ->> 'draft_step' not in ('0', '1', '2', '3', '4', '5') then
    raise exception 'invalid draft step';
  end if;
  if p_properties ? 'draft_duration_ms' and p_properties ->> 'draft_duration_ms' !~ '^[0-9]{1,8}$' then
    raise exception 'invalid draft duration';
  end if;
  if p_properties ? 'campaign_duration_ms' and p_properties ->> 'campaign_duration_ms' !~ '^[0-9]{1,8}$' then
    raise exception 'invalid campaign duration';
  end if;

  insert into public.analytics_events (
    client_event_id,
    campaign_id,
    session_id,
    event_name,
    device_type,
    properties
  )
  values (
    p_client_event_id,
    p_campaign_id,
    p_session_id,
    p_event_name,
    p_device_type,
    p_properties
  )
  on conflict (client_event_id) do nothing;
end;
$$;

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
  shared as (
    select distinct campaign_id from public.analytics_events where event_name = 'share_started'
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
      'exchanges_used', (select count(*) from public.analytics_events where event_name = 'exchange_used'),
      'share_intent_rate', coalesce(round(100.0 * (select count(*) from shared) / nullif((select count(*) from finished), 0), 1), 0),
      'shares_completed', (select count(*) from public.analytics_events where event_name = 'share_completed'),
      'cards_downloaded', (select count(*) from public.analytics_events where event_name = 'card_downloaded')
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

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
