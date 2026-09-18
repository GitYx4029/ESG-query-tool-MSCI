# ESG行业关键议题查询与分析工具 - 设计方案

## 工具定位
一个专业的ESG行业关键议题查询与分析工具，用户可以按GICS行业查询MSCI ESG关键议题、对应方法学文件，查询企业ESG页面和报告，并进行ESG表现分析。

---

<response>
<idea>

## 方案一：「数据仪表盘」风格 — 信息密度优先

**Design Movement**: 参考Bloomberg Terminal和金融数据平台的信息密度设计
**Core Principles**: 高信息密度、快速扫描、专业严肃、数据驱动
**Color Philosophy**: 深色背景(#0F172A)配合荧光绿(#10B981)和蓝色(#3B82F6)作为数据高亮色，传达金融科技的专业感
**Layout Paradigm**: 左侧固定导航面板 + 右侧多面板网格布局，类似终端界面
**Signature Elements**: 数据卡片网格、实时搜索面板、议题权重热力图
**Interaction Philosophy**: 键盘优先导航，快速筛选和切换
**Animation**: 数据面板滑入、数字滚动计数、卡片翻转展示详情
**Typography System**: JetBrains Mono(数据) + Inter(正文)，等宽字体强调数据属性

</idea>
<text>专业金融终端风格，深色背景高信息密度，适合数据密集型查询场景</text>
<probability>0.06</probability>
</response>

<response>
<idea>

## 方案二：「知识图谱」风格 — 可视化探索优先

**Design Movement**: 参考Notion/Linear的极简知识管理设计，融合数据可视化美学
**Core Principles**: 清晰层级、视觉引导、渐进式展开、优雅过渡
**Color Philosophy**: 纯白底(#FAFBFC)配合深灰文字(#1A1A2E)，以翡翠绿(#059669)为环境、琥珀橙(#D97706)为社会、靛蓝(#4F46E5)为治理的三色体系，直观映射ESG三支柱
**Layout Paradigm**: 顶部搜索栏 + 中央内容区域采用卡片流布局，左侧行业树状导航可折叠
**Signature Elements**: ESG三色标签系统、议题权重条形图、方法学文件卡片带预览
**Interaction Philosophy**: 搜索驱动，输入即筛选，点击展开详情，层层深入
**Animation**: 卡片展开/折叠弹簧动画、标签页切换滑动、搜索结果淡入
**Typography System**: DM Sans(标题，几何感) + Source Sans 3(正文，可读性)，层级分明

</idea>
<text>极简知识管理风格，ESG三色体系直观映射三支柱，搜索驱动的渐进式探索</text>
<probability>0.08</probability>
</response>

<response>
<idea>

## 方案三：「研究报告」风格 — 学术权威优先

**Design Movement**: 参考McKinsey/BCG咨询报告和学术期刊的排版设计
**Core Principles**: 权威感、结构化、引用可追溯、打印友好
**Color Philosophy**: 温暖白底(#FFFDF7)配合深海军蓝(#1E3A5F)为主色，金色(#C9A84C)作为强调色，传达专业咨询机构的权威感
**Layout Paradigm**: 单栏为主的文档流布局，宽边距留白，侧边浮动目录
**Signature Elements**: 引用标注样式、数据表格带脚注、方法学文件引用卡片
**Interaction Philosophy**: 阅读优先，滚动浏览，锚点跳转，侧边栏快速定位
**Animation**: 极简过渡，仅在页面切换时使用淡入淡出
**Typography System**: Playfair Display(标题，衬线体权威感) + Lora(正文，学术阅读体验)

</idea>
<text>学术咨询报告风格，衬线字体传达权威感，结构化文档流布局</text>
<probability>0.05</probability>
</response>

---

## 选定方案：方案二「知识图谱」风格

选择方案二的理由：
1. ESG三色体系（绿/橙/蓝）直观映射Environment/Social/Governance三支柱，用户一眼可识别
2. 搜索驱动的交互方式最符合"查询工具"的核心定位
3. 渐进式展开设计适合从行业→议题→方法学文件→企业分析的多层级信息架构
4. 极简风格不会分散用户对数据内容的注意力，同时保持专业感
