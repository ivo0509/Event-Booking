import { supabase } from './supabase.js';

export const EVENTS_PAGE = '/projects/demo/events';

export const EVENT_CATEGORIES = [
  { name: 'Concert', icon: 'bi-music-note-beamed', color: 'var(--eb-violet)' },
  { name: 'Sports', icon: 'bi-trophy', color: 'var(--eb-cyan)' },
  { name: 'Conference', icon: 'bi-mic', color: 'var(--eb-indigo)' },
  { name: 'Workshop', icon: 'bi-easel', color: 'var(--eb-pink)' },
];

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
