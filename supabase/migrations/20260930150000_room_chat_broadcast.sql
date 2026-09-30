-- Ephemeral WebSocket broadcasts only: no chat table or message persistence.
-- Each seat owns a topic so payloads cannot impersonate the other participant.
create or replace function public.can_access_duel_chat(p_topic text, p_send boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p_topic ~ '^duel-chat:[0-9A-F]{12}:(host|guest)$'
    and exists (
      select 1 from public.duel_rooms room
      where room.code = split_part(p_topic, ':', 2)
        and room.cancelled_at is null
        and room.expires_at > now()
        and (auth.uid() = room.host_user_id or auth.uid() = room.guest_user_id)
        and (
          p_send = false
          or (split_part(p_topic, ':', 3) = 'host' and auth.uid() = room.host_user_id)
          or (split_part(p_topic, ':', 3) = 'guest' and auth.uid() = room.guest_user_id)
        )
    ), false
  );
$$;

revoke all on function public.can_access_duel_chat(text, boolean) from public, anon, authenticated;
grant execute on function public.can_access_duel_chat(text, boolean) to authenticated;

create policy duel_chat_receive on realtime.messages
for select to authenticated
using (
  extension = 'broadcast'
  and topic = (select realtime.topic())
  and public.can_access_duel_chat((select realtime.topic()), false)
);

create policy duel_chat_send on realtime.messages
for insert to authenticated
with check (
  extension = 'broadcast'
  and topic = (select realtime.topic())
  and public.can_access_duel_chat((select realtime.topic()), true)
);
