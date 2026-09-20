import { seeded, TAU, oklchNumber } from './utils.js';

const VW=1200,VH=675,SCALE=16/15,OX=0,OY=0;

function rootContainer(){
  const root=new PIXI.Container();
  root.position.set(OX,OY);root.scale.set(SCALE);root.visible=false;
  return root;
}

function graphicsRect(x,y,w,h,color){
  return new PIXI.Graphics().rect(x,y,w,h).fill(color);
}

function colourNumber(h,s=1,v=1){
  h=((h%360)+360)%360/60;const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;
  let r=0,g=0,b=0;
  if(h<1)[r,g,b]=[c,x,0];else if(h<2)[r,g,b]=[x,c,0];else if(h<3)[r,g,b]=[0,c,x];
  else if(h<4)[r,g,b]=[0,x,c];else if(h<5)[r,g,b]=[x,0,c];else [r,g,b]=[c,0,x];
  return (Math.round((r+m)*255)<<16)|(Math.round((g+m)*255)<<8)|Math.round((b+m)*255);
}

function scene(id,root,update){
  return {id,root,update};
}

function canvasScene(demo,runtime){
  const canvas=document.createElement('canvas');canvas.width=VW;canvas.height=VH;
  const ctx=canvas.getContext('2d',{alpha:false});
  const texture=PIXI.Texture.from(canvas),sprite=new PIXI.Sprite(texture),root=rootContainer();
  root.addChild(sprite);
  return scene(demo.id,root,(t,state)=>{
    const result=demo.draw(ctx,canvas,t,state)||{};
    texture.source.update();
    return result;
  });
}

async function makeStonehenge(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0x050505);
  const texture=await PIXI.Assets.load('./assets/stonehenge-4k.png'),image=new PIXI.Sprite(texture),filter=new PIXI.ColorMatrixFilter();
  image.width=VW;image.height=VH;image.filters=[filter];
  const fix=new PIXI.Graphics().circle(600,338,13).fill({color:0xffffff,alpha:.62}).circle(600,338,6).fill(0x171717);
  root.addChild(bg,image,fix);let filterKey='';
  return scene(demo.id,root,(t,state)=>{
    const adaptMs=state.adapt*1000,revealMs=state.reveal*1000,cycle=adaptMs+revealMs;
    const local=state.auto?t%cycle:Math.min(t,cycle-1),grey=local>=adaptMs,key=`${grey}|${state.hueShift}|${state.saturation}`;
    if(key!==filterKey){filter.reset();if(grey)filter.grayscale(1,false);else{filter.hue(state.hueShift,false);filter.saturate(state.saturation/100-1,true);}filterKey=key;}
    fix.visible=state.fixation;
    return {phase:grey?'AFTERIMAGE':'ADAPT',progress:local/cycle};
  });
}

function makeStepping(runtime,demo){
  const root=rootContainer(),stripes=new PIXI.Graphics(),top=new PIXI.Graphics(),bottom=new PIXI.Graphics(),fix=new PIXI.Graphics().circle(0,0,13).fill(0xe5232f);
  root.addChild(stripes,top,bottom,fix);fix.position.set(600,66);
  let cache='';
  return scene(demo.id,root,(t,state)=>{
    const contrast=Math.max(0,Math.min(1,(state.mode==='low'?28:state.contrast)/100));
    const dark=Math.round(127-115*contrast),light=Math.round(127+115*contrast);
    const key=[state.mode,state.stripeWidth,state.contrast,state.bars].join('|');
    const bars=state.bars,otherBars=bars;
    const topWidth=state.stripeWidth*bars,bottomWidth=state.stripeWidth*otherBars,width=Math.max(topWidth,bottomWidth),height=42;
    if(key!==cache){
      stripes.clear();for(let x=0,i=0;x<VW;x+=state.stripeWidth,i++)stripes.rect(x,0,state.stripeWidth+.5,VH).fill(i%2?(dark<<16|dark<<8|dark):(light<<16|light<<8|light));
      top.clear().rect(0,-height/2,topWidth,height).fill(state.mode==='mono'?0xf2f2f2:0xf7f700);
      bottom.clear().rect(0,-height/2,bottomWidth,height).fill(state.mode==='mono'?0x0c0c0c:0x0000a5);
      cache=key;
    }
    const span=VW-width-70,cycle=span*2,distance=(t/1000*state.speed)%cycle;
    const x=35+(distance<=span?distance:cycle-distance);
    top.position.set(x,338-state.separation/2);bottom.position.set(x,338+state.separation/2);
    return {phase:state.mode==='worms'?`${bars} BARS — WORMS`:`${bars} BARS — STEP`,progress:distance/cycle};
  });
}

