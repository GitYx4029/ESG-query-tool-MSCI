# Project TODO

- [x] Basic homepage layout with ESG search and industry navigation
- [x] Industry detail page with ESG key issues display
- [x] Company analysis page with ESG report upload
- [x] MSCI Materiality Map page
- [x] Real Estate Drilldown page with CMSK Excel parsing
- [x] Methodology tooltip system for Real Estate indicators
- [x] ESG report PDF upload and LLM-based disclosure analysis
- [x] Peer comparison section with company search
- [x] Verify all 34 CMSK indicators match code exactly
- [x] Validate methodology definitions against MSCI PDF sources
- [x] Fix Board/Pay/Ownership & Control/Accounting as independent Key Issues (not sub-issues of Board)
- [x] Fix Accounting definition - remove Strategic Oversight content (belongs to Board), add financial reporting quality and auditor independence
- [x] Fix Tax Transparency definition - based on independent methodology PDF with Tax Controversies as sole Key Metric
- [x] Add directlyFromMethodology and sourceNote fields to all indicators
- [x] Flag non-methodology indicators (Green building extends to existing, Contractors in H&S metrics, Certification program for suppliers)
- [x] Add amber warning display in tooltip for non-methodology indicators
- [x] Write vitest tests for methodology data completeness and accuracy (26 tests)
- [x] Generate flat design key logo with subtle shadow for "Unlock ESG Insights"
- [x] Upload logo to S3 and get CDN URL
- [x] Replace logo reference in Header.tsx
- [x] Verify logo display on all pages
- [x] Create disclaimer watermark component (light gray, semi-transparent)
- [x] Create top notification bar with disclaimer and feedback info
- [x] Create bottom emphasis bar with tech gradient (light green-blue)
- [x] Integrate all components in App.tsx
- [x] Verify display across all pages

## MVP Drilldown 功能合并（来自信息包 66bf08bf）
- [x] Update schema.ts with drilldowns, drilldownShares tables and subscriptionTier field
- [x] Run pnpm db:push to migrate database
- [x] Migrate db.ts with drilldown/share query helpers
- [x] Create server/_core/permissions.ts with checkDrilldownAccess()
- [x] Create server/routers/drilldown.ts with 7 tRPC procedures
- [x] Register drilldown router in server/routers.ts
- [x] Create client/src/pages/DrilldownList.tsx
- [x] Create client/src/pages/DrilldownDetail.tsx
- [x] Update App.tsx routes to include /drilldowns and /drilldown/:id
- [x] Update Header.tsx navigation to include Drilldown 管理
- [x] Set admin role + enterprise tier for Yixinl0519@163.com via SQL
- [x] Write vitest tests for drilldown permissions and procedures (16 new tests, 45 total)
- [x] Verify all existing ESG features still work after merge

## 导航返回优化
- [x] Audit all pages for missing back navigation
- [x] IndustryDetail - already had ArrowLeft back button (no change needed)
- [x] CompanyAnalysis - already had breadcrumb (no change needed)
- [x] DrilldownDetail - already had 返回列表 button (no change needed)
- [x] Add breadcrumb + ArrowLeft back button to RealEstateDrilldown page
- [x] Add breadcrumb + ArrowLeft back button to MaterialityMap page
- [x] Verify all pages have clear navigation escape routes

## ESG报告对照分析优化
- [x] Research CMSK full company name and stock ticker (招商局蛇口工业区控股股份有限公司 001979.SZ)
- [x] Optimize parsed file status display: add company full name and stock ticker before filename
- [x] Install xlsx library for Excel generation (already in package.json)
- [x] Add Excel export button after analysis results are generated (columns: 指标归属/指标名称/权重/分析结果/信息出处)

## 子行业议题重要性概览文字旋转修复
- [x] 定位MaterialityMap.tsx中议题列标题的旋转代码
- [x] 修复writing-mode从vertical-rl改为vertical-lr，使文字方向正确（从下往上可读）
- [x] 验证修复效果

## 免责声明水印优化
- [x] 检查DisclaimerWatermark组件的当前样式实现
- [x] 优化水印透明度、字体大小、颜色对比度 (透明度0.15→ 0.25, 字体 24px→ 28px, font-weight: 500)
- [x] 测试水印在不同页面的显示效果
- [x] 验证水印可见性改进

