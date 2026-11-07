/* Analytical Canvas equivalents of 57 motion families. No CSS/DOM animation. */
(function(r,f){const a=f(typeof module==='object'&&module.exports?require('./motion-data.js'):r.VisualMotionData);if(typeof module==='object'&&module.exports)module.exports=a;else r.VisualMotion=a;})(typeof globalThis==='undefined'?this:globalThis,function(catalog){
 'use strict';
 const TAU=Math.PI*2,clamp=v=>Math.min(1,Math.max(0,v));
 function stateAt(id,t,o={}){const item=catalog.find(x=>x.id===id);if(!item)throw new RangeError('Unknown recipe');if(!Number.isFinite(t))throw new TypeError('finite time');const p={x:0,y:0,width:640,height:360,text:'早餐视觉',ink:'#f4ead6',accent:'#e7c377',bg:'#142b34',duration:item.duration,progress:null,...o};if(![p.x,p.y,p.width,p.height,p.duration].every(Number.isFinite)||p.width<=0||p.height<=0||p.duration<=0)throw new RangeError('Invalid bounds/time');if(typeof p.text!=='string'||[...p.text].length>40)throw new RangeError('text <=40 characters');for(const k of ['ink','accent','bg'])if(!/^#[a-f\d]{6}$/i.test(p[k]))throw new TypeError('colour');if(p.progress!==null&&(!Number.isFinite(p.progress)||p.progress<0||p.progress>1))throw new RangeError('progress 0..1');return {...p,item,time:Math.max(0,t),phase:(Math.max(0,t)%p.duration)/p.duration};}
 function draw(ctx,id,t,o={}){const s=stateAt(id,t,o),f=s.item.family,v=s.item.variant,n=s.item.count+2,p=s.phase,a=p*TAU,prog=s.progress===null?p:s.progress;
 ctx.save();try{ctx.translate(s.x,s.y);const logicalHeight=f==='progress'?120:360,scale=Math.min(s.width/640,s.height/logicalHeight);ctx.translate((s.width-640*scale)/2,(s.height-logicalHeight*scale)/2);ctx.scale(scale,scale);ctx.translate(320,logicalHeight/2);ctx.strokeStyle=ctx.fillStyle=s.ink;ctx.lineWidth=4+(v%3)*.8;ctx.lineCap='round';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 42px sans-serif';
 const line=(x,y,X,Y)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();},dot=(x,y,r=12,color=s.accent)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();},ring=(r,angle=a,span=Math.PI*1.4)=>{ctx.beginPath();ctx.arc(0,0,r,angle,angle+span);ctx.stroke();},box=(x,y,w,h)=>ctx.fillRect(x,y,w,h),text=(txt=s.text,x=0,y=0)=>ctx.fillText(txt,x,y),clipRect=(x,y,w,h)=>{ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();};
 if(f.startsWith('text-')||f==='water-text'){
  const chars=[...s.text],width=Math.min(520,Math.max(42,chars.length*48)),advance=width/Math.max(1,chars.length),font=Math.min(42,advance*.9);ctx.font=`600 ${font}px sans-serif`;
  if(['text-fill','text-progress','text-load','water-text'].includes(f)){
   text();ctx.save();clipRect(-270,f==='water-text'?70-140*prog:-60,f==='water-text'?540:540*prog,140);ctx.fillStyle=s.accent;text();ctx.restore();
  }else if(f==='text-3d'||f==='text-shadow'){
   ctx.fillStyle=s.accent;for(let i=7;i>0;i--)text(s.text,i*1.4,Math.sin(a)*i*.8+i);ctx.fillStyle=s.ink;text();
  }else for(let i=0;i<chars.length;i++){const phase=a-i*.5;ctx.save();const x=(i-(chars.length-1)/2)*advance;let y=0;
   if(['text-jump','text-wave','text-float'].includes(f))y=Math.sin(phase)*(f==='text-jump'?28:f==='text-wave'?14:7);
   if(f==='text-split')y=(i%2?1:-1)*Math.cos(a)*22;
   if(f==='text-fade')ctx.globalAlpha*=.35+.65*(.5+.5*Math.sin(phase));
   if(f==='text-blink')ctx.globalAlpha*=Math.sin(phase)>0?1:.25;
   if(f==='text-glow'){ctx.shadowColor=s.accent;ctx.shadowBlur=8+12*(.5+.5*Math.sin(a));}
   ctx.fillStyle=i%2?s.ink:s.accent;text(chars[i],x,y);ctx.restore();
  }
 }else if(['ring','glow-ring','double-ring','spinner','svg-spin','wave-ring','gyro','neumorph'].includes(f)){
  if(f==='glow-ring'){ctx.shadowColor=s.accent;ctx.shadowBlur=18;}
  if(f==='gyro'){for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.scale(1,.25+.2*Math.sin(a+i));ring(82,a+i,TAU*.92);ctx.restore();}}
  else if(f==='neumorph'){ctx.strokeStyle=s.accent;ctx.lineWidth=12;ring(72,-a,Math.PI*1.6);ctx.strokeStyle=s.ink;ctx.lineWidth=3;ring(90,a,Math.PI*.6);}
  else {ring(68+(f==='wave-ring'?8*Math.sin(a*2):0),a,TAU*(f==='spinner'?.55:.76));if(f==='double-ring'){ctx.strokeStyle=s.accent;ring(93,-a,Math.PI);}if(f==='svg-spin')dot(68*Math.cos(a),68*Math.sin(a),8);}
 }else if(['dots','bars','squares','tiles'].includes(f)){
  for(let i=0;i<n;i++){const x=(i-(n-1)/2)*38,y=Math.sin(a-i*.7)*25;ctx.fillStyle=i%2?s.accent:s.ink;if(f==='dots')dot(x,y,10+(i+v)%3);else if(f==='bars')box(x-8,-30-y,16,60+2*y);else if(f==='squares'){ctx.save();ctx.translate(x,y);ctx.rotate(a+i*.2);box(-10,-10,20,20);ctx.restore();}else{ctx.globalAlpha=.3+.7*(.5+.5*Math.sin(a+i));box(x-15,-18,30,36);}}
 }else if(['orbit','trail','liquid','complex','collision','cradle'].includes(f)){
  for(let i=0;i<n;i++){const b=a+i*TAU/n;let x=Math.cos(b)*105,y=Math.sin(b)*58;
   if(f==='trail'){x=Math.cos(a-i*.15)*105;y=Math.sin(a-i*.15)*58;ctx.globalAlpha=(n-i)/n;}
   if(f==='liquid'){x=Math.sin(b)*80;y=Math.sin(b*2)*35;ctx.globalAlpha=.7;}
   if(f==='complex'){x=Math.cos(b*2)*105;y=Math.sin(b*3)*60;}
   if(f==='collision'){x=(i%2?1:-1)*(20+90*Math.abs(Math.cos(a)));y=(i-(n-1)/2)*15;}
   if(f==='cradle'){const swing=(i===0?Math.max(0,Math.sin(a)):i===n-1?Math.min(0,Math.sin(a)):0)*.6;x=(i-(n-1)/2)*27+Math.sin(swing)*65;y=-65+Math.cos(swing)*65;line((i-(n-1)/2)*27,-65,x,y);}
   dot(x,y,8+(i%3)*2,i%2?s.accent:s.ink);
  }
 }else if(['wheel','color-wheel','rainbow','fan','hexagon'].includes(f)){
  for(let i=0;i<(f==='hexagon'?6:12);i++){ctx.save();ctx.rotate(a+i*TAU/(f==='hexagon'?6:12));ctx.fillStyle=i%2?s.accent:s.ink;if(f==='fan')box(8,-3,100,10);else if(f==='hexagon')line(65,-37,65,37);else{ctx.lineWidth=f==='rainbow'?10:18;ctx.strokeStyle=i%2?s.accent:s.ink;ring(f==='rainbow'?45+i*4:70,0,.3);}ctx.restore();}
 }else if(['progress','count','film','screen'].includes(f)){
  if(f==='progress'){ctx.strokeRect(-180,-16,360,32);ctx.fillStyle=s.accent;box(-176,-12,352*prog,24);ctx.font='20px sans-serif';text(Math.round(prog*100)+'%',0,46);}
  else {ctx.font=f==='screen'?'600 100px sans-serif':'600 70px monospace';text(f==='film'?String(5-Math.min(4,Math.floor(p*5))):String(Math.round(prog*100)).padStart(2,'0'));if(f==='film'){ctx.lineWidth=2;ring(98,a,TAU);line(-125,0,125,0);line(0,-120,0,120);}if(f==='screen'){ctx.strokeStyle=s.accent;line(-170,74,170*prog,74);}}
 }else if(['cube','flip','fold','split-panel'].includes(f)){
  if(f==='cube'){const points=[];for(const z of [-1,1])for(const y of [-1,1])for(const x of [-1,1]){const X=x*Math.cos(a)+z*Math.sin(a),Z=-x*Math.sin(a)+z*Math.cos(a);points.push([X*65,(y*.85+Z*.3)*65]);}for(let i=0;i<8;i++)for(const bit of [1,2,4])if((i^bit)>i)line(...points[i],...points[i^bit]);}
  else if(f==='split-panel'){for(let i=0;i<2;i++){ctx.save();ctx.translate((i?1:-1)*78,0);ctx.scale(Math.max(.08,Math.abs(Math.cos(a+i*.7))),1);ctx.fillStyle=i?s.accent:s.ink;box(-68,-64,136,128);ctx.restore();}}
  else {ctx.save();ctx.scale(Math.cos(a),f==='fold'?Math.max(.08,Math.abs(Math.sin(a))):1);ctx.fillStyle=s.accent;box(-65,-65,130,130);ctx.fillStyle=s.bg;text('A');ctx.restore();}
 }else if(f==='radar'){ctx.lineWidth=1;for(const r of [35,65,95])ring(r,0,TAU);ctx.rotate(a);ctx.fillStyle=s.accent;ctx.globalAlpha*=.35;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,95,-.7,0);ctx.closePath();ctx.fill();ctx.globalAlpha/=.35;line(0,0,95,0);
 }else if(f==='border'){ctx.strokeRect(-190,-65,380,130);ctx.strokeStyle=s.accent;ctx.setLineDash([100,920]);ctx.lineDashOffset=-p*1020;ctx.strokeRect(-190,-65,380,130);text();
 }else if(f==='elastic'){ctx.beginPath();ctx.moveTo(-150,0);ctx.bezierCurveTo(-70,Math.sin(a)*95,70,-Math.sin(a)*95,150,0);ctx.stroke();dot(-150,0,7);dot(150,0,7);
 }else if(f==='water-ball'){ctx.beginPath();ctx.arc(0,0,85,0,TAU);ctx.clip();ctx.strokeStyle=s.ink;ctx.lineWidth=4;ring(83,0,TAU);ctx.fillStyle=s.accent;ctx.beginPath();ctx.moveTo(-90,90);for(let x=-90;x<=90;x+=3)ctx.lineTo(x,70-140*prog+8*Math.sin(x/24+a));ctx.lineTo(90,90);ctx.closePath();ctx.fill();
 }else if(f==='ripple'){for(let i=0;i<4;i++){const q=(p+i/4)%1;ctx.globalAlpha=1-q;ring(10+q*100,0,TAU);}
 }else if(f==='frost'){dot(-40+45*Math.sin(a),-20,65);dot(45,25+25*Math.cos(a),60,s.ink);ctx.globalAlpha*=.7;ctx.fillStyle=s.bg;box(-150,-65,300,130);ctx.globalAlpha/=.7;ctx.strokeStyle=s.ink;ctx.strokeRect(-150,-65,300,130);text('GLASS');
 }else if(f==='cup'){ctx.strokeRect(-55,-65,110,130);ctx.beginPath();ctx.arc(64,-12,29,-Math.PI/2,Math.PI/2);ctx.stroke();for(let i=0;i<3;i++){const x=-30+i*30;ctx.beginPath();ctx.moveTo(x,-85);ctx.quadraticCurveTo(x+Math.sin(a+i)*15,-110,x,-135);ctx.stroke();}
 }else if(f==='pencil'){ctx.save();ctx.translate(Math.cos(a)*70,Math.sin(a)*20);ctx.rotate(-.6);ctx.fillStyle=s.accent;box(-65,-8,130,16);ctx.beginPath();ctx.moveTo(65,-8);ctx.lineTo(85,0);ctx.lineTo(65,8);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle=s.ink;line(-140,60,-140+280*p,60);
 }else if(f==='rocket'){ctx.save();ctx.translate(0,-Math.sin(a)*18);ctx.fillStyle=s.ink;ctx.beginPath();ctx.moveTo(0,-85);ctx.quadraticCurveTo(-50,-30,-28,45);ctx.lineTo(28,45);ctx.quadraticCurveTo(50,-30,0,-85);ctx.fill();dot(0,-15,14,s.bg);ctx.fillStyle=s.accent;ctx.beginPath();ctx.moveTo(-15,45);ctx.lineTo(0,80+20*Math.sin(a*3));ctx.lineTo(15,45);ctx.fill();ctx.restore();
 }else if(f==='arrows'||f==='climb'){for(let i=0;i<4;i++){ctx.save();ctx.translate((i-1.5)*60,f==='climb'?30-i*22:0);ctx.globalAlpha=.3+.7*((p+i/4)%1);line(-16,-20,4,0);line(4,0,-16,20);ctx.restore();}
 }else if(f==='maze'){ctx.rotate(a/4);for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.strokeRect(-80+i*12,-80+i*12,160-i*24,160-i*24);ctx.restore();}
 }else if(f==='wipe'){ctx.save();clipRect(-250,-60,500*p,120);text();ctx.restore();ctx.strokeStyle=s.accent;line(-250+500*p,-60,-250+500*p,60);
 }else throw new RangeError('Unsupported family '+f);
 // Keep the content readable while the upper glyphs blink/fade/split.
 if(f.startsWith('text-')||f==='water-text'){ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.fillStyle=s.bg;ctx.fillRect(-280,87,560,50);ctx.fillStyle=s.ink;ctx.font='20px sans-serif';ctx.fillText(s.text,0,112);ctx.restore();}
 }finally{ctx.restore();}return {family:f,time:s.time,progress:prog,demonstration:s.progress===null};}
 function createRenderer(ctx,id,o={}){const fixed={...o};stateAt(id,0,fixed);return {renderAt:t=>draw(ctx,id,t,fixed)};}
 return Object.freeze({catalog,stateAt,draw,createRenderer});
});
