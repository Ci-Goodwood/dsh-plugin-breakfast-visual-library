(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./colors.js'):root.VisualColors);if(typeof module==='object'&&module.exports)module.exports=api;else root.VisualPhotos=api;})(typeof globalThis!=='undefined'?globalThis:this,function(colors){
 'use strict';
 function extract(rgba,{count=5,alphaThreshold=128}={}){
  colors.checkPixels(rgba);if(!Number.isInteger(count)||count<1||count>12)throw new RangeError('count must be 1..12');if(!Number.isInteger(alphaThreshold)||alphaThreshold<0||alphaThreshold>255)throw new RangeError('alphaThreshold must be 0..255');
  const bins=new Map();let total=0;
  for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]===0||rgba[i+3]<alphaThreshold)continue;const r=rgba[i],g=rgba[i+1],b=rgba[i+2],key=(r>>3)*1024+(g>>3)*32+(b>>3),v=bins.get(key)||{key,r:0,g:0,b:0,n:0};v.r+=r;v.g+=g;v.b+=b;v.n++;bins.set(key,v);total++;}
  if(!total)throw new Error('No sufficiently opaque pixels');
  const points=[...bins.values()].map(v=>({key:v.key,rgb:[v.r/v.n,v.g/v.n,v.b/v.n],n:v.n})).sort((a,b)=>b.n-a.n||a.key-b.key);
  const dist=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0),centers=[points[0].rgb.slice()];
  while(centers.length<Math.min(count,points.length)){let best=null,score=-1;for(const p of points){const d=Math.min(...centers.map(c=>dist(c,p.rgb)))*Math.sqrt(p.n);if(d>score){score=d;best=p.rgb;}}if(score<=0)break;centers.push(best.slice());}
  let groups=[];
  for(let round=0;round<12;round++){groups=centers.map(()=>({sum:[0,0,0],n:0}));for(const p of points){let index=0,best=Infinity;centers.forEach((c,i)=>{const d=dist(c,p.rgb);if(d<best){best=d;index=i;}});const g=groups[index];g.n+=p.n;p.rgb.forEach((v,i)=>g.sum[i]+=v*p.n);}groups.forEach((g,i)=>{if(g.n)centers[i]=g.sum.map(v=>v/g.n);});}
  const merged=new Map();groups.forEach((g,i)=>{if(!g.n)return;const hex='#'+centers[i].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''),old=merged.get(hex)||{hex,pixels:0};old.pixels+=g.n;merged.set(hex,old);});
  return {colors:[...merged.values()].map(c=>Object.assign(c,{share:c.pixels/total})).sort((a,b)=>b.pixels-a.pixels||a.hex.localeCompare(b.hex)),sampledPixels:total,method:'Deterministic area-weighted RGB clustering, no semantic segmentation'};
 }
 return Object.freeze({extract});
});
