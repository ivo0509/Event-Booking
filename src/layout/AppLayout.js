import { renderHeader } from '../components/header/Header.js';
import { renderFooter } from '../components/footer/Footer.js';
import { createPageContentElement } from '../components/page-content/PageContent.js';
import { mountLiveBackground } from '../components/live-background/LiveBackground.js';
import { initRouter } from '../router/router.js';

export function renderLayout(root) {
  const headerMount = document.createElement('div');
  headerMount.id = 'site-header';

  const pageContent = createPageContentElement();

  const footerMount = document.createElement('div');
  footerMount.id = 'site-footer';

  root.replaceChildren(headerMount, pageContent, footerMount);

  mountLiveBackground(document.body);
  renderHeader(headerMount);
  renderFooter(footerMount);
  initRouter(pageContent);
}
