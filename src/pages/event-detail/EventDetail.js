import template from './EventDetail.html?raw';
import './EventDetail.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
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

function detailMarkup(event, isOwner) {
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
    <div class="event-detail-card eb-glass eb-rise eb-delay-2">
      <span class="eb-chip mb-3">${event.category ?? 'Uncategorized'}</span>
      <h1 class="event-detail-card__title">${escapeHtml(event.title)}</h1>

      <div class="event-detail-card__meta">
        <div class="event-detail-card__meta-item">
          <i class="bi bi-geo-alt"></i>
          <span>${escapeHtml(event.location || '—')}</span>
        </div>
        <div class="event-detail-card__meta-item">
          <i class="bi bi-calendar4-event"></i>
          <span>${escapeHtml(formatEventDate(event.eventDate))}</span>
        </div>
        <div class="event-detail-card__meta-item">
          <i class="bi bi-people"></i>
          <span>Capacity: ${event.capacity} · Available: ${event.availablePlaces} · Booked: ${event.bookedCount}</span>
        </div>
      </div>

      <p class="event-detail-card__desc text-eb-muted">${escapeHtml(event.description || 'No description provided.')}</p>

      <div class="event-detail-card__actions">
        ${ownerActions}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

    const isOwner = event.ownerId === session?.user?.id;
    mount.innerHTML = detailMarkup(event, isOwner);

    mount.querySelector('[data-delete-event]')?.addEventListener('click', () => {
      const titleEl = deleteModalEl?.querySelector('[data-delete-event-title]');
      if (titleEl) titleEl.textContent = event.title;
      deleteModal?.show();
    });
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
}
