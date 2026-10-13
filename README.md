# ESG 行业议题公益工具

免费查询行业相关 ESG 议题、阅读公开方法学来源。独立整理，非 MSCI 官方产品，信息以原始资料为准。

报告对照分析已独立为公共入口：PDF或图片 → 浏览器识别 → 行业确认 → 议题披露证据与文件页码 → CSV。核验清单为项目整理，不是MSCI官方评分模型；AI精读需要在后端配置模型服务。

企业评分文件分析仍通过管理员入口开放，示例为纯虚构数据；用户上传 Excel 在浏览器本地解析。

- [公益版本和反馈统计接入](docs/PUBLIC_PROJECT_SETUP.md)
- [AI 分析接入](docs/AI_ANALYSIS_SETUP.md)
- [独立报告分析、skill审查与验收](docs/REPORT_ANALYSIS.md)

验证：`npm run check`、`npm test`、`npm run report:assets`、`npm run build`。Pages工作流在检查通过后发布前端。集中反馈已接入独立轻量后端；匿名统计采集暂时关闭；项目后台使用创建项目时的 ChatGPT 账号登录。报告反馈可单独按页面归类。
