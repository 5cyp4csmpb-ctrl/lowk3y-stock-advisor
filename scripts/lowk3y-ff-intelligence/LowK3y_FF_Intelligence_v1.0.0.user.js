// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.8
// @description  Faction inline FF layout compatibility test (sample values only)
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(document.getElementById('lowk3y-ff-v108'))return;
function boot(){
 var panel=document.createElement('div');panel.id='lowk3y-ff-v108';
 panel.style.cssText='position:fixed!important;left:10px!important;bottom:75px!important;z-index:2147483647!important;background:#173c2b!important;color:white!important;border:2px solid #7ddd99!important;border-radius:9px!important;padding:10px!important;font:600 13px Arial,sans-serif!important;max-width:85vw!important';
 var status=document.createElement('span');status.textContent='LowK3y FF v1.0.8 — layout check';panel.appendChild(status);
 var btn=document.createElement('button');btn.type='button';btn.textContent=' Show sample FF';
 btn.style.cssText='margin-left:8px;padding:7px;background:#fff;color:#173c2b;border:0;border-radius:5px;font-weight:bold';panel.appendChild(btn);
 btn.addEventListener('click',function(){
  var anchors=document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]');
  var unique=new Set(),placed=0,missing=0;
  anchors.forEach(function(a){
   var h=a.getAttribute('href')||'';
   var m=h.match(/[?&]XID=(\d+)/i)||h.match(/\/profile\/(\d+)/i);
   if(!m)return;
   unique.add(m[1]);
   if(placed>=8||!a.textContent.trim())return;
   var parent=a.parentElement;
   if(!parent){missing++;return;}
   if(parent.querySelector('.lowk3y-ff-sample'))return;
   var tag=document.createElement('span');tag.className='lowk3y-ff-sample';
   tag.textContent='FF TEST 1.50';
   tag.title='Sample only. Not a real fair fight estimate.';
   tag.style.cssText='display:inline-block!important;vertical-align:middle!important;margin:2px 0 2px 4px!important;padding:2px 5px!important;background:#176044!important;color:white!important;border-radius:4px!important;font:600 10px Arial,sans-serif!important;white-space:nowrap!important;max-width:none!important;flex-shrink:0!important;';
   parent.appendChild(tag);placed++;
  });
  status.textContent='IDs: '+unique.size+' | Tags: '+placed+' | Missing parents: '+missing;
 });
 (document.body||document.documentElement).appendChild(panel);
}
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
