export const TAU = Math.PI * 2;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
export const mod = (n, m) => ((n % m) + m) % m;

export function fit(ctx, canvas, virtualW = 1200, virtualH = 675, bg = '#05060a') {
  const w = canvas.width, h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / virtualW, h / virtualH);
  const x = (w - virtualW*s)/2, y = (h - virtualH*s)/2;
  ctx.translate(x, y);
  ctx.scale(s, s);
  return { w: virtualW, h: virtualH, scale: s };
}

export function circle(ctx, x, y, r, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

export function roundedRect(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rr);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

export function starPath(ctx, cx, cy, outer, inner, points = 8, rotation = -Math.PI/2) {
  ctx.beginPath();
  for (let i = 0; i < points*2; i++) {
    const a = rotation + i*Math.PI/points;
    const r = i % 2 ? inner : outer;
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath();
}

export function drawFixation(ctx, x, y, size = 9, color = '#101218', halo = true) {
  if (halo) circle(ctx, x, y, size*1.7, 'rgba(255,255,255,.58)');
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, size*.26); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x-size,y); ctx.lineTo(x+size,y); ctx.moveTo(x,y-size); ctx.lineTo(x,y+size); ctx.stroke();
}

export function hsl(h, s = 80, l = 55, a = 1) { return `hsla(${mod(h,360)} ${s}% ${l}% / ${a})`; }
export function oklch(l, c, h, a = 1) { return `oklch(${clamp(l,0,100)}% ${Math.max(0,c)} ${mod(h,360)} / ${clamp(a,0,1)})`; }
export function oklchNumber(l, c, h) {
  const lightness=clamp(l,0,100)/100,angle=mod(h,360)*Math.PI/180;
  const a=Math.max(0,c)*Math.cos(angle),b=Math.max(0,c)*Math.sin(angle);
  const ll=lightness+.3963377774*a+.2158037573*b;
  const mm=lightness-.1055613458*a-.0638541728*b;
  const ss=lightness-.0894841775*a-1.291485548*b;
  const l3=ll*ll*ll,m3=mm*mm*mm,s3=ss*ss*ss;
  const linear=[
    4.0767416621*l3-3.3077115913*m3+.2309699292*s3,
    -1.2684380046*l3+2.6097574011*m3-.3413193965*s3,
    -.0041960863*l3-.7034186147*m3+1.707614701*s3
  ];
  const channel=v=>Math.round(clamp(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055,0,1)*255);
  const [r,g,blue]=linear.map(channel);return r<<16|g<<8|blue;
}
export function seeded(index) { const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

export function drawPacman(ctx, x, y, r, direction, color, mouth = .28) {
  const a = direction;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, a + mouth*Math.PI, a + (2-mouth)*Math.PI);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  const eyeA = a - Math.PI/2;
  circle(ctx, x + Math.cos(eyeA)*r*.35, y + Math.sin(eyeA)*r*.35, r*.09, '#161820');
}

export function drawNoise(ctx, w, h, count = 300, alpha = .035) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
  for (let i=0;i<count;i++) ctx.fillRect(seeded(i*2)*w, seeded(i*2+1)*h, 1.2, 1.2);
  ctx.restore();
}

export function canvasPoint(event, canvas, virtualW = 1200, virtualH = 675) {
  const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * canvas.width / rect.width;
  const py = (event.clientY - rect.top) * canvas.height / rect.height;
  const s = Math.min(canvas.width/virtualW, canvas.height/virtualH);
  return { x: (px-(canvas.width-virtualW*s)/2)/s, y: (py-(canvas.height-virtualH*s)/2)/s };
}

export function formatSeconds(v) { return `${Number(v).toFixed(v % 1 ? 1 : 0)} s`; }
