-- Add admin role and policies for admin panel management.

alter table public.users
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Admin can manage all events
create policy "Admins can update any event"
on public.events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete any event"
on public.events
for delete
to authenticated
using (public.is_admin());

-- Admin can manage all event categories
create policy "Admins can insert any event category"
on public.event_categories
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update any event category"
on public.event_categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete any event category"
on public.event_categories
for delete
to authenticated
using (public.is_admin());

-- Admin can manage all users
create policy "Admins can update any user"
on public.users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete any user"
on public.users
for delete
to authenticated
using (public.is_admin());

-- Promote seeded owner as default admin
update public.users
set role = 'admin'
where email = 'steve@gmail.com';
