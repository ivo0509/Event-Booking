import template from './AdminUserEdit.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { fetchUserById, updateUser } from '../../lib/users.js';
import { navigate } from '../../router/router.js';
import { toast } from '../../lib/toast.js';

export const title = 'Admin — Edit User';
export { template };

function setLoading(form, loading) {
  const button = form.querySelector('[data-submit-btn]');
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

async function loadUser(container, userId) {
  const form = container.querySelector('.admin-user-form');
  const cancelLink = container.querySelector('[data-cancel-link]');

  try {
    const user = await fetchUserById(userId);

    if (!user) {
      toast.error('User not found.');
      navigate('/admin/users');
      return;
    }

    form.email.value = user.email;
    form.fullName.value = user.full_name ?? '';
    form.role.value = user.role ?? 'user';

    if (cancelLink) {
      cancelLink.setAttribute('href', `/admin/users/${userId}`);
    }
  } catch (error) {
    toast.error(error.message || 'Failed to load user.');
    navigate('/admin/users');
  }
}

export function init(container, params = {}) {
  const form = container.querySelector('.admin-user-form');
  const userId = params.id;

  loadUser(container, userId);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = form.fullName.value.trim();
    const role = form.role.value;

    if (!role) {
      toast.error('Please select a role.');
      return;
    }

    setLoading(form, true);

    try {
      await updateUser(userId, { fullName, role });
      toast.info('User updated.');
      navigate(`/admin/users/${userId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update user.');
    } finally {
      setLoading(form, false);
    }
  });

  refreshHeaderNav();
}
