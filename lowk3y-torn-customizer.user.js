// ==UserScript==
// @name         LowK3y Torn Customizer
// @namespace    lowk3y-industries-customizer
// @version      0.1.0
// @description  Optional cosmetic-only Torn PDA themes and fonts. No API, no gameplay actions.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(()=>{
'use strict';
if(document.getElementById('lk-customizer-host'))return;
const KEY='lk-customizer-prefs-v1',POS='lk-customizer-position-v1';
const defaults={enabled:true,theme:'green',font:'default',round:true,glow:false};
let prefs={...defaults};try{prefs={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){}
const themes={green:'#51e69a',blue:'#55bdf4',purple:'#c08aff',red:'#fa6879'};
const fonts={default:'inherit',modern:'Arial, Helvetica, sans-serif',tech:'Trebuchet MS, Arial, sans-serif',mono:'Consolas, Menlo, monospace'};
const style=document.createElement('style');style.id='lk-customizer-style';document.head.appendChild(style);
function apply(){
const color=themes[prefs.theme]||themes.green, font=fonts[prefs.font]||'inherit';
style.textContent=!prefs.enabled?'':`
:root{--lk-accent:${color}}
body,body button,body input,body select,body textarea{font-family:${font}!important}
body{background-color:#111915!important}
a:hover{color:var(--lk-accent)!important}
button:not(#lk-customizer-host button),input[type=button],input[type=submit]{border-radius:${prefs.round?'8px':'0'}!important}
button:not(#lk-customizer-host button):focus-visible,a:focus-visible{outline:2px solid var(--lk-accent)!important;outline-offset:2px!important}
#mainContainer [class*="title"],#mainContainer [class*="header"]{border-color:var(--lk-accent)!important}
${prefs.glow?'button:not(#lk-customizer-host button):hover{box-shadow:0 0 8px '+color+'77!important}':''}
`;
try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}
}
const host=document.createElement('div');host.id='lk-customizer-host';host.style.cssText='position:fixed;left:8px;top:55%;z-index:2147483000;font-family:Arial,sans-serif;color:#eafff1';
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`<style>
*{box-sizing:border-box}button,select{font:inherit}#head{touch-action:none;cursor:move;user-select:none;background:#073e27;border:1px solid #48d78b;color:#c8ffdf;border-radius:12px;padding:9px 12px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 3px 12px #0008}#panel{margin-top:5px;width:min(270px,85vw);background:#101b15;border:1px solid #48d78b;border-radius:12px;padding:13px;box-shadow:0 8px 24px #000a;font-size:13px}label{display:block;margin:9px 0 4px;color:#c4e3cd}select{width:100%;padding:8px;background:#263b2e;color:#fff;border:1px solid #57715e;border-radius:7px}button{cursor:pointer}#toggle{background:none;border:0;color:white;font-size:17px}#reset{background:#35483b;border:1px solid #66826c;color:white;padding:8px;border-radius:7px;margin-top:13px;width:100%}#enabled,#rounded,#glow{accent-color:#4fe39a}small{display:block;color:#a3baa9;margin-top:10px}
</style><div id="head"><span>🎨 LOWK3Y CUSTOMIZER</span><button id="toggle" aria-label="Open or close settings">+</button></div><div id="panel" hidden><label><input id="enabled" type="checkbox"> Enable customizer</label><label for="theme">Theme accent</label><select id="theme"><option value="green">Neon green</option><option value="blue">Ice blue</option><option value="purple">Cyber purple</option><option value="red">Crimson red</option></select><label for="font">Font</label><select id="font"><option value="default">Original Torn</option><option value="modern">Modern</option><option value="tech">Futuristic</option><option value="mono">Monospace / tactical</option></select><label><input id="rounded" type="checkbox"> Rounded buttons</label><label><input id="glow" type="checkbox"> Hover glow</label><button id="reset">Reset to original Torn</button><small>Cosmetic CSS only. If a page looks wrong, disable this script in PDA and reload.</small></div>`;
document.body.appendChild(host);
const $=id=>shadow.getElementById(id),panel=$('panel'),head=$('head');
function sync(){for(const [id,v] of [['enabled',prefs.enabled],['rounded',prefs.round],['glow',prefs.glow]])$(id).checked=v;$('theme').value=prefs.theme;$('font').value=prefs.font}
sync();apply();
$('toggle').onclick=()=>{panel.hidden=!panel.hidden;$('toggle').textContent=panel.hidden?'+':'−'};
for(const [id,k] of [['enabled','enabled'],['rounded','round'],['glow','glow']])$(id).addEventListener('change',e=>{prefs[k]=e.target.checked;apply()});
for(const k of ['theme','font'])$(k).addEventListener('change',e=>{prefs[k]=e.target.value;apply()});
$('reset').onclick=()=>{prefs={...defaults,enabled:false};sync();apply()};
let drag=null;
try{const p=JSON.parse(localStorage.getItem(POS)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){host.style.left=Math.max(0,Math.min(innerWidth-50,p.x))+'px';host.style.top=Math.max(0,Math.min(innerHeight-50,p.y))+'px'}}catch(e){}
head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=host.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture(e.pointerId);e.preventDefault()});
head.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;host.style.left=Math.max(0,Math.min(innerWidth-host.offsetWidth,e.clientX-drag.x))+'px';host.style.top=Math.max(0,Math.min(innerHeight-host.offsetHeight,e.clientY-drag.y))+'px'});
function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;try{localStorage.setItem(POS,JSON.stringify({x:parseFloat(host.style.left),y:parseFloat(host.style.top)}))}catch(err){}}
head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
})();
