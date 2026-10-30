// ==UserScript==
// @name         LowK3y Rehab Advisor
// @namespace    https://github.com/5cyp4csmpb-ctrl
// @version      1.3.1
// @description  Movable rehab cost estimator for Torn PDA
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/scripts/lowk3y-rehab-advisor.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/lowk3y-stock-advisor/main/scripts/lowk3y-rehab-advisor.user.js
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// ==/UserScript==
(function(){
'use strict';
if(window.__lowk3yRehabAdvisor)return;
window.__lowk3yRehabAdvisor=true;
const K='lowk3y_rehab_advisor_v1';
let s;try{s=Object.assign({x:18,y:125,rehabs:'',ap:'',target:0,api:'',price:'',open:false,live:null,alertLevel:5,alertOn:true,jobPenalty:'',dismissedAt:'',sessionGuess:5,buffer:0},JSON.parse(localStorage.getItem(K)||'{}'))}catch{s={x:18,y:125,rehabs:'',ap:'',target:0,api:'',price:'',open:false,live:null,alertLevel:5,alertOn:true,jobPenalty:'',dismissedAt:'',sessionGuess:5,buffer:0}}
const save=()=>localStorage.setItem(K,JSON.stringify(s));

function scanRehab(){
 if(!/switzerland/i.test(location.href)&&!/Switzerland/i.test((document.body.innerText||'').slice(0,9000)))return;
 const els=[...document.querySelectorAll('div,section,article')].filter(e=>!e.closest('#lkra-panel')&&e.innerText&&e.innerText.length<1800&&/Quantity\s*:\s*\d+/i.test(e.innerText)&&/rehab/i.test(e.innerText));
 els.sort((a,b)=>a.innerText.length-b.innerText.length);
 const t=els[0]?.innerText;if(!t)return;
 const q=t.match(/Quantity\s*:\s*(\d+)/i),totalMatch=t.match(/Quantity\s*:\s*\d+[\s\S]{0,120}?\$([\d,]+)/i),feeMatch=t.match(/(?:fee of|per session|each)\s*\$([\d,]+)/i);
 const quantity=q?Number(q[1]):null,total=totalMatch?Number(totalMatch[1].replace(/,/g,'')):null;
 const unit=feeMatch?Number(feeMatch[1].replace(/,/g,'')):(quantity&&total?total/quantity:null);
 if(!unit||!Number.isFinite(unit)||unit<=0)return;
 if(s.live?.unit!==unit||s.live?.quantity!==quantity||s.live?.total!==total){s.live={unit,quantity,total,at:Date.now()};save();} const live=p.querySelector('#lkra-live');if(live)live.textContent='Torn quote: $'+unit.toLocaleString('en-US')+'/session | '+quantity+' selected | Total $'+(total??quantity*unit).toLocaleString('en-US')+(quantity>1?' | One fewer saves $'+unit.toLocaleString('en-US'):'')+' (verify before paying)';
}

const css=document.createElement('style');
css.textContent='#lkra-btn{position:fixed;z-index:2147483000;background:#101923;color:#e9be69;border:1px solid #c69b4b;border-radius:25px;padding:12px 14px;font:bold 13px Arial;touch-action:none;cursor:grab}#lkra-panel{position:fixed;z-index:2147483001;box-sizing:border-box;width:min(340px,calc(100vw - 20px));max-height:calc(100dvh - 115px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#111a24;color:#f3f5f8;border:1px solid #bb9452;border-radius:14px;padding:15px;font:13px Arial;box-shadow:0 8px 35px #000a}#lkra-panel *{box-sizing:border-box}#lkra-panel label{display:block;margin:10px 0 4px;color:#d6dce4}#lkra-panel input{width:100%;padding:10px;border:1px solid #43505e;border-radius:8px;background:#202c38;color:white;font-size:15px}#lkra-panel button{border:0;border-radius:8px;padding:10px;background:#d4a955;color:#111;font-weight:bold}#lkra-panel .row{display:flex;gap:8px;margin-top:12px}#lkra-panel .row button{flex:1}#lkra-panel .muted{font-size:11px;color:#acb7c4;line-height:1.45}#lkra-panel .result{background:#1d2b37;padding:12px;border-radius:9px;margin:12px 0}';
document.head.appendChild(css);
const btn=document.createElement('button');btn.id='lkra-btn';btn.textContent='🏥 Rehab';document.body.appendChild(btn);
const p=document.createElement('section');p.id='lkra-panel';document.body.appendChild(p);p.style.setProperty('display','none','important');function forceClose(e){const target=e.target;if(!(target instanceof Element)||!target.closest('#lkra-close'))return;e.preventDefault();e.stopImmediatePropagation();s.open=false;save();p.style.setProperty('display','none','important');p.setAttribute('aria-hidden','true')}for(const eventName of ['pointerdown','touchstart','click'])document.addEventListener(eventName,forceClose,{capture:true,passive:false});
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function pos(){s.x=Math.max(0,Math.min(s.x,innerWidth-btn.offsetWidth));s.y=Math.max(0,Math.min(s.y,innerHeight-btn.offsetHeight));btn.style.left=s.x+'px';btn.style.top=s.y+'px';p.style.left=Math.max(10,Math.min(s.x,innerWidth-p.offsetWidth-10))+'px';p.style.top=Math.max(10,Math.min(s.y+48,innerHeight-120))+'px';p.style.maxHeight=Math.max(130,innerHeight-parseFloat(p.style.top)-15)+'px'}
function calc(){const r=Number(s.rehabs),a=Number(s.ap),t=Number(s.target);if(s.rehabs===''||s.ap===''||![r,a,t].every(Number.isFinite)||Math.min(r,a,t)<0||(s.price!==''&&(!Number.isFinite(Number(s.price))||Number(s.price)<=0)))return 'Enter lifetime rehabs and estimated addiction points.';const per=250000/(2857+12.85*r),price=Number(s.price||s.live?.unit||250000),n=Math.ceil(Math.max(0,a-t)/per);return '<span class="muted">~'+n.toLocaleString()+' sessions · ~'+per.toFixed(1)+' AP/session</span><h2 style="color:#e9be69;margin:7px 0">$'+(n*price).toLocaleString('en-US')+'</h2><span class="muted">Estimated only; using the session price entered below. Take a cash buffer.</span>'}
function render(){p.style.setProperty('display',s.open?'block':'none','important');p.setAttribute('aria-hidden',s.open?'false':'true');if(!s.open)return;p.innerHTML='<button id="lkra-close" style="float:right">×</button><b style="display:block;color:#e9be69;margin-right:48px">LOWK3Y INDUSTRIES</b><h3 style="clear:both;margin:12px 0">🏥 Rehab Advisor <small style="font-size:10px;color:#aebbc8">v1.3.1</small></h3><div class="muted">Estimate before flying to Switzerland</div><div id="lkra-live" class="result">Open Switzerland rehab to detect a live quote.</div><label>Rehab price per session ($)</label><input id="lkra-price" type="number" min="1" step="1" placeholder="250000 (estimate)" value="'+esc(s.price)+'"><p class="muted">Enter the current rehab price shown by Torn. Prices can change as your lifetime rehab count increases.</p><label>Lifetime rehab sessions</label><input id="lkra-rehabs" type="number" min="0" value="'+esc(s.rehabs)+'"><label>Estimated addiction points</label><input id="lkra-ap" type="number" min="0" value="'+esc(s.ap)+'"><label>Target remaining addiction points</label><input id="lkra-target" type="number" min="0" value="'+esc(s.target)+'"><div class="result" id="lkra-result">'+calc()+'</div><label>Limited API key (optional, stored on device)</label><input id="lkra-api" type="password" value="'+esc(s.api)+'"><div class="row"><button id="lkra-load">Load rehab count</button><button id="lkra-clear">Clear key</button></div><p class="muted" id="lkra-status">API reads rehab history only; addiction points require manual estimate.</p><div class="row"><button id="lkra-full">Full rehab</button><button id="lkra-partial">Leave 20 AP</button></div><p class="muted">Default estimate $250,000/session until you enter the live price; community formula: cost per AP ≈ 2857 + 12.85 × lifetime rehabs. Not an official quote.</p>';p.querySelector('#lkra-close').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();s.open=false;save();p.style.setProperty('display','none','important')});for(const [id,k] of [['lkra-price','price'],['lkra-rehabs','rehabs'],['lkra-ap','ap'],['lkra-target','target'],['lkra-api','api']])p.querySelector('#'+id).oninput=e=>{s[k]=e.target.value;save();p.querySelector('#lkra-result').innerHTML=calc()};p.querySelector('#lkra-full').onclick=()=>{s.target=0;save();render()};p.querySelector('#lkra-partial').onclick=()=>{s.target=20;save();render()};p.querySelector('#lkra-clear').onclick=()=>{s.api='';save();render()};p.querySelector('#lkra-load').onclick=load;pos()}
function load(){const status=p.querySelector('#lkra-status'),key=String(s.api||'').trim();if(!/^[a-z0-9]{16}$/i.test(key)){status.textContent='Enter a valid 16-character API key.';return}status.textContent='Loading…';const url='https://api.torn.com/user/?selections=personalstats&key='+encodeURIComponent(key)+'&comment=LowK3yRehab';const done=txt=>{try{const d=JSON.parse(txt);if(d.error)throw Error(d.error.error||'API error');const st=d.personalstats||{},n=st.rehabs??st.rehab??st.rehabtimes;if(n==null||!Number.isFinite(Number(n)))throw Error('Rehab count not returned. Enter manually.');s.rehabs=String(n);save();render();p.querySelector('#lkra-status').textContent='Rehab count loaded.'}catch(e){status.textContent=e.message}};if(typeof GM_xmlhttpRequest==='function')GM_xmlhttpRequest({method:'GET',url,onload:r=>done(r.responseText),onerror:()=>status.textContent='Network error'});else fetch(url).then(r=>r.text()).then(done).catch(()=>status.textContent='Network error')}
let drag=null,moved=false;btn.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,sx:s.x,sy:s.y};moved=false;btn.setPointerCapture(e.pointerId)});btn.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)moved=true;if(moved){s.x=drag.sx+dx;s.y=drag.sy+dy;pos()}});btn.addEventListener('pointerup',()=>{if(drag){drag=null;save()}});btn.addEventListener('click',()=>{if(moved){moved=false;return}s.open=!s.open;save();render()});window.addEventListener('resize',pos);pos();render();setInterval(scanRehab,2500);setTimeout(scanRehab,1000);

