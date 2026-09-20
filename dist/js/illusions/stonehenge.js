import { fit, drawFixation, clamp } from '../utils.js';

const defaults={adapt:20,reveal:9,hueShift:0,saturation:100,fixation:true,auto:true};
const pillars=[
  [220,326,58,170,-.07],[286,282,72,221,-.025],[377,272,77,230,.025],[485,251,83,258,-.018],
  [592,267,78,247,.018],[695,278,77,231,-.018],[790,302,68,204,.03],[874,326,56,176,.055],[968,350,46,145,.07]
];
const lintels=[[270,264,193,50,-.02],[470,231,212,54,.01],[679,274,186,48,.015]];

function pillarPath(ctx,[x,y,w,h,tilt]){
  ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(tilt);ctx.beginPath();
  ctx.moveTo(-w*.45,-h*.5);ctx.lineTo(w*.37,-h*.48);ctx.lineTo(w*.49,h*.45);ctx.lineTo(w*.27,h*.5);ctx.lineTo(-w*.47,h*.46);ctx.closePath();
}
function lintelPath(ctx,[x,y,w,h,tilt]){
  ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(tilt);ctx.beginPath();
  ctx.moveTo(-w*.5,-h*.36);ctx.lineTo(w*.45,-h*.5);ctx.lineTo(w*.5,h*.34);ctx.lineTo(-w*.42,h*.5);ctx.closePath();
}
function drawClouds(ctx){
  ctx.fillStyle='#525252';
  [[90,118,170,47],[285,96,210,57],[505,130,185,46],[720,86,225,61],[985,125,195,48],[1130,73,135,43]].forEach(([x,y,rx,ry])=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.08,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#777';
  [[10,184,170,35],[382,174,250,38],[802,177,260,41],[1120,192,180,34]].forEach(([x,y,rx,ry])=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,.04,0,Math.PI*2);ctx.fill();});
}
function drawStones(ctx,colours,details=true){
  pillars.forEach((p,i)=>{
    pillarPath(ctx,p);ctx.fillStyle=colours[i%colours.length];ctx.fill();
    if(details){ctx.clip();ctx.fillStyle='rgba(0,0,0,.17)';ctx.fillRect(p[2]*.12-p[2]/2,-p[3]/2,p[2]*.38,p[3]);ctx.fillStyle='rgba(255,255,255,.13)';ctx.fillRect(-p[2]/2,-p[3]/2,p[2]*.15,p[3]);}
    ctx.restore();
  });
  lintels.forEach((p,i)=>{lintelPath(ctx,p);ctx.fillStyle=colours[(i+1)%colours.length];ctx.fill();ctx.restore();});
}
function drawBase(ctx){
  const sky=ctx.createLinearGradient(0,0,0,470);sky.addColorStop(0,'#777');sky.addColorStop(.58,'#aaa');sky.addColorStop(1,'#d1d1d1');ctx.fillStyle=sky;ctx.fillRect(0,0,1200,675);
  drawClouds(ctx);
  ctx.fillStyle='#989898';ctx.beginPath();ctx.moveTo(0,440);ctx.quadraticCurveTo(270,404,560,444);ctx.quadraticCurveTo(870,391,1200,438);ctx.lineTo(1200,675);ctx.lineTo(0,675);ctx.fill();
  const ground=ctx.createLinearGradient(0,430,0,675);ground.addColorStop(0,'#999');ground.addColorStop(1,'#565656');ctx.fillStyle=ground;ctx.fillRect(0,462,1200,213);
  ctx.fillStyle='rgba(25,25,25,.25)';ctx.beginPath();ctx.ellipse(610,529,438,48,-.02,0,Math.PI*2);ctx.fill();
  drawStones(ctx,['#8b8b8b','#a3a3a3','#757575']);
  for(let i=0;i<24;i++){const x=30+i*51+(i%4)*7,y=520+Math.sin(i*1.63)*14;ctx.fillStyle=i%3?'#686868':'#7b7b7b';ctx.beginPath();ctx.ellipse(x,y,20+i%5*4,7+i%3*3,-.18,0,Math.PI*2);ctx.fill();}
}
function colourise(ctx,hueShift,saturation){
  ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha=clamp(saturation/100,0,1);
  const sky=ctx.createLinearGradient(0,0,0,470);sky.addColorStop(0,`hsl(${18+hueShift} 92% 39%)`);sky.addColorStop(.6,`hsl(${28+hueShift} 86% 56%)`);sky.addColorStop(1,`hsl(${333+hueShift} 70% 42%)`);ctx.fillStyle=sky;ctx.fillRect(0,0,1200,462);
  ctx.fillStyle=`hsl(${266+hueShift} 84% 61%)`;ctx.fillRect(0,438,1200,237);
  drawStones(ctx,[`hsl(${207+hueShift} 63% 65%)`,`hsl(${286+hueShift} 42% 72%)`,`hsl(${224+hueShift} 56% 52%)`],false);
  ctx.restore();
}

export default{
  id:'stonehenge',short:'Stonehenge',title:'Colour aftereffect: Stonehenge',category:'Aftereffect',
  summary:'Adapt to an oddly coloured but structurally identical scene, then watch the same scene turn physically grey.',
  hint:'Keep your eyes on the centre marker. When the image turns grey, Stonehenge may briefly look naturally coloured.',
  reveal:'The two phases contain exactly the same contours and luminance structure. Only the adapter carries colour; opponent-channel adaptation supplies the fleeting colours in the grey reveal.',
  presentationMs:21000,presentationDuration:s=>6000+(s.adapt+s.reveal)*1000,defaults,
  controls:[
    {key:'adapt',label:'Adaptation time',type:'range',min:4,max:20,step:1,format:v=>`${v} s`},
    {key:'reveal',label:'Grey reveal',type:'range',min:2,max:9,step:1,format:v=>`${v} s`},
    {key:'hueShift',label:'Palette hue',type:'range',min:0,max:359,step:1,format:v=>`${v}°`},
    {key:'saturation',label:'Colour strength',type:'range',min:35,max:120,step:5,format:v=>`${v}%`},
    {key:'fixation',label:'Fixation marker',type:'toggle'},
    {key:'auto',label:'Repeat automatically',type:'toggle'}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas);const cycle=(state.adapt+state.reveal)*1000,local=state.auto?t%cycle:Math.min(t,cycle-1),grey=local>=state.adapt*1000;
    drawBase(ctx);if(!grey)colourise(ctx,state.hueShift,state.saturation);if(state.fixation)drawFixation(ctx,600,338,10,'#171717',true);
    retur