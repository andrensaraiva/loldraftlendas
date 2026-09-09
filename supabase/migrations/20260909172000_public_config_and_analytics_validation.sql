create or replace function public.get_public_product_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'starting_exchanges', starting_exchanges,
    'active_years', active_years,
    'active_region_groups', active_region_groups,
    'analytics_enabled', analytics_enabled,
    'maintenance_banner', maintenance_banner,
    'dataset_version', dataset_version
  )
  from public.product_config
  where id = true;
$$;

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
    'play_again', 'save_resumed', 'how_to_play_opened', 'rating_details_opened'
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
      'outcome', 'campaign_duration_ms', 'draft_step'
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