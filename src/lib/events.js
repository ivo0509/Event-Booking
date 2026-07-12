import { supabase } from './supabase.js';

export const EVENTS_PAGE = '/events';

export const EVENT_CATEGORIES = [
  { name: 'Concert', icon: 'bi-music-note-beamed', color: 'var(--eb-violet)' },
  { name: 'Sports', icon: 'bi-trophy', color: 'var(--eb-cyan)' },
  { name: 'Conference', icon: 'bi-mic', color: 'var(--eb-indigo)' },
  { name: 'Workshop', icon: 'bi-easel', color: 'var(--eb-pink)' },
];

const EVENT_SELECT = `
  id,
  title,
  description,
  location,
  event_date,
  capacity,
  owner_id,
  bookings ( id, position, confirmed, created_at, user_id ),
  event_categories ( id, name, position )
`;

function mapBookings(rows = []) {
  return rows
    .map((booking) => ({
      id: booking.id,
      position: booking.position,
      confirmed: booking.confirmed,
      createdAt: booking.created_at,
      userId: booking.user_id,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function mapEvent(row) {
  const bookings = mapBookings(row.bookings);
  const bookedCount = bookings.length;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    eventDate: row.event_date,
    capacity: row.capacity,
    ownerId: row.owner_id,
    category: row.event_categories?.[0]?.name ?? null,
    categoryId: row.event_categories?.[0]?.id ?? null,
    bookedCount,
    availablePlaces: Math.max(0, row.capacity - bookedCount),
    bookings,
  };
}

function categoryPosition(name) {
  const index = EVENT_CATEGORIES.findIndex((item) => item.name === name);
  return index >= 0 ? index : 0;
}

export async function fetchAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapEvent);
}

export async function fetchEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapEvent(data) : null;
}

export async function createEvent({
  title,
  description,
  location,
  eventDate,
  capacity,
  category,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      owner_id: user.id,
      title,
      description,
      location,
      event_date: eventDate,
      capacity,
    })
    .select('id')
    .single();

  if (error) throw error;

  if (category) {
    const { error: categoryError } = await supabase.from('event_categories').insert({
      event_id: event.id,
      name: category,
      position: categoryPosition(category),
    });
    if (categoryError) throw categoryError;
  }

  return event.id;
}

export async function updateEvent(id, {
  title,
  description,
  location,
  eventDate,
  capacity,
  category,
}) {
  const { error } = await supabase
    .from('events')
    .update({
      title,
      description,
      location,
      event_date: eventDate,
      capacity,
    })
    .eq('id', id);

  if (error) throw error;

  if (category) {
    const { error: deleteError } = await supabase
      .from('event_categories')
      .delete()
      .eq('event_id', id);
    if (deleteError) throw deleteError;

    const { error: categoryError } = await supabase.from('event_categories').insert({
      event_id: id,
      name: category,
      position: categoryPosition(category),
    });
    if (categoryError) throw categoryError;
  }
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDashboardStats() {
  const [eventsResult, categoriesResult] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('event_categories').select('name'),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const categoryCounts = {};

  for (const row of categoriesResult.data ?? []) {
    categoryCounts[row.name] = (categoryCounts[row.name] ?? 0) + 1;
  }

  return {
    totalEvents: eventsResult.count ?? 0,
    categoryCounts,
  };
}
