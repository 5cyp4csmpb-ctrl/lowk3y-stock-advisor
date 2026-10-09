// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.4
// @description  PDA setup visibility test. No API requests.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(document.getElementById('lowk3y-ff-v104'))return;
function start(){
 var el=document.createElement('div');
 el.id='lowk3y-ff-v104';
 el.style.cssText='position:fixed!important;left:10px!important;bottom:75px!important;z-index:2147483647!important;background:#173c2b!important;color:white!important;border:2px solid #7ddd99!important;border-radius:9px!important;padding:10px!important;font:600 13px Arial,sans-serif!important;max-width:85vw!important;box-shadow:0 3px 12px #0008!important;';
 var label=document.createElement('span');
 label.textContent='LowK3y FF v1.0.4 ✓ Setup test';
 el.appendChild(label);
 var btn=document.createElement('button');
 btn.type='button';btn.textContent=' Test setup';
 btn.style.cssText='margin-left:8px;padding:7px;background:#fff;color:#173c2b;border:0;border-radius:5px;font-weight:bold';
 btn.addEventListener('click',function(){
  var response=prompt('LowK3y FF setup test. Type OK to confirm the prompt works. DO NOT enter an API key.','');
  if(response!==null){label.textContent='LowK3y FF ✓ Prompt works';}
 });
 el.appendChild(btn);
 (document.body||document.documentElement).appendChild(el);
 console.info('[LowK3y FF] v1.0.4 setup test running');
}
if(document.body)start();
else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
