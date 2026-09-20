const defaults={rotation:95,reverseEvery:.63,flashMs:80,radius:170,contrast:14,circleCycle:13,lineWidth:10,blankDuringFlash:true,fixation:true};

export default{
  id:'flash-grab',short:'Flash grab',title:'The flash-grab illusion',category:'Motion and position',
  attribution:{en:'Based on the work of Patrick Cavanagh and Stuart Anstis (Université Paris Descartes, France; University of California San Diego, USA).',no:'Basert på arbeidet til Patrick Cavanagh og Stuart Anstis (Université Paris Descartes, Frankrike; University of California San Diego, USA).'},
  summary:'Two low-contrast pinwheels fade in and out while rotating in opposite directions. Physically aligned red and green bars alternate when the motion reverses.',
  hint:'Fixate on the middle dot. Are the two flashed bars really aligned, or does the nearby motion seem to grab and shift them?',
  reveal:'The bars are always perfectly vertical and aligned. Motion immediately before and after each flash displaces their perceived positions in opposite directions.',
  presentationMs:19000,defaults,
  controls:[
    {key:'rotation',label:'Rotation speed',type:'range',min:30,max:180,step:5,format:v=>`${v}°/s`},
    {key:'reverseEvery',label:'Reverse every',type:'range',min:.3,max:2,step:.01,format:v=>`${Number(v).toFixed(2)} s`},
    {key:'flashMs',label:'Flash duration',type:'range',min:30,max:200,step:10,format:v=>`${v} ms`},
    {key:'radius',label:'Pinwheel radius',type:'range',min:110,max:210,step:5,format:v=>`${v} px`},
    {key:'contrast',label:'Pinwheel contrast',type:'range',min:4,max:35,step:1,format:v=>`${v}%`},
    {key:'circleCycle',label:'Circle fade cycle',type:'range',min:6,max:24,step:.5,format:v=>`${Number(v).toFixed(1)} s`},
    {key:'lineWidth',label:'Flash width',type:'range',min:4,max:18,step:1,format:v=>`${v} px`},
    {key:'blankDuringFlash',label:'Hide motion at flash',type:'toggle'},
    {key:'fixation',label:'Fixation points',type:'toggle'}
  ],
  draw(){return {phase:'ROTATING',progress:0};}
};
