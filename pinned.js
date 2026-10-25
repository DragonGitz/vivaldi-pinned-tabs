// Vivaldi mod: Edge-style pinned area for a vertical (left/right) tab bar.
// - Pinned tabs become a compact favicon grid fixed at the top; regular tabs scroll beneath.
// - Pinned tab stacks become tiles with a count badge. Clicking one drops down a list below the grid
//   with full tab rows (favicon + title). It collapses when you activate a tab outside that stack,
//   click the tile again, click the chevron, or press Esc.
// Works with workspaces (reads what Vivaldi shows) and Two-Level / Accordion / Compact stacking.
// It never moves Vivaldi's own elements: it hides the real pinned rows and draws a proxy grid
// that forwards clicks to the real tabs through the extension tabs API.
(() => {
  // ---------------- CONFIG ----------------
  const CONFIG = {
    TILE: 34,              // tile size in px (Edge is ~36)
    ICON: 16,              // favicon size in px
    GAP: 4,                // gap between tiles
    DROP_FRACTION: 0.45,   // max drop-down height as a fraction of the tab bar
    SHOW_UNPINNED_STACKS: false, // true = also put regular (unpinned) stacks in the grid
    MIDDLE_CLICK_CLOSES: true,
  };
  // ----------------------------------------

  const ID = 'vpm';
  const T = CONFIG.TILE;
  const DROP_BOTTOM = CONFIG.GAP; // shared: same space above the separator as the tile rows get when collapsed
  const dropFull = () => dropIn.offsetHeight + DROP_BOTTOM;
  const FILL = 'color-mix(in srgb,var(--vpmFg,#888) 7%,transparent)';
  const css = `
  #${ID}-grid{position:fixed;z-index:9;display:none;flex-direction:column;box-sizing:border-box;
    background:var(--vpmBg,transparent);color:var(--vpmFg,var(--colorFg,inherit));
    border-bottom:1px solid color-mix(in srgb,var(--vpmFg,#888) 14%,transparent);overflow:hidden}
  #${ID}-grid.on{display:flex}
  #${ID}-grid .vpm-icons{display:flex;flex-wrap:wrap;gap:${CONFIG.GAP}px;padding:${CONFIG.GAP}px;flex:0 0 auto}
  #${ID}-grid .vpm-tile{position:relative;flex:0 0 ${T}px;width:${T}px;height:${T}px;display:flex;align-items:center;justify-content:center;
    border-radius:6px;cursor:default;background:${FILL};transition:background .12s}
  #${ID}-grid .vpm-tile:hover{background:color-mix(in srgb,var(--vpmFg,#888) 15%,transparent)}
  #${ID}-grid .vpm-tile.active{background:var(--vpmActiveBg,color-mix(in srgb,var(--vpmFg,#888) 22%,transparent))}
  #${ID}-grid .vpm-tile.open{box-shadow:inset 0 0 0 2px var(--colorAccentBg,#888);background:color-mix(in srgb,var(--colorAccentBg,#888) 22%,transparent)}
  #${ID}-grid .vpm-tile img,#${ID}-grid .vpm-tile svg{width:${CONFIG.ICON}px;height:${CONFIG.ICON}px}
  #${ID}-grid .vpm-badge{position:absolute;right:1px;bottom:1px;min-width:12px;height:12px;padding:0 2px;font:600 9px/12px sans-serif;
    text-align:center;border-radius:6px;background:var(--colorAccentBg,#555);color:var(--colorAccentFg,#fff)}
  #${ID}-grid .vpm-drop{flex:0 0 auto;height:0;overflow:hidden;transition:height .2s ease}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add{container-type:normal;contain:none;min-width:0;display:flex;flex:0 0 auto;padding:0;margin:0;background:none}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add .button-toolbar{display:flex;flex:1 1 auto;align-items:center}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add button{display:flex;flex:1 1 100%;align-items:center;justify-content:center;height:30px;min-width:30px;padding:0;border:0;border-radius:var(--vpmNtR,8px);background:transparent;color:var(--vpmNtFg,inherit);fill:currentcolor}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add button:hover{background:var(--vpmNtHover)}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add button:active{background:var(--vpmNtActive)}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add .button-icon,:is(#${ID}-grid,.${ID}-inl) .vpm-add svg{width:28px;height:28px;display:flex}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add:active svg{transform:scale(.9)}
  html.${ID}-nosub #tabs-subcontainer{display:none!important}
  html.${ID}-nosub #tabs-tabbar-container > #tabs-container{flex:1 1 auto!important;width:auto!important;max-width:none!important}
  #${ID}-grid .vpm-drop-in{display:flex;flex-direction:column;margin:0 ${CONFIG.GAP}px ${DROP_BOTTOM}px;padding:2px 3px 3px;background:${FILL};border-radius:6px}
  #${ID}-grid .vpm-head{display:flex;align-items:center;gap:6px;height:24px;padding:0 6px;font:600 11px/24px var(--vpmFont,system-ui);opacity:.85;cursor:default;
    }
  #${ID}-grid .vpm-head .vpm-name{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  #${ID}-grid .vpm-chev{width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:4px}
  #${ID}-grid .vpm-chev:hover{background:color-mix(in srgb,var(--vpmFg,#888) 15%,transparent)}
  #${ID}-grid .vpm-list{overflow-y:auto;overscroll-behavior:contain}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row{display:flex;align-items:center;gap:8px;height:var(--vpmRowH,30px);padding:0 8px;border-radius:var(--vpmRowR,6px);
    font:var(--vpmFont,13px system-ui);cursor:default;position:relative}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row:hover{background:color-mix(in srgb,var(--vpmFg,#888) 12%,transparent)}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row.active{background:var(--vpmActiveBg,color-mix(in srgb,var(--vpmFg,#888) 22%,transparent));color:var(--vpmActiveFg,inherit)}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row img{width:16px;height:16px;flex:0 0 16px}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row .vpm-t{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  :is(#${ID}-grid,.${ID}-inl) .vpm-x{display:none;width:18px;height:18px;border-radius:4px;align-items:center;justify-content:center;font:14px/1 sans-serif;opacity:.7}
  :is(#${ID}-grid,.${ID}-inl) .vpm-row:hover .vpm-x{display:flex}
  :is(#${ID}-grid,.${ID}-inl) .vpm-x:hover{background:color-mix(in srgb,var(--vpmFg,#888) 20%,transparent);opacity:1}
  @media (prefers-reduced-motion:reduce){#${ID}-grid .vpm-drop{transition:none}}
  /* hide the real pinned rows + their separator in the main strip, shift the rest down under the grid */
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip span:has(> .tab-position.is-pinned),
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip span:has(> .tab-position.is-pinned) + .separator,
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip span.vpm-hidden { display:none !important }
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip .tab-position:not(.is-pinned),
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip > .separator:not(span:has(> .is-pinned) + .separator){
    transform:translateX(var(--PositionX)) translateY(calc(var(--PositionY) + var(--vpmShift,0px))) !important }
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip .tab-position.vpm-below:not(.is-pinned){
    transform:translateX(var(--PositionX)) translateY(calc(var(--PositionY) + var(--vpmShift,0px) + var(--vpmInl,0px))) !important }
  .${ID}-inl{position:absolute;left:0;z-index:2;box-sizing:border-box;padding:0 2px 2px 14px;display:flex;flex-direction:column;color:var(--vpmFg,inherit);font:var(--vpmFontSize,13px) var(--vpmFont,system-ui)}
  .${ID}-inl .vpm-row{margin:0 0 var(--vpmRowGap,0px)}
  html.${ID}-on #tabs-container .tab-strip .tab-position.is-substack .tab-header .close{display:none !important}
  html.${ID}-on #tabs-container .tab-strip .tab-position.vpm-expanded .stack-counter{visibility:hidden}
  .${ID}-inl.vpm-sadd{position:absolute;padding:0;width:26px;z-index:3}
  .vpm-sadd .button-toolbar{display:flex}
  .vpm-sadd button{display:flex;align-items:center;justify-content:center;width:26px;height:26px;min-width:26px;padding:0;border:0 !important;outline:0;border-radius:var(--vpmNtR,8px);background:transparent;color:var(--vpmNtFg,inherit);fill:currentcolor}
  .vpm-sadd button:hover{background:var(--vpmNtHover)}
  .vpm-sadd button:active{background:var(--vpmNtActive)}
  .vpm-sadd .button-icon,.vpm-sadd svg{width:26px;height:26px;display:flex}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add.vpm-sadd button,#${ID}-grid .vpm-hadd button{height:26px;min-width:26px;width:26px;flex:0 0 26px}
  :is(#${ID}-grid,.${ID}-inl) .vpm-add.vpm-sadd svg,#${ID}-grid .vpm-hadd svg,:is(#${ID}-grid,.${ID}-inl) .vpm-add.vpm-sadd .button-icon,#${ID}-grid .vpm-hadd .button-icon{width:24px;height:24px}
  #${ID}-grid .vpm-hadd{flex:0 0 auto;opacity:1}
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip::-webkit-scrollbar-track{margin-top:var(--vpmTrack,0px)}
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip::-webkit-scrollbar-button:vertical:decrement{display:none}
  html.${ID}-on #tabs-container:is(.left,.right) .tab-strip::after{content:'';position:absolute;left:0;width:1px;height:1px;top:var(--vpmEnd,0px)}
  `;
  const style = Object.assign(document.createElement('style'), { id: ID + '-style', textContent: css });
  const grid = Object.assign(document.createElement('div'), { id: ID + '-grid' });
  grid.setAttribute('role', 'toolbar'); grid.setAttribute('aria-label', 'Pinned tabs');
  const icons = Object.assign(document.createElement('div'), { className: 'vpm-icons' });
  const drop = Object.assign(document.createElement('div'), { className: 'vpm-drop' });
  const dropIn = Object.assign(document.createElement('div'), { className: 'vpm-drop-in' });
  drop.append(dropIn); grid.append(icons, drop);
  let inlStack = null, inlAdd = null, inlAddGid = null; const inl = Object.assign(document.createElement('div'), { className: ID + '-inl' });
  let openStack = null, tabsCache = [], lastSig = '', lastActiveId = null, dropMax = 300;

  const mainStrip = () => document.querySelector('#tabs-container:is(.left,.right) .tab-strip');
  const tabIdOf = w => { const m = /^tab-(\d+)$/.exec(w?.dataset.id || ''); return m ? +m[1] : null; };
  const groupOf = t => { try { return JSON.parse(t.vivExtData || '{}').group || null; } catch { return null; } };
  const favFor = url => `chrome://favicon2/?size=32&pageUrl=${encodeURIComponent(url)}&allowGoogleServerFallback=0`;
  const iconEl = (src, alt) => { const i = new Image(); i.src = src; i.alt = ''; i.title = alt || ''; i.draggable = false; return i; };
  const members = gid => tabsCache.filter(t => groupOf(t) === gid);
  const stackTitle = (gid, fallback) => members(gid).map(t => { try { return JSON.parse(t.vivExtData).fixedGroupTitle; } catch {} }).find(Boolean) || fallback || 'Stack';

  // animate the drop-down height; keep the regular tabs' shift in sync every frame while it moves
  let animUntil = 0;
  function animate() { animUntil = performance.now() + 260; const loop = () => { render(false, true); if (performance.now() < animUntil) requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  function setOpen(gid) {
    if (openStack === gid) return;
    const was = openStack; openStack = gid;
    if (was && gid) { render(true); animate(); return; }
    if (gid) { render(true); drop.style.height = '0px'; void drop.offsetHeight; drop.style.height = Math.min(dropFull(), dropMax) + 'px'; }
    else { drop.style.height = drop.offsetHeight + 'px'; void drop.offsetHeight; drop.style.height = '0px'; setTimeout(() => { if (!openStack) dropIn.replaceChildren(); }, 260); render(true); }
    animate();
  }

  async function refreshTabs() {
    try { tabsCache = await chrome.tabs.query({ windowId: window.vivaldiWindowId }); } catch { tabsCache = []; }
    const act = tabsCache.find(t => t.active);
    if (act && act.id !== lastActiveId) {
      lastActiveId = act.id;
      if (openStack && groupOf(act) !== openStack) setOpen(null); // clicked off onto a tab outside the open stack
    }
    { const g = act && groupOf(act); inlStack = g && !act.pinned ? g : null; } // unpinned stack: expand inline while one of its tabs is active
    render(true);
  }

  function collectItems(strip) {
    const items = [];
    strip.querySelectorAll(':scope > span').forEach(span => {
      const pos = span.querySelector(':scope > .tab-position'); if (!pos) return;
      const pinned = pos.classList.contains('is-pinned'), stack = pos.classList.contains('is-substack');
      span.classList.toggle('vpm-hidden', !pinned && stack && CONFIG.SHOW_UNPINNED_STACKS);
      if (!pinned && !(stack && CONFIG.SHOW_UNPINNED_STACKS)) return;
      const w = pos.querySelector('.tab-wrapper'); if (!w) return;
      const fav = w.querySelector('.favicon');
      items.push({ span, pos, w, stack, pinned, gid: stack ? w.dataset.id.slice(4) : null, id: tabIdOf(w),
        title: (w.querySelector('.title')?.textContent || w.getAttribute('aria-label') || '').trim(),
        count: w.querySelector('.stack-counter')?.textContent || '', fav, favSig: fav ? fav.innerHTML.length : 0,
        active: w.classList.contains('active') || !!w.querySelector('.tab.active') });
    });
    return items;
  }

  function tile(it) {
    const d = document.createElement('div');
    d.className = 'vpm-tile' + (it.stack ? ' vpm-stack' : '') + (it.active ? ' active' : '') + (it.stack && openStack === it.gid ? ' open' : '');
    d.title = it.stack ? `${stackTitle(it.gid, it.title)} (${members(it.gid).length || it.count})` : it.title;
    const ico = document.createElement('span'); if (it.fav) ico.append(...[...it.fav.childNodes].map(n => n.cloneNode(true))); ico.style.display = 'contents'; d.append(ico);
    if (!it.stack) {
      d.onclick = () => it.id && chrome.tabs.update(it.id, { active: true });
      d.onauxclick = e => { if (e.button === 1 && CONFIG.MIDDLE_CLICK_CLOSES && it.id) chrome.tabs.remove(it.id); };
    } else {
      if (it.count) d.append(Object.assign(document.createElement('span'), { className: 'vpm-badge', textContent: it.count }));
      d.onclick = e => { e.stopPropagation(); setOpen(openStack === it.gid ? null : it.gid); };
    }
    // right-click: forward to the real (hidden) Vivaldi tab so its native context menu opens
    d.oncontextmenu = e => {
      e.preventDefault();
      it.w.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, button: 2, buttons: 2 }));
    };
    return d;
  }

  // same as the second column's '+': new tab right after the stack's last tab, tagged with the stack's group id
  async function newTabInStack(gid) {
    try {
    const ms = (await chrome.tabs.query({ windowId: window.vivaldiWindowId })).filter(t => groupOf(t) === gid).sort((a, b) => a.index - b.index);
    const last = ms[ms.length - 1]; if (!last) return;
    let ext = {}; try { ext = JSON.parse(last.vivExtData || '{}'); } catch {}
    const nx = { group: gid }; if (ext.fixedGroupTitle) nx.fixedGroupTitle = ext.fixedGroupTitle;
    const t = await chrome.tabs.create({ windowId: window.vivaldiWindowId, index: last.index + 1, pinned: !!last.pinned, active: false });
    await chrome.tabs.update(t.id, { vivExtData: JSON.stringify(nx) });
    const fresh = await chrome.tabs.get(last.id); // create can ignore index for pinned tabs; put it at the stack's end
    try { await chrome.tabs.move(t.id, { index: fresh.index + (t.index > fresh.index ? 1 : 0) }); } catch {}
    await chrome.tabs.update(t.id, { active: true });
    } catch (err) { console.warn('[vpm] new tab in stack failed', err); }
  }

  function fillRows(list, ms) {
    for (const t of ms) {
      const r = document.createElement('div'); r.className = 'vpm-row' + (t.active ? ' active' : ''); r.title = t.title;
      r.append(iconEl(t.favIconUrl && !t.favIconUrl.startsWith('data:') ? favFor(t.url) : (t.favIconUrl || favFor(t.url)), ''),
        Object.assign(document.createElement('span'), { className: 'vpm-t', textContent: t.title || t.url }));
      const x = Object.assign(document.createElement('span'), { className: 'vpm-x', textContent: '×', title: 'Close tab' });
      x.onclick = e => { e.stopPropagation(); chrome.tabs.remove(t.id); }; r.append(x);
      r.onclick = e => { e.stopPropagation(); chrome.tabs.update(t.id, { active: true }); };
      r.onauxclick = e => { if (e.button === 1 && CONFIG.MIDDLE_CLICK_CLOSES) chrome.tabs.remove(t.id); };
      list.append(r);
    }
  }
  function makeAdd(gid) {
    // same markup/classes as Vivaldi's native new-tab '+' so it picks up the theme's look and hover
    const add = document.createElement('div'); add.className = 'toolbar toolbar-tabbar-after toolbar-large toolbar-vertical vpm-add';
    const nat = document.querySelector('#tabs-container .toolbar-tabbar-after .button-toolbar.newtab, #tabs-subcontainer .button-toolbar.newtab');
    const btn = nat ? nat.cloneNode(true) : Object.assign(document.createElement('div'), { className: 'button-toolbar newtab', innerHTML: '<button type="button" class="ToolbarButton-Button"><span class="button-icon">+</span></button>' });
    btn.querySelector('button')?.setAttribute('title', 'New tab in this stack'); btn.querySelector('button')?.removeAttribute('data-name');
    add.append(btn);
    { // copy the native button's resolved look (Vivaldi's rules are scoped to #tabs-tabbar-container, which our grid is outside)
      const B = document.getElementById('browser'), bs = getComputedStyle(B), nb = nat?.querySelector('button');
      const img = bs.getPropertyValue('--colorImageBg').trim(), transp = B.classList.contains('unified-ui-transparent');
      add.style.setProperty('--vpmNtHover', transp && img ? `color-mix(in srgb, ${img} 30%, transparent)` : (bs.getPropertyValue('--colorBgAlphaHeavier') || 'rgba(128,128,128,.2)'));
      add.style.setProperty('--vpmNtActive', transp && img ? `color-mix(in srgb, ${img} 70%, transparent)` : (bs.getPropertyValue('--colorBgAlphaHeavy') || 'rgba(128,128,128,.35)'));
      if (nb) { const c = getComputedStyle(nb); add.style.setProperty('--vpmNtFg', c.color); add.style.setProperty('--vpmNtR', c.borderRadius); }
    }
    add.onclick = e => { e.stopPropagation(); newTabInStack(gid); };
    return add;
  }

  function buildDrop(it) {
    const ms = members(it.gid);
    const head = document.createElement('div'); head.className = 'vpm-head';
    const name = Object.assign(document.createElement('span'), { className: 'vpm-name', textContent: `${stackTitle(it.gid, it.title)} (${ms.length})` });
    const chev = Object.assign(document.createElement('span'), { className: 'vpm-chev', title: 'Collapse' });
    chev.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 7.5 6 4l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const hadd = makeAdd(it.gid); hadd.classList.add('vpm-hadd'); hadd.onmousedown = e => e.stopPropagation();
    head.append(name, hadd, chev); head.onclick = e => { e.stopPropagation(); setOpen(null); };
    const list = document.createElement('div'); list.className = 'vpm-list';
    fillRows(list, ms);
    dropIn.replaceChildren(head, list);
    return list;
  }

  // copy look of Vivaldi's real vertical tabs (row height, font, active colours) and the strip background
  function themeFrom(strip) {
    const bs = getComputedStyle(document.getElementById('browser') || document.documentElement);
    for (const v of ['--colorFg','--colorFgIntense','--colorFgFaded','--colorBg','--colorBgIntense','--colorBgDark','--colorAccentBg','--colorAccentFg','--colorHighlightBg','--colorHighlightFg','--colorBorder','--colorTabBar']) {
      const val = bs.getPropertyValue(v).trim(); if (val) grid.style.setProperty(v, val);
    }
    // background: first opaque ancestor of the strip (what's actually behind the regular tabs)
    let bg = '', el = strip;
    while (el && el !== document.documentElement) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) { bg = c; break; } el = el.parentElement; }
    grid.style.setProperty('--vpmBg', bg || bs.backgroundColor);
    // themes with a background image: paint the same image, fixed to the window, so the grid shows exactly what's behind the tabs
    if (el && el.id === 'browser') {
      const cb = getComputedStyle(el), br = el.getBoundingClientRect();
      Object.assign(grid.style, { backgroundImage: cb.backgroundImage, backgroundSize: cb.backgroundSize === 'auto' ? `${br.width}px ${br.height}px` : cb.backgroundSize,
        backgroundPosition: cb.backgroundPosition, backgroundRepeat: cb.backgroundRepeat, backgroundAttachment: 'fixed', backgroundBlendMode: cb.backgroundBlendMode });
    } else grid.style.backgroundImage = 'none';
    const anyTab = strip.querySelector('.tab-position:not(.is-pinned) .tab'), title = anyTab?.querySelector('.title');
    const fg = bs.getPropertyValue('--colorFg').trim() || (anyTab && getComputedStyle(anyTab).color);
    if (fg) grid.style.setProperty('--vpmFg', fg);
    if (anyTab) { const cs = getComputedStyle(anyTab); grid.style.setProperty('--vpmRowH', anyTab.offsetHeight + 'px'); grid.style.setProperty('--vpmRowR', cs.borderRadius); }
    if (title) { const ct = getComputedStyle(title); grid.style.setProperty('--vpmFont', `${ct.fontWeight} ${ct.fontSize} ${ct.fontFamily}`); }
    const act = strip.querySelector('.tab.active');
    if (act) { const ca = getComputedStyle(act); if (!/rgba\(.*,\s*0\)$/.test(ca.backgroundColor)) { grid.style.setProperty('--vpmActiveBg', ca.backgroundColor); grid.style.setProperty('--vpmActiveFg', ca.color); } }
  }

  function render(force, anim) {
    if (!style.isConnected) document.head.append(style);
    if (!grid.isConnected) document.body.append(grid);
    const strip = mainStrip();
    const root = document.documentElement;
    if (!strip || !strip.offsetWidth) { grid.classList.remove('on'); root.classList.remove(ID + '-on', ID + '-nosub'); return; }
    const items = collectItems(strip);
    if (!items.length) { grid.classList.remove('on'); root.classList.remove(ID + '-on', ID + '-nosub'); return; }
    if (openStack && !items.some(i => i.gid === openStack)) { openStack = null; drop.style.height = '0px'; dropIn.replaceChildren(); }
    root.classList.add(ID + '-nosub'); // always hide Vivaldi's two-level second column: our drop-down / inline lists replace it
    const r = strip.getBoundingClientRect();
    dropMax = Math.round(r.height * CONFIG.DROP_FRACTION);
    const themeSig = (b => b.getPropertyValue('--colorFg') + b.getPropertyValue('--colorBg') + b.getPropertyValue('--colorAccentBg') + b.backgroundImage.length + b.backgroundColor)(getComputedStyle(document.getElementById('browser') || document.documentElement));
    const sig = JSON.stringify([themeSig, items.map(i => [i.id, i.gid, i.count, i.active, i.title, i.favSig]), openStack, r.left, r.top, r.width, r.height,
      openStack ? members(openStack).map(t => [t.id, t.active, t.title, t.favIconUrl]) : 0]);
    if (!anim && (force || sig !== lastSig)) {
      lastSig = sig;
      icons.replaceChildren(...items.map(tile));
      themeFrom(strip);
      if (openStack) {
        const list = buildDrop(items.find(i => i.gid === openStack));
        const headH = 26, pad = DROP_BOTTOM + 5; // head + '+' row
        list.style.maxHeight = Math.max(60, dropMax - headH - pad) + 'px';
        if (performance.now() > animUntil) drop.style.height = Math.min(dropFull(), dropMax) + 'px';
        else drop.style.height = Math.min(dropFull(), dropMax) + 'px';
      }
    }
    Object.assign(grid.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: 'auto', maxHeight: r.height * 0.8 + 'px' });
    grid.classList.add('on'); root.classList.add(ID + '-on');
    // vertical space Vivaldi reserved for the pinned rows (+separator) vs. what the grid needs
    let pinBlock = 0, lastBottom = 0;
    strip.querySelectorAll(':scope > span > .tab-position, :scope > .separator').forEach(el => {
      const y = parseFloat(el.style.getPropertyValue('--PositionY')) || 0, h = parseFloat(el.style.getPropertyValue('--Height')) || el.offsetHeight;
      const isPin = el.classList.contains('is-pinned') || (el.classList.contains('separator') && el.previousElementSibling?.querySelector(':scope > .is-pinned'));
      if (isPin) pinBlock = Math.max(pinBlock, y + h); lastBottom = Math.max(lastBottom, y + h);
    });
    const shift = grid.offsetHeight - pinBlock;
    // inline expansion of an unpinned stack: list sits under its row, rows below move down by its height
    let inlH = 0, stackRow = inlStack && strip.querySelector(`:scope > span > .tab-position:not(.is-pinned) .tab-wrapper[data-id="tab-${inlStack}"]`)?.closest('.tab-position');
    if (stackRow && members(inlStack).length) {
      const sy = parseFloat(stackRow.style.getPropertyValue('--PositionY')) || 0, sh = parseFloat(stackRow.style.getPropertyValue('--Height')) || stackRow.offsetHeight;
      const sig2 = JSON.stringify([inlStack, members(inlStack).map(t => [t.id, t.active, t.title, t.favIconUrl]), lastSig]);
      if (inl.dataset.sig !== sig2) { inl.dataset.sig = sig2; const list = document.createElement('div'); fillRows(list, members(inlStack)); inl.replaceChildren(...list.childNodes);
        for (const p of grid.style) if (p.startsWith('--')) inl.style.setProperty(p, grid.style.getPropertyValue(p)); }
      if (inl.parentElement !== strip) strip.append(inl);
      Object.assign(inl.style, { top: (sy + sh + shift) + 'px', width: strip.clientWidth + 'px' });
      inlH = inl.offsetHeight;
      if (inlAddGid !== inlStack) { inlAdd?.remove(); inlAdd = makeAdd(inlStack); inlAdd.className = 'vpm-add vpm-sadd ' + ID + '-inl'; inlAddGid = inlStack; // drop Vivaldi toolbar classes: inside the tab bar they'd pull in its size-container/padding rules
        for (const ev of ['mousedown', 'pointerdown', 'mouseup', 'dblclick', 'contextmenu']) inlAdd.addEventListener(ev, e => e.stopPropagation()); }
      if (inlAdd.parentElement !== strip) strip.append(inlAdd);
      Object.assign(inlAdd.style, { top: (sy + shift + (sh - 26) / 2) + 'px', left: (stackRow.offsetLeft + stackRow.getBoundingClientRect().width - 32) + 'px' });
      stackRow.classList.add('vpm-expanded');
      strip.querySelectorAll(':scope > span > .tab-position:not(.is-pinned)').forEach(el => el.classList.toggle('vpm-below', (parseFloat(el.style.getPropertyValue('--PositionY')) || 0) > sy));
    } else {
      if (inl.isConnected) inl.remove(); inl.dataset.sig = ''; inlAdd?.remove(); inlAdd = inlAddGid = null;
      strip.querySelectorAll('.vpm-expanded').forEach(el => el.classList.remove('vpm-expanded'));
      strip.querySelectorAll('.vpm-below').forEach(el => el.classList.remove('vpm-below'));
    }
    root.style.setProperty('--vpmInl', inlH + 'px');
    root.style.setProperty('--vpmShift', shift + 'px');
    if (root.style.getPropertyValue('--vpmTrack') !== grid.offsetHeight + 'px') { root.style.setProperty('--vpmTrack', grid.offsetHeight + 'px'); strip.style.scrollbarGutter = strip.style.scrollbarGutter ? '' : 'stable'; } // nudge repaint of the scrollbar
    root.style.setProperty('--vpmEnd', (lastBottom + shift + inlH) + 'px');
  }

  let queued = false;
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(false); }); } };
  // Ignore mutations the mod causes itself (its own nodes, root custom properties, vpm-* classes, no-op writes),
  // otherwise every render would schedule the next one.
  const isOwn = n => n && n.nodeType === 1 && (n === grid || n === inl || n === inlAdd || grid.contains(n) || inl.contains(n) || (inlAdd && inlAdd.contains(n)));
  const stripVpm = v => (v || '').split(/\s+/).filter(c => c && !c.startsWith(ID)).sort().join(' ');
  const relevant = m => {
    const t = m.target;
    if (m.type === 'childList') return ![...m.addedNodes, ...m.removedNodes].every(isOwn) && !isOwn(t);
    if (isOwn(t) || t === document.documentElement) return false;
    const now = t.getAttribute(m.attributeName);
    if (now === m.oldValue) return false;
    if (m.attributeName === 'class' && stripVpm(now) === stripVpm(m.oldValue)) return false;
    return true;
  };
  new MutationObserver(recs => { if (recs.some(relevant)) schedule(); })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'srcset', 'src'] });
  window.addEventListener('resize', schedule);
  setInterval(schedule, 1500); // catches theme switches (Vivaldi swaps theme vars without a class/style mutation we observe)
  for (const ev of ['onCreated', 'onRemoved', 'onUpdated', 'onActivated', 'onMoved', 'onAttached', 'onDetached'])
    chrome.tabs[ev]?.addListener(() => setTimeout(refreshTabs, 50));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openStack) setOpen(null); });
  const boot = () => document.getElementById('browser') && window.vivaldiWindowId != null ? refreshTabs() : setTimeout(boot, 300);
  boot();
})();
