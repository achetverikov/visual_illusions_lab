import { fit, circle, canvasPoint, seeded } from '../utils.js';

const defaults={ sceneTime:560, blankTime:140, revealAfter:14, blankColour:'dark', example:'tourists', presentationImages:3, guessTime:12, answerTime:4 };
let foundUntil=0;

function cloud(ctx,x,y,s){
  ctx.fillStyle='rgba(255,255,255,.78)';
  circle(ctx,x,y,22*s,'rgba(255,255,255,.78)');circle(ctx,x+25*s,y-8*s,29*s,'rgba(255,255,255,.78)');circle(ctx,x+58*s,y,21*s,'rgba(255,255,255,.78)');
  ctx.fillRect(x,y,58*s,22*s);
}

function drawFarm(ctx,changed,state){
  const sky=ctx.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#83b5ce');sky.addColorStop(1,'#d6e2d2');ctx.fillStyle=sky;ctx.fillRect(0,0,1200,675);
  if(!(changed&&state.change==='cloud')){cloud(ctx,130,100,1.1);cloud(ctx,920,80,.8);}
  ctx.fillStyle='#58794a';ctx.fillRect(0,310,1200,150);
  for(let i=0;i<28;i++){const x=i*47-30,y=300-seeded(i)*55;circle(ctx,x,y,55+seeded(i+80)*28,['#497747','#638448','#7f873d'][i%3]);}

  // Barn and roof.
  ctx.fillStyle='#9e4536';ctx.fillRect(208,235,275,194);
  ctx.beginPath();ctx.moveTo(178,250);ctx.lineTo(345,130);ctx.lineTo(520,250);ctx.closePath();ctx.fillStyle='#7c352f';ctx.fill();
  ctx.fillStyle='#ece7d9';ctx.fillRect(322,174,45,52);ctx.fillStyle='#45352c';ctx.fillRect(300,321,92,108);
  if(!(changed&&state.change==='door')){ctx.strokeStyle='#d7c7ab';ctx.lineWidth=6;ctx.strokeRect(300,321,92,108);ctx.beginPath();ctx.moveTo(300,321);ctx.lineTo(392,429);ctx.moveTo(392,321);ctx.lineTo(300,429);ctx.stroke();}

  // Silo; the dome is the main video-inspired change.
  ctx.fillStyle='#d6d6c8';ctx.fillRect(495,160,132,271);
  if(!(changed&&state.change==='silo')){ctx.beginPath();ctx.ellipse(561,160,66,47,0,Math.PI,0);ctx.fillStyle='#bfc1b6';ctx.fill();}
  ctx.strokeStyle='rgba(83,86,80,.22)';ctx.lineWidth=3;for(let y=185;y<425;y+=34){ctx.beginPath();ctx.moveTo(500,y);ctx.lineTo(622,y);ctx.stroke();}
  ctx.fillStyle='#dde0d3';ctx.beginPath();ctx.moveTo(625,300);ctx.lineTo(795,222);ctx.lineTo(914,300);ctx.closePath();ctx.fill();ctx.fillRect(625,298,289,132);

  // Dense cornfield texture.
  const field=ctx.createLinearGradient(0,390,0,675);field.addColorStop(0,'#b8ad58');field.addColorStop(1,'#667a2f');ctx.fillStyle=field;ctx.fillRect(0,405,1200,270);
  ctx.lineWidth=2;
  for(let i=0;i<520;i++){const x=seeded(i*3)*1200,y=405+seeded(i*3+1)*270,h=8+seeded(i*3+2)*27;ctx.strokeStyle=i%3?'rgba(235,220,108,.34)':'rgba(54,86,35,.45)';ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y);ctx.stroke();}
}

const targets={
  airplane:{x:648,y:183,w:218,h:184},farm:{x:300,y:126,w:232,h:186},tourists:{x:277,y:70,w:295,h:212},
  chopper:{x:150,y:566,w:760,h:104},dinner:{x:150,y:210,w:900,h:252},money:{x:525,y:210,w:175,h:365}
};
function targetFor(state){return targets[state.example]||targets.airplane;}

