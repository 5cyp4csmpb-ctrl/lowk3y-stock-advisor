// ==UserScript==
// @name         LowK3y FF Intelligence (Beta)
// @namespace    lowk3y-industries
// @version      1.4.1
// @description  Compact FFScouter estimates on faction, search, hospital and player profile pages
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/scripts/lowk3y-ff-intelligence/LowK3y_FF_Intelligence_v1.0.0.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/scripts/lowk3y-ff-intelligence/LowK3y_FF_Intelligence_v1.0.0.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function(){
'use strict';
if(window.__lowk3yFF141)return;window.__lowk3yFF141=true;
var KEYNAME='lowk3y-ff-key-v111',key='',cache=new Map(),busy=false,lastScan=0,setupPanel=null,checkedAt=new Map(),REFRESH_MS=15*60*1000,RETRY_MS=2*60*1000;
try{key=localStorage.getItem(KEYNAME)||'';}catch(e){}
function http(url){
 if(typeof PDA_httpGet!=='function')return Promise.reject(new Error('PDA_httpGet not available'));
 return Promise.resolve(PDA_httpGet(url)).then(function(x){
  if(typeof x==='string')return JSON.parse(x);
  if(x&&typeof x.responseText==='string')return JSON.parse(x.responseText);
  if(x&&typeof x.body==='string')return JSON.parse(x.body);
  if(x&&typeof x.response==='string')return JSON.parse(x.response);
  return x;
 });
}
function panel(message){
 if(!setupPanel){setupPanel=document.createElement('div');setupPanel.id='lowk3y-ff-setup';
 setupPanel.style.cssText='position:fixed;left:10px;bottom:75px;z-index:2147483647;background:#173c2b;color:white;border:2px solid #7ddd99;border-radius:9px;padding:10px;font:600 13px Arial,sans-serif;max-width:85vw';
 (document.body||document.documentElement).appendChild(setupPanel);}
 setupPanel.textContent=message;return setupPanel;
}
function btn(text,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.style.cssText='margin-left:8px;padding:7px;background:white;color:#173c2b;border:0;border-radius:5px;font-weight:bold';b.onclick=action;setupPanel.appendChild(b);}
function setup(){
 panel('LowK3y FF v1.4.1 — connect FFScouter');
 btn('Connect',function(){
  if(!confirm('This script sends your FFScouter/Torn API key and player IDs directly to ffscouter.com to retrieve estimates. Review ffscouter.com data policy before agreeing. Continue?'))return;
  var entered=prompt('Enter your registered 16-character FFScouter API key. Do not share it in chat.','');
  if(!entered)return;entered=entered.trim();
  if(!/^[A-Za-z0-9]{16}$/.test(entered)){panel('Key must contain exactly 16 letters/numbers.');btn('Try again',setup);return;}
  panel('Checking FFScouter registration…');
  http('https://ffscouter.com/api/v1/check-key?key='+encodeURIComponent(entered)).then(function(data){
   if(!data||data.is_registered!==true)throw new Error(data&&data.error||'Key not registered');
   if(data.policy_update_required)throw new Error('Accept the latest FFScouter data policy on its website first');
   key=entered;
   try{localStorage.setItem(KEYNAME,key);}catch(e){panel('Key verified but browser storage unavailable; reconnect after reload.');}
   if(setupPanel)setupPanel.remove();setupPanel=null;
   scan(true);
  }).catch(function(e){panel('Connection failed: '+String(e.message||e).slice(0,100));btn('Retry',setup);});
 });
}
function playerIdFromHref(h){
 try{
  var u=new URL(h,location.href);
  if(u.origin!==location.origin)return null;
  var p=u.pathname.toLowerCase();
  if(!(/\/(?:profiles?\.php)$/.test(p)||/\/profile\/\d+/.test(p)))return null;
  var m=p.match(/\/profile\/(\d+)/);
  var id=m?m[1]:(u.searchParams.get('XID')||u.searchParams.get('xid')||u.searchParams.get('userId'));
  return /^\d+$/.test(id||'')?Number(id):null;
 }catch(e){return null;}
}
function collect(){
 var map=new Map();
 document.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"],a[href*="/profile/"]').forEach(function(a){
  if(a.closest('#lowk3y-ff-profile, #lowk3y-ff-setup'))return;
  var id=playerIdFromHref(a.getAttribute('href')||'');
  if(!id||!a.textContent.trim())return;
  if(!map.has(id))map.set(id,[]);
  map.get(id).push(a);
 });
 return map;
}
function color(n){
 if(n<1000000)return '#216bb4';
 if(n<10000000)return '#188f91';
 if(n<100000000)return '#22844c';
 if(n<1000000000)return '#b28a25';
 if(n<10000000000)return '#b96025';
 return '#a52c38';
}
function fmt(data){
 var n=Number(data&&data.bs_estimate);
 if(!Number.isFinite(n)||n<=0)return {n:NaN,text:'—'};
 return {n:n,text:String(data.bs_estimate_human|| (n>=1e9?(n/1e9).toFixed(2)+'b':n>=1e6?(n/1e6).toFixed(2)+'m':n>=1e3?Math.round(n/1e3)+'k':Math.round(n)))};
}
function getTable(a){
 var el=a;
 for(var i=0;i<12&&el;i++,el=el.parentElement){
  if(el.tagName==='TR'||el.getAttribute('role')==='row')return {row:el,kind:'table'};
  if(el.tagName==='LI'&&el.querySelectorAll('a[href*="profiles.php"],a[href*="profile.php"]').length)return {row:el,kind:'list'};
 }
 return null;
}
function locate(map){
 var rows=[],seen=new Set(),parent=null;
 map.forEach(function(links,id){
  links.forEach(function(a){
   var info=getTable(a);if(!info||seen.has(info.row))return;
   var row=info.row;
   var p=row.parentElement;if(!p)return;
   if(!parent)parent=p;
   if(p!==parent)return;
   seen.add(row);rows.push({row:row,id:id,kind:info.kind});
  });
 });
 return rows.length>=3?rows:[];
}
function buildColumn(rows){
 var row=rows[0].row, parent=row.parentElement;
 var header=Array.from(document.querySelectorAll('li,div,tr,[role="row"]')).find(function(el){
  if(el.classList.contains('lowk3y-ff-colhead'))return false;
  var t=(el.textContent||'').trim();
  return t.length<140 && /\\bLvl\\b/i.test(t) && /\\bPosition\\b/i.test(t) && /\\bDays\\b/i.test(t) && /\\bStatus\\b/i.test(t);
 });
 if(!header)return false;
 var heads=Array.from(header.children),levelHead=heads.findIndex(function(el){return /\\bLvl\\b/i.test(el.textContent||'')});
 if(levelHead<0)return false;
 var sourceRow=Array.from(row.children),levelIndex=sourceRow.findIndex(function(el){return /^\\s*\\d{1,3}\\s*$/.test(el.textContent||'')});
 if(levelIndex<0)return false;
 if(header.querySelector('.lowk3y-ff-colhead'))return true;
 var head=heads[levelHead].cloneNode(false);
 head.className=(heads[levelHead].className||'')+' lowk3y-ff-colhead';
 head.textContent='Est';head.title='Tap to sort estimated battle stats';
 head.style.cssText+=';box-sizing:border-box!important;min-width:62px!important;width:62px!important;text-align:center!important;cursor:pointer!important;';
 heads[levelHead].insertAdjacentElement('afterend',head);
 rows.forEach(function(item){
  var cells=Array.from(item.row.children),source=cells[levelIndex];
  if(!source||item.row.querySelector('.lowk3y-ff-col'))return;
  var cell=source.cloneNode(false);
  cell.className=(source.className||'')+' lowk3y-ff-col';
  cell.textContent='…';
  cell.style.cssText+=';box-sizing:border-box!important;min-width:62px!important;width:62px!important;text-align:center!important;color:white!important;font-weight:700!important;padding:0 2px!important;';
  source.insertAdjacentElement('afterend',cell);
 });
 var direction=-1;
 head.addEventListener('click',function(){
  direction*=-1;
  rows.slice().sort(function(a,b){
   var x=fmt(cache.get(a.id)).n,y=fmt(cache.get(b.id)).n;
   if(!Number.isFinite(x))x=Infinity;if(!Number.isFinite(y))y=Infinity;
   return (x-y)*direction;
  }).forEach(function(item){parent.appendChild(item.row);});
  head.textContent=direction===1?'Est ▲':'Est ▼';
 });
 return true;
}
function fallback(map){
 map.forEach(function(links,id){
  var data=cache.get(id);if(!data)return;
  links.forEach(function(a){
   if(a.querySelector('.lowk3y-ff-est'))return;
   var rect=a.getBoundingClientRect();
   if(rect.width<48||rect.height<16||rect.width>500)return;
   if(a.querySelector('button,input,textarea'))return;
   if(getComputedStyle(a).position==='static')a.style.position='relative';
   var v=fmt(data),badge=document.createElement('span');badge.className='lowk3y-ff-est';
   badge.textContent=v.text;
   var ff=data.fair_fight==null?NaN:Number(data.fair_fight);
   badge.title='FFScouter estimate: '+v.text+(Number.isFinite(ff)?' | Est. multiplier: '+ff.toFixed(2):'')+' | Actual stats may be higher or lower. Last checked by LowK3y: '+(checkedAt.has(id)?new Date(checkedAt.get(id)).toLocaleTimeString():'unknown')+' (not FFScouter source age)';
   badge.style.cssText='position:absolute!important;right:2px!important;bottom:-3px!important;z-index:5!important;pointer-events:none!important;background:'+(Number.isFinite(v.n)?color(v.n):'#555')+'!important;color:#fff!important;border:1px solid #ddd8!important;border-radius:3px!important;padding:0 2px!important;font:700 8px/1.1 Arial,sans-serif!important;white-space:nowrap!important;';
   a.appendChild(badge);
  });
 });
}
function profileId(){
 var url=new URL(location.href);
 if(!/^(profiles?\.php)$/i.test(url.pathname.split('/').pop()||'')&&!/^\/profile\//i.test(url.pathname))return null;
 var match=url.pathname.match(/\/profile\/(\d+)/i);
 var id=match?match[1]:(url.searchParams.get('XID')||url.searchParams.get('xid'));
 return /^\d+$/.test(id||'')?Number(id):null;
}
function profileAnchor(){
 var headings=Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,div,span'));
 var heading=headings.find(function(el){
  return el.children.length===0 && /^User Information$/i.test((el.textContent||'').trim());
 });
 if(!heading)return null;
 var el=heading;
 for(var i=0;i<5&&el;i++,el=el.parentElement){
  var next=el.nextElementSibling;
  if(next && (next.querySelector('img')||next.querySelector('[class*="level"]')||next.querySelector('[class*="profile"]')||next.children.length>1)){
   return {parent:el.parentElement,before:next};
  }
 }
 return heading.parentElement?{parent:heading.parentElement,before:heading.nextSibling}:null;
}
function profileRender(){
 var id=profileId();
 var old=document.getElementById('lowk3y-ff-profile');
 if(!id){if(old)old.remove();return;}
 var target=profileAnchor();
 if(!target){if(old)old.remove();return;}
 var card=old;
 if(!card){
  card=document.createElement('div');card.id='lowk3y-ff-profile';
  card.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:#202c29;color:#fff;border:1px solid #568773;border-radius:7px;padding:8px 10px;margin:8px 10px;font:600 12px Arial,sans-serif;';
  var title=document.createElement('span');title.textContent='Battle Stats';title.style.cssText='color:#a4e4c4;font-weight:700';card.appendChild(title);
  var est=document.createElement('span');est.className='lowk3y-profile-est';card.appendChild(est);
  var multiplierLabel=document.createElement('span');multiplierLabel.textContent='Est. Multiplier';multiplierLabel.className='lowk3y-profile-multiplier-label';multiplierLabel.style.cssText='margin-left:10px;color:#a4e4c4;font-weight:700;';card.appendChild(multiplierLabel);
  var ff=document.createElement('span');ff.className='lowk3y-profile-ff';card.appendChild(ff);
 }
 if(card.parentElement!==target.parent||card.nextSibling!==target.before)target.parent.insertBefore(card,target.before);
 var data=cache.get(id),v=fmt(data);
 var estEl=card.querySelector('.lowk3y-profile-est'),ffEl=card.querySelector('.lowk3y-profile-ff');
 estEl.textContent='Est: '+(data?v.text:'Loading…');
 estEl.style.cssText='border-radius:4px;padding:4px 7px;background:'+(Number.isFinite(v.n)?color(v.n):'#555')+';color:white;';
 var fair=data&&data.fair_fight!=null?Number(data.fair_fight):NaN;
 ffEl.textContent=Number.isFinite(fair)?fair.toFixed(2):'—';
 ffEl.style.cssText='border:1px solid #789;border-radius:4px;padding:3px 6px;';
 card.title='FFScouter estimate, not confirmed battle stats. Actual stats may be higher or lower. Last checked by LowK3y: '+(checkedAt.has(id)?new Date(checkedAt.get(id)).toLocaleTimeString():'unknown')+' (not the age of the underlying estimate)'+(data&&data.source?' | Source: '+data.source:'');
}
function draw(map){
 fallback(map);
 profileRender();
}
async function scan(force){
 if(!key||busy)return;
 var map=collect(),ids=Array.from(map.keys()),pid=profileId();
 if(pid&&!ids.includes(pid))ids.push(pid);
 draw(map);
 var now=Date.now();
 var missing=ids.filter(function(id){return !checkedAt.has(id)||now-checkedAt.get(id)>=REFRESH_MS;});
 if(!missing.length)return;
 busy=true;
 try{
  for(var i=0;i<missing.length;i+=100){
   var chunk=missing.slice(i,i+100);
   var url='https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+chunk.join(',');
   var result=await http(url);
   if(!Array.isArray(result))throw new Error(result&&result.error||'Unexpected API response');
   var received=new Set();
   result.forEach(function(x){if(x&&Number.isInteger(Number(x.player_id))){var pid=Number(x.player_id);if(chunk.includes(pid)){cache.set(pid,x);checkedAt.set(pid,Date.now());received.add(pid);}}});
   chunk.forEach(function(id){if(!received.has(id)){if(!cache.has(id))cache.set(id,{bs_estimate:null,fair_fight:null});checkedAt.set(id,Date.now()-REFRESH_MS+RETRY_MS);}});
   draw(collect());
  }
 }catch(e){panel('FF lookup failed: '+String(e.message||e).slice(0,100));btn('Retry',function(){if(setupPanel)setupPanel.remove();setupPanel=null;scan(true);});}
 finally{busy=false;}
}
function start(){
 if(!key)setup();else scan();
 profileRender();
 var pending=false;
 new MutationObserver(function(){if(pending)return;pending=true;setTimeout(function(){pending=false;var now=Date.now();if(now-lastScan>1500){lastScan=now;scan();}},800);}).observe(document.body||document.documentElement,{childList:true,subtree:true});
}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
