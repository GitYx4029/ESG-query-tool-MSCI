# 新增行业 Drilldown 分析模块 — 标准工作流

> 本文档描述如何为 ESG 查询工具新增一个行业的 MSCI ESG Ratings Drilldown 量化细分分析页面。
> 每次新增行业时，请严格按照以下步骤操作，确保功能与现有行业（房地产、半导体/太阳能）保持一致。

---

## 一、前置条件

在开始之前，需要准备以下材料：

| 材料 | 说明 | 获取方式 |
|------|------|---------|
| MSCI ESG Ratings Drilldown Excel 文件 | 目标企业的 `.xlsx` 格式报告 | 从 MSCI ESG Manager 平台导出 |
| 企业全称（中文）+ 上市代码 | 如"招商局蛇口工业区控股股份有限公司 001979.SZ" | 公开信息 |
| MSCI 行业分类名称（英文） | 如"Semiconductors & Semiconductor Equipment" | 从 Drilldown 文件中提取 |
| MSCI 方法学文档（可选但推荐） | 各关键议题的评分标准说明 | MSCI 官网 ESG 方法学文档页 |

---

## 二、解析 Drilldown 文件

使用以下 Python 脚本提取行业指标体系：

```python
import openpyxl

wb = openpyxl.load_workbook("your_file.xlsx", data_only=True)
ws = wb.active

# 提取关键议题和权重
for row in ws.iter_rows(values_only=True):
    if row[0] and "Key Issue Score" in str(row[0]):
        print(row)
```

需要提取的字段：
- **关键议题名称**（Key Issue Name，英文）
- **关键议题权重**（Key Issue Weight，%）
- **所属支柱**（Environmental / Social / Governance）
- **管理实践指标**（Management Indicators）及其权重
- **绩效指标**（Performance Indicators）及其权重

---

## 三、创建方法学文件

**文件路径：** `client/src/lib/{industryId}Methodology.ts`

参照现有文件结构：
- `client/src/lib/realEstateMethodology.ts`（房地产）
- `client/src/lib/solarMethodology.ts`（半导体/太阳能）

每个关键议题需要填写：

```typescript
export const {industryId}Methodology: Record<string, IssueMethodology> = {
  issue_key: {
    issueEN: "Issue Name in English",
    issueCN: "议题中文名",
    type: "environmental" | "social" | "governance",
    methodologyUrl: "https://www.msci.com/...",  // MSCI官方方法学链接（可选）
    overview: "议题概述，2-3句话说明该议题的重要性",
    assessmentFramework: "评估框架说明，描述MSCI如何评估该议题",
    managementIndicators: {
      "Indicator Name": {
        nameCN: "指标中文名",
        description: "指标描述",
        scoringCriteria: "评分标准说明",
      },
      // ...更多指标
    },
    performanceIndicators: {
      // 同上
    },
  },
  // ...更多议题
};

// 导出查找函数
export function find{IndustryId}IssueMethodology(issueEN: string): IssueMethodology | undefined {
  // 精确匹配 + 模糊匹配
}

export function find{IndustryId}MethodologyTooltip(issueEN: string, indicatorEN: string): MethodologyTooltip | undefined {
  // 精确匹配 + 模糊匹配
}
```

---

## 四、创建 Drilldown 页面

**文件路径：** `client/src/pages/{IndustryId}Drilldown.tsx`

**最快方式：复制现有页面并修改**

```bash
cp client/src/pages/SolarDrilldown.tsx client/src/pages/{IndustryId}Drilldown.tsx
```

需要修改的位置（共 8 处）：

| # | 位置 | 修改内容 | 示例 |
|---|------|---------|------|
| 1 | 文件头注释 | 更新行业名称和适用企业 | `* BankDrilldown - 多元化银行行业` |
| 2 | 方法学导入 | 改为新行业的方法学文件 | `from "@/lib/bankMethodology"` |
| 3 | 函数名 | 改为新行业的组件名 | `export default function BankDrilldown()` |
| 4 | 行业标题显示 | 更新行业中英文名称 | `多元化银行 (Diversified Banks)` |
| 5 | 企业名称映射 | 更新企业全称和上市代码 | `"晶澳太阳能科技股份有限公司 002459.SZ"` |
| 6 | **同行企业预设列表** | 更新快速添加按钮的企业名称列表（8个）和 `getDomainHint` 域名映射表 | 见下方说明 |
| 7 | 示例文件链接 | 上传示例文件到CDN并更新URL | `manus-upload-file --webdev file.xlsx` |
| 8 | 提示文字 | 更新行业说明文字 | `本模块当前针对多元化银行行业设计` |

**第6处修改详解 — 同行企业预设列表**

在 `{IndustryId}Drilldown.tsx` 中找到以下两处并替换为目标行业的主要同行企业：

```tsx
// 1. 快速添加按钮（约第595行）
{["同行A", "同行B", "同行C", "同行D", "同行E", "同行F", "同行G", "同行H"].map(name => (
  // ...
))}

// 2. getDomainHint 域名映射（约第1150行）
"同行A": "companya.com",
"同行B": "companyb.com",
// ...
```

**各行业同行企业参考：**

