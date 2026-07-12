import template from './EventsList.html?raw';
import './EventsList.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { applyEventFilters } from '../../lib/eventFilters.js';
import { deleteEvent, EVENT_CATEGORIES, fetchAllEvents } from '../../lib/events.js';
import { formatEventDate, formatTicketPrice, truncate } from '../../lib/format.js';
import { escapeAttr, escapeHtml } from '../../lib/escape.js';
import { getSession } from '../../lib/auth.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { toast } from '../../lib/toast.js';

export const title = 'Events';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let pendingDeleteId = null;
let allEvents = [];
let currentUserId = null;
let pageContainer = null;
let searchDebounceTimer = null;

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
      <td><span class="events-table__category">${escapeHtml(event.category ?? '—')}</span></td>
      <td class="events-table__desc text-eb-muted" title="${escapeAttr(event.description ?? '')}">
        ${escapeHtml(truncate(event.description, 80))}
      </td>
      <td class="events-table__location">${escapeHtml(event.location || '—')}</td>
      <td class="events-table__date">${escapeHtml(formatEventDate(event.eventDate))}</td>
      <td class="events-table__price">${escapeHtml(formatTicketPrice(event.ticketPrice))}</td>
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

function getFilterValues(container) {
  return {
    search: container.querySelector('[data-filter-search]')?.value ?? '',
    category: container.querySelector('[data-filter-category]')?.value ?? '',
    status: container.querySelector('[data-filter-status]')?.value ?? '',
    dateFrom: container.querySelector('[data-filter-date-from]')?.value ?? '',
    dateTo: container.querySelector('[data-filter-date-to]')?.value ?? '',
    location: container.querySelector('[data-filter-location]')?.value ?? '',
    minAvailable: container.querySelector('[data-filter-available]')?.value ?? '',
    sort: container.querySelector('[data-filter-sort]')?.value ?? 'date-asc',
  };
}

function populateCategoryFilter(container) {
  const select = container.querySelector('[data-filter-category]');
  if (!select) return;

  const options = EVENT_CATEGORIES.map(
    (category) => `<option value="${escapeAttr(category.name)}">${escapeHtml(category.name)}</option>`,
  ).join('');

  select.innerHTML = `<option value="">All categories</option>${options}`;
}

function clearFilters(container) {
  container.querySelector('[data-filter-search]').value = '';
  container.querySelector('[data-filter-category]').value = '';
  container.querySelector('[data-filter-status]').value = '';
  container.querySelector('[data-filter-date-from]').value = '';
  container.querySelector('[data-filter-date-to]').value = '';
  container.querySelector('[data-filter-location]').value = '';
  container.querySelector('[data-filter-available]').value = '';
  container.querySelector('[data-filter-sort]').value = 'date-asc';
}

function renderEvents(container) {
  const tableBody = container.querySelector('[data-events-table]');
  const countEl = container.querySelector('[data-events-count]');
  const filters = getFilterValues(container);
  const events = applyEventFilters(allEvents, filters);

  if (countEl) {
    countEl.textContent = `${events.length} of ${allEvents.length} events`;
  }

  if (!events.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-eb-muted py-5">
          ${
            allEvents.length
              ? 'No events match your search or filters.'
              : 'No events yet. <a href="/event/add" data-route>Create the first event</a>.'
          }
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = events.map((event) => rowMarkup(event, currentUserId)).join('');

  tableBody.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      openDeleteModal(button.dataset.deleteId, button.dataset.deleteTitle);
    });
  });
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
    allEvents = events;
    currentUserId = session?.user?.id ?? null;
    renderEvents(container);
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-eb-muted py-5">Could not load events.</td>
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

function bindFilters(container) {
  const rerender = () => renderEvents(container);

  container.querySelectorAll(
    '[data-filter-category], [data-filter-status], [data-filter-date-from], [data-filter-date-to], [data-filter-available], [data-filter-sort]',
  ).forEach((element) => {
    element.addEventListener('change', rerender);
  });

  container.querySelector('[data-filter-location]')?.addEventListener('input', () => {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(rerender, 200);
  });

  container.querySelector('[data-filter-search]')?.addEventListener('input', () => {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(rerender, 200);
  });

  container.querySelector('[data-filter-clear]')?.addEventListener('click', () => {
    clearFilters(container);
    rerender();
  });
}

export function init(container) {
  pageContainer = container;
  deleteModalEl = container.querySelector('#deleteEventModal');
  deleteModal = attachModalToBody(deleteModalEl);

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete(container);
  });

  populateCategoryFilter(container);
  bindFilters(container);
  loadEvents(container);
  refreshHeaderNav();
}

export function destroy() {
  window.clearTimeout(searchDebounceTimer);
  detachModal(deleteModal, deleteModalEl);
  deleteModal = null;
  deleteModalEl = null;
  pendingDeleteId = null;
  allEvents = [];
  currentUserId = null;
  pageContainer = null;
}
