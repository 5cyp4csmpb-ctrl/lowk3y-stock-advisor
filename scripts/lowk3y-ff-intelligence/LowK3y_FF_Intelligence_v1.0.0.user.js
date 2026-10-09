// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.6
// @description  PDA inline player badge test; no API requests
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(window.__lowk3yFF106)return;window.__lowk3yFF106=true;
function init(){
 var panel=document.createElement('div');panel.id='lowk3y-ff-v106';
 panel.style.cssText='position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #7ddd99;border-radius:9px;padding:10px;font:600 13px Arial,sans-serif;max-width:85vw';
 var label=document.createElement('span');label.textContent='LowK3y FF v1.0.6 — inline test';panel.appendChild(label);
 var btn=document.createElement('button');btn.textContent=' Show test tags';btn.style.cssText='margin-left:8px;padding:7px;background:#fff;color:#173c2b;border:0;border-radius:5px;font-weight:bold';panel.appendChild(btn);
 btn.addEventListener('click',function(){
  var links=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  var ids=new Set(),tagged=0;
  links.forEach(function(a){
   var href=a.getAttribute('href')||'';
   var match=href.match(/[?&]XID=(\d+)/i)||href.match(/\/profile\/(\d+)/i);
   if(!match)return;ids.add(match[1]);
   if(tagged>=8||a.dataset.lowk3yFFTagged||!a.textContent.trim())return;
   a.dataset.lowk3yFFTagged='1';
   var tag=document.createElement('span');tag.textContent=' FF TEST';tag.style.cssText='display:inline-block;margin-left:4px;padding:2px 4px;border-radius:4px;background:#176044;color:white;font:600 10px Arial,sans-serif';
   a.insertAdjacentElement('afterend',tag);tagged++;
  });
  label.textContent='Unique IDs: '+ids.size+' | Test tags: '+tagged;
 });
 (document.body||document.documentElement).appendChild(panel);
}
if(document.body)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
