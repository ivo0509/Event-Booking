-- Dashboard and Events pages need to read all events for browsing/stats.
-- Write access remains restricted to event owners.

create policy "Authenticated users can view all events"
on public.events
for select
to authenticated
using (true);

create policy "Authenticated users can view all event categories"
on public.event_categories
for select
to authenticated
using (true);
