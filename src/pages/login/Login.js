import template from './Login.html?raw';
import './Login.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Login';
export { template };

export function init() {
  refreshHeaderNav();
}
