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
  'game_plan_selected',
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
  'card_downloaded',
  'challenge_opened',
  'challenge_started',
  'challenge_completed',
  'challenge_link_copied',
  'daily_opened',
  'daily_started',
  'daily_completed'
));

alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_daily_challenges;

revoke all on function public.record_analytics_event_before_daily_challenges(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

create function public.record_analytics_event(
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
  if p_event_name not in ('daily_opened', 'daily_started', 'daily_completed') then
    perform public.record_analytics_event_before_daily_challenges(
      p_client_event_id,
      p_campaign_id,
      p_session_id,
      p_event_name,
      p_device_type,
      p_properties
    );
    return;
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
      'campaign_source', 'daily_id', 'attempt_kind', 'game_mode', 'game_plan',
      'outcome', 'campaign_duration_ms'
    )
  ) then
    raise exception 'analytics property is not allowed';
  end if;
  if not (p_properties ? 'campaign_source') or p_properties ->> 'campaign_source' <> 'daily' then
    raise exception 'invalid campaign source';
  end if;
  if not (p_properties ? 'daily_id') or p_properties ->> 'daily_id' !~ '^daily-v1-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-zA-Z0-9._-]{1,80}$' then
    raise exception 'invalid daily challenge id';
  end if;
  if p_properties ? 'attempt_kind' and p_properties ->> 'attempt_kind' not in ('official', 'friendly') then
    raise exception 'invalid daily attempt kind';
  end if;
  if p_properties ? 'game_mode' and p_properties ->> 'game_mode' not in ('classic', 'almanac') then
    raise exception 'invalid game mode';
  end if;
  if p_properties ? 'game_plan' and p_properties ->> 'game_plan' not in (
    'aggression', 'teamfight', 'control_pick', 'scaling'
  ) then
    raise exception 'invalid game plan';
  end if;
  if p_properties ? 'outcome' and p_properties ->> 'outcome' not in (
    'Eliminado no Suíço', 'Quartas de final', 'Semifinalista', 'Vice-campeão', 'Campeão mundial'
  ) then
    raise exception 'invalid campaign outcome';
  end if;
  if p_properties ? 'campaign_duration_ms' and p_properties ->> 'campaign_duration_ms' !~ '^[0-9]{1,8}$' then
    raise exception 'invalid campaign duration';
  end if;
  if p_event_name in ('daily_started', 'daily_completed') and not (p_properties ? 'attempt_kind') then
    raise exception 'missing daily attempt kind';
  end if;
  if p_event_name = 'daily_completed' and (
    not (p_properties ? 'outcome') or not (p_properties ? 'campaign_duration_ms')
  ) then
    raise exception 'missing daily completion';
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

alter function public.get_admin_dashboard_metrics()
rename to get_admin_dashboard_metrics_before_daily_challenges;

revoke all on function public.get_admin_dashboard_metrics_before_daily_challenges() from public, anon, authenticated;

create function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  daily_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_daily_challenges();

  select jsonb_build_object(
    'opened', count(distinct campaign_id) filter (where event_name = 'daily_opened'),
    'official_started', count(distinct campaign_id) filter (
      where event_name = 'daily_started' and properties ->> 'attempt_kind' = 'official'
    ),
    'friendly_started', count(distinct campaign_id) filter (
      where event_name = 'daily_started' and properties ->> 'attempt_kind' = 'friendly'
    ),
    'official_completed', count(distinct campaign_id) filter (
      where event_name = 'daily_completed' and properties ->> 'attempt_kind' = 'official'
    )
  )
  into daily_metrics
  from public.analytics_events;

  return jsonb_set(metrics, '{daily_challenges}', daily_metrics, true);
end;
$$;

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
