import illusions from './illusions/index.js?v=19';
import { createPixiStimuli } from './pixi-scenes.js?v=19';
import { uiText, demoText, controlText, presentationCueText } from './i18n.js?v=20';

const $=sel=>document.querySelector(sel);
const storageKey='visual-illusions-lab-v5',legacyKey='visual-illusions-lab-v4',cookiePrefix='vil_settings_v1_';
const helpStorageKey='visual-illusions-help-seen-v1';
const META_DEFAULTS={captionHeight:132,tipFont:20,titleFont:34,supportFont:18,creditFont:12,titleDuration:10,explanationDuration:10,transitionDuration:5,logoEvery:4,logoDuration:10,logoWidth:76};
const META_CONTROLS=[
  {key:'tipFont',label:'tipFont',min:14,max:34,step:1},
  {key:'titleFont',label:'titleFont',min:22,max:56,step:1},
  {key:'supportFont',label:'supportFont',min:14,max:30,step:1},
  {key:'creditFont',label:'creditFont',min:10,max:20,step:1},
  {key:'captionHeight',label:'captionHeight',min:100,max:220,step:4},
  {key:'titleDuration',label:'titleDuration',min:1,max:15,step:.5},
  {key:'explanationDuration',label:'explanationDuration',min:1,max:20,step:.5},
  {key:'transitionDuration',label:'transitionDuration',min:1,max:15,step:.5},
  {key:'logoEvery',label:'logoEvery',min:1,max:12,step:1},
  {key:'logoDuration',label:'logoDuration',min:2,max:30,step:1},
  {key:'logoWidth',label:'logoWidth',min:35,max:92,step:1}
];
const LIVE_DURATION_DEFAULTS={stonehenge:29,'van-lier':12,'stepping-feet':50,'infinite-regress':30,'lilac-chaser':18,'motion-silencing':12,'change-blindness':36,pacman:70,absence:14,'flash-grab':13,'breathing-square':30};
const PRESENTATION_DURATION_CONTROL={key:'presentationDuration',label:'Presentation live time',type:'range',min:5,max:120,step:1,format:v=>`${v} s`};
const PRESENTATION_THEMES={
  stonehenge:{scene:'#050505',panel:'#080a10',text:'#ffffff'},
  'change-blindness':{scene:'#050505',panel:'#080a10',text:'#ffffff'},
  'van-lier':{scene:'oklch(83.46% 0 0)',panel:'oklch(83.46% 0 0)',text:'#111111'},
  'stepping-feet':{scene:'#7f7f7f',panel:'#7f7f7f',text:'#080808'},
  'infinite-regress':{scene:'#bdbdbd',panel:'#bdbdbd',text:'#101010'},
  'lilac-chaser':{scene:'#ffffff',panel:'#ffffff',text:'#111111'},
  'motion-silencing':{scene:'#999999',panel:'#999999',text:'#080808'},
  pacman:{scene:'#020206',panel:'#020206',text:'#ffffff'},
  absence:{scene:'#111111',panel:'#111111',text:'#ffffff'},
  'flash-grab':{scene:'#cccccc',panel:'#cccccc',text:'#101010'},
  'breathing-square':{scene:'#e5e5e5',panel:'#e5e5e5',text:'#101010'}
};

