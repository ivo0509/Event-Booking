import template from '../event-form/EventForm.html?raw';
import '../event-form/EventForm.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { initEventForm } from '../event-form/eventForm.js';

export const title = 'Add Event';
export { template };

export function init(container) {
  initEventForm(container, { mode: 'add' });
  refreshHeaderNav();
}