function starPoints(cx,cy,outer,inner,rotation,points=4){
  const pts=[];for(let i=0;i<points*2;i++){const a=rotation+i*Math.PI/points,r=i%2?inner:outer;pts.push(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}return pts;
}

function vanLierTexture(lightness,chroma,hueA,hueB){
  const side=400,centre=side/2,canvas=document.createElement('canvas');canvas.width=canvas.height=side;
  const ctx=canvas.getContext('2d'),css=value=>`#${value.toString(16).padStart(6,'0')}`;
  const path=rotation=>{const pts=starPoints(centre,centre,180,68,rotation);ctx.beginPath();for(let i=0;i<pts.length;i+=2)i?ctx.lineTo(pts[i],pts[i+1]):ctx.moveTo(pts[i],pts[i+1]);ctx.closePath();};
  path(0);ctx.fillStyle=css(oklchNumber(lightness,chroma,hueA));ctx.fill();
  path(Math.PI/4);ctx.fillStyle=css(oklchNumber(lightness,chroma,hueB));ctx.fill();
  ctx.save();path(0);ctx.clip();path(Math.PI/4);ctx.clip();ctx.fillStyle=css(oklchNumber(75.40,0,0));ctx.fillRect(0,0,side,side);ctx.restore();
  return PIXI.Texture.from(canvas);
}

function makeVanLier(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,oklchNumber(83.46,0,0)),adapters=[new PIXI.Sprite(PIXI.Texture.WHITE),new PIXI.Sprite(PIXI.Texture.WHITE)],outlinesA=new PIXI.Graphics(),outlinesB=new PIXI.Graphics(),fix=new PIXI.Graphics().circle(600,338,4).fill(0x181818);
  adapters.forEach((sprite,i)=>{sprite.anchor.set(.5);sprite.position.set(i?840:360,338);});root.addChild(bg,...adapters,outlinesA,outlinesB,fix);
  let adapterTexture=null;
  const draw=(lineWidth,hueA,hueB,lightness,chroma)=>{
    const old=adapterTexture;adapterTexture=vanLierTexture(lightness,chroma,hueA,hueB);adapters.forEach(sprite=>sprite.texture=adapterTexture);if(old)old.destroy(true);
    outlinesA.clear();outlinesB.clear();const outline=oklchNumber(47,0,0);
    outlinesA.poly(starPoints(360,338,180,68,Math.PI/4)).stroke({color:outline,width:lineWidth,join:'round'});
    outlinesA.poly(starPoints(840,338,180,68,0)).stroke({color:outline,width:lineWidth,join:'round'});
    outlinesB.poly(starPoints(360,338,180,68,0)).stroke({color:outline,width:lineWidth,join:'round'});
    outlinesB.poly(starPoints(840,338,180,68,Math.PI/4)).stroke({color:outline,width:lineWidth,join:'round'});
  };
  let lastKey='';
  return scene(demo.id,root,(t,state)=>{
    const key=[state.lineWidth,state.hueA,state.hueB,state.lightness,state.chroma].join('|');
    if(key!==lastKey){draw(state.lineWidth,state.hueA,state.hueB,state.lightness,state.chroma);lastKey=key;}
    const colourMs=state.filled*1000,outlineMs=state.contour*1000,cycle=colourMs+2*outlineMs;
    const local=state.auto?t%cycle:Math.min(t,cycle-1);
    const colour=local<colourMs;
    const swapped=!colour&&local>=colourMs+outlineMs;
    adapters.forEach(sprite=>sprite.visible=colour);outlinesA.visible=!colour&&!swapped;outlinesB.visible=swapped;
    fix.visible=state.fixation;
    return {phase:colour?'COLOUR':swapped?'CONTOUR 2':'CONTOUR 1',progress:local/cycle};
  });
}

function hslRgb(h,s=1,l=.5){
  h=((h%360)+360)%360/360;
  const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}

function gaussianDotTexture(sigma,hue){
  const radius=Math.ceil(sigma*3.25),side=radius*2+1,canvas=document.createElement('canvas');canvas.width=canvas.height=side;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(side,side),[r,g,b]=hslRgb(hue,1,.5),denom=2*sigma*sigma;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const dx=x-radius,dy=y-radius,a=Math.exp(-(dx*dx+dy*dy)/denom),i=(y*side+x)*4;
    image.data[i]=r;image.data[i+1]=g;image.data[i+2]=b;image.data[i+3]=Math.round(255*a);
  }
  ctx.putImageData(image,0,0);return PIXI.Texture.from(canvas);
}

function makeLilac(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0xffffff),dots=[],fix=new PIXI.Graphics().circle(0,0,4).fill(0x202020);
  root.addChild(bg);for(let i=0;i<16;i++){const s=new PIXI.Sprite(PIXI.Texture.WHITE);s.anchor.set(.5);dots.push(s);root.addChild(s);}root.addChild(fix);fix.position.set(600,338);
  let cache='',texture=null;
  return scene(demo.id,root,(t,state)=>{
    const key=[state.sigma,state.colour].join('|');
    if(key!==cache){const old=texture;texture=gaussianDotTexture(state.sigma,state.colour);dots.forEach(d=>d.texture=texture);if(old&&old!==PIXI.Texture.WHITE)old.destroy(true);cache=key;}
    const missing=Math.floor(t/state.interval)%state.dots;
    dots.forEach((dot,i)=>{dot.visible=i<state.dots&&i!==missing;if(i<state.dots){const a=-Math.PI/2+i*TAU/state.dots;dot.position.set(600+Math.cos(a)*state.radius,338+Math.sin(a)*state.radius);}});
    fix.visible=state.fixation;
    return {phase:'FIXATE',progress:(t%24000)/24000};
  });
}

