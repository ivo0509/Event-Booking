import template from './ProjectEvents.html?raw';
import './ProjectEvents.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Project Events';
export { template };

const EVENTS = [
  {
    icon: 'bi-music-note-beamed',
    category: 'Concert',
    title: 'Summer Rock Concert',
    desc: 'An open-air rock concert featuring local bands.',
    location: 'Central Park Arena',
    date: 'In 30 days',
    booked: 12,
    capacity: 50,
  },
  {
    icon: 'bi-trophy',
    category: 'Sports',
    title: 'City Marathon',
    desc: 'Annual city marathon with 5K, 10K and full routes.',
    location: 'Downtown Riverfront',
    date: 'In 45 days',
    booked: 11,
    capacity: 100,
  },
  {
    icon: 'bi-mic',
    category: 'Conference',
    title: 'Tech Leaders Conference',
    desc: 'Two-day conference on architecture and leadership.',
    location: 'Convention Center Hall B',
    date: 'In 60 days',
    booked: 10,
    capacity: 80,
  },
  {
    icon: 'bi-easel',
    category: 'Workshop',
    title: 'UI Design Workshop',
    desc: 'Hands-on workshop on design systems and accessibility.',
    location: 'Creative Hub Studio 3',
    date: 'In 21 days',
    booked: 12,
    capacity: 40,
  },
];

function eventMarkup(event, index) {
  return `
    <div class="col-12 col-md-6 col-xl-3">
      <div class="event-card eb-glass eb-glass-hover eb-rise eb-delay-${(index % 4) + 1}">
        <div class="event-card__top">
          <span class="eb-icon-badge"><i class="bi ${event.icon}"></i></span>
          <span class="event-card__cat">${event.category}</span>
        </div>
        <h3 class="event-card__title">${event.title}</h3>
        <p class="event-card__desc text-eb-muted">${event.desc}</p>
        <div class="event-card__meta">
          <span><i class="bi bi-geo-alt"></i>${event.location}</span>
          <span><i class="bi bi-calendar4-event"></i>${event.date}</span>
        </div>
        <div class="event-card__foot">
          <span class="event-card__capacity">${event.booked}/${event.capacity} booked</span>
          <a href="/login" data-route class="btn-eb event-card__book">Book</a>
        </div>
      </div>
    </div>
  `;
}

export function init(container, params = {}) {
  const projectIdEl = container.querySelector('[data-project-id]');
  if (projectIdEl) {
    projectIdEl.textContent = params.id ?? 'unknown';
  }

  const gridEl = container.querySelector('[data-events-grid]');
  if (gridEl) {
    gridEl.innerHTML = EVENTS.map(eventMarkup).join('');
  }

  refreshHeaderNav();
}
