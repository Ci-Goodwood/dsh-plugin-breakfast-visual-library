# 早餐视觉组件 · DSH 独立插件

打开 [视觉实验室](index.html) 浏览九类 315 项。可离线使用，所有必需脚本随包携带，不依赖原工作区。

旧私人项目、原版 CSS 编辑器、PPT 和地图原件不包含在独立包。加载动画与转场使用自带 Canvas 重制机制。

Node.js 18+ 可在本目录执行 `node --test`。完整浏览器检查需可选 Playwright 和浏览器；`PLAYWRIGHT_MODULE` 可指向已有模块，`PLAYWRIGHT_CHANNEL=msedge` 可选择系统 Edge。

## 目标标记

浏览器按顺序加载 `colors.js`、`photos.js`、`frames.js`；无需构建。脚本使用示例：

```js
const mark = VisualFrames.createRenderer(ctx, 'corners', {
  x: 120, y: 80, width: 320, height: 200, color: '#a4342a', label: '目标'
});
mark.renderAt(0.4);  // 绝对秒，不累计帧状态；绘到调用方的Canvas
```

`catalog`列出18类ID。`draw(ctx,id,t,options)`适合每帧替换参数；`createRenderer`固定一份参数，返回`renderAt(t)`。入口0.65秒后保持，`scan`和`double-ring`保留有意的2.4秒循环；`animate:false`固定所有运动。时间必须有限，负时间按0处理。只负责绘制，不清画布、不调度播放、不解码图片。组件保存并恢复样式/变换/裁切状态；Canvas的当前路径不属于save/restore状态，调用方开始自己的路径时应自行`beginPath()`。

默认`fit:'contain'`等比放入给定宽高，保持圆形；需要拉伸矩框时显式传`fit:'stretch'`。反复像素读回的截图场景建议以`getContext('2d',{willReadFrequently:true})`创建Canvas；本机默认模式曾在顺/乱序比较中出现差异，固定读回模式后通过。不要把本机结果推广为所有GPU后端完全等价。

Path2D是Canvas原生绘图原语；没有将SVG图片或DOM转绘到Canvas。页面示例对外供截图器使用的是：

```js
await window.ready; // {duration:6,fps:24,width:1280,height:720}
window.renderAt(1.25);
```

示例的输入图片、配色和种子也是渲染输入。换图后再次等当前`ready`；同一时间、同一输入、同一浏览器/字体环境应得到相同像素，不承诺不同机器字体像素一致。

## 配色、照片和最差背景

```js
const allocation = VisualColors.assign(
  {nodes:['photo','caption','price'],edges:[['photo','caption'],['caption','price']]},
  ['#a4342a','#4c8593','#e7c377']
);
if (!allocation.ok) throw new Error(allocation.reason);
const palette = VisualPhotos.extract(rgba, {count:5});
const check = VisualColors.auditTimeline('#f4ead6', [
  {time:0, pixels:backgroundPixels0},
  {time:0.5, pixels:backgroundPixels1}
], {threshold:4.5});
```

保留用户原话：

> 这一条也不止国家需要,所有相邻部分都可以做区分啊(比如放照片,照片的主色调可以拔出来,然后考虑这个照片该如何与其他部分搭配.这一句话写进最后的skill),包括商品展示之类的.

邻接节点可以是国家、照片、说明、卡片、商品或价格区；本工具不提供真实国家边界或邻接关系。配色不足或搜索超预算返回`ok:false`；色差/亮度提示是启发式，配合边线、标签、纹理，不等同于色觉认证。

照片取色按面积聚类，没有商品语义分割。建议调用方先缩到最长边256，再传RGBA；函数上限200万像素，忽略透明像素。大背景可能压过小商品，应裁切或人工选色。保留原图颜色，不自动重染图片。

`auditPixels(foreground,rgba,{threshold:4.5,textAlpha:1,underlay})`检查**绘字前实际背景**整块区域的最差像素；输入绘字后的截图会把文字本身错当背景。透明背景必须给`underlay`，透明文字用`textAlpha`；正文4.5:1、大字3:1由调用方明确选择。`auditTimeline`只证明传入帧，不保证帧间没漏；动画应逐输出帧检查，连续变化还需加密抽样或解析下界。示例对任意背景使用固定深色承托，另算保守下界；该保证不能套给别的版式。

## 来源与迁移边界