function gaborTexture(size,contrast,phase,direction){
  // The canvas extends beyond four Gaussian sigmas. Pixels near its edge are
  // transparent, so neighbouring patches blend instead of exposing squares.
  const side=Math.max(48,Math.round(size*1.8)),canvas=document.createElement('canvas');canvas.width=canvas.height=side;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(side,side),centre=(side-1)/2,sigmaAlong=size*.18,sigmaAcross=size*.27,wavelength=size*.52;
  const angle=direction*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const dx=x-centre,dy=y-centre,u=dx*cos+dy*sin,v=-dx*sin+dy*cos;
    const mask=Math.exp(-(u*u/(2*sigmaAlong*sigmaAlong)+v*v/(2*sigmaAcross*sigmaAcross)));
    const carrier=Math.sin(TAU*u/wavelength-phase),value=Math.max(0,Math.min(255,189+127*(contrast/100)*carrier)),i=(y*side+x)*4;
    image.data[i]=image.data[i+1]=image.data[i+2]=Math.round(value);image.data[i+3]=Math.round(255*mask);
  }
  ctx.putImageData(image,0,0);return PIXI.Texture.from(canvas);
}

function makeInfinite(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0xbdbdbd),group=new PIXI.Container(),fix=new PIXI.Graphics().circle(0,0,4).fill(0x101010),gabors=[];
  root.addChild(bg,group,fix);fix.position.set(190,338);
  for(let i=0;i<9;i++){const s=new PIXI.Sprite(PIXI.Texture.WHITE);s.anchor.set(.5);gabors.push(s);group.addChild(s);}
  let textures=[],cache='';
  return scene(demo.id,root,(t,state)=>{
    const key=[state.size,state.contrast,state.innerDirection].join('|');
    if(key!==cache){const old=textures;textures=Array.from({length:48},(_,i)=>gaborTexture(state.size,state.contrast,i/48*TAU,state.innerDirection));gabors.forEach(s=>s.texture=textures[0]);old.forEach(tex=>tex.destroy(true));cache=key;}
    const seconds=t/1000,oscillationPhase=seconds*state.oscillationSpeed*TAU;
    // Double Drift differs from Infinite Regress at the turnarounds: carrier
    // motion reverses at the same instant as the oscillating envelope. Using
    // the integral of the envelope velocity keeps both reversals locked.
    const carrierCycles=state.mode==='vector'
      ? state.phaseSpeed/(TAU*Math.max(.001,state.oscillationSpeed))*Math.sin(oscillationPhase)
      : seconds*state.phaseSpeed;
    const phase=((carrierCycles%1)+1)%1,index=Math.floor(phase*textures.length)%textures.length;
    const count=Math.max(1,Math.min(9,Math.round(state.count))),spacing=state.spacing;
    const classic=[[0,0],[-spacing,0],[spacing,0],[0,-spacing],[0,spacing],[-spacing,-spacing],[spacing,-spacing],[-spacing,spacing],[spacing,spacing]];
    const globalAngle=state.motionDirection*Math.PI/180,perpendicular=globalAngle+Math.PI/2;
    gabors.forEach((s,i)=>{
      s.visible=i<count;s.texture=textures[index];if(i>=count)return;
      const offset=state.mode==='classic'?classic[i]:(i-(count-1)/2)*spacing;
      if(state.mode==='classic')s.position.set(offset[0],offset[1]);
      else s.position.set(Math.cos(perpendicular)*offset,Math.sin(perpendicular)*offset);
    });
    const displacement=Math.sin(oscillationPhase)*state.amplitude;
    group.position.set(state.positionX+Math.cos(globalAngle)*displacement,338+Math.sin(globalAngle)*displacement);
    return {phase:state.mode==='vector'?'FIXATE LEFT — DIAGONAL PATH':'FIXATE LEFT — CROSS',progress:phase};
  });
}

