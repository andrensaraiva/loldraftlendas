alter table public.analytics_events
drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
add constraint analytics_events_event_name_check check (event_name in (
  'session_started', 'draft_started', 'roll_generated', 'exchange_used', 'player_selected',
  'draft_completed', 'game_plan_selected', 'worlds_started', 'series_started', 'game_completed',
  'playoffs_reached', 'worlds_won', 'campaign_finished', 'campaign_report_opened',
  'journey_node_opened', 'journey_downloaded', 'play_again', 'save_resumed',
  'campaign_paused', 'campaign_abandoned', 'how_to_play_opened',
  'onboarding_opened', 'onboarding_completed', 'onboarding_skipped',
  'rating_details_opened', 'share_started', 'share_completed', 'card_downloaded',
  'challenge_opened', 'challenge_started', 'challenge_completed', 'challenge_link_copied',
  'daily_opened', 'daily_started', 'daily_completed'
));

alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_onboarding;

revoke all on function public.record_analytics_event_before_onboarding(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

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
  if p_event_name not in ('onboarding_opened', 'onboarding_completed', 'onboarding_skipped') then
    perform public.record_analytics_event_before_onboarding(
      p_client_event_id, p_campaign_id, p_session_id, p_event_name, p_device_type, p_properties
    );
    return;
  end if;

  if p_device_type not in ('mobile', 'desktop') then
    raise exception 'invalid device type';
  end if;
  if p_properties is null or jsonb_typeof(p_properties) <> 'object' or octet_length(p_properties::text) > 200 then
    raise exception 'invalid analytics properties';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_properties) property_key
    where property_key not in ('source', 'slides_viewed')
  ) then
    raise exception 'analytics property is not allowed';
  end if;
  if p_properties ->> 'source' not in ('automatic', 'menu') then
    raise exception 'invalid onboarding source';
  end if;
  if p_event_name = 'onboarding_opened' and p_properties ? 'slides_viewed' then
    raise exception 'opened event cannot include slides viewed';
  end if;
  if p_event_name <> 'onboarding_opened' and
    coalesce(p_properties ->> 'slides_viewed', '') !~ '^[1-5]$' then
    raise exception 'invalid onboarding slide count';
  end if;

  insert into public.analytics_events (
    client_event_id, campaign_id, session_id, event_name, device_type, properties
  ) values (
    p_client_event_id, p_campaign_id, p_session_id, p_event_name, p_device_type, p_properties
  ) on conflict (client_event_id) do nothing;
end;
$$;

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;
