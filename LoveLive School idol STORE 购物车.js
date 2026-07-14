// ==UserScript==
// @name         LoveLive School idol STORE 定时购物车
// @namespace    https://lovelive.fannect.jp/
// @version      1.6.0
// @author       yuuuiv
// @license      MIT
// @description  在任意 LoveLive 集合页预选商品和角色，并在设定时间通过店铺正常接口加入购物车。
// @match        https://lovelive.fannect.jp/collections/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/yuuuiv/lovelive-add-cart/main/LoveLive%20School%20idol%20STORE%20%E8%B4%AD%E7%89%A9%E8%BD%A6.js
// @updateURL    https://raw.githubusercontent.com/yuuuiv/lovelive-add-cart/main/LoveLive%20School%20idol%20STORE%20%E8%B4%AD%E7%89%A9%E8%BD%A6.js
// ==/UserScript==

(() => {
  'use strict';
  const ORIGIN = 'https://lovelive.fannect.jp';
  const CART_URL = `${ORIGIN}/cart`;
  const KEY = 'lovelive_cart_schedule_v1';
  const BUTTON_POSITION_KEY = 'lovelive_cart_button_position_v1';
  const MAX_DELAY = 2_147_483_647;
  let timer = null;
  let products = [];
  let saved = load();

  if (!location.pathname.startsWith('/collections/')) return;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { at: '', selected: {} }; } catch { return { at: '', selected: {} }; } }
  function persist() { localStorage.setItem(KEY, JSON.stringify(saved)); }
  function price(value) { return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value / 100); }
  function toInputTime(iso) { if (!iso) return ''; const d = new Date(iso); return Number.isNaN(d) ? '' : new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

  const css = document.createElement('style');
  css.textContent = `#ll-open,#ll-panel{font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
#ll-open{position:fixed;right:24px;bottom:24px;z-index:2147483646;display:flex;align-items:center;justify-content:center;height:40px;padding:0 20px;border:1px solid rgba(147,172,181,0.72);border-radius:6px;background:rgba(150,197,247,0.78);color:#2c3539;font-size:13px;font-weight:600;letter-spacing:0.3px;box-shadow:0 2px 8px rgba(108,117,107,0.15);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:grab;user-select:none;touch-action:none;transition:all 0.2s ease}
#ll-open:hover{background:rgba(169,211,255,0.9);box-shadow:0 4px 12px rgba(108,117,107,0.25);transform:translateY(-1px)}
#ll-open:active{cursor:grabbing;transform:translateY(0) scale(0.98)}
#ll-panel{position:fixed;inset:32px 24px 64px;z-index:2147483646;display:none;overflow:auto;padding:20px;box-sizing:border-box;background:rgba(242,244,255,0.78);border:1px solid rgba(147,172,181,0.72);border-radius:12px;box-shadow:0 12px 32px rgba(108,117,107,0.18);backdrop-filter:blur(16px) saturate(125%);-webkit-backdrop-filter:blur(16px) saturate(125%);scrollbar-width:thin}
#ll-panel.open{display:block}
#ll-panel header{position:sticky;top:-20px;z-index:10;display:flex;justify-content:space-between;align-items:center;margin:-20px -20px 16px;padding:14px 20px;background:rgba(108,117,107,0.88);color:#ffffff;border-bottom:1px solid rgba(147,172,181,0.65);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
#ll-panel header b{font-size:14px;font-weight:600;letter-spacing:0.5px}
#ll-panel button,#ll-panel input{font:inherit}
#ll-panel button{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 14px;border:1px solid rgba(147,172,181,0.76);border-radius:6px;background:rgba(255,255,255,0.74);color:#6c756b;font-weight:500;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);cursor:pointer;transition:all 0.15s ease}
#ll-panel button:hover{background:rgba(242,244,255,0.92);color:#3c433d;border-color:#96c5f7}
#ll-panel button:active{transform:scale(0.98)}
#ll-panel header button{background:rgba(255,255,255,0.15);border-color:transparent;color:#ffffff;font-size:12px;font-weight:600;margin-left:8px}
#ll-panel header button:hover{background:rgba(255,255,255,0.3);border-color:transparent;color:#ffffff}
.ll-primary{background:#96c5f7!important;border-color:#96c5f7!important;color:#2c3539!important;font-weight:600!important}
.ll-primary:hover{background:#a9d3ff!important;border-color:#a9d3ff!important}
.ll-settings{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;margin:16px 0;padding:16px;background:rgba(255,255,255,0.62);border:1px solid rgba(147,172,181,0.68);border-radius:8px;box-shadow:0 1px 3px rgba(108,117,107,0.05);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.ll-settings label{display:grid;gap:6px;font-weight:600;font-size:12px;color:#6c756b}
.ll-settings input[type="datetime-local"]{height:32px;padding:0 10px;border:1px solid #93acb5;border-radius:6px;background:rgba(255,255,255,0.78);color:#3c433d;outline:none;box-sizing:border-box;transition:all 0.2s ease}
.ll-settings input[type="datetime-local"]:focus{border-color:#96c5f7;box-shadow:0 0 0 3px rgba(150,197,247,0.25)}
#ll-status{white-space:pre-wrap;font-weight:500;color:#6c756b;padding:10px 14px;background:rgba(255,255,255,0.58);border-left:4px solid #96c5f7;border-radius:0 6px 6px 0;box-shadow:0 1px 3px rgba(108,117,107,0.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);margin:12px 0}
#ll-all{margin-top:16px;margin-bottom:10px}
#ll-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:10px}
.ll-item{display:grid;grid-template-columns:26px 1fr 54px;gap:10px;align-items:center;padding:12px;background:rgba(255,255,255,0.68);border:1px solid rgba(147,172,181,0.7);border-radius:8px;box-shadow:0 1px 3px rgba(108,117,107,0.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:all 0.2s cubic-bezier(0.16,1,0.3,1)}
.ll-item:hover{transform:translateY(-2px);border-color:#96c5f7;box-shadow:0 4px 12px rgba(150,197,247,0.18)}
.ll-item .ll-thumb{grid-column:1/-1;width:100%;aspect-ratio:1;object-fit:contain;background:rgba(242,244,255,0.64);border-radius:4px;margin-bottom:4px}
.ll-item .ll-detail{min-width:0;font-weight:600;font-size:12.5px;line-height:1.4;color:#3c433d;word-break:break-word}
.ll-item small{display:block;margin-top:4px;color:#93acb5;font-size:11px;font-weight:400}
.ll-item input[type=number]{width:48px;height:28px;padding:0 4px;border:1px solid #93acb5;border-radius:4px;text-align:center;font-weight:600;color:#3c433d;background:rgba(255,255,255,0.8);box-sizing:border-box;outline:none;transition:all 0.2s ease}
.ll-item input[type=number]:focus{border-color:#96c5f7;box-shadow:0 0 0 2px rgba(150,197,247,0.2)}
.ll-check{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0!important;border:1.5px solid #93acb5!important;border-radius:4px!important;background:rgba(255,255,255,0.78)!important;color:transparent!important;font-size:14px!important;font-weight:700!important;line-height:1!important;transition:all 0.15s ease!important;cursor:pointer}
.ll-check.checked{background:#96c5f7!important;border-color:#96c5f7!important;color:#2c3539!important}
.ll-check:hover{border-color:#96c5f7!important}
.open-now{color:#6c756b;font-weight:600}
.closed-now{color:#93acb5;font-style:italic}
@media(max-width:600px){
  #ll-open{right:16px;bottom:16px;padding:0 16px;font-size:12px;height:36px}
  #ll-panel{inset:12px 8px 60px;padding:12px}
  #ll-panel header{margin:-12px -12px 12px;padding:10px 14px}
  .ll-settings{padding:12px;gap:8px}
  #ll-items{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ll-item{grid-template-columns:24px 1fr 44px;padding:8px;font-size:11px}
  .ll-item input[type="number"]{width:38px;height:24px}
}`;
  document.head.append(css);

  const open = Object.assign(document.createElement('button'), { id: 'll-open', type: 'button', textContent: '定时购物车' });
  const panel = document.createElement('section');
  panel.id = 'll-panel';
  panel.innerHTML = `<header><b>定时购物车面板</b><span><button data-do="reload">刷新商品</button> <button data-do="close">关闭</button></span></header><div class="ll-settings"><label>加车时间（浏览器本地时区）<input id="ll-at" type="datetime-local"></label><button class="ll-primary" data-do="save">保存并设定定时器</button><button data-do="clear">清除暂存</button></div><p id="ll-status">打开面板后读取商品。</p><button id="ll-all" type="button">☐ 全选</button><div id="ll-items"></div>`;
  document.body.append(open, panel);
  const status = panel.querySelector('#ll-status');
  const at = panel.querySelector('#ll-at');
  const list = panel.querySelector('#ll-items');
  at.value = toInputTime(saved.at);

  function urls() {
    const result = new Set();
    document.querySelectorAll('a[href*="/products/"]').forEach((a) => { const u = new URL(a.href, ORIGIN); if (u.origin === ORIGIN) result.add(`${ORIGIN}${u.pathname}`); });
    return [...result];
  }
  async function getProduct(url) {
    const handle = new URL(url).pathname.split('/products/')[1];
    const response = await fetch(`${ORIGIN}/products/${encodeURIComponent(handle)}.js`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function draw() {
    list.replaceChildren();
    products.forEach((item) => {
      const { product, variant } = item;
      const checked = saved.selected[variant.id];
      const title = variant.public_title ? `${product.title} - ${variant.public_title}` : product.title;
      const image = variant.featured_image?.src || variant.featured_image || product.featured_image || product.images?.[0] || '';
      const row = document.createElement('div'); row.className = 'll-item';
      row.innerHTML = `${image ? `<img class="ll-thumb" src="${image}" alt="">` : ''}<button type="button" class="ll-check ${checked ? 'checked' : ''}" data-id="${variant.id}" aria-pressed="${checked ? 'true' : 'false'}">${checked ? '✓' : ''}</button><span class="ll-detail">${title}<small>${price(variant.price)} · <i class="${variant.available ? 'open-now' : 'closed-now'}">${variant.available ? '当前可售' : '待开放/无库存'}</i></small></span><input type="number" min="1" max="${variant.quantity_rule?.max || 99}" value="${checked?.quantity || 1}" data-qty="${variant.id}">`;
      list.append(row);
    });
  }
  async function refresh() {
    status.textContent = '正在读取商品和角色变体...';
    const results = await Promise.allSettled(urls().map(getProduct));
    products = results.flatMap((r) => r.status === 'fulfilled' ? r.value.variants.map((variant) => ({ product: r.value, variant })) : []);
    draw();
    const available = products.filter((item) => item.variant.available).length;
    status.textContent = `已读取 ${products.length} 个变体，其中 ${available} 个当前可售。角色商品会分别显示；可提前勾选待开放变体。`;
  }
  function selected() {
    return Object.fromEntries([...list.querySelectorAll('[data-id][aria-pressed="true"]')].map((box) => { const q = Number(list.querySelector(`[data-qty="${box.dataset.id}"]`).value); return [box.dataset.id, { quantity: Number.isInteger(q) && q > 0 ? q : 1 }]; }));
  }
  function arm() {
    if (timer !== null) clearTimeout(timer); timer = null;
    if (!saved.at || !Object.keys(saved.selected).length) return;
    const delay = new Date(saved.at).getTime() - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) { status.textContent = '设定时间已过或无效，请设置未来时间。'; return; }
    timer = setTimeout(() => Date.now() < new Date(saved.at).getTime() ? arm() : add(), Math.min(delay, MAX_DELAY));
    status.textContent = `已暂存 ${Object.keys(saved.selected).length} 个变体；将于 ${new Date(saved.at).toLocaleString()} 发起一次加车请求。请保持该标签页打开。`;
  }
  async function add() {
    const items = Object.entries(saved.selected).map(([id, item]) => ({ id: Number(id), quantity: item.quantity }));
    status.textContent = `已到设定时间，正在提交 ${items.length} 个变体...`;
    try {
      const response = await fetch(`${ORIGIN}/cart/add.js`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items }) });
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
      location.assign(CART_URL);
    } catch (error) { console.error(error); status.textContent = `加车未成功：${error.message}`; }
  }

  let dragged = false;
  try {
    const position = JSON.parse(localStorage.getItem(BUTTON_POSITION_KEY));
    if (position && Number.isFinite(position.left) && Number.isFinite(position.top)) { open.style.left = `${position.left}px`; open.style.top = `${position.top}px`; open.style.right = 'auto'; open.style.bottom = 'auto'; }
  } catch { /* Use the default button position. */ }
  open.addEventListener('pointerdown', (event) => {
    const rect = open.getBoundingClientRect(); const offsetX = event.clientX - rect.left; const offsetY = event.clientY - rect.top;
    dragged = false; open.setPointerCapture(event.pointerId);
    const move = (moveEvent) => { dragged = true; const left = Math.max(0, Math.min(innerWidth - rect.width, moveEvent.clientX - offsetX)); const top = Math.max(0, Math.min(innerHeight - rect.height, moveEvent.clientY - offsetY)); open.style.left = `${left}px`; open.style.top = `${top}px`; open.style.right = 'auto'; open.style.bottom = 'auto'; };
    const up = () => { open.removeEventListener('pointermove', move); if (dragged) localStorage.setItem(BUTTON_POSITION_KEY, JSON.stringify({ left: parseFloat(open.style.left), top: parseFloat(open.style.top) })); setTimeout(() => { dragged = false; }, 0); };
    open.addEventListener('pointermove', move); open.addEventListener('pointerup', up, { once: true });
  });
  open.onclick = () => { if (dragged) return; panel.classList.toggle('open'); if (panel.classList.contains('open') && !products.length) refresh().catch((e) => { status.textContent = `读取失败：${e.message}`; }); };
  panel.querySelector('[data-do="close"]').onclick = () => panel.classList.remove('open');
  panel.querySelector('[data-do="reload"]').onclick = () => refresh().catch((e) => { status.textContent = `读取失败：${e.message}`; });
  panel.querySelector('[data-do="save"]').onclick = () => { saved = { at: at.value ? new Date(at.value).toISOString() : '', selected: selected() }; persist(); arm(); };
  panel.querySelector('[data-do="clear"]').onclick = () => { saved = { at: '', selected: {} }; persist(); at.value = ''; if (timer !== null) clearTimeout(timer); timer = null; draw(); status.textContent = '暂存已清除。'; };
  list.onclick = (event) => {
    const box = event.target.closest('.ll-check[data-id]');
    if (!box) return;
    const checked = box.getAttribute('aria-pressed') !== 'true';
    box.setAttribute('aria-pressed', String(checked));
    box.classList.toggle('checked', checked);
    box.textContent = checked ? '✓' : '';
  };
  panel.querySelector('#ll-all').onclick = (event) => {
    const shouldCheck = [...list.querySelectorAll('.ll-check')].some((box) => box.getAttribute('aria-pressed') !== 'true');
    list.querySelectorAll('.ll-check').forEach((box) => { box.setAttribute('aria-pressed', String(shouldCheck)); box.classList.toggle('checked', shouldCheck); box.textContent = shouldCheck ? '✓' : ''; });
    event.currentTarget.textContent = shouldCheck ? '☑ 取消全选' : '☐ 全选';
  };
  arm();
})();
