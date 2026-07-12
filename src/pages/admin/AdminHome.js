import template from './AdminHome.html?raw';
import './admin.css';
import { refreshHeaderNav } from '../../components/header/Header.js';
import { setAdminNavActive } from './adminNav.js';

export const title = 'Admin';
export { template };

export function init(container) {
  setAdminNavActive(container, 'overview');
  refreshHeaderNav();
}
