// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.5
// @description  Torn PDA compatibility checks for inline FF integration
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(document.getElementById('lowk3y-ff-v105'))return;
function boot(){
 var panel=document.createElement('div');
 panel.id='lowk3y-ff-v105';
 panel.style.cssText='position:fixed!important;left:10px!important;bottom:75px!important;z-index:2147483647!important;background:#173c2b!important;color:white!important;border:2px solid #7ddd99!important;border-radius:9px!important;padding:10px!important;font:600 13px Arial,sans-serif!important;max-width:85vw!important;box-shadow:0 3px 12px #0008!important;';
 var label=document.createElement('span');
 label.textContent='LowK3y FF v1.0.5 ready';
 panel.appendChild(label);
 var btn=document.createElement('button');
 btn.type='button';
 btn.textContent=' Run checks';
 btn.style.cssText='margin-left:8px;padding:7px;background:#fff;color:#173c2b;border:0;border-radius:5px;font-weight:bold';
 btn.addEventListener('click',function(){
  var http=(typeof PDA_httpGet==='function')?'YES':'NO';
  var links=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  label.textContent='PDA HTTP: '+http+' | Profile links: '+links.length;
  console.info('[LowK3y FF] PDA HTTP available:',http,'profile links:',links.length);
 });
 panel.appendChild(btn);
 (document.body||document.documentElement).appendChild(panel);
 console.info('[LowK3y FF] v1.0.5 loaded');
}
if(document.body)boot();
else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
