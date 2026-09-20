import { fit } from '../utils.js';

const defaults={ empty:5, reveal:4, verify:5, auto:true };
const visible=new Image(),occluded=new Image();
visible.src='./assets/absence-visible.png';
occluded.src='./assets/absence-occluded.png';

function drawContained(ctx,img){
  if(!img.complete||!img.naturalWidth){ctx.fillStyle='#17181b';ctx.fillRect(0,0,1200,675);ctx.fillStyle='#fff';ctx.font='600 22px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('Loading supplied scene…',600,338);return;}
  const s=Math.min(1200/img.naturalWidth,675/img.naturalHeight),w=img.naturalWidth*s,h=img.naturalHeight*s;
  ctx.fillStyle='#111';ctx.fillRect(0,0,1200,675);ctx.drawImage(img,(1200-w)/2,(675-h)/2,w,h);
}

export default {
  id:'absence', short:'Illusion of absence', title:'The illusion of absence', category:'Occlusion',
  attribution:{en:'Based on the work of Vebjørn Ekroll, Rob van Lier, and colleagues (University of Bergen, Norway; Radboud University, the Netherlands).',no:'Basert på arbeidet til Vebjørn Ekroll, Rob van Lier og kolleger (Universitetet i Bergen, Norge; Radboud University, Nederland).'},
  summary:'A table first looks perfectly empty behind a grid. Revealing the objects makes it seem impossible that all of them could have been there moments earlier.',
  hint:'Start with the covered scene: “Wow, a perfectly empty table.” Then watch the reveal—and ask whether all those objects could really have been hidden.',
  reveal:'They were hidden all along. The visual system completes the uninterrupted table surface behind the grid, so the object-filled regions are experienced as absence rather than occlusion.',
  presentationMs:20500,
  presentation({state,lang,copy}){
    const no=lang==='no',empty=state.empty*1000,reveal=state.reveal*1000,verify=state.verify*1000;
    return [
      {duration:3000,type:'interstitial',role:'title',freeze:true,sceneAt:0,title:copy.title,text:copy.hint,credit:copy.attribution,label:no?'Se':'Look'},
      {duration:empty,type:'continuous',sceneOffset:0,text:no?'Wow – se på det helt tomme bordet.':'Wow—look at the perfectly empty table.'},
      {duration:reveal,type:'continuous',sceneOffset:empty,text:no?'Kunne alle disse tingene ha vært skjult av gitteret? Aldri!':'Could all these objects have been hidden by the grid? No way!'},
      {duration:verify,type:'continuous',sceneOffset:empty+reveal,text:no?'La oss prøve igjen. De er faktisk skjult der.':'Let’s try again. They really are hidden there.'},
      {duration:3500,type:'interstitial',role:'explanation',freeze:true,sceneAt:empty+1000,title:no?'Hva skjedde':'What happened',text:no?'Synssystemet fullfører den sammenhengende bordflaten bak gitteret, så de skjulte tingene oppleves som fraværende.':'The visual system completes the table surface behind the grid, so the hidden objects are experienced as absent.',label:no?'Hva skjedde':'What happened'}
    ];
  },
  defaults,
  controls:[
    {key:'empty',label:'“Empty table” phase',type:'range',min:2,max:10,step:1,format:v=>`${v} s`},
    {key:'reveal',label:'Objects revealed',type:'range',min:2,max:10,step:1,format:v=>`${v} s`},
    {key:'verify',label:'Try-again phase',type:'range',min:2,max:10,step:1,format:v=>`${v} s`},
    {key:'auto',label:'Repeat automatically',type:'toggle'}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#111');
    const a=state.empty*1000,b=state.reveal*1000,c=state.verify*1000,cycle=a+b+c,local=state.auto?t%cycle:Math.min(t,cycle-1);
    const phase=local<a?0:local<a+b?1:2,verifyObjects=phase===2&&Math.floor((local-a-b)/500)%2===1;
    drawContained(ctx,phase===1||verifyObjects?visible:occluded);
    return {phase:phase===0?'EMPTY TABLE?':phase===1?'REVEAL':