function makeMotion(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0x999999),dots=[],fix=new PIXI.Graphics().circle(0,0,4).fill(0xffffff);
  root.addChild(bg);for(let i=0;i<144;i++){const d=new PIXI.Graphics();dots.push(d);root.addChild(d);}root.addChild(fix);fix.position.set(600,338);
  let lastSize=-1,pointKey='',points=[];
  return scene(demo.id,root,(t,state)=>{
    if(state.dotSize!==lastSize){dots.forEach(d=>d.clear().circle(0,0,state.dotSize).fill(0xffffff));lastSize=state.dotSize;}
    const seconds=t/1000,stillDuration=Math.max(.05,state.stillDuration||3),moveDuration=Math.max(.05,state.moveDuration||5);
    const cycle=stillDuration+moveDuration,cycleLocal=seconds%cycle;
    const moving=state.motion&&(!state.compare||cycleLocal>=stillDuration);
    // Count only moving time so the pattern freezes in place during the still
    // interval, then resumes smoothly. Direction reversals continue inside
    // each moving interval and can be as fast as 100 ms.
    const motionSeconds=state.compare?Math.floor(seconds/cycle)*moveDuration+Math.max(0,cycleLocal-stillDuration):seconds;
    const switchEvery=Math.max(.1,state.switchEvery),segment=Math.floor(motionSeconds/switchEvery),within=motionSeconds%switchEvery;
    const signedTime=segment%2===0?within:switchEvery-within;
    const rotation=state.motion?signedTime*state.rotation*Math.PI/180:0;
    const count=Math.max(3,Math.min(144,Math.round(state.dots))),nextPointKey=`${count}|${state.dotSize}|${state.innerRadius}`;
    if(nextPointKey!==pointKey){points=packedDotField(count,state.dotSize,state.innerRadius);pointKey=nextPointKey;}
    const cos=Math.cos(rotation),sin=Math.sin(rotation);
    dots.forEach((dot,i)=>{
      dot.visible=i<count;if(i>=count)return;
      const point=points[i],x=point.x*cos-point.y*sin,y=point.x*sin+point.y*cos;
      dot.position.set(600+x,338+y);
      dot.tint=colourNumber(seeded(i*7+2)*360+seconds*state.change,1,1);
    });
    return {phase:moving?(segment%2?'COUNTERCLOCKWISE':'CLOCKWISE'):'STILL',progress:state.compare?cycleLocal/cycle:(t%10000)/10000};
  });
}

function packedDotField(count,dotSize,innerRadius){
  // Deterministic Mitchell best-candidate packing: random candidates are kept
  // only when they maximise distance from all points already placed.
  const random=rng(0x51f15e+count*131+dotSize*17+innerRadius*7),points=[],outer=300-dotSize,inner=innerRadius+dotSize;
  for(let i=0;i<count;i++){
    let best=null,bestDistance=-1;
    for(let candidate=0;candidate<56;candidate++){
      const angle=random()*TAU,radius=Math.sqrt(inner*inner+random()*(outer*outer-inner*inner));
      const point={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};let nearest=Infinity;
      for(const other of points){const dx=point.x-other.x,dy=point.y-other.y;nearest=Math.min(nearest,dx*dx+dy*dy);}
      if(nearest>bestDistance){best=point;bestDistance=nearest;}
    }
    points.push(best);
  }
  return points;
}

function makeFlashGrab(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0xcccccc),wheels=[new PIXI.Graphics(),new PIXI.Graphics()],flashes=new PIXI.Graphics(),fix=new PIXI.Graphics();
  root.addChild(bg,...wheels,flashes,fix);wheels[0].position.set(385,338);wheels[1].position.set(815,338);
  let wheelKey='',flashKey='';
  return scene(demo.id,root,(t,state)=>{
    const delta=Math.round(state.contrast*1.45),dark=Math.max(0,204-delta),light=Math.min(255,204+delta),nextWheelKey=[state.radius,dark,light].join('|');
    if(nextWheelKey!==wheelKey){
      wheels.forEach(wheel=>{wheel.clear();for(let i=0;i<6;i++){const a=-Math.PI/2+i*TAU/6;wheel.moveTo(0,0).arc(0,0,state.radius,a,a+TAU/6).closePath().fill(i%2?(light<<16|light<<8|light):(dark<<16|dark<<8|dark));}});wheelKey=nextWheelKey;
    }
    fix.clear();if(state.fixation)for(const x of [385,600,815])fix.circle(x,338,4.5).fill(0x151515);
    const seconds=t/1000,interval=Math.max(.1,state.reverseEvery),segment=Math.floor(seconds/interval),within=seconds%interval,direction=segment%2?1:-1;
    const lineLength=state.radius*2,nextFlashKey=[lineLength,state.lineWidth,segment%2].join('|');
    if(nextFlashKey!==flashKey){const colour=segment%2?0xff2424:0x00a64f;flashes.clear();for(const x of [385,815])flashes.rect(x-state.lineWidth/2,338-lineLength/2,state.lineWidth,lineLength).fill(colour);flashKey=nextFlashKey;}
    const signed=segment%2?within:interval-within,angle=signed*state.rotation*Math.PI/180,flash=within<state.flashMs/1000;
    // The reference alternates circles and no circles on a roughly 13-second
    // envelope: blank, a long fade in, a short hold, then a long fade out.
    const circleCycle=Math.max(4,state.circleCycle),circleTime=seconds%circleCycle,blank=circleCycle*(2.2/13),fade=circleCycle*(4.4/13),hold=circleCycle*(1.8/13);
    let circleAlpha=0;
    if(circleTime>=blank&&circleTime<blank+fade){const u=(circleTime-blank)/fade;circleAlpha=.5-.5*Math.cos(Math.PI*u);}
    else if(circleTime<blank+fade+hold&&circleTime>=blank+fade)circleAlpha=1;
    else if(circleTime>=blank+fade+hold&&circleTime<blank+fade*2+hold){const u=(circleTime-blank-fade-hold)/fade;circleAlpha=.5+.5*Math.cos(Math.PI*u);}
    wheels[0].rotation=angle;wheels[1].rotation=-angle;wheels.forEach(wheel=>{wheel.alpha=circleAlpha;wheel.visible=!(flash&&state.blankDuringFlash);});flashes.visible=flash;
    return {phase:flash?'FLASH':'ROTATING',progress:within/interval,direction};
  });
}

