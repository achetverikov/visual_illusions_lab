const defaults={speed:30,gap:18,autoGap:true,gapCycle:30,squareSize:420,squareHue:240,coverHue:36,rotation:true};

export default{
  id:'breathing-square',short:'Breathing square',title:'The breathing square',category:'Motion and form',
  attribution:{en:'Based on the demonstration by Michael Bach (University of Freiburg, Germany), drawing on work by Shiffrar, Pavel, Bruno, and colleagues.',no:'Basert på demonstrasjonen til Michael Bach (Universitetet i Freiburg, Tyskland), med utgangspunkt i arbeid av Shiffrar, Pavel, Bruno og kolleger.'},
  summary:'A rigid blue square rotates behind four orange occluders, yet its partly hidden boundary seems to expand, contract, and bend.',
  hint:'Track the blue shape through the cross-shaped opening. Does it keep the same size and shape while it rotates?',
  reveal:'The blue square is perfectly rigid and never changes size. Occlusion breaks its moving boundary into fragments, and the visual system does not always bind those fragments into one rigid surface.',
  presentationMs:18000,defaults,
  controls:[
    {key:'speed',label:'Rotation speed',type:'range',min:5,max:90,step:1,format:v=>`${v}°/s`},
    {key:'gap',label:'Opening width',type:'range',min:2,max:220,step:2,format:v=>`${v*2} px`},
    {key:'autoGap',label:'Vary opening slowly',type:'toggle'},
    {key:'gapCycle',label:'Opening cycle',type:'range',min:8,max:60,step:1,format:v=>`${v} s`},
    {key:'squareSize',label:'Square size',type:'range',min:380,max:650,step:5,format:v=>`${v} px`},
    {key:'squareHue',label:'Square hue',type:'range',min:180,max:280,step:1,format:v=>`${v}°`},
    {key:'coverHue',label:'Occluder hue',type:'range',min:0,max:70,step:1,format:v=>`${v}°`},
    {key:'rotation',label:'Rotate square',type:'toggle'}
  ],
  draw(){return {phase:'RIGID ROTATION