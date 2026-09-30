-- Authorization checks only; all fixtures are rolled back.
begin;
insert into auth.users (id, instance_id, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

set local role authenticated;
do $$
declare
  room_code text;
  host_topic text;
  guest_topic text;
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  room_code := public.create_duel_room();
  perform set_config('chat_smoke.code', room_code, true);
  host_topic := 'duel-chat:' || room_code || ':host';
  guest_topic := 'duel-chat:' || room_code || ':guest';
  if not public.can_access_duel_chat(host_topic, true)
    or not public.can_access_duel_chat(guest_topic, false)
    or public.can_access_duel_chat(guest_topic, true)
    or public.can_access_duel_chat(host_topic || ':extra', false)
    or public.can_access_duel_chat('another:' || room_code || ':host', false)
    or public.can_access_duel_chat(null, false) then
    raise exception 'host topic authorization failed';
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
  if public.can_access_duel_chat(host_topic, false) then
    raise exception 'an invitation alone allowed listening';
  end if;
  perform public.join_duel_room(room_code);
  if not public.can_access_duel_chat(host_topic, false)
    or not public.can_access_duel_chat(guest_topic, true)
    or public.can_access_duel_chat(host_topic, true) then
    raise exception 'guest can impersonate host or cannot use chat';
  end if;

  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
  if public.can_access_duel_chat(host_topic, false)
    or public.can_access_duel_chat(guest_topic, true) then
    raise exception 'third identity can access room chat';
  end if;
  perform set_config('request.jwt.claim.sub', '', true);
  if public.can_access_duel_chat(host_topic, false) then
    raise exception 'missing identity allowed into chat';
  end if;
  if has_function_privilege('anon', 'public.can_access_duel_chat(text,boolean)', 'execute') then
    raise exception 'unauthenticated caller can execute chat authorization';
  end if;
end;
$$;

reset role;
update public.duel_rooms set expires_at = now() - interval '1 second'
where code = current_setting('chat_smoke.code');
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  if public.can_access_duel_chat('duel-chat:' || current_setting('chat_smoke.code') || ':host', true) then
    raise exception 'expired room allowed a new chat connection';
  end if;
end;
$$;
reset role;
update public.duel_rooms set expires_at = now() + interval '1 day', cancelled_at = now()
where code = current_setting('chat_smoke.code');
set local role authenticated;
do $$
begin
  if public.can_access_duel_chat('duel-chat:' || current_setting('chat_smoke.code') || ':host', false) then
    raise exception 'cancelled room allowed a new chat connection';
  end if;
end;
$$;
rollback;