function makeBreathingSquare(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0xe5e5e5),square=new PIXI.Graphics(),occluders=new PIXI.Graphics();
  root.addChild(bg,square,occluders);square.position.set(600,337.5);
  let squareKey='',coverKey='';
  return scene(demo.id,root,(t,state)=>{
    const nextSquareKey=[state.squareSize,state.squareHue].join('|');
    if(nextSquareKey!==squareKey){const colour=colourNumber(state.squareHue,.98,.7),half=state.squareSize/2;square.clear().rect(-half,-half,state.squareSize,state.squareSize).fill(colour);squareKey=nextSquareKey;}
    const seconds=t/1000,cycle=Math.max(1,state.gapCycle),cyclePhase=(seconds/cycle)%1;
    // Aperture speed depends on how much of the square is visible: opening is
    // slow while the exposed region is small, then accelerates continuously.
    // Closing mirrors that profile—fast while open and slow near the minimum.
    const opening=cyclePhase<.5,aperturePhase=opening?cyclePhase*2:(1-cyclePhase)*2;
    const wave=aperturePhase*aperturePhase,gap=state.autoGap?state.gap+wave*Math.min(205-state.gap,120):state.gap;
    const nextCoverKey=[Math.round(gap*10),state.coverHue].join('|');
    if(nextCoverKey!==coverKey){const colour=colourNumber(state.coverHue,.93,1),cx=600,cy=337.5;
      occluders.clear().rect(0,0,cx-gap,cy-gap).fill(colour)
        .rect(cx+gap,0,VW-cx-gap,cy-gap).fill(colour)
        .rect(0,cy+gap,cx-gap,VH-cy-gap).fill(colour)
        .rect(cx+gap,cy+gap,VW-cx-gap,VH-cy-gap).fill(colour);coverKey=nextCoverKey;
    }
    square.rotation=state.rotation?seconds*state.speed*Math.PI/180:0;
    return {phase:'RIGID ROTATION',progress:(seconds%12)/12};
  });
}

