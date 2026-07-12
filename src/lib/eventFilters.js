export const EVENT_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'full', label: 'Full' },
  { value: 'available', label: 'Available' },
];

export const AVAILABLE_PLACES_OPTIONS = [
  { value: '', label: 'Any availability' },
  { value: '1', label: '1+ places' },
  { value: '5', label: '5+ places' },
  { value: '10', label: '10+ places' },
  { value: '20', label: '20+ places' },
];

export const SORT_OPTIONS = [
  { value: 'date-asc', label: 'Nearest event date' },
  { value: 'created-desc', label: 'Newest events' },
  { value: 'price-asc', label: 'Ticket price' },
  { value: 'available-desc', label: 'Available places' },
];

function matchesSearch(event, search) {
  if (!search) return true;

  const haystack = [event.title, event.location, event.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}

function matchesStatus(event, status) {
  if (!status) return true;

  const now = new Date();
  const eventDate = new Date(event.eventDate);

  switch (status) {
    case 'upcoming':
      return eventDate >= now;
    case 'past':
      return eventDate < now;
    case 'full':
      return event.availablePlaces === 0;
    case 'available':
      return event.availablePlaces > 0 && eventDate >= now;
    default:
      return true;
  }
}

function matchesDateRange(event, dateFrom, dateTo) {
  const eventTime = new Date(event.eventDate).getTime();

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`).getTime();
    if (eventTime < from) return false;
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`).getTime();
    if (eventTime > to) return false;
  }

  return true;
}

export function filterEvents(events, filters) {
  const search = filters.search?.trim().toLowerCase() ?? '';
  const location = filters.location?.trim().toLowerCase() ?? '';
  const minAvailable = filters.minAvailable ? Number(filters.minAvailable) : null;

  return events.filter((event) => {
    if (!matchesSearch(event, search)) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (!matchesStatus(event, filters.status)) return false;
    if (!matchesDateRange(event, filters.dateFrom, filters.dateTo)) return false;

    if (location && !(event.location ?? '').toLowerCase().includes(location)) {
      return false;
    }

    if (minAvailable !== null && !Number.isNaN(minAvailable)) {
      if (event.availablePlaces < minAvailable) return false;
    }

    return true;
  });
}

export function sortEvents(events, sortValue = 'date-asc') {
  const sorted = [...events];

  sorted.sort((a, b) => {
    switch (sortValue) {
      case 'created-desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'price-asc':
        return (a.ticketPrice ?? 0) - (b.ticketPrice ?? 0);
      case 'available-desc':
        return b.availablePlaces - a.availablePlaces;
      case 'date-asc':
      default:
        return new Date(a.eventDate) - new Date(b.eventDate);
    }
  });

  return sorted;
}

export function applyEventFilters(events, filters) {
  return sortEvents(filterEvents(events, filters), filters.sort);
}
