import template from './AdminUsersList.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { getCurrentUserProfile } from '../../lib/auth.js';
import { createUser, deleteUser, fetchAllUsers, updateUser } from '../../lib/users.js';
import { formatEventDate } from '../../lib/format.js';
import { escapeAttr, escapeHtml } from '../../lib/escape.js';
import { attachModalToBody, detachModal } from '../../lib/modal.js';
import { toast } from '../../lib/toast.js';
import { setAdminNavActive } from './adminNav.js';

export const title = 'Admin — Users';
export { template };

// ── state ──────────────────────────────────────────────────────────────────
let formModal = null;
let formModalEl = null;
let deleteModal = null;
let deleteModalEl = null;
let pendingDeleteId = null;
let editingUserId = null;   // null = create mode
let currentUserId = null;
let allUsers = [];

// ── helpers ────────────────────────────────────────────────────────────────
function roleBadge(role) {
  const isAdmin = role === 'admin';
  return `<span class="admin-badge ${isAdmin ? 'admin-badge--admin' : 'admin-badge--user'}">${isAdmin ? 'Admin' : 'User'}</span>`;
}

function setFormLoading(loading) {
  const btn = formModalEl?.querySelector('[data-user-form-submit]');
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

// ── row markup ─────────────────────────────────────────────────────────────
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
          <button
            type="button"
            class="btn btn-sm btn-eb-outline"
            data-edit-id="${user.id}"
          >Edit</button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            data-delete-id="${user.id}"
            data-delete-email="${escapeAttr(user.email)}"
            ${isSelf ? 'disabled title="You cannot delete your own account"' : ''}
          >Delete</button>
        </div>
      </td>
    </tr>
  `;
}

// ── render table ───────────────────────────────────────────────────────────
function renderTable(container) {
  const tbody = container.querySelector('[data-admin-users-table]');

  if (!allUsers.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-eb-muted py-5">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allUsers.map((u) => rowMarkup(u)).join('');

  tbody.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.editId));
  });

  tbody.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.deleteId, btn.dataset.deleteEmail));
  });
}

// ── load ───────────────────────────────────────────────────────────────────
async function loadUsers(container) {
  const tbody = container.querySelector('[data-admin-users-table]');

  try {
    const [users, profile] = await Promise.all([fetchAllUsers(), getCurrentUserProfile()]);
    allUsers = users;
    currentUserId = profile?.id ?? null;
    renderTable(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-eb-muted py-5">Could not load users.</td></tr>`;
    toast.error(error.message || 'Failed to load users.');
  }
}

// ── add modal ──────────────────────────────────────────────────────────────
function openAddModal() {
  editingUserId = null;

  const titleEl = formModalEl.querySelector('[data-user-form-title]');
  const form = formModalEl.querySelector('#adminUserForm');
  const emailField = formModalEl.querySelector('[data-email-field]');
  const passwordField = formModalEl.querySelector('[data-password-field]');
  const passwordInput = formModalEl.querySelector('#uf-password');

  titleEl.textContent = 'Add user';
  form.reset();

  // email editable, password required
  emailField.classList.remove('d-none');
  formModalEl.querySelector('#uf-email').readOnly = false;
  passwordField.classList.remove('d-none');
  passwordInput.required = true;

  formModal.show();
}

// ── edit modal ─────────────────────────────────────────────────────────────
function openEditModal(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return;

  editingUserId = userId;

  const titleEl = formModalEl.querySelector('[data-user-form-title]');
  const form = formModalEl.querySelector('#adminUserForm');
  const emailField = formModalEl.querySelector('[data-email-field]');
  const passwordField = formModalEl.querySelector('[data-password-field]');
  const passwordInput = formModalEl.querySelector('#uf-password');

  titleEl.textContent = 'Edit user';
  form.reset();

  // email read-only, password hidden
  formModalEl.querySelector('#uf-email').value = user.email;
  formModalEl.querySelector('#uf-email').readOnly = true;
  emailField.classList.remove('d-none');
  passwordField.classList.add('d-none');
  passwordInput.required = false;
  passwordInput.value = '';

  formModalEl.querySelector('#uf-full-name').value = user.full_name ?? '';
  formModalEl.querySelector('#uf-role').value = user.role ?? 'user';

  formModal.show();
}

// ── delete modal ───────────────────────────────────────────────────────────
function openDeleteModal(id, email) {
  pendingDeleteId = id;
  const emailEl = deleteModalEl.querySelector('[data-delete-user-email]');
  if (emailEl) emailEl.textContent = email;
  deleteModal.show();
}

// ── submit form ────────────────────────────────────────────────────────────
async function handleFormSubmit(container, event) {
  event.preventDefault();

  const form = formModalEl.querySelector('#adminUserForm');
  const email = form.email.value.trim();
  const password = form.password.value;
  const fullName = form.fullName.value.trim();
  const role = form.role.value;

  if (!role) {
    toast.error('Please select a role.');
    return;
  }

  const isCreate = editingUserId === null;

  if (isCreate) {
    if (!email) { toast.error('Email is required.'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
  }

  setFormLoading(true);

  try {
    if (isCreate) {
      await createUser({ email, password, fullName, role });
      toast.info('User created.');
    } else {
      await updateUser(editingUserId, { fullName, role });
      toast.info('User updated.');
    }

    formModal.hide();
    await loadUsers(container);
  } catch (error) {
    toast.error(error.message || 'Failed to save user.');
  } finally {
    setFormLoading(false);
  }
}

// ── delete confirm ─────────────────────────────────────────────────────────
async function confirmDelete(container) {
  if (!pendingDeleteId) return;

  const btn = deleteModalEl.querySelector('[data-confirm-delete]');
  if (!btn) return;

  btn.disabled = true;

  try {
    await deleteUser(pendingDeleteId);
    deleteModal.hide();
    toast.info('User deleted.');
    await loadUsers(container);
  } catch (error) {
    toast.error(error.message || 'Failed to delete user.');
  } finally {
    btn.disabled = false;
    pendingDeleteId = null;
  }
}

// ── lifecycle ──────────────────────────────────────────────────────────────
export function init(container) {
  setAdminNavActive(container, 'users');

  formModalEl = container.querySelector('#adminUserFormModal');
  formModal = attachModalToBody(formModalEl);

  deleteModalEl = container.querySelector('#adminDeleteUserModal');
  deleteModal = attachModalToBody(deleteModalEl);

  // Reset editing state when form modal closes
  formModalEl?.addEventListener('hidden.bs.modal', () => {
    editingUserId = null;
  });

  container.querySelector('[data-open-add-user]')?.addEventListener('click', openAddModal);

  formModalEl?.querySelector('#adminUserForm')?.addEventListener('submit', (e) => {
    handleFormSubmit(container, e);
  });

  deleteModalEl?.querySelector('[data-confirm-delete]')?.addEventListener('click', () => {
    confirmDelete(container);
  });

  loadUsers(container);
  refreshHeaderNav();
}

export function destroy() {
  detachModal(formModal, formModalEl);
  detachModal(deleteModal, deleteModalEl);
  formModal = null;
  formModalEl = null;
  deleteModal = null;
  deleteModalEl = null;
  pendingDeleteId = null;
  editingUserId = null;
  currentUserId = null;
  allUsers = [];
}