function cookieValue(name){
  const prefix=`${name}=`;
  return document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(prefix))?.slice(prefix.length)||'';
}
function setCookie(name,value){document.cookie=`${name}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;}
function readSaved(){
  try{
    const meta=JSON.parse(decodeURIComponent(cookieValue(`${cookiePrefix}meta`)));
    const states={},copyOverrides={};
    for(const demo of illusions){
      const raw=cookieValue(`${cookiePrefix}${demo.id}`);if(!raw)continue;
      const item=JSON.parse(decodeURIComponent(raw));states[demo.id]=item.state||{};if(item.copy)copyOverrides[demo.id]=item.copy;
    }
    return {...meta,states,copyOverrides};
  }catch{}
  try{return JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem(legacyKey)||'{}');}catch{return {};}
}

const saved=readSaved();
// Move visitors who still have the previous Pac-Man default to the longer,
// reference-paced sequence while preserving deliberate custom durations.
if(saved.states?.pacman?.presentationDuration===26)saved.states.pacman.presentationDuration=70;
if((Number(saved.version)||0)<3&&saved.states?.['stepping-feet']){
  const stepping=saved.states['stepping-feet'];
  if(stepping.speed===96)stepping.speed=55;
  if(stepping.bars===8)stepping.bars=stepping.mode==='worms'?7:6;
}
const migratedCopy={...(saved.copyOverrides||{})};
if(saved.copy&&!saved.copyOverrides){
  for(const demo of illusions){
    const old=saved.copy[demo.id];if(!old)continue;
    const overrides={};if(old.title&&old.title!==demo.title)overrides.title=old.title;if(old.hint&&old.hint!==demo.hint)overrides.hint=old.hint;
    if(Object.keys(overrides).length)migratedCopy[demo.id]={en:overrides};
  }
}

const app={
  index:Math.max(0,Math.min(illusions.length-1,Number(saved.index)||0)),mode:'explore',lang:saved.lang==='no'?'no':'en',age:saved.age==='kids'?'kids':'adults',
  states:Object.fromEntries(illusions.map(d=>[d.id,{...Object.fromEntries(Object.keys(d.defaults).map(key=>[key,saved.states?.[d.id]?.[key]??d.defaults[key]])),presentationDuration:saved.states?.[d.id]?.presentationDuration??LIVE_DURATION_DEFAULTS[d.id]??15}])),copyOverrides:migratedCopy,
  meta:{...META_DEFAULTS,...(saved.meta||{})},started:performance.now(),paused:false,pausedElapsed:0,lastPhase:'',jsPsych:null,pixi:null,
  logoBreak:false,presentedSinceLogo:0,runId:0
};

function settingsSnapshot(){return {version:3,index:app.index,lang:app.lang,age:app.age,meta:app.meta,states:app.states,copyOverrides:app.copyOverrides};}
function persist(){
  const snapshot=settingsSnapshot();try{localStorage.setItem(storageKey,JSON.stringify(snapshot));}catch{}
  try{
    setCookie(`${cookiePrefix}meta`,JSON.stringify({version:3,index:app.index,lang:app.lang,age:app.age,meta:app.meta}));
    for(const demo of illusions)setCookie(`${cookiePrefix}${demo.id}`,JSON.stringify({state:app.states[demo.id],copy:app.copyOverrides[demo.id]||{}}));
  }catch{}
}

function applyMetaSettings(){
  const style=document.documentElement.style,m=app.meta;
  style.setProperty('--presentation-caption-height',`${m.captionHeight}px`);style.setProperty('--presentation-tip-size',`${m.tipFont}px`);
  style.setProperty('--presentation-title-size',`${m.titleFont}px`);style.setProperty('--presentation-support-size',`${m.supportFont}px`);
  style.setProperty('--presentation-credit-size',`${m.creditFont}px`);style.setProperty('--presentation-logo-width',`${m.logoWidth}vw`);style.setProperty('--preview-logo-width',`${m.logoWidth}%`);
}
function applyPresentationTheme(demo=current()){
  const theme=PRESENTATION_THEMES[demo.id]||{scene:'#000',panel:'#080a10',text:'#fff'},stage=$('#stageFrame'),copy=$('#presentationCopy');
  stage.style.setProperty('--scene-bg',theme.scene);copy.style.setProperty('--cue-bg',theme.panel);copy.style.setProperty('--cue-fg',theme.text);
}

function elapsed(){return app.paused?app.pausedElapsed:performance.now()-app.started;}
function restartClock(){app.started=performance.now();app.pausedElapsed=0;app.paused=false;$('#pauseBtn').classList.remove('is-paused');setPauseLabel();}
function current(){return illusions[app.index];}
function state(){return app.states[current().id];}
function copyFor(demo,mode=app.mode==='present'?'presentation':'interactive'){
  const override=app.copyOverrides[demo.id]?.[app.lang]||{},hintKey=`hint_${mode}_${app.age}`;
  return {
    title:override.title||demoText(demo,app.lang,'title',app.age,mode),
    hint:override[hintKey]||demoText(demo,app.lang,'hint',app.age,mode),
    reveal:demoText(demo,app.lang,'reveal',app.age,mode),
    attribution:demoText(demo,app.lang,'attribution',app.age,mode)
  };
}
function translated(value){
  if(!value||typeof value!=='object')return value||'';
  let result=value[app.lang]??value.en??value[app.age]??'';
  if(result&&typeof result==='object')result=result[app.age]??result.adults??result.kids??'';
  return result||'';
}

function genericPresentation(demo){
  const intro=app.meta.titleDuration*1000,explanation=app.meta.explanationDuration*1000,requested=demo.presentationDuration?.(state())??demo.presentationMs,live=Math.max(1000,requested-6000),copy=copyFor(demo,'presentation');
  return [
    {duration:intro,type:'interstitial',role:'title',freeze:true,sceneAt:0,title:copy.title,text:copy.hint,credit:copy.attribution,label:uiText(app.lang,'look')},
    {duration:live,type:'continuous',title:copy.title,text:copy.hint},
    {duration:explanation,type:'interstitial',role:'explanation',freeze:true,sceneAt:live,title:uiText(app.lang,'explanation'),text:copy.reveal,label:uiText(app.lang,'explanation')}
  ];
}
function presentationAt(t=elapsed(),demo=current()){
  if(app.mode!=='present')return null;
  if(app.logoBreak){
    const duration=Math.max(1000,Number(app.meta.logoDuration)*1000);
    return {duration,type:'logo',freeze:true,sceneAt:0,index:0,start:0,local:Math.max(0,Math.min(duration,t)),total:duration};
  }
  const raw=typeof demo.presentation==='function'?demo.presentation({state:state(),lang:app.lang,age:app.age,copy:copyFor(demo,'presentation')}):(demo.presentation||genericPresentation(demo));
  const sourceLive=raw.filter(item=>item.type==='continuous').reduce((sum,item)=>sum+item.duration,0),targetLive=Math.max(5000,Number(state().presentationDuration||15)*1000),liveScale=demo.preservePresentationDurations?1:(sourceLive?targetLive/sourceLive:1);
  const timeline=raw.map((item,index)=>{
    const editorial=presentationCueText(demo,app.lang,app.age,index),sourceDuration=item.duration,duration=item.role==='title'?app.meta.titleDuration*1000:item.role==='explanation'?app.meta.explanationDuration*1000:item.role==='transition'?app.meta.transitionDuration*1000:item.type==='continuous'?item.duration*liveScale:item.duration;
    return editorial?{...item,sourceDuration,duration,title:editorial.title,text:editorial.text}:{...item,sourceDuration,duration};
  });
  const total=timeline.reduce((sum,s)=>sum+s.duration,0);let start=0;
  for(let i=0;i<timeline.length;i++){
    const item=timeline[i],end=start+item.duration;
    if(t<end||i===timeline.length-1)return {...item,index:i,start,local:Math.max(0,Math.min(item.duration,t-start)),total};
    start=end;
  }
  return null;
}
function sceneElapsed(){const cue=presentationAt();if(!cue)return elapsed();if(Number.isFinite(cue.sceneAt))return cue.sceneAt;if(Number.isFinite(cue.sceneOffset))return cue.sceneOffset+(cue.sourceDuration?cue.local%cue.sourceDuration:cue.local);return cue.freeze?0:cue.local;}
function sceneState(){const cue=presentationAt();return cue?.settings?{...state(),...cue.settings}:state();}

function makeNav(){
  const nav=$('#demoNav');nav.innerHTML='';
  illusions.forEach((demo,i)=>{
    const b=document.createElement('button');b.className='nav-item';b.dataset.index=i;
    const num=document.createElement('span');num.className='nav-num';num.textContent=String(i+1).padStart(2,'0');
    const label=document.createElement('span');label.className='nav-label';label.textContent=demoText(demo,app.lang,'short',app.age,'interactive');
    b.append(num,label);b.setAttribute('aria-label',`${i+1}. ${demoText(demo,app.lang,'title',app.age,'interactive')}`);b.addEventListener('click',()=>selectDemo(i));nav.appendChild(b);
  });
}

function notifyControlChange(demo,key,value,values){const rebuild=demo.onControlChange?.(key,value,values);restartClock();persist();if(rebuild)buildControls();}
function buildControls(){
  const demo=current(),values=state(),host=$('#controls');host.innerHTML='';
  [...demo.controls,...(demo.presentationControls||[PRESENTATION_DURATION_CONTROL])].forEach(c=>{
    const text=controlText(demo,c,app.lang),wrap=document.createElement('div');wrap.className='control';const id=`control-${c.key}`;
    if(c.type==='toggle'){
      wrap.classList.add('switch-row');const label=document.createElement('label');label.htmlFor=id;label.textContent=text.label;
      const switchLabel=document.createElement('label');switchLabel.className='switch';const input=document.createElement('input');input.id=id;input.type='checkbox';input.checked=Boolean(values[c.key]);
      switchLabel.append(input,document.createElement('i'));wrap.append(label,switchLabel);input.addEventListener('change',e=>{values[c.key]=e.target.checked;notifyControlChange(demo,c.key,values[c.key],values);});
    }else if(c.type==='select'){
      const head=document.createElement('div');head.className='control-head';const label=document.createElement('label');label.htmlFor=id;label.textContent=text.label;head.appendChild(label);
      const select=document.createElement('select');select.id=id;(text.options||c.options).forEach(([value,labelText])=>{const option=document.createElement('option');option.value=value;option.textContent=labelText;option.selected=String(values[c.key])===String(value);select.appendChild(option);});
      select.addEventListener('change',e=>{values[c.key]=e.target.value;notifyControlChange(demo,c.key,values[c.key],values);});wrap.append(head,select);
    }else{
      const head=document.createElement('div');head.className='control-head';const label=document.createElement('label');label.htmlFor=id;label.textContent=text.label;const output=document.createElement('output');output.value=c.format?c.format(values[c.key]):values[c.key];head.append(label,output);
      const input=document.createElement('input');Object.assign(input,{id,type:'range',min:c.min,max:c.max,step:c.step,value:values[c.key]});
      input.addEventListener('input',e=>{values[c.key]=Number(e.target.value);output.value=c.format?c.format(values[c.key]):values[c.key];persist();});
      input.addEventListener('change',()=>{demo.onControlChange?.(c.key,values[c.key],values);restartClock();persist();});wrap.append(head,input);
    }
    host.appendChild(wrap);
  });
  $('#controlsTitle').textContent=demoText(demo,app.lang,'short',app.age,'interactive');
}

function metaValue(control,value){
  if(control.key==='logoEvery')return `${value} ${app.lang==='no'?'demoer':'demos'}`;
  if(control.key==='logoDuration'||control.key==='titleDuration'||control.key==='explanationDuration'||control.key==='transitionDuration')return `${value} s`;
  if(control.key==='logoWidth')return `${value}%`;
  return `${value} px`;
}
function buildMetaControls(){
  const host=$('#metaControls');host.innerHTML='';
  META_CONTROLS.forEach(control=>{
    const wrap=document.createElement('div');wrap.className='control';const id=`meta-${control.key}`;
    const head=document.createElement('div');head.className='control-head';
    const label=document.createElement('label');label.htmlFor=id;label.textContent=uiText(app.lang,control.label);
    const output=document.createElement('output');output.value=metaValue(control,app.meta[control.key]);head.append(label,output);
    const input=document.createElement('input');Object.assign(input,{id,type:'range',min:control.min,max:control.max,step:control.step,value:app.meta[control.key]});
    input.addEventListener('input',event=>{app.meta[control.key]=Number(event.target.value);output.value=metaValue(control,app.meta[control.key]);applyMetaSettings();persist();});
    wrap.append(head,input);host.appendChild(wrap);
  });
}

function updateText(){
  const demo=current(),copy=copyFor(demo),mode=app.mode==='present'?'presentation':'interactive';$('#demoCategory').textContent=demoText(demo,app.lang,'category',app.age,mode);$('#demoTitle').textContent=copy.title;
  $('#demoSummary').textContent=demoText(demo,app.lang,'summary',app.age,mode);$('#demoCredit').textContent=copy.attribution;$('#demoHint').textContent=copy.hint;$('#presentationTitle').textContent=copy.title;$('#presentationHint').textContent=copy.hint;
  $('#slideNumber').textContent=`${String(app.index+1).padStart(2,'0')} / ${String(illusions.length).padStart(2,'0')}`;$('#titleInput').value=copy.title;$('#hintInput').value=copy.hint;
}
function updateChrome(){
  document.documentElement.lang=app.lang==='no'?'nb':'en';$('#brandTitle').textContent=uiText(app.lang,'brand');
  $('#exploreMode').textContent=uiText(app.lang,'explore');$('#presentMode').textContent=uiText(app.lang,'presentation');$('#metaMode').textContent=uiText(app.lang,'meta');$('#railLabel').textContent=uiText(app.lang,'demos');$('#tryLabel').textContent=uiText(app.lang,'tryThis');
  $('#controlsLabel').textContent=uiText(app.lang,'liveControls');$('#resetBtn').textContent=uiText(app.lang,'reset');$('#copyEditorLabel').textContent=uiText(app.lang,'presentationText');$('#titleLabel').textContent=uiText(app.lang,'title');$('#hintLabel').textContent=uiText(app.lang,'hint');
  $('#gpuLabel').textContent=uiText(app.lang,'gpu');$('#engineLabel').textContent=uiText(app.lang,'engine');$('#langBtn').textContent=app.lang==='en'?'NO':'EN';$('#langBtn').title=uiText(app.lang,'language');$('#ageBtn').textContent=uiText(app.lang,app.age);$('#ageBtn').title=uiText(app.lang,'ageTitle');$('#ageBtn').setAttribute('aria-label',uiText(app.lang,'ageTitle'));
  $('#headerMainSiteLinkLabel').textContent=uiText(app.lang,'mainSite');$('#headerMainSiteLink').setAttribute('aria-label',uiText(app.lang,'mainSite'));
  $('#settingsBtn').textContent=uiText(app.lang,'showSettings');$('#metaSettingsBtn').textContent=uiText(app.lang,'showSettings');$('#settingsTitle').textContent=uiText(app.lang,'settingsTitle');$('#settingsHelp').textContent=uiText(app.lang,'settingsHelp');$('#copySettingsBtn').textContent=uiText(app.lang,'copyJson');$('#settingsCloseBtn').textContent=uiText(app.lang,'close');$('#settingsCloseIcon').setAttribute('aria-label',uiText(app.lang,'close'));
  $('#metaEyebrow').textContent=uiText(app.lang,'presentation');$('#metaTitle').textContent=uiText(app.lang,'metaSettings');$('#metaIntro').textContent=uiText(app.lang,'metaIntro');$('#metaBrandLabel').textContent=uiText(app.lang,'brandPreview');$('#resetMetaBtn').textContent=uiText(app.lang,'resetMeta');
  $('#logoSlideTitle').textContent=uiText(app.lang,'brand');$('#logoSlideSubtitle').textContent=uiText(app.lang,'identityLab');$('#metaBrandTitle').textContent=uiText(app.lang,'brand');$('#metaBrandSubtitle').textContent=uiText(app.lang,'identityLab');
  ['brandDeveloperLabel','logoSlideDeveloperLabel','metaBrandDeveloperLabel'].forEach(id=>$(`#${id}`).textContent=uiText(app.lang,'developedBy'));$('#exitFullscreenLabel').textContent=uiText(app.lang,'exitFullscreen');$('#exitFullscreenBtn').setAttribute('aria-label',uiText(app.lang,'exitFullscreen'));$('#helpBtn').setAttribute('aria-label',uiText(app.lang,'help'));$('#helpBtn').title=uiText(app.lang,'help');$('#helpOverlay').setAttribute('aria-label',uiText(app.lang,'helpTitle'));$('#helpDismiss').textContent=uiText(app.lang,'helpDismiss');setPauseLabel();
}
function updateNav(){document.querySelectorAll('.nav-item').forEach((el,i)=>{el.classList.toggle('is-active',i===app.index);el.setAttribute('aria-current',i===app.index?'true':'false');});}
function refreshLanguage(){updateChrome();makeNav();updateNav();buildControls();buildMetaControls();updateText();persist();}
function selectDemo(index){app.index=(index+illusions.length)%illusions.length;app.runId++;app.lastPhase='';$('#presentationLogo').hidden=true;$('#stageFrame').classList.toggle('showing-interstitial',app.mode==='present');restartClock();updateNav();buildControls();updateText();applyPresentationTheme();persist();}
function next(){app.logoBreak=false;selectDemo(app.index+1);}function prev(){app.logoBreak=false;selectDemo(app.index-1);}
function setMode(mode){
  app.runId++;restartClock();app.mode=mode;const presenting=mode==='present';$('#app').classList.toggle('is-presenting',presenting);$('#app').classList.toggle('is-meta',mode==='meta');
  $('#stageFrame').classList.toggle('showing-interstitial',presenting);
  if(presenting){app.logoBreak=false;app.presentedSinceLogo=0;}else{app.logoBreak=false;$('#presentationLogo').hidden=true;}
  document.querySelectorAll('.mode-btn').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on));});updateText();applyPresentationTheme();
}
function setPauseLabel(){const label=uiText(app.lang,app.paused?'resume':'pause');$('#pauseBtn').setAttribute('aria-label',label);$('#pauseBtn').title=label;}
function togglePause(){if(app.paused){app.started=performance.now()-app.pausedElapsed;app.paused=false;}else{app.pausedElapsed=performance.now()-app.started;app.paused=true;}$('#pauseBtn').classList.toggle('is-paused',app.paused);setPauseLabel();}
async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}}
async function exitPresentationFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();}catch{}setMode('explore');}

