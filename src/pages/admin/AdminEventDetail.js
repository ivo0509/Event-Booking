import template from './AdminEventDetail.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { deleteEvent, fetchEventById } from '../../lib/events.js';
import { fetchUserById } from '../../lib/users.js';
import { formatEventDate } from '../../lib/format.js';
import { escapeAttr, escapeHtml } from '../../lib/escape.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { navigate } from '../../router/router.js';
import { toast } from '../../lib/toast.js';

export const title = 'Admin — Event';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let currentEventId = null;

function coverImageMarkup(event) {
  if (!event.coverImageUrl) return '';

  return `
    <div class="admin-detail-card__cover">
      <img src="${escapeAttr(event.coverImageUrl)}" alt="${escapeAttr(event.title)} cover image" loading="lazy" />
    </div>
  `;
}

function detailMarkup(event, owner) {
  return `
    <div class="admin-detail-card eb-glass eb-rise eb-delay-2">
      ${coverImageMarkup(event)}
      <span class="eb-chip mb-3">${escapeHtml(event.category ?? 'Uncategorized')}</span>
      <h2 class="admin-detail-card__title">${escapeHtml(event.title)}</h2>

      <div class="admin-detail-grid">
        <div class="admin-detail-item"><strong>Location</strong> ${escapeHtml(event.location || '—')}</div>
        <div class="admin-detail-item"><strong>Date</strong> ${escapeHtml(formatEventDate(event.eventDate))}</div>
        <div class="admin-detail-item"><strong>Capacity</strong> ${event.capacity}</div>
        <div class="admin-detail-item"><strong>Available</strong> ${event.availablePlaces}</div>
        <div class="admin-detail-item"><strong>Bookings</strong> ${event.bookedCount}</div>
        <div class="admin-detail-item"><strong>Owner</strong> ${escapeHtml(owner?.email ?? event.ownerId)}</div>
      </div>

      <h3 class="h6 text-eb-muted mb-2">Description</h3>
      <p class="text-eb-muted mb-4">${escapeHtml(event.description || 'No description provided.')}</p>

      <div class="admin-form-actions justify-content-start">
        <a href="/admin/events/${event.id}/edit" data-route class="btn-eb-outline">
          <i class="bi bi-pencil me-2"></i>Edit event
        </a>
        <button type="button" class="btn btn-outline-danger" data-delete-event>
          <i class="bi bi-trash me-2"></i>Delete event
        </button>
      </div>
    </div>
  `;
}

async function loadEvent(container, eventId) {
  const mount = container.querySelector('[data-admin-event-detail]');
  const titleEl = container.querySelector('[data-event-title]');
  currentEventId = eventId;

  try {
    const event = await fetchEventById(eventId);

    if (!event) {
      mount.innerHTML = `
        <div class="eb-glass p-4 text-center">
          <p class="text-eb-muted mb-3">Event not found.</p>
          <a href="/admin/events" data-route class="btn-eb-outline">Back to events</a>
        </div>
      `;
      return;
    }

    const owner = event.ownerId ? await fetchUserById(event.ownerId).catch(() => null) : null;
    if (titleEl) titleEl.textContent = event.title;
    mount.innerHTML = detailMarkup(event, owner);

    mount.querySelector('[data-delete-event]')?.addEventListener('click', () => {
      const modalTitle = deleteModalEl?.querySelector('[data-delete-event-title]');
      if (modalTitle) modalTitle.textContent = event.title;
      deleteModal?.show();
    });
  } catch (error) {
    mount.innerHTML = `<div class="eb-glass p-4 text-center text-eb-muted">Could not load event.</div>`;
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
    navigate('/admin/events');
  } catch (error) {
    toast.error(error.message || 'Failed to delete event.');
  } finally {
    button.disabled = false;
  }
}

export function init(container, params = {}) {
  deleteModalEl = container.querySelector('#adminEventDetailDeleteModal');
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
