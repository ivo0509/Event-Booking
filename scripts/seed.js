import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SAMPLE_USERS = [
  { email: 'steve@gmail.com', password: 'pass123', name: 'Steve', role: 'admin' },
  { email: 'maria@gmail.com', password: 'pass123', name: 'Maria' },
  { email: 'peter@gmail.com', password: 'pass123', name: 'Peter' },
];

const CATEGORY_NAMES = ['Music', 'Sports', 'Technology', 'Education', 'Business', 'Entertainment'];

const SAMPLE_EVENTS = [
  {
    title: 'Summer Rock Concert',
    description: 'An open-air rock concert featuring local bands.',
    location: 'Central Park Arena',
    daysFromNow: 30,
    capacity: 50,
    ownerEmail: 'steve@gmail.com',
    category: 'Music',
    ticketPrice: 45,
    bookingCount: 12,
  },
  {
    title: 'City Marathon',
    description: 'Annual city marathon with 5K, 10K, and full marathon routes.',
    location: 'Downtown Riverfront',
    daysFromNow: 45,
    capacity: 100,
    ownerEmail: 'maria@gmail.com',
    category: 'Sports',
    ticketPrice: 25,
    bookingCount: 11,
  },
  {
    title: 'Tech Leaders Conference',
    description: 'Two-day conference on software architecture and product leadership.',
    location: 'Convention Center Hall B',
    daysFromNow: 60,
    capacity: 80,
    ownerEmail: 'peter@gmail.com',
    category: 'Technology',
    ticketPrice: 120,
    bookingCount: 10,
  },
  {
    title: 'UI Design Workshop',
    description: 'Hands-on workshop covering design systems and accessibility.',
    location: 'Creative Hub Studio 3',
    daysFromNow: 21,
    capacity: 40,
    ownerEmail: 'steve@gmail.com',
    category: 'Education',
    ticketPrice: 55,
    bookingCount: 12,
  },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createAdminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function getOrCreateUser(supabase, { email, password, name, role = 'user' }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (!error) {
    await upsertPublicUser(supabase, data.user.id, email, name, role);
    return data.user.id;
  }

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = listData.users.find((user) => user.email === email);
  if (!existing) {
    throw error;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: { full_name: name },
  });

  if (updateError) {
    throw updateError;
  }

  await upsertPublicUser(supabase, existing.id, email, name, role);
  return existing.id;
}

async function upsertPublicUser(supabase, id, email, name, role = 'user') {
  const { error } = await supabase.from('users').upsert(
    {
      id,
      email,
      full_name: name,
      role,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`Failed to upsert public user ${email}: ${error.message}`);
  }
}

async function clearExistingData(supabase) {
  const tables = ['bookings', 'event_categories', 'events'];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().gte('created_at', '1970-01-01');
    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }
}

async function seedUsers(supabase) {
  const userIdsByEmail = {};

  for (const user of SAMPLE_USERS) {
    userIdsByEmail[user.email] = await getOrCreateUser(supabase, user);
    console.log(`User ready: ${user.email}`);
  }

  return userIdsByEmail;
}

function buildBookings(eventId, bookingCount, userIdsByEmail) {
  const userIds = SAMPLE_USERS.map((user) => userIdsByEmail[user.email]);

  return Array.from({ length: bookingCount }, (_, index) => ({
    event_id: eventId,
    user_id: userIds[index % userIds.length],
    position: index,
    confirmed: index % 3 !== 0,
  }));
}

async function seedEvents(supabase, userIdsByEmail) {
  for (const eventSeed of SAMPLE_EVENTS) {
    const eventDate = addDays(new Date(), eventSeed.daysFromNow).toISOString();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        owner_id: userIdsByEmail[eventSeed.ownerEmail],
        title: eventSeed.title,
        description: eventSeed.description,
        location: eventSeed.location,
        event_date: eventDate,
        capacity: eventSeed.capacity,
        ticket_price: eventSeed.ticketPrice ?? 0,
      })
      .select('id')
      .single();

    if (eventError) {
      throw new Error(`Failed to create event "${eventSeed.title}": ${eventError.message}`);
    }

    const { error: categoryError } = await supabase.from('event_categories').insert({
      event_id: event.id,
      name: eventSeed.category,
      position: CATEGORY_NAMES.indexOf(eventSeed.category),
    });

    if (categoryError) {
      throw new Error(
        `Failed to create category for "${eventSeed.title}": ${categoryError.message}`,
      );
    }

    const bookings = buildBookings(event.id, eventSeed.bookingCount, userIdsByEmail);
    const { error: bookingsError } = await supabase.from('bookings').insert(bookings);

    if (bookingsError) {
      throw new Error(`Failed to create bookings for "${eventSeed.title}": ${bookingsError.message}`);
    }

    console.log(
      `Event seeded: ${eventSeed.title} (${eventSeed.category}, ${eventSeed.bookingCount} bookings)`,
    );
  }
}

async function main() {
  const supabase = createAdminClient();

  console.log('Clearing existing events, categories, and bookings...');
  await clearExistingData(supabase);

  console.log('Creating sample auth users...');
  const userIdsByEmail = await seedUsers(supabase);

  console.log('Seeding events, categories, and bookings...');
  await seedEvents(supabase, userIdsByEmail);

  console.log('Seed completed successfully.');
}

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
