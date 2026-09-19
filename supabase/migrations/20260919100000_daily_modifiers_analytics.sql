alter function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb)
rename to record_analytics_event_before_daily_modifiers;

revoke all on function public.record_analytics_event_before_daily_modifiers(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

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
    perform public.record_analytics_event_before_daily_modifiers(
      p_client_event_id, p_campaign_id, p_session_id, p_event_name, p_device_type, p_properties
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
    select 1 from jsonb_object_keys(p_properties) property_key
    where property_key not in (
      'campaign_source', 'daily_id', 'attempt_kind', 'modifier_id', 'objective_met',
      'game_mode', 'game_plan', 'outcome', 'campaign_duration_ms'
    )
  ) then
    raise exception 'analytics property is not allowed';
  end if;
  if p_properties ->> 'campaign_source' <> 'daily' then
    raise exception 'invalid campaign source';
  end if;
  if coalesce(p_properties ->> 'daily_id', '') !~ '^daily-v2-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-zA-Z0-9._-]{1,160}$' then
    raise exception 'invalid daily challenge id';
  end if;
  if p_properties ->> 'modifier_id' not in (
    'no-exchanges', 'single-exchange', 'era-bridge', 'all-or-nothing'
  ) then
    raise exception 'invalid daily modifier';
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
    not (p_properties ? 'outcome') or
    not (p_properties ? 'campaign_duration_ms') or
    jsonb_typeof(p_properties -> 'objective_met') <> 'boolean'
  ) then
    raise exception 'missing daily completion';
  end if;
  if p_event_name <> 'daily_completed' and p_properties ? 'objective_met' then
    raise exception 'objective result is only valid on completion';
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
