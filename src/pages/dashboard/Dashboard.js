import template from './Dashboard.html?raw';
import './Dashboard.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import {
  EVENT_CATEGORIES,
  EVENTS_PAGE,
  fetchDashboardStats,
} from '../../lib/events.js';
import { toast } from '../../lib/toast.js';

export const title = 'Dashboard';
export { template };

function totalEventsMarkup(total) {
  return `
    <a href="${EVENTS_PAGE}" data-route class="dashboard-total__card eb-glass eb-glass-hover">
      <div class="dashboard-total__content">
        <div class="eb-icon-badge dashboard-total__icon">
          <i class="bi bi-calendar-event"></i>
        </div>
        <div>
          <div class="dashboard-total__num eb-gradient-text">${total}</div>
          <div class="dashboard-total__label text-eb-muted">Total events</div>
        </div>
      </div>
      <span class="dashboard-total__link">
        View all events <i class="bi bi-arrow-right"></i>
      </span>
    </a>
  `;
}

function categoryStatMarkup({ name, icon, color }, count, index) {
  return `
    <div class="col-6 col-lg-3">
      <div class="dashboard-stat eb-glass eb-rise eb-delay-${(index % 4) + 1}">
        <div class="eb-icon-badge dashboard-stat__icon" style="background: ${color};">
          <i class="bi ${icon}"></i>
        </div>
        <div>
          <div class="dashboard-stat__num">${count}</div>
          <div class="dashboard-stat__label text-eb-muted">${name}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadDashboard(container) {
  const totalEl = container.querySelector('[data-total-events]');
  const categoriesEl = container.querySelector('[data-category-stats]');

  try {
    const { totalEvents, categoryCounts } = await fetchDashboardStats();

    if (totalEl) {
      totalEl.innerHTML = totalEventsMarkup(totalEvents);
    }

    if (categoriesEl) {
      categoriesEl.innerHTML = EVENT_CATEGORIES.map((category, index) =>
        categoryStatMarkup(category, categoryCounts[category.name] ?? 0, index),
      ).join('');
    }
  } catch (error) {
    if (totalEl) {
      totalEl.innerHTML = `
        <div class="dashboard-total__card eb-glass">
          <p class="text-eb-muted mb-0">Could not load event stats.</p>
        </div>
      `;
    }
    if (categoriesEl) {
      categoriesEl.innerHTML = '';
    }
    toast.error(error.message || 'Failed to load dashboard data.');
  }
}

export function init(container) {
  loadDashboard(container);
  refreshHeaderNav();
}
