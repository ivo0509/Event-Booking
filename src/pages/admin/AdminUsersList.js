import template from './AdminUsersList.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { getCurrentUserProfile } from '../../lib/auth.js';
import { deleteUser, fetchAllUsers } from '../../lib/users.js';
import { formatEventDate } from '../../lib/format.js';
import { escapeAttr, escapeHtml } from '../../lib/escape.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { toast } from '../../lib/toast.js';
import { setAdminNavActive } from './adminNav.js';

export const title = 'Admin — Users';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let pendingDeleteId = null;
let currentUserId = null;

function roleBadge(role) {
  const isAdmin = role === 'admin';
  return `<span class="admin-badge ${isAdmin ? 'admin-badge--admin' : 'admin-badge--user'}">${isAdmin ? 'Admin' : 'User'}</span>`;
}

function rowMarkup(user) {
  const isSelf = user.id === currentUserId;

  return `
    <tr>
      <td class="fw-semibold">${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.full_name || '—')}</td>
      <td>${roleBadge(user.role)}</td>
      <td>${escapeHtml(formatEventDate(user.created_at))}</td>
      <td>
        <div class="admin-table__actions">
          <a href="/admin/users/${user.id}" data-route class="btn btn-sm btn-eb-outline">View</a>
          <a href="/admin/users/${user.id}/edit" data-route class="btn btn-sm btn-eb-outline">Edit</a>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            data-delete-id="${user.id}"
            data-delete-email="${escapeAttr(user.email)}"
            ${isSelf ? 'disabled title="You cannot delete your own account"' : ''}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  `;
}

function openDeleteModal(id, email) {
  pendingDeleteId = id;
  const emailEl = deleteModalEl?.querySelector('[data-delete-user-email]');
  if (emailEl) emailEl.textContent = email;
  deleteModal?.show();
}

async function loadUsers(container) {
  const tableBody = container.querySelector('[data-admin-users-table]');

  try {
    const [users, profile] = await Promise.all([fetchAllUsers(), getCurrentUserProfile()]);
    currentUserId = profile?.id ?? null;

    if (!users.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-eb-muted py-5">No users found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = users.map((user) => rowMarkup(user)).join('');

    tableBody.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openDeleteModal(button.dataset.deleteId, button.dataset.deleteEmail);
      });
    });
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-eb-muted py-5">Could not load users.</td>
      </tr>
    `;
    toast.error(error.message || 'Failed to load users.');
  }
}

async function confirmDelete(container) {
  if (!pendingDeleteId) return;

  const button = deleteModalEl?.querySelector('[data-confirm-delete]');
  if (!button) return;

  button.disabled = true;

  try {
    await deleteUser(pendingDeleteId);
    deleteModal?.hide();
    toast.info('User deleted.');
    await loadUsers(container);
  } catch (error) {
    toast.error(error.message || 'Failed to delete user.');
  } finally {
    button.disabled = false;
    pendingDeleteId = null;
  }
}

export function init(container) {
  setAdminNavActive(container, 'users');
  deleteModalEl = container.querySelector('#adminDeleteUserModal');
  deleteModal = attachModalToBody(deleteModalEl);

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete(container);
  });

  loadUsers(container);
  refreshHeaderNav();
}

export function destroy() {
  detachModal(deleteModal, deleteModalEl);
  deleteModal = null;
  deleteModalEl = null;
  pendingDeleteId = null;
  currentUserId = null;
}
