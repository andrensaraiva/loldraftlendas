alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_almanac;

revoke all on function public.record_analytics_event_before_almanac(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

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
  if p_properties ? 'game_mode' and p_properties ->> 'game_mode' not in ('classic', 'almanac') then
    raise exception 'invalid game mode';
  end if;

  clean_properties := p_properties - 'game_mode';
  perform public.record_analytics_event_before_almanac(
    p_client_event_id,
    p_campaign_id,
    p_session_id,
    p_event_name,
    p_device_type,
    clean_properties
  );

  if p_properties ? 'game_mode' then
    update public.analytics_events
    set properties = properties || jsonb_build_object('game_mode', p_properties ->> 'game_mode')
    where client_event_id = p_client_event_id;
  end if;
end;
$$;

alter function public.get_admin_dashboard_metrics()
rename to get_admin_dashboard_metrics_before_almanac;

revoke all on function public.get_admin_dashboard_metrics_before_almanac() from public, anon, authenticated;

create function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  mode_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_almanac();

  with
  mode_catalog(key, label, sort_order) as (
    values ('classic', 'Clássico', 1), ('almanac', 'Almanaque', 2)
  ),
  drafts as (
    select distinct
      campaign_id,
      coalesce(nullif(properties ->> 'game_mode', ''), 'classic') as game_mode
    from public.analytics_events
    where event_name = 'draft_started'
  ),
  finished as (
    select distinct campaign_id
    from public.analytics_events
    where event_name = 'campaign_finished'
  ),
  replayed as (
    select distinct campaign_id
    from public.analytics_events
    where event_name = 'play_again'
  ),
  aggregate_modes as (
    select
      catalog.key,
      catalog.label,
      catalog.sort_order,
      count(drafts.campaign_id) as drafts_started,
      coalesce(round(
        100.0 * count(finished.campaign_id) / nullif(count(drafts.campaign_id), 0),
        1
      ), 0) as completion_rate,
      coalesce(round(
        100.0 * count(replayed.campaign_id) / nullif(count(drafts.campaign_id), 0),
        1
      ), 0) as play_again_rate
    from mode_catalog catalog
    left join drafts on drafts.game_mode = catalog.key
    left join finished using (campaign_id)
    left join replayed using (campaign_id)
    group by catalog.key, catalog.label, catalog.sort_order
  )
  select jsonb_agg(
    jsonb_build_object(
      'key', key,
      'label', label,
      'drafts_started', drafts_started,
      'completion_rate', completion_rate,
      'play_again_rate', play_again_rate
    )
    order by sort_order
  )
  into mode_metrics
  from aggregate_modes;

  return jsonb_set(metrics, '{game_modes}', coalesce(mode_metrics, '[]'::jsonb), true);
end;
$$;

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
