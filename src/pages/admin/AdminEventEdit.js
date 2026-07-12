import template from '../event-form/EventForm.html?raw';
import '../event-form/EventForm.css';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { initEventForm } from '../event-form/eventForm.js';

export const title = 'Admin — Edit Event';
export { template };

export function init(container, params = {}) {
  initEventForm(container, {
    mode: 'edit',
    eventId: params.id,
    backHref: '/admin/events',
    cancelHref: `/admin/events/${params.id}`,
    successHref: `/admin/events/${params.id}`,
    notFoundHref: '/admin/events',
  });
  refreshHeaderNav();
}
