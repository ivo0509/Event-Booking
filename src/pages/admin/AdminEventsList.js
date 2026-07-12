import template from './AdminEventsList.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { deleteEvent, fetchAllEvents } from '../../lib/events.js';
import { formatEventDate } from '../../lib/format.js';
import { escapeAttr, escapeHtml } from '../../lib/escape.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { toast } from '../../lib/toast.js';
import { setAdminNavActive } from './adminNav.js';

export const title = 'Admin — Events';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let pendingDeleteId = null;

function rowMarkup(event) {
  return `
    <tr>
      <td class="fw-semibold">${escapeHtml(event.title)}</td>
      <td>${escapeHtml(event.location || '—')}</td>
      <td>${escapeHtml(formatEventDate(event.eventDate))}</td>
      <td>${event.capacity}</td>
      <td>${event.availablePlaces}</td>
      <td>
        <div class="admin-table__actions">
          <a href="/admin/events/${event.id}" data-route class="btn btn-sm btn-eb-outline">View</a>
          <a href="/admin/events/${event.id}/edit" data-route class="btn btn-sm btn-eb-outline">Edit</a>
          <button type="button" class="btn btn-sm btn-outline-danger" data-delete-id="${event.id}" data-delete-title="${escapeAttr(event.title)}">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `;
}

function openDeleteModal(id, titleText) {
  pendingDeleteId = id;
  const titleEl = deleteModalEl?.querySelector('[data-delete-event-title]');
  if (titleEl) titleEl.textContent = titleText;
  deleteModal?.show();
}

async function loadEvents(container) {
  const tableBody = container.querySelector('[data-admin-events-table]');

  try {
    const events = await fetchAllEvents();

    if (!events.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-eb-muted py-5">No events found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = events.map((event) => rowMarkup(event)).join('');

    tableBody.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openDeleteModal(button.dataset.deleteId, button.dataset.deleteTitle);
      });
    });
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-eb-muted py-5">Could not load events.</td>
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
  setAdminNavActive(container, 'events');
  deleteModalEl = container.querySelector('#adminDeleteEventModal');
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
