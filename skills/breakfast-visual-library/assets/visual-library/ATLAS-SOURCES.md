# 历史地图：数据、参考与精度

核对日期：2026-11-07。入口为 [历史地图工作台](atlas.html)。四个区域共32个年度截面，104个城市级地点锚点、17条分时期交通走廊及10个事件定位示例。可自定义任意合法经纬度与事件图标；地名库不代表全球地名已全部收录。

## 政区数据

James S. Bennett et al. and the Seshat Global History Databank contributors (2025), **Cliopatria**。论文：[DOI 10.1038/s41597-025-04516-9](https://doi.org/10.1038/s41597-025-04516-9)；[官方仓库](https://github.com/Seshat-Global-History-Databank/cliopatria)；上游版本 `5f433377139a6eeaeacbdc894b70f8805b72c8b5`。

数据为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；上游许可声明保存在 [ATLAS-DATA-LICENSE.md](ATLAS-DATA-LICENSE.md)。这是数据的许可，不替整个插件代码新增统一许可。按年度选出 `FromYear ≤ year ≤ ToYear` 的 POLITY 记录，排除 Components 聚合层，保留 sourceName、原有效年段与来源标识；经度解缠后按图幅裁切，0.04°保拓扑简化并舍入五位小数，保留岛屿和内洞，添加标注锚点。改编后的数据为 `atlas-periods.js`，完整原始下载URL、SHA256、版本与改动记录在其 `source` 字段。

这是一套研究性历史重建，时间采样与地理覆盖不均衡。年度截面不是事件当天控制区；没有上色的区域也不代表无人或无主。未以现代行政国界替换历史政区。名称中文化只影响显示，原始 sourceName 不改。

已知问题在各快照的 notes 中保留：前221年源记录仍有秦齐并列，因此秦代选择前210年；1991年源记录仍有苏联，只标“苏联解体前后年度重建”；1945年源数据出现 French Fourth Republic 等时间不准确名称，显示“法国（年度源名有误）”，不默改原记录；早期北美未全面收录原住民政治实体。

事件年份与图版标准年不同，默认关闭政区层，保留自然地理、城市和事件定位。用户可以打开政区层进行明确标示的比较；导出JSON分别保存事件年、图版年与差值。

## 自然地理

[Natural Earth](https://www.naturalearthdata.com/) 1:110m land/lakes/rivers，使用官方矢量仓库版本 `ca96624a56bd078437bca8184e78163e5039ad19`。其[使用条款](https://www.naturalearthdata.com/about/terms-of-use/)将数据置于公共领域；Made with Natural Earth。

原始WGS84经纬度保存在 `atlas-geography.js`，原URL和各层SHA256在 source.files 中。自然底图是现代简化海岸、湖泊与河网，适合国家/洲级定位，不代表古代海岸和河道，也不是街道导航图。历史政区与自然底图的海岸可能不完全贴合。未加载现代政治国界。

## 桌面图集的参考范围

用户提供的三本图集只用于核对图例、标准年代、主要城市与交通格局。扫描页和原PDF不复制到插件或公开仓库。以下页码均为PDF从1开始计数，不等于印刷页码。

| 图集 | 实际核看的关键内容 |
| --- | --- |
| 《简明中国历史地图集》（谭其骧），37页 | 唐669年PDF21、清1820年PDF34；1908、1926、1946分别为35、36、37。历史政权界和低对比的现代底图界必须分开。其全部37页已渲染成接触表核看。 |
| 《世界历史地图集》（张芝联、刘学荣），175页 | 秦时期PDF22、西汉2年PDF23、宋辽1111年PDF57、明1433年PDF76；丝路32、唐交通50–51、元交通73、俄国革命/内战交通139–140。美国内战117和一战137的军队行动线不是铁路。其他图版参考索引保留在目录；不声称每一条边界已经逐段对照书图数字化。 |
| 《世界地图集·地形版》，227页，2014年版 | 中国PDF23–24、欧洲67–70、俄罗斯77–80、美国147–152；只参考自然地理、城市与现代路网的位置关系，不用2014年路网证明历史通车年代。 |

参考审查记录及扫描预览留在工作区忽略目录 `.runtime/map-reference-audit/`。本插件的政区几何来自注明版本的 Cliopatria，而不是照搬图集的原地图美术。

## 城市与历史别名

`atlas-catalog.js` 保存104个手工整理的城市级锚点。坐标是近似城市中心，不是古城遗址、战场或车站的测绘位置。地点会按事件年代显示部分历史称呼，如长安、彼得格勒、列宁格勒、察里津/斯大林格勒。别名检索返回候选，未收录地名要求坐标，不编造地理位置。城市的 from 字段表示本示例的显示起点，不把每个起点都宣称为精确建城年。

## 交通干道

所有线路都是**城市/走廊级示意**，没有宣称逐段测绘精度。动画圆点仅演示方向与位置，不表示历史运行速度。每条记录带 kind/from/to/source/precision/note，按事件年筛选；古路、水路与铁路使用不同图例，不将战役箭头当交通线路，不将后建干线提前显示。

| 走廊 | 时间与依据 |
| --- | --- |
| 汉代河西丝路 | 前100至220的示例显示段；世界历史图集PDF32分期图、[UNESCO 长安—天山廊道](https://whc.unesco.org/en/list/1442/)。 |
| 唐代河西—伊州—西州、长安—洛阳—汴州—扬州 | 618—755的保守示例显示段；世界历史图集PDF50–51，安史之乱后的变化不自动沿用。 |
| 元代西行交通 | 1271—1368的示例显示段；世界历史图集PDF73，未把个人旅行轨迹冒称通用道路。 |
| 京杭运河明清走廊 | 本例1433—1900；[UNESCO 大运河](https://whc.unesco.org/en/list/1443/)。与隋代通济渠分开。 |
| 京汉、胶济、京张铁路 | 分别以1906、1904、1909全通年起显示；沿用既有审校中的武汉交通部门资料、王斌2012第356页、董良相关史料76—77页。只是地名级走廊，不声称任一战时日均可通行。 |
| 奥马哈—萨克拉门托横贯铁路 | 1869年5月10日接轨段；[美国国家档案馆](https://www.archives.gov/milestone-documents/pacific-railway-act)。没有提前合入旧金山延伸和后建密苏里河桥。 |
| 伊利运河 | 1825年原运河城市走廊；[Erie Canalway](https://eriecanalway.org/learn/history-culture/fast-facts)。不是1918年扩建航道的测绘形状。 |
| 波士顿邮路 | 1673年以后纽约—波士顿联系；[Smithsonian National Postal Museum](https://postalmuseum.si.edu/colonial-postal-service)。原始服务短暂，本例不证明持续运营。 |
| 圣彼得堡—莫斯科铁路 | 1851年起；[俄罗斯总统图书馆](https://www.prlib.ru/node/619715)。 |
| 西伯利亚干线 | 1916年阿穆尔线贯通后；[俄罗斯科学院西伯利亚分院所收史料](https://www.prometeus.nsc.ru/works/tsador.pdf)。与1903年经中东铁路的通行口径分开。 |
| 利物浦—曼彻斯特铁路 | 1830年起；[Science Museum Group](https://collection.sciencemuseumgroup.org.uk/people/ap48/liverpool-manchester-railway-co)。 |
| 巴黎—里昂—马赛 | 本例保守从1857年起；[法国大区文化遗产名录](https://patrimoine.auvergnerhonealpes.fr/dossier/IA69000240)，不是后来的TGV高铁。 |
| 中莱茵河谷 | 宾根—科布伦茨的城市级水运走廊；[UNESCO 中莱茵河谷](https://whc.unesco.org/en/list/1066/)说明其长期交通贸易作用。1648只是本目录最早截面，不是通航开通年。 |
| 多瑙河维也纳—布达佩斯 | 本例自1815年起；[Danube Commission 历史背景](https://www.danubecommission.org/uploads/doc/2019/Danube_Commission_70.pdf)。区分1815原则、1856制度与1992年现代运河，不假定古今通航条件相同。 |

这17条不是四个区域的完整历史路网；本轮新增的能力是按年代、经纬度与事件复用真实区域图，并保留有出处的主城和交通干道。后续增加路线时继续保存来源与时间口径。
