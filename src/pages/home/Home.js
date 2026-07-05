import template from './Home.html?raw';
import './Home.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Home';
export { template };

export function init() {
  refreshHeaderNav();
}
