import { fit, TAU, circle, hsl, seeded } from '../utils.js';

const defaults={ dots:108, rotation:130, switchEvery:.5, change:105, dotSize:14, innerRadius:118, motion:true, compare:true, stillDuration:3, moveDuration:5 };

export default {
  id:'motion-silencing', short:'Motion silencing', title:'Motion silences change', category:'Change perception',
  attribution:{en:'Based on the work of Jordan Suchow, George Alvarez, and colleagues (Harvard University, USA).',no:'Basert på arbeidet til Jordan Suchow, George Alvarez og kolleger (Harvard University, USA).'},
  summary:'More than a hundred evenly packed dots keep changing hue, yet those colour changes become much harder to see when the field rotates.',
  hint:'Fixate on the tiny white point. Toggle field motion off and on without changing the colour-change rate.',
  reveal:'The hues never stop changing. Rapid displacement makes it difficult to maintain object correspondence, silencing awareness of each dot’s local colour change.',
  presentationMs:18000, defaults,
  controls:[
    {key:'dots',label:'Total dots',type:'range',min:54,max:144,step:9,format:v=>`${v}`},
    {key:'rotation',label:'Rotation speed',type:'range',min:20,max:180,step:5,format:v=>`${v}°/s`},
    {key:'switchEvery',label:'Reverse direction',type:'range',min:.1,max:5,step:.1,format:v=>`${Number(v).toFixed(1)} s`},
    {key:'change',label:'Hue-change rate',type:'range',min:20,max:190,step:5,format:v=>`${v}°/s`},
    {key:'dotSize',label:'Dot radius',type:'range',min:7,max:20,step:1,format:v=>`${v} px`},
    {key:'innerRadius',label:'Clear inner radius',type:'range',min:60,max:180,step:5,format:v=>`${v} px`},
    {key:'motion',label:'Field motion',type:'toggle'},
    {key:'compare',label:'Alternate still / moving',type:'toggle'},
    {key:'stillDuration',label:'Still duration',type:'range',min:.5,max:8,step:.25,format:v=>`${Number(v).toFixed(2)} s`},
    {key:'moveDuration',label:'Moving duration',type:'range',min:.5,max:10,step:.25,format:v=>`${Number(v).toFixed(2)} s`}
  ],
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#999');ctx.fillStyle='#999';ctx.fillRect(0,0,1200,675);
    const seconds=t/1000,stillDuration=Math.max(.05,state.stillDuration||3),moveDuration=Math.max(.05,state.moveDuration||5),cycle=stillDuration+moveDuration,local=seconds%cycle;
    const moving=state.motion&&(!state.compare||local>=stillDuration);
    const motionSeconds=state.compare?Math.floor(seconds/cycle)*moveDuration+Math.max(0,local-stillDuration):seconds;
    const reverse=Math.max(.1,state.switchEvery),segment=Math.floor(motionSeconds/reverse),within=motionSeconds%reverse;
    const signedTime=segment%2===0?within:reverse-within;
    const rot=state.motion?signedTime*state.rotation*Math.PI/180:0;
    const perRing=Math.floor(state.dots/3);
    for(let ring=0;ring<3;ring++)for(let j=0;j<perRing;j++){
      const i=ring*perRing+j;
      const a=seeded(i*17+3)*TAU+rot;
      const r=145+ring*55+(seeded(i*17+5)-.5)*48;
      const hue=seeded(i)*360+t/1000*state.change;
      circle(ctx,600+Math.cos(a)*r,338+Math.sin(a)*r,state.dotSize,hsl(hue,100,52));
    }
    circle(ctx,600,338,4,'#fff');
    return {phase:moving?(segment%2?'COUNTERCLOCKWISE':'CLOCKWISE'):'STILL',progress:state.compare?local/cycle:(t%10000)/10000};
  }
};
