# ESG 报告 AI 分析：最小接通步骤

本项目的 GitHub Pages 工作流只部署前端。分析接口位于 `server/esgAnalysisRouter.ts`，必须部署一个运行 Node.js 的后端。静态网页中不能放模型密钥。

1. 部署本仓库后端，确保 `https://<API 域名>/api/trpc` 可访问。现有实现依赖 Manus Forge 的模型与文件存储接口；服务端需设置 `BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY` 和 `ANALYSIS_ADMIN_PASSWORD`（至少16字符的独立服务访问凭证）。如果使用其他模型服务，需要先替换 `server/_core/llm.ts` 与 `server/storage.ts` 的适配逻辑。
2. 在后端设置 `AI_ALLOWED_ORIGINS=https://gityx4029.github.io`，让该域名的浏览器页面能够跨域调用接口。后端必须通过 HTTPS 提供服务。
3. 在 GitHub 仓库的 Actions variables 中设置 `VITE_AI_API_ORIGIN=https://<API 域名>`（不要加 `/api/trpc`），重新运行 Pages 部署工作流。此变量会编入公开的前端代码，只能存放公开域名，不能放密钥。
4. 用一份不超过 20 MB 的 PDF 和一个议题测试：点击“对照分析”后出现逐指标结果；停用后端再试，应显示调用失败，不能显示“未披露”。核查服务端日志中的 `prompt_tokens`、`completion_tokens`。

当前每个议题仍会将整份 PDF 交给模型。代码已限制输出 token，但大幅减少输入 token 需要加入保留页码的报告检索，并通过真实样本验证遗漏率。AI接口已增加服务端密码验证，但仍需在托管平台配置密码并完成真实调用、用量限额与访问控制验收。

静态页面密码门槛不等于服务端权限。当前采用整份 PDF 对照，输入 token 尚未通过页码检索优化；输出上限为按指标数计算的 1200–4096 token，并拒绝不完整返回。

配置服务后，在企业分析页设置服务端访问凭证，再执行分析。不要将模型密钥或私有管理凭证编入前端或公开仓库。