function upgradePanel(){
 if(!s.open||!p.querySelector('#lkra-live')||p.querySelector('#lkra-v13'))return;
 const box=document.createElement('div');box.id='lkra-v13';
 const heading=document.createElement('h3');heading.textContent='✈ Pre-flight cash planner';box.append(heading);
 const result=document.createElement('div');result.className='result';box.append(result);
 const fields=[['jobPenalty','Current company addiction penalty'],['alertLevel','Alert at addiction penalty'],['sessionGuess','Expected rehab sessions'],['buffer','Extra cash buffer (%)']];
 const update=()=>{
 const unit=Number(s.price||s.live?.unit||215000),sessions=Math.max(1,Number(s.sessionGuess)||5),buffer=Math.max(0,Number(s.buffer)||0);
 result.textContent='Estimated cash: $'+Math.ceil(unit*sessions*(1+buffer/100)).toLocaleString('en-US')+' (verify on Torn)';
 notifyV13();
 };
 for(const [key,title] of fields){
 const label=document.createElement('label');label.textContent=title;
 const input=document.createElement('input');input.type='number';input.min='0';input.value=s[key];
 input.oninput=()=>{s[key]=input.value;s.dismissedAt='';save();update()};
 box.append(label,input);
 }
 const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0';label.textContent='Enable addiction alert';
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.style.cssText='width:22px;height:22px;min-width:22px;accent-color:#d4a955;margin:0';checkbox.checked=s.alertOn;
 checkbox.onchange=()=>{s.alertOn=checkbox.checked;save();notifyV13()};
 label.append(checkbox);box.append(label);
 const status=document.createElement('p');status.className='muted';status.id='lkra-company-status';status.textContent=s.companyStatus||'Company addiction: waiting for API check. Manual entry is available.';box.append(status);
 p.querySelector('#lkra-live').after(box);update();
}
const alertV13=document.createElement('button');alertV13.id='lkra-alert-v13';
alertV13.style.cssText='display:none;position:fixed;bottom:12px;left:12px;right:12px;max-width:430px;margin:auto;z-index:2147483002;background:#49301b;color:#ffe5b0;border:1px solid #d4a955;border-radius:10px;padding:12px';
document.body.append(alertV13);
alertV13.onclick=()=>{s.dismissedAt=String(s.jobPenalty);save();notifyV13()};
function notifyV13(){
 const level=Number(s.alertLevel),n=Number(s.jobPenalty);
 const show=s.alertOn&&s.jobPenalty!==''&&level>0&&n>=level&&s.dismissedAt!==String(n);
 alertV13.style.display=show?'block':'none';
 alertV13.textContent='⚠ Company addiction -'+n+' reached your -'+level+' alert. Tap to dismiss.';
}
new MutationObserver(()=>{if(s.open&&p.querySelector('#lkra-live')&&!p.querySelector('#lkra-v13'))upgradePanel()}).observe(p,{childList:true});
let lastV13Check=0,busyV13=false;
function setCompanyStatus(message){s.companyStatus=message;const el=p.querySelector('#lkra-company-status');if(el)el.textContent=message}
function checkV13(){
 const key=String(s.api||'').trim();
 if(!/^[a-z0-9]{16}$/i.test(key)){setCompanyStatus('Company addiction: enter a valid Limited API key, or use manual entry.');return}
 if(busyV13||Date.now()-lastV13Check<120000)return;
 busyV13=true;lastV13Check=Date.now();
 const request=url=>new Promise((resolve,reject)=>{
 if(typeof GM_xmlhttpRequest==='function')GM_xmlhttpRequest({method:'GET',url,timeout:12000,onload:r=>{try{resolve(JSON.parse(r.responseText))}catch(e){reject(e)}},onerror:reject,ontimeout:reject});
 else fetch(url).then(r=>r.json()).then(resolve,reject);
 });
 Promise.all([request('https://api.torn.com/v2/user/basic?key='+encodeURIComponent(key)),request('https://api.torn.com/v2/company/employees?key='+encodeURIComponent(key))]).then(([u,d])=>{
 if(u.error||d.error){setCompanyStatus('Company addiction: API access unavailable; manual entry still works.');return}
 if(!Array.isArray(d.employees)){setCompanyStatus('Company addiction: employee data unavailable; use manual entry.');return}
 const name=u.name||u.user?.name;
 const employee=d.employees.find(e=>(u.id&&Number(e.id)===Number(u.id))||(name&&e.name===name));
 const raw=employee?.effectiveness?.addiction;
 if(raw==null||!Number.isFinite(Number(raw))){setCompanyStatus('Company addiction: your penalty was not returned by API; use manual entry.');return}
 const penalty=Math.abs(Number(raw));
 if(penalty>100)return;
 setCompanyStatus('Company addiction: API detected -'+penalty+' (checked '+new Date().toLocaleTimeString()+').');
 if(s.jobPenalty!==String(penalty)){s.jobPenalty=String(penalty);s.dismissedAt='';save();if(s.open){const input=p.querySelector('#lkra-v13 input');if(input)input.value=s.jobPenalty}}
 notifyV13();
 }).catch(()=>{setCompanyStatus('Company addiction: API check failed; manual entry still works.')}).finally(()=>{busyV13=false});
}
setInterval(()=>{checkV13();notifyV13()},15000);
setTimeout(()=>{upgradePanel();checkV13();notifyV13()},1300);

})();