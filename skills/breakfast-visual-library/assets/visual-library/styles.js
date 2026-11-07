(function(root){
 'use strict';
 if(typeof module==='object'&&module.exports)root={StyleCatalog:require('./style-data.js')};
 const defaults={subjectEn:'a small unbranded ceramic tea canister',subjectZh:'一只无品牌陶瓷茶罐',sceneEn:'a quiet studio with a simple geometric display plinth',sceneZh:'安静的摄影棚与简洁的几何展台',actionEn:'the canister remains upright and centered, with its lid seated firmly throughout the shot',usage:'poster',language:'en',camera:'static'};
 const cameras={static:'The camera is completely static, locked on a tripod; the framing remains unchanged.',push:'The camera dollies in with small amplitude at slow speed, keeping the subject centered.',pan:'The camera pans right with small amplitude at slow speed, rotating in place while the camera position remains fixed.'};
 const escFields=['subjectEn','subjectZh','sceneEn','sceneZh','actionEn'];
 function get(id){const style=root.StyleCatalog.styles.find(s=>s.id===id);if(!style)throw new Error('未知风格ID');return style}
 function compose(id,input={}){
  const s=get(id),o={...defaults,...input};for(const k of escFields)if(typeof o[k]!=='string'||o[k].length>3000)throw new Error(k+'须为不超过3000字符的文字');if(!['poster','product','scene','map'].includes(o.usage))throw new Error('未知用途');if(!['en','zh'].includes(o.language))throw new Error('未知语言');if(!cameras[o.camera])throw new Error('未知运镜');
  const palette='Color palette: '+s.palette.join(', ')+'.';
  const usageEn={poster:'Use a poster-like composition with a clear dominant subject, a strong visual hierarchy, and reserved blank space for final typesetting in post.',product:'Keep the specified product silhouette and material stable; place stylistic ornament in the surrounding set and framing, with clear separation between product and background.',scene:'Build a coherent environment with a clear foreground, middle ground and background, keeping the visual style consistent across surfaces and lighting.',map:'Use an approved source map as the geometric base; apply the style to fills, decorative margins and surrounding presentation while retaining the reviewed boundaries and positions.'}[o.usage];
  const usageZh={poster:'采用主次清楚的海报构图，并为后期准确排字预留空白区域。',product:'保持商品既定轮廓与材质，风格装饰主要施加在环境和框架上，商品与背景边界清晰。',scene:'建立前景、中景、背景清晰的环境，材质、光线与风格保持一致。',map:'以已审核地图作为几何底稿，将风格施加于填色、边缘装饰和周边版面，保留已核对的边界与位置。'}[o.usage];
  const shortEn=s.styleEn+' '+palette,shortZh=s.descriptionZh+' 建议配色：'+s.paletteNames+'（'+s.palette.join('、')+'）。';
  const imageEn=shortEn+' Main subject: '+o.subjectEn+'. Setting: '+o.sceneEn+'. '+usageEn;
  const imageZh=shortZh+' 主体：'+o.subjectZh+'。场景：'+o.sceneZh+'。'+usageZh;
  const light=s.id==='tenebrism'?'A concentrated warm key light from the upper left reveals the subject while most of the surrounding set remains in deep shadow.':'Lighting follows the stated visual treatment, with a clear light direction, readable separation around the subject, and consistent highlight placement on every surface.';
  const video={integrated_multimodal_description:'[Shot 1] '+shortEn+' A single continuous eight-second shot shows '+o.subjectEn+' in '+o.sceneEn+'. The framing begins as a medium close view at the subject\'s level, with the focal subject occupying the central third and a clear margin around its outline. '+light+' During the shot, '+o.actionEn+'. '+cameras[o.camera]+' The shot ends with the subject fully visible and its identity and placement consistent with the opening.',overall_soundscape:'Quiet interior room tone with faint distant ventilation.',non_diegetic_music:'N/A'};
  const notes=[s.usageNote,'风格片段、模板与建议配色为本库新增写法，未做模型生成实测。'];if(s.inferred)notes.push('Bonus标签据画面归纳，原简介未提供具体名称。');if(o.usage==='map')notes.push('真实地图应使用审核后的矢量底稿做代码或后期着色，不依赖生图模型重画疆界。');if(/[\u3400-\u9fff]/.test([o.subjectEn,o.sceneEn,o.actionEn].join(' ')))notes.push('H3草稿中的主体/场景/动作含中文；按仓库指南需先翻成英文。');
  return {id:s.id,short:o.language==='zh'?shortZh:shortEn,image:o.language==='zh'?imageZh:imageEn,video,videoText:Object.entries(video).map(([k,v])=>k+': '+v).join('\n\n'),notes,source:{videoName:s.videoName,time:s.time,url:s.sourceUrl,inferred:s.inferred},options:o};
 }
 const api={defaults,cameras,get,compose};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VisualStyles=api;
})(typeof globalThis!=='undefined'?globalThis:this);
