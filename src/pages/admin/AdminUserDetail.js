import template from './AdminUserDetail.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { getCurrentUserProfile } from '../../lib/auth.js';
import { deleteUser, fetchUserById } from '../../lib/users.js';
import { formatEventDate } from '../../lib/format.js';
import { escapeHtml } from '../../lib/escape.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { navigate } from '../../router/router.js';
import { toast } from '../../lib/toast.js';

export const title = 'Admin — User';
export { template };

let deleteModal = null;
let deleteModalEl = null;
let currentUserId = null;
let viewingUserId = null;

function roleBadge(role) {
  const isAdmin = role === 'admin';
  return `<span class="admin-badge ${isAdmin ? 'admin-badge--admin' : 'admin-badge--user'}">${isAdmin ? 'Admin' : 'User'}</span>`;
}

function detailMarkup(user, isSelf) {
  return `
    <div class="admin-detail-card eb-glass eb-rise eb-delay-2">
      <h2 class="admin-detail-card__title">${escapeHtml(user.email)}</h2>

      <div class="admin-detail-grid">
        <div class="admin-detail-item"><strong>Name</strong> ${escapeHtml(user.full_name || '—')}</div>
        <div class="admin-detail-item"><strong>Role</strong> ${roleBadge(user.role)}</div>
        <div class="admin-detail-item"><strong>Joined</strong> ${escapeHtml(formatEventDate(user.created_at))}</div>
        <div class="admin-detail-item"><strong>Updated</strong> ${escapeHtml(formatEventDate(user.updated_at))}</div>
      </div>

      <div class="admin-form-actions justify-content-start">
        <a href="/admin/users/${user.id}/edit" data-route class="btn-eb-outline">
          <i class="bi bi-pencil me-2"></i>Edit user
        </a>
        <button
          type="button"
          class="btn btn-outline-danger"
          data-delete-user
          ${isSelf ? 'disabled title="You cannot delete your own account"' : ''}
        >
          <i class="bi bi-trash me-2"></i>Delete user
        </button>
      </div>
    </div>
  `;
}

async function loadUser(container, userId) {
  const mount = container.querySelector('[data-admin-user-detail]');
  const titleEl = container.querySelector('[data-user-title]');
  viewingUserId = userId;

  try {
    const [user, profile] = await Promise.all([fetchUserById(userId), getCurrentUserProfile()]);
    currentUserId = profile?.id ?? null;

    if (!user) {
      mount.innerHTML = `
        <div class="eb-glass p-4 text-center">
          <p class="text-eb-muted mb-3">User not found.</p>
          <a href="/admin/users" data-route class="btn-eb-outline">Back to users</a>
        </div>
      `;
      return;
    }

    const isSelf = user.id === currentUserId;
    if (titleEl) titleEl.textContent = user.email;
    mount.innerHTML = detailMarkup(user, isSelf);

    mount.querySelector('[data-delete-user]')?.addEventListener('click', () => {
      const emailEl = deleteModalEl?.querySelector('[data-delete-user-email]');
      if (emailEl) emailEl.textContent = user.email;
      deleteModal?.show();
    });
  } catch (error) {
    mount.innerHTML = `<div class="eb-glass p-4 text-center text-eb-muted">Could not load user.</div>`;
    toast.error(error.message || 'Failed to load user.');
  }
}

async function confirmDelete() {
  if (!viewingUserId) return;

  const button = deleteModalEl?.querySelector('[data-confirm-delete]');
  if (!button) return;

  button.disabled = true;

  try {
    await deleteUser(viewingUserId);
    deleteModal?.hide();
    toast.info('User deleted.');
    navigate('/admin/users');
  } catch (error) {
    toast.error(error.message || 'Failed to delete user.');
  } finally {
    button.disabled = false;
  }
}

export function init(container, params = {}) {
  deleteModalEl = container.querySelector('#adminUserDetailDeleteModal');
  deleteModal = attachModalToBody(deleteModalEl);

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete();
  });

  loadUser(container, params.id);
  refreshHeaderNav();
}

export function destroy() {
  detachModal(deleteModal, deleteModalEl);
  deleteModal = null;
  deleteModalEl = null;
  currentUserId = null;
  viewingUserId = null;
}
