begin;

insert into auth.users (id, instance_id, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

set local role authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.duel_candidates', 'select') or
    has_table_privilege('authenticated', 'public.duel_rooms', 'select') then
    raise exception 'duel tables allow direct client reads';
  end if;
end;
$$;

do $$
declare
  room_code text;
  snapshot jsonb;
  host_picks text[];
  guest_picks text[];
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  room_code := public.create_duel_room();
  snapshot := public.get_duel_room(room_code);
  if snapshot->>'seat' <> 'host' or jsonb_array_length(snapshot->'offers') <> 5 then
    raise exception 'host room snapshot invalid';
  end if;
  select array_agg(offer->'optionIds'->>0 order by ordinal)
  into host_picks
  from jsonb_array_elements(snapshot->'offers') with ordinality as options(offer, ordinal);
  select array_agg(offer->'optionIds'->>1 order by ordinal)
  into guest_picks
  from jsonb_array_elements(snapshot->'offers') with ordinality as options(offer, ordinal);

  begin
    perform public.submit_duel_team(room_code, array['invented', 'invented', 'invented', 'invented', 'invented'], 'teamfight');
    raise exception 'invalid picks were accepted';
  exception when sqlstate '22023' then
    null;
  end;
  snapshot := public.submit_duel_team(room_code, host_picks, 'aggression');
  if snapshot->>'hostReady' <> 'true' or snapshot->'guestPicks' <> 'null'::jsonb then
    raise exception 'host submission leaked opponent state';
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  snapshot := public.join_duel_room(room_code);
  if snapshot->>'seat' <> 'guest' or snapshot->>'hostReady' <> 'true' or
    snapshot->'hostPicks' <> 'null'::jsonb then
    raise exception 'guest saw hidden host picks';
  end if;

  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
  begin
    perform public.get_duel_room(room_code);
    raise exception 'third party read a private room';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.join_duel_room(room_code);
    raise exception 'third party took an occupied seat';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  snapshot := public.submit_duel_team(room_code, guest_picks, 'teamfight');
  if snapshot->>'state' <> 'complete' or snapshot->'hostPicks' = 'null'::jsonb or
    snapshot->'guestPicks' = 'null'::jsonb then
    raise exception 'completed room did not reveal both teams';
  end if;
  snapshot := public.submit_duel_team(room_code, guest_picks, 'teamfight');
  if snapshot->>'state' <> 'complete' then
    raise exception 'identical retry was not idempotent';
  end if;
  begin
    perform public.submit_duel_team(room_code, host_picks, 'teamfight');
    raise exception 'submitted team was changed';
  exception when sqlstate '22023' then
    null;
  end;
end;
$$;

rollback;
