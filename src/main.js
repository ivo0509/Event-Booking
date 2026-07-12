import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import { renderLayout } from './layout/AppLayout.js';
import { initAuthState } from './lib/auth.js';

renderLayout(document.getElementById('app'));
initAuthState();
