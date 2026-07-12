import { supabase } from './supabase.js';

export async function bookEvent(eventId, capacity) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const { data: existingBookings, error: fetchError } = await supabase
    .from('bookings')
    .select('id, position, user_id')
    .eq('event_id', eventId)
    .order('position', { ascending: true });

  if (fetchError) throw fetchError;

  const bookings = existingBookings ?? [];

  if (bookings.some((booking) => booking.user_id === user.id)) {
    throw new Error('You already have a reservation for this event.');
  }

  if (bookings.length >= capacity) {
    throw new Error('This event is fully booked.');
  }

  const usedPositions = new Set(bookings.map((booking) => booking.position));
  let position = 0;
  while (usedPositions.has(position)) {
    position += 1;
  }

  const { error } = await supabase.from('bookings').insert({
    event_id: eventId,
    user_id: user.id,
    position,
    confirmed: true,
  });

  if (error) throw error;
}

export async function cancelUserBooking(eventId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id);

  if (error) throw error;
}
