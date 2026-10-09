// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.0.3
// @description  Inline FFScouter estimates for Torn PDA; opt-in setup.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if (window.__lowk3yFF103) return;
window.__lowk3yFF103=true;
var STORE='lowk3y-ffi-key-v103', key='';
try { key=localStorage.getItem(STORE)||''; } catch(e){}
var cache=new Map(), waiting=new Set(), timer=0, busy=false, cooldown=0;
var css=document.createElement('style');
css.textContent='.lowk3y-ff-label{display:inline-block;margin-left:4px;padding:1px 4px;border-radius:4px;background:#374151;color:#fff;font:600 11px system-ui;white-space:nowrap}.lowk3y-ff-label.good{background:#176044}.lowk3y-ff-label.mid{background:#795619}.lowk3y-ff-label.low{background:#87343a}';
document.documentElement.appendChild(css);
function banner(message, action) {
 var el=document.getElementById('lowk3y-ff-status');
 if(!el){el=document.createElement('div');el.id='lowk3y-ff-status';el.style.cssText='position:fixed;bottom:70px;left:10px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #6fc894;border-radius:8px;padding:10px;font:600 13px system-ui;max-width:85vw';(document.body||document.documentElement).appendChild(el);}
 el.textContent=message;
 if(action){var btn=document.createElement('button');btn.textContent=' Set up';btn.style.cssText='margin-left:8px;padding:6px;background:white;color:#173c2b;border:0;border-radius:4px';btn.onclick=setup;el.appendChild(btn);}
 return el;
}
function setup(){
 if(!confirm('LowK3y FF Intelligence sends requested player IDs and your registered API key to FFScouter. Read its data policy at ffscouter.com before continuing. Do you consent?'))return;
 var entered=prompt('Enter your registered FFScouter API key (16 letters/numbers). Do not send it in chat. Leave blank to cancel.','');
 if(!entered)return;
 entered=entered.trim();
 if(!/^[a-zA-Z0-9]{16}$/.test(entered)){alert('Key must be 16 letters/numbers.');return;}
 try{localStorage.setItem(STORE,entered);}catch(e){alert('Cannot save key in browser storage.');return;}
 key=entered;
 var b=document.getElementById('lowk3y-ff-status');if(b)b.remove();
 scan();
}
function playerId(a){
 var href=a.getAttribute('href')||'';
 var m=href.match(/[?&]XID=(\d+)/i)||href.match(/\/profiles?\/(\d+)/i);
 return m?Number(m[1]):0;
}
function render(id,data){
 var ff=Number(data&&data.fair_fight);
 var valid=data&&data.fair_fight!=null&&Number.isFinite(ff);
 document.querySelectorAll('[data-lowk3y-ff-id="'+id+'"]').forEach(function(el){
 el.textContent=valid?'FF '+ff.toFixed(2):'FF ?';
 el.className='lowk3y-ff-label'+(valid?(ff>=2?' good':ff>=1?' mid':' low'):'');
 el.title=valid?'FFScouter estimate • BS '+(data.bs_estimate_human||'unknown')+' • source '+(data.source||'unknown'):'No FF estimate available';
 });
}
function scan(){
 if(!key)return;
 document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]').forEach(function(a){
 var id=playerId(a);
 if(!id||a.dataset.lowk3yFFSeen||!a.textContent.trim())return;
 a.dataset.lowk3yFFSeen='1';
 var tag=document.createElement('span');tag.className='lowk3y-ff-label';tag.dataset.lowk3yFfId=String(id);tag.textContent='FF …';
 a.insertAdjacentElement('afterend',tag);
 var old=cache.get(id);
 if(old&&Date.now()-old.time<300000)render(id,old.data);
 else waiting.add(id);
 });
 if(waiting.size&&!timer)timer=setTimeout(load,500);
}
function parseResponse(r){
 if(typeof r==='string')return JSON.parse(r);
 if(r&&typeof r.responseText==='string')return JSON.parse(r.responseText);
 if(r&&typeof r.body==='string')return JSON.parse(r.body);
 if(r&&typeof r.response==='string')return JSON.parse(r.response);
 return r;
}
function http(url){
 return new Promise(function(resolve,reject){
 if(typeof PDA_httpGet==='function'){
 Promise.resolve(PDA_httpGet(url)).then(function(r){resolve(parseResponse(r));},reject);return;
 }
 if(typeof GM_xmlhttpRequest==='function'){
 GM_xmlhttpRequest({method:'GET',url:url,onload:function(r){try{resolve(parseResponse(r));}catch(e){reject(e);}},onerror:reject});return;
 }
 reject(new Error('PDA_httpGet unavailable'));
 });
}
async function load(){
 timer=0;if(busy||Date.now()<cooldown||!waiting.size)return;
 busy=true;
 var ids=Array.from(waiting).slice(0,100);ids.forEach(function(id){waiting.delete(id);});
 try{
 var url='https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+ids.join(',');
 var result=await http(url);
 if(!Array.isArray(result))throw Error((result&&result.error)||'Unexpected FFScouter response');
 var got=new Set();
 result.forEach(function(data){var id=Number(data.player_id);if(ids.includes(id)){got.add(id);cache.set(id,{time:Date.now(),data:data});render(id,data);}});
 ids.forEach(function(id){if(!got.has(id)){cache.set(id,{time:Date.now(),data:null});render(id,null);}});
 }catch(e){
 console.warn('[LowK3y FF] Request failed:',e.message);
 cooldown=Date.now()+30000;
 banner('LowK3y FF: '+String(e.message).slice(0,90)+' (retry after reload)');
 ids.forEach(function(id){render(id,null);});
 }finally{busy=false;if(waiting.size&&Date.now()>=cooldown)timer=setTimeout(load,700);}
}
function start(){
 if(!key)banner('LowK3y FF v1.0.3 ready — API setup required',true);
 else scan();
 var queued=false;
 new MutationObserver(function(){if(queued)return;queued=true;setTimeout(function(){queued=false;scan();},600);}).observe(document.body||document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info('[LowK3y FF] v1.0.3 started');
})();
