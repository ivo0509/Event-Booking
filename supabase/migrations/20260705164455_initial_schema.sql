-- Event Booking initial schema
-- Users are managed by Supabase Auth (auth.users).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, position)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position >= 0),
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index events_owner_id_idx on public.events (owner_id);
create index event_categories_event_id_idx on public.event_categories (event_id);
create index bookings_event_id_idx on public.bookings (event_id);
create index bookings_user_id_idx on public.bookings (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create or replace function public.is_event_owner(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where id = target_event_id
      and owner_id = auth.uid()
  );
$$;

alter table public.events enable row level security;
alter table public.event_categories enable row level security;
alter table public.bookings enable row level security;

create policy "Users can view own events"
on public.events
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can create own events"
on public.events
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own events"
on public.events
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own events"
on public.events
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can view categories of own events"
on public.event_categories
for select
to authenticated
using (public.is_event_owner(event_id));

create policy "Users can create categories for own events"
on public.event_categories
for insert
to authenticated
with check (public.is_event_owner(event_id));

create policy "Users can update categories of own events"
on public.event_categories
for update
to authenticated
using (public.is_event_owner(event_id))
with check (public.is_event_owner(event_id));

create policy "Users can delete categories of own events"
on public.event_categories
for delete
to authenticated
using (public.is_event_owner(event_id));

create policy "Users can view bookings of own events"
on public.bookings
for select
to authenticated
using (public.is_event_owner(event_id));

create policy "Users can create bookings for own events"
on public.bookings
for insert
to authenticated
with check (public.is_event_owner(event_id));

create policy "Users can update bookings of own events"
on public.bookings
for update
to authenticated
using (public.is_event_owner(event_id))
with check (public.is_event_owner(event_id));

create policy "Users can delete bookings of own events"
on public.bookings
for delete
to authenticated
using (public.is_event_owner(event_id));

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
