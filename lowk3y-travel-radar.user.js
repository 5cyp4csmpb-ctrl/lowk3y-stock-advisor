// ==UserScript==
// @name         LowK3y Travel Radar
// @namespace    lowk3y-travel-radar
// @version      0.2.0
// @description  Xanax stock and estimated restock inline on Torn Travel Agency
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(()=>{
'use strict';
if(window.__lowk3yTravelRadar)return;
window.__lowk3yTravelRadar=true;
const COUNTRIES={'canada':'can','united kingdom':'uni','japan':'jap','south africa':'sou'};
const STOCK='https://yata.yt/api/v1/travel/export/';
const MODEL='https://raw.githubusercontent.com/russianrob/torn-foreign-restock/main/restock-model.json';
const CACHE='lk-travel-radar-v1';
const REFRESH=90000;
let stock=null,model=null,loadedAt=0,error='';
try{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c&&Date.now()-c.t<900000){stock=c.stock;model=c.model;loadedAt=c.t;}}catch(e){}
const css=document.createElement('style');
css.textContent='.lk-travel-radar{display:block!important;position:relative!important;clear:both!important;width:100%!important;box-sizing:border-box!important;font-size:10px!important;line-height:1.25!important;margin:3px 0 0!important;padding:0!important;font-weight:500!important;color:#9bdcb3!important;white-space:normal!important;pointer-events:none!important;overflow-wrap:anywhere!important}.lk-travel-radar.warn{color:#f4c47a!important}.lk-travel-radar.bad{color:#e89a9a!important}.lk-travel-radar small{color:#b8b8b8!important;font-size:10px!important}';
(document.head||document.documentElement).append(css);
async function get(url){
 if(typeof PDA_httpGet==='function'){
 const r=await PDA_httpGet(url);
 if(r==null)throw Error('Empty PDA response');
 if(typeof r==='string')return JSON.parse(r);
 if(typeof r.responseText==='string')return JSON.parse(r.responseText);
 if(typeof r.body==='string')return JSON.parse(r.body);
 return r;
 }
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
}
function parseTime(v){
 if(v==null)return null;
 if(typeof v==='number')return v>1e12?v:v>1e9?v*1000:null;
 const n=Date.parse(v);return Number.isFinite(n)?n:null;
}
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
 let eta=parseTime(item?.nextRestock),estimated=false;
 if(!eta){
  const candidates=[model?.items?.[code]?.['206'],model?.items?.[code]?.[206],model?.[code]?.['206'],model?.[code]?.[206],model?.items?.['206']?.[code]];
  const m=candidates.find(x=>x&&Number(x.interval)>0&&Number(x.last)>0);
  if(m){
   const interval=Number(m.interval)*1000,last=Number(m.last)*1000;
   const elapsed=Date.now()-last;
   eta=elapsed<0?last:last+(Math.floor(elapsed/interval)+1)*interval;
   estimated=true;
  }
 }
 return {qty,age,fresh,stale,eta,estimated,observed:!!entry};
}
function describe(code){
 const d=info(code);
 if(!d.observed)return {text:'💊 Xanax · Stock data unavailable',kind:'warn'};
 const ageLabel=Number.isFinite(d.age)?Math.floor(d.age/60000)+'m old':'age unknown';
 const suffix=' · report '+ageLabel;
 if(d.stale)return {text:'💊 Xanax · Stale data ('+ageLabel+') · ETA unreliable',kind:'bad'};
 if(d.qty!==null&&d.qty>0)return {text:'💊 Xanax · '+d.qty.toLocaleString()+' reported in stock'+suffix,kind:d.fresh?'':'warn'};
 if(d.eta&&d.eta>Date.now())return {text:'💊 Xanax · ~restock '+remaining(d.eta-Date.now())+(d.estimated?' (model)':' (feed)')+suffix,kind:'warn'};
 return {text:'💊 Xanax · '+(d.qty===0?'Out of stock':'Stock unknown')+' · Restock ETA unknown'+suffix,kind:'warn'};
}
function countryFromText(text){
 const t=String(text||'').toLowerCase().replace(/\s+/g,' ').trim();
 for(const [name,code] of Object.entries(COUNTRIES))if(t.includes(name))return code;
 return null;
}
function update(){
 // Only actual table rows. Never append to generic country/destination containers.
 const rows=document.querySelectorAll('tr');
 for(const row of rows){
  const cells=Array.from(row.children).filter(e=>e.tagName==='TD');
  if(cells.length<2)continue;
  const cell=cells[0];
  const raw=(cell.innerText||'').replace(/\\s+/g,' ').trim();
  const code=countryFromText(raw);
  if(!code)continue;
  const matches=Object.keys(COUNTRIES).filter(c=>raw.toLowerCase().includes(c));
  if(matches.length!==1)continue;
  let badge=cell.querySelector(':scope > .lk-travel-radar');
  if(!badge){
   // Do not inject into nested or duplicate rows.
   if(row.parentElement?.closest('tr'))continue;
   badge=document.createElement('span');
   badge.className='lk-travel-radar';
   badge.dataset.code=code;
   cell.appendChild(badge);
  }
 }
 for(const el of document.querySelectorAll('.lk-travel-radar')){
  const d=describe(el.dataset.code);
  if(el.textContent!==d.text)el.textContent=d.text;
  el.className='lk-travel-radar '+d.kind;
 }
}
let busy=false;
async function refresh(){
 if(busy)return;busy=true;
 try{
  const s=await get(STOCK);
  if(!s||!s.stocks||typeof s.stocks!=='object')throw Error('Invalid stock feed');
  stock=s;loadedAt=Date.now();error='';
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