const HELP_ITEMS=[
  {target:'#presentMode',key:'helpPresentation',placement:'below'},
  {target:'.demo-rail',key:'helpDemos',placement:'right'},
  {target:'#stageFrame',key:'helpStage',placement:'inside'},
  {target:'#controlPanel',key:'helpControls',placement:'left'},
  {target:'#ageBtn',key:'helpAudience',placement:'below'}
];
function helpPosition(rect,placement,width,height){
  const gap=26,pad=14,vw=innerWidth,vh=innerHeight;let left=rect.left+(rect.width-width)/2,top=rect.bottom+gap;
  if(placement==='right'){left=rect.right+gap;top=rect.top+Math.min(110,Math.max(8,rect.height*.18));}
  else if(placement==='left'){left=rect.left-width-gap;top=rect.top+Math.min(150,Math.max(8,rect.height*.2));}
  else if(placement==='inside'){left=rect.left+24;top=rect.bottom-height-24;}
  left=Math.max(pad,Math.min(vw-width-pad,left));top=Math.max(82,Math.min(vh-height-58,top));return {left,top};
}
function renderHelp(){
  const overlay=$('#helpOverlay');if(overlay.hidden)return;const callouts=$('#helpCallouts'),highlights=$('#helpHighlights'),lines=$('#helpArrowLines');callouts.replaceChildren();highlights.replaceChildren();lines.replaceChildren();const rendered=[];
  HELP_ITEMS.forEach((item,index)=>{const target=$(item.target);if(!target)return;const rect=target.getBoundingClientRect(),style=getComputedStyle(target);if(style.display==='none'||rect.width<2||rect.height<2||rect.bottom<0||rect.top>innerHeight)return;
    const highlight=document.createElement('div');highlight.className='help-highlight';Object.assign(highlight.style,{left:`${Math.max(4,rect.left-5)}px`,top:`${Math.max(4,rect.top-5)}px`,width:`${Math.min(innerWidth-8,rect.width+10)}px`,height:`${Math.min(innerHeight-8,rect.height+10)}px`});highlights.appendChild(highlight);
    const callout=document.createElement('div');callout.className='help-callout';callout.innerHTML=`<b>${index+1}</b>${uiText(app.lang,item.key)}`;callouts.appendChild(callout);const pos=helpPosition(rect,item.placement,callout.offsetWidth,callout.offsetHeight);Object.assign(callout.style,{left:`${pos.left}px`,top:`${pos.top}px`});rendered.push({target:rect,callout});
  });
  const ns='http://www.w3.org/2000/svg';rendered.forEach(({target,callout})=>{const box=callout.getBoundingClientRect(),tx=target.left+target.width/2,ty=target.top+target.height/2,cx=box.left+box.width/2,cy=box.top+box.height/2,line=document.createElementNS(ns,'line');line.setAttribute('x1',String(Math.max(box.left,Math.min(box.right,tx))));line.setAttribute('y1',String(Math.max(box.top,Math.min(box.bottom,ty))));line.setAttribute('x2',String(Math.max(target.left,Math.min(target.right,cx))));line.setAttribute('y2',String(Math.max(target.top,Math.min(target.bottom,cy))));lines.appendChild(line);});
}
function openHelp(){if(app.mode!=='explore')setMode('explore');const overlay=$('#helpOverlay');overlay.hidden=false;try{localStorage.setItem(helpStorageKey,'1');}catch{}requestAnimationFrame(renderHelp);}
function closeHelp(){const overlay=$('#helpOverlay');overlay.hidden=true;$('#helpCallouts').replaceChildren();$('#helpHighlights').replaceChildren();$('#helpArrowLines').replaceChildren();}

