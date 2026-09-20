import { fit, TAU, circle, hsl } from '../utils.js';

const defaults={ dots:10, interval:120, radius:215, sigma:30, colour:303, fixation:false };

function softDot(ctx,x,y,r,blur,hue){
  const g=ctx.createRadialGradient(x,y,0,x,y,r+blur);
  g.addColorStop(0,hsl(hue,100,49,.98));
  g.addColorStop(Math.max(.15,r/(r+blur)),hsl(hue,100,52,.9));
  g.addColorStop(1,hsl(hue,100,60,0));
  ctx.fillStyle=g;ctx.fillRect(x-r-blur,y-r-blur,(r+blur)*2,(r+blur)*2);
}

export default {
  id:'lilac-chaser', short:'Lilac chaser', title:'Lilac chaser', category:'Afterimage & fading',
  attribution:{en:'Based on the illusion invented by Jeremy Hinton.',no:'Basert på illusjonen utviklet av Jeremy Hinton.'},
  summary:'A gap runs around ten soft magenta dots; with steady fixation, a green afterimage chases it and the stationary dots may fade.',
  hint:'Keep your eyes steady at the empty centre for 20–30 seconds. Look for a green dot following the moving gap.',
  reveal:'The sequential gap supplies apparent motion, the green opponent-colour afterimage follows it, and unchanging peripheral dots undergo Troxler fading.',
  presentationMs:24000, defaults,
  controls:[
    {key:'dots',label:'Ring positions',type:'range',min:8,max:16,step:1,format:v=>`${v}`},
    {key:'interval',label:'Step interval',type:'range',min:65,max:260,step:5,format:v=>`${v} ms`},
    {key:'radius',label:'Ring radius',type:'range',min:150,max:265,step:5,format:v=>`${v} px`},
    {key:'sigma',label:'Gaussian sigma',type:'range',min:8,max:30,step:1,format:v=>`${v} px`},
    {key:'colour',label:'Dot hue',type:'range',min:285,max:325,step:1,format:v=>`${v}°`},
    {key:'fixation',label:'Show centre point',type:'toggle'}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#fff');ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,675);
    const missing=Math.floor(t/state.interval)%state.dots;
    for(let i=0;i<state.dots;i++){
      if(i===missing)continue;
      const a=-Math.PI/2+i*TAU/state.dots;
      softDot(ctx,600+Math.cos(a)*state.radius,338+Math.sin(a)*state.radius,state.sigma,state.sigma*2,state.colour);
    }
    if(state.fixation)circle(ctx,600,338,4,'#202020');
    return {phase:'FIXATE',progress:(t%24000)/24000};
  }
};
