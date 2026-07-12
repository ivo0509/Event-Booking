-- Event cover images: storage bucket, policies, and events column.

alter table public.events
  add column if not exists cover_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read event images"
on storage.objects
for select
to public
using (bucket_id = 'event-images');

create policy "Admins can upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'events'
);

create policy "Admins can update event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and public.is_admin()
)
with check (
  bucket_id = 'event-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'events'
);

create policy "Admins can delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'events'
);
