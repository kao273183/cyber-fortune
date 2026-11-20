/* Standalone Core Helpers for Lucky Hour */
'use strict';

(function () {
  const LANG_KEY = 'zuto_lang';
  const THEME_KEY = 'cyber_fortune_theme';

  function getLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'zh-TW') return saved;
    return 'zh-TW';
  }

  function setLang(lang) {
    const next = lang === 'en' ? 'en' : 'zh-TW';
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next === 'en' ? 'en' : 'zh-Hant';
    return next;
  }

  function readStored(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function getTheme() {
    const forced = (window.location.search.match(/[?&]theme=(light|dark)\b/) || [])[1];
    if (forced) return forced;
    const saved = readStored(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // persist=false follows the system setting until the visitor picks a theme themselves.
  function applyTheme(theme, persist = true) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (persist) {
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    }
    document.documentElement.setAttribute('data-theme', next);
    return next;
  }

  function t(key, vars = {}) {
    const lang = getLang();
    const dict = (window.I18N && (window.I18N[lang] || window.I18N['zh-TW'])) || {};
    const parts = String(key || '').split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else {
        cur = null;
        break;
      }
    }
    if (typeof cur !== 'string') return '';
    return cur.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
  }

  function h(tagSpec, attrsOrChildren, maybeChildren) {
    let attrs = {};
    let children = [];
    if (
      attrsOrChildren !== null &&
      typeof attrsOrChildren === 'object' &&
      !Array.isArray(attrsOrChildren) &&
      !(attrsOrChildren instanceof Node)
    ) {
      attrs = attrsOrChildren;
      children = maybeChildren !== undefined ? (Array.isArray(maybeChildren) ? maybeChildren : [maybeChildren]) : [];
    } else if (attrsOrChildren !== undefined) {
      children = Array.isArray(attrsOrChildren) ? attrsOrChildren : [attrsOrChildren];
    }

    const parts = String(tagSpec).split('.');
    const tagAndId = parts[0] || 'div';
    const [tagName, idPart] = tagAndId.split('#');
    const classes = parts.slice(1).filter(Boolean);

    const el = document.createElement(tagName || 'div');
    if (idPart) el.id = idPart;
    if (classes.length) el.className = classes.join(' ');

    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class' || k === 'className') {
        const extra = String(v).trim();
        if (extra) el.className = el.className ? `${el.className} ${extra}` : extra;
      } else if (k === 'style') {
        if (typeof v === 'string') el.style.cssText = v;
        else if (typeof v === 'object') Object.assign(el.style, v);
      } else if (k === 'html') {
        el.innerHTML = String(v);
      } else if (k === 'text') {
        el.textContent = String(v);
      } else if (k === 'dataset' && typeof v === 'object') {
        for (const [dk, dv] of Object.entries(v)) {
          if (dv !== undefined && dv !== null) el.dataset[dk] = String(dv);
        }
      } else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if ((k === 'click' || k === 'input' || k === 'change' || k === 'submit' || k === 'keydown') && typeof v === 'function') {
        el.addEventListener(k, v);
      } else if (k === 'value') {
        el.value = String(v);
      } else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden' || k === 'readOnly' || k === 'readonly') {
        el[k === 'readonly' ? 'readOnly' : k] = Boolean(v);
      } else {
        el.setAttribute(k, v === true ? '' : String(v));
      }
    }

    const appendChild = (c) => {
      if (c === null || c === undefined || c === false || c === true) return;
      if (Array.isArray(c)) {
        c.forEach(appendChild);
      } else if (c instanceof Node) {
        el.appendChild(c);
      } else {
        el.appendChild(document.createTextNode(String(c)));
      }
    };
    children.forEach(appendChild);
    return el;
  }

  function clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function input(attrs = {}) {
    return h('input.input', { type: attrs.type || 'text', ...attrs });
  }

  function textarea(attrs = {}) {
    return h('textarea.textarea', attrs);
  }

  function select(options = [], attrs = {}) {
    const el = h('select.select', attrs);
    for (const opt of options) {
      if (typeof opt === 'object' && opt !== null) {
        const o = h('option', { value: opt.value ?? '' }, opt.label ?? opt.value ?? '');
        if (attrs.value !== undefined && String(opt.value) === String(attrs.value)) o.selected = true;
        el.appendChild(o);
      } else {
        const o = h('option', { value: opt }, String(opt));
        if (attrs.value !== undefined && String(opt) === String(attrs.value)) o.selected = true;
        el.appendChild(o);
      }
    }
    return el;
  }

  // The static GitHub Pages build loads js/local-api.js, which answers
  // /api/fortune/* in the browser; otherwise requests go to the Node server.
  function transport(url, opts) {
    const local = window.CyberFortuneLocalApi;
    if (local && local.handles(url)) return local.fetch(url, opts);
    return fetch(url, opts);
  }

  async function request(method, url, body) {
    const opts = {
      method,
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await transport(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || data.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  const api = {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    patch: (url, body) => request('PATCH', url, body),
    put: (url, body) => request('PUT', url, body),
    delete: (url) => request('DELETE', url),
  };

  let toastContainer = null;
  function toast(message, type = 'ok') {
    if (!toastContainer) {
      toastContainer = h('div.cf-toast-stack');
      document.body.appendChild(toastContainer);
    }
    const item = h(`div.cf-toast.is-${type}`, String(message || ''));
    toastContainer.appendChild(item);
    requestAnimationFrame(() => item.classList.add('is-visible'));
    setTimeout(() => {
      item.classList.remove('is-visible');
      setTimeout(() => item.remove(), 220);
    }, 3200);
  }

  function confirmModal(message, options = {}) {
    return new Promise((resolve) => {
      const overlay = h('div.cf-modal-backdrop');
      const close = (val) => {
        overlay.remove();
        resolve(val);
      };
      const dialog = h('div.cf-modal-card', [
        h('div.cf-modal-head', [
          h('strong', options.title || t('common.confirm') || '確認'),
        ]),
        h('div.cf-modal-body', String(message || '')),
        h('div.cf-modal-actions', [
          h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: () => close(false) }, options.cancelLabel || t('common.cancel') || '取消'),
          h(`button.btn.btn-sm${options.danger ? '.btn-danger' : '.btn-primary'}`, { type: 'button', onclick: () => close(true) }, options.confirmLabel || t('common.confirm') || '確定'),
        ]),
      ]);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }

  function promptModal(message, options = {}) {
    return new Promise((resolve) => {
      const overlay = h('div.cf-modal-backdrop');
      const field = textarea({
        rows: 5,
        value: options.defaultValue || '',
        style: 'width: 100%; box-sizing: border-box;',
      });
      const close = (val) => {
        overlay.remove();
        resolve(val);
      };
      const dialog = h('div.cf-modal-card', [
        h('div.cf-modal-head', [
          h('strong', String(message || '')),
        ]),
        h('div.cf-modal-body', [field]),
        h('div.cf-modal-actions', [
          h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: () => close(null) }, t('common.close') || '關閉'),
          h('button.btn.btn-sm.btn-primary', { type: 'button', onclick: () => close(field.value) }, t('common.confirm') || '確定'),
        ]),
      ]);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(null);
      });
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      field.focus();
      field.select();
    });
  }

  window.h = h;
  window.clear = clear;
  window.api = api;
  window.toast = toast;
  window.confirmModal = confirmModal;
  window.promptModal = promptModal;
  window.input = input;
  window.select = select;
  window.textarea = textarea;
  window.t = t;
  window.App = { user: { id: 1, username: '道友', display_name: '道友' } };
  window.CyberFortuneCore = { getLang, setLang, getTheme, applyTheme };

  // Initialize theme & lang immediately
  applyTheme(getTheme(), false);
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      if (!readStored(THEME_KEY)) applyTheme(getTheme(), false);
    });
  }
  setLang(getLang());
})();
