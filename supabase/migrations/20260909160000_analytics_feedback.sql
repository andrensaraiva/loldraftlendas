create or replace function public.get_public_product_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'analytics_enabled', analytics_enabled
  )
  from public.product_config
  where id = true;
$$;

revoke all on function public.get_public_product_config() from public;
grant execute on function public.get_public_product_config() to anon, authenticated;

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  client_event_id uuid not null unique,
  campaign_id uuid not null,
  session_id uuid not null,
  event_name text not null check (event_name in (
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
    'rating_details_opened'
  )),
  device_type text not null check (device_type in ('mobile', 'desktop')),
  properties jsonb not null default '{}'::jsonb check (
    jsonb_typeof(properties) = 'object'
    and octet_length(properties::text) <= 1200
  ),
  occurred_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin());

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

  if p_properties ?| array['email', 'name', 'note', 'password', 'token'] then
    raise exception 'personal data keys are not accepted';
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

revoke all on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;

create table if not exists public.campaign_feedback (
  id bigint generated always as identity primary key,
  campaign_id uuid not null unique,
  rating text not null check (rating in ('good', 'ok', 'bad')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

alter table public.campaign_feedback enable row level security;

create policy "admins can read campaign feedback"
on public.campaign_feedback
for select
to authenticated
using (public.is_admin());

create or replace function public.submit_campaign_feedback(
  p_campaign_id uuid,
  p_rating text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_rating not in ('good', 'ok', 'bad') then
    raise exception 'invalid feedback rating';
  end if;

  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'feedback is too long';
  end if;

  insert into public.campaign_feedback (campaign_id, rating, note)
  values (p_campaign_id, p_rating, nullif(btrim(p_note), ''))
  on conflict (campaign_id) do nothing;
end;
$$;

revoke all on function public.submit_campaign_feedback(uuid, text, text) from public;
grant execute on function public.submit_campaign_feedback(uuid, text, text) to anon, authenticated;