---
name: breakfast-visual-library
description: 为网页、代码动画、信息图和视频图层选用早餐视觉组件，提供文字与加载动画、图片转场、图标、引文排版、配色取色及地图路线；制作或调整这些视觉效果、查找视觉素材与风格提示词时使用。
---

# 早餐视觉组件

本技能目录内的 `assets/visual-library/` 是自带的离线组件库，不依赖原视频工作区、GPU、Office、MCP 或网络服务。使用实际文件路径执行下列命令；`<skill>` 代表本 SKILL.md 所在目录，不是当前工作目录。

## 按任务调用

- 浏览全部效果：打开 `<skill>/assets/visual-library/index.html`。九类347项，包含107条文字/加载配方（57个机制族）、8种图片/转场、18种目标框、124个图标、9种引文版式、5个配色工具、3个基础地图/组合示例、32张中美俄欧历史年度图版及41条风格方案。
- 不必浏览整个库。先用 `node "<skill>/scripts/visual-library.cjs" search "关键词"` 按中文、ID、机制族查找；结果中的 places 另列104个地名锚点及别名匹配（不计入组件总数）；或用 `catalog --module motion` 列出某类。输出均为 JSON。
- 接入已有网页或 Canvas 项目：`node "<skill>/scripts/visual-library.cjs" copy --module motion --out "项目内的新目录"`，再按返回的 `scripts` 顺序加载。只复制需要的模块及依赖，不覆盖已有目录。按用户选定的框架与布局接入，勿把展示页的外观强加给项目。
- 新建单效果演示或逐帧渲染入口：`node "<skill>/scripts/visual-library.cjs" scaffold --module motion --id ref-003 --out "新的演示目录" --text "正在整理材料"`。生成的 `index.html` 支持自动播放、暂停、拖动时间，并提供 `#scene`、`window.ready` 和 `window.renderAt(t)`。图像效果默认使用原创几何图，实际项目换成已解码的本地素材。
- 事件发生在某地时，打开 `<skill>/assets/visual-library/atlas.html`，或调用 `node "<skill>/scripts/visual-library.cjs" map-event --region china --year 1911 --place 武昌 --event "武昌起义" --icon region:uprising --out "新的地图目录"`。四个区域为 `china/us/russia/europe`；104个地名含历史别名，未知地点传 `--lon/--lat`，不猜位置。输出自包含地图工作台、场景JSON及事件年/图版年，可改图标、切层、聚焦、导出与取帧。
- 按时期起图可用 `scaffold --module maps --id china-1911 --out "新的地图目录"`；`catalog --module maps` 返回3个基础示例和32张真实年度重建截面。地图包含17条按有效年段选择的交通走廊，未录入的路网不自动补成现代线路。
- 需要 API、加载顺序、图片/地图输入或视频输出时，读 [references/integration.md](references/integration.md) 和组件库 [README.md](assets/visual-library/README.md)。只加载与当前任务相关的说明。

## 使用判断

组件提供基础机制；构图、字体、节奏、图层关系按当前作品设计。加载条的演示值不能代表真实任务状态；需进度时显式传 `progress: 0..1`。文字动效保留可读的静态文本，尊重用户减少动态效果的设置。

配色适用于国家、照片、卡片、商品、说明与价格等任何相邻区域。遇到照片先提取面积主色，再判断图像与文字、背景及相邻部分的关系；大背景的主色不等于商品本体色。保留原图颜色，实际叠加后检查文字背景；正文 4.5:1、大字 3:1。动态画面用最终非文字背景的最差时刻检查，不能把文字本身当背景取样。

旧 `VisualMaps` 是屏幕坐标覆盖层；新 `HistoricalAtlas` 按经纬度定位并选择最接近的年度图版。事件年份与图版标准年不同，默认隐藏政区层并保留自然地理定位；同年图版也不能充作事件当天控制线。地名是城市级近似锚点，交通线是走廊级示意，未知地点需明确坐标。政区来自CC BY 4.0的Cliopatria，自然地理来自公共领域Natural Earth；来源与许可随包保留，图集扫描原件不分发。真实自定义数据须记录来源、年代、许可、置信度及用途，`fictional:true` 只用于虚构示例。图标是示意符号。风格模块产出描述与提示词，未生成对应风格样片；41项中含1个明确归纳的Bonus。Canvas玻璃/3D为简化重制。

验证新接入的页面能在目标环境显示，检查文字、转场起止状态和图片裁切；视频项目检查实际输出帧。插件测试结果不替新作品作质量认证。来源与范围见 [SOURCES.md](assets/visual-library/SOURCES.md)。
