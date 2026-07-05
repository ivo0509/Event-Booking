import template from './Header.html?raw';
import './Header.css';

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

export function renderHeader(container) {
  container.innerHTML = template;
  setActiveNavLink();
  window.addEventListener('popstate', setActiveNavLink);
}

export function refreshHeaderNav() {
  setActiveNavLink();
}
