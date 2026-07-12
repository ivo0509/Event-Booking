import template from './Login.html?raw';
import './Login.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { signInWithEmail, signUpWithEmail } from '../../lib/auth.js';
import { navigate } from '../../router/router.js';

export const title = 'Login';
export { template };

const TAB_COPY = {
  login: {
    icon: 'bi-box-arrow-in-right',
    title: 'Welcome back',
    subtitle: 'Login to book your next event.',
  },
  register: {
    icon: 'bi-person-plus',
    title: 'Create an account',
    subtitle: 'Register to start booking events.',
  },
};

function showAlert(container, message, type = 'danger') {
  const alert = container.querySelector('[data-alert]');
  if (!alert) return;
  alert.className = `login-alert alert alert-${type}`;
  alert.textContent = message;
  alert.classList.remove('d-none');
}

function hideAlert(container) {
  const alert = container.querySelector('[data-alert]');
  if (!alert) return;
  alert.classList.add('d-none');
  alert.textContent = '';
}

function setLoading(form, loading) {
  const button = form.querySelector('[data-submit-btn]');
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…';
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

function switchTab(container, tab) {
  container.querySelectorAll('[data-tab]').forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  container.querySelector('[data-form="login"]').classList.toggle('d-none', tab !== 'login');
  container.querySelector('[data-form="register"]').classList.toggle('d-none', tab !== 'register');

  const copy = TAB_COPY[tab];
  const iconEl = container.querySelector('[data-auth-icon] i');
  const titleEl = container.querySelector('[data-auth-title]');
  const subtitleEl = container.querySelector('[data-auth-subtitle]');

  if (iconEl) iconEl.className = `bi ${copy.icon}`;
  if (titleEl) titleEl.textContent = copy.title;
  if (subtitleEl) subtitleEl.textContent = copy.subtitle;

  hideAlert(container);
}

async function handleLogin(container, form) {
  hideAlert(container);
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    showAlert(container, 'Please enter your email and password.');
    return;
  }

  setLoading(form, true);

  try {
    await signInWithEmail(email, password);
    navigate('/dashboard');
  } catch (error) {
    showAlert(container, error.message || 'Login failed. Please try again.');
  } finally {
    setLoading(form, false);
  }
}

async function handleRegister(container, form) {
  hideAlert(container);
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (!email || !password || !confirmPassword) {
    showAlert(container, 'Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showAlert(container, 'Password must be at least 6 characters.');
    return;
  }

  if (password !== confirmPassword) {
    showAlert(container, 'Passwords do not match.');
    return;
  }

  setLoading(form, true);

  try {
    const { session, user } = await signUpWithEmail(email, password);

    if (session) {
      navigate('/dashboard');
      return;
    }

    if (user) {
      showAlert(
        container,
        'Account created! Check your email to confirm, then log in.',
        'success',
      );
      switchTab(container, 'login');
      const loginForm = container.querySelector('[data-form="login"]');
      if (loginForm) loginForm.email.value = email;
    }
  } catch (error) {
    showAlert(container, error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(form, false);
  }
}

export function init(container) {
  const loginForm = container.querySelector('[data-form="login"]');
  const registerForm = container.querySelector('[data-form="register"]');

  container.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(container, btn.dataset.tab));
  });

  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleLogin(container, loginForm);
  });

  registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleRegister(container, registerForm);
  });

  refreshHeaderNav();
}
