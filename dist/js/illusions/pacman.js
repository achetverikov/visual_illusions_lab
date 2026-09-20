import { fit, drawPacman, canvasPoint, circle } from '../utils.js';

const defaults={ speed:4.5, evolveEvery:4, preserve:6, pellets:true, blink:true };
let foundUntil=0;
const target={x:824,y:270,w:112,h:98};

const walls=[
  [95,78,360,78],[520,78,260,78],[845,78,260,78],[95,78,95,210],[260,78,260,205],[585,78,585,205],[850,78,850,205],[1105,78,1105,250],
  [95,250,215,250],[280,250,455,250],[520,250,710,250],[775,250,935,250],[1000,250,1105,250],
  [95,250,95,430],[190,315,190,520],[360,250,360,390],[520,315,520,515],[710,250,710,420],[935,250,935,450],[1105,250,1105,520],
  [95,430,280,430],[345,430,520,430],[585,420,775,420],[840,450,1000,450],
  [95,590,360,590],[425,515,650,515],[715,515,935,515],[1000,520,1105,520],[360,430,360,590],[775,420,775,590],
  [95,590,95,635],[1105,520,1105,635],[95,635,1105,635]
];

function strokeWall(ctx,x1,y1,x2,y2){
  ctx.lineCap='square';ctx.strokeStyle='#184a91';ctx.lineWidth=25;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.strokeStyle='#4e91d7';ctx.lineWidth=10;ctx.stroke();
}

function drawMaze(ctx,changed,pellets){
  ctx.fillStyle='#020206';ctx.fillRect(0,0,1200,675);
  walls.forEach(w=>strokeWall(ctx,...w));
  // This junction silently changes orientation while attention follows Pac-Man.
  if(changed)strokeWall(ctx,880,282,880,365);else strokeWall(ctx,820,325,935,325);
  if(pellets){ctx.fillStyle='#f7db58';for(let x=128;x<1090;x+=54)for(let y=112;y<625;y+=54){if((x+y)%3!==0)circle(ctx,x,y,4,'#f7db58');}}
}

function runner(t,speed){
  const path=[[125,555],[315,555],[315,470],[565,470],[565,375],[820,375],[820,215],[1045,215]];
  const lengths=[];let total=0;for(let i=1;i<path.length;i++){const d=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);lengths.push(d);total+=d;}
  let d=(t/1000*speed)%total;
  for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const a=path[i],b=path[i+1],u=d/lengths[i];return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,dir:Math.atan2(b[1]-a[1],b[0]-a[0]),progress:(t/1000*speed%total)/total};}d-=lengths[i];}
  return {x:path[0][0],y:path[0][1],dir:0,progress:0};
}

export default {
  id:'pacman', short:'Pac-Man change', title:'The mysterious maze of Pac-Man', category:'Attention',
  attribution:{en:'Based on the work of Sebastiaan Mathôt and Theo Danes (University of Groningen, the Netherlands).',no:'Basert på arbeidet til Sebastiaan Mathôt og Theo Danes (University of Groningen, Nederland).'},
  summary:'A source-inspired Infinite Maze regenerates around Pac-Man while multicoloured pearls blink and two ghosts give chase.',
  hint:'Track Pac-Man and the chasing ghosts. The maze is regenerated as they travel—can you catch the moment its distant passages change?',
  reveal:'The maze changes are obvious without the blinking pearls. With many flashes competing for attention—and your eyes following Pac-Man and the ghosts—the same structural changes are easy to miss. You see less than you think.',
  presentationMs:105200,
  presentation({state}){
    const sceneScale=Math.max(5,Number(state.presentationDuration||70))/70;
    return [
    {duration:3000,type:'interstitial',role:'title',freeze:true,sceneAt:0,title:{en:"What's weird about Pac-Man?",no:'Hva er merkelig med Pac-Man?'},credit:{en:'Based on the work of Sebastiaan Mathôt and Theo Danes (University of Groningen, the Netherlands).',no:'Basert på arbeidet til Sebastiaan Mathôt og Theo Danes (University of Groningen, Nederland).'}},
    {duration:2700,type:'pause',freeze:true,sceneAt:0,scene:'ready',title:{en:'Ready',no:'Klar'}},
    {duration:700,type:'pause',freeze:true,sceneAt:0,title:{en:'Go!',no:'Start!'}},
    {duration:21500,type:'continuous',scene:'pearls',catchAtEnd:true,title:{en:'Run, Pac-Man, run!',no:'Løp, Pac-Man, løp!'},text:{en:'Follow Pac-Man and the ghosts.',no:'Følg Pac-Man og spøkelsene.'}},
    {duration:2000,type:'pause',freeze:true,sceneAt:21500*sceneScale,scene:'death',title:{en:'Game over',no:'Spillet er over'}},
    {duration:2200,type:'interstitial',freeze:true,sceneAt:21500*sceneScale,title:{en:'Did you notice anything strange?',no:'La du merke til noe merkelig?'},text:{en:"Maybe not. Let's try again.",no:'Kanskje ikke. Vi prøver en gang til.'}},
    {duration:2700,type:'pause',freeze:true,sceneAt:0,scene:'ready',title:{en:'Ready',no:'Klar'}},
    {duration:700,type:'pause',freeze:true,sceneAt:0,title:{en:'Go!',no:'Start!'}},
    {duration:24200,type:'continuous',scene:'pearls',catchAtEnd:true,title:{en:'Watch closely',no:'Se nøye'},text:{en:'Can you catch the maze changing?',no:'Kan du se når labyrinten endrer seg?'}},
    {duration:2000,type:'pause',freeze:true,sceneAt:24200*sceneScale,scene:'death',title:{en:'Game over',no:'Spillet er over'}},
    {duration:2200,type:'interstitial',freeze:true,sceneAt:24200*sceneScale,title:{en:"So what's going on?",no:'Hva er det som skjer?'}},
    {duration:12150,type:'continuous',scene:'no-pearls',title:{en:'Now you see it…',no:'Nå ser du det …'},text:{en:'Watch the maze without blinking pearls.',no:'Se på labyrinten uten blinkende prikker.'}},
    {duration:12150,type:'continuous',scene:'pearls',title:{en:"Now you don't!",no:'Nå ser du det ikke!'},text:{en:'The same changes are masked by the flashes.',no:'De samme endringene skjules av blinkingen.'}},
    {duration:4500,type:'interstitial',role:'explanation',freeze:true,sceneAt:12150*sceneScale,title:{en:'You see less than you think',no:'Du ser mindre enn du tror'},text:{en:'Flashing pearls and moving characters capture attention, so large maze changes can pass unnoticed.',no:'Blinkende prikker og figurer i bevegelse fanger oppmerksomheten, så store endringer kan passere ubemerket.'}}
    ];
  },
  defaults,
  controls:[
    {key:'speed',label:'Pac-Man speed',type:'range',min:2,max:8,step:.25,format:v=>`${Number(v).toFixed(2)} cells/s`},
    {key:'evolveEvery',label:'Regenerate every',type:'range',min:1,max:15,step:1,format:v=>`${v} steps`},
    {key:'preserve',label:'Protected radius',type:'range',min:2,max:7,step:1,format:v=>`${v} cells`},
    {key:'pellets',label:'Show pearls',type:'toggle'},
    {key:'blink',label:'Blink pearls',type:'toggle'}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#020206');
    const p=runner(t,state.speed),changed=p.progress>=state.changeAt/100;
    drawMaze(ctx,changed,state.pellets);
    const mouth=.12+Math.abs(Math.sin(t/95))*.18;
    drawPacman(ctx,p.x,p.y,19,p.dir,'#ffe84e',mouth);
    const reveal=t>state.revealAfter*1000||performance.now()<foundUntil;
    if(reveal){ctx.strokeStyle='#ff4f70';ctx.lineWidth=7;ctx.setLineDash([12,9]);ctx.strokeRect(target.x,target.y,target.w,target.h);ctx.setLineDash([]);}
    return {phase:reveal?'ANSWER':changed?'MAZE B':'MAZE A',progress:p.progress};
  },
  onPointer(event,canvas){const p=canvasPoint(event,canvas);if(p.x>target.x-35&&p.x<target.x+target.w+35&&p.y>target.y-35&&p.y<target.y+target.h+35){foundUntil=performance.now()+3500;return true;}return false;}
};