function updatePresentation(t,demo,result){
  const cue=presentationAt(t,demo),total=cue?.total||demo.presentationMs,p=Math.min(1,t/total),copy=$('#presentationCopy'),logo=$('#presentationLogo');$('#presentationProgress').style.width=`${p*100}%`;
  if(cue?.type==='logo'){
    logo.hidden=false;copy.classList.add('cue-hidden');$('#stageFrame').classList.remove('showing-interstitial');
    if(t>=total){app.logoBreak=false;next();}
    return;
  }
  logo.hidden=true;
  const type=result?.gameOver?'pause':cue?.type||'continuous';copy.classList.remove('cue-interstitial','cue-pause','cue-continuous','cue-hidden');copy.classList.add(`cue-${type}`);
  $('#stageFrame').classList.toggle('showing-interstitial',type==='interstitial');
  $('#phaseLabel').textContent='';$('#presentationTitle').textContent=result?.gameOver?uiText(app.lang,'gameOver'):(translated(cue?.title)||copyFor(demo,'presentation').title);$('#presentationHint').textContent=result?.gameOver?'':(translated(cue?.text)||'');$('#presentationCredit').textContent=result?.gameOver?'':(translated(cue?.credit)||'');
  if(t>=total){
    app.presentedSinceLogo++;
    if(app.presentedSinceLogo>=Math.max(1,Math.round(app.meta.logoEvery))){app.presentedSinceLogo=0;app.logoBreak=true;restartClock();}
    else next();
  }
}
function acceptFrame(result={}){if(app.pixi?.canvas&&!app.pixi.canvas.id)app.pixi.canvas.id='myCanvas';const demo=current(),t=elapsed();if(result.phase&&result.phase!==app.lastPhase){app.lastPhase=result.phase;$('#statusText').textContent=result.phase;}if(app.mode==='present')updatePresentation(t,demo,result);}
function pointerDown(event){const canvas=app.pixi?.canvas||document.getElementById('myCanvas'),demo=current();if(canvas&&demo.onPointer){const hit=demo.onPointer(event,canvas,state());if(hit)$('#statusText').textContent='FOUND IT';}}

