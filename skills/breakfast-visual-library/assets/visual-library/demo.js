/* All drawing is a pure function of time and explicit input image/colours.
   This page is a small integration example, not a film/timeline framework. */
(function(){
 'use strict';
 // The screenshot workflow reads pixels repeatedly; keep the raster path stable
 // instead of switching from accelerated to software drawing after readback.
 const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const view=new URLSearchParams(location.search).get('view')||'composition';
 const ink='#142b34',paper='#f4ead6',accent='#d76b40',blue='#4c8593';
 let input=null,extracted=null;
 const hash=n=>{let x=(n^7)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;};
 const frame=VisualFrames.createRenderer(ctx,'scan',{x:62,y:197,width:710,height:392,color:paper,stroke:2});
 const colorGraph={nodes:['picture','caption','price'],edges:[['picture','caption'],['caption','price']]};
 function imageLayer(t){
  ctx.save();ctx.beginPath();ctx.rect(42,175,754,450);ctx.clip();
  if(input){const scale=Math.max(754/input.width,450/input.height);ctx.drawImage(input,42+(754-input.width*scale)/2,175+(450-input.height*scale)/2,input.width*scale,input.height*scale);}
  else{
   const g=ctx.createLinearGradient(40,180,790,630);g.addColorStop(0,'#c56a42');g.addColorStop(1,'#17363f');ctx.fillStyle=g;ctx.fillRect(42,175,754,450);
   // Original still-life geometry, never presented as a photograph.
   ctx.strokeStyle='#ecd3aa';ctx.lineWidth=24;ctx.beginPath();ctx.arc(490,388,87,-1.3,1.3);ctx.stroke();
   const cup=ctx.createLinearGradient(260,280,520,520);cup.addColorStop(0,'#e9bf82');cup.addColorStop(1,'#9e442c');ctx.fillStyle=cup;ctx.beginPath();ctx.moveTo(257,285);ctx.quadraticCurveTo(255,528,385,536);ctx.quadraticCurveTo(517,525,517,285);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e9c899';ctx.beginPath();ctx.ellipse(387,287,130,39,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#482d25';ctx.beginPath();ctx.ellipse(387,287,106,24,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#f2d9b3';ctx.lineWidth=2;
   for(let i=0;i<9;i++){const u=i/8,dy=Math.sin(t*.6+u*2)*7;ctx.beginPath();ctx.moveTo(210+u*340,580);ctx.quadraticCurveTo(150+u*350,510+dy,195+u*340,440);ctx.stroke();}
  }
  // Lighting motion is analytic and repeatable, with no frame accumulation.
  if(!input){const light=ctx.createRadialGradient(170+t*95,300,15,170+t*95,300,330);light.addColorStop(0,'#ffffff38');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(42,175,754,450);}
  ctx.restore();
 }
 function renderAt(time){
  if(!Number.isFinite(time))throw new TypeError('renderAt needs finite seconds');const t=Math.max(0,Math.min(6,time));
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,1280,720);ctx.fillStyle=ink;ctx.fillRect(0,0,1280,720);
  ctx.strokeStyle='#35515a';ctx.lineWidth=1;
  // Subtle seeded construction lines are fixed, never dependent on frame order.
  for(let i=0;i<30;i++){const x=hash(i)*1280;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-190,720);ctx.stroke();}
  if(view==='marks'){
   ctx.fillStyle=paper;ctx.font='600 27px sans-serif';ctx.fillText('目标标记 / Canvas2D',34,42);
   VisualFrames.catalog.forEach((mark,i)=>{const x=22+(i%6)*210,y=62+Math.floor(i/6)*211;ctx.fillStyle=i%2?'#1b3540':'#19303a';ctx.fillRect(x,y,202,201);VisualFrames.draw(ctx,mark.id,t,{x:x+2,y:y+2,width:198,height:165,color:paper,stroke:2});ctx.fillStyle=paper;ctx.font='14px sans-serif';ctx.fillText(mark.name,x+12,y+187);});
  }else{
   ctx.fillStyle=paper;ctx.font='600 46px sans-serif';ctx.fillText('从图像，组织视线',42,83);ctx.font='16px sans-serif';ctx.fillText(input?'照片主色 / 文字承托 / 相邻区域':'几何示例 / 文字承托 / 相邻区域',45,120);
   imageLayer(t);frame.renderAt(t);
   // Alpha=.94 against arbitrary image pixels: validate the actual result before text.
   ctx.fillStyle='#142b34';ctx.globalAlpha=.94;ctx.fillRect(70,194,500,70);ctx.globalAlpha=1;
   ctx.fillStyle=paper;ctx.font='600 28px sans-serif';ctx.fillText('让信息落在看得清的位置',90,239);
   const swatches=extracted?.colors||[{hex:accent,share:.5},{hex:blue,share:.3},{hex:'#e7c377',share:.2}];
   const allocation=VisualColors.assign(colorGraph,[...new Set(swatches.map(c=>c.hex).concat([ink,paper]))]);
   ctx.font='15px sans-serif';ctx.fillStyle=paper;ctx.fillText(input?'这张图片的面积主色':'示例色板（原创设定）',838,195);
   swatches.slice(0,5).forEach((c,i)=>{const x=838+i*78;ctx.fillStyle=c.hex;ctx.fillRect(x,217,62,62);ctx.fillStyle=VisualColors.textFor(c.hex);ctx.font='12px sans-serif';ctx.fillText(Math.round(c.share*100)+'%',x+10,253);});
   ctx.fillStyle=paper;ctx.font='600 25px sans-serif';ctx.fillText('相邻部分，一起考虑',838,342);
   allocation.assignments.forEach((a,i)=>{const y=375+i*64;ctx.fillStyle=a.color;ctx.fillRect(838,y,386,55);ctx.fillStyle=a.text;ctx.font='16px sans-serif';ctx.fillText(['01  图像区域','02  说明区域','03  商品信息'][i],855,y+34);});
   ctx.fillStyle=paper;ctx.font='14px sans-serif';ctx.fillText('保留原图颜色；取色不等于识别商品。',838,602);
  }
  ctx.fillStyle=paper;ctx.font='13px sans-serif';ctx.fillText('组件调用示例 · 内容与时间可替换',42,688);
  return {time:t,view};
 }
 document.getElementById('time').addEventListener('input',e=>{const t=Number(e.target.value);document.getElementById('time-label').value=t.toFixed(2)+'s';renderAt(t);});
 document.getElementById('image').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  window.ready=(async()=>{
   let bitmap;
   try{
    bitmap=await createImageBitmap(file);if(!bitmap.width||!bitmap.height)throw new Error('图片为空');
    const small=document.createElement('canvas'),scale=Math.min(1,256/Math.max(bitmap.width,bitmap.height));small.width=Math.max(1,Math.round(bitmap.width*scale));small.height=Math.max(1,Math.round(bitmap.height*scale));const c=small.getContext('2d');c.drawImage(bitmap,0,0,small.width,small.height);
    const next=VisualPhotos.extract(c.getImageData(0,0,small.width,small.height).data,{count:5});
    if(input)input.close();input=bitmap;bitmap=null;extracted=next;
    document.getElementById('status').textContent='已在本机取色。主色按面积统计，小面积商品可能需要先裁切；图片未上传。';renderAt(Number(document.getElementById('time').value));
   }catch(error){document.getElementById('status').textContent='图片未应用：'+error.message;if(bitmap)bitmap.close();}
   return {duration:6,fps:24,width:1280,height:720};
  })();
 });
 window.renderAt=renderAt;
 window.ready=document.fonts.ready.then(()=>{renderAt(1);return {duration:6,fps:24,width:1280,height:720};});
})();
