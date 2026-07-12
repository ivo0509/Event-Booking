import template from './Header.html?raw';
import './Header.css';
import { getSession, signOut } from '../../lib/auth.js';

function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.site-header a[data-route]');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    let isActive = href === currentPath;

    if (link.dataset.navMatch === 'project-events') {
      isActive = /^\/projects\/[^/]+\/events$/.test(currentPath);
    }

    link.classList.toggle('active', isActive);
  });
}

function renderAuthSlot(session) {
  const slot = document.querySelector('[data-auth-slot]');
  if (!slot) return;

  if (session?.user) {
    slot.innerHTML = `
      <button type="button" class="btn-eb-outline site-header__logout">
        <i class="bi bi-box-arrow-left me-1"></i>Logout
      </button>
    `;
    slot.querySelector('button')?.addEventListener('click', () => {
      signOut();
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
  getSession().then(renderAuthSlot).catch(() => renderAuthSlot(null));
}

export function refreshHeaderNav() {
  setActiveNavLink();
}

export function refreshHeaderAuth(session) {
  renderAuthSlot(session);
  setActiveNavLink();
}
