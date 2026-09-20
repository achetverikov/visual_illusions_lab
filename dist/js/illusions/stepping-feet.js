import { fit, clamp, circle } from '../utils.js';

const defaults={ mode:'worms', speed:55, contrast:100, stripeWidth:19, bars:7, separation:150 };
const audience=(enKids,enAdults,noKids,noAdults)=>({en:{kids:enKids,adults:enAdults},no:{kids:noKids,adults:noAdults}});

export default {
  id:'stepping-feet', short:'Stepping feet', title:'The stepping feet illusion', category:'Motion',
  attribution:{en:'Based on the work of Stuart Anstis, Akiyoshi Kitaoka, and colleagues (University of California San Diego, USA; Ritsumeikan University, Japan).',no:'Basert på arbeidet til Stuart Anstis, Akiyoshi Kitaoka og kolleger (University of California San Diego, USA; Ritsumeikan University, Japan).'},
  summary:'Two rectangles move in perfect lockstep, but alternating contrast makes them appear to take turns stepping.',
  hint:'Fixate on the red point. Compare the two leading edges—then try low contrast, elongated rectangles, or black and white.',
  reveal:'Their positions and physical lengths are always identical. Contrast at the stripe boundaries makes one edge look delayed, producing either stepping or apparent stretching and contraction.',
  presentationMs:62600,
  presentation:({copy})=>[
    {duration:2500,type:'interstitial',role:'title',freeze:true,sceneAt:0,title:copy.title,text:copy.hint,credit:copy.attribution,settings:{mode:'normal',bars:6,speed:55}},
    {duration:15000,type:'continuous',text:copy.hint,settings:{mode:'normal',bars:6,speed:55}},
    {duration:5000,type:'interstitial',role:'transition',freeze:true,sceneAt:0,title:audience('What if the feet become longer?','Now compare the related “worms” version.','Hva skjer hvis føttene blir lengre?','Sammenlign nå med den beslektede «orm»-versjonen.'),text:audience('They still move together and stay the same length. Watch their ends.','The bars still move together and retain equal physical length. Watch their leading and trailing edges.','De beveger seg fortsatt sammen og er like lange. Se på endene.','Stolpene beveger seg fortsatt sammen og har samme fysiske lengde. Se på for- og bakkantene.'),settings:{mode:'worms',bars:7,speed:55}},
    {duration:15000,type:'continuous',text:audience('Do the long bars seem to stretch and shrink?','Do the equal-length bars appear to stretch and contract?','Ser de lange stolpene ut til å strekkes og krympe?','Ser de like lange stolpene ut til å strekkes og trekke seg sammen?'),settings:{mode:'worms',bars:7,speed:55}},
    {duration:5000,type:'interstitial',role:'transition',freeze:true,sceneAt:0,title:audience('Now make the stripes harder to see','Now reduce the contrast of the grating','Nå gjør vi stripene vanskeligere å se','Nå reduserer vi kontrasten i gitteret'),text:audience('Will the stepping become stronger or weaker?','Compare the apparent stepping when the background edges are less distinct.','Blir steppingeffekten sterkere eller svakere?','Sammenlign den opplevde steppingeffekten når kantene i bakgrunnen blir mindre tydelige.'),settings:{mode:'low',bars:6,speed:55}},
    {duration:10000,type:'continuous',text:audience('Watch the bar ends. Do they still take turns?','Watch the leading edges and compare their apparent timing.','Se på endene. Ser det fortsatt ut som om stolpene bytter på?','Se på forkantene og sammenlign når de ser ut til å bevege seg.'),settings:{mode:'low',bars:6,speed:55}},
    {duration:5000,type:'interstitial',role:'transition',freeze:true,sceneAt:0,title:audience('Finally, remove the colours','Finally, compare the black-and-white version','Til slutt fjerner vi fargene','Sammenlign til slutt med svart-hvitt-versjonen'),text:audience('The bars still move together. What changes now?','The physical motion is unchanged; only the bar colours are removed.','Stolpene beveger seg fortsatt sammen. Hva endrer seg nå?','Den fysiske bevegelsen er uendret; bare fargene på stolpene fjernes.'),settings:{mode:'mono',bars:6,speed:55}},
    {duration:10000,type:'continuous',text:audience('Do the black and white bars still seem to step?','Does the stepping survive when the bars match the grating colours?','Ser de svarte og hvite stolpene fortsatt ut til å ta skritt?','Består steppingeffekten når stolpene har samme farger som gitteret?'),settings:{mode:'mono',bars:6,speed:55}},
    {duration:3500,type:'interstitial',role:'explanation',freeze:true,sceneAt:10000,title:{en:'What happened',no:'Hva skjedde?'},text:copy.reveal,settings:{mode:'mono',bars:6,speed:55}}
  ],
  defaults,
  controls:[
    {key:'mode',label:'Display',type:'select',options:[['normal','Coloured rectangles'],['low','Low-contrast grating'],['worms','Elongated rectangles (“worms”)'],['mono','Black and white']]},
    {key:'speed',label:'Travel speed',type:'range',min:35,max:220,step:5,format:v=>`${v} px/s`},
    {key:'contrast',label:'Grating contrast',type:'range',min:8,max:100,step:2,format:v=>`${v}%`},
    {key:'stripeWidth',label:'Stripe unit',type:'range',min:12,max:30,step:1,format:v=>`${v} px`},
    {key:'bars',label:'Bars per foot',type:'range',min:2,max:14,step:1,format:v=>`${v}`},
    {key:'separation',label:'Vertical gap',type:'range',min:90,max:220,step:5,format:v=>`${v} px`}
  ],
  onControlChange(key,value,state){if(key==='mode')state.bars=value==='worms'?7:6;return key==='mode';},
  draw(ctx,canvas,t,state){
    fit(ctx,canvas,1200,675,'#808080');
    const contrast=clamp((state.mode==='low'?28:state.contrast)/100,0,1);
    const dark=Math.round(127-115*contrast),light=Math.round(127+115*contrast);
    for(let x=0;x<1200;x+=state.stripeWidth){
      const value=(Math.floor(x/state.stripeWidth)%2)?dark:light;
      ctx.fillStyle=`rgb(${value} ${value} ${value})`;ctx.fillRect(x,0,state.stripeWidth+.5,675);
    }
    const units=state.bars,otherUnits=units;
    const topWidth=state.stripeWidth*units,bottomWidth=state.stripeWidth*otherUnits,width=Math.max(topWidth,bottomWidth),height=42;
    const span=1200-width-70,cycle=span*2;
    const distance=(t/1000*state.speed)%cycle;
    const x=35+(distance<=span?distance:cycle-distance);
    const y1=338-state.separation/2,y2=338+state.separation/2;
    ctx.fillStyle=state.mode==='mono'?'#f2f2f2':'#f7f700';ctx.fillRect(x,y1-height/2,topWidth,height);
    ctx.fillStyle=state.mode==='mono'?'#0c0c0c':'#0000a5';ctx.fillRect(x,y2-height/2,bottomWidth,height);
    circle(ctx,600,66,13,'#e5232f');
    return {phase:state.mode==='worms'?`${units} BARS — WORMS`:state.mode==='low'?'LOW CONTRAST':state.mode==='mono'?'BLACK + WHITE':`${units