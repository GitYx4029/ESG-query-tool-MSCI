# 跨对话/平台无缝继续开发 — 固定启动指令

> 每次在新的 Manus 对话或其他 AI 平台（如 Claude、GPT）中继续开发本项目时，
> 将以下**启动指令**完整粘贴给 AI，即可无信息缺失地继续工作。

---

## 一、固定启动指令（直接复制粘贴）

```
你好，我需要你继续开发一个已有的 Web 项目。以下是完整的项目背景，请在开始任何操作前先阅读并确认理解。

## 项目基本信息

项目名称：ESG 行业关键议题查询与分析工具
项目路径：/home/ubuntu/esg-query-tool
线上地址：https://esgquerytool-iu5gurrs.manus.space
技术栈：React 19 + TypeScript + Tailwind CSS 4 + Vite（前端）/ Express + tRPC 11（后端）/ MySQL + Drizzle ORM（数据库）/ shadcn/ui（组件库）/ wouter（路由）

## 项目功能概述

这是一个基于 MSCI ESG 方法学的行业关键议题查询与分析工具，主要功能包括：
1. 行业 ESG 关键议题查询（基于 GICS 行业分类，覆盖 E/S/G 三个维度）
2. MSCI 重要性议题地图（子行业议题重要性概览热力表）
3. 企业 ESG 分析 / Drilldown 量化细分分析（上传 MSCI ESG Ratings Drilldown Excel 文件，展示各议题得分、管理实践与绩效表现，并支持 LLM 对照 ESG 报告进行披露分析）
4. Drilldown 管理（已上传报告的管理与权限控制）

## 已支持的 Drilldown 行业

| 行业 | MSCI 分类 | 路由 | 示例企业 | 方法学文件 |
|------|---------|------|---------|-----------|
| 房地产管理与开发 | Real Estate Management & Development | /drilldown/real-estate | 招商局蛇口工业区控股股份有限公司 001979.SZ | client/src/lib/realEstateMethodology.ts |
| 半导体与半导体设备 | Semiconductors & Semiconductor Equipment | /drilldown/solar | 晶澳太阳能科技股份有限公司 002459.SZ | client/src/lib/solarMethodology.ts |

## 关键文件结构

```
client/src/
  pages/
    Home.tsx                ← 首页（行业搜索 + 导航）
    IndustryDetail.tsx      ← 行业详情页（关键议题展示）
    CompanyAnalysis.tsx     ← 企业ESG分析入口（上传+行业卡片）
    RealEstateDrilldown.tsx ← 房地产行业Drilldown分析页
    SolarDrilldown.tsx      ← 半导体/太阳能行业Drilldown分析页
    MaterialityMap.tsx      ← MSCI重要性议题地图
    DrilldownList.tsx       ← Drilldown管理列表
    DrilldownDetail.tsx     ← Drilldown详情页
  lib/
    parseEsgExcel.ts        ← MSCI Drilldown Excel解析器
    realEstateMethodology.ts ← 房地产方法学数据
    solarMethodology.ts     ← 半导体/太阳能方法学数据
    esgData.ts              ← 行业/议题基础数据
  components/
    Header.tsx              ← 顶部导航栏
    DisclaimerWatermark.tsx ← 免责声明水印（透明度0.25，字体28px）
  App.tsx                   ← 路由配置
server/
  routers.ts                ← tRPC procedures（含esgAnalysis.analyzeDisclosure）
  db.ts                     ← 数据库查询助手
drizzle/
  schema.ts                 ← 数据库表结构
docs/
  ADD_NEW_INDUSTRY.md       ← 新增行业Drilldown的SOP文档（8处修改）
  CONTINUE_DEV_PROMPT.md    ← 本文件
```

## 设计规范

- ESG 三色体系：环境绿 `#16a34a`、社会橙 `#d97706`、治理蓝 `#2563eb`
- 主题：浅色模式（ThemeProvider defaultTheme="light"）
- 免责声明水印：全页面背景，透明度 0.25，字体 28px，对角线方向
- 顶部通知栏：免责声明文字 + 小红书/邮箱联系方式

## 新增行业 Drilldown 的标准流程

