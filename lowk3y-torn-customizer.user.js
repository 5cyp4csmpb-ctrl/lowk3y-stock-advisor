// ==UserScript==
// @name         LowK3y Torn Customizer
// @namespace    lowk3y-industries-customizer
// @version      0.8.2
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
const defaults={enabled:true,theme:'green',font:'default',headingFont:'default',chatFont:'default',background:'original',backgroundImage:'',dim:55,panelColor:'original',panelOpacity:90,round:true,glow:false,glowIntensity:35,chatPanels:false};
let prefs={...defaults};try{prefs={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){}
const presets={fantasy:{theme:'red',font:'gothic',headingFont:'gothic',chatFont:'elegant',background:'burgundy',panelColor:'burgundy',panelOpacity:85,round:true,glow:false},cyberpunk:{theme:'purple',font:'cyber',headingFont:'cyber',chatFont:'modern',background:'gradient',panelColor:'purple',panelOpacity:80,round:true,glow:true},tactical:{theme:'green',font:'military',headingFont:'military',chatFont:'mono',background:'forest',panelColor:'forest',panelOpacity:90,round:false,glow:false},underground:{theme:'green',font:'graffiti',headingFont:'street',chatFont:'graffiti',background:'cyber',panelColor:'charcoal',panelOpacity:80,round:true,glow:true,glowIntensity:45,chatPanels:true}};
const themes={green:'#51e69a',blue:'#55bdf4',purple:'#c08aff',red:'#fa6879'};
const fonts={default:'inherit',modern:'Arial, Helvetica, sans-serif',tech:'Trebuchet MS, Arial, sans-serif',mono:'Consolas, Menlo, monospace',graffiti:'"Permanent Marker", Impact, cursive',street:'"Bangers", Impact, cursive',cyber:'"Orbitron", Arial, sans-serif',military:'"Black Ops One", Impact, sans-serif',gothic:'"Pirata One", Georgia, serif',retro:'"Press Start 2P", monospace',comic:'"Comic Neue", cursive',elegant:'Georgia, Times New Roman, serif'};
const fontCSS=document.createElement('link');fontCSS.rel='stylesheet';fontCSS.href='https://fonts.googleapis.com/css2?family=Bangers&family=Black+Ops+One&family=Comic+Neue:wght@400;700&family=Orbitron:wght@400;600;700&family=Permanent+Marker&family=Pirata+One&family=Press+Start+2P&display=swap';document.head.appendChild(fontCSS);
const panelColors={original:'',charcoal:'25,28,31',forest:'13,39,29',midnight:'13,27,46',purple:'37,20,49',burgundy:'49,20,28'};
const backgrounds={original:'',charcoal:'#171b1d',midnight:'#091526',forest:'#0b2318',purple:'#1c1028',burgundy:'#290e16',gradient:'linear-gradient(135deg,#071e15,#11253a 55%,#24132d)',cyber:'radial-gradient(circle at 75% 10%,#194a40,transparent 60%),linear-gradient(150deg,#07100f,#0c1c27)',image:''};
const style=document.createElement('style');style.id='lk-customizer-style';document.head.appendChild(style);
function apply(){
const color=themes[prefs.theme]||themes.green, font=fonts[prefs.font]||'inherit';
const heading=fonts[prefs.headingFont]||'inherit',chat=fonts[prefs.chatFont]||'inherit';
const safeImage=typeof prefs.backgroundImage==='string'&&/^https:\/\/[^\\\s"'<>]+$/i.test(prefs.backgroundImage)&&prefs.backgroundImage.length<1000?prefs.backgroundImage:'';
const bg=Object.prototype.hasOwnProperty.call(backgrounds,prefs.background)?prefs.background:'original';
const dim=Math.max(0,Math.min(90,Number(prefs.dim)||0))/100;
const backgroundRule=bg==='original'?'':bg==='image'?(safeImage?`body{background-image:linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})),url("${safeImage}")!important;background-color:#111915!important;background-position:center center!important;background-size:cover!important;background-attachment:fixed!important}`:''):`body{background:${backgrounds[bg]}!important;background-attachment:fixed!important}`;
const pc=panelColors[prefs.panelColor]||'';
const opacity=Math.max(45,Math.min(100,Number(prefs.panelOpacity)||90))/100;
const panelRule=pc?`#mainContainer [class*="content-wrapper"],#mainContainer [class*="contentWrapper"],#mainContainer [class*="info-msg"],#mainContainer [class*="title-black"],#mainContainer [class*="title-gray"],#mainContainer [class*="content-title"],#mainContainer [class*="msg-info"]{background-color:rgba(${pc},${opacity})!important}`:'';
const glowStrength=Math.max(0,Math.min(100,Number(prefs.glowIntensity)||0))/100;
const chatSelectorsForPanels=['[class*="chatBox"]','[class*="chat-box"]','[class*="chatWindow"]','[class*="chat-window"]','[class*="chatPanel"]','[class*="chat-panel"]'];
const chatPanelRule=prefs.chatPanels?chatSelectorsForPanels.map(sel=>sel+'{border-color:rgba(81,230,154,.55)!important;box-shadow:0 0 '+Math.round(12*glowStrength)+'px rgba(81,230,154,'+(glowStrength*.45).toFixed(2)+')!important}').join('\n'):'';
const bodyRule=prefs.font==='default'?'':`body,body button,body input,body select,body textarea,body #mainContainer *{font-family:${font}!important}`;
const headingRule=prefs.headingFont==='default'?'':`#mainContainer h1,#mainContainer h2,#mainContainer h3,#mainContainer h4,#mainContainer [class*="title"],#mainContainer [class*="heading"],#mainContainer [class*="header"]{font-family:${heading}!important}`;
// Scope the chat font to known chat-window containers, including Torn's legacy chat wrappers.
// Keep the customizer panel isolated in its Shadow DOM.
const chatSelectors=[
'[class*="chatBox"]','[class*="chat-box"]','[class*="chatWindow"]',
'[class*="chat-window"]','[class*="chatMessage"]','[class*="chat-message"]',
'[class*="chatInput"]','[class*="chat-input"]','[class*="messageList"]',
'[class*="message-list"]','[class*="messagesContainer"]',
'[class*="messageContainer"]','[class*="message-container"]',
'[class*="conversation"]','[class*="chat-box-wrapper"]',
'[class*="chat-box-body"]','[class*="chat-box-header"]',
'[class*="chat-box-footer"]','[class*="chat-box-content"]',
'[class*="chat-box-message"]','[class*="chat-box-input"]',
'[class*="chat-box-text"]','[class*="chat-message-text"]',
'[class*="chat-message-author"]','[class*="chat-message-content"]',
'[class*="chat-message-container"]',
'[id^="chatRoot"]','[id^="chat-root"]','[id^="chatBox"]',
'[id^="chat-box"]','[id^="chatWindow"]',
'[class*="chatRoot"]','[class*="chat-root"]',
'[class*="chatPanel"]','[class*="chat-panel"]',
'[class*="chatContent"]','[class*="chat-content"]',
'[class*="chatBody"]','[class*="chat-body"]',
'[class*="chatFooter"]','[class*="chat-footer"]',
'[class*="chatHeader"]','[class*="chat-header"]',
'[class*="chatMessages"]','[class*="chat-messages"]'
];
const chatRule=prefs.chatFont==='default'?'':chatSelectors.flatMap(sel=>[sel,sel+' *','body #mainContainer '+sel,'body #mainContainer '+sel+' *']).join(',')+`{font-family:${chat}!important}`;
style.textContent=!prefs.enabled?'':`
:root{--lk-accent:${color}}
${bodyRule}
${headingRule}
${chatRule}
${backgroundRule}
${panelRule}
${chatPanelRule}
a:hover{color:var(--lk-accent)!important}
button:not(#lk-customizer-host button),input[type=button],input[type=submit]{border-radius:${prefs.round?'8px':'0'}!important}
button:not(#lk-customizer-host button):focus-visible,a:focus-visible{outline:2px solid var(--lk-accent)!important;outline-offset:2px!important}
#mainContainer [class*="title"],#mainContainer [class*="header"]{border-color:var(--lk-accent)!important}
${prefs.glow?'button:not(#lk-customizer-host button):hover{box-shadow:0 0 '+Math.round(3+14*glowStrength)+'px '+color+'77!important}':''}
`;
try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}
}
const host=document.createElement('div');host.id='lk-customizer-host';host.style.cssText='position:fixed;left:8px;top:55%;z-index:2147483000;font-family:Arial,sans-serif;color:#eafff1';
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`<style>
*{box-sizing:border-box}button,select{font:inherit}#head{touch-action:none;cursor:move;user-select:none;background:#073e27;border:1px solid #48d78b;color:#c8ffdf;border-radius:12px;padding:9px 12px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 3px 12px #0008}#panel{margin-top:5px;width:min(270px,85vw);background:#101b15;border:1px solid #48d78b;border-radius:12px;padding:13px;box-shadow:0 8px 24px #000a;font-size:13px}label{display:block;margin:9px 0 4px;color:#c4e3cd}select{width:100%;padding:8px;background:#263b2e;color:#fff;border:1px solid #57715e;border-radius:7px}button{cursor:pointer}#toggle{background:none;border:0;color:white;font-size:17px}#reset{background:#35483b;border:1px solid #66826c;color:white;padding:8px;border-radius:7px;margin-top:13px;width:100%}#enabled,#rounded,#glow{accent-color:#4fe39a}small{display:block;color:#a3baa9;margin-top:10px}
</style><div id="head"><span>🎨 LOWK3Y CUSTOMIZER</span><button id="toggle" aria-label="Open or close settings">+</button></div><div id="panel" hidden><label for="preset">One-tap theme</label><select id="preset"><option value="custom">Custom / my settings</option><option value="fantasy">Dark Fantasy</option><option value="cyberpunk">Cyberpunk</option><option value="tactical">Military Tactical</option><option value="underground">Neon Underground</option></select><small>Choose a theme to apply matching fonts and colours. Manual changes switch back to Custom.</small><label><input id="enabled" type="checkbox"> Enable customizer</label><label for="theme">Theme accent</label><select id="theme"><option value="green">Neon green</option><option value="blue">Ice blue</option><option value="purple">Cyber purple</option><option value="red">Crimson red</option></select><label for="font">Game text font</label><select id="font"><option value="default">Original Torn</option><option value="modern">Modern</option><option value="tech">Futuristic</option><option value="mono">Monospace / tactical</option><option value="graffiti">Graffiti Marker</option><option value="street">Street Art / Comic</option><option value="cyber">Cyberpunk / Sci-Fi</option><option value="military">Military Stencil</option><option value="gothic">Gothic / Medieval</option><option value="retro">Retro Arcade</option><option value="comic">Comic Book</option><option value="elegant">Classic Serif</option></select><label for="headingFont">Headings font</label><select id="headingFont"></select><label for="chatFont">Chats & messages font</label><select id="chatFont"></select><label for="background">Game background</label><select id="background"><option value="original">Original Torn</option><option value="charcoal">Charcoal</option><option value="midnight">Midnight Blue</option><option value="forest">Deep Forest</option><option value="purple">Dark Purple</option><option value="burgundy">Burgundy</option><option value="gradient">Aurora Gradient</option><option value="cyber">Cyber Glow</option><option value="image">Custom image URL</option></select><div id="imageControls" hidden><label for="backgroundImage">HTTPS image URL</label><input id="backgroundImage" type="url" placeholder="https://example.com/image.jpg" style="width:100%;padding:8px;background:#263b2e;color:white;border:1px solid #57715e;border-radius:7px"><label for="dim">Image darkness: <span id="dimValue">55%</span></label><input id="dim" type="range" min="0" max="90" step="5" style="width:100%"></div><label for="panelColor">Panel colours (experimental)</label><select id="panelColor"><option value="original">Original Torn panels</option><option value="charcoal">Charcoal panels</option><option value="forest">Forest panels</option><option value="midnight">Midnight panels</option><option value="purple">Purple panels</option><option value="burgundy">Burgundy panels</option></select><div id="panelOpacityControls"><label for="panelOpacity">Panel opacity: <span id="panelOpacityValue">90%</span></label><input id="panelOpacity" type="range" min="45" max="100" step="5" style="width:100%"></div><label><input id="chatPanels" type="checkbox"> Subtle neon chat borders</label><label for="glowIntensity">Glow intensity: <span id="glowIntensityValue">35%</span></label><input id="glowIntensity" type="range" min="0" max="100" step="5" style="width:100%"><label><input id="rounded" type="checkbox"> Rounded buttons</label><label><input id="glow" type="checkbox"> Hover glow</label><button id="reset">Reset to original Torn</button><small>Cosmetic CSS only. If a page looks wrong, disable this script in PDA and reload.</small></div>`;
document.body.appendChild(host);
const $=id=>shadow.getElementById(id),panel=$('panel'),head=$('head');
for(const id of ['headingFont','chatFont'])$(id).innerHTML=$('font').innerHTML;
function sync(){$('preset').value=presets[prefs.preset]?prefs.preset:'custom';for(const [id,v] of [['enabled',prefs.enabled],['rounded',prefs.round],['glow',prefs.glow],['chatPanels',prefs.chatPanels]])$(id).checked=v;$('theme').value=prefs.theme;$('font').value=prefs.font;$('headingFont').value=prefs.headingFont;$('chatFont').value=prefs.chatFont;$('background').value=prefs.background;$('backgroundImage').value=prefs.backgroundImage;$('dim').value=prefs.dim;$('dimValue').textContent=prefs.dim+'%';$('imageControls').hidden=prefs.background!=='image';$('panelColor').value=prefs.panelColor;$('panelOpacity').value=prefs.panelOpacity;$('panelOpacityValue').textContent=prefs.panelOpacity+'%';$('panelOpacityControls').hidden=prefs.panelColor==='original';$('glowIntensity').value=prefs.glowIntensity;$('glowIntensityValue').textContent=prefs.glowIntensity+'%'}
sync();apply();
$('preset').addEventListener('change',e=>{const p=presets[e.target.value];prefs=p?{...prefs,...p,preset:e.target.value,enabled:true}:{...prefs,preset:'custom'};sync();apply()});
function markCustom(){prefs.preset='custom';$('preset').value='custom'}
$('toggle').onclick=()=>{panel.hidden=!panel.hidden;$('toggle').textContent=panel.hidden?'+':'−'};
for(const [id,k] of [['enabled','enabled'],['rounded','round'],['glow','glow'],['chatPanels','chatPanels']])$(id).addEventListener('change',e=>{markCustom();prefs[k]=e.target.checked;apply()});
for(const k of ['theme','font','headingFont','chatFont','background','panelColor'])$(k).addEventListener('change',e=>{markCustom();prefs[k]=e.target.value;if(k==='background')$('imageControls').hidden=prefs.background!=='image';if(k==='panelColor')$('panelOpacityControls').hidden=prefs.panelColor==='original';apply()});
$('backgroundImage').addEventListener('change',e=>{markCustom();prefs.backgroundImage=e.target.value.trim();apply()});
$('dim').addEventListener('input',e=>{markCustom();prefs.dim=Number(e.target.value);$('dimValue').textContent=prefs.dim+'%';apply()});
$('panelOpacity').addEventListener('input',e=>{markCustom();prefs.panelOpacity=Number(e.target.value);$('panelOpacityValue').textContent=prefs.panelOpacity+'%';apply()});
$('glowIntensity').addEventListener('input',e=>{markCustom();prefs.glowIntensity=Number(e.target.value);$('glowIntensityValue').textContent=prefs.glowIntensity+'%';apply()});
$('reset').onclick=()=>{prefs={...defaults,enabled:false};sync();apply()};
let drag=null;
try{const p=JSON.parse(localStorage.getItem(POS)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){host.style.left=Math.max(0,Math.min(innerWidth-50,p.x))+'px';host.style.top=Math.max(0,Math.min(innerHeight-50,p.y))+'px'}}catch(e){}
head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=host.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture(e.pointerId);e.preventDefault()});
head.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;host.style.left=Math.max(0,Math.min(innerWidth-host.offsetWidth,e.clientX-drag.x))+'px';host.style.top=Math.max(0,Math.min(innerHeight-host.offsetHeight,e.clientY-drag.y))+'px'});
function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;try{localStorage.setItem(POS,JSON.stringify({x:parseFloat(host.style.left),y:parseFloat(host.style.top)}))}catch(err){}}
head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
})();
