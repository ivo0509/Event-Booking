-- Allow logged-in users to book and cancel their own reservations,
-- and view bookings for the event details page.

create policy "Authenticated users can view all bookings"
on public.bookings
for select
to authenticated
using (true);

create policy "Users can create own booking"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own booking"
on public.bookings
for delete
to authenticated
using (user_id = auth.uid());
