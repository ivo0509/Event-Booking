import template from './Header.html?raw';
import './Header.css';
import { getSession, signOut } from '../../lib/auth.js';
import { toast } from '../../lib/toast.js';

function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.site-header a[data-route]');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    let isActive = href === currentPath;

    if (link.dataset.navMatch === 'project-events') {
      isActive = /^\/projects\/[^/]+\/events$/.test(currentPath);
    }

    if (link.dataset.navHome && currentPath === '/dashboard') {
      isActive = true;
    }

    link.classList.toggle('active', isActive);
  });
}

function updateNavForAuth(session) {
  const homeLink = document.querySelector('[data-nav-home]');
  const dashboardItem = document.querySelector('[data-nav-dashboard]');

  if (session?.user) {
    if (homeLink) {
      homeLink.setAttribute('href', '/dashboard');
      homeLink.textContent = 'Home';
    }
    dashboardItem?.classList.add('d-none');
  } else {
    if (homeLink) {
      homeLink.setAttribute('href', '/');
      homeLink.textContent = 'Home';
    }
    dashboardItem?.classList.remove('d-none');
  }
}

function renderAuthSlot(session) {
  updateNavForAuth(session);
  const slot = document.querySelector('[data-auth-slot]');
  if (!slot) return;

  if (session?.user) {
    slot.innerHTML = `
      <button type="button" class="btn-eb-outline site-header__logout">
        <i class="bi bi-box-arrow-left me-1"></i>Logout
      </button>
    `;
    slot.querySelector('button')?.addEventListener('click', async () => {
      try {
        await signOut();
      } catch (error) {
        toast.error(error.message || 'Logout failed. Please try again.');
      }
    });
    return;
  }

  slot.innerHTML = `
    <a class="btn-eb site-header__login" href="/login" data-route>
      <i class="bi bi-box-arrow-in-right me-1"></i>Login
    </a>
  `;
}

function handleAuthChange(event) {
  renderAuthSlot(event.detail.session);
  setActiveNavLink();
}

export function renderHeader(container) {
  container.innerHTML = template;
  setActiveNavLink();
  window.addEventListener('popstate', setActiveNavLink);
  window.addEventListener('authchange', handleAuthChange);
  getSession()
    .then((session) => {
      renderAuthSlot(session);
      setActiveNavLink();
    })
    .catch(() => {
      renderAuthSlot(null);
      setActiveNavLink();
    });
}

export function refreshHeaderNav() {
  setActiveNavLink();
}

export function refreshHeaderAuth(session) {
  renderAuthSlot(session);
  setActiveNavLink();
}
