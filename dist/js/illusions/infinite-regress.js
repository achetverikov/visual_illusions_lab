const defaults={
  mode:'vector', count:1, phaseSpeed:2.1, oscillationSpeed:.65,
  amplitude:62, motionDirection:45, innerDirection:135,
  positionX:900, spacing:104, size:100, contrast:82
};
const audience=(enKids,enAdults,noKids,noAdults)=>({en:{kids:enKids,adults:enAdults},no:{kids:noKids,adults:noAdults}});

export default {
  id:'infinite-regress', short:'Infinite regress', title:'Infinite regress', category:'Motion',
  attribution:{en:'Based on the Infinite Regress illusion by Peter Tse and Po-Jang Hsieh, and the Double Drift illusion by Patrick Cavanagh and colleagues.',no:'Basert på Uendelig regress-illusjonen til Peter Tse og Po-Jang Hsieh og Double Drift-illusjonen til Patrick Cavanagh og kolleger.'},
  summary:'Gabor envelopes and their internal gratings move in different directions, combining into a strikingly different apparent path.',
  hint:'Keep your eyes on the black point at the left. Judge the path in peripheral vision, then look directly at the patches to reveal their physical motion.',
  reveal:'The visual system combines the motion of each whole patch with the carrier drifting inside it. Vertical plus horizontal motion can look diagonal; diagonal plus orthogonal motion can look vertical.',
  presentationMs:45000,
  presentation:({copy,state})=>[
    {duration:2500,type:'interstitial',role:'title',freeze:true,sceneAt:0,title:copy.title,text:copy.hint,credit:copy.attribution,settings:{mode:'classic',count:5,motionDirection:90,innerDirection:0}},
    {duration:15000,type:'continuous',text:copy.hint,settings:{mode:'classic',count:5,motionDirection:90,innerDirection:0}},
    {duration:5000,type:'interstitial',role:'transition',freeze:true,sceneAt:0,title:audience('Now try Double Drift','Now compare Cavanagh’s Double Drift','Prøv nå Double Drift','Sammenlign nå med Cavanaghs Double Drift'),text:audience('Focus on the dot. The patch moves diagonally while its stripes move across it—and both reverse together at every turnaround. Which way does it seem to travel?','Keep fixating on the left. The envelope oscillates diagonally and the orthogonal carrier reverses whenever the envelope reverses. Compare the apparent and physical paths.','Fokusér på punktet. Flekken beveger seg diagonalt mens stripene går på tvers – og begge snur samtidig hver gang. Hvilken vei ser flekken ut til å gå?','Fokusér på punktet til venstre. Den ytre formen svinger diagonalt, og den ortogonale bevegelsen inni snur hver gang formen snur. Sammenlign den opplevde og den fysiske banen.'),settings:{mode:'vector',count:1,motionDirection:45,innerDirection:135}},
    {duration:15000,type:'continuous',text:audience('Watch from the corner of your eye, then look straight at the patch. Does its path change?','Judge the trajectory peripherally, then inspect the patch directly and compare.','Se flekken i sidesynet, og se deretter rett på den. Endrer banen seg?','Bedøm banen i sidesynet, se deretter direkte på flekken og sammenlign.'),settings:{mode:'vector',count:1,motionDirection:45,innerDirection:135}},
    {duration:3500,type:'interstitial',role:'explanation',freeze:true,sceneAt:15000,title:{en:'What happened',no:'Hva skjedde?'},text:copy.reveal,settings:{mode:'vector',count:1,motionDirection:45,innerDirection:135}}
  ],
  defaults,
  controls:[
    {key:'mode',label:'Version',type:'select',options:[['classic','Infinite Regress cross'],['vector','Double Drift']]},
    {key:'count',label:'Number of Gabors',type:'range',min:1,max:9,step:1,format:v=>`${v}`},
    {key:'phaseSpeed',label:'Carrier drift',type:'range',min:.25,max:3,step:.05,format:v=>`${Number(v).toFixed(2)} cyc/s`},
    {key:'oscillationSpeed',label:'Oscillation',type:'range',min:.15,max:1.5,step:.05,format:v=>`${Number(v).toFixed(2)} Hz`},
    {key:'amplitude',label:'Motion amplitude',type:'range',min:10,max:90,step:2,format:v=>`${v} px`},
    {key:'motionDirection',label:'Motion direction',type:'range',min:0,max:345,step:15,format:v=>`${v}°`},
    {key:'innerDirection',label:'Inner direction',type:'range',min:0,max:345,step:15,format:v=>`${v}°`},
    {key:'positionX',label:'Horizontal position',type:'range',min:650,max:1080,step:10,format:v=>`${v} px`},
    {key:'spacing',label:'Patch spacing',type:'range',min:65,max:150,step:5,format:v=>`${v} px`},
    {key:'size',label:'Gabor size',type:'range',min:70,max:140,step:5,format:v=>`${v} px`},
    {key:'contrast',label:'Carrier contrast',type:'range',min:25,max:100,step:5,format:v=>`${v}%`}
  ],
  onControlChange(key,value,state){
    if(key!=='mode')return false;
    if(value==='vector')Object.assign(state,{count:1,motionDirection:45,innerDirection:135});
    else Object.assign(state,{count:5,motionDirection:90,innerDirection:0});
    return true;
  },
  draw(){return {phase:'FIXATE LEFT',progress:0};}
};
