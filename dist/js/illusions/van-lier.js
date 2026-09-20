import { fit, starPath, circle, oklch } from '../utils.js';

// Paper chromaticities converted to OKLCH: red h=18.4°, cyan h=192.6°.
// Shared L and C keep the two adapter colours perceptually matched.
const defaults={ filled:1, contour:.5, hueA:18.4, hueB:192.6, lightness:74.6, chroma:.076, lineWidth:3, auto:true, fixation:true };
const BG=oklch(83.46,0,0),CENTRE=oklch(75.40,0,0);

function colouredPair(ctx,state){
  ctx.fillStyle=BG;ctx.fillRect(0,0,1200,675);
  for(const x of [360,840]){
    starPath(ctx,x,338,180,68,4,0);ctx.fillStyle=oklch(state.lightness,state.chroma,state.hueA);ctx.fill();
    starPath(ctx,x,338,180,68,4,Math.PI/4);ctx.fillStyle=oklch(state.lightness,state.chroma,state.hueB);ctx.fill();
    ctx.save();starPath(ctx,x,338,180,68,4,0);ctx.clip();starPath(ctx,x,338,180,68,4,Math.PI/4);ctx.clip();ctx.fillStyle=CENTRE;ctx.fillRect(x-181,157,362,362);ctx.restore();
  }
}

function outlinePair(ctx,lineWidth,swapped){
  ctx.fillStyle=BG;ctx.fillRect(0,0,1200,675);
  ctx.strokeStyle=oklch(47,0,0);ctx.lineWidth=lineWidth;ctx.lineJoin='round';
  starPath(ctx,360,338,180,68,4,swapped?0:Math.PI/4);ctx.stroke();
  starPath(ctx,840,338,180,68,4,swapped?Math.PI/4:0);ctx.stroke();
}

export default {
  id:'van-lier', short:'Colour filling', title:'Colour filling after the image', category:'Aftereffect',
  attribution:{en:'Based on the work of Rob van Lier, Mark Vergeer, Stuart Anstis, and colleagues (Radboud University, the Netherlands; University of California San Diego, USA).',no:'Basert på arbeidet til Rob van Lier, Mark Vergeer, Stuart Anstis og kolleger (Radboud University, Nederland; University of California San Diego, USA).'},
  summary:'Alternating a coloured adapter with two different contours makes complementary colour appear to fill the empty shapes.',
  hint:'Hold your gaze on the tiny central dot. On the outline frames, compare the colour that seems to fill the left and right stars.',
  reveal:'The same overlapping coloured adapter precedes both targets, but each later contour selects different regions of the afterimage for perceptual filling-in.',
  presentationMs:18000, defaults,
  controls:[
    {key:'filled',label:'Filled frame',type:'range',min:.5,max:4,step:.25,format:v=>`${v} s`},
    {key:'contour',label:'Each contour frame',type:'range',min:.25,max:2,step:.25,format:v=>`${v} s`},
    {key:'hueA',label:'First colour hue',type:'range',min:0,max:359,step:1,format:v=>`${Number(v).toFixed(0)}°`},
    {key:'hueB',label:'Second colour hue',type:'range',min:0,max:359,step:1,format:v=>`${Number(v).toFixed(0)}°`},
    {key:'lightness',label:'OKLCH lightness (L)',type:'range',min:45,max:90,step:.5,format:v=>`${Number(v).toFixed(1)}%`},
    {key:'chroma',label:'OKLCH chroma (C)',type:'range',min:0,max:.16,step:.002,format:v=>Number(v).toFixed(3)},
    {key:'lineWidth',label:'Contour thickness',type:'range',min:1,max:8,step:1,format:v=>`${v} px`},
    {key:'fixation',label:'Fixation point',type:'toggle'},
    {key:'auto',label:'Repeat automatically',type:'toggle'}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#000');
    const filledMs=state.filled*1000,contourMs=state.contour*1000,cycle=filledMs+2*contourMs;
    const local=state.auto?t%cycle:Math.min(t,cycle-1),adapting=local<filledMs,swapped=local>=filledMs+contourMs;
    adapting?colouredPair(ctx,state):outlinePair(ctx,state.lineWidth,swapped);
    if(state.fixation)circle(ctx,600,338,4,'#181818');
    return {phase:adapting?'COLOUR':swapped?'CONTOU