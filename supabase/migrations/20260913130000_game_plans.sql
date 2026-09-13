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
  'challenge_link_copied'
));

alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_game_plans;

revoke all on function public.record_analytics_event_before_game_plans(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

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
declare
  clean_properties jsonb;
begin
  if p_properties is null or jsonb_typeof(p_properties) <> 'object' then
    raise exception 'invalid analytics properties';
  end if;
  if p_properties ? 'game_plan' and p_properties ->> 'game_plan' not in (
    'aggression', 'teamfight', 'control_pick', 'scaling'
  ) then
    raise exception 'invalid game plan';
  end if;

  clean_properties := p_properties - 'game_plan';
  if p_event_name <> 'game_plan_selected' then
    perform public.record_analytics_event_before_game_plans(
      p_client_event_id,
      p_campaign_id,
      p_session_id,
      p_event_name,
      p_device_type,
      clean_properties
    );
    if p_properties ? 'game_plan' then
      update public.analytics_events
      set properties = properties || jsonb_build_object('game_plan', p_properties ->> 'game_plan')
      where client_event_id = p_client_event_id;
    end if;
    return;
  end if;

  if p_device_type not in ('mobile', 'desktop') then
    raise exception 'invalid device type';
  end if;
  if not (p_properties ? 'game_plan') or clean_properties <> '{}'::jsonb then
    raise exception 'invalid game plan selection';
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
rename to get_admin_dashboard_metrics_before_game_plans;

revoke all on function public.get_admin_dashboard_metrics_before_game_plans() from public, anon, authenticated;

create function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  plan_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_game_plans();

  with
  plan_catalog(key, label, sort_order) as (
    values
      ('aggression', 'Agressão', 1),
      ('teamfight', 'Teamfight', 2),
      ('control_pick', 'Controle/Pick', 3),
      ('scaling', 'Escala', 4)
  ),
  started as (
    select distinct on (campaign_id)
      campaign_id,
      properties ->> 'game_plan' as game_plan
    from public.analytics_events
    where
      event_name = 'worlds_started'
      and properties ->> 'game_plan' in ('aggression', 'teamfight', 'control_pick', 'scaling')
    order by campaign_id, created_at desc
  ),
  finished as (
    select distinct on (campaign_id)
      campaign_id,
      properties ->> 'outcome' as outcome
    from public.analytics_events
    where event_name = 'campaign_finished'
    order by campaign_id, created_at desc
  ),
  aggregate_plans as (
    select
      catalog.key,
      catalog.label,
      catalog.sort_order,
      count(started.campaign_id) as campaigns_started,
      coalesce(round(
        100.0 * count(finished.campaign_id) / nullif(count(started.campaign_id), 0),
        1
      ), 0) as completion_rate,
      coalesce(round(
        100.0 * count(finished.campaign_id) filter (where finished.outcome = 'Campeão mundial') /
        nullif(count(finished.campaign_id), 0),
        1
      ), 0) as title_rate
    from plan_catalog catalog
    left join started on started.game_plan = catalog.key
    left join finished using (campaign_id)
    group by catalog.key, catalog.label, catalog.sort_order
  )
  select jsonb_agg(
    jsonb_build_object(
      'key', key,
      'label', label,
      'campaigns_started', campaigns_started,
      'completion_rate', completion_rate,
      'title_rate', title_rate
    )
    order by sort_order
  )
  into plan_metrics
  from aggregate_plans;

  return jsonb_set(metrics, '{game_plans}', coalesce(plan_metrics, '[]'::jsonb), true);
end;
$$;

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