function rng(seed){let x=seed>>>0;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296);}
function shuffled(list,random){for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
function generateMaze(size,seed,start){
  const grid=Array.from({length:size},()=>Array(size).fill(1)),random=rng(seed),stack=[start.slice()];grid[start[1]][start[0]]=0;
  while(stack.length){const [x,y]=stack[stack.length-1],opts=shuffled([[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>0&&x+dx<size-1&&y+dy>0&&y+dy<size-1&&grid[y+dy][x+dx]===1),random);
    if(!opts.length){stack.pop();continue;}const [dx,dy]=opts[0];grid[y+dy/2][x+dx/2]=0;grid[y+dy][x+dx]=0;stack.push([x+dx,y+dy]);}
  return grid;
}

function chasePrefix(grid,start,targetDistance=24){
  const directions=[[1,0],[-1,0],[0,1],[0,-1]],key=(x,y)=>`${x},${y}`;
  const queue=[start.slice()],parent=new Map([[key(start[0],start[1]),null]]),distance=new Map([[key(start[0],start[1]),0]]);
  let target=start.slice();
  for(let head=0;head<queue.length;head++){
    const [x,y]=queue[head],here=key(x,y),travelled=distance.get(here);target=[x,y];
    if(travelled>=targetDistance)break;
    for(const [dx,dy] of directions){
      const nx=x+dx,ny=y+dy,nextKey=key(nx,ny);
      if(grid[ny]?.[nx]!==0||parent.has(nextKey))continue;
      parent.set(nextKey,[x,y]);distance.set(nextKey,travelled+1);queue.push([nx,ny]);
    }
  }
  const path=[];
  for(let point=target;point;point=parent.get(key(point[0],point[1])))path.push(point);
  return path;
}

function makePacman(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0x020206),mazeG=new PIXI.Graphics(),ghosts=[new PIXI.Graphics(),new PIXI.Graphics()],pac=new PIXI.Graphics(),caption=new PIXI.Text({text:'',style:{fontFamily:'Inter, sans-serif',fontSize:16,fontWeight:'700',fill:0x9fc8ff}});
  root.addChild(bg,mazeG,...ghosts,pac,caption);caption.anchor.set(.5);caption.position.set(600,651);
  const size=25,cell=25,px=287.5,py=25;
  const sim={seed:0,runSeed:0,grid:null,pos:[13,13],from:[13,13],to:[13,13],dir:[1,0],step:-1,evolutions:0,pearls:new Set(),trail:[],prefix:[]};
  let caughtAt=-1,caughtPoint=null,caughtGhostIndex=0,lastPresentationIndex=-1,lastRunId=-1;
  function reset(){
    sim.seed=Math.floor(Math.random()*0x7fffffff);sim.runSeed=sim.seed;sim.grid=generateMaze(size,sim.seed,[13,13]);sim.pos=[13,13];sim.from=[13,13];sim.to=[13,13];sim.dir=[1,0];sim.step=-1;sim.evolutions=0;sim.pearls=new Set();sim.trail=[];sim.prefix=chasePrefix(sim.grid,[13,13]);
    caughtAt=-1;caughtPoint=null;caughtGhostIndex=0;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!sim.grid[y][x])sim.pearls.add(`${x},${y}`);
  }
  function evolve(state){
    const fresh=generateMaze(size,++sim.seed,[13,13]),old=sim.grid,[cx,cy]=sim.pos,[dx,dy]=sim.dir,preserve=state.preserve;
    for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
      const dist=Math.abs(x-cx)+Math.abs(y-cy),behind=(x-cx)*dx+(y-cy)*dy<=0;
      if(dist<=preserve||(behind&&dist<=preserve*2))fresh[y][x]=old[y][x];
    }
    // Keep the recent chase route open so ghosts never pass through a wall
    // that appeared after Pac-Man had already traversed that cell.
    for(const [tx,ty] of sim.prefix)fresh[ty][tx]=0;
    for(const [tx,ty] of sim.trail.slice(-24))fresh[ty][tx]=0;
    fresh[sim.from[1]][sim.from[0]]=0;fresh[sim.to[1]][sim.to[0]]=0;
    fresh[cy][cx]=0;sim.grid=fresh;sim.evolutions++;
  }
  function chooseNext(){
    const [x,y]=sim.pos,back=[-sim.dir[0],-sim.dir[1]],all=[[1,0],[0,1],[-1,0],[0,-1]];
    let opts=all.filter(([dx,dy])=>sim.grid[y+dy]?.[x+dx]===0);
    const forward=opts.find(([dx,dy])=>dx===sim.dir[0]&&dy===sim.dir[1]);
    const nonBack=opts.filter(([dx,dy])=>dx!==back[0]||dy!==back[1]);if(nonBack.length)opts=nonBack;
    const pick=forward&&seeded(sim.runSeed+sim.step*11)<.64?forward:opts[Math.floor(seeded(sim.runSeed+sim.step*13+7)*opts.length)]||back;
    sim.dir=pick;sim.from=sim.pos.slice();sim.to=[x+pick[0],y+pick[1]];
  }
  function advance(targetStep,state){
    if(targetStep<sim.step)reset();
    while(sim.step<targetStep){sim.step++;sim.pos=sim.to.slice();sim.trail.push(sim.pos.slice());sim.pearls.delete(`${sim.pos[0]},${sim.pos[1]}`);if(sim.step>0&&sim.step%state.evolveEvery===0)evolve(state);chooseNext();}
  }
  const pearlColours=[0xef2929,0xf57900,0x8ae234,0xad7fa8,0x729fcf,0xfce94f];
  function redraw(state,t){
    mazeG.clear();mazeG.rect(px,py,size*cell,size*cell).fill(0x020206);
    const showPearls=state.pellets&&(!state.blink||Math.floor(t/(1000/state.speed))%2===0);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(sim.grid[y][x]){
      mazeG.rect(px+x*cell,py+y*cell,cell+.5,cell+.5).fill(0x194b91);
      mazeG.rect(px+x*cell+4,py+y*cell+4,cell-8,cell-8).fill(0x347cc3);
    }else if(showPearls&&sim.pearls.has(`${x},${y}`)){
      const colour=pearlColours[Math.floor(seeded(x*31+y*79)*pearlColours.length)];
      mazeG.circle(px+(x+.5)*cell,py+(y+.5)*cell,3.2).fill(colour);
    }
  }
  function drawGhost(g,x,y,colour,lookX,lookY,t){
    const bob=Math.sin(t/120)*.7;
    g.clear().circle(0,-2+bob,9).fill(colour).rect(-9,-2+bob,18,10).fill(colour)
      .poly([-9,8+bob,-5,4+bob,-1,8+bob,3,4+bob,8,8+bob]).fill(colour)
      .circle(-3,-3+bob,2.5).fill(0xffffff).circle(4,-3+bob,2.5).fill(0xffffff)
      .circle(-3+lookX*1.2,-3+bob+lookY*1.2,1.2).fill(0x17233b)
      .circle(4+lookX*1.2,-3+bob+lookY*1.2,1.2).fill(0x17233b);
    g.position.set(x,y);
  }
  return scene(demo.id,root,(t,state)=>{
    const runId=runtime.runId?.()??0;
    if(runId!==lastRunId){reset();lastRunId=runId;lastPresentationIndex=-1;}
    const presentation=runtime.presentationState?.();
    const sceneMode=presentation?.scene;
    if(presentation&&presentation.index!==lastPresentationIndex){
      if(sceneMode==='ready'||(lastPresentationIndex>=0&&sceneMode!=='death')){caughtAt=-1;caughtPoint=null;caughtGhostIndex=0;}
      lastPresentationIndex=presentation.index;
    }
    const renderedState=sceneMode==='no-pearls'?{...state,pellets:false,blink:false}:sceneMode==='pearls'?{...state,pellets:true,blink:true}:state;
    const stepMs=1000/state.speed,step=Math.floor(t/stepMs),frac=(t%stepMs)/stepMs,oldEvolution=sim.evolutions;
    advance(step,renderedState);redraw(renderedState,t);
    const x=sim.from[0]+(sim.to[0]-sim.from[0])*frac,y=sim.from[1]+(sim.to[1]-sim.from[1])*frac;
    const ready=sceneMode==='ready',readyAngles=[-Math.PI/2,0,Math.PI/2,Math.PI],angle=ready?readyAngles[Math.floor((presentation?.local||0)/(1000/6))%4]:Math.atan2(sim.dir[1],sim.dir[0]),mouth=.18+.16*Math.abs(Math.sin((ready?(presentation?.local||0):t)/85));
    pac.clear().moveTo(0,0).arc(0,0,10,angle+mouth*Math.PI,angle+(2-mouth)*Math.PI).closePath().fill(0xffe84e);
    pac.position.set(px+(x+.5)*cell,py+(y+.5)*cell);
    pac.scale.set(1);pac.rotation=0;pac.alpha=1;
    const ghostPoints=[],forcedDeath=sceneMode==='death';
    // Prefix Pac-Man's travelled cells with a real open path through the maze.
    // Ghosts can then begin behind him immediately and move along the same
    // continuous route coordinate, instead of jumping between stored cells.
    const route=[...sim.prefix,...sim.trail.slice(1)];
    const routeEnd=route[route.length-1];
    if(!routeEnd||routeEnd[0]!==sim.to[0]||routeEnd[1]!==sim.to[1])route.push(sim.to.slice());
    const pacProgress=sim.prefix.length-1+step+frac;
    function routePoint(progress){
      const index=Math.max(0,Math.min(route.length-1,progress)),lo=Math.floor(index),hi=Math.min(route.length-1,lo+1),mix=index-lo,a=route[lo],b=route[hi];
      return {x:a[0]+(b[0]-a[0])*mix,y:a[1]+(b[1]-a[1])*mix};
    }
    const interactiveCatchMs=18000,prefixRoom=Math.max(1,sim.prefix.length-2);
    const startDelay=Math.min(prefixRoom,state.speed*((presentation?.duration||interactiveCatchMs)/1000)*.25);
    const redDelay=forcedDeath?0:presentation?.catchAtEnd
      ? Math.max(.85,startDelay*Math.max(0,1-(presentation.local||0)/presentation.duration))
      : presentation?12:startDelay*Math.max(0,1-t/interactiveCatchMs);
    [redDelay,18].forEach((delay,i)=>{
      const point=routePoint(pacProgress-delay);
      ghosts[i].visible=Boolean(point);
      if(!point)return;
      const ahead=routePoint(pacProgress-delay+.1),gx=point.x,gy=point.y,lookX=Math.sign(ahead.x-gx),lookY=Math.sign(ahead.y-gy);
      const screenX=px+(gx+.5)*cell,screenY=py+(gy+.5)*cell;ghostPoints[i]={x:screenX,y:screenY};
      drawGhost(ghosts[i],screenX,screenY,i?0x8ae234:0xef2929,lookX,lookY,t+i*90);
    });
    // In free exploration, die on the first real sprite contact rather than on
    // a timer. In presentations the ghost keeps a visible safety gap until the
    // dedicated death beat, where it catches Pac-Man and the death begins in
    // the same frame.
    if(!presentation&&!forcedDeath&&caughtAt<0){
      const collider=ghostPoints.findIndex(point=>point&&Math.hypot(point.x-pac.position.x,point.y-pac.position.y)<=19);
      if(collider>=0){caughtAt=t;caughtPoint={x:pac.position.x,y:pac.position.y};caughtGhostIndex=collider;}
    }
    const gameOver=forcedDeath||caughtAt>=0;
    if(gameOver){
      const deathProgress=Math.min(1,forcedDeath?(presentation?.local||0)/1100:(t-caughtAt)/1100),pacX=forcedDeath?pac.position.x:caughtPoint.x,pacY=forcedDeath?pac.position.y:caughtPoint.y;
      if(!forcedDeath&&caughtPoint){const colours=[0xef2929,0x8ae234];ghostPoints[caughtGhostIndex]={...caughtPoint};drawGhost(ghosts[caughtGhostIndex],caughtPoint.x,caughtPoint.y,colours[caughtGhostIndex],0,0,caughtAt);}
      pac.position.set(pacX,pacY);
      pac.scale.set(Math.max(0,1-deathProgress));pac.rotation=deathProgress*Math.PI*.75;pac.alpha=1-deathProgress*.55;
    }
    caption.visible=!presentation;
    caption.text=sim.evolutions>oldEvolution?'THE MAZE CHANGED':'FOLLOW PAC-MAN — THE GHOSTS ARE CHASING';
    return {phase:gameOver?'GAME OVER':sim.evolutions?'INFINITE MAZE':'FOLLOW PAC-MAN',progress:(t%18000)/18000,gameOver};
  });
}