| 行业 | 建议同行企业（8个） |
|------|-------------------|
| 房地产管理与开发 | 万科、中海地产、龙湖集团、华润置地、新鸿基地产、恒隆地产、太古地产、嘉里建设 |
| 半导体/太阳能 | 隆基绿能、天合光能、晶科能源、协鑫科技、阿特斯、通威股份、东方日升、正泰新能 |
| 多元化银行 | 工商银行、建设银行、中国银行、农业银行、招商银行、兴业银行、平安银行、浦发银行 |
| 能源（石油天然气） | 中国石油、中国石化、中海油、中国神华、陕西煤业、兖矿能源、淮北矿业、中煤能源 |
| 医疗保健 | 恒瑞医药、迈瑞医疗、药明康德、百济神州、联影医疗、华大基因、爱尔眼科、通策医疗 |

---

## 五、注册路由

**文件路径：** `client/src/App.tsx`

```typescript
// 1. 添加 import
import {IndustryId}Drilldown from "./pages/{IndustryId}Drilldown";

// 2. 添加 Route（在现有行业路由之后）
<Route path="/drilldown/{industry-id}" component={{IndustryId}Drilldown} />
```

---

## 六、更新行业入口卡片

**文件路径：** `client/src/pages/CompanyAnalysis.tsx`

在 `SUPPORTED_INDUSTRIES` 数组中添加新行业配置：

```typescript
{
  id: "{industry-id}",
  name: "Industry Name in English",
  nameCN: "行业中文名",
  sector: "所属板块中文",
  sectorEN: "Sector Name",
  path: "/drilldown/{industry-id}",
  icon: <IconComponent className="w-5 h-5" />,
  color: "#颜色代码",
  bg: "rgba(r,g,b,0.06)",
  border: "rgba(r,g,b,0.18)",
  pillars: ["环境", "社会", "治理"],
  description: "行业ESG议题简述",
  // 文件名关键词，用于自动识别行业（小写）
  fileKeywords: ["keyword1", "keyword2"],
},
```

**颜色建议：**
- 房地产：蓝色 `#2563eb`
- 半导体/太阳能：绿色 `#16a34a`
- 银行：紫色 `#7c3aed`
- 能源：橙色 `#ea580c`
- 医疗：红色 `#dc2626`

---

## 七、上传示例文件到 CDN

```bash
manus-upload-file --webdev path/to/sample_drilldown.xlsx
```

将返回的 CDN URL 填入 `{IndustryId}Drilldown.tsx` 中的示例文件加载按钮。

---

## 八、验证清单

完成以上步骤后，逐项验证：

- [ ] TypeScript 编译无错误（`pnpm build` 或观察开发服务器输出）
- [ ] `/drilldown/{industry-id}` 路由可正常访问
- [ ] 上传示例文件后，页面正确显示企业全称和上市代码
- [ ] 各关键议题可展开，显示管理实践和绩效指标
- [ ] 方法学悬浮窗（Tooltip）正确显示指标说明
- [ ] ESG 报告上传后，LLM 对照分析功能正常
- [ ] 导出 Excel 功能正常（5列：指标归属/名称/权重/分析结果/信息出处）
- [ ] `/company` 页面的行业卡片显示正确，点击可跳转
- [ ] 从 `/company` 上传文件后，能自动识别行业并跳转（fileKeywords 匹配）
- [ ] 保存 checkpoint（`webdev_save_checkpoint`）

---

## 九、已支持行业一览

| 行业 | MSCI 分类 | 路由 | 示例企业 | 方法学文件 |
|------|---------|------|---------|-----------|
| 房地产管理与开发 | Real Estate Management & Development | `/drilldown/real-estate` | 招商局蛇口 001979.SZ | `realEstateMethodology.ts` |
| 半导体与半导体设备 | Semiconductors & Semiconductor Equipment | `/drilldown/solar` | 晶澳科技 002459.SZ | `solarMethodology.ts` |

---

## 十、跨平台信息连续性说明

如果需要在**其他 Manus 对话或 AI 平台**中继续开发本项目，请提供以下信息：

### 项目技术栈
- **前端：** React 19 + TypeScript + Tailwind CSS 4 + Vite
- **后端：** Express + tRPC 11
- **数据库：** MySQL (Drizzle ORM)
- **UI 组件：** shadcn/ui
- **路由：** wouter

### 关键文件结构
```
client/src/
  pages/
    CompanyAnalysis.tsx     ← 企业ESG分析入口（上传+行业卡片）
    RealEstateDrilldown.tsx ← 房地产行业Drilldown页面
    SolarDrilldown.tsx      ← 半导体/太阳能行业Drilldown页面
  lib/
    parseEsgExcel.ts        ← MSCI Drilldown Excel解析器
    realEstateMethodology.ts ← 房地产方法学数据
    solarMethodology.ts     ← 半导体/太阳能方法学数据
  App.tsx                   ← 路由配置
server/
  routers.ts                ← tRPC procedures（含esgAnalysis.analyzeDisclosure）
```

### 新增行业的核心逻辑
1. 创建 `{id}Methodology.ts` → 复制 `SolarDrilldown.tsx` 并修改 5 处 → 注册路由 → 更新 `CompanyAnalysis.tsx` 的 `SUPPORTED_INDUSTRIES`
2. 方法学数据结构：每个议题含 `overview`、`assessmentFramework`、`managementIndicators`、`performanceIndicators`
3. LLM 分析通过 `trpc.esgAnalysis.analyzeDisclosure` 调用，需要传入 `issueName`、`companyName`、`reportBase64`、`indicators`、`methodologyOverview`

### 设计规范
- ESG 三色体系：环境绿 `#16a34a`、社会橙 `#d97706`、治理蓝 `#2563eb`
- 主题：浅色模式（`defaultTheme="light"`）
- 字体：系统字体（`var(--font-sans)`）
- 免责声明水印：`DisclaimerWatermark` 组件，透明度 0.25，字体 28px
