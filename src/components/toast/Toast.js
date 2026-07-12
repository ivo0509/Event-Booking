import { Toast } from 'bootstrap';
import './Toast.css';

const DEFAULT_DURATION = 4500;
const TITLES = {
  error: 'Error',
  info: 'Info',
};
const ICONS = {
  error: 'bi-exclamation-circle-fill text-danger',
  info: 'bi-info-circle-fill text-info',
};

let hostEl = null;

function ensureHost() {
  if (hostEl) return hostEl;

  hostEl = document.createElement('div');
  hostEl.className = 'toast-container position-fixed eb-toast-host p-3';
  hostEl.setAttribute('aria-live', 'polite');
  hostEl.setAttribute('aria-atomic', 'true');
  document.body.appendChild(hostEl);
  return hostEl;
}

function show(type, message, options = {}) {
  if (!message) return;

  const host = ensureHost();
  const duration = options.duration ?? DEFAULT_DURATION;

  const toastEl = document.createElement('div');
  toastEl.className = `toast eb-toast eb-toast--${type}`;
  toastEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toastEl.innerHTML = `
    <div class="toast-header">
      <i class="bi ${ICONS[type]} me-2"></i>
      <strong class="me-auto">${TITLES[type]}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body"></div>
  `;

  toastEl.querySelector('.toast-body').textContent = message;
  host.appendChild(toastEl);

  const bsToast = Toast.getOrCreateInstance(toastEl, {
    autohide: duration > 0,
    delay: duration,
  });

  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  bsToast.show();

  return toastEl;
}

export function initToastHost() {
  ensureHost();
}

export const toast = {
  error(message, options) {
    return show('error', message, options);
  },
  info(message, options) {
    return show('info', message, options);
  },
};
