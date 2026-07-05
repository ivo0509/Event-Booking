import template from './ProjectEvents.html?raw';
import './ProjectEvents.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Project Events';
export { template };

export function init(container, params = {}) {
  const projectIdEl = container.querySelector('[data-project-id]');
  if (projectIdEl) {
    projectIdEl.textContent = params.id ?? 'unknown';
  }

  refreshHeaderNav();
}
