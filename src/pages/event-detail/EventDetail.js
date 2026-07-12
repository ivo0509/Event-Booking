import template from './EventDetail.html?raw';
import './EventDetail.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { bookEvent, cancelUserBooking } from '../../lib/bookings.js';
import { deleteEvent, fetchEventById } from '../../lib/events.js';
import { formatEventDate } from '../../lib/format.js';
import { getSession } from '../../lib/auth.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { navigate } from '../../router/router.js';
import { toast } from '../../lib/toast.js';

export const title = 'Event Details';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let currentEventId = null;
let pageContainer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBookedAt(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function bookingRowMarkup(booking, currentUserId) {
  const isYou = booking.userId === currentUserId;
  const guestLabel = isYou ? 'You' : 'Guest';
  const statusClass = booking.confirmed
    ? 'event-detail-badge--confirmed'
    : 'event-detail-badge--pending';
  const statusLabel = booking.confirmed ? 'Confirmed' : 'Pending';

  return `
    <tr>
      <td>#${booking.position + 1}</td>
      <td class="${isYou ? 'event-detail-bookings-table__you' : ''}">${guestLabel}</td>
      <td>${escapeHtml(formatBookedAt(booking.createdAt))}</td>
      <td><span class="event-detail-badge ${statusClass}">${statusLabel}</span></td>
    </tr>
  `;
}

function bookingsPanelMarkup(bookings, currentUserId) {
  if (!bookings.length) {
    return `
      <div class="event-detail-bookings-panel eb-glass">
        <div class="event-detail-bookings-panel__head">
          <h2 class="event-detail-bookings-panel__title"><i class="bi bi-clock-history me-2"></i>Recent bookings</h2>
        </div>
        <p class="text-eb-muted mb-0">No bookings yet. Be the first to reserve a place.</p>
      </div>
    `;
  }

  return `
    <div class="event-detail-bookings-panel eb-glass">
      <div class="event-detail-bookings-panel__head">
        <h2 class="event-detail-bookings-panel__title"><i class="bi bi-clock-history me-2"></i>Recent bookings</h2>
      </div>
      <div class="event-detail-bookings-scroll">
        <table class="table event-detail-bookings-table align-middle">
          <thead>
            <tr>
              <th>Place</th>
              <th>Guest</th>
              <th>Booked at</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map((booking) => bookingRowMarkup(booking, currentUserId)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function coverImageMarkup(event) {
  if (!event.coverImageUrl) return '';

  return `
    <div class="event-detail-card__cover">
      <img src="${escapeHtml(event.coverImageUrl)}" alt="${escapeHtml(event.title)} cover image" loading="lazy" />
    </div>
  `;
}

function detailMarkup(event, session) {
  const currentUserId = session?.user?.id ?? null;
  const isOwner = event.ownerId === currentUserId;
  const userBooking = event.bookings.find((booking) => booking.userId === currentUserId);
  const canBook = !isOwner && !userBooking && event.availablePlaces > 0;
  const canCancel = !isOwner && Boolean(userBooking);

  const bookingAction = canBook
    ? `<button type="button" class="btn-eb" data-book-event><i class="bi bi-ticket-perforated me-2"></i>Book reservation</button>`
    : canCancel
      ? `<button type="button" class="btn-eb-outline" data-cancel-booking><i class="bi bi-x-circle me-2"></i>Cancel reservation</button>`
      : isOwner
        ? `<span class="text-eb-muted">You are the organizer of this event.</span>`
        : event.availablePlaces === 0
          ? `<span class="text-eb-muted">This event is fully booked.</span>`
          : '';

  const ownerActions = isOwner
    ? `
      <a href="/event/${event.id}/edit" data-route class="btn-eb-outline">
        <i class="bi bi-pencil me-2"></i>Edit event
      </a>
      <button type="button" class="btn btn-outline-danger" data-delete-event>
        <i class="bi bi-trash me-2"></i>Delete event
      </button>
    `
    : '';

  return `
    <div class="event-detail-layout">
      <div class="event-detail-card eb-glass eb-rise eb-delay-2">
        ${coverImageMarkup(event)}
        <span class="eb-chip mb-3">${escapeHtml(event.category ?? 'Uncategorized')}</span>
        <h1 class="event-detail-card__title">${escapeHtml(event.title)}</h1>

        <div class="event-detail-stats">
          <div class="event-detail-stat">
            <div class="event-detail-stat__label">Location</div>
            <div class="event-detail-stat__value">${escapeHtml(event.location || '—')}</div>
          </div>
          <div class="event-detail-stat">
            <div class="event-detail-stat__label">Event date</div>
            <div class="event-detail-stat__value">${escapeHtml(formatEventDate(event.eventDate))}</div>
          </div>
          <div class="event-detail-stat">
            <div class="event-detail-stat__label">Capacity</div>
            <div class="event-detail-stat__value">${event.capacity}</div>
          </div>
          <div class="event-detail-stat">
            <div class="event-detail-stat__label">Available places</div>
            <div class="event-detail-stat__value">${event.availablePlaces}</div>
          </div>
        </div>

        <h2 class="event-detail-card__section-title">Description</h2>
        <div class="event-detail-card__desc-scroll">
          <p class="event-detail-card__desc text-eb-muted">${escapeHtml(event.description || 'No description provided.')}</p>
        </div>

        <div class="event-detail-booking">
          ${bookingAction}
        </div>

        ${bookingsPanelMarkup(event.bookings, currentUserId)}

        <div class="event-detail-card__actions">
          ${ownerActions}
        </div>
      </div>
    </div>
  `;
}

function bindDetailActions(container, event, session) {
  container.querySelector('[data-book-event]')?.addEventListener('click', async () => {
    const button = container.querySelector('[data-book-event]');
    button.disabled = true;

    try {
      await bookEvent(event.id, event.capacity);
      toast.info('Reservation confirmed.');
      await loadEvent(pageContainer, currentEventId);
    } catch (error) {
      toast.error(error.message || 'Failed to book reservation.');
      button.disabled = false;
    }
  });

  container.querySelector('[data-cancel-booking]')?.addEventListener('click', async () => {
    const button = container.querySelector('[data-cancel-booking]');
    button.disabled = true;

    try {
      await cancelUserBooking(event.id);
      toast.info('Reservation cancelled.');
      await loadEvent(pageContainer, currentEventId);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel reservation.');
      button.disabled = false;
    }
  });

  container.querySelector('[data-delete-event]')?.addEventListener('click', () => {
    const titleEl = deleteModalEl?.querySelector('[data-delete-event-title]');
    if (titleEl) titleEl.textContent = event.title;
    deleteModal?.show();
  });
}

async function loadEvent(container, eventId) {
  const mount = container.querySelector('[data-event-detail]');
  currentEventId = eventId;

  try {
    const [event, session] = await Promise.all([fetchEventById(eventId), getSession()]);

    if (!event) {
      mount.innerHTML = `
        <div class="eb-glass p-4 text-center">
          <p class="text-eb-muted mb-3">Event not found.</p>
          <a href="/events" data-route class="btn-eb-outline">Back to events</a>
        </div>
      `;
      return;
    }

    mount.innerHTML = detailMarkup(event, session);
    bindDetailActions(mount, event, session);
  } catch (error) {
    mount.innerHTML = `
      <div class="eb-glass p-4 text-center text-eb-muted">Could not load event.</div>
    `;
    toast.error(error.message || 'Failed to load event.');
  }
}

async function confirmDelete() {
  if (!currentEventId) return;

  const button = deleteModalEl?.querySelector('[data-confirm-delete]');
  if (!button) return;

  button.disabled = true;

  try {
    await deleteEvent(currentEventId);
    deleteModal?.hide();
    toast.info('Event deleted.');
    navigate('/events');
  } catch (error) {
    toast.error(error.message || 'Failed to delete event.');
  } finally {
    button.disabled = false;
  }
}

export function init(container, params = {}) {
  pageContainer = container;
  deleteModalEl = container.querySelector('#deleteEventDetailModal');
  deleteModal = attachModalToBody(deleteModalEl);

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete();
  });

  loadEvent(container, params.id);
  refreshHeaderNav();
}

export function destroy() {
  detachModal(deleteModal, deleteModalEl);
  deleteModal = null;
  deleteModalEl = null;
  currentEventId = null;
  pageContainer = null;
}