const demo={
  id:'change-blindness', short:'Change blindness', title:'Change blindness', category:'Attention',
  attribution:{en:'Based on the work of Ronald Rensink and colleagues (University of British Columbia, Canada).',no:'Basert på arbeidet til Ronald Rensink og kolleger (University of British Columbia, Canada).'},
  summary:'Authentic Rensink flicker images alternate with a brief blank. Even a large change can remain hard to spot when its local transient is removed.',
  hint:'Compare scene A and B. The blank is short—but long enough to hide the usual visual “pop”. Can you find the changing object?',
  reveal:'Without a local motion transient, attention must compare scene details across time. The feeling of a complete scene is much richer than the stored detail available for comparison.',
  preservePresentationDurations:true,
  presentation:({state,copy})=>{
    const examples=['farm','money','tourists','airplane','chopper','dinner'].slice(0,state.presentationImages);
    return examples.flatMap((example,index)=>[
      {duration:state.guessTime*1000,type:'continuous',text:copy.hint,credit:index===0?copy.attribution:'',settings:{example,revealAfter:999}},
      {duration:state.answerTime*1000,type:'continuous',text:{en:'Solution',no:'Løsning'},settings:{example,revealAfter:0}}
    ]);
  },
  defaults,
  controls:[
    {key:'sceneTime',label:'Image duration',type:'range',min:180,max:1200,step:20,format:v=>`${v} ms`},
    {key:'blankTime',label:'Blank interval',type:'range',min:40,max:400,step:10,format:v=>`${v} ms`},
    {key:'revealAfter',label:'Reveal answer after',type:'range',min:5,max:25,step:1,format:v=>`${v} s`},
    {key:'example',label:'Rensink example',type:'select',options:[['airplane','Airplane'],['farm','Farm'],['tourists','Tourists'],['chopper','Chopper & truck'],['dinner','Dinner'],['money','Money']]},
    {key:'blankColour',label:'Blank screen',type:'select',options:[['dark','Dark'],['light','Light']]}
  ],
  presentationControls:[
    {key:'presentationImages',label:'Images in presentation',type:'range',min:1,max:6,step:1,format:v=>String(v)},
    {key:'guessTime',label:'Guess time per image',type:'range',min:3,max:30,step:1,format:v=>`${v} s`},
    {key:'answerTime',label:'Answer time per image',type:'range',min:1,max:15,step:1,format:v=>`${v} s`}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas);const period=state.sceneTime*2+state.blankTime*2,local=t%period;let changed=false,blank=false;
    if(local<state.sceneTime)changed=false;else if(local<state.sceneTime+state.blankTime)blank=true;else if(local<state.sceneTime*2+state.blankTime)changed=true;else blank=true;
    if(blank){ctx.fillStyle=state.blankColour==='dark'?'#050505':'#deded8';ctx.fillRect(0,0,1200,675);}else drawFarm(ctx,changed,state);
    const reveal=t>state.revealAfter*1000||performance.now()<foundUntil;
    if(reveal&&!blank){const q=targetFor(state);ctx.strokeStyle='#ff405d';ctx.lineWidth=8;ctx.setLineDash([13,10]);ctx.strokeRect(q.x,q.y,q.w,q.h);ctx.setLineDash([]);}
    return {phase:reveal?'ANSWER':blank?'BLANK':changed?'SCENE B':'SCENE A',progress:(t%(state.revealAfter*1000))/(state.revealAfter*1000)};
  },
  onPointer(event,canvas,state){const p=canvasPoint(event,canvas),q=targetFor(state);if(p.x>q.x-25&&p.x<q.x+q.w+25&&p.y>q.y-25&&p.y<q.y+q.h+25){foundUntil=performance.now()+3500;return true;}return false;}
};
export default demo;