详见 `docs/ADD_NEW_INDUSTRY.md`，核心是 4 个文件 + 8 处修改：
1. 新建 `{id}Methodology.ts`（方法学数据）
2. 复制 `SolarDrilldown.tsx` 并修改 8 处（注释/方法学导入/函数名/行业标题/企业名/同行企业列表/示例文件/提示文字）
3. `App.tsx` 注册路由
4. `CompanyAnalysis.tsx` 添加行业卡片和 fileKeywords 匹配

## 最近变更日志

| 日期 | checkpoint | 变更内容 |
|------|-----------|--------|
| 2026-04-02 | 5b1049a5 | 方法学指标库质量核查：对比MSCI官方PDF文档，修正solarMethodology.ts和realEstateMethodology.ts中的指标定义和scoringCriteria（删除AI编造的量化标准）；优化tooltip浮窗：Excel有但方法学PDF无的指标显示灰色?图标并弹出说明层（SolarDrilldown.tsx + RealEstateDrilldown.tsx） |
| 2026-04-02 | bd7b7cf4 | 新增 Solar 行业 Drilldown（晶澳科技 002459.SZ）；修复光伏同行企业列表；完善行业扩展 SOP（ADD_NEW_INDUSTRY.md）；优化企业分析页工作流；添加 Excel 导出功能；优化免责声明水印显示 |
| 2026-03-30 | cdeaf783 | 初始化项目；完成房地产 Drilldown 页面；建立 MSCI 方法学指标体系；实现 LLM 对照分析；添加 Drilldown 管理模块 |

## 当前任务

[在此填写你本次对话要完成的具体任务]
```

---

## 二、使用说明

### 何时使用

每次在以下情况下开始新对话时，将上述指令粘贴给 AI：
- 在 Manus 中开启新对话继续开发
- 在 Claude、GPT、Gemini 等其他平台中开发
- 长时间中断后重新开发（超过 1 周）

### 如何更新启动指令

当项目有重大变更时（如新增行业、重构功能、修改设计规范），需要同步更新本文件中的启动指令：

| 变更类型 | 需要更新的字段 |
|---------|-------------|
| 新增 Drilldown 行业 | "已支持的 Drilldown 行业"表格 |
| 新增页面/功能 | "关键文件结构"和"项目功能概述" |
| 修改设计规范 | "设计规范"部分 |
| 修改标准流程 | "新增行业 Drilldown 的标准流程"和 ADD_NEW_INDUSTRY.md |

### 在 Manus 中的特殊说明

在 Manus 中开启新对话时，除了粘贴启动指令外，还可以：
- 直接提供项目 URL（`https://esgquerytool-iu5gurrs.manus.space`），Manus 可以访问并了解当前状态
- 提供最新的 checkpoint 版本号，Manus 可以直接在该版本基础上继续开发
- 如果需要上传文件（如新行业的 Drilldown Excel），直接在对话中附件上传即可

### 是否需要 Skill？

**不需要单独创建 Skill**。本项目的所有关键信息已经记录在以下两个文档中，直接粘贴启动指令即可传递完整上下文：
- `docs/CONTINUE_DEV_PROMPT.md`（本文件，跨对话启动指令）
- `docs/ADD_NEW_INDUSTRY.md`（新增行业 SOP）

Skill 适合封装**通用的、可复用的工作流**（如"分析任意公司的 ESG 评级"），而本项目的开发工作流已经足够具体，直接用文档传递更高效。

---

## 三、项目历史决策记录

以下是开发过程中的重要设计决策，供后续开发参考：

| 决策 | 选择 | 原因 |
|------|------|------|
| Drilldown 文件解析位置 | 浏览器本地解析（不上传服务器） | 保护用户数据隐私，MSCI 数据敏感 |
| 方法学数据存储方式 | 硬编码在 TypeScript 文件中 | 方法学内容相对稳定，避免数据库复杂性；便于版本控制 |
| LLM 对照分析调用方式 | 服务端 tRPC procedure（`esgAnalysis.analyzeDisclosure`） | 避免暴露 API Key；支持流式响应 |
| 同行企业搜索方式 | 前端直接搜索企业官网（getDomainHint） | 轻量实现，无需维护企业数据库 |
| 新行业扩展策略 | 开发者驱动（提供文件 → 开发者创建页面） | 保证方法学准确性；当前行业数量少（<10个） |
| 水印实现方式 | Canvas 绘制 + CSS fixed 定位 | 覆盖所有页面；不影响页面交互 |
