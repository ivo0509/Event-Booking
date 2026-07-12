import template from './Dashboard.html?raw';
import './Dashboard.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Dashboard';
export { template };

const STATS = [
  { icon: 'bi-calendar-event', num: '4', label: 'Events', color: 'var(--eb-violet)' },
  { icon: 'bi-ticket-perforated', num: '45', label: 'Bookings', color: 'var(--eb-cyan)' },
  { icon: 'bi-check2-circle', num: '31', label: 'Confirmed', color: 'var(--eb-pink)' },
  { icon: 'bi-people', num: '3', label: 'Attendees', color: 'var(--eb-indigo)' },
];

const EVENTS = [
  { icon: 'bi-music-note-beamed', title: 'Summer Rock Concert', meta: 'Central Park Arena', badge: '12 booked' },
  { icon: 'bi-trophy', title: 'City Marathon', meta: 'Downtown Riverfront', badge: '11 booked' },
  { icon: 'bi-mic', title: 'Tech Leaders Conference', meta: 'Convention Center Hall B', badge: '10 booked' },
  { icon: 'bi-easel', title: 'UI Design Workshop', meta: 'Creative Hub Studio 3', badge: '12 booked' },
];

const ACTIVITY = [
  { text: 'New booking confirmed for Summer Rock Concert', time: '2h ago' },
  { text: 'City Marathon reached 11 bookings', time: '5h ago' },
  { text: 'Workshop capacity updated to 40 seats', time: '1d ago' },
  { text: 'Tech Leaders Conference schedule published', time: '2d ago' },
];

function statMarkup({ icon, num, label, color }, index) {
  return `
    <div class="col-6 col-lg-3">
      <div class="dashboard-stat eb-glass eb-glass-hover eb-rise eb-delay-${(index % 4) + 1}">
        <div class="eb-icon-badge dashboard-stat__icon" style="background: ${color};">
          <i class="bi ${icon}"></i>
        </div>
        <div>
          <div class="dashboard-stat__num">${num}</div>
          <div class="dashboard-stat__label text-eb-muted">${label}</div>
        </div>
      </div>
    </div>
  `;
}

function eventMarkup({ icon, title: eventTitle, meta, badge }) {
  return `
    <li class="dashboard-list__item">
      <span class="dashboard-list__icon"><i class="bi ${icon}"></i></span>
      <div class="dashboard-list__body">
        <p class="dashboard-list__title">${eventTitle}</p>
        <p class="dashboard-list__meta text-eb-muted"><i class="bi bi-geo-alt me-1"></i>${meta}</p>
      </div>
      <span class="dashboard-badge">${badge}</span>
    </li>
  `;
}

function activityMarkup({ text, time }) {
  return `
    <li class="dashboard-activity__item">
      <span class="dashboard-activity__dot"></span>
      <div>
        <div>${text}</div>
        <div class="dashboard-activity__time">${time}</div>
      </div>
    </li>
  `;
}

export function init(container) {
  const statsEl = container.querySelector('[data-stats]');
  if (statsEl) statsEl.innerHTML = STATS.map(statMarkup).join('');

  const eventsEl = container.querySelector('[data-events]');
  if (eventsEl) eventsEl.innerHTML = EVENTS.map(eventMarkup).join('');

  const activityEl = container.querySelector('[data-activity]');
  if (activityEl) activityEl.innerHTML = ACTIVITY.map(activityMarkup).join('');

  refreshHeaderNav();
}