async function makeAbsence(runtime,demo){
  const root=rootContainer(),bg=graphicsRect(0,0,VW,VH,0x111111);
  const [emptyTex,objectsTex]=await Promise.all([PIXI.Assets.load('./assets/absence-occluded.png'),PIXI.Assets.load('./assets/absence-visible.png')]);
  const empty=new PIXI.Sprite(emptyTex),objects=new PIXI.Sprite(objectsTex);
  for(const s of [empty,objects]){s.width=VW;s.height=VH;}
  root.addChild(bg,empty,objects);
  return scene(demo.id,root,(t,state)=>{
    const a=state.empty*1000,b=state.reveal*1000,c=state.verify*1000,cycle=a+b+c,local=state.auto?t%cycle:Math.min(t,cycle-1);
    const phase=local<a?0:local<a+b?1:2,verifyObjects=phase===2&&Math.floor((local-a-b)/500)%2===1;
    empty.visible=phase===0||(phase===2&&!verifyObjects);objects.visible=phase===1||verifyObjects;
    return {phase:phase===0?'EMPTY TABLE?':phase===1?'REVEAL':'TRY AGAIN',progress:local/cycle};
  });
}

async function makeChangeBlindness(runtime,demo){
  const root=rootContainer(),blank=new PIXI.Graphics(),sprite=new PIXI.Sprite(PIXI.Texture.WHITE),answer=new PIXI.Graphics(),credit=new PIXI.Text({text:'Rensink flicker stimulus',style:{fontFamily:'Inter, sans-serif',fontSize:15,fontWeight:'700',fill:0xffffff}});
  const names=['airplane','farm','tourists','chopper','dinner','money'],textures={};
  await Promise.all(names.flatMap(name=>['A','B'].map(async version=>{textures[`${name}-${version}`]=await PIXI.Assets.load(`./assets/change-blindness/${name}-${version}.jpg`);}))); 
  sprite.anchor.set(.5);sprite.position.set(600,337.5);sprite.width=900;sprite.height=675;
  credit.position.set(164,646);
  root.addChild(blank,sprite,answer,credit);
  const targets={
    airplane:{x:648,y:183,w:218,h:184},farm:{x:300,y:126,w:232,h:186},tourists:{x:277,y:70,w:295,h:212},
    chopper:{x:150,y:566,w:760,h:104},dinner:{x:150,y:210,w:900,h:252},money:{x:525,y:210,w:175,h:365}
  };
  return scene(demo.id,root,(t,state)=>{
    const period=state.sceneTime*2+state.blankTime*2,local=t%period;
    const isBlank=(local>=state.sceneTime&&local<state.sceneTime+state.blankTime)||local>=state.sceneTime*2+state.blankTime;
    const version=local<state.sceneTime+state.blankTime?'A':'B',name=names.includes(state.example)?state.example:'airplane';
    blank.clear().rect(0,0,VW,VH).fill(state.blankColour==='light'?0xdededa:0x050505);
    sprite.texture=textures[`${name}-${version}`];sprite.visible=!isBlank;credit.visible=!isBlank;
    const reveal=t>=state.revealAfter*1000;answer.clear();
    if(reveal&&!isBlank){const q=targets[name];answer.rect(q.x,q.y,q.w,q.h).stroke({color:0xff405d,width:7});}
    return {phase:reveal?'ANSWER':isBlank?'BLANK':`SCENE ${version}`,progress:(t%(state.revealAfter*1000))/(state.revealAfter*1000)};
  });
}

