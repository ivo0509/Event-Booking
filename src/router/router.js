const routes = [
  {
    path: '/',
    page: () => import('../pages/home/Home.js'),
  },
  {
    path: '/login',
    page: () => import('../pages/login/Login.js'),
  },
  {
    path: '/dashboard',
    page: () => import('../pages/dashboard/Dashboard.js'),
  },
  {
    path: '/projects/:id/events',
    page: () => import('../pages/project-events/ProjectEvents.js'),
  },
];

let contentContainer = null;
let currentPageModule = null;

function matchRoute(pathname) {
  for (const route of routes) {
    const params = matchPath(route.path, pathname);
    if (params !== null) {
      return { route, params };
    }
  }
  return null;
}

function matchPath(pattern, pathname) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function buildPath(pattern, params = {}) {
  return pattern.replace(/:([^/]+)/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? encodeURIComponent(value) : `:${key}`;
  });
}

export function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  renderCurrentRoute();
}

export function initRouter(container) {
  contentContainer = container;

  window.addEventListener('popstate', renderCurrentRoute);
  document.addEventListener('click', handleLinkClick);

  renderCurrentRoute();
}

async function renderCurrentRoute() {
  if (!contentContainer) {
    return;
  }

  const match = matchRoute(window.location.pathname);

  if (!match) {
    contentContainer.innerHTML = `
      <div class="container py-5">
        <div class="alert alert-warning" role="alert">
          Page not found.
        </div>
      </div>
    `;
    document.title = 'Not Found — Event Booking';
    return;
  }

  if (currentPageModule?.destroy) {
    currentPageModule.destroy();
  }

  const pageModule = await match.route.page();
  currentPageModule = pageModule;

  contentContainer.innerHTML = pageModule.template;
  pageModule.init?.(contentContainer, match.params);

  document.title = pageModule.title
    ? `${pageModule.title} — Event Booking`
    : 'Event Booking';

  window.dispatchEvent(new CustomEvent('routechange', { detail: match.params }));
}

function handleLinkClick(event) {
  const link = event.target.closest('a[data-route]');
  if (!link || link.target === '_blank' || event.metaKey || event.ctrlKey) {
    return;
  }

  event.preventDefault();
  navigate(link.getAttribute('href'));
}

export { buildPath, routes };
