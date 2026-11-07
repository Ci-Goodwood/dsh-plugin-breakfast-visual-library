/* Image mechanisms, reimplemented for Canvas instead of PowerPoint Morph. */
(function(r,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else r.VisualEffects=a;})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const catalog=['ring-reveal','cutout-path','parallax','fade','wipe','emphasis','rotate','path'];
 function stateAt(id,t,o={}){if(!catalog.includes(id))throw new RangeError('Unknown effect');if(!Number.isFinite(t))throw new TypeError('finite time');const p={x:0,y:0,width:640,height:360,duration:1.4,...o};if(![p.x,p.y,p.width,p.height,p.duration].every(Number.isFinite)||p.width<=0||p.height<=0||p.duration<=0)throw new RangeError('bounds/duration');const progress=Math.max(0,Math.min(1,t/p.duration)),ease=1-(1-progress)**3;return {...p,time:Math.max(0,t),progress,ease};}
 function cover(ctx,image,x,y,w,h){if(!image||!Number.isFinite(image.width)||!Number.isFinite(image.height)||image.width<=0||image.height<=0)throw new TypeError('decoded image required');const scale=Math.max(w/image.width,h/image.height),sw=w/scale,sh=h/scale;ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);}
 function draw(ctx,id,t,o={}){const s=stateAt(id,t,o);if(!o.image||!Number.isFinite(o.image.width)||!Number.isFinite(o.image.height)||o.image.width<=0||o.image.height<=0)throw new TypeError('decoded image with nonzero dimensions required');ctx.save();try{ctx.translate(s.x,s.y);ctx.beginPath();ctx.rect(0,0,s.width,s.height);ctx.clip();const w=s.width,h=s.height,p=s.ease;
  if(id==='ring-reveal'){for(let i=0;i<4;i++){ctx.save();try{const local=Math.max(0,Math.min(1,(s.progress-i*.12)/.64)),angle=(1-local)*(i%2?-1:1)*Math.PI*.7;ctx.translate(w/2,h/2);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,Math.hypot(w,h)*.51*local,0,Math.PI*2);if(i)ctx.arc(0,0,Math.hypot(w,h)*.51*local*i/4,0,Math.PI*2,true);ctx.clip('evenodd');cover(ctx,o.image,-w/2,-h/2,w,h);}finally{ctx.restore();}}}
  else if(id==='cutout-path'){// Pass a transparent cut-out to retain the silhouette.
   const scale=Math.min(w/o.image.width,h*.86/o.image.height),iw=o.image.width*scale,ih=o.image.height*scale;const x=(1-p)*(-iw)+p*(w-iw)*.6,y=(h-ih)/2-Math.sin(Math.PI*p)*h*.16;ctx.drawImage(o.image,x,y,iw,ih);
  }else if(id==='parallax'){cover(ctx,o.image,0,0,w,h);for(let i=1;i<=3;i++){ctx.save();try{const x=w*(.3+i*.12),shift=(1-p)*i*14;ctx.beginPath();ctx.moveTo(x+22,0);ctx.lineTo(x+w*.16,0);ctx.lineTo(x+w*.12,h);ctx.lineTo(x-22,h);ctx.closePath();ctx.clip();ctx.globalAlpha*=.35+i*.1;cover(ctx,o.image,-shift,0,w+shift*2,h);}finally{ctx.restore();}}}
  else if(id==='fade'){ctx.globalAlpha*=p;cover(ctx,o.image,0,0,w,h);}
  else if(id==='wipe'){ctx.beginPath();ctx.rect(0,0,w*p,h);ctx.clip();cover(ctx,o.image,0,0,w,h);}
  else if(id==='emphasis'){const k=1+.08*Math.sin(Math.PI*s.progress);ctx.translate(w/2,h/2);ctx.scale(k,k);cover(ctx,o.image,-w/2,-h/2,w,h);}
  else if(id==='rotate'){ctx.translate(w/2,h/2);ctx.rotate((1-p)*-.2);const k=1.25-.25*p;ctx.scale(k,k);cover(ctx,o.image,-w/2,-h/2,w,h);}
  else {ctx.translate((1-p)*-w*.4,Math.sin(Math.PI*p)*-h*.12);cover(ctx,o.image,0,0,w,h);}
 }finally{ctx.restore();}return s;}
 function createRenderer(ctx,id,o={}){const fixed={...o};stateAt(id,0,fixed);return {renderAt:t=>draw(ctx,id,t,fixed)};}
 return Object.freeze({catalog,stateAt,draw,cover,createRenderer});
});
