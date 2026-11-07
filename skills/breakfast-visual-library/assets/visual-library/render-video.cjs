/* Capture the same ready/renderAt contract used by workspace animation pages. */
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{performance}=require('node:perf_hooks'),{spawnSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const output=path.resolve(process.argv[2]||'out/video-integration'),entry=path.resolve(process.env.VISUAL_ENTRY||path.join(__dirname,'gallery.html'));
 if(fs.existsSync(output))throw new Error('Choose a new output directory');
 if(!fs.statSync(entry).isFile())throw new Error('Local HTML entry required');
 const started=performance.now(),browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 let report;
 try{
  const page=await browser.newPage({viewport:{width:1320,height:880},deviceScaleFactor:1}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const url=pathToFileURL(entry);url.search=process.env.VISUAL_QUERY||'module=integration';await page.goto(url.href);const meta=await page.evaluate(()=>window.ready);
  if(!meta||![meta.duration,meta.fps,meta.width,meta.height].every(Number.isFinite)||meta.duration<=0||meta.duration>60||!Number.isInteger(meta.fps)||meta.fps<1||meta.fps>120||meta.width<=0||meta.height<=0)throw new Error('Invalid ready metadata');
  const frames=Math.ceil(meta.duration*meta.fps),dir=path.join(output,'frames');fs.mkdirSync(dir,{recursive:true});const samples=[];
  for(let i=0;i<frames;i++){const a=performance.now();await page.evaluate(t=>window.renderAt(t),i/meta.fps);await page.locator('#scene').screenshot({path:path.join(dir,`frame-${String(i).padStart(6,'0')}.png`)});samples.push(performance.now()-a);}
  if(errors.length||requests.length)throw new Error(JSON.stringify({errors,requests}));samples.sort((a,b)=>a-b);
  report={date:new Date().toISOString(),ok:true,meta,frames,browser:browser.version(),node:process.version,captureSeconds:(performance.now()-started)/1000,screenshotMilliseconds:{median:samples[Math.floor(samples.length/2)],p95:samples[Math.min(samples.length-1,Math.floor(samples.length*.95))]},cost:{gpuCNY:0,additionalPaidAPICNY:0},errors,requests};
 }finally{await browser.close();}
 const python=process.env.VISUAL_PYTHON||'python',encoded=spawnSync(python,[path.join(__dirname,'encode-frames.py'),path.join(output,'frames'),path.join(output,'integration.mp4'),'--fps',String(report.meta.fps)],{encoding:'utf8'});
 if(encoded.status!==0)throw new Error(encoded.stderr||encoded.stdout||'Encoder failed');report.encoding=JSON.parse(encoded.stdout.trim());report.totalSeconds=(performance.now()-started)/1000;fs.writeFileSync(path.join(output,'render-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
