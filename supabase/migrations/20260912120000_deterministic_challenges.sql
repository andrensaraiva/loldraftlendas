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
  'card_downloaded',
  'challenge_opened',
  'challenge_started',
  'challenge_completed',
  'challenge_link_copied'
));

alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_challenges;

revoke all on function public.record_analytics_event_before_challenges(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

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
  if p_event_name not in (
    'challenge_opened', 'challenge_started', 'challenge_completed', 'challenge_link_copied'
  ) then
    perform public.record_analytics_event_before_challenges(
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
      'campaign_source', 'challenge_version', 'outcome', 'campaign_duration_ms', 'share_method'
    )
  ) then
    raise exception 'analytics property is not allowed';
  end if;
  if p_properties ? 'campaign_source' and p_properties ->> 'campaign_source' <> 'challenge' then
    raise exception 'invalid campaign source';
  end if;
  if p_properties ? 'challenge_version' and p_properties ->> 'challenge_version' <> '1' then
    raise exception 'invalid challenge version';
  end if;
  if p_properties ? 'outcome' and p_properties ->> 'outcome' not in (
    'Eliminado no Suíço', 'Quartas de final', 'Semifinalista', 'Vice-campeão', 'Campeão mundial'
  ) then
    raise exception 'invalid campaign outcome';
  end if;
  if p_properties ? 'campaign_duration_ms' and p_properties ->> 'campaign_duration_ms' !~ '^[0-9]{1,8}$' then
    raise exception 'invalid campaign duration';
  end if;
  if p_properties ? 'share_method' and p_properties ->> 'share_method' not in ('file', 'link', 'download') then
    raise exception 'invalid share method';
  end if;
  if p_event_name in ('challenge_opened', 'challenge_started', 'challenge_completed') and (
    p_properties ->> 'campaign_source' <> 'challenge' or
    p_properties ->> 'challenge_version' <> '1'
  ) then
    raise exception 'missing challenge context';
  end if;
  if p_event_name = 'challenge_completed' and (
    not (p_properties ? 'outcome') or not (p_properties ? 'campaign_duration_ms')
  ) then
    raise exception 'missing challenge completion';
  end if;
  if p_event_name = 'challenge_link_copied' and p_properties ->> 'share_method' <> 'link' then
    raise exception 'invalid challenge copy method';
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
rename to get_admin_dashboard_metrics_before_challenges;

revoke all on function public.get_admin_dashboard_metrics_before_challenges() from public, anon, authenticated;

create function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  challenge_overview jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_challenges();

  select jsonb_build_object(
    'challenges_opened', count(distinct campaign_id) filter (where event_name = 'challenge_opened'),
    'challenges_started', count(distinct campaign_id) filter (where event_name = 'challenge_started'),
    'challenge_completion_rate', coalesce(round(
      100.0 * count(distinct campaign_id) filter (where event_name = 'challenge_completed') /
      nullif(count(distinct campaign_id) filter (where event_name = 'challenge_started'), 0),
      1
    ), 0),
    'challenge_links_copied', count(*) filter (where event_name = 'challenge_link_copied')
  )
  into challenge_overview
  from public.analytics_events;

  return jsonb_set(
    metrics,
    '{overview}',
    coalesce(metrics -> 'overview', '{}'::jsonb) || challenge_overview
  );
end;
$$;

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
