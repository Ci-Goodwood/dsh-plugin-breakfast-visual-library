# 项目接入

`assets/visual-library/` 位于技能目录内。辅助脚本用自身路径定位资源，不依赖进程当前目录，也不把安装位置写死为某个 Windows 用户。

## 模块与依赖

| `--module` | 浏览器脚本加载顺序 | 入口 |
| --- | --- | --- |
| motion | motion-data.js, motion.js | `VisualMotion.draw(ctx,id,t,{text,progress,x,y,width,height,ink,accent,bg})` |
| effects | effects.js | `VisualEffects.draw(ctx,id,t,{image,x,y,width,height,duration})` |
| frames | frames.js | `VisualFrames.draw(ctx,id,t,{x,y,width,height,color,label})` |
| resource / region / icons | icon-data.js, icons.js | `VisualIcons.search(query,family)` / `draw(ctx,id,t,{x,y,size,ink,accent,paper,mode})` |
| quotes | quotes.js | `VisualQuotes.createRenderer(ctx,input,{layout,fontSize,page,transparent})` |
| colors | colors.js, photos.js | `VisualColors` / `VisualPhotos` |
| maps | maps.js | `VisualMaps.createRenderer(ctx,input,options)` |
| styles | style-data.js, styles.js | `VisualStyles.compose(id,{language,usage,subjectZh,subjectEn,camera})` |
| all | 全部以上脚本 | 自行按项目需求组合 |

所有脚本支持 Node `require()`，其中绘图部分仍需浏览器 Canvas；读目录、检索、配色、排版模型及提示词组合可以在 Node 运行。辅助脚本 `catalog --module all` 包含展示的 315 项；`search` 返回对应模块与 ID，避免按名称猜编号。图标 ID 自带冒号，例如 `resource:oil`；不是 `oil`。

## 帧与状态

绘制函数使用显式秒数 `t`，不累计内部播放时间、不清屏。宿主每帧先绘制背景/主画面，再按图层顺序调用组件。Canvas `save/restore` 不恢复当前路径，后续画路径前重新 `beginPath()`。

`scaffold` 生成 1280×720、24fps、6 秒单效果演示：`await window.ready` 返回 `{duration,fps,width,height}`；`window.renderAt(t)` 暂停播放并绘制指定秒数；`#scene` 是取帧目标。图片已通过 `ready` 加载再取帧。新项目更换文字/图片/字体后重新验证，字体度量可能改变引文分页。

引文 `input` 可含 `title/original/translation/source/notes/highlight`；`scene.pages` 与 `scene.warnings` 表示分页及问题，不能只输出第一页却声称长文完整。字幕条透明模式为 `layout:'lower-third', transparent:true`。

图片效果的 `image` 是已解码的 ImageBitmap/Canvas/HTMLImageElement。`cutout-path` 依赖调用方提供透明主体，不自动抠图；`parallax` 是裁切分层，不会恢复真实深度。`fade/wipe/rotate` 可叠在前一画面上完成两画面切换。

地图 `input` 含 `regions:[{id,label,labelAt:[x,y],color,points:[[x,y],...]}]`、`routes:[{label,points,color,start,duration}]`。真实地图还要求 `source/date/license/confidence/purpose` 字符串；路径用累计段长推进。脚手架的地图数据标注为虚构，不能改名冒充真实底图。

## 配色与照片

`VisualPhotos.extract(rgba,{count:5})` 提取面积颜色，先缩图以控制成本；没有语义分割。`VisualColors.assign({nodes,edges},palette)` 支持任意邻接区域，检查返回 `ok`，不要忽略颜色不足的失败结果。`auditPixels` 和 `auditTimeline` 的输入应是最终背景（保留所有后叠加图层，跳过文字绘制）；透明背景提供 `underlay`。时间轴结果只覆盖提供的帧。

## 导出与环境

展示网页支持 PNG 与参数 JSON 下载；插件不需要浏览器以外的运行依赖。`catalog/search/copy/scaffold` 需要 Node.js 18+，未依赖第三方 npm 包。

视频输出可用自带 `render-video.cjs`，取帧默认使用 `gallery.html`。设置 `VISUAL_ENTRY` 为新生成页面的绝对路径，可截图 `#scene`；不要把展示首页用作视频取帧入口。需另备 Playwright（或 `PLAYWRIGHT_MODULE` 指定已有模块）及可用浏览器；`PLAYWRIGHT_CHANNEL=msedge` 可选系统 Edge。编码需 Python、PyAV、Pillow，可用 `VISUAL_PYTHON` 指定解释器。这些是可选生产依赖，不打包浏览器/编码器二进制、不自动安装软件、不启动 GPU。

## 插件自带范围

独立包保留展示页与仓库 Canvas 组件、示例和测试。旧项目的原生 PPT、历史地图、第三方图片/字体、研究截图、私人素材、隔离的用户配色均不包含。独立展示页将原来依赖本地项目的入口替换为组件说明与当前自带文件，没有失效的私人绝对路径。
