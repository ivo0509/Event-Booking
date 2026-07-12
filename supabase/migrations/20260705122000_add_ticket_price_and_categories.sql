-- Ticket price for events and migrate legacy category names.

alter table public.events
  add column if not exists ticket_price numeric(10, 2) not null default 0
  check (ticket_price >= 0);

update public.event_categories set name = 'Music' where name = 'Concert';
update public.event_categories set name = 'Technology' where name = 'Conference';
update public.event_categories set name = 'Education' where name = 'Workshop';

update public.events e
set ticket_price = v.price
from (values
  ('Summer Rock Concert', 45.00),
  ('City Marathon', 25.00),
  ('Tech Leaders Conference', 120.00),
  ('UI Design Workshop', 55.00)
) as v(title, price)
where e.title = v.title;