## 企业ESG分析页面工作流重构
- [x] 查看当前CompanyAnalysis/DrilldownManagement页面结构和路由
- [x] 重构"企业分析"入口页面：顶部显示上传Drilldown报告区域，下方显示已有行业入口列表
- [x] 已有行业入口显示：房地产管理与开发 (Real Estate Management & Development)
- [x] 确保上传后跳转到对应行业Drilldown分析页（sessionStorage传递文件）
- [x] 验证整体工作流程

## JA Solar 太阳能行业 Drilldown 页面
- [x] 解析JA Solar Drilldown Excel，提取行业名称/指标体系/权重
- [x] 搜索JA Solar企业全称（晶澳太阳能科技股份有限公司 002459.SZ）、行业分类
- [x] 搜索MSCI太阳能/半导体设备行业方法学描述，创建solarMethodology.ts
- [x] 创建SolarDrilldown.tsx（参照RealEstateDrilldown.tsx模板）
- [x] 在App.tsx注册新路由 /drilldown/solar
- [x] 在CompanyAnalysis.tsx已有行业列表中添加半导体行业卡片
- [x] 更新CompanyAnalysis.tsx的行业匹配逻辑，支持Solar行业跳转（fileKeywords智能匹配）
- [x] 上传JA Solar示例文件到CDN

## 行业扩展工作流文档
- [x] 编写docs/ADD_NEW_INDUSTRY.md（行业扩展SOP，含跨平台信息连续性说明）
- [x] 文档包含：工作流步骤、文件结构、设计规范、跨平台信息连续性说明

## 同行企业预设列表优化 + 跨对话启动指令
- [x] 修复SolarDrilldown.tsx同行企业预设列表（改为光伏同行：隆基纻能、天合光能、晶科能源、协鑫科技、阿特斯、通威股份、东方日升、正泰新能）
- [x] 更新ADD_NEW_INDUSTRY.md，将“同行企业预设列表”纳入标准流程（共 8 处修改，含各行业同行企业参考表）
- [x] 编写docs/CONTINUE_DEV_PROMPT.md（跨对话/平台无缝继续开发的固定启动指令，含历史决策记录）

## CONTINUE_DEV_PROMPT.md 维护
- [x] 更新checkpoint版本号为 bd7b7cf4
- [x] 在启动指令末尾添加“最近变更日志”字段（含日期/checkpoint/变更内容三列）

## Excel导出功能优化
- [x] 修改Excel导出列结构：5列改为6列，将[满足要求]/[部分满足]/[不满足]单独作为"满足状态"列
- [x] 将导出按钮从顶部移至各议题内部（分析完成后在对照分析按钮旁显示绿色“导出本议题”按钮）
- [x] RealEstateDrilldown.tsx 和 SolarDrilldown.tsx 同步修改，均编译通过

## Excel导出加方法学定义列 + 创建msci-drilldown-analyst Skill
- [x] 查看方法学tooltip数据结构，确认definition字段名称
- [x] 修改Excel导出：在每个子指标行右侧加入“方法学定义”列（tooltip.definition，不含 scoringCriteria）→ Excel现为7列
- [x] RealEstateDrilldown.tsx 和 SolarDrilldown.tsx 同步修改，均编译通过
- [x] 创建 msci-drilldown-analyst Skill（/home/ubuntu/skills/msci-drilldown-analyst/SKILL.md，231行，封装8步SOP、数据结构规范、Excel7列规范、各行业同行企业参考表）

## 方法学指标库质量核查与优化
- [x] 盘点两个行业指标数量和directlyFromMethodology标记状况
- [x] 查阅MSCI房地产行业原始方法学文档，校验definition和scoringCriteria准确性
- [x] 查阅MSCI半导体行业原始方法学文档，校验definition和scoringCriteria准确性
- [x] 修正错误/AI编造内容，标记无方法学来源的指标，删除无依据的评分标准
- [x] 优化tooltip浮窗：Excel有但方法学文档无的指标加提示标记（灰色?+点击弹出说明层）