详见 [SOURCES.md](SOURCES.md)。没有附带HOI4文件、5175套用户配色、526色色表、历史地图、参考视频帧、PowerPoint或第三方字体。旧PPT/CSS工程继续留本地，迁入的是重新绘制的机制，不将旧工程或原教程整体说成已迁移。通用文档只引用这里真实可运行的工具。

## 其他模块与接口

浏览器按 `gallery.html` 的脚本顺序加载即可；Node可直接require各脚本。绘制函数保持调用方样式/变换，不负责清屏、播放、联网或解码；调用方自己清屏并按图层顺序绘制。当前路径不受Canvas save/restore保护，调用方开始自己的路径应`beginPath()`。

| 文件 / 浏览器对象 | 范围 | 使用与限制 |
|---|---|---|
| icon-data.js + icons.js / VisualIcons | 60资源 + 64地区/事件 | `search(query,family)`；`draw(ctx,'resource:coal',t,{x,y,size,ink,accent,paper,mode})`；mono在独立OffscreenCanvas镂空，不擦掉底图；现代浏览器需支持OffscreenCanvas/Path2D |
| quotes.js / VisualQuotes | 9种引文版式 | `createRenderer(ctx,input,{layout,fontSize,page,transparent})`返回scene与renderAt；长文分页，警告在scene.warnings；实际字体度量决定换行，正式项目自行加载合适的开源字体后再建renderer |
| motion-data.js + motion.js / VisualMotion | 107条目录、57机制族 | `draw(ctx,'ref-018',t,{text,progress,...})`；真实进度需明确传0–1，默认只是循环演示；玻璃、立体等为Canvas简化示意，不等价于真实模糊/3D或原教程保真复刻 |
| effects.js / VisualEffects | 8种图片机制 | ring-reveal/cutout-path/parallax/fade/wipe/emphasis/rotate/path；`draw(ctx,id,t,{image,x,y,width,height,duration})`；image是已解码图片/Canvas/ImageBitmap，透明主体用于cutout-path；不自动抠图；视差为裁切分层，不重建深度 |
| maps.js / VisualMaps | 审核底图的屏幕坐标覆盖层 | `createRenderer(ctx,{regions,routes,...},options)`；路径按折线累计长度匀速推进，不把节点间直线当考古复原路；源数据须有来源、年代、许可、置信度、用途；只检查元数据存在，不替代史审/授权核定 |
| style-data.js + styles.js / VisualStyles | 40个命名条目 + 1个inferred Bonus | `get(id)` / `compose(id,{language:'zh',usage:'product'})`；新增提示词与来源名称分开；不调用生图/视频API，未验证模型生成效果 |

图标`compose(ctx,[{id,x,y,size,...}],t)`以各图标anchor对齐；直接`draw`的x/y为左上角。图形是示意符号，事件图标不代表事件已核实。地图的`fictional:true`仅用于明确虚构的测试图，真实数据不得借此绕过来源记录。

```js
const mark = VisualIcons.createRenderer(ctx,'resource:coal',{x:80,y:120,size:96});
const quote = VisualQuotes.createRenderer(ctx,{
  original:'经核对的原文',source:'作者、文献、版本、页码'
},{layout:'sidebar',transparent:true});
// 项目每帧先画底图/镜头，再调用：
mark.renderAt(t);
quote.renderAt(t);
```

引文入场只做轻位移，文字保持实色；文字动效下方保留实色阅读副本，避免闪烁/淡亮使正文内容不可读。默认不复制旧版整层淡入导致的小字低对比度。换背景、配色或图层顺序后须重新检查。`verify-integration-contrast.cjs`跳过文字绘制，在最终非文字背景上检查145个输出时刻所有文字矩形，能覆盖后来叠加的线条；这是保守包围框检查，只认证本例输入。


## 视频输出

`render-video.cjs` 默认对 `gallery.html` 的组合示例取帧，再用 `encode-frames.py` 编码并解码校验。选择尚不存在的结果目录：

```text
node render-video.cjs /absolute/new-output-directory
```

需要可选 Playwright、浏览器、Python、PyAV 与 Pillow。`VISUAL_PYTHON` 指定 Python，`VISUAL_ENTRY` 指定项目 HTML，`VISUAL_QUERY` 指定查询参数。页面须有 `#scene`、`ready={duration,fps,width,height}` 与 `renderAt(t)`；展示首页不是视频取帧入口。没有自动安装依赖、网络服务或 GPU 开机操作。
