/* Standalone Page Bootstrapper for Lucky Hour */
'use strict';

(function () {
  const root = document.getElementById('fortune-page-root');
  const langBtn = document.getElementById('cf-lang-btn');
  const themeBtn = document.getElementById('cf-theme-btn');
  const titleEl = document.getElementById('cf-app-title');
  const subEl = document.getElementById('cf-app-subtitle');

  const STORAGE_SIGN_KEY = 'zuto_daily_zodiac_sign';
  let dailyData = null;

  function updateHeaderControls() {
    const lang = window.CyberFortuneCore.getLang();
    const theme = window.CyberFortuneCore.getTheme();
    const isEn = lang === 'en';
    if (titleEl) titleEl.textContent = isEn ? 'Lucky Hour' : '吉時行樂';
    if (subEl) subEl.textContent = isEn ? 'Almanac · Zodiac · Ziwei · Astrology · Oracle · Tarot' : '老黃曆 · 星座 · 紫微 · 星盤 · 靈籤 · 塔羅';
    if (langBtn) {
      const [zhEl, , enEl] = langBtn.children;
      if (zhEl && enEl) {
        zhEl.classList.toggle('is-on', !isEn);
        enEl.classList.toggle('is-on', isEn);
      }
      langBtn.setAttribute('aria-label', isEn ? '切換為繁體中文' : 'Switch to English');
    }
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', theme === 'dark'
        ? (isEn ? 'Switch to light mode' : '切換為淺色模式')
        : (isEn ? 'Switch to dark mode' : '切換為深色模式'));
    }
  }

  function mountPage() {
    if (!root) return;
    clear(root);

    if (!dailyData) {
      root.appendChild(h('div.cf-loading-card', t('common.loading') || '載入今日運勢中...'));
      return;
    }

    const activeSign = localStorage.getItem(STORAGE_SIGN_KEY) || 'scorpio';
    const hubEl = window.createFortuneHub({
      dailyData,
      activeSign,
      onSignChange: (sign) => {
        try { localStorage.setItem(STORAGE_SIGN_KEY, sign); } catch {}
      },
    });
    root.appendChild(hubEl);
  }

  async function init() {
    updateHeaderControls();
    mountPage();
    try {
      const res = await api.get('/api/fortune/daily');
      if (res && res.ok) {
        dailyData = res;
        mountPage();
      }
    } catch (err) {
      clear(root);
      root.appendChild(h('div.cf-loading-card', [
        h('div', err.message || '載入失敗'),
        h('button.btn.btn-sm.btn-primary', { type: 'button', style: 'margin-top: 12px;', onclick: init }, t('common.retry') || '重試'),
      ]));
    }
  }

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const cur = window.CyberFortuneCore.getLang();
      window.CyberFortuneCore.setLang(cur === 'en' ? 'zh-TW' : 'en');
      updateHeaderControls();
      mountPage();
    });
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = window.CyberFortuneCore.getTheme();
      window.CyberFortuneCore.applyTheme(cur === 'dark' ? 'light' : 'dark');
      updateHeaderControls();
    });
  }

  init();
})();
