/* Optional browser QA. Outputs are local measurements, never source assets. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {performance}=require('node:perf_hooks');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const C=require('./colors.js');
const ROOT=__dirname;
const OUTPUT=path.resolve(process.env.VISUAL_OUTPUT||path.join(ROOT,'out'));
const sources=['demo.html','demo.js','frames.js','colors.js','photos.js','package.json','README.md','SOURCES.md'];
function copyModule(to){fs.mkdirSync(to,{recursive:true});for(const file of sources)fs.copyFileSync(path.join(ROOT,file),path.join(to,file));}
function scan(){for(const name of ['demo.js','frames.js','colors.js','photos.js']){const s=fs.readFileSync(path.join(ROOT,name),'utf8');for(const api of [/Math\.random\s*\(/,/Date\.now\s*\(/,/performance\.now\s*\(/,/requestAnimationFrame\s*\(/,/setInterval\s*\(/,/setTimeout\s*\(/,/fetch\s*\(/])assert(!api.test(s),name+' uses forbidden rendering API '+api);}}
(async()=>{
 const start=performance.now();fs.mkdirSync(OUTPUT,{recursive:true});scan();
 const isolated=path.join(OUTPUT,'isolated-copy');copyModule(isolated);
 const browser=await chromium.launch(Object.assign({headless:true},process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}));
 const page=await browser.newPage({viewport:{width:1320,height:900},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 const checks=[],timings=[];
 try{
  await page.goto(pathToFileURL(path.join(isolated,'demo.html')).href);
  const meta=await page.evaluate(()=>window.ready);assert.deepEqual(meta,{duration:6,fps:24,width:1280,height:720});
  const results=await page.evaluate(async()=>{
   const c=document.getElementById('scene'),ctx=c.getContext('2d');
   const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(v=>v.toString(16).padStart(2,'0')).join('');
   const times=[0,.2,.65,1,2.4,3.2,5.958333333333333,6];
   const baseline={};for(const t of times){window.renderAt(t);baseline[t]=await hash(ctx.getImageData(0,0,c.width,c.height).data);}
   for(const i of [6,0,4,1,7,2,5,3]){const t=times[i];window.renderAt(t);if(await hash(ctx.getImageData(0,0,c.width,c.height).data)!==baseline[t])throw new Error('Frame order changed pixels at '+t);}
   const scratch=document.createElement('canvas');scratch.width=320;scratch.height=200;const sc=scratch.getContext('2d',{willReadFrequently:true});const targets=[];
   for(const mark of VisualFrames.catalog){
    const hashes=[];
    for(const t of [0,.4,1,2.4]){sc.clearRect(0,0,320,200);VisualFrames.draw(sc,mark.id,t);hashes.push(await hash(sc.getImageData(0,0,320,200).data));}
    if(hashes[0]===hashes[2])throw new Error('No entrance pixels '+mark.id);
    sc.clearRect(0,0,320,200);VisualFrames.draw(sc,mark.id,1);if(await hash(sc.getImageData(0,0,320,200).data)!==hashes[2])throw new Error('Mark history leak '+mark.id);
    sc.save();sc.translate(11,17);sc.globalAlpha=.7;sc.lineWidth=7;sc.setLineDash([4,5]);sc.font='17px serif';const before=[sc.getTransform().toString(),sc.globalAlpha,sc.lineWidth,sc.font,sc.getLineDash().join(',')];VisualFrames.draw(sc,mark.id,1);const after=[sc.getTransform().toString(),sc.globalAlpha,sc.lineWidth,sc.font,sc.getLineDash().join(',')];sc.restore();if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Context leaked '+mark.id);
    targets.push({id:mark.id,hash:hashes[2]});
   }
   if(new Set(targets.map(t=>t.hash)).size!==18)throw new Error('Two target types painted identical pixels');
   const textSamples=[];const original=CanvasRenderingContext2D.prototype.fillText;let at=0;
   CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(text==='让信息落在看得清的位置')textSamples.push({time:at,pixels:this.getImageData(90,211,440,32).data});return original.call(this,text,...args);};
   try {for(let i=0;i<=144;i++){at=i/24;window.renderAt(at);}}finally{CanvasRenderingContext2D.prototype.fillText=original;}
   const audit=VisualColors.auditTimeline('#f4ead6',textSamples);
   if(!audit.ok)throw new Error('Worst text background fails '+JSON.stringify(audit));
   window.renderAt(2.4);
   return {frameHashes:baseline,targets,audit};
  });
  checks.push('isolated copied module runs offline; ready duration/fps contract; no external HTTP requests');
  checks.push('8 times rendered in ordered/shuffled order match full RGBA SHA256 exactly');
  checks.push('all 18 Canvas targets paint distinct pixels, change through entrance and restore caller context');
  checks.push('145 frame backgrounds under the example title sampled before drawing text; worst contrast passes');
  const worstBackground='#'+[20,43,52].map(v=>Math.ceil(v*.94+255*.06).toString(16).padStart(2,'0')).join('');
  const bound=C.contrast('#f4ead6',worstBackground);assert(bound>=4.5);
  checks.push('example dark backing has conservative 4.5:1 lower bound against any underlying RGB image; does not certify other placements');
  await page.locator('#scene').screenshot({path:path.join(OUTPUT,'composition.png')});
  const loops=40;const bench=await page.evaluate(n=>{const samples=[];for(let i=0;i<n;i++){const a=performance.now();window.renderAt(i/24);samples.push(performance.now()-a);}return samples;},loops);
  // performance.now above is exclusively in this QA driver, never in render sources.
  timings.push(...bench);timings.sort((a,b)=>a-b);
  const captured=[];
  for(let i=0;i<12;i++){const began=performance.now();await page.evaluate(t=>window.renderAt(t),i/24);await page.locator('#scene').screenshot({path:path.join(OUTPUT,`frame-${String(i).padStart(3,'0')}.png`)});captured.push(performance.now()-began);}
  captured.sort((a,b)=>a-b);
  // A generated test input exercises the local photo path, without shipping a photo.
  const fixture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.fillStyle='#cc4422';x.fillRect(0,0,48,64);x.fillStyle='#226688';x.fillRect(48,0,16,64);return c.toDataURL('image/png').split(',')[1];});
  await page.locator('#image').setInputFiles({name:'qa-only.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
  await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('已在本机取色'));
  await page.evaluate(()=>window.ready);await page.evaluate(()=>window.renderAt(2));
  await page.locator('#scene').screenshot({path:path.join(OUTPUT,'local-image.png')});
  checks.push('local image decode, resize and colour extraction succeed without uploads');
  await page.goto(pathToFileURL(path.join(isolated,'demo.html')).href+'?view=marks');await page.evaluate(()=>window.ready);await page.evaluate(()=>window.renderAt(1));await page.locator('#scene').screenshot({path:path.join(OUTPUT,'targets.png')});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('390px demo does not overflow');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const report={date:new Date().toISOString(),ok:true,environment:{platform:os.platform(),arch:os.arch(),node:process.version,browser:browser.version(),channel:process.env.PLAYWRIGHT_CHANNEL||'bundled-chromium'},config:{width:1280,height:720,fps:24,duration:6,seed:7,backgroundSamples:145,benchmarkFrames:loops},checks,contrast:{sampled:results.audit,continuousExampleLowerBound:bound,boundBackground:worstBackground},renderMilliseconds:{median:timings[Math.floor(timings.length/2)],p95:timings[Math.min(timings.length-1,Math.floor(timings.length*.95))],scope:'synchronous Canvas draw calls only, browser timer precision applies; excludes raster completion/screenshot/encoding'},screenshotMilliseconds:{frames:captured.length,median:captured[Math.floor(captured.length/2)],p95:captured.at(-1),scope:'renderAt + browser screenshot + PNG file write; not MP4 encoding'},elapsedSeconds:(performance.now()-start)/1000,cost:{gpuCNY:0,additionalPaidAPICNY:0,subscription:'shared usage not attributable per task'},sourceHashes:Object.fromEntries(sources.map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,n))).digest('hex')])),results,errors,requests};
  fs.writeFileSync(path.join(OUTPUT,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,checks:checks.length,elapsedSeconds:report.elapsedSeconds,contrast:report.contrast,renderMilliseconds:report.renderMilliseconds,output:OUTPUT}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
