import template from './Login.html?raw';
import './Login.css';
import { refreshHeaderNav } from '../../components/header/Header.js';

export const title = 'Login';
export { template };

export function init(container) {
  const form = container.querySelector('.login-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in…';
    }
  });

  refreshHeaderNav();
}