function editCopy(field,value){
  const demo=current(),mode='interactive',key=field==='hint'?`hint_${mode}_${app.age}`:field,base=demoText(demo,app.lang,field,app.age,mode),entry=app.copyOverrides[demo.id]||{},language=entry[app.lang]||{};
  if(!value||value===base)delete language[key];else language[key]=value;if(Object.keys(language).length)entry[app.lang]=language;else delete entry[app.lang];
  if(Object.keys(entry).length)app.copyOverrides[demo.id]=entry;else delete app.copyOverrides[demo.id];updateText();persist();
}
function openSettings(){persist();$('#settingsJson').textContent=JSON.stringify(settingsSnapshot(),null,2);$('#settingsDialog').showModal();}
async function copySettings(){
  const value=$('#settingsJson').textContent;try{await navigator.clipboard.writeText(value);}catch{const range=document.createRange();range.selectNodeContents($('#settingsJson'));getSelection().removeAllRanges();getSelection().addRange(range);}
  const button=$('#copySettingsBtn'),original=uiText(app.lang,'copyJson');button.textContent=uiText(app.lang,'copied');setTimeout(()=>button.textContent=original,1300);
}
function bindUI(){
  document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#pauseBtn').addEventListener('click',togglePause);$('#fullscreenBtn').addEventListener('click',toggleFullscreen);$('#exitFullscreenBtn').addEventListener('click',exitPresentationFullscreen);$('#helpBtn').addEventListener('click',openHelp);$('#helpOverlay').addEventListener('click',closeHelp);$('#langBtn').addEventListener('click',()=>{app.lang=app.lang==='en'?'no':'en';refreshLanguage();});$('#ageBtn').addEventListener('click',()=>{app.age=app.age==='adults'?'kids':'adults';refreshLanguage();restartClock();});
  $('#resetBtn').addEventListener('click',()=>{app.states[current().id]={...current().defaults,presentationDuration:LIVE_DURATION_DEFAULTS[current().id]??15};restartClock();buildControls();persist();});$('#titleInput').addEventListener('input',e=>editCopy('title',e.target.value));$('#hintInput').addEventListener('input',e=>editCopy('hint',e.target.value));
  $('#resetMetaBtn').addEventListener('click',()=>{app.meta={...META_DEFAULTS};applyMetaSettings();buildMetaControls();persist();});
  $('#settingsBtn').addEventListener('click',openSettings);$('#metaSettingsBtn').addEventListener('click',openSettings);$('#copySettingsBtn').addEventListener('click',copySettings);$('#settingsCloseBtn').addEventListener('click',()=>$('#settingsDialog').close());$('#settingsCloseIcon').addEventListener('click',()=>$('#settingsDialog').close());
  document.addEventListener('keydown',e=>{if(!$('#helpOverlay').hidden){if(e.key==='Escape')closeHelp();return;}if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;if(app.mode==='meta'&&e.key!=='Escape'&&e.key.toLowerCase()!=='p')return;if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();else if(e.key===' '){e.preventDefault();togglePause();}else if(e.key.toLowerCase()==='f')toggleFullscreen();else if(e.key.toLowerCase()==='p')setMode(app.mode==='present'?'explore':'present');else if(e.key==='Escape'&&app.mode!=='explore')setMode('explore');});
  window.addEventListener('resize',()=>{if(!$('#helpOverlay').hidden)requestAnimationFrame(renderHelp);});
}

