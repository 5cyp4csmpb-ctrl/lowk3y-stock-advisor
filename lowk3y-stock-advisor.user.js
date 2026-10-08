// ==UserScript==
// @name         LowK3y Stock Advisor
// @namespace    lowk3y-stock-advisor
// @version      1.9.0
// @description  Stock benefits, income ranking and alerts
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-stock-advisor.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/lowk3y-stock-advisor.user.js
// ==/UserScript==
(async function () {
'use strict';
if (document.getElementById('lk-stock-host')) return;
const API_KEY = '###PDA-APIKEY###';
const STORAGE = 'lk-stock-advisor-v1';
const BENEFITS = {
SYM:[500000,7,'Drug Pack',null], PRN:[1000000,7,'Erotic DVD',null],
FHG:[2000000,7,'FHC',null], MCS:[350000,7,'100 Energy',null],
EWM:[1000000,7,'Box of Grenades',null], ASS:[1000000,7,'Six Pack of Alcohol',null],
THS:[150000,7,'Medical Supplies',null], LSC:[500000,7,'Lottery Voucher',null],
LAG:[750000,7,'Lawyer Business Card',null], GRN:[500000,31,'$4M Cash',4000000],
TCT:[100000,31,'$1M Cash',1000000], TSB:[3000000,31,'$50M Cash',50000000],
IOU:[3000000,31,'$12M Cash',12000000], TMI:[6000000,31,'$25M Cash',25000000],
CNC:[7500000,31,'$80M Cash',80000000], EVL:[100000,7,'1000 Happy',null],
CBD:[350000,7,'50 Nerve',null], PTS:[10000000,7,'100 Points',null],
MUN:[5000000,7,'Energy Drink Pack',null], BAG:[3000000,7,'Ammunition Pack',null],
TCC:[7500000,31,'Clothing Cache',null],
HRG:[10000000,31,'Random Property',null],
TCI:[1500000,0,'10% Bank Interest Bonus',null],
WLT:[9000000,0,'Private Jet Access',null],
SYS:[3000000,0,'Advanced Firewall',null],
IST:[100000,0,'Free Education Courses',null],
TCM:[1000000,0,'10% Racing Skill Boost',null],
TCP:[1000000,0,'Company Sales Boost',null],
ELT:[5000000,0,'10% Home Upgrade Discount',null],
MSG:[300000,0,'Free Classified Advertising',null],
IIL:[1000000,0,'50% Virus Coding Time Reduction',null],
TGP:[2500000,0,'Company Advertising Boost',null],
WSU:[1000000,0,'10% Education Course Time Reduction',null],
YAZ:[1000000,0,'Free Banner Advertising',null],
LOS:[7500000,0,'25% Mission Reward Bonus',null]
};
const read = () => {
try { return JSON.parse(localStorage.getItem(STORAGE)) || {}; }
catch { return {}; }
};
const state = Object.assign({
x:12,y:180,budget:166000000,targets:{},history:{},
values:{},owned:{},open:false,mode:'benefits',expanded:{},filter:'all',purchasePrices:{},lastHoldingsSync:null,portfolioExpanded:{}
},read());
state.targets ||= {};
state.history ||= {};
state.values ||= {};
state.owned ||= {};
state.expanded ||= {};
state.purchasePrices ||= {};
state.portfolioExpanded ||= {};
state.autoSync = true;
if(!['all','affordable','roi','passive','owned'].includes(state.filter))state.filter='all';
const save = () => {
try { localStorage.setItem(STORAGE,JSON.stringify(state)); }
catch(e) { console.warn(e); }
};
const host = document.createElement('div');
host.id = 'lk-stock-host';
host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000';
document.body.appendChild(host);
const root = host.attachShadow({mode:'open'});
root.innerHTML = `
<style>
*{box-sizing:border-box}
button,input{font:inherit}
.bubble{
position:fixed;background:#075a35;color:#baffd4;
border:1px solid #4bdf90;border-radius:24px;
padding:12px 15px;font:800 13px system-ui;
box-shadow:0 3px 15px #0008;
touch-action:none;pointer-events:auto
}
.panel{
position:fixed;top:65px;right:10px;
width:min(410px,calc(100vw - 20px));
max-height:calc(100dvh - 85px);
overflow:auto;background:#101c19;color:#e4ffec;
border:1px solid #408b62;border-radius:14px;
padding:14px;font:13px system-ui;
pointer-events:auto;box-shadow:0 10px 30px #000a
}
.head,.actions{display:flex;align-items:center;gap:8px}
.head{justify-content:space-between}
.title{color:#71efa7;font-size:17px;font-weight:900}
.muted{color:#9ab6a6;font-size:11px}
.btn{background:#20583c;color:white;border:1px solid #478461;border-radius:7px;padding:8px}
.actions{flex-wrap:wrap;margin:10px 0}
.note{background:#20382b;border-radius:8px;padding:10px;margin:10px 0;line-height:1.5}
.row{border-top:1px solid #30503e;padding:9px 0}
.portfolio-stat{display:flex;justify-content:space-between;gap:10px;margin:8px 0}
.portfolio-stat strong{text-align:right;color:#80f3a5}
.portfolio-item{border-top:1px solid #30503e;padding:10px 0}
.portfolio-warning{font-size:11px;color:#e8c69c}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
.filter{font-size:11px;padding:7px 9px;border:1px solid #47765c;border-radius:18px;background:#173c2b;color:#c9e8d3}
.filter.selected{background:#3a9760;color:white;border-color:#79d99d;font-weight:bold}
.stock-toggle{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:transparent;color:inherit;border:0;padding:6px 0;cursor:pointer}
.stock-summary{font-size:11px;color:#9ab6a6;margin:3px 0 0}
.stock-detail{padding:4px 0 8px}
.stock-chevron{color:#80f3a5;font-size:15px;flex-shrink:0}
@media(max-width:420px){.panel{top:48px;right:6px;width:calc(100vw - 12px);max-height:calc(100dvh - 62px);padding:11px}.note{padding:8px}.line{gap:5px}.line span:last-child{text-align:right}}
.symbol{font-weight:bold;font-size:14px}
.line{display:flex;justify-content:space-between;gap:8px;margin:5px 0}
.good{color:#80f3a5}
.bad{color:#ffb39c}
input{background:#1b3027;color:white;border:1px solid #47765c;border-radius:5px;padding:5px;width:115px;max-width:100%}
.small{font-size:11px}
</style>
<button class="bubble" id="bubble">📈 STOCKS</button>
<section class="panel" id="panel" hidden>
<div class="head"><div><div class="title">LOWK3Y STOCK ADVISOR</div>
<div class="muted" id="updated">Waiting for data</div></div>
<button class="btn" id="close">✕</button></div>
<div class="note">Available cash ($): <input id="budget" type="number" min="0"></div>
<div class="actions">
<button class="btn" id="benefits">🏆 Benefits</button>
<button class="btn" id="prices">📉 Prices</button>
<button class="btn" id="portfolio">💼 Portfolio</button>
<button class="btn" id="refresh">↻ Refresh</button>
</div>
<div id="status" class="muted"></div><div id="filters" class="filters"></div><div id="stocks"></div>
<div class="note muted">Stock block requirements and schedules follow Torn Wiki; prices and future returns are estimates. Verify rewards in Torn before investing. Share counts sync from Torn when available; reward values remain manual.
Yield estimates assume the entered reward value stays constant; they exclude price changes, fees and missed collections.
Alerts appear in this panel while the script is running.
No automatic trading.</div>
</section>`;
const el = id => root.getElementById(id);
const bubble = el('bubble');
const panel = el('panel');
const money = n => Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const short = n => n >= 1e9 ? '$'+(n/1e9).toFixed(2)+'B'
: n >= 1e6 ? '$'+(n/1e6).toFixed(2)+'M' : '$'+money(n);
const node = (tag,text,cls) => {
const e = document.createElement(tag);
if(text !== undefined) e.textContent = text;
if(cls) e.className = cls;
return e;
};
function position(){
bubble.style.left = Math.max(0,Math.min(innerWidth-105,state.x))+'px';
bubble.style.top = Math.max(0,Math.min(innerHeight-50,state.y))+'px';
}
position();
panel.hidden = !state.open;
el('budget').value = state.budget;
let drag = null,moved = false;
bubble.addEventListener('pointerdown',e=>{
drag={x:e.clientX,y:e.clientY,left:state.x,top:state.y};
moved=false;
bubble.setPointerCapture(e.pointerId);
});
bubble.addEventListener('pointermove',e=>{
if(!drag)return;
const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
if(Math.abs(dx)+Math.abs(dy)>6)moved=true;
if(!moved)return;
state.x=drag.left+dx;
state.y=drag.top+dy;
position();
});
bubble.addEventListener('pointerup',()=>{
drag=null;
save();
if(moved)return;
state.open=!state.open;
panel.hidden=!state.open;
save();
if(state.open)refresh();
});
el('close').onclick=()=>{
state.open=false;panel.hidden=true;save();
};
el('budget').onchange=e=>{
state.budget=Math.max(0,Number(e.target.value)||0);
save();render();
};
el('benefits').onclick=()=>{state.mode='benefits';save();render();};
el('prices').onclick=()=>{state.mode='prices';save();render();};
el('portfolio').onclick=()=>{state.mode='portfolio';save();render();};
let stocks=[],busy=false,holdingsError='';
function line(parent,label,value,cls){
const r=node('div',undefined,'line');
r.append(node('span',label,'muted'),node('span',value,cls));
parent.append(r);
}
function inputLine(parent,label,value,callback){
const r=node('div',undefined,'line');
const inp=node('input');
inp.type='number';inp.min='0';inp.step='any';
inp.value=value ?? '';inp.placeholder='Enter amount';
inp.onchange=()=>{
callback(inp.value===''?null:Math.max(0,Number(inp.value)||0));
save();render();
};
r.append(node('span',label,'muted'),inp);
parent.append(r);
}
function requiredShares(symbol,base){
const owned=Math.max(0,Number(state.owned[symbol])||0);
if(BENEFITS[symbol]?.[1]===0) return {additional:Math.max(0,base-owned),threshold:base,increment:base};
// Active benefit increments double each time.
let threshold=base,increment=base;
while(threshold<=owned && increment<base*1048576){
increment*=2;
threshold+=increment;
}
return {additional:Math.max(0,threshold-owned),threshold,increment};
}
function render(){
const filters=el('filters');
filters.replaceChildren();
filters.hidden=state.mode!=='benefits';
if(state.mode==='benefits'){
for(const [key,label] of [['all','All'],['affordable','Affordable'],['roi','Highest ROI'],['passive','Passive'],['owned','Owned']]){
const btn=node('button',label,'filter'+(state.filter===key?' selected':''));
btn.type='button';btn.setAttribute('aria-pressed',String(state.filter===key));
btn.onclick=()=>{state.filter=key;save();render();};
filters.append(btn);
}
}
const list=el('stocks');
list.replaceChildren();
if(!stocks.length){
list.append(node('div','Waiting for live prices','note'));
return;
}
if(state.mode==='portfolio'){
const holdings=stocks.filter(s=>Number(state.owned[s.symbol])>0);
list.append(node('div',state.lastHoldingsSync
?'🔄 API HOLDINGS · Last synced '+new Date(state.lastHoldingsSync).toLocaleTimeString()+' · Shares update automatically. Cost basis is optional and manual.'
:'⏳ Waiting for first API holdings sync. Previous manual holdings shown until verified.','note small'));
if(holdingsError)list.append(node('div','⚠ Holdings sync: '+holdingsError+' · Previous holdings retained.','note small'));
if(!holdings.length)list.append(node('div','No holdings found. If sync has not succeeded, open Benefits to enter shares manually.','note'));
let total=0,costTotal=0,costKnown=0;
for(const h of holdings){
const shares=Math.max(0,Number(state.owned[h.symbol])||0);
const value=shares*h.price;total+=value;
const avg=Number(state.purchasePrices[h.symbol]);
const known=Number.isFinite(avg)&&avg>0;
if(known){costTotal+=avg*shares;costKnown++;}
const item=node('div',undefined,'portfolio-item');
const toggle=node('button',undefined,'stock-toggle');
const expanded=!!state.portfolioExpanded[h.symbol];
toggle.type='button';
toggle.setAttribute('aria-expanded',String(expanded));
const title=node('div');
title.append(node('div',h.symbol+' · '+h.name,'symbol'));
title.append(node('div',money(shares)+' shares · '+short(value)+' market value','stock-summary'));
toggle.append(title,node('span',expanded?'▴':'▾','stock-chevron'));
toggle.onclick=()=>{state.portfolioExpanded[h.symbol]=!expanded;save();render();};
item.append(toggle);
if(expanded){
line(item,'Shares',money(shares));
line(item,'Market value',short(value),'good');
inputLine(item,'Average purchase price ($)',state.purchasePrices[h.symbol],v=>{
if(v===null||v===0)delete state.purchasePrices[h.symbol];
else state.purchasePrices[h.symbol]=v;
});
if(known)line(item,'Unrealised P/L',short(Math.abs(value-avg*shares))+(value>=avg*shares?' gain':' loss'),value>=avg*shares?'good':'bad');
else line(item,'Unrealised P/L','Enter purchase price');
const benefit=BENEFITS[h.symbol];
if(benefit){
const next=requiredShares(h.symbol,benefit[0]);
if(benefit[1]>0){
const base=benefit[0],owned=shares;
let blocks=0,threshold=base,increment=base;
while(owned>=threshold&&blocks<25){blocks++;increment*=2;threshold+=increment;}
line(item,'Active benefit blocks',String(blocks));
}else{
line(item,'Passive benefit threshold',shares>=benefit[0]?'Reached (7-day activation applies)':'Not yet reached');
}
line(item,'Shares to next benefit',money(next.additional));
line(item,'Cost to next benefit',short(next.additional*h.price));
}
}
list.append(item);
}
const summary=node('div',undefined,'note');
line(summary,'Portfolio market value',short(total),'good');
line(summary,'Holdings tracked',String(holdings.length));
if(costKnown===holdings.length&&holdings.length){
const profit=total-costTotal;
line(summary,'Total unrealised P/L',(profit>=0?'+':'-')+short(Math.abs(profit)),profit>=0?'good':'bad');
}else line(summary,'Total unrealised P/L','Add all purchase prices');
summary.append(node('div','Tap a holding to expand. Prices may be stale after failed refreshes; P/L excludes fees and dividends.','portfolio-warning'));
const opportunities=holdings.map(h=>{
const b=BENEFITS[h.symbol];if(!b)return null;
const req=requiredShares(h.symbol,b[0]);
return {symbol:h.symbol,remaining:req.additional,cost:req.additional*h.price,percent:req.threshold>0?100*(1-req.additional/req.threshold):0};
}).filter(Boolean).sort((a,b)=>a.cost-b.cost);
if(opportunities.length){
const next=opportunities[0];
summary.append(node('div','Closest next block by additional cost: '+next.symbol+' · '+short(next.cost)+' ('+money(next.remaining)+' shares)','portfolio-warning'));
}
list.prepend(summary);
return;
}
const rows=stocks.map(s=>{
const b=BENEFITS[s.symbol];
if(!b)return {...s,benefit:null};
const req=requiredShares(s.symbol,b[0]);
const cost=req.additional*s.price;
const configured=state.values[s.symbol] ?? b[3];
const value=configured==null ? null : Number(configured);
const annual=b[1]>0 && Number.isFinite(value)&&value>0 ? value*365/b[1] : null;
// Marginal annual yield for the next active benefit increment.
const incrementValue=req.increment*s.price;
const yieldPct=annual!==null && incrementValue>0
? annual/incrementValue*100 : null;
return {...s,benefit:b,req,cost,value,annual,yieldPct};
});
if(state.mode==='benefits'){
const benefitRows=rows.filter(r=>r.benefit && (
state.filter==='all' ||
(state.filter==='affordable' && r.cost<=state.budget) ||
(state.filter==='roi' && r.yieldPct!==null) ||
(state.filter==='passive' && r.benefit[1]===0) ||
(state.filter==='owned' && Number(state.owned[r.symbol])>0)
));
benefitRows.sort((a,b)=>{
if(state.filter==='roi'){
const ay=a.yieldPct??-1,by=b.yieldPct??-1;
return by-ay || a.cost-b.cost;
}
const af=a.cost<=state.budget;
const bf=b.cost<=state.budget;
if(af!==bf)return af?-1:1;
const ay=a.yieldPct ?? -1;
const by=b.yieldPct ?? -1;
if(ay!==by)return by-ay;
return a.cost-b.cost;
});
list.append(node('div',
state.filter==='roi'?'HIGHEST ESTIMATED ROI · Assumptions unverified':'TAP TO EXPAND · Affordable first; yields are estimates',
'note small'));
if(!benefitRows.length)list.append(node('div','No stocks match this filter. Try All stocks.','note'));
for(const s of benefitRows){
const r=node('div',undefined,'row');
const expanded=!!state.expanded[s.symbol];
const toggle=node('button',undefined,'stock-toggle');
toggle.type='button';
toggle.setAttribute('aria-expanded',String(expanded));
const label=node('div');
label.append(node('div',s.symbol+' · '+s.name,'symbol'));
label.append(node('div',s.benefit[1]===0?'Passive · '+s.benefit[2]:s.benefit[2]+' / '+s.benefit[1]+' days','stock-summary'));
label.append(node('div',short(s.cost)+' next block · '+(s.cost<=state.budget?'Affordable':'Save '+short(s.cost-state.budget))+(s.yieldPct!==null?' · Est. '+s.yieldPct.toFixed(1)+'%':''),'stock-summary'));
toggle.append(label,node('span',expanded?'▴':'▾','stock-chevron'));
toggle.onclick=()=>{state.expanded[s.symbol]=!expanded;save();render();};
r.append(toggle);
if(expanded){
const detail=node('div',undefined,'stock-detail');

line(detail,'Current share price',short(s.price));
line(detail,'Shares needed to next block',money(s.req.additional));
line(detail,'Additional cost',short(s.cost),s.cost<=state.budget?'good':'bad');
line(detail,'Budget',s.cost<=state.budget?'AFFORDABLE'
:'SAVE '+short(s.cost-state.budget),s.cost<=state.budget?'good':'bad');
inputLine(detail,'Shares you already own (API sync overrides)',state.owned[s.symbol] ?? 0,v=>{
state.owned[s.symbol]=v||0;
});
if(s.benefit[1]>0 && s.benefit[3]===null){
inputLine(detail,'Reward resale/value ($)',state.values[s.symbol],v=>{
if(v===null)delete state.values[s.symbol];
else state.values[s.symbol]=v;
});
}
if(s.annual!==null){
line(detail,'Est. annual benefit value',short(s.annual));
line(detail,'Est. annual incremental yield',s.yieldPct.toFixed(2)+'%','good');
}else{
line(detail,'Income ranking',s.benefit[1]===0?'Passive perk · no fixed cash yield':'Enter reward value');
}
r.append(detail);
}
list.append(r);
}
}else{
rows.sort((a,b)=>(a.change??Infinity)-(b.change??Infinity));
for(const s of rows){
const r=node('div',undefined,'row');
r.append(node('div',s.symbol+' · '+s.name,'symbol'));
line(r,'Share price',short(s.price));
line(r,'Since last reading',s.change===null?'Waiting for comparison'
:(s.change>=0?'+':'')+s.change.toFixed(2)+'%',s.change<0?'good':'bad');
inputLine(r,'Alert at or below ($)',state.targets[s.id],v=>{
if(v===null)delete state.targets[s.id];
else state.targets[s.id]=v;
});
list.append(r);
}
}
}
async function api(url){
if(typeof PDA_httpGet==='function'){
const response=await PDA_httpGet(url);
const raw=typeof response==='string' ? response
: response?.responseText??response?.response??response;
if(raw==null || raw==='')throw Error('Empty PDA API response');
return typeof raw==='string'?JSON.parse(raw):raw;
}
const response=await fetch(url);
if(!response.ok)throw Error('HTTP '+response.status);
return response.json();
}
async function syncHoldings(){
const url='https://api.torn.com/v2/user/stocks?key='+encodeURIComponent(API_KEY)+'&comment=Lowk3yStockAdvisor';
const data=await api(url);
if(!data||!Array.isArray(data.stocks))throw Error(data?.error?.error||'Unexpected holdings response');
const byId=new Map(stocks.map(s=>[Number(s.id),s.symbol]));
const updated={};
for(const entry of data.stocks){
const id=Number(entry.id),qty=Number(entry.shares);
if(entry.shares===null||entry.shares===undefined)throw Error('Missing shares for stock '+id);
if(!Number.isSafeInteger(id)||!Number.isSafeInteger(qty)||qty<0)throw Error('Invalid holding entry');
const symbol=byId.get(id);
if(!symbol)throw Error('Unrecognised stock ID '+id);
updated[symbol]=(updated[symbol]||0)+qty;
}
if(!stocks.length)throw Error('Stock price list unavailable');
state.owned=updated;
state.lastHoldingsSync=Date.now();
holdingsError='';
save();render();
}
async function refresh(){
if(busy)return;
busy=true;
el('status').textContent='Checking Torn stock prices…';
try{
if(API_KEY.includes('PDA-APIKEY')){
throw Error('PDA API key not substituted');
}
const url='https://api.torn.com/torn/?selections=stocks&key='+
encodeURIComponent(API_KEY)+'&comment=Lowk3yStockAdvisor';
const data=await api(url);
if(!data||typeof data!=='object')throw Error('Invalid API response');
if(data.error)throw Error(data.error.error||'Torn API error');
const entries=Object.entries(data.stocks||{});
const next=[],alerts=[];
for(const [id,v] of entries){
const price=Number(v.current_price??v.price);
if(!(price>0))continue;
const prev=state.history[id]||{};
const symbol=v.acronym||'#'+id;
const target=Number(state.targets[id]);
const change=prev.price>0?(price/prev.price-1)*100:null;
// Notify on a downward crossing, including the first reading.
// Reset the alert only after price rises above the target.
if(target>0&&price<=target&&(!prev.alerted||prev.target!==target))
alerts.push(symbol+' reached '+short(price));
next.push({id,symbol,name:v.name||'Stock',price,change});
state.history[id]={price,target,alerted:target>0&&price<=target};
}
if(next.length<30)throw Error('Incomplete stock prices: '+next.length+' entries');
stocks=next;
save();render();
el('updated').textContent='Updated '+new Date().toLocaleTimeString();
el('status').textContent=stocks.length+' stocks loaded';
try{
await syncHoldings();
el('status').textContent+=' · Holdings synced';
}catch(syncError){
holdingsError=String(syncError?.message||syncError);
render();
el('status').textContent+=' · ⚠ Holdings sync failed (saved shares retained)';
}
if(alerts.length)el('status').textContent+=' 🔔 '+alerts.join(' · ');
}catch(e){
el('status').textContent='⚠ Refresh failed; showing last successful prices if available. '+String(e?.message||e);
}finally{busy=false;}
}
el('refresh').onclick=refresh;
refresh();
setInterval(refresh,60000);
})();
