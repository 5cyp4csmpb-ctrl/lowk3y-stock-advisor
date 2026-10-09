// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.7
// @description  Test readable FF badges inside faction player name column (no API requests)
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(window.__lowk3yFF107)return;window.__lowk3yFF107=true;
function init(){
 var panel=document.createElement('div');panel.id='lowk3y-ff-v107';
 panel.style.cssText='position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #7ddd99;border-radius:9px;padding:10px;font:600 13px Arial,sans-serif;max-width:85vw';
 var label=document.createElement('span');label.textContent='LowK3y FF v1.0.7 — layout test';panel.appendChild(label);
 var btn=document.createElement('button');btn.textContent=' Show sample FF';btn.style.cssText='margin-left:8px;padding:7px;background:#fff;color:#173c2b;border:0;border-radius:5px;font-weight:bold';panel.appendChild(btn);
 btn.addEventListener('click',function(){
  var links=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  var ids=new Set(),tagged=0,seen=new Set();
  links.forEach(function(a){
   var href=a.getAttribute('href')||'';
   var match=href.match(/[?&]XID=(\d+)/i)||href.match(/\/profile\/(\d+)/i);
   if(!match)return;ids.add(match[1]);
   if(tagged>=8||seen.has(match[1])||!a.textContent.trim())return;
   var td=a.closest('td');
   if(!td)return;
   var cellText=td.textContent||'';
   if(cellText.length>150)return;
   var old=td.querySelector('.lowk3y-ff-sample');
   if(old)return;
   var badge=document.createElement('div');badge.className='lowk3y-ff-sample';
   badge.textContent='FF: 1.50 TEST';
   badge.title='Sample value only — not an actual FF estimate';
   badge.style.cssText='display:block!important;position:relative!important;box-sizing:border-box!important;width:max-content!important;max-width:95%!important;margin:2px 0 1px 0!important;padding:2px 5px!important;border-radius:4px!important;background:#176044!important;color:#fff!important;font:600 10px/1.2 Arial,sans-serif!important;white-space:nowrap!important;overflow:visible!important;clear:both!important;';
   td.appendChild(badge);tagged++;seen.add(match[1]);
  });
  label.textContent='Unique IDs: '+ids.size+' | Readable badges: '+tagged;
 });
 (document.body||document.documentElement).appendChild(panel);
}
if(document.body)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
