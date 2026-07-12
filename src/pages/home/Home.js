import template from './Home.html?raw';
import './Home.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Home';
export { template };

const CATEGORIES = [
  {
    icon: 'bi-music-note-beamed',
    title: 'Concerts',
    text: 'Live music nights, festivals and intimate gigs from your favorite artists.',
  },
  {
    icon: 'bi-trophy',
    title: 'Sports',
    text: 'Marathons, matches and tournaments — cheer from the best seats.',
  },
  {
    icon: 'bi-mic',
    title: 'Conferences',
    text: 'Talks and summits with industry leaders shaping what comes next.',
  },
  {
    icon: 'bi-easel',
    title: 'Workshops',
    text: 'Hands-on sessions to learn new skills in small, focused groups.',
  },
];

const FEATURES = [
  {
    icon: 'bi-lightning-charge',
    title: 'Instant booking',
    text: 'Reserve your spot in seconds with a smooth, secure checkout flow.',
  },
  {
    icon: 'bi-calendar2-check',
    title: 'Manage everything',
    text: 'Track your bookings, positions and confirmations from one dashboard.',
  },
  {
    icon: 'bi-shield-lock',
    title: 'Private & secure',
    text: 'Your data is protected — you only ever see events and bookings you own.',
  },
];

function cardMarkup({ icon, title: cardTitle, text }, index) {
  const delay = `eb-delay-${(index % 4) + 1}`;
  return `
    <div class="col-12 col-sm-6 col-lg-3">
      <div class="home-card eb-glass eb-glass-hover eb-rise ${delay}">
        <div class="eb-icon-badge home-card__icon"><i class="bi ${icon}"></i></div>
        <h3 class="home-card__title">${cardTitle}</h3>
        <p class="home-card__text text-eb-muted">${text}</p>
      </div>
    </div>
  `;
}

function featureMarkup({ icon, title: cardTitle, text }, index) {
  const delay = `eb-delay-${(index % 4) + 1}`;
  return `
    <div class="col-12 col-md-4">
      <div class="home-card eb-glass eb-glass-hover eb-rise ${delay}">
        <div class="eb-icon-badge home-card__icon"><i class="bi ${icon}"></i></div>
        <h3 class="home-card__title">${cardTitle}</h3>
        <p class="home-card__text text-eb-muted">${text}</p>
      </div>
    </div>
  `;
}

export function init(container) {
  const categoriesEl = container.querySelector('[data-categories]');
  if (categoriesEl) {
    categoriesEl.innerHTML = CATEGORIES.map(cardMarkup).join('');
  }

  const featuresEl = container.querySelector('[data-features]');
  if (featuresEl) {
    featuresEl.innerHTML = FEATURES.map(featureMarkup).join('');
  }

  refreshHeaderNav();
}
