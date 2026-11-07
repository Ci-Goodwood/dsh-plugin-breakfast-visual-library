(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VisualColors=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const valid=h=>typeof h==='string'&&/^#[a-f\d]{6}$/i.test(h);
 function bytes(h){if(!valid(h))throw new TypeError('Expected #RRGGBB');return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));}
 const hex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
 function luminance(h){const a=bytes(h).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function textFor(bg){return contrast(bg,'#ffffff')>contrast(bg,'#000000')?'#ffffff':'#000000';}
 function composite(fg,bg,alpha){if(!Number.isFinite(alpha)||alpha<0||alpha>1)throw new RangeError('alpha must be 0..1');const a=bytes(fg),b=bytes(bg);return hex(a.map((v,i)=>v*alpha+b[i]*(1-alpha)));}
 function lab(h){const [r,g,b]=bytes(h).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),x=(r*.4124564+g*.3575761+b*.1804375)/.95047,y=r*.2126729+g*.7151522+b*.072175,z=(r*.0193339+g*.119192+b*.9503041)/1.08883;const f=v=>v>216/24389?Math.cbrt(v):v*841/108+4/29;return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))];}
 function delta(a,b){const x=lab(a),y=lab(b);return Math.hypot(...x.map((v,i)=>v-y[i]));}
 function checkPixels(pixels){if(!pixels||!Number.isInteger(pixels.length)||!pixels.length||pixels.length%4||pixels.length>8000000)throw new RangeError('Expected 1..2,000,000 RGBA pixels');if(!(pixels instanceof Uint8Array)&&!(pixels instanceof Uint8ClampedArray)&&!Array.isArray(pixels))throw new TypeError('Expected byte array');if(Array.isArray(pixels)&&!pixels.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw new RangeError('Pixels must be bytes');}
 function auditPixels(foreground,pixels,{threshold=4.5,textAlpha=1,underlay}={}){
  bytes(foreground);checkPixels(pixels);if(!Number.isFinite(threshold)||threshold<1||threshold>21)throw new RangeError('threshold must be 1..21');if(!Number.isFinite(textAlpha)||textAlpha<0||textAlpha>1)throw new RangeError('textAlpha must be 0..1');if(underlay!==undefined)bytes(underlay);
  let minimum=Infinity,worstPixel=-1;
  for(let i=0;i<pixels.length;i+=4){let bg=hex(Array.from(pixels.slice(i,i+3)));if(pixels[i+3]<255){if(underlay===undefined)throw new Error('Transparent background requires underlay');bg=composite(bg,underlay,pixels[i+3]/255);}const ratio=contrast(composite(foreground,bg,textAlpha),bg);if(ratio<minimum){minimum=ratio;worstPixel=i/4;}}
  return {ok:minimum>=threshold,minimum,threshold,worstPixel,pixels:pixels.length/4};
 }
 function auditTimeline(foreground,frames,options={}){
  let worst=null,count=0;
  for(const frame of frames){if(!frame||!Number.isFinite(frame.time))throw new TypeError('Every frame needs finite time and pixels');const result=auditPixels(foreground,frame.pixels,options);if(!worst||result.minimum<worst.minimum)worst=Object.assign({time:frame.time},result);count++;}
  if(!count)throw new RangeError('Cannot pass an empty timeline');return Object.assign({sampledFrames:count,coverage:'Only supplied samples, not a proof between samples'},worst);
 }
 function assign(graph,palette,{distinct=true}={}){
  if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw new TypeError('Expected nodes and edges');
  if(!graph.nodes.length||graph.nodes.length>200)throw new RangeError('Expected 1..200 regions');
  if(!Array.isArray(palette)||!palette.length||palette.length>256||!palette.every(valid)||new Set(palette).size!==palette.length)throw new TypeError('Expected 1..256 unique #RRGGBB colours');
  const ids=graph.nodes.map(n=>typeof n==='string'?n:n?.id);if(ids.some(x=>typeof x!=='string'||!x.trim())||new Set(ids).size!==ids.length)throw new TypeError('Region IDs must be unique nonempty strings');
  const neighbors=new Map(ids.map(id=>[id,new Set()]));for(const e of graph.edges){if(!Array.isArray(e)||e.length!==2||!neighbors.has(e[0])||!neighbors.has(e[1])||e[0]===e[1])throw new TypeError('Invalid adjacency');neighbors.get(e[0]).add(e[1]);neighbors.get(e[1]).add(e[0]);}
  const chosen=new Map();let attempts=0,exhausted=false;
  function solve(){if(chosen.size===ids.length)return true;if(++attempts>50000){exhausted=true;return false;}const free=ids.filter(id=>!chosen.has(id));free.sort((a,b)=>new Set([...neighbors.get(b)].filter(n=>chosen.has(n)).map(n=>chosen.get(n))).size-new Set([...neighbors.get(a)].filter(n=>chosen.has(n)).map(n=>chosen.get(n))).size||neighbors.get(b).size-neighbors.get(a).size||ids.indexOf(a)-ids.indexOf(b));const id=free[0],used=[...neighbors.get(id)].filter(n=>chosen.has(n)).map(n=>chosen.get(n));const candidates=palette.map((_,i)=>i).filter(i=>!used.includes(i));const all=new Set(chosen.values()),score=i=>used.length?Math.min(...used.map(j=>delta(palette[i],palette[j]))):0;candidates.sort((a,b)=>(distinct?Number(all.has(a))-Number(all.has(b)):0)||score(b)-score(a)||a-b);for(const i of candidates){chosen.set(id,i);if(solve())return true;chosen.delete(id);if(exhausted)return false;}return false;}
  if(!solve())return {ok:false,reason:exhausted?'search-budget':'insufficient-colours',assignments:[]};
  const assignments=ids.map((id,i)=>({id,color:palette[chosen.get(id)],text:textFor(palette[chosen.get(id)]),pattern:chosen.get(id)%4,number:i+1}));
  const byId=new Map(assignments.map(x=>[x.id,x])),pairs=graph.edges.map(([a,b])=>({a,b,deltaE76:delta(byId.get(a).color,byId.get(b).color),contrast:contrast(byId.get(a).color,byId.get(b).color)}));
  return {ok:true,assignments,pairs,warnings:pairs.filter(p=>p.deltaE76<35||p.contrast<1.3),note:'Heuristic colour distance; add borders, labels or patterns. Not a colour-vision certification.'};
 }
 return Object.freeze({valid,contrast,textFor,composite,delta,assign,auditPixels,auditTimeline,checkPixels});
});
