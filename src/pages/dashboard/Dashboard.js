import template from './Dashboard.html?raw';
import './Dashboard.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Dashboard';
export { template };

export function init() {
  refreshHeaderNav();
}