export async function createPixiStimuli(illusions,runtime){
  const special=new Map();
  const byId=Object.fromEntries(illusions.map(d=>[d.id,d]));
  special.set('stonehenge',await makeStonehenge(runtime,byId.stonehenge));
  special.set('stepping-feet',makeStepping(runtime,byId['stepping-feet']));
  special.set('van-lier',makeVanLier(runtime,byId['van-lier']));
  special.set('infinite-regress',makeInfinite(runtime,byId['infinite-regress']));
  special.set('lilac-chaser',makeLilac(runtime,byId['lilac-chaser']));
  special.set('motion-silencing',makeMotion(runtime,byId['motion-silencing']));
  special.set('change-blindness',await makeChangeBlindness(runtime,byId['change-blindness']));
  special.set('pacman',makePacman(runtime,byId.pacman));
  special.set('absence',await makeAbsence(runtime,byId.absence));
  special.set('flash-grab',makeFlashGrab(runtime,byId['flash-grab']));
  special.set('breathing-square',makeBreathingSquare(runtime,byId['breathing-square']));
  const scenes=illusions.map(d=>special.get(d.id)||canvasScene(d,runtime));
  for(const item of scenes)runtime.pixi.stage.addChild(item.root);

  // Keep PIXI display trees out of jsPsych's trial parameters. Display trees
  // contain parent/child cycles, and Firefox can overflow while jsPsych
  // recur