async function startEngine(){
  if(typeof initJsPsych!=='function'||typeof jsPsychPsychophysics==='undefined'||typeof PIXI==='undefined')throw new Error('Psychophysics WebGL engine did not load.');
  app.pixi=new PIXI.Application();await app.pixi.init({width:1280,height:720,background:'#05060a',antialias:true,preference:'webgl'});app.pixi.canvas.setAttribute('aria-label','GPU-rendered visual illusion');app.jsPsych=initJsPsych({display_element:'jspsych-target'});
  const runtime={current,state:sceneState,elapsed,sceneElapsed,presentationState:()=>presentationAt(),runId:()=>app.runId,frame:acceptFrame,pixi:app.pixi};const stimuli=await createPixiStimuli(illusions,runtime);
  await app.jsPsych.run([{type:jsPsychPsychophysics,stimuli,pixi_app:()=>app.pixi,canvas_width:1280,canvas_height:720,background_color:'#05060a',choices:'NO_KEYS',response_type:'key',mouse_down_func:pointerDown}]);
}

updateChrome();makeNav();bindUI();updateNav();buildControls();buildMetaControls();updateText();applyMetaSettings();applyPresentationTheme();persist();
requestAnimationFrame(()=>requestAnimationFrame(()=>{try{if(!localStorage.getItem(helpStorageKey))openHelp();}catch{openHelp();}}));
startEngine().catch(err=>{const host=$('#jspsych-target');host.innerHTML=`<div style="display:grid;place-items:center;height:100%;padding:2rem;text-align:center;color:#ffcf5a">${err.message}</div>`;console.error(err);});
window.addEventListener('beforeunload',()=>app.pixi?.destroy(true,{children:true,texture:true}));
