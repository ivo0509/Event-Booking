import template from './EventsList.html?raw';
import './EventsList.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { deleteEvent, fetchAllEvents } from '../../lib/events.js';
import { formatEventDate, truncate } from '../../lib/format.js';
import { getSession } from '../../lib/auth.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { toast } from '../../lib/toast.js';

export const title = 'Events';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let pendingDeleteId = null;

function rowMarkup(event, currentUserId) {
  const isOwner = event.ownerId === currentUserId;
  const ownerActions = isOwner
    ? `
      <a href="/event/${event.id}/edit" data-route class="btn btn-sm btn-eb-outline">Edit</a>
      <button type="button" class="btn btn-sm btn-outline-danger" data-delete-id="${event.id}" data-delete-title="${escapeAttr(event.title)}">
        Delete
      </button>
    `
    : '';

  return `
    <tr>
      <td class="fw-semibold">${escapeHtml(event.title)}</td>
      <td class="events-table__desc text-eb-muted" title="${escapeAttr(event.description ?? '')}">
        ${escapeHtml(truncate(event.description, 80))}
      </td>
      <td class="events-table__location">${escapeHtml(event.location || '—')}</td>
      <td class="events-table__date">${escapeHtml(formatEventDate(event.eventDate))}</td>
      <td>${event.capacity}</td>
      <td>${event.availablePlaces}</td>
      <td>
        <div class="events-table__actions">
          <a href="/event/${event.id}" data-route class="events-table__link">View Event</a>
          ${ownerActions}
        </div>
      </td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function openDeleteModal(id, titleText) {
  pendingDeleteId = id;
  const titleEl = deleteModalEl?.querySelector('[data-delete-event-title]');
  if (titleEl) titleEl.textContent = titleText;
  deleteModal?.show();
}

async function loadEvents(container) {
  const tableBody = container.querySelector('[data-events-table]');

  try {
    const [events, session] = await Promise.all([fetchAllEvents(), getSession()]);
    const userId = session?.user?.id ?? null;

    if (!events.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-eb-muted py-5">
            No events yet. <a href="/event/add" data-route>Create the first event</a>.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = events.map((event) => rowMarkup(event, userId)).join('');

    tableBody.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openDeleteModal(button.dataset.deleteId, button.dataset.deleteTitle);
      });
    });
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-eb-muted py-5">Could not load events.</td>
      </tr>
    `;
    toast.error(error.message || 'Failed to load events.');
  }
}

async function confirmDelete(container) {
  if (!pendingDeleteId) return;

  const button = deleteModalEl?.querySelector('[data-confirm-delete]');
  if (!button) return;

  button.disabled = true;

  try {
    await deleteEvent(pendingDeleteId);
    deleteModal?.hide();
    toast.info('Event deleted.');
    await loadEvents(container);
  } catch (error) {
    toast.error(error.message || 'Failed to delete event.');
  } finally {
    button.disabled = false;
    pendingDeleteId = null;
  }
}

export function init(container) {
  deleteModalEl = container.querySelector('#deleteEventModal');
  deleteModal = attachModalToBody(deleteModalEl);

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete(container);
  });

  loadEvents(container);
  refreshHeaderNav();
}

export function destroy() {
  detachModal(deleteModal, deleteModalEl);
  deleteModal = null;
  deleteModalEl = null;
  pendingDeleteId = null;
}
