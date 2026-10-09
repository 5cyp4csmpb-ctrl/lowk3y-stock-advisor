// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.1.0
// @description  Compact sample FF badge in faction rows; no API requests
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(document.getElementById('lowk3y-ff-v110'))return;
function boot(){
 var panel=document.createElement('div');panel.id='lowk3y-ff-v110';
 panel.style.cssText='position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #7ddd99;border-radius:9px;padding:10px;font:600 13px Arial,sans-serif;max-width:85vw';
 var status=document.createElement('span');status.textContent='LowK3y FF v1.1.0 — compact badge test';panel.appendChild(status);
 var btn=document.createElement('button');btn.type='button';btn.textContent=' Show compact FF';btn.style.cssText='margin-left:8px;padding:7px;background:white;color:#173c2b;border:0;border-radius:5px;font-weight:bold';panel.appendChild(btn);
 btn.addEventListener('click',function(){
  var links=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  var ids=new Set(),tagged=0,small=0;
  links.forEach(function(a){
   var h=a.getAttribute('href')||'',m=h.match(/[?&]XID=(\d+)/i)||h.match(/\/profile\/(\d+)/i);
   if(!m)return;ids.add(m[1]);
   if(tagged>=8||!a.textContent.trim()||a.querySelector('.lowk3y-ff-mini'))return;
   var rect=a.getBoundingClientRect();
   if(rect.width<65||rect.height<18){small++;return;}
   if(getComputedStyle(a).position==='static')a.style.position='relative';
   var tag=document.createElement('span');
   tag.className='lowk3y-ff-mini';tag.textContent='FF 1.5';
   tag.title='Sample only; not a real FF estimate';
   tag.style.cssText='position:absolute!important;right:2px!important;bottom:-3px!important;z-index:5!important;pointer-events:none!important;background:#146042!important;color:#fff!important;border:1px solid #6fbb96!important;border-radius:3px!important;padding:0 2px!important;font:700 8px/1.1 Arial,sans-serif!important;white-space:nowrap!important;';
   a.appendChild(tag);tagged++;
  });
  status.textContent='IDs: '+ids.size+' | Mini badges: '+tagged+' | Small links: '+small;
 });
 (document.body||document.documentElement).appendChild(panel);
}
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
