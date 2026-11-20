/* 吉時行樂: offline support (service worker) and the 「安裝到桌面」 button.
 *
 * - Chrome / Edge / Android: the browser fires `beforeinstallprompt`; the header button
 *   opens the browser's own install dialog.
 * - iPhone / iPad: there is no install event, so the button opens a short guide to
 *   Share → 加入主畫面.
 * - Already installed (standalone window) or a browser that cannot install: no button.
 */
'use strict';

(function () {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('[吉時行樂] offline support is unavailable:', err);
      });
    });
  }

  const actions = document.querySelector('.cf-topbar-actions');
  if (!actions) return;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isEn = () => document.documentElement.lang === 'en';

  const INSTALL_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    + '<path d="M8 2.25v7.5m0 0L4.75 6.5M8 9.75l3.25-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M2.75 10.25v2.5a.5.5 0 0 0 .5.5h9.5a.5.5 0 0 0 .5-.5v-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SHARE_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">'
    + '<path d="M9 11V2.5m0 0L6 5.5m3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M6.25 7.75H4.5v7.75h9V7.75h-1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let deferredPrompt = null;

  const icon = h('span.cf-install-icon');
  icon.innerHTML = INSTALL_ICON;
  const label = h('span.cf-install-label');
  const button = h('button#cf-install-btn.btn.btn-sm.btn-ghost.cf-install-btn', { type: 'button' }, [icon, label]);
  button.hidden = true;
  actions.prepend(button);

  function updateLabel() {
    label.textContent = isEn() ? 'Install' : '安裝';
    const full = isEn() ? 'Install on your home screen' : '安裝到桌面';
    button.setAttribute('aria-label', full);
    button.title = full;
  }

  function refresh() {
    button.hidden = isStandalone() || !(deferredPrompt || isIOS);
  }

  function showIOSGuide() {
    const en = isEn();
    const share = h('span.cf-install-share');
    share.innerHTML = SHARE_ICON;
    const steps = en
      ? [
          [h('span', 'Tap the browser’s Share button '), share],
          [h('span', 'Scroll down and choose '), h('b', 'Add to Home Screen')],
          [h('span', 'Tap '), h('b', 'Add'), h('span', ' — 吉時行樂 will appear on your Home Screen')],
        ]
      : [
          [h('span', '點瀏覽器的「分享」按鈕 '), share],
          [h('span', '往下滑，選「'), h('b', '加入主畫面'), h('span', '」')],
          [h('span', '按「'), h('b', '新增'), h('span', '」，桌面就會出現吉時行樂')],
        ];

    const overlay = h('div.cf-modal-backdrop');
    // Return focus to the install button (Safari does not focus a button on tap).
    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      button.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const ok = h('button.btn.btn-sm.btn-primary', { type: 'button', onclick: close }, en ? 'Got it' : '知道了');
    const dialog = h('div.cf-modal-card', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cf-install-title' }, [
      h('div.cf-modal-head', h('strong#cf-install-title', en ? 'Add to Home Screen' : '加入主畫面')),
      h('div.cf-modal-body', [
        h('p.cf-install-lead', en
          ? 'Open it from your Home Screen like an app. It works offline too.'
          : '之後從桌面一點就開，像 App 一樣，沒網路也能看。'),
        h('ol.cf-install-steps', steps.map((parts) => h('li', h('span', parts)))),
      ]),
      h('div.cf-modal-actions', [ok]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    ok.focus();
  }

  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      refresh();
      promptEvent.prompt();
      try { await promptEvent.userChoice; } catch {}
      return;
    }
    if (isIOS) showIOSGuide();
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    refresh();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    refresh();
    if (window.toast) window.toast(isEn() ? 'Installed — open it from your desktop or home screen' : '已安裝，可以從桌面直接開啟');
  });

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', refresh);
  new MutationObserver(updateLabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  updateLabel();
  refresh();
})();
