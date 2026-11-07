(function(root){
 'use strict';
 const catalog=[
  {id:'vertical',name:'竖排原典',use:'参考视频式：右起竖排、朱色句读、下方释义'},
  {id:'quote',name:'横排引文',use:'理论文献 / 现代正文 / 单条引述'},
  {id:'translation',name:'原文与译文',use:'双栏对应 / 明确分层'},
  {id:'parallel',name:'逐段对照',use:'原文与译文按段落配对'},
  {id:'margin',name:'正文与旁批',use:'正文 + 独立批注栏'},
  {id:'footnote',name:'正文与脚注',use:'编号注释 / 出处条'},
  {id:'sidebar',name:'画面旁引文',use:'地图 / 照片留位 + 引文侧栏'},
  {id:'lower-third',name:'引文字幕条',use:'透明叠加 / 引文与出处'},
  {id:'comparison',name:'双文献比较',use:'两段原文并置 / 差异说明'}
 ];
 const sample={title:'原文与释义',original:'学而时习之，不亦说乎？\n\n有朋自远方来，不亦乐乎？\n\n人不知而不愠，不亦君子乎？',translation:'学习并时常温习，不也是令人愉快的事吗？\n\n有志同道合的人从远方来，不也是令人快乐的事吗？\n\n别人不了解自己，也不因此怨愤，不也是君子的修养吗？',notes:'说：此处读 yuè，通“悦”。\n愠：怨愤、生气。\n译文为本素材库排版演示意译，非权威校注。',source:'《论语·学而》第一章',secondarySource:'译文：本素材库演示意译',highlight:'学,习,君子'};
 const theory={title:'论证与注释',original:'讨论一种制度，应当同时考察它如何组织劳动、分配资源，以及由谁作出决定。\n\n当规则在不同群体之间产生不同后果时，分析需要把这些后果具体地写出来，而不是停留在抽象评价。',translation:'解释文字可以比正文更口语，也可以补充正文省略的背景。\n\n原文、解释和引用出处应当分层，让读者知道哪些话来自文献，哪些话属于作者的分析。',notes:'这是素材库原创排版示范，不是马列毛文献引文。\n实际引用请替换成经核对的原文，并补齐版本与页码。',source:'早餐视觉素材库 · 原创排版示例',secondarySource:'解释文字 · 原创示例',highlight:'劳动,资源,决定'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const closing=/^[，。！？；：、）》】」』”’％,.!?;:)]/u,opening=/[（《【「『“‘(]$/u;
 function rough(s,size){return [...s].reduce((n,c)=>n+(/[\u0000-\u00ff]/.test(c)?size*.56:size),0)}
 function wrap(text,width,size,measure=rough){
  const lines=[];
  for(const paragraph of String(text||'').replace(/\r\n?/g,'\n').split('\n')){
   if(!paragraph){lines.push('');continue}let current='';
   for(const char of [...paragraph]){
    if(current&&measure(current+char,size)>width){
     if(closing.test(char)){const chars=[...current];let tail=char;while(chars.length&&closing.test(chars[chars.length-1]))tail=chars.pop()+tail;if(chars.length)tail=chars.pop()+tail;if(chars.length&&opening.test(chars[chars.length-1]))tail=chars.pop()+tail;if(chars.length)lines.push(chars.join(''));current=tail}
     else if(opening.test(current)){const chars=[...current],last=chars.pop();if(chars.length)lines.push(chars.join(''));current=last+char}
     else{lines.push(current);current=char}
    }else current+=char;
   }if(current)lines.push(current);
  }return lines.length?lines:[''];
 }
 function paginate(lines,capacity){const out=[];for(let i=0;i<lines.length;i+=capacity)out.push(lines.slice(i,i+capacity));return out.length?out:[[]]}
 function render(input={},config={}){
  const o={...sample,...input},id=config.layout||'vertical';if(!catalog.some(x=>x.id===id))throw new Error('未知版式');
  for(const k of ['original','translation','notes','title','source','secondarySource','highlight']){if(typeof o[k]!=='string')throw new Error(k+' 须为字符串');if(o[k].length>30000)throw new Error(k+' 超过30000字符')}
  const theme=config.theme||{bg:'#f7f4ed',text:'#0f1423',note:'#4a4035',accent:'#862617'};
  if(!['bg','text','note','accent'].every(k=>/^#[a-f\d]{6}$/i.test(theme[k])))throw new Error('主题颜色须为 #RRGGBB');
  const size=Number(config.fontSize||30);if(!Number.isFinite(size)||size<24||size>48)throw new Error('字号须为24–48');
  const notes=o.notes.split('\n').filter(Boolean),terms=o.highlight.split(/[,，\n]/).map(s=>s.trim()).filter(Boolean).sort((a,b)=>b.length-a.length),measure=config.measure||rough;
  const scene={width:1280,height:720,nodes:[],warnings:[],pages:1,page:0,layout:id,fonts:{body:'BreakfastSerif',ui:'BreakfastSans'},theme};
  const n=scene.nodes;
  const rect=(x,y,w,h,fill,extra={})=>n.push({kind:'rect',x,y,w,h,fill,...extra});
  const line=(x1,y1,x2,y2,color,width=1)=>n.push({kind:'line',x1,y1,x2,y2,color,width});
  const text=(value,x,y,px=size,fill=theme.text,font='body',extra={})=>n.push({kind:'text',value,x,y,size:px,fill,font,...extra});
  function shortened(value,maxWidth,px){if(measure(value,px)<=maxWidth)return value;let out='';for(const char of [...value]){if(measure(out+char+'…',px)>maxWidth)break;out+=char}return out+'…'}
  function runs(value,x,y,px,fill){let pos=x;while(value){let found=null,index=Infinity;for(const term of terms){const k=value.indexOf(term);if(k>=0&&k<index){index=k;found=term}}if(!found){text(value,pos,y,px,fill);break}if(index){const part=value.slice(0,index);text(part,pos,y,px,fill);pos+=measure(part,px)}const w=measure(found,px);rect(pos,y-px*.85,w,px*1.15,theme.accent,{opacity:.13});text(found,pos,y,px,fill);pos+=w;value=value.slice(index+found.length)}}
  function block(lines,x,y,px,fill=theme.text,leading=1.65){lines.forEach((v,i)=>runs(v,x,y+i*px*leading,px,fill))}
  const bg=config.transparent&&id==='lower-third'?'none':theme.bg;if(bg!=='none')rect(0,0,1280,720,bg);
  if(id!=='lower-third'&&id!=='sidebar'){
   rect(52,42,10,14,theme.accent);text('引文 / '+catalog.find(x=>x.id===id).name,76,54,13,theme.note,'ui');
   text(shortened(o.title,1150,26),52,109,26,theme.text,'ui');line(52,130,1228,130,theme.note,.6);
  }
  let panels=[];
  const panel=(key,x,y,w,h,px,fill,leading=1.65)=>{const capacity=Math.max(1,Math.floor((h-px)/(px*leading))+1),pages=paginate(wrap(key,w,px,measure),capacity);panels.push({pages,draw:lines=>block(lines,x,y,px,fill,leading)});return pages.length};
  if(id==='vertical'){
   const px=size,columnHeight=342,rows=Math.floor(columnHeight/(px*1.23)),columns=Math.max(1,Math.floor(1000/(px*1.65))),charsPerPage=rows*columns;
   // Wrap as columns using a fixed glyph grid, preserving explicit paragraph breaks.
   const columnsText=[];for(const para of o.original.split(/\n+/)){let chars=[...para];while(chars.length){let take=Math.min(rows,chars.length);if(take<chars.length&&closing.test(chars[take])&&take>1)take--;if(take>1&&opening.test(chars[take-1]))take--;columnsText.push(chars.splice(0,take).join(''))}}
   const pages=paginate(columnsText,columns);panels.push({pages,draw:cols=>cols.forEach((col,i)=>{const x=1160-i*px*1.65;[...col].forEach((char,j)=>{const punctuation=/[，。！？；：、]/u.test(char),y=196+j*px*1.23;text(char,x+(punctuation?px*.32:0),y-(punctuation?px*.38:0),px,punctuation?theme.accent:theme.text,'body',{anchor:'middle'})})})});
   line(1200,165,1200,532,theme.note,.8);const sourceLines=wrap(o.source,900,18,measure);sourceLines.slice(0,2).forEach((s,i)=>text(s,70,574+i*25,18,theme.note,'ui'));if(sourceLines.length>2)scene.warnings.push('出处超过两行；请缩短或移至备注');
   panel(o.translation.replace(/\n\n/g,'\n'),70,618,1120,80,20,theme.text,1.45);
   if(notes.length)scene.warnings.push('竖排参考款不显示独立注释；需要批注请用旁批或脚注款');
  }else if(id==='quote'){
   rect(52,168,7,337,theme.accent);panel(o.original,90,211,1090,285,size+4,theme.text);panel(o.translation.replace(/\n\n/g,'\n'),90,551,1090,100,20,theme.note,1.5);
  }else if(id==='translation'||id==='comparison'){
   text(id==='comparison'?'文献 A / 原文':'原文',60,180,15,theme.note,'ui');text(id==='comparison'?'文献 B / 比较文字':'译文 / 解释',680,180,15,theme.note,'ui');line(637,160,637,622,theme.note,.6);
   panel(o.original,60,226,535,360,size,theme.text);panel(o.translation,680,226,535,360,size-2,theme.text);
   text(o.secondarySource,680,635,16,theme.note,'ui');
  }else if(id==='parallel'){
   const a=o.original.split(/\n\s*\n/),b=o.translation.split(/\n\s*\n/);if(a.length!==b.length)scene.warnings.push('原文与译文段数不一致；缺失段以提示显示，不猜测对应关系');
   const paired=[];for(let i=0;i<Math.max(a.length,b.length);i++){const left=paginate(wrap(a[i]||'〔此段原文未提供〕',520,size,measure),4),right=paginate(wrap(b[i]||'〔此段译文未提供〕',520,size-2,measure),4);for(let j=0;j<Math.max(left.length,right.length);j++)paired.push({index:i+1,a:left[j]||['〔原文见前页〕'],b:right[j]||['〔译文见前页〕']})}
   panels.push({pages:paginate(paired,1),draw:rows=>rows.forEach(row=>{text('段落 '+row.index,60,180,15,theme.note,'ui');block(row.a,60,247,size);block(row.b,690,247,size-2);line(638,197,638,590,theme.note,.6)})});
  }else if(id==='margin'){
   text('原文',60,179,15,theme.note,'ui');panel(o.original,60,226,760,374,size,theme.text);line(865,165,865,625,theme.note,.6);text('批注 / 说明',905,179,15,theme.note,'ui');panel(notes.map((s,i)=>`[${i+1}] ${s}`).join('\n\n'),905,221,300,380,22,theme.note,1.6);
  }else if(id==='footnote'){
   panel(o.original,60,205,1150,238,size,theme.text);line(60,485,1220,485,theme.note,.6);panel(notes.map((s,i)=>`[${i+1}] ${s}`).join('\n'),60,525,1150,108,21,theme.note,1.5);
  }else if(id==='sidebar'){
   if(config.preview){rect(52,160,635,472,theme.note,{opacity:.05});text('地图 / 照片 / 视频预留区',100,386,22,theme.note,'ui');text('导出时此提示不出现',100,426,16,theme.note,'ui')}
   rect(735,145,510,550,theme.bg);line(735,158,735,678,theme.accent,4);text(shortened(o.title,425,18),775,180,18,theme.note,'ui');panel(o.original,775,234,425,265,size-2,theme.text);panel(o.translation,775,552,425,70,20,theme.note,1.5);text(shortened(o.source.replace(/\n/g,' '),355,13),775,675,13,theme.note,'ui');if(measure(o.source,13)>355)scene.warnings.push('侧栏出处过长，显示省略号；完整来源保留在 JSON');
   if(config.transparent){const background=n.findIndex(x=>x.kind==='rect'&&x.x===0&&x.y===0);if(background>=0)n.splice(background,1)}
  }else if(id==='lower-third'){
   rect(55,475,1170,206,theme.bg);rect(55,475,8,206,theme.accent);panel(o.original,91,529,1092,89,28,theme.text,1.45);panel(o.source,91,649,1090,27,17,theme.note,1.3);
  }
  scene.pages=Math.max(1,...panels.map(p=>p.pages.length));scene.page=Math.max(0,Math.min(scene.pages-1,Math.floor(Number(config.page)||0)));
  for(const p of panels){const lines=p.pages[scene.page];if(lines)p.draw(lines);else if(p.pages.length===1)p.draw(p.pages[0]);else scene.warnings.push('此栏已在前页排完')}
  if(scene.pages>1)scene.warnings.push('长文分为 '+scene.pages+' 页；原文、译文和注释按各自区域续排，逐段对应请用“逐段对照”');
  if(id!=='vertical'&&id!=='lower-third'&&id!=='sidebar'){
   const sourceLines=wrap(o.source,1060,17,measure);text(shortened(o.source.replace(/\n/g,' '),1060,17),60,685,17,theme.note,'ui');if(sourceLines.length>1)scene.warnings.push('出处超出一行，画面以省略号提示；完整内容保留在方案 JSON，请缩短或移入脚注');
  }
  if(id!=='lower-third')text(String(scene.page+1).padStart(2,'0')+' / '+String(scene.pages).padStart(2,'0'),1165,685,13,theme.note,'ui');
  if(measure(o.title,26)>1150)scene.warnings.push('标题过长，画面以省略号提示；完整内容保留在方案 JSON');
  scene.warnings=[...new Set(scene.warnings)];return scene;
 }
 function drawCanvas(ctx,scene,{time=1,animated=false,width=1920,height=1080}={}){
  if(!Number.isFinite(time))throw new TypeError('time must be finite');if(![width,height].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('bounds');const p=animated?Math.min(1,Math.max(0,time/.7)):1;ctx.save();ctx.scale(width/1280,height/720);ctx.translate(0,animated?(1-p)*12:0);
  for(const o of scene.nodes){ctx.save();if(o.opacity!==undefined)ctx.globalAlpha*=o.opacity;
   if(o.kind==='rect'){ctx.fillStyle=o.fill;ctx.fillRect(o.x,o.y,o.w,o.h)}else if(o.kind==='line'){ctx.strokeStyle=o.color;ctx.lineWidth=o.width;ctx.beginPath();ctx.moveTo(o.x1,o.y1);ctx.lineTo(o.x2,o.y2);ctx.stroke()}else{ctx.fillStyle=o.fill;ctx.font=o.size+'px '+(o.font==='body'?'serif':'sans-serif');ctx.textAlign=o.anchor==='middle'?'center':'left';ctx.textBaseline='alphabetic';ctx.fillText(o.value,o.x,o.y)}ctx.restore();
  }ctx.restore();
 }
 function createRenderer(ctx,input={},config={}){const fixed=JSON.parse(JSON.stringify(config));const measure=(value,px)=>{ctx.save();ctx.font=px+'px serif';const width=ctx.measureText(value).width;ctx.restore();return width;};const scene=render(JSON.parse(JSON.stringify(input)),{...fixed,measure});return {scene,renderAt:t=>drawCanvas(ctx,scene,{time:t,animated:true,width:fixed.width||1280,height:fixed.height||720})};}
 const api={catalog,sample,theory,wrap,render,drawCanvas,createRenderer};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VisualQuotes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
