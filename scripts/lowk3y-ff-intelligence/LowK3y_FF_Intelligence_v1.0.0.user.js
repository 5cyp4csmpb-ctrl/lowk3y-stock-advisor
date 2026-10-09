// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.1
// @description  Inline FFScouter estimates beside Torn player links. Read-only, opt-in, no floating button.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @connect      ffscouter.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==
(() => {
  'use strict';
  const PREFIX = 'lowk3y-ffi-v1';
  const STORE_KEY = `${PREFIX}-key`;
  const CACHE_TTL = 5 * 60 * 1000;
  const cache = new Map();
  const pending = new Set();
  const attached = new WeakSet();
  let busy = false;
  let retryAfter = 0;
  const readKey = () => { try { return localStorage.getItem(STORE_KEY) || ''; } catch { return ''; } };
  const saveKey = value => { try { localStorage.setItem(STORE_KEY, value); return true; } catch { return false; } };
  let apiKey = readKey();
  const style = document.createElement('style');
  style.textContent = `.lowk3y-ffi-tag{display:inline-block;margin-left:4px;padding:1px 4px;border-radius:4px;font:600 10px/1.4 system-ui,sans-serif;vertical-align:middle;white-space:nowrap;background:#293444;color:#eee}.lowk3y-ffi-good{background:#19543b;color:#d3ffe4}.lowk3y-ffi-mid{background:#69501a;color:#fff0b5}.lowk3y-ffi-low{background:#6b2830;color:#ffe1e1}`;
  document.documentElement.append(style);
  function getId(link) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/(?:profiles?\.php\?[^#]*\bXID=|\/profiles?\/)(\d+)/i);
    return match ? Number(match[1]) : null;
  }
  function scan() {
    if (!apiKey) return;
    for (const link of document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]')) {
      if (attached.has(link)) continue;
      const id = getId(link);
      if (!id || link.closest('.lowk3y-ffi-tag') || !link.textContent.trim()) continue;
      attached.add(link);
      const tag = document.createElement('span');
      tag.className = 'lowk3y-ffi-tag';
      tag.textContent = 'FF …';
      tag.title = 'LowK3y FF Intelligence: awaiting estimate';
      link.insertAdjacentElement('afterend', tag);
      link.dataset.lowk3yFfiId = String(id);
      const existing = cache.get(id);
      if (existing && Date.now() - existing.at < CACHE_TTL) render(tag, existing.data);
      else pending.add(id);
    }
    queueFetch();
  }
  function render(tag, data) {
    const ff = Number(data?.fair_fight);
    const valid = data?.fair_fight != null && Number.isFinite(ff) && ff >= 0;
    tag.textContent = valid ? `FF ${ff.toFixed(2)}` : 'FF ?';
    tag.className = `lowk3y-ffi-tag ${!valid ? '' : ff >= 2 ? 'lowk3y-ffi-good' : ff >= 1 ? 'lowk3y-ffi-mid' : 'lowk3y-ffi-low'}`;
    const updated = Number(data?.last_updated);
    const age = updated ? new Date(updated * 1000).toLocaleString() : 'unknown';
    tag.title = `FFScouter estimate; battle stats: ${data?.bs_estimate_human || 'unknown'}; source: ${data?.source || 'unknown'}; updated: ${age}. Estimates are not guaranteed.`;
  }
  function updateId(id, data) {
    cache.set(id, { at: Date.now(), data });
    for (const link of document.querySelectorAll(`a[data-lowk3y-ffi-id="${id}"]`)) {
      const tag = link.nextElementSibling;
      if (tag?.classList.contains('lowk3y-ffi-tag')) render(tag, data);
    }
  }
  function request(url) {
    return new Promise((resolve, reject) => {
      if (typeof PDA_httpGet === 'function') {\n        PDA_httpGet(url).then(r => {\n          const status = Number(r.status || 200);\n          if (status !== 200) throw new Error(`HTTP ${status}`);\n          resolve(typeof r.response === 'string' ? JSON.parse(r.response) : typeof r.body === 'string' ? JSON.parse(r.body) : r);\n        }).catch(reject);\n        return;\n      }\n      if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('No HTTP transport available')); return; }\n      GM_xmlhttpRequest({ method: 'GET', url, timeout: 12000,
        onload: r => {
          if (r.status === 429) { retryAfter = Date.now() + 60000; return reject(new Error('Rate limited')); }
          if (r.status !== 200) return reject(new Error(`HTTP ${r.status}`));
          try { resolve(JSON.parse(r.responseText)); } catch (e) { reject(e); }
        }, onerror: reject, ontimeout: () => reject(new Error('Timeout')) });
    });
  }
  function queueFetch() {
    if (busy || !apiKey || !pending.size || Date.now() < retryAfter) return;
    busy = true;
    setTimeout(async () => {
      const ids = [...pending].slice(0, 100);
      ids.forEach(id => pending.delete(id));
      try {
        const url = `https://ffscouter.com/api/v1/get-stats?key=${encodeURIComponent(apiKey)}&targets=${ids.join(',')}`;
        const result = await request(url);
        if (!Array.isArray(result)) throw new Error(result?.error || 'Unexpected response');
        const returned = new Set();
        for (const data of result) {
          const id = Number(data.player_id);
          if (ids.includes(id)) { returned.add(id); updateId(id, data); }
        }
        ids.filter(id => !returned.has(id)).forEach(id => updateId(id, null));
      } catch (err) {
        console.warn('[LowK3y FF Intelligence] Lookup failed:', err.message);
        ids.forEach(id => updateId(id, null));
      } finally { busy = false; if (pending.size) queueFetch(); }
    }, 300);
  }
  function setup() {
    if (apiKey) return;
    const consent = confirm('LowK3y FF Intelligence uses FFScouter estimates. To use it, read FFScouter’s data policy and terms at https://ffscouter.com/. Continue only if you have read and agree to them. Your key will be stored locally by the userscript manager and sent to ffscouter.com for lookups. Continue?');
    if (!consent) return;
    const key = prompt('Enter your existing registered FFScouter API key (16 characters). Never share it in chat:');
    if (!key) return;
    if (!/^[a-zA-Z0-9]{16}$/.test(key.trim())) { alert('Invalid key format. No key was saved.'); return; }
    apiKey = key.trim();
    if (!saveKey(apiKey)) { alert('Could not save key in browser storage.'); return; }
    scan();
  }
  if (!apiKey) {\n    const launch = () => {\n      const el = document.createElement('button');\n      el.textContent = 'Set up LowK3y FF';\n      el.setAttribute('aria-label', 'Set up LowK3y FF Intelligence');\n      el.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483647;padding:10px;border-radius:8px;background:#204c38;color:white;border:1px solid #75a98a;font:600 13px system-ui';\n      el.addEventListener('click', () => { setup(); if (apiKey) el.remove(); });\n      (document.body || document.documentElement).append(el);\n    };\n    if (document.body) launch(); else document.addEventListener('DOMContentLoaded', launch, {once:true});\n  }
  else scan();
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; scan(); }, 500);
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  console.info('[LowK3y FF Intelligence] Beta v1.0.1 loaded');
})();