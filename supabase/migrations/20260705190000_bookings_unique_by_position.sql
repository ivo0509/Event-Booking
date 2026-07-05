-- Allow multiple booking slots per event (unique by position, not user).
-- Needed so seed data can assign 10–12 slots per event using 3 sample users.

alter table public.bookings
  drop constraint if exists bookings_event_id_user_id_key;

alter table public.bookings
  add constraint bookings_event_id_position_key unique (event_id, position);
