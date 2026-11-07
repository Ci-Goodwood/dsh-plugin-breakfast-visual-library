# 早餐视觉组件 · DSH 插件

把文字加载、图片转场、图标、引文、配色与地图路径带进 DSH。内置可离线打开的交互展览，以及供 DSH 按任务检索和接入项目的技能。

不需要原视频工作区、GPU、Office、MCP 或 npm 运行依赖。

## 安装到 DSH

把这个仓库链接交给 DSH，并说：

> 安装这个视觉插件，以后处理相关视觉任务时按需使用：
> https://github.com/Ci-Goodwood/dsh-plugin-breakfast-visual-library

也可以使用 **DSH Desktop 自带的 `dsh` 命令行**安装（不要混用另一个全局版本）：

```text
dsh plugin --profile desktop add github:Ci-Goodwood/dsh-plugin-breakfast-visual-library#v0.1.0
```

如果直接链接安装受本机工具限制，可下载 [v0.1.0 插件包](https://github.com/Ci-Goodwood/dsh-plugin-breakfast-visual-library/releases/tag/v0.1.0)，再安装本地文件：

```text
dsh plugin --profile desktop add /absolute/path/to/dsh-plugin-breakfast-visual-library-0.1.0.tgz
```

安装后查看 `dsh plugin --profile desktop list`。DSH 已运行时，保存工作后重新打开 DSH，以加载新插件。

兼容 DSH `0.2.1-rc.2` 系列接口，辅助命令需要 Node.js 18+；直接浏览展示网页只需现代浏览器。插件使用 DSH 原生技能提供器，允许模型按描述自动选择，也允许用户显式调用。自动选择不代表每个视觉请求都强制使用它。

## 有什么

| 类别 | 内容 |
| --- | --- |
| 文字与加载 | 107 条配方，57 个机制族；支持真实进度 |
| 图片与转场 | 圆环展开、透明主体弧线、视差、淡入、擦除、强调、旋转、路径，共 8 种 |
| 目标标记 | 18 种锁定、扫描、警示、测绘及强调标记 |
| 图标 | 60 个资源图标、64 个地区/事件图标；双色、单色镂空与锚点组合 |
| 引文排版 | 9 种版式，原译对照、旁批、脚注、字幕条与长文分页 |
| 配色与照片 | 对比度、透明叠色、面积取色、任意邻接区域分配、逐帧背景检查 |
| 地图与组合 | 虚构分区/路线、图标锚点、组合画面；实际底图由项目提供 |
| 风格 | 40 个命名风格与 1 个归纳 Bonus 的描述、配色及提示词 |

共 **9 类、315 项可打开的展示**。打开 [`skills/breakfast-visual-library/assets/visual-library/index.html`](skills/breakfast-visual-library/assets/visual-library/index.html)：搜索、播放/暂停、时间拖动、换文字/颜色/图片、引文分页、地图输入，以及 PNG/JSON 下载都可以离线使用。

## 让 DSH 使用

例如：

> 用早餐视觉组件给这个网页加一个绑定真实进度的加载效果。

> 找几个适合知识视频的文字动效和图片转场，先做可拖动时间的演示。

> 提取这张商品照片的主色，再给图片、说明和价格区域分配可读的相邻配色。

技能名：`breakfast-visual-library`。入口与可读说明见 [SKILL.md](skills/breakfast-visual-library/SKILL.md)，按需加载 API 文档，不需要先把整个库塞进模型上下文。

## 可直接调用的工具

以下命令中的路径以仓库根目录为起点；安装到 DSH 后使用实际技能目录的绝对路径。

```text
node skills/breakfast-visual-library/scripts/visual-library.cjs info
node skills/breakfast-visual-library/scripts/visual-library.cjs search 进度
node skills/breakfast-visual-library/scripts/visual-library.cjs catalog --module effects
node skills/breakfast-visual-library/scripts/visual-library.cjs copy --module motion --out ./new-motion-components
node skills/breakfast-visual-library/scripts/visual-library.cjs scaffold --module motion --id ref-018 --progress 0.37 --out ./new-progress-demo
```

`copy` 只带所需模块与依赖；`scaffold` 创建支持播放、暂停、时间定位的独立网页，提供 `window.ready`、`window.renderAt(t)` 和 `#scene`，可以接入逐帧视频渲染。两个命令都拒绝覆盖已有输出目录。结果为 JSON，不绑定某位用户的本机路径。

## 开发与检查

```text
npm test
npm pack
```

检查包含技能注册、目录完整性、真实进度、组件复制、无覆盖行为和组件单元测试，不需要下载 npm 依赖。实际发布前另在 Windows Edge 验证 315 项展览、13 种独立脚手架、乱序取帧一致性与无外部请求。跨平台浏览器表现仍需使用者在目标环境确认。

## 范围与来源

Canvas 3D/玻璃效果为简化重制，107 条配方不等于 107 套独立算法。风格项是描述与提示词，没有生成风格样片。图片机制不自动抠图或恢复深度；地图组件不自带真实疆界和历史道路。

私人素材、第三方照片/字体、PPT、历史地图原件、原版 CSS 编辑器、游戏纹理与隔离的用户配色未打包。来源说明和各项使用条件保留在 [SOURCES.md](skills/breakfast-visual-library/assets/visual-library/SOURCES.md)。当前未额外授予统一开源许可。

组件起源于 [早餐 AI 视频基建](https://github.com/BreakfastDaPaiDang/ai-video-infra) 的本地视觉工具。这个仓库已经自包含，克隆后无需再取得原工作区。
