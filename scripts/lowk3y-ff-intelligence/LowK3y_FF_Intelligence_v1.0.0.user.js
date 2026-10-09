// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.9
// @description  Faction FF badge layout test: overlay inside player name link; sample data only
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(document.getElementById('lowk3y-ff-v109'))return;
function boot(){
 var panel=document.createElement('div');panel.id='lowk3y-ff-v109';
 panel.style.cssText='position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #7ddd99;border-radius:9px;padding:10px;font:600 13px Arial,sans-serif;max-width:85vw';
 var status=document.createElement('span');status.textContent='LowK3y FF v1.0.9 — layout test';panel.appendChild(status);
 var btn=document.createElement('button');btn.type='button';btn.textContent=' Show FF samples';btn.style.cssText='margin-left:8px;padding:7px;background:white;color:#173c2b;border:0;border-radius:5px;font-weight:bold';panel.appendChild(btn);
 btn.addEventListener('click',function(){
  var links=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  var ids=new Set(),tagged=0,skipped=0;
  links.forEach(function(a){
   var h=a.getAttribute('href')||'',m=h.match(/[?&]XID=(\d+)/i)||h.match(/\/profile\/(\d+)/i);
   if(!m)return;ids.add(m[1]);
   if(tagged>=8||!a.textContent.trim()||a.querySelector('.lowk3y-ff-overlay'))return;
   var rect=a.getBoundingClientRect();
   if(rect.width<65||rect.height<18){skipped++;return;}
   var existingPosition=getComputedStyle(a).position;
   if(existingPosition==='static')a.style.position='relative';
   var tag=document.createElement('span');
   tag.className='lowk3y-ff-overlay';tag.textContent='FF 1.50 TEST';
   tag.title='Sample only — not a real FF estimate';
   tag.style.cssText='position:absolute!important;bottom:0!important;right:1px!important;display:block!important;width:auto!important;max-width:100%!important;z-index:5!important;pointer-events:none!important;padding:1px 3px!important;border-radius:3px!important;background:rgba(15,86,61,.95)!important;color:white!important;font:600 9px/1.2 Arial,sans-serif!important;white-space:nowrap!important;';
   a.appendChild(tag);tagged++;
  });
  status.textContent='IDs: '+ids.size+' | Overlays: '+tagged+' | Small links: '+skipped;
 });
 (document.body||document.documentElement).appendChild(panel);
}
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
