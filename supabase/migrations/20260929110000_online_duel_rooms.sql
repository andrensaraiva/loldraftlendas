create table if not exists public.duel_catalog_versions (
  dataset_version text primary key,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists duel_one_active_catalog
on public.duel_catalog_versions (active) where active;

create table if not exists public.duel_candidates (
  dataset_version text not null references public.duel_catalog_versions(dataset_version),
  player_id text not null,
  role text not null check (role in ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')),
  worlds_year integer not null check (worlds_year between 2011 and 2100),
  region_group text not null,
  team text not null,
  primary key (dataset_version, player_id, region_group)
);

create index if not exists duel_candidate_pool
on public.duel_candidates (dataset_version, role, worlds_year, region_group);

create table if not exists public.duel_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9A-F]{12}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  dataset_version text not null references public.duel_catalog_versions(dataset_version),
  seed text not null check (seed ~ '^[0-9a-f]{16}$'),
  offers jsonb not null check (jsonb_typeof(offers) = 'array' and jsonb_array_length(offers) = 5),
  host_picks text[],
  host_plan text,
  guest_picks text[],
  guest_plan text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  check (guest_user_id is null or guest_user_id <> host_user_id),
  check (host_picks is null or cardinality(host_picks) = 5),
  check (guest_picks is null or cardinality(guest_picks) = 5),
  check ((host_picks is null) = (host_plan is null)),
  check ((guest_picks is null) = (guest_plan is null)),
  check (host_plan is null or host_plan in ('aggression', 'teamfight', 'control_pick', 'scaling')),
  check (guest_plan is null or guest_plan in ('aggression', 'teamfight', 'control_pick', 'scaling'))
);

create index if not exists duel_rooms_host_recent
on public.duel_rooms (host_user_id, created_at desc);

alter table public.duel_catalog_versions enable row level security;
alter table public.duel_candidates enable row level security;
alter table public.duel_rooms enable row level security;

revoke all on public.duel_catalog_versions, public.duel_candidates, public.duel_rooms
from public, anon, authenticated;

create or replace function public.get_duel_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.duel_rooms%rowtype;
  caller uuid := auth.uid();
  seat text;
  complete boolean;
  room_state text;
begin
  select * into room from public.duel_rooms where code = upper(btrim(p_code));
  if caller is null or room.id is null or
    (caller <> room.host_user_id and caller is distinct from room.guest_user_id) then
    raise exception 'room unavailable' using errcode = '42501';
  end if;

  seat := case when caller = room.host_user_id then 'host' else 'guest' end;
  complete := room.host_picks is not null and room.guest_picks is not null;
  room_state := case
    when room.cancelled_at is not null then 'cancelled'
    when room.expires_at <= now() then 'expired'
    when complete then 'complete'
    when room.guest_user_id is null then 'waiting_guest'
    else 'drafting'
  end;

  return jsonb_build_object(
    'code', room.code,
    'seed', room.seed,
    'datasetVersion', room.dataset_version,
    'offers', room.offers,
    'seat', seat,
    'state', room_state,
    'expiresAt', room.expires_at,
    'hostReady', room.host_picks is not null,
    'guestReady', room.guest_picks is not null,
    'myPicks', case when seat = 'host' then room.host_picks else room.guest_picks end,
    'myPlan', case when seat = 'host' then room.host_plan else room.guest_plan end,
    'hostPicks', case when complete then room.host_picks else null end,
    'guestPicks', case when complete then room.guest_picks else null end,
    'hostPlan', case when complete then room.host_plan else null end,
    'guestPlan', case when complete then room.guest_plan else null end
  );
end;
$$;

create or replace function public.create_duel_room()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  active_version text;
  room_id uuid := gen_random_uuid();
  room_code text;
  room_seed text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  offers_json jsonb := '[]'::jsonb;
  draft_role text;
  draft_year integer;
  draft_group text;
  option_ids jsonb;
