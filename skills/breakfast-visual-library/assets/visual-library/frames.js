/* Original geometric target marks, reimplemented with Canvas2D.
   No DOM, SVG document, CSS animation, asset fetch or wall-clock state. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VisualFrames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const catalog = Object.freeze([
    ['corners','切角锁定'], ['rectangle','完整矩框'], ['brackets','双侧括号'],
    ['crosshair','十字准星'], ['circle','环形标记'], ['double-ring','双环锁定'],
    ['diamond','菱形坐标'], ['hexagon','六边形标记'], ['dashed','虚线区域'],
    ['ruler','测绘框'], ['scan','扫描框'], ['warning','警示框'],
    ['callout','引线标记'], ['underline','下划线强调'], ['multi','多目标框'],
    ['route','路径端点'], ['offscreen','画外指示'], ['focus','聚焦光圈']
  ].map(([id,name]) => Object.freeze({id,name})));
  function stateAt(id, time, options = {}) {
    if (!catalog.some(x=>x.id===id)) throw new RangeError('Unknown target mark: '+id);
    if (!Number.isFinite(time)) throw new TypeError('time must be finite seconds');
    const o = Object.assign({x:0,y:0,width:320,height:200,color:'#a4342a',stroke:3,label:'',animate:true,fit:'contain'},options);
    if (![o.x,o.y,o.width,o.height,o.stroke].every(Number.isFinite) || o.width<=0 || o.height<=0 || o.stroke<1 || o.stroke>8) throw new RangeError('Invalid drawing bounds/stroke');
    if (!/^#[a-f\d]{6}$/i.test(o.color)) throw new TypeError('color must be #RRGGBB');
    if (!['contain','stretch'].includes(o.fit)) throw new RangeError('fit must be contain or stretch');
    if (typeof o.label!=='string' || Array.from(o.label).length>48) throw new RangeError('label must be <=48 characters');
    const t=Math.max(0,time), p=o.animate?Math.min(1,t/.65):1;
    // Entrances clamp once. Only scan/double-ring retain an intentional phase.
    const phase=o.animate?(t%2.4)/2.4:.5;
    return Object.assign(o,{id,time:t,opacity:p,scale:.9+.1*p,phase});
  }
  function draw(ctx,id,time,options) {
    const s=stateAt(id,time,options);
    // Path2D is a native Canvas primitive, not an SVG image/DOM conversion.
    const line=d=>ctx.stroke(new Path2D(d));
    const rect=(x,y,w,h)=>ctx.strokeRect(x,y,w,h);
    const circle=(r,x=160,y=100,fill=false)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);fill?ctx.fill():ctx.stroke();};
    const corners=()=>line('M66 64V44H98 M222 44H254V64 M254 136V156H222 M98 156H66V136');
    ctx.save();
    try {
      const scale=Math.min(s.width/320,s.height/200);
      ctx.translate(s.x+(s.fit==='contain'?(s.width-320*scale)/2:0),s.y+(s.fit==='contain'?(s.height-200*scale)/2:0));
      ctx.scale(s.fit==='contain'?scale:s.width/320,s.fit==='contain'?scale:s.height/200);
      ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.stroke;
      ctx.lineCap='square';ctx.lineJoin='miter';ctx.setLineDash([]);
      ctx.save();
      try {
        ctx.globalAlpha*=s.opacity;
        ctx.translate(160,100);ctx.scale(s.scale,s.scale);ctx.translate(-160,-100);
        switch(id) {
          case 'corners': corners(); break;
          case 'rectangle': rect(60,40,200,120);line('M60 40H90M230 160H260');break;
          case 'brackets': line('M84 42H64V158H84 M236 42H256V158H236');break;
          case 'crosshair': circle(43);line('M160 28V74M160 126V172M88 100H134M186 100H232');circle(4,160,100,true);break;
          case 'circle': circle(62);line('M160 28V43 M160 157V172 M88 100H103 M217 100H232');break;
          case 'double-ring': circle(61);ctx.save();ctx.translate(160,100);ctx.rotate((s.animate?s.phase*90:0)*Math.PI/180);ctx.setLineDash([70,12]);circle(49,0,0);ctx.restore();line('M151 100H169M160 91V109');break;
          case 'diamond': line('M160 25L235 100L160 175L85 100Z M160 14V34 M160 166V186 M74 100H94 M226 100H246');break;
          case 'hexagon': line('M122 36H198L236 100L198 164H122L84 100Z M135 48H185');break;
          case 'dashed': ctx.setLineDash([10,7]);rect(60,40,200,120);ctx.setLineDash([]);line('M60 58V40H78M242 160H260V142');break;
          case 'ruler': rect(60,40,200,120);for(let i=0;i<=10;i++)line(`M${60+i*20} 40V${i%5===0?54:47} M${60+i*20} 160V${i%5===0?146:153}`);line('M50 100H70M250 100H270');break;
          case 'scan': corners();ctx.save();ctx.globalAlpha*=.05;ctx.fillRect(67,45,186,110);ctx.restore();ctx.beginPath();ctx.moveTo(72,50+s.phase*100);ctx.lineTo(248,50+s.phase*100);ctx.stroke();break;
          case 'warning': line('M72 40H248L260 52V160H60V52Z M60 142H260 M150 76L160 58L170 76Z M160 91V115 M160 126V128');break;
          case 'callout': circle(26);line('M180 80L224 36H286 M224 29V43');circle(4,160,100,true);break;
          case 'underline': line('M58 128H262 M58 120V136 M262 120V136');ctx.save();ctx.globalAlpha*=.12;ctx.fillRect(58,108,204,12);ctx.restore();break;
          case 'multi': rect(48,48,75,65);rect(158,32,80,62);rect(193,122,77,48);line('M123 80L158 63 M198 94L226 122');break;
          case 'route': line('M65 131L119 131L179 65H255 M242 54L255 65L242 76');ctx.fillRect(57,123,16,16);circle(17,255,65);break;
          case 'offscreen': line('M104 100H238 M220 80L240 100L220 120 M252 60V140 M72 82L90 100L72 118');break;
          case 'focus': ctx.save();ctx.lineWidth=1;circle(64);ctx.restore();line('M106 66L118 74 M202 126L214 134 M106 134L118 126 M202 74L214 66');ctx.setLineDash([35,40]);circle(48);break;
        }
      } finally { ctx.restore(); }
      // Label remains readable during a mark's entrance. Caller audits its actual background.
      if(s.label){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(s.label,160,191);}
    } finally {ctx.restore();}
    return s;
  }
  function createRenderer(ctx,id,options={}) {
    const fixed=Object.freeze(Object.assign({},options));stateAt(id,0,fixed);
    return Object.freeze({renderAt:time=>draw(ctx,id,time,fixed)});
  }
  return Object.freeze({catalog,stateAt,draw,createRenderer});
});
