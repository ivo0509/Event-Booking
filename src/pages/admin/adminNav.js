export function setAdminNavActive(container, section) {
  container.querySelectorAll('[data-admin-nav-link]').forEach((link) => {
    link.classList.toggle('active', link.dataset.adminNavLink === section);
  });

  const overviewLink = container.querySelector('[data-admin-nav] a[href="/admin"]');
  if (overviewLink) {
    overviewLink.classList.toggle('active', section === 'overview');
  }
}
