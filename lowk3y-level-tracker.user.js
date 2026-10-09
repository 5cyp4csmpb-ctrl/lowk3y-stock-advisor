// ==UserScript==
// @name         LowK3y Level Tracker
// @namespace    lowk3y-level-tracker
// @version      0.2.0
// @description  Estimate Torn level progress using Hall of Fame ranks; not exact XP.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-level-tracker.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-level-tracker.user.js
// ==/UserScript==
(()=>{
'use strict';
if(window.__lkLevelTracker)return;window.__lkLevelTracker=true;
const STORE='lk-level-tracker-v1',KEYSTORE='lk-level-tracker-key';
let key=localStorage.getItem(KEYSTORE)||'',cache=null,busy=false;
try{cache=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
const el=document.createElement('div');el.id='lk-level-tracker';
el.style.cssText='position:fixed;left:8px;top:40%;z-index:2147483000;background:#19241f;color:#e9fff0;border:1px solid #39ad74;border-radius:12px;padding:10px;width:192px;box-shadow:0 3px 15px #0009;font:12px Arial,sans-serif';
el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#8df5b5">📈 LEVEL TRACKER</b><button id="lk-close" style="background:none;border:0;color:#ddd">−</button></div><div id="lk-body" style="margin-top:9px"></div>';
(document.body||document.documentElement).appendChild(el);
const body=el.querySelector('#lk-body'),close=el.querySelector('#lk-close');
// Drag by the header; remember position on this device.
const header=el.firstElementChild;
header.style.cursor='move';header.style.touchAction='none';
let dragging=null;
try{const p=JSON.parse(localStorage.getItem('lk-level-tracker-position')||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){el.style.left=Math.max(0,Math.min(innerWidth-60,p.x))+'px';el.style.top=Math.max(0,Math.min(innerHeight-50,p.y))+'px'}}catch(e){}
header.addEventListener('pointerdown',e=>{
 if(e.target.closest('button'))return;
 const rect=el.getBoundingClientRect();
 dragging={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};
 header.setPointerCapture(e.pointerId);
 e.preventDefault();
});
header.addEventListener('pointermove',e=>{
 if(!dragging||e.pointerId!==dragging.id)return;
 const x=Math.max(0,Math.min(innerWidth-el.offsetWidth,e.clientX-dragging.dx));
 const y=Math.max(0,Math.min(innerHeight-el.offsetHeight,e.clientY-dragging.dy));
 el.style.left=x+'px';el.style.top=y+'px';
});
function stopDrag(e){
 if(!dragging||e.pointerId!==dragging.id)return;
 dragging=null;
 try{localStorage.setItem('lk-level-tracker-position',JSON.stringify({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}))}catch(err){}
}
header.addEventListener('pointerup',stopDrag);
header.addEventListener('pointercancel',stopDrag);
let minimized=false;
close.onclick=()=>{minimized=!minimized;body.style.display=minimized?'none':'block';close.textContent=minimized?'+':'−'};
function render(message){
if(message){body.textContent=message;return}
if(cache&&cache.level&&cache.upper&&cache.lower&&cache.lower>cache.upper){
const pct=Math.max(0,Math.min(99,(cache.lower-cache.rank)/(cache.lower-cache.upper)*100));
body.innerHTML='<b>Level '+cache.level+' → '+(cache.level+1)+'</b><div style="font-size:22px;color:#8df5b5;margin:7px 0">~'+pct.toFixed(1)+'%</div><div style="height:7px;border-radius:8px;background:#3b4740;overflow:hidden"><div style="height:100%;background:#40c881;width:'+pct+'%"></div></div><small style="display:block;margin-top:7px;color:#b9c6bf">HoF rank estimate · not exact XP</small><button id="lk-refresh" style="margin-top:8px;background:#28563d;color:white;border:0;border-radius:5px;padding:5px">Refresh</button>';
body.querySelector('#lk-refresh').onclick=()=>run(true);
}else body.innerHTML='<div style="color:#bbc9c0;margin-bottom:8px">Estimate your level without China. Uses public Hall of Fame ranks.</div><button id="lk-start" style="background:#277849;color:white;border:0;border-radius:6px;padding:7px">Set up tracker</button>';
if(body.querySelector('#lk-start'))body.querySelector('#lk-start').onclick=setup;
}
async function get(url){
let d;
if(typeof PDA_httpGet==='function'){const r=await PDA_httpGet(url);d=typeof r==='string'?JSON.parse(r):typeof r.responseText==='string'?JSON.parse(r.responseText):typeof r.body==='string'?JSON.parse(r.body):r}
else {const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);d=await r.json()}
if(d?.error)throw Error(d.error.error||'Torn API error');
return d;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let calls=0;
async function api(path){if(++calls>65)throw Error('Search limit reached; retry later');await sleep(1100);return get('https://api.torn.com/v2/'+path+(path.includes('?')?'&':'?')+'key='+encodeURIComponent(key))}
async function hof(offset){const d=await api('torn/hof?cat=level&limit=100&offset='+Math.max(0,offset));if(!Array.isArray(d.hof)||!d.hof.length)throw Error('No Hall of Fame results');return d.hof}
async function boundary(level,maxRank){
let left=0,right=Math.max(0,maxRank-1),found=null;
for(let i=0;i<24&&left<=right;i++){
const mid=Math.floor((left+right)/200)*100;
const players=await hof(mid);
const first=players[0].level,last=players[players.length-1].level;
if(first>level&&last>level){left=mid+100;continue}
if(first<level&&last<level){right=mid-1;continue}
found=mid;break;
}
if(found===null)throw Error('Could not locate level '+level+' in HoF');
for(let offset=Math.max(0,found-100),page=0;page<8;page++,offset+=100){
const players=await hof(offset);
const match=players.find(p=>p.level===level&&Number(p.last_action)>0&&(Date.now()/1000-Number(p.last_action))>365*86400);
if(match)return Number(match.position);
if(players[0].level<level)break;
}
throw Error('No inactive level '+level+' reference found');
}
async function run(force=false){
if(busy||!key)return;
if(!force&&cache&&Date.now()-cache.t<60000){render();return}
busy=true;calls=0;render('Checking your Hall of Fame rank…');
try{
const d=await api('user/hof'),level=Number(d.hof?.level?.value),rank=Number(d.hof?.level?.rank);
if(!level||!rank)throw Error('Level ranking unavailable');
if(level>=100){cache={level,rank,upper:1,lower:2,t:Date.now()};render('Level 100 reached!');return}
let upper=cache?.level===level&&Date.now()-cache.boundaryTime<86400000?cache.upper:null;
let lower=cache?.level===level&&Date.now()-cache.boundaryTime<86400000?cache.lower:null;
if(!upper||!lower){
render('Finding reference players… This may take 1–3 minutes. Keep Torn open.');
const ref=await api('user/1364774/hof'),maxRank=Number(ref.hof?.level?.rank);
if(!maxRank)throw Error('HoF reference rank unavailable');
upper=await boundary(level,maxRank);
lower=await boundary(level-1,maxRank);
}
if(!(lower>upper))throw Error('Ranking reference order invalid');
cache={level,rank,upper,lower,t:Date.now(),boundaryTime:cache?.level===level&&cache.upper===upper?cache.boundaryTime:Date.now()};
localStorage.setItem(STORE,JSON.stringify(cache));render();
}catch(e){render('Could not estimate: '+String(e.message||e)+'. Tap the title to retry.');console.warn('[LowK3y Level Tracker]',e)}
finally{busy=false}
}
function setup(){
const value=prompt('Enter a Torn PUBLIC API key for LowK3y Level Tracker. Stored only on this device; sent only to api.torn.com.',key);
if(value===null)return;
const k=value.trim();if(!/^[a-zA-Z0-9]{16,64}$/.test(k)){render('Please enter a valid Torn API key.');return}
key=k;localStorage.setItem(KEYSTORE,key);run(true);
}
el.querySelector('b').onclick=()=>key?run(true):setup();
render();
if(key)run();
setInterval(()=>{if(key&&!busy&&(!cache||Date.now()-cache.t>300000))run()},300000);
})();