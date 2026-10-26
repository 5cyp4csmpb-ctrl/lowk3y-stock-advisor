// ==UserScript==
// @name         LowK3y Travel Radar
// @namespace    lowk3y-travel-radar
// @version      0.7.0
// @description  Xanax stock and estimated restock inline on Torn Travel Agency
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-travel-radar.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-travel-radar.user.js
// ==/UserScript==
(()=>{
'use strict';
if(window.__lowk3yTravelRadar)return;
window.__lowk3yTravelRadar=true;
const COUNTRIES={'canada':'can','united kingdom':'uni','japan':'jap','south africa':'sou'};
const STOCK='https://yata.yt/api/v1/travel/export/';
const PROM='https://api.prombot.co.uk/api/travel';
const MODEL='https://raw.githubusercontent.com/russianrob/torn-foreign-restock/main/restock-model.json';
const CACHE='lk-travel-radar-v1';
const REFRESH=60000;
const HISTORY='lk-travel-radar-restocks-v1';
let history={};try{history=JSON.parse(localStorage.getItem(HISTORY)||'{}')||{}}catch(e){}
let stock=null,model=null,loadedAt=0,error='';
try{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c&&Date.now()-c.t<900000){stock=c.stock;model=c.model;loadedAt=c.t;}}catch(e){}
const css=document.createElement('style');
css.textContent='.lk-travel-radar{display:block!important;position:relative!important;clear:both!important;width:100%!important;box-sizing:border-box!important;font-size:10px!important;line-height:1.25!important;margin:3px 0 0!important;padding:0!important;font-weight:500!important;color:#9bdcb3!important;white-space:normal!important;pointer-events:none!important;overflow-wrap:anywhere!important}.lk-travel-radar.warn{color:#f4c47a!important}.lk-travel-radar.bad{color:#e89a9a!important}.lk-travel-radar small{color:#b8b8b8!important;font-size:10px!important}';
css.textContent+=' #lk-travel-radar-panel{box-sizing:border-box;background:#252525;border:1px solid #555;border-radius:8px;color:#eee;margin:10px 4px;padding:10px 12px;font:13px/1.4 Arial,sans-serif}#lk-travel-radar-panel .lk-radar-title{font-weight:700;font-size:14px;margin-bottom:8px}#lk-travel-radar-panel .lk-radar-title span{display:block;font-size:10px;color:#aaa;font-weight:400}#lk-travel-radar-panel .lk-radar-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 10px;padding:7px 0;border-top:1px solid #444}#lk-travel-radar-panel .lk-radar-row strong{font-size:12px}#lk-travel-radar-panel .lk-radar-status{font-size:11px;color:#9bdcb3}#lk-travel-radar-panel .lk-radar-status.warn{color:#f4c47a}#lk-travel-radar-panel .lk-radar-status.bad{color:#e89a9a}';
(document.head||document.documentElement).append(css);
async function get(url){
 if(typeof PDA_httpGet==='function'){
 const r=await PDA_httpGet(url);
 if(r==null)throw Error('Empty PDA response');
 const parse=(value)=>{const t=value.trim();if(!t||!(t.startsWith('{')||t.startsWith('[')))throw Error('Non-JSON feed response');try{return JSON.parse(t)}catch(_){throw Error('Invalid JSON feed response')}};
 if(typeof r==='string')return parse(r);
 if(typeof r.responseText==='string')return parse(r.responseText);
 if(typeof r.body==='string')return parse(r.body);
 return r;
 }
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
}
function parseTime(v){
 if(v==null)return null;
 if(typeof v==='number')return v>1e12?v:v>1e9?v*1000:null;
 const n=Date.parse(v);return Number.isFinite(n)?n:null;
}
function clock(ms){return new Date(ms).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
function remaining(ms){
 const sec=Math.max(0,Math.ceil(ms/1000));
 return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(x=>String(x).padStart(2,'0')).join(':');
}
function info(code){
 const entry=stock?.stocks?.[code],items=entry?.stocks;
 const item=Array.isArray(items)?items.find(i=>Number(i.id)===206||String(i.name||'').toLowerCase()==='xanax'):null;
 const qty=item&&Number.isFinite(Number(item.quantity))?Number(item.quantity):null;
 const stamp=parseTime(entry?.update);
 const age=stamp===null?Infinity:Math.max(0,Date.now()-stamp);
 const fresh=age<15*60000;
 const stale=age>=30*60000;
 let eta=parseTime(item?.nextRestock),estimated=false,lastModel=null;
 {
  const candidates=[model?.items?.[code]?.['206'],model?.items?.[code]?.[206],model?.[code]?.['206'],model?.[code]?.[206],model?.items?.['206']?.[code]];
  const m=candidates.find(x=>x&&Number(x.interval)>0&&Number(x.last)>0);
  if(m){
   const interval=Number(m.interval)*1000,last=Number(m.last)*1000;
   if(last<=Date.now()&&Date.now()-last<7*86400000)lastModel=last;
   if(!eta||eta<=Date.now()){const elapsed=Date.now()-last;eta=elapsed<0?last:last+(Math.floor(elapsed/interval)+1)*interval;estimated=true;}
  }
 }
 const observedLast=history[code]?.last||null;
 return {qty,age,fresh,stale,eta,estimated,last:observedLast||lastModel,lastObserved:!!observedLast,observed:!!entry};
}
function describe(code){
 const d=info(code);
 if(!d.observed)return {text:'💊 Xanax · Stock data unavailable',kind:'warn'};
 const ageLabel=Number.isFinite(d.age)?Math.floor(d.age/60000)+'m old':'age unknown';
 const lastText=d.last?' · Last '+(d.lastObserved?'':'~')+clock(d.last):' · Last restock unknown';
 const suffix=lastText+' · '+ageLabel;
 if(d.stale)return {text:'💊 Stale ('+ageLabel+')'+lastText,kind:'bad'};
 if(d.qty!==null&&d.qty>0)return {text:'💊 '+d.qty.toLocaleString()+' in stock'+suffix,kind:d.fresh?'':'warn'};
 if(d.eta&&d.eta>Date.now())return {text:'💊 ETA ~'+remaining(d.eta-Date.now())+lastText,kind:'warn'};
 return {text:'💊 '+(d.qty===0?'Out of stock':'Unknown stock')+suffix,kind:'warn'};
}
// New Torn travel agency uses a destination selector and map, not country rows.
const COUNTRY_LABELS=[['Canada','can'],['United Kingdom','uni'],['Japan','jap'],['South Africa','sou']];
function onTravelPage(){
 return /travelagency/i.test(location.pathname)||Array.from(document.querySelectorAll('h1,h2,h3,div,span')).some(n=>n.children.length===0&&/^(Travel Agency|Select Destination and Traveling Method)$/i.test((n.textContent||'').trim()));
}
function update(){
 const old=document.getElementById('lk-travel-radar-panel');
 if(!onTravelPage()){if(old)old.remove();return;}
 let panel=old;
 if(!panel){
  const heading=Array.from(document.querySelectorAll('h1,h2,h3,div,span,strong')).find(n=>n.children.length===0&&(n.textContent||'').trim()==='Select Destination and Traveling Method');
  if(!heading)return;
  const block=heading.parentElement;
  if(!block||!block.parentElement)return;
  panel=document.createElement('section');
  panel.id='lk-travel-radar-panel';
  panel.setAttribute('aria-label','LowK3y Xanax Travel Radar');
  block.parentElement.insertBefore(panel,block);
 }
 const rows=COUNTRY_LABELS.map(([name,code])=>{
  const d=describe(code);
  return {name,code,...d};
 });
 if(!panel.dataset.ready){
  panel.innerHTML='<div class="lk-radar-title">💊 LowK3y Xanax Travel Radar <span>Live stock reports · estimates are not guaranteed</span></div><div class="lk-radar-rows"></div>';
  panel.dataset.ready='1';
 }
 const wrap=panel.querySelector('.lk-radar-rows');
 for(const d of rows){
  let el=wrap.querySelector('[data-country="'+d.code+'"]');
  if(!el){
   el=document.createElement('div');el.dataset.country=d.code;el.className='lk-radar-row';
   const name=document.createElement('strong');name.textContent=d.name;
   const status=document.createElement('span');status.className='lk-radar-status';
   el.append(name,status);wrap.appendChild(el);
  }
  const status=el.querySelector('.lk-radar-status');
  if(status.textContent!==d.text)status.textContent=d.text;
  status.className='lk-radar-status '+d.kind;
 }
}
let busy=false;
let yataRetryAt=0;
const validXanax=e=>Array.isArray(e?.stocks)&&e.stocks.some(x=>Number(x.id)===206);
function recordRestocks(next){
 for(const code of Object.values(COUNTRIES)){
  const e=next?.stocks?.[code],item=e?.stocks?.find(x=>Number(x.id)===206);
  const qty=Number(item?.quantity),stamp=parseTime(e?.update);
  if(!item||!Number.isFinite(qty)||!stamp||Date.now()-stamp>15*60000)continue;
  const prev=history[code]||{};
  if(prev.stamp&&stamp>prev.stamp&&prev.qty===0&&qty>0)prev.last=stamp;
  if(!prev.stamp||stamp>=prev.stamp){prev.qty=qty;prev.stamp=stamp;history[code]=prev;}
 }
 try{localStorage.setItem(HISTORY,JSON.stringify(history))}catch(e){}
}
async function refresh(){
 if(busy)return;busy=true;
 try{
  // Prefer Prometheus; fall back to YATA if Prometheus is unavailable or lacks Xanax reports.
  let p=null,y=null;
  try{p=await get(PROM)}catch(e){console.warn('[LowK3y Travel Radar] Prometheus unavailable',e)}
  const needsYata=Object.values(COUNTRIES).some(code=>!validXanax(p?.stocks?.[code]));
  if(needsYata&&Date.now()>=yataRetryAt){try{y=await get(STOCK);yataRetryAt=0}catch(e){yataRetryAt=Date.now()+5*60000;console.warn('[LowK3y Travel Radar] YATA unavailable; retrying later:',e.message||e)}}
  if(!p?.stocks&&!y?.stocks)throw Error('Both stock feeds unavailable');
  const merged={stocks:{}};
  for(const code of Object.values(COUNTRIES)){
   const a=p?.stocks?.[code],b=y?.stocks?.[code];
   const valid=validXanax;
   const ap=valid(a)?parseTime(a.update):null,bp=valid(b)?parseTime(b.update):null;
   merged.stocks[code]=ap!==null&&(bp===null||ap>=bp)?a:(bp!==null?b:(valid(a)?a:(valid(b)?b:null)));
  }
  recordRestocks(merged);
  stock=merged;loadedAt=Date.now();error='';
  try{const m=await get(MODEL);if(m&&typeof m==='object')model=m;}catch(e){}
  try{localStorage.setItem(CACHE,JSON.stringify({t:loadedAt,stock,model}));}catch(e){}
 }catch(e){error=String(e?.message||e);console.warn('[LowK3y Travel Radar] Feed unavailable:',error);}
 finally{busy=false;update();}
}
let scheduled=false;
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;update();},500);});
observer.observe(document.documentElement,{childList:true,subtree:true});
update();refresh();setInterval(update,1000);setInterval(refresh,REFRESH);
})();