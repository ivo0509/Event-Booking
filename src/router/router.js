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
      <section class="container text-center" style="padding-block: clamp(4rem, 12vw, 8rem);">
        <div class="eb-icon-badge mx-auto mb-4" style="width:4rem;height:4rem;font-size:2rem;">
          <i class="bi bi-compass"></i>
        </div>
        <h1 class="display-5 fw-bold mb-2">Page not found</h1>
        <p class="text-eb-muted mb-4">The page you're looking for doesn't exist or has moved.</p>
        <a href="/" data-route class="btn-eb btn-eb-lg">
          <i class="bi bi-house me-2"></i>Back to home
        </a>
      </section>
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
