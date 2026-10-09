// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.2
// @description  Temporary Torn PDA compatibility diagnostic; no API requests.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  function show() {
    if (document.getElementById('lowk3y-ffi-diagnostic')) return;
    var node = document.createElement('div');
    node.id = 'lowk3y-ffi-diagnostic';
    node.textContent = 'LowK3y FF diagnostic ✓ — script running';
    node.style.cssText = 'position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#153d2a;color:white;border:2px solid #67ce95;border-radius:8px;padding:10px;font:600 13px sans-serif;max-width:75vw;box-shadow:0 2px 10px #0008';
    (document.body || document.documentElement).appendChild(node);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, {once:true});
  else show();
  console.log('[LowK3y FF Intelligence] diagnostic v1.0.2 executed');
})();
