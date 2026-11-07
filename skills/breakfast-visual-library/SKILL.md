---
name: breakfast-visual-library
description: 为网页、代码动画、信息图和视频图层选用早餐视觉组件，提供文字与加载动画、图片转场、图标、引文排版、配色取色及地图路线；制作或调整这些视觉效果、查找视觉素材与风格提示词时使用。
---

# 早餐视觉组件

本技能目录内的 `assets/visual-library/` 是自带的离线组件库，不依赖原视频工作区、GPU、Office、MCP 或网络服务。使用实际文件路径执行下列命令；`<skill>` 代表本 SKILL.md 所在目录，不是当前工作目录。

## 按任务调用

- 浏览全部效果：打开 `<skill>/assets/visual-library/index.html`。九类 315 项，包含 107 条文字/加载配方（57 个机制族）、8 种图片/转场、18 种目标框、124 个图标、9 种引文版式、5 个配色工具、3 个地图/组合示例及 41 条风格方案。
- 不必浏览整个库。先用 `node "<skill>/scripts/visual-library.cjs" search "关键词"` 按中文、ID、机制族查找；或用 `catalog --module motion` 列出某类。输出均为 JSON。
- 接入已有网页或 Canvas 项目：`node "<skill>/scripts/visual-library.cjs" copy --module motion --out "项目内的新目录"`，再按返回的 `scripts` 顺序加载。只复制需要的模块及依赖，不覆盖已有目录。按用户选定的框架与布局接入，勿把展示页的外观强加给项目。
- 新建单效果演示或逐帧渲染入口：`node "<skill>/scripts/visual-library.cjs" scaffold --module motion --id ref-003 --out "新的演示目录" --text "正在整理材料"`。生成的 `index.html` 支持自动播放、暂停、拖动时间，并提供 `#scene`、`window.ready` 和 `window.renderAt(t)`。图像效果默认使用原创几何图，实际项目换成已解码的本地素材。
- 需要 API、加载顺序、图片/地图输入或视频输出时，读 [references/integration.md](references/integration.md) 和组件库 [README.md](assets/visual-library/README.md)。只加载与当前任务相关的说明。

## 使用判断

组件提供基础机制；构图、字体、节奏、图层关系按当前作品设计。加载条的演示值不能代表真实任务状态；需进度时显式传 `progress: 0..1`。文字动效保留可读的静态文本，尊重用户减少动态效果的设置。

配色适用于国家、照片、卡片、商品、说明与价格等任何相邻区域。遇到照片先提取面积主色，再判断图像与文字、背景及相邻部分的关系；大背景的主色不等于商品本体色。保留原图颜色，实际叠加后检查文字背景；正文 4.5:1、大字 3:1。动态画面用最终非文字背景的最差时刻检查，不能把文字本身当背景取样。

地图模块仅绘制调用方提供的屏幕坐标与路线；真实地图须记录来源、年代、许可、置信度及用途，`fictional:true` 只用于虚构示例。图标是示意符号。风格模块产出描述与提示词，未生成对应风格样片；41 项中含 1 个明确归纳的 Bonus。Canvas 玻璃/3D 为简化重制。

验证新接入的页面能在目标环境显示，检查文字、转场起止状态和图片裁切；视频项目检查实际输出帧。插件测试结果不替新作品作质量认证。来源与范围见 [SOURCES.md](assets/visual-library/SOURCES.md)。
