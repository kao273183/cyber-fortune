/**
 * public/js/components/fortune-tarot.js
 * 塔羅占卜 (Rider-Waite-Smith 78 cards), printed in the 紅黑雙色農民曆 world.
 *   - 單張指引 & 三張牌陣: shuffle, draw, flip one card or all, reshuffle
 *   - Cards are framed almanac plates; the flip is this tab's one authored motion
 *     and runs only when a card is newly revealed (re-renders arrive already turned)
 *   - Each revealed card reads on a .cf-sheet: a 正位 (vermilion) / 逆位 (ink) seal,
 *     ruled meaning rows, topic readings and reflection questions
 *   - 78-card codex: ruled catalogue grid, arcana / suit filters, search, card detail
 *     (side sheet on wide screens, bottom-sheet dialog on phones)
 */

(function () {
  const ICONS = {
    shuffle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  // Line emblems for cards without painted art (minor arcana). They print in vermilion on paper.
  const EMBLEMS = {
    major: `<svg viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="60" cy="70" r="44" stroke-dasharray="3 3" opacity="0.55"/>
      <circle cx="60" cy="70" r="34" opacity="0.85"/>
      <polygon points="60,26 70,56 100,56 75,74 84,104 60,86 36,104 45,74 20,56 50,56" fill="currentColor" fill-opacity="0.1" stroke-width="1.6"/>
      <circle cx="60" cy="70" r="10" fill="currentColor" fill-opacity="0.22"/>
      <path d="M60 12v8M60 120v8M12 70h8M100 70h8" opacity="0.7"/>
    </svg>`,
    wands: `<svg viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="60" cy="70" r="40" stroke-dasharray="2 4" opacity="0.45"/>
      <path d="M60 118V28" stroke-width="3.2"/>
      <path d="M60 28c-6-10 2-18 6-20 4 6 6 14 0 20Z" fill="currentColor" fill-opacity="0.25"/>
      <path d="M60 54c8-4 14-2 16 2-5 4-10 4-16 2Z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M60 80c-8-4-14-2-16 2 5 4 10 4 16 2Z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M44 40l-6-6M76 40l6-6M42 70h-8M86 70h-8" opacity="0.6"/>
    </svg>`,
    cups: `<svg viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="60" cy="70" r="40" stroke-dasharray="2 4" opacity="0.45"/>
      <path d="M36 42h48c0 26-10 42-24 46-14-4-24-20-24-46Z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M60 88v24M44 112h32M48 118h24" stroke-width="2"/>
      <path d="M44 32c4-5 10-5 16 0 6-5 12-5 16 0" opacity="0.7"/>
      <circle cx="60" cy="58" r="6" fill="currentColor" fill-opacity="0.25"/>
    </svg>`,
    swords: `<svg viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="60" cy="70" r="40" stroke-dasharray="2 4" opacity="0.45"/>
      <path d="M60 18l6 14v56H54V32l6-14Z" fill="currentColor" fill-opacity="0.15"/>
      <line x1="60" y1="22" x2="60" y2="88" opacity="0.7"/>
      <path d="M38 88h44c-2 6-8 8-22 8s-20-2-22-8Z" fill="currentColor" fill-opacity="0.22"/>
      <rect x="57" y="96" width="6" height="16" rx="1"/>
      <circle cx="60" cy="117" r="5" fill="currentColor" fill-opacity="0.25"/>
    </svg>`,
    pentacles: `<svg viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="60" cy="70" r="38" fill="currentColor" fill-opacity="0.08"/>
      <circle cx="60" cy="70" r="32"/>
      <polygon points="60,38 68,61 92,61 73,75 80,98 60,84 40,98 47,75 28,61 52,61" fill="currentColor" fill-opacity="0.18" stroke-width="1.5"/>
    </svg>`,
  };

  const ART_BASE = 'assets/tarot/rws';
  const DECK_ID = 'rws_standard';
  const FLIP_MS = 460; // keep in step with .tarot-card-inner in tab-tarot.css
  const FLIP_STAGGER_MS = 120;

  const SUIT_NAMES = {
    wands: ['權杖', 'Wands'],
    cups: ['聖杯', 'Cups'],
    swords: ['寶劍', 'Swords'],
    pentacles: ['錢幣', 'Pentacles'],
  };

  const CODEX_FILTERS = [
    { id: 'all', zh: '全部', en: 'All', count: 78 },
    { id: 'major', zh: '大阿爾克那', en: 'Major Arcana', count: 22 },
    { id: 'wands', zh: '權杖', en: 'Wands', count: 14 },
    { id: 'cups', zh: '聖杯', en: 'Cups', count: 14 },
    { id: 'swords', zh: '寶劍', en: 'Swords', count: 14 },
    { id: 'pentacles', zh: '錢幣', en: 'Pentacles', count: 14 },
  ];

  const isEn = () => (localStorage.getItem('zuto_lang') || 'zh-TW') === 'en';
  const L = (zh, en) => (isEn() ? en : zh);
  const tr = (key, fallback, vars) => {
    const val = typeof t === 'function' ? t(key, vars) : '';
    return (val && val !== key) ? val : fallback;
  };
  const media = (q) => Boolean(window.matchMedia && window.matchMedia(q).matches);
  const isWide = () => media('(min-width: 960px)');
  const prefersReduced = () => media('(prefers-reduced-motion: reduce)');
  const flipSettleMs = () => (prefersReduced() ? 160 : FLIP_MS + 20);

  const hasPaintedArt = (card) => /^major\.\d{2}_/.test(String(card?.cardId || ''));
  const cardName = (card) => (isEn() ? card.nameEn : card.nameZh);
  // Minor-arcana rank on the card face: court ranks and the ace print in Chinese in zh mode.
  const ZH_RANK = { A: '王牌', Page: '侍者', Knight: '騎士', Queen: '王后', King: '國王' };
  const cardRank = (card) => {
    const raw = String(card.roman ?? card.number ?? '');
    return !isEn() && card.arcana !== 'major' && ZH_RANK[raw] ? ZH_RANK[raw] : raw;
  };
  const cardAltName = (card) => (isEn() ? card.nameZh : card.nameEn);
  const dirText = (isRev) => (isRev ? tr('fortune.tarot_reversed', '逆位') : tr('fortune.tarot_upright', '正位'));
  const kindText = (card) => {
    if (card.arcana === 'major') return L('大阿爾克那', 'Major Arcana');
    const suit = SUIT_NAMES[card.suit];
    return suit ? L(suit[0], suit[1]) : L('小阿爾克那', 'Minor Arcana');
  };

  // "現況 (Present)" -> "現況"; English names stay whole.
  const shortPos = (pos) => (isEn() ? String(pos?.nameEn || '') : String(pos?.nameZh || '').replace(/\s*[（(].*$/, ''));

  // "時間之流 (現況 · 阻礙 · 建議)" -> main "時間之流"
  const spreadMain = (sp) => {
    const name = String((isEn() ? sp?.nameEn : sp?.nameZh) || '');
    return name.replace(/\s*[（(].*$/, '') || name;
  };

  /* ---------- Card art: painted RWS plates, or a line emblem in vermilion ---------- */
  function emblemFor(card) {
    if (!card || card.arcana === 'major') return EMBLEMS.major;
    return EMBLEMS[card.suit] || EMBLEMS.major;
  }

  function drawnArt(card, { reversed = false, bare = false } = {}) {
    return h(`span.tarot-art.is-drawn${reversed ? '.is-reversed' : ''}${bare ? '.is-bare' : ''}`, [
      bare ? null : h('span.tarot-art-num', cardRank(card)),
      h('span.tarot-art-emblem', { html: emblemFor(card) }),
      bare ? null : h('span.tarot-art-name', cardName(card)),
    ]);
  }

  function cardArt(card, { reversed = false, bare = false, eager = false, alt = '' } = {}) {
    if (!hasPaintedArt(card)) return drawnArt(card, { reversed, bare });
    const img = h('img.tarot-art-img', {
      src: `${ART_BASE}/${card.cardId}.jpg`,
      alt: alt || `${card.nameZh} ${card.nameEn}`,
      width: '536',
      height: '800',
      loading: eager ? 'eager' : 'lazy',
      decoding: 'async',
      draggable: 'false',
    });
    const wrap = h(`span.tarot-art${reversed ? '.is-reversed' : ''}`, [img]);
    img.addEventListener('error', () => wrap.replaceWith(drawnArt(card, { reversed, bare })), { once: true });
    return wrap;
  }

  function backArt() {
    const img = h('img.tarot-art-img', {
      src: `${ART_BASE}/back.jpg`,
      alt: L('塔羅牌背', 'Tarot card back'),
      width: '536',
      height: '800',
      loading: 'eager',
      decoding: 'async',
      draggable: 'false',
    });
    img.addEventListener('error', () => img.remove(), { once: true });
    return h('span.tarot-art.is-back', [img]);
  }

  // Wait briefly for the face image so a card never turns onto an empty plate.
  function readyFace(faceEl) {
    const img = faceEl.querySelector('img');
    if (!img || typeof img.decode !== 'function') return Promise.resolve();
    return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 260))]);
  }

  function rowEl(label, value) {
    return h('div.tarot-row', [h('dt', label), h('dd', value)]);
  }

  function keywordList(words, isRev) {
    return h(`ul.tarot-kws${isRev ? '.is-rev' : '.is-up'}`, words.map((w) => h('li', w)));
  }

  // Re-rendering replaces nodes; carry keyboard focus over by a stable data-fk key.
  function keepFocus(scope, build) {
    const active = document.activeElement;
    const key = active && scope && scope.contains(active) ? active.getAttribute('data-fk') : null;
    build();
    if (!key || !scope) return;
    const next = scope.querySelector(`[data-fk="${String(key).replace(/"/g, '\\"')}"]`);
    if (next && !next.disabled) next.focus({ preventScroll: true });
  }

  function createFortuneTarotView() {
    let subView = 'reading'; // 'reading' | 'codex'
    let spreads = [];
    let selectedSpreadId = 'three_cards';
    let selectedTopic = 'general';
    let allowReversed = true;
    let questionText = '';
    let isShuffling = false;
    let currentReading = null; // reading object from the API
    let activeSlotIdx = 0;
    let focusFirstSlot = false;
    const pendingFlips = new Set();
    let revealingAll = false;

    // Codex state
    let allCards = [];
    let codexLoaded = false;
    let codexFailed = false;
    let codexFilter = 'all'; // all | major | wands | cups | swords | pentacles
    let codexQuery = '';
    let codexSelectedId = null;
    const detailCache = new Map(); // cardId -> full card | 'error'
    const detailRequests = new Map();

    let rootContainer = null;
    let detailWrapEl = null;
    let actionBarEl = null;
    let codexAsideEl = null;
    let dialogEl = null;

    const loadSpreadsIfNeeded = async () => {
      if (spreads.length > 0) return;
      try {
        const res = await api.get('/api/fortune/tarot/spreads');
        if (res.ok && Array.isArray(res.spreads)) spreads = res.spreads;
      } catch {}
    };

    const loadCodexIfNeeded = async () => {
      if (codexLoaded) return;
      try {
        const res = await api.get(`/api/fortune/tarot/decks/${DECK_ID}/cards`);
        if (res.ok && Array.isArray(res.cards)) {
          allCards = res.cards;
          codexLoaded = true;
          codexFailed = false;
        }
      } catch {
        codexFailed = true;
      }
    };

    const ensureCardDetail = (cardId) => {
      if (detailCache.has(cardId)) return Promise.resolve(detailCache.get(cardId));
      if (detailRequests.has(cardId)) return detailRequests.get(cardId);
      const req = api.get(`/api/fortune/tarot/decks/${DECK_ID}/cards/${encodeURIComponent(cardId)}`)
        .then((res) => (res.ok && res.card ? res.card : 'error'))
        .catch(() => 'error')
        .then((full) => {
          detailCache.set(cardId, full);
          detailRequests.delete(cardId);
          return full;
        });
      detailRequests.set(cardId, req);
      return req;
    };

    const getSpreadOptions = () => (spreads.length > 0 ? spreads : [
      { spreadId: 'single', nameZh: '單張指引', nameEn: 'Single Card Draw', cardCount: 1, positions: [] },
      { spreadId: 'three_cards', nameZh: '過去・現在・未來', nameEn: 'Past · Present · Future', cardCount: 3, positions: [] },
    ]);

    /* ---------- Shuffle, draw, reveal ---------- */
    const startShuffleAndReading = async (fromKeyboard = false) => {
      if (isShuffling) return;
      isShuffling = true;
      currentReading = null;
      rerender();
      revealStageOnPhone();

      const minDelay = new Promise((r) => setTimeout(r, 800));
      try {
        const [res] = await Promise.all([
          api.post('/api/fortune/tarot/readings', {
            deckId: DECK_ID,
            spreadId: selectedSpreadId,
            allowReversed,
            topic: selectedTopic,
            question: questionText.trim(),
          }),
          minDelay,
        ]);
        if (res.ok && res.reading) {
          currentReading = res.reading;
          activeSlotIdx = 0;
          focusFirstSlot = fromKeyboard;
        }
      } catch (err) {
        if (typeof toast === 'function') {
          toast(err.message || tr('fortune.tarot_create_failed', '洗牌失敗'), 'error');
        }
      } finally {
        isShuffling = false;
        rerender();
      }
    };

    // On phones the stage sits below the setup; bring it up so the shuffle is seen.
    const revealStageOnPhone = () => {
      if (isWide() || !rootContainer) return;
      const stage = rootContainer.querySelector('.tarot-stage');
      if (!stage) return;
      if (stage.getBoundingClientRect().top > window.innerHeight * 0.55) {
        stage.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' });
      }
    };

    const slotEl = (slotIndex) => (rootContainer
      ? rootContainer.querySelector(`.tarot-slot[data-slot="${slotIndex}"]`)
      : null);

    const sceneLabel = (slot) => {
      const pos = shortPos(slot.position) || L(`牌位 ${slot.slotIndex + 1}`, `Position ${slot.slotIndex + 1}`);
      const sep = L('：', ': ');
      if (!slot.isRevealed || !slot.card) return `${pos}${sep}${tr('fortune.tarot_tap_to_flip', '點擊翻牌')}`;
      return `${pos}${sep}${cardName(slot.card)}${L('，', ', ')}${dirText(Boolean(slot.isReversed))}`;
    };

    const fillFrontFace = (faceEl, slot) => {
      faceEl.innerHTML = '';
      const isRev = Boolean(slot.isReversed);
      faceEl.appendChild(cardArt(slot.card, {
        reversed: isRev,
        eager: true,
        alt: `${slot.card.nameZh} ${slot.card.nameEn}，${dirText(isRev)}`,
      }));
    };

    const captionNodes = (slot) => {
      if (!slot.isRevealed || !slot.card) {
        return [h('span.tarot-slot-hint', tr('fortune.tarot_tap_to_flip', '點擊翻牌'))];
      }
      const isRev = Boolean(slot.isReversed);
      return [
        h('b', cardName(slot.card)),
        h(`span.tarot-dir${isRev ? '.is-rev' : '.is-up'}`, dirText(isRev)),
      ];
    };

    // Turn one face-down plate in place. Returns false when the slot is not on screen.
    const turnSlot = async (slot) => {
      const el = slotEl(slot.slotIndex);
      const inner = el && el.querySelector('.tarot-card-inner');
      if (!inner) return false;
      if (inner.classList.contains('is-flipped')) return true;
      const front = inner.querySelector('.tarot-card-front');
      const cap = el.querySelector('.tarot-slot-cap');
      const scene = el.querySelector('.tarot-card-scene');
      fillFrontFace(front, slot);
      await readyFace(front);
      if (scene) scene.setAttribute('aria-label', sceneLabel(slot));
      requestAnimationFrame(() => inner.classList.add('is-flipped'));
      // The caption names the card as its face comes round, not before.
      setTimeout(() => {
        if (!cap) return;
        cap.innerHTML = '';
        captionNodes(slot).forEach((n) => cap.appendChild(n));
      }, prefersReduced() ? 0 : Math.round(FLIP_MS * 0.45));
      return true;
    };

    const flipSlot = async (slotIndex) => {
      if (!currentReading) return;
      const slot = currentReading.slots.find((s) => s.slotIndex === slotIndex);
      if (!slot) return;

      if (slot.isRevealed) {
        activeSlotIdx = slotIndex;
        renderInterpretationPanel();
        return;
      }
      if (pendingFlips.has(slotIndex) || revealingAll) return;
      pendingFlips.add(slotIndex);
      const readingId = currentReading.readingId;

      try {
        const res = await api.post(`/api/fortune/tarot/readings/${readingId}/reveal`, { slotIndex });
        if (!res.ok || !res.reading || !currentReading || currentReading.readingId !== readingId) return;
        currentReading = res.reading;
        activeSlotIdx = slotIndex;
        const revealed = currentReading.slots.find((s) => s.slotIndex === slotIndex);
        if (revealed && revealed.card && await turnSlot(revealed)) {
          setTimeout(updateReadingActionsAndDetail, flipSettleMs());
        } else {
          rerender();
        }
      } catch (err) {
        if (typeof toast === 'function') {
          toast(err.message || tr('fortune.tarot_reveal_failed', '翻牌失敗'), 'error');
        }
      } finally {
        pendingFlips.delete(slotIndex);
      }
    };

    const revealAllCards = async () => {
      if (!currentReading || revealingAll) return;
      revealingAll = true;
      const readingId = currentReading.readingId;
      const wasRevealed = new Set(currentReading.slots.filter((s) => s.isRevealed).map((s) => s.slotIndex));
      try {
        const res = await api.post(`/api/fortune/tarot/readings/${readingId}/reveal`, { revealAll: true });
        if (!res.ok || !res.reading || !currentReading || currentReading.readingId !== readingId) return;
        currentReading = res.reading;
        if (wasRevealed.size === 0) activeSlotIdx = 0;
        const toTurn = currentReading.slots.filter((s) => !wasRevealed.has(s.slotIndex) && s.card);
        const turned = await Promise.all(toTurn.map((slot, i) => new Promise((resolve) => {
          setTimeout(() => turnSlot(slot).then(resolve), i * FLIP_STAGGER_MS);
        })));
        if (turned.some((ok) => !ok)) {
          rerender();
          return;
        }
        setTimeout(updateReadingActionsAndDetail, flipSettleMs());
      } catch (err) {
        if (typeof toast === 'function') {
          toast(err.message || tr('fortune.tarot_reveal_failed', '翻牌失敗'), 'error');
        }
      } finally {
        revealingAll = false;
      }
    };

    const updateReadingActionsAndDetail = () => {
      if (actionBarEl && currentReading) {
        const allRevealed = currentReading.slots.every((s) => s.isRevealed);
        const revealAllBtn = actionBarEl.querySelector('.tarot-reveal-all-btn');
        if (revealAllBtn) revealAllBtn.hidden = allRevealed;
      }
      renderInterpretationPanel();
    };

    // The selected plate's position label prints filled vermilion, like the current hour.
    const syncSlotSelection = (targetIdx) => {
      if (!rootContainer || !currentReading) return;
      currentReading.slots.forEach((slot) => {
        const el = slotEl(slot.slotIndex);
        if (!el) return;
        const on = slot.isRevealed && slot.slotIndex === targetIdx;
        el.classList.toggle('is-active', on);
        const scene = el.querySelector('.tarot-card-scene');
        if (scene) {
          if (slot.isRevealed) scene.setAttribute('aria-pressed', String(on));
          else scene.removeAttribute('aria-pressed');
        }
      });
    };

    /* ---------- The reading sheet ---------- */
    const renderInterpretationPanel = () => {
      if (!detailWrapEl || !currentReading) return;
      keepFocus(detailWrapEl, () => buildInterpretation());
    };

    const buildInterpretation = () => {
      detailWrapEl.innerHTML = '';
      const en = isEn();
      const revealedSlots = currentReading.slots.filter((s) => s.isRevealed && s.card);
      if (revealedSlots.length === 0) {
        syncSlotSelection(-1);
        detailWrapEl.appendChild(h('p.tarot-hint', tr('fortune.tarot_click_card_to_flip', '點擊上方覆蓋的牌面即可翻牌查看正逆位與完整解析。')));
        return;
      }

      let targetSlot = revealedSlots.find((s) => s.slotIndex === activeSlotIdx);
      if (!targetSlot) {
        targetSlot = revealedSlots[0];
        activeSlotIdx = targetSlot.slotIndex;
      }
      syncSlotSelection(targetSlot.slotIndex);

      const card = targetSlot.card;
      const isRev = Boolean(targetSlot.isReversed);
      const interp = card.interpretation || {};
      const keywords = Array.isArray(card.keywords) ? card.keywords : [];
      const posName = en ? (targetSlot.position?.nameEn || '') : (targetSlot.position?.nameZh || '');
      const dir = dirText(isRev);

      const strip = revealedSlots.length > 1
        ? h('section.tarot-sheet-slots', { role: 'group', 'aria-label': L('切換牌位', 'Switch card') }, revealedSlots.map((s) => {
          const on = s.slotIndex === targetSlot.slotIndex;
          return h('button.tarot-sheet-slot', {
            type: 'button',
            'aria-pressed': String(on),
            'data-fk': `sheet-slot-${s.slotIndex}`,
            onclick: () => {
              activeSlotIdx = s.slotIndex;
              renderInterpretationPanel();
            },
          }, [
            h('small', shortPos(s.position) || L(`牌位 ${s.slotIndex + 1}`, `Position ${s.slotIndex + 1}`)),
            h('b', cardName(s.card)),
          ]);
        }))
        : null;

      const head = h('header.tarot-sheet-head', [
        h('div.tarot-sheet-id', [
          h('h3.tarot-sheet-name', [
            card.arcana === 'major' && card.roman != null ? h('span.tarot-roman', String(card.roman)) : null,
            cardName(card),
          ]),
          h('p.tarot-sheet-alt', [
            h('span', cardAltName(card)),
            h('span', [kindText(card), card.element].filter(Boolean).join(' · ')),
          ]),
        ]),
        h(`div.cf-seal.tarot-seal${isRev ? '.is-ink' : ''}${en ? '.is-latin' : ''}`, { role: 'img', 'aria-label': dir }, dir),
      ]);

      const ruled = h('section.tarot-sheet-ruled', [
        h('h4.cf-vh', h('span', L('牌義', 'Meaning'))),
        h('dl.tarot-rows', [
          posName ? rowEl(L('牌位', 'Position'), [
            h('b', posName),
            targetSlot.position?.focus ? h('small', targetSlot.position.focus) : null,
          ]) : null,
          keywords.length ? rowEl(L('關鍵', 'Keys'), keywordList(keywords, isRev)) : null,
          interp.summary ? rowEl(L('總結', 'Meaning'), h('p', interp.summary)) : null,
          interp.advice ? rowEl(L('建議', 'Advice'), h('p.is-strong', interp.advice)) : null,
        ]),
      ]);

      const asked = currentReading.topic;
      const topicCols = [
        interp.career ? { id: 'career', label: L('事業', 'Career'), text: interp.career } : null,
        interp.love ? { id: 'love', label: L('感情', 'Love'), text: interp.love } : null,
      ].filter(Boolean).sort((a, b) => (b.id === asked) - (a.id === asked));

      const topics = topicCols.length ? h(`section.tarot-topics.count-${topicCols.length}`, topicCols.map((col) => {
        const isAsked = col.id === asked;
        return h(`div.tarot-topic${isAsked ? '.is-asked' : ''}`, [
          h(`h4.cf-vh.tarot-vh${isAsked ? '.is-red' : ''}`, [
            h('span', col.label),
            isAsked ? h('span.sr-only', L('（你問的主題）', ' (your topic)')) : null,
          ]),
          h('p', col.text),
        ]);
      })) : null;

      const questions = Array.isArray(card.questions) && card.questions.length
        ? h('section.tarot-sheet-ask', [
          h('h4.cf-vh', h('span', L('自問', 'Reflect'))),
          h('ul.tarot-qs', card.questions.map((q) => h('li', q))),
        ])
        : null;

      detailWrapEl.appendChild(h('article.cf-sheet.tarot-sheet', {
        'aria-label': L(`${posName ? `${posName}・` : ''}${card.nameZh}牌義`, `${posName ? `${posName}: ` : ''}${card.nameEn} reading`),
      }, [strip, head, ruled, topics, questions]));
    };

    /* ---------- Reading sub-view ---------- */
    const buildAskPanel = () => {
      const topics = [
        { id: 'general', label: tr('fortune.tarot_topic_general', '綜合指引') },
        { id: 'career', label: tr('fortune.tarot_topic_career', '事業職涯') },
        { id: 'love', label: tr('fortune.tarot_topic_love', '感情人際') },
        { id: 'decision', label: tr('fortune.tarot_topic_decision', '抉擇方向') },
      ];
      const spreadOptions = getSpreadOptions();
      const current = spreadOptions.find((sp) => sp.spreadId === selectedSpreadId);
      const positions = (current?.positions || []).map((p) => shortPos(p)).filter(Boolean);

      const shuffleLabel = isShuffling
        ? tr('fortune.tarot_shuffling', '洗牌中...')
        : (currentReading ? tr('fortune.tarot_reshuffle', '重新洗牌') : tr('fortune.tarot_start_shuffle', '開始洗牌抽牌'));

      return h('section.tarot-ask', { 'aria-label': L('問卜設定', 'Reading setup') }, [
        h('div.tarot-ask-row', [
          h('span#tarot-lbl-spread.tarot-ask-label', tr('fortune.tarot_spread_label', '選擇牌陣')),
          h('div.tarot-chips', { role: 'group', 'aria-labelledby': 'tarot-lbl-spread' }, spreadOptions.map((sp) => {
            const on = selectedSpreadId === sp.spreadId;
            return h('button.tarot-chip', {
              type: 'button',
              'aria-pressed': String(on),
              disabled: isShuffling,
              'data-fk': `spread-${sp.spreadId}`,
              onclick: () => {
                if (on) return;
                selectedSpreadId = sp.spreadId;
                currentReading = null;
                rerender();
              },
            }, [
              h('span', spreadMain(sp)),
              h('small', L(`${sp.cardCount} 張`, `${sp.cardCount} card${sp.cardCount > 1 ? 's' : ''}`)),
            ]);
          })),
          positions.length ? h('p.tarot-ask-note', positions.join(' · ')) : null,
        ]),
        h('div.tarot-ask-row', [
          h('span#tarot-lbl-topic.tarot-ask-label', tr('fortune.tarot_topic_label', '占卜主題')),
          h('div.tarot-chips', { role: 'group', 'aria-labelledby': 'tarot-lbl-topic' }, topics.map((tp) => (
            h('button.tarot-chip', {
              type: 'button',
              'aria-pressed': String(selectedTopic === tp.id),
              disabled: isShuffling,
              'data-fk': `topic-${tp.id}`,
              onclick: () => {
                if (selectedTopic === tp.id) return;
                selectedTopic = tp.id;
                rerender();
              },
            }, tp.label)
          ))),
        ]),
        h('div.tarot-ask-row', [
          h('label.tarot-ask-label', { for: 'tarot-question' }, L('所問之事', 'Your question')),
          input({
            id: 'tarot-question',
            value: questionText,
            placeholder: L('選填・例如：近期換工作要注意什麼？', 'Optional, e.g. changing jobs soon?'),
            autocomplete: 'off',
            enterkeyhint: 'go',
            'data-fk': 'question',
            oninput: (e) => { questionText = e.target.value; },
            onkeydown: (e) => {
              if (e.key === 'Enter' && !e.isComposing) startShuffleAndReading(true);
            },
          }),
        ]),
        h('div.tarot-ask-row', [
          h('label.tarot-toggle', [
            h('input', {
              type: 'checkbox',
              checked: allowReversed,
              'data-fk': 'reversed',
              onchange: (e) => { allowReversed = e.target.checked; },
            }),
            h('span', tr('fortune.tarot_allow_reversed', '啟用逆位牌（正逆位各半）')),
          ]),
        ]),
        h('div.tarot-ask-go', [
          h('button.btn.btn-primary.btn-lg.tarot-shuffle-btn', {
            type: 'button',
            disabled: isShuffling,
            'aria-busy': isShuffling ? 'true' : null,
            'data-fk': 'shuffle',
            onclick: (e) => startShuffleAndReading(e.detail === 0),
          }, [
            h('span.btn-icon', { html: ICONS.shuffle }),
            h('span', shuffleLabel),
          ]),
        ]),
      ]);
    };

    const buildDeck = (shuffling) => h(`div.tarot-deck${shuffling ? '.is-shuffling' : ''}`, {
      role: 'img',
      'aria-label': L('一副 78 張塔羅牌', 'A 78-card tarot deck'),
    }, [0, 1, 2].map(() => h('span.tarot-plate', [backArt()])));

    // What the chosen spread will lay out: each position and what it speaks to.
    const buildSpreadGuide = () => {
      const sp = getSpreadOptions().find((s) => s.spreadId === selectedSpreadId);
      const positions = sp?.positions || [];
      if (!sp || positions.length === 0) return null;
      return h('section.tarot-spread-guide', { 'aria-label': spreadMain(sp) }, [
        h('h4.cf-vh', h('span', spreadMain(sp))),
        h('div.tarot-spread-guide-body', [
          isEn() ? null : (sp.description ? h('p.tarot-spread-desc', sp.description) : null),
          h('dl.tarot-rows', positions.map((pos) => rowEl(shortPos(pos), pos.focus ? h('small', pos.focus) : null))),
        ]),
      ]);
    };

    const buildSlot = (slot) => {
      const pos = shortPos(slot.position) || L(`牌位 ${slot.slotIndex + 1}`, `Position ${slot.slotIndex + 1}`);
      const front = h('span.tarot-card-face.tarot-card-front');
      if (slot.isRevealed && slot.card) fillFrontFace(front, slot);
      const inner = h(`span.tarot-card-inner${slot.isRevealed ? '.is-flipped' : ''}`, [
        h('span.tarot-card-face.tarot-card-back', [backArt()]),
        front,
      ]);
      return h('div.tarot-slot', { role: 'listitem', 'data-slot': String(slot.slotIndex) }, [
        h('p.tarot-slot-pos', pos),
        h('button.tarot-card-scene', {
          type: 'button',
          'aria-label': sceneLabel(slot),
          'data-fk': `slot-${slot.slotIndex}`,
          onclick: () => flipSlot(slot.slotIndex),
        }, [inner]),
        h('div.tarot-slot-cap', captionNodes(slot)),
      ]);
    };

    const buildStage = () => {
      const stage = h('section.tarot-stage', {
        'aria-label': L('牌陣', 'Spread'),
        'aria-busy': isShuffling ? 'true' : null,
      });

      if (isShuffling || !currentReading) {
        stage.appendChild(h('div.tarot-stage-idle', [
          buildDeck(isShuffling),
          h('div.tarot-idle-copy', [
            isShuffling
              ? h('p.tarot-stage-note', { role: 'status' }, tr('fortune.tarot_shuffling_caption', '正在靜心洗牌並建立隨機抽牌序列...'))
              : h('p.tarot-stage-note', tr('fortune.tarot_idle_guide', '選擇牌陣與主題，在心中默念你的問題後點擊「開始洗牌抽牌」。')),
            buildSpreadGuide(),
          ]),
        ]));
        return stage;
      }

      const allRevealed = currentReading.slots.every((s) => s.isRevealed);
      const question = currentReading.question;
      actionBarEl = h('div.tarot-stage-head', [
        h('p.tarot-stage-title', [
          h('b', spreadMain(currentReading.spread)),
          question ? h('span', L(`「${question}」`, `“${question}”`)) : null,
        ]),
        h('div.tarot-stage-btns', [
          h('button.btn.btn-sm.btn-secondary.tarot-reveal-all-btn', {
            type: 'button',
            hidden: allRevealed,
            'data-fk': 'reveal-all',
            onclick: () => revealAllCards(),
          }, [
            h('span.btn-icon', { html: ICONS.eye }),
            h('span', tr('fortune.tarot_reveal_all', '一鍵全部翻牌')),
          ]),
          h('button.btn.btn-sm.btn-ghost.tarot-stage-reshuffle', {
            type: 'button',
            'data-fk': 'reshuffle',
            onclick: (e) => startShuffleAndReading(e.detail === 0),
          }, [
            h('span.btn-icon', { html: ICONS.refresh }),
            h('span', tr('fortune.tarot_reshuffle', '重新洗牌')),
          ]),
        ]),
      ]);
      stage.appendChild(actionBarEl);

      stage.appendChild(h(`div.tarot-spread.count-${currentReading.slots.length}`, { role: 'list' },
        currentReading.slots.map((slot) => buildSlot(slot))));

      detailWrapEl = h('div.tarot-detail-wrap');
      stage.appendChild(detailWrapEl);
      return stage;
    };

    const renderReadingSubView = (wrap) => {
      wrap.appendChild(h('div.tarot-reading', [buildAskPanel(), buildStage()]));
    };

    /* ---------- Codex ---------- */
    const filteredCards = () => {
      let list = allCards;
      if (codexFilter === 'major') list = list.filter((c) => c.arcana === 'major');
      else if (codexFilter !== 'all') list = list.filter((c) => c.suit === codexFilter);
      const q = codexQuery.trim().toLowerCase();
      if (q) {
        list = list.filter((c) => {
          const kws = [...(c.keywords?.upright || []), ...(c.keywords?.reversed || [])].join(' ').toLowerCase();
          return (c.nameZh || '').toLowerCase().includes(q)
            || (c.nameEn || '').toLowerCase().includes(q)
            || String(c.roman ?? '').toLowerCase() === q
            || String(c.number ?? '') === q
            || kws.includes(q);
        });
      }
      return list;
    };

    const buildCardDetail = (card, full, { framed = false } = {}) => {
      const en = isEn();
      const data = full && full !== 'error' ? full : null;
      const dirCol = (dir) => {
        const isUp = dir === 'upright';
        const meaning = data ? data[dir] : null;
        const words = card.keywords?.[dir] || [];
        return h(`section.tarot-dir-col${isUp ? '.is-up' : '.is-rev'}`, [
          h(`h4.cf-vh.tarot-vh${isUp ? '.is-red' : '.is-ink'}`, h('span', dirText(!isUp))),
          h('dl.tarot-rows', [
            words.length ? rowEl(L('關鍵', 'Keys'), keywordList(words, !isUp)) : null,
            meaning?.summary ? rowEl(L('牌義', 'Meaning'), h('p', meaning.summary)) : null,
            meaning?.career ? rowEl(L('事業', 'Career'), h('p', meaning.career)) : null,
            meaning?.love ? rowEl(L('感情', 'Love'), h('p', meaning.love)) : null,
            meaning?.advice ? rowEl(L('建議', 'Advice'), h('p.is-strong', meaning.advice)) : null,
          ]),
        ]);
      };

      const status = !data
        ? h('p.tarot-detail-status', { role: 'status' }, full === 'error'
          ? L('牌義暫時載入失敗，請稍後再開一次。', 'Could not load the meanings. Please open the card again.')
          : L('牌義載入中…', 'Loading meanings…'))
        : null;

      return h(`article.tarot-detail${framed ? '.cf-sheet' : ''}`, {
        'aria-label': `${card.nameZh} ${card.nameEn}`,
      }, [
        h('header.tarot-detail-head', [
          h('span.tarot-plate', [cardArt(card, { bare: true, eager: true })]),
          h('div.tarot-detail-id', [
            h('h3.tarot-detail-name', [
              card.arcana === 'major' && card.roman != null ? h('span.tarot-roman', String(card.roman)) : null,
              en ? card.nameEn : card.nameZh,
            ]),
            h('p.tarot-detail-alt', en ? card.nameZh : card.nameEn),
            h('p.tarot-detail-meta', [kindText(card), card.element].filter(Boolean).join(' · ')),
          ]),
        ]),
        dirCol('upright'),
        dirCol('reversed'),
        status,
        data && Array.isArray(data.questions) && data.questions.length
          ? h('section.tarot-sheet-ask', [
            h('h4.cf-vh', h('span', L('自問', 'Reflect'))),
            h('ul.tarot-qs', data.questions.map((q) => h('li', q))),
          ])
          : null,
      ]);
    };

    const renderCodexAside = () => {
      if (!codexAsideEl) return;
      codexAsideEl.innerHTML = '';
      const card = allCards.find((c) => c.cardId === codexSelectedId);
      if (!card) {
        codexAsideEl.appendChild(h('p.tarot-hint', L('點選任一張牌，查看正位與逆位牌義。', 'Pick any card to read its upright and reversed meanings.')));
        return;
      }
      codexAsideEl.appendChild(buildCardDetail(card, detailCache.get(card.cardId), { framed: true }));
    };

    const syncCodexSelection = () => {
      if (!rootContainer) return;
      const wide = isWide();
      rootContainer.querySelectorAll('.tarot-codex-cell').forEach((cell) => {
        if (wide && cell.dataset.card === codexSelectedId) cell.setAttribute('aria-current', 'true');
        else cell.removeAttribute('aria-current');
      });
    };

    const fillDialog = (card) => {
      if (!dialogEl) return;
      const body = dialogEl.querySelector('.tarot-dialog-body');
      if (!body) return;
      body.innerHTML = '';
      body.appendChild(buildCardDetail(card, detailCache.get(card.cardId)));
    };

    const openCardDialog = (card) => {
      if (dialogEl) dialogEl.close();
      const dlg = h('dialog.tarot-dialog', { 'aria-label': `${card.nameZh} ${card.nameEn}` }, [
        h('div.tarot-dialog-bar', [
          h('button.btn.btn-ghost.btn-sm.tarot-dialog-close', {
            type: 'button',
            onclick: () => dlg.close(),
          }, [
            h('span.btn-icon', { html: ICONS.close }),
            h('span', L('關閉', 'Close')),
          ]),
        ]),
        // Opening lands focus on the reading itself, not on the close button.
        h('div.tarot-dialog-body', { tabindex: '-1', autofocus: true }),
      ]);
      dlg.addEventListener('close', () => {
        dlg.remove();
        if (dialogEl === dlg) dialogEl = null;
      });
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
      document.body.appendChild(dlg);
      dialogEl = dlg;
      fillDialog(card);
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    };

    const openCodexCard = (card) => {
      codexSelectedId = card.cardId;
      const wide = isWide();
      if (wide) {
        renderCodexAside();
        syncCodexSelection();
        if (codexAsideEl) codexAsideEl.scrollTop = 0;
      } else {
        openCardDialog(card);
      }
      if (detailCache.has(card.cardId)) return;
      ensureCardDetail(card.cardId).then(() => {
        if (codexSelectedId !== card.cardId) return;
        if (wide) renderCodexAside();
        else fillDialog(card);
      });
    };

    const renderCodexGrid = (gridEl) => {
      gridEl.innerHTML = '';
      if (!codexLoaded) {
        gridEl.appendChild(h('p.tarot-codex-empty', codexFailed
          ? L('牌庫載入失敗，請重新整理頁面。', 'Could not load the deck. Please reload the page.')
          : L('載入 78 張牌庫中…', 'Loading the 78 cards…')));
        return;
      }
      const list = filteredCards();
      if (list.length === 0) {
        gridEl.appendChild(h('p.tarot-codex-empty', tr('fortune.tarot_no_match', '沒有符合條件的塔羅牌。')));
        return;
      }
      const wide = isWide();
      list.forEach((card) => {
        const num = card.arcana === 'major' ? String(card.roman ?? card.number ?? '') : '';
        gridEl.appendChild(h('button.tarot-codex-cell', {
          type: 'button',
          'data-card': card.cardId,
          'data-fk': `card-${card.cardId}`,
          'aria-label': `${num ? `${num} ` : ''}${card.nameZh} ${card.nameEn}`,
          'aria-current': wide && card.cardId === codexSelectedId ? 'true' : null,
          onclick: () => openCodexCard(card),
        }, [
          h('span.tarot-plate', [cardArt(card, { bare: true })]),
          h('span.tarot-codex-name', [num ? h('span.tarot-codex-num', num) : null, cardName(card)]),
          h('span.tarot-codex-sub', cardAltName(card)),
        ]));
      });
    };

    const renderCodexSubView = (wrap) => {
      const gridEl = h('div.tarot-codex-grid', { role: 'group', 'aria-label': L('塔羅牌庫', 'Tarot cards') });
      codexAsideEl = h('aside.tarot-codex-aside', { 'aria-label': L('牌義詳解', 'Card detail') });

      const toolbar = h('div.tarot-codex-bar', [
        h('div.tarot-chips', { role: 'group', 'aria-label': L('篩選牌組', 'Filter cards') }, CODEX_FILTERS.map((f) => (
          h('button.tarot-chip', {
            type: 'button',
            'aria-pressed': String(codexFilter === f.id),
            'data-fk': `filter-${f.id}`,
            onclick: () => {
              if (codexFilter === f.id) return;
              codexFilter = f.id;
              rerender();
            },
          }, [h('span', L(f.zh, f.en)), h('small', String(f.count))])
        ))),
        h('label.tarot-search', [
          h('span.sr-only', L('搜尋牌庫', 'Search cards')),
          h('span.tarot-search-icon', { html: ICONS.search }),
          input({
            type: 'search',
            value: codexQuery,
            placeholder: tr('fortune.tarot_search_placeholder', '搜尋牌名、關鍵字或編號...'),
            autocomplete: 'off',
            'data-fk': 'codex-search',
            oninput: (e) => {
              codexQuery = e.target.value;
              renderCodexGrid(gridEl);
            },
          }),
        ]),
      ]);

      wrap.appendChild(h('div.tarot-codex', [
        toolbar,
        h('div.tarot-codex-body', [gridEl, codexAsideEl]),
      ]));

      // Wide screens keep a card open beside the grid; start with the first one.
      const pickDefault = () => {
        if (isWide() && !codexSelectedId && allCards.length) {
          codexSelectedId = (filteredCards()[0] || allCards[0]).cardId;
        }
      };
      const fillAside = () => {
        if (!isWide() || !codexAsideEl) return;
        renderCodexAside();
        const id = codexSelectedId;
        if (id && !detailCache.has(id)) {
          ensureCardDetail(id).then(() => {
            if (codexSelectedId === id && codexAsideEl && codexAsideEl.isConnected) renderCodexAside();
          });
        }
      };

      pickDefault();
      renderCodexGrid(gridEl);
      fillAside();
      if (!codexLoaded) {
        loadCodexIfNeeded().then(() => {
          if (!gridEl.isConnected) return;
          pickDefault();
          renderCodexGrid(gridEl);
          fillAside();
        });
      }
    };

    /* ---------- Shell ---------- */
    const rerender = () => {
      if (!rootContainer) return;
      keepFocus(rootContainer, () => {
        rootContainer.innerHTML = '';
        codexAsideEl = null;
        detailWrapEl = null;
        actionBarEl = null;

        const subNav = h('div.tarot-subnav', { role: 'group', 'aria-label': L('塔羅功能', 'Tarot views') }, [
          ['reading', tr('fortune.tarot_subtab_reading', '抽牌占卜')],
          ['codex', tr('fortune.tarot_subtab_codex', '78 張牌庫圖鑑')],
        ].map(([id, label]) => h('button.tarot-subnav-btn', {
          type: 'button',
          'aria-pressed': String(subView === id),
          'data-fk': `view-${id}`,
          onclick: () => {
            if (subView === id) return;
            subView = id;
            rerender();
          },
        }, label)));

        const wrap = h('div.tarot-view-root', [subNav]);
        if (subView === 'reading') renderReadingSubView(wrap);
        else renderCodexSubView(wrap);
        rootContainer.appendChild(wrap);
        renderInterpretationPanel();
      });

      if (focusFirstSlot) {
        focusFirstSlot = false;
        const first = rootContainer.querySelector('.tarot-card-scene');
        if (first) first.focus({ preventScroll: true });
      }
    };

    return {
      render(container) {
        rootContainer = container;
        loadSpreadsIfNeeded().then(() => rerender());
        rerender();
      },
    };
  }

  window.createFortuneTarotView = createFortuneTarotView;
})();
