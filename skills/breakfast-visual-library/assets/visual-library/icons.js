/* Native Canvas geometry. Mono cut-outs are isolated, never erase caller pixels. */
(function(r,f){const a=f(typeof module==='object'&&module.exports?require('./icon-data.js'):r.VisualIconData);if(typeof module==='object'&&module.exports)module.exports=a;else r.VisualIcons=a;})(typeof globalThis==='undefined'?this:globalThis,function(data){
 'use strict';
 const records=new Map(data.map(x=>[x.id,x]));
 const catalog=Object.freeze(data.map(({parts,...x})=>Object.freeze({...x,tags:Object.freeze(x.tags.slice()),anchor:Object.freeze(x.anchor.slice())})));
 function options(id,t,o={}){if(!records.has(id))throw new RangeError('Unknown icon');if(!Number.isFinite(t))throw new TypeError('finite time required');const p={x:0,y:0,size:128,ink:'#142b34',accent:'#a4342a',paper:'#f4ead6',mode:'duotone',animate:false,...o};if(![p.x,p.y,p.size].every(Number.isFinite)||p.size<=0||p.size>4096)throw new RangeError('Invalid bounds');if(!['duotone','mono'].includes(p.mode))throw new RangeError('Invalid mode');for(const k of ['ink','accent','paper'])if(!/^#[a-f\d]{6}$/i.test(p[k]))throw new TypeError('Invalid colour');return p;}
 function paint(ctx,part,color){const p=new Path2D();if(part.type==='path')p.addPath(new Path2D(part.d));else if(part.type==='rect')p.rect(part.x,part.y,part.w,part.h);else p.arc(part.cx,part.cy,part.r,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle=color;ctx.lineWidth=part.stroke||1;ctx.lineCap='square';ctx.lineJoin='miter';if(part.stroke)ctx.stroke(p);else ctx.fill(p,'evenodd');}
 function draw(ctx,id,t=1,o={}){const p=options(id,t,o),item=records.get(id),progress=p.animate?Math.min(1,Math.max(0,t/.6)):1;ctx.save();try{ctx.translate(p.x,p.y+(1-progress)*12);ctx.scale(p.size/128,p.size/128);
  if(p.mode==='mono'){
   // All bodies first, then all holes, matching the original group mask semantics.
   const canvas=new OffscreenCanvas(Math.ceil(p.size),Math.ceil(p.size)),c=canvas.getContext('2d');c.scale(p.size/128,p.size/128);for(const x of item.parts.filter(x=>x.role!=='paper'))paint(c,x,p.ink);c.globalCompositeOperation='destination-out';for(const x of item.parts.filter(x=>x.role==='paper'))paint(c,x,'#000000');ctx.drawImage(canvas,0,0,128,128);
  }else for(const x of item.parts)paint(ctx,x,p[x.role]);
 }finally{ctx.restore();}return {id,time:Math.max(0,t)};}
 function createRenderer(ctx,id,o={}){const fixed={...o};options(id,0,fixed);return {renderAt:t=>draw(ctx,id,t,fixed)};}
 function compose(ctx,items,t=1){if(!Array.isArray(items)||items.length>1000)throw new RangeError('items must be <=1000');for(const x of items)options(x.id,t,x);for(const x of items){const anchor=records.get(x.id).anchor,size=x.size||128;draw(ctx,x.id,t,{...x,x:(x.x||0)-anchor[0]*size/128,y:(x.y||0)-anchor[1]*size/128});}}
 function search(query='',family){const q=String(query).trim().toLowerCase();return catalog.filter(x=>(!family||x.family===family)&&[x.id,x.name,x.category,...x.tags].join(' ').toLowerCase().includes(q));}
 return Object.freeze({catalog,draw,createRenderer,compose,search,options});
});