begin
  if caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  if (select count(*) from public.duel_rooms
      where host_user_id = caller and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'room creation limit reached' using errcode = '22023';
  end if;

  select dataset_version into active_version
  from public.duel_catalog_versions where active = true;
  if active_version is null then
    raise exception 'duel catalog unavailable' using errcode = '22023';
  end if;

  foreach draft_role in array array['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] loop
    select worlds_year, region_group into draft_year, draft_group
    from public.duel_candidates
    where dataset_version = active_version and role = draft_role
    group by worlds_year, region_group
    having count(*) >= 3
    order by md5(room_seed || draft_role || worlds_year::text || region_group),
      worlds_year, region_group
    limit 1;

    if draft_year is null then
      raise exception 'duel catalog incomplete for %', draft_role using errcode = '22023';
    end if;

    select jsonb_agg(player_id order by hash_order, player_id) into option_ids
    from (
      select player_id, md5(room_seed || draft_role || player_id) as hash_order
      from public.duel_candidates
      where dataset_version = active_version and role = draft_role
        and worlds_year = draft_year and region_group = draft_group
      order by hash_order, player_id
      limit 3
    ) choices;

    offers_json := offers_json || jsonb_build_array(jsonb_build_object(
      'role', draft_role,
      'year', draft_year,
      'regionGroup', draft_group,
      'optionIds', option_ids
    ));
  end loop;

  room_code := upper(substr(md5(room_id::text), 1, 12));
  insert into public.duel_rooms (id, code, host_user_id, dataset_version, seed, offers)
  values (room_id, room_code, caller, active_version, room_seed, offers_json);
  return room_code;
end;
$$;

create or replace function public.join_duel_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.duel_rooms%rowtype;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into room from public.duel_rooms
  where code = upper(btrim(p_code)) for update;
  if room.id is null or room.cancelled_at is not null or room.expires_at <= now() then
    raise exception 'room unavailable' using errcode = '22023';
  end if;
  if caller = room.host_user_id or
    (room.guest_user_id is not null and room.guest_user_id <> caller) then
    raise exception 'room unavailable' using errcode = '42501';
  end if;
  if room.guest_user_id is null then
    update public.duel_rooms set guest_user_id = caller, updated_at = now()
    where id = room.id;
  end if;
  return public.get_duel_room(p_code);
end;
$$;

create or replace function public.submit_duel_team(
  p_code text,
  p_picks text[],
  p_plan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.duel_rooms%rowtype;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into room from public.duel_rooms
  where code = upper(btrim(p_code)) for update;
  if room.id is null or room.cancelled_at is not null or room.expires_at <= now() then
    raise exception 'room unavailable' using errcode = '22023';
  end if;
  if caller <> room.host_user_id and caller is distinct from room.guest_user_id then
    raise exception 'room unavailable' using errcode = '42501';
  end if;
  if cardinality(p_picks) <> 5 or p_plan is null or p_plan not in
    ('aggression', 'teamfight', 'control_pick', 'scaling') or
    (select count(distinct picked) from unnest(p_picks) picked) <> 5 then
    raise exception 'invalid team' using errcode = '22023';
  end if;
  for pick_index in 1..5 loop
    if p_picks[pick_index] is null or
      not ((room.offers -> (pick_index - 1) -> 'optionIds') ? p_picks[pick_index]) then
      raise exception 'pick outside offer' using errcode = '22023';
    end if;
  end loop;

  if caller = room.host_user_id then
    if room.host_picks is not null and
      (room.host_picks <> p_picks or room.host_plan <> p_plan) then
      raise exception 'team already submitted' using errcode = '22023';
    end if;
    if room.host_picks is null then
      update public.duel_rooms set host_picks = p_picks, host_plan = p_plan,
        updated_at = now() where id = room.id;
    end if;
  else
    if room.guest_picks is not null and
      (room.guest_picks <> p_picks or room.guest_plan <> p_plan) then
      raise exception 'team already submitted' using errcode = '22023';
    end if;
    if room.guest_picks is null then
      update public.duel_rooms set guest_picks = p_picks, guest_plan = p_plan,
        updated_at = now() where id = room.id;
    end if;
  end if;
  return public.get_duel_room(p_code);
end;
$$;

create or replace function public.cancel_duel_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.duel_rooms%rowtype;
  caller uuid := auth.uid();
begin
  select * into room from public.duel_rooms
  where code = upper(btrim(p_code)) for update;
  if caller is null or room.id is null or
    (caller <> room.host_user_id and caller is distinct from room.guest_user_id) then
    raise exception 'room unavailable' using errcode = '42501';
  end if;
  if room.cancelled_at is null then
    update public.duel_rooms set cancelled_at = now(), updated_at = now()
    where id = room.id;
  end if;
  return public.get_duel_room(p_code);
end;
$$;

revoke all on function public.get_duel_room(text) from public, anon, authenticated;
revoke all on function public.create_duel_room() from public, anon, authenticated;
revoke all on function public.join_duel_room(text) from public, anon, authenticated;
revoke all on function public.submit_duel_team(text, text[], text) from public, anon, authenticated;
revoke all on function public.cancel_duel_room(text) from public, anon, authenticated;

grant execute on function public.get_duel_room(text) to authenticated;
grant execute on function public.create_duel_room() to authenticated;
grant execute on function public.join_duel_room(text) to authenticated;
grant execute on function public.submit_duel_team(text, text[], text) to authenticated;
grant execute on function public.cancel_duel_room(text) to authenticated;
