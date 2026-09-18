# ESG 行业关键议题查询工具 — 完整迁移指南

> **适用场景**：将本项目从 Manus 平台迁移至其他开发环境（本地、Vercel、Railway、Render 等），或在其他 AI 平台（Claude、GPT、Gemini）中继续开发。
>
> **当前版本**：checkpoint `5b1049a5`（2026-04-02）

---

## 一、迁移原理与平台依赖分析

在开始迁移前，必须理解本项目对 **Manus 平台**的依赖程度，以便决定迁移策略。

### 1.1 平台依赖全景

| 依赖项 | 类型 | Manus 提供方式 | 迁移后替代方案 |
|--------|------|--------------|--------------|
| **LLM API**（ESG 报告对照分析） | 核心功能 | `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY`，调用 `gemini-2.5-flash` | 替换为 OpenAI / Anthropic / Google AI API Key |
| **文件存储 S3**（ESG 报告上传） | 核心功能 | Manus 内置 S3 代理（`v1/storage/upload`） | 替换为 AWS S3、Cloudflare R2、Supabase Storage |
| **MySQL 数据库** | 核心功能 | `DATABASE_URL`（TiDB/MySQL） | 替换为任意 MySQL 兼容数据库（PlanetScale、Railway MySQL、本地 MySQL） |
| **Manus OAuth 登录** | 用户认证 | `VITE_APP_ID` + `OAUTH_SERVER_URL` + `VITE_OAUTH_PORTAL_URL` | 需替换为其他 OAuth 方案（GitHub OAuth、Google OAuth、NextAuth.js） |
| **静态资源 CDN**（图片、示例文件） | 展示功能 | Manus CDN（`d2xsxph8kpxj0f.cloudfront.net`） | 图片 URL 已硬编码在代码中，迁移后仍可访问（CDN 链接长期有效） |
| **部署托管** | 运行环境 | Manus WebDev 自动部署 | 替换为 Vercel、Railway、Render、自托管 |

### 1.2 迁移难度评估

**低难度（代码完全可移植）**：
- 所有前端逻辑（行业查询、Drilldown 分析页面、方法学数据）
- 所有 TypeScript/React 代码
- 数据库 Schema（标准 MySQL，使用 Drizzle ORM）
- Excel 解析逻辑（浏览器本地解析，无服务端依赖）

**中等难度（需替换配置）**：
- LLM 调用：只需替换 API Key 和 Base URL，`invokeLLM()` 函数兼容 OpenAI 格式
- 文件存储：`storagePut()` 函数需要改写，但接口简单
- 数据库连接：只需替换 `DATABASE_URL` 环境变量

**高难度（需重写）**：
- Manus OAuth 登录系统：`server/_core/oauth.ts` 深度集成 Manus OAuth，迁移到其他平台需要完整替换认证流程

---

## 二、获取完整代码

### 方法一：通过 Manus 界面下载（推荐）

1. 在 Manus 项目界面右上角点击 **`⋯`（更多）**
2. 选择 **"Download as ZIP"**
3. 解压后即为完整项目代码（不含 `node_modules`）

### 方法二：通过 GitHub 导出

1. 在 Manus 项目界面进入 **Settings → GitHub**
2. 选择目标 GitHub 账号和仓库名称
3. 点击导出，代码将推送到指定 GitHub 仓库
4. 之后可通过 `git clone` 获取代码

### 方法三：直接在 Manus 沙箱中操作

项目代码位于沙箱路径：`/home/ubuntu/esg-query-tool`

---

## 三、项目结构完整说明

```
esg-query-tool/
├── client/                     ← 前端（React 19 + Vite）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx                 ← 首页（行业搜索）
│   │   │   ├── IndustryDetail.tsx       ← 行业详情（关键议题）
│   │   │   ├── CompanyAnalysis.tsx      ← 企业分析入口（上传+行业卡片）
│   │   │   ├── RealEstateDrilldown.tsx  ← 房地产行业 Drilldown 分析页
│   │   │   ├── SolarDrilldown.tsx       ← 半导体/太阳能行业 Drilldown 分析页
│   │   │   ├── MaterialityMap.tsx       ← MSCI 重要性议题地图
│   │   │   ├── DrilldownList.tsx        ← Drilldown 管理列表
│   │   │   └── DrilldownDetail.tsx      ← Drilldown 详情页
│   │   ├── lib/
│   │   │   ├── esgData.ts               ← 行业/议题基础数据（GICS 分类）
│   │   │   ├── parseEsgExcel.ts         ← MSCI Drilldown Excel 解析器（浏览器端）
│   │   │   ├── realEstateMethodology.ts ← 房地产方法学指标数据
│   │   │   └── solarMethodology.ts      ← 半导体/太阳能方法学指标数据
│   │   ├── components/
│   │   │   ├── Header.tsx               ← 顶部导航
│   │   │   ├── DisclaimerWatermark.tsx  ← 免责声明水印（Canvas）
│   │   │   ├── TopNotificationBar.tsx   ← 顶部通知栏
│   │   │   └── BottomEmphasisBar.tsx    ← 底部强调栏
│   │   ├── App.tsx                      ← 路由配置（wouter）
│   │   └── main.tsx                     ← 应用入口（tRPC Provider）
│   └── index.html
├── server/
│   ├── _core/                           ← 框架核心（Manus 模板提供，尽量不修改）
│   │   ├── index.ts                     ← Express 服务器入口
│   │   ├── llm.ts                       ← LLM 调用封装（OpenAI 格式兼容）
│   │   ├── oauth.ts                     ← Manus OAuth 流程（迁移时需替换）
│   │   ├── env.ts                       ← 环境变量统一读取
│   │   └── trpc.ts                      ← tRPC 实例（publicProcedure/protectedProcedure）
│   ├── routers.ts                       ← tRPC 路由注册
│   ├── esgAnalysisRouter.ts             ← ESG 报告对照分析（LLM 调用）
│   ├── routers/drilldown.ts             ← Drilldown 管理 CRUD
│   ├── db.ts                            ← 数据库查询助手
│   └── storage.ts                       ← S3 文件存储封装
├── drizzle/
│   └── schema.ts                        ← 数据库表结构（users/drilldowns/drilldownShares）
├── shared/
│   ├── const.ts                         ← 前后端共享常量
│   └── types.ts                         ← 共享类型定义
├── docs/
│   ├── ADD_NEW_INDUSTRY.md              ← 新增行业 Drilldown SOP
│   ├── CONTINUE_DEV_PROMPT.md           ← 跨对话启动指令
│   └── MIGRATION_GUIDE.md              ← 本文件
├── package.json                         ← 依赖和脚本
├── drizzle.config.ts                    ← Drizzle ORM 配置
├── vite.config.ts                       ← Vite 构建配置
└── tsconfig.json                        ← TypeScript 配置
```

---

## 四、环境变量完整清单

### 4.1 必需环境变量

| 变量名 | 用途 | Manus 自动注入 | 迁移后如何获取 |
|--------|------|--------------|--------------|
| `DATABASE_URL` | MySQL 连接字符串 | ✅ | 自建 MySQL 或使用 PlanetScale/Railway |
| `JWT_SECRET` | Session Cookie 签名密钥 | ✅ | 生成任意随机字符串（32位以上） |
| `BUILT_IN_FORGE_API_URL` | LLM + 存储 API 基础 URL | ✅ | 替换为 OpenAI Base URL（`https://api.openai.com`） |
| `BUILT_IN_FORGE_API_KEY` | LLM + 存储 API Key（服务端） | ✅ | 替换为 OpenAI API Key |
| `VITE_APP_ID` | Manus OAuth 应用 ID | ✅ | 迁移后可删除（替换认证方案后无需） |
| `OAUTH_SERVER_URL` | Manus OAuth 后端 URL | ✅ | 迁移后可删除 |
| `VITE_OAUTH_PORTAL_URL` | Manus 登录门户 URL（前端） | ✅ | 迁移后可删除 |
| `OWNER_OPEN_ID` | 项目所有者 OpenID | ✅ | 迁移后可删除 |

### 4.2 可选环境变量

| 变量名 | 用途 | 说明 |
|--------|------|------|
| `VITE_FRONTEND_FORGE_API_KEY` | 前端直接调用 Manus API 的 Key | 当前项目未使用前端直接调用 |
| `VITE_APP_TITLE` | 应用标题 | 默认为 `ESG Materiality` |
| `VITE_APP_LOGO` | 应用 Logo URL | 已通过 CDN 硬编码 |

### 4.3 本地开发 `.env` 文件模板

```env
# 数据库（MySQL 格式）
DATABASE_URL=mysql://user:password@host:3306/dbname

# JWT 密钥（随机字符串）
JWT_SECRET=your-random-secret-key-at-least-32-chars

# LLM API（迁移后替换为 OpenAI 或其他兼容 API）
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-your-openai-api-key

# 以下为 Manus OAuth 相关，迁移后可替换
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your-open-id
```

---

## 五、迁移步骤详解

### 5.1 第一步：获取代码并安装依赖

```bash
# 解压下载的 ZIP 或 clone GitHub 仓库
cd esg-query-tool

# 安装依赖（使用 pnpm）
pnpm install

# 如果没有 pnpm，先安装
npm install -g pnpm
```

### 5.2 第二步：准备数据库

本项目使用 **MySQL**（通过 Drizzle ORM）。数据库包含三张表：

- `users`：用户信息（Manus OAuth 登录后创建）
- `drilldowns`：上传的 Drilldown 报告记录
- `drilldownShares`：报告分享权限

```bash
# 配置好 DATABASE_URL 后，执行数据库迁移
pnpm db:push
# 等同于：drizzle-kit generate && drizzle-kit migrate
```

**注意**：`pnpm db:push` 会根据 `drizzle/schema.ts` 自动创建所有表，无需手动建表。

### 5.3 第三步：替换 LLM 服务

`server/_core/llm.ts` 中的 `invokeLLM()` 函数使用 **OpenAI 格式 API**，迁移时只需修改两处：

**修改 `server/_core/env.ts`**，添加 OpenAI 配置：
```typescript
export const ENV = {
  // ... 其他配置
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://api.openai.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
```

**修改 `server/_core/llm.ts`** 中的模型名称（第 ~150 行）：
```typescript
// 将 "gemini-2.5-flash" 改为目标模型
model: "gpt-4o",  // 或 "claude-3-5-sonnet-20241022"（需对应 API）
```

**支持的 LLM 服务**（均兼容 OpenAI 格式）：
- OpenAI：`https://api.openai.com`，模型 `gpt-4o`
- Anthropic（通过 OpenAI 兼容层）：需要额外配置
- Google AI（通过 OpenAI 兼容层）：`https://generativelanguage.googleapis.com/v1beta/openai`

### 5.4 第四步：替换文件存储

`server/storage.ts` 中的 `storagePut()` 和 `storageGet()` 函数目前调用 Manus 内置存储代理。迁移到 AWS S3 的替换方案：

```typescript
// server/storage.ts 迁移版本（AWS S3）
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: relKey,
    Body: data,
    ContentType: contentType,
  }));
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${relKey}`;
  return { key: relKey, url };
}
```

### 5.5 第五步：替换用户认证（可选）

如果需要保留用户登录功能，需要替换 `server/_core/oauth.ts`。

**最简单的替换方案**：使用 **NextAuth.js** 或 **Lucia Auth**，配合 GitHub OAuth 或 Google OAuth。

**如果暂时不需要登录功能**：可以将所有 `protectedProcedure` 改为 `publicProcedure`，并在前端去掉登录按钮。

### 5.6 第六步：本地启动开发服务器

```bash
# 确保 .env 文件已配置
cp .env.example .env  # 按模板填写实际值

# 启动开发服务器（前后端同时启动）
pnpm dev

# 访问 http://localhost:3000
```

---

## 六、在其他 AI 平台继续开发

### 6.1 使用 CONTINUE_DEV_PROMPT.md 启动指令

`docs/CONTINUE_DEV_PROMPT.md` 文件包含了一份**固定启动指令**，将其完整粘贴给任何 AI 助手，即可无信息缺失地继续开发。该文件包含：

- 项目技术栈和功能概述
- 已支持的行业 Drilldown 列表
- 关键文件结构
- 设计规范（ESG 三色体系）
- 新增行业的标准流程
- 最近变更日志

### 6.2 在 Claude 中继续开发

1. 打开 Claude，创建新对话
2. 将 `docs/CONTINUE_DEV_PROMPT.md` 中的启动指令完整粘贴
3. 附上需要修改的具体文件内容（Claude 支持直接粘贴代码）
4. 描述本次要完成的任务

**注意**：Claude 无法直接访问文件系统，需要手动粘贴相关文件内容。建议每次只粘贴需要修改的文件，避免超出上下文限制。

### 6.3 在新的 Manus 对话中继续开发

1. 在 Manus 中开启新对话
2. 粘贴 `docs/CONTINUE_DEV_PROMPT.md` 中的启动指令
3. 提供项目 URL：`https://esgquerytool-iu5gurrs.manus.space`
4. 提供最新 checkpoint 版本号：`5b1049a5`

Manus 可以直接访问已部署的网站和沙箱文件系统，是继续开发的最佳选择。

---

## 七、新增行业 Drilldown 的快速参考

详细步骤见 `docs/ADD_NEW_INDUSTRY.md`。核心是 **4 个文件 + 8 处修改**：

| 步骤 | 文件 | 操作 |
|------|------|------|
| 1 | `client/src/lib/{id}Methodology.ts` | 新建方法学数据文件 |
| 2 | `client/src/pages/{Id}Drilldown.tsx` | 复制 `SolarDrilldown.tsx` 并修改 8 处 |
| 3 | `client/src/App.tsx` | 注册新路由 `/drilldown/{id}` |
| 4 | `client/src/pages/CompanyAnalysis.tsx` | 添加行业卡片和 `fileKeywords` 匹配 |

---

## 八、数据库表结构参考

```sql
-- users 表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  subscriptionTier ENUM('free', 'pro', 'enterprise') NOT NULL DEFAULT 'free',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- drilldowns 表（上传的 Drilldown 报告）
CREATE TABLE drilldowns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  industryName VARCHAR(255) NOT NULL,
  originalFilename VARCHAR(512),
  s3FileKey VARCHAR(1024) NOT NULL,
  s3FileUrl VARCHAR(2048) NOT NULL,
  parsedData JSON,
  isDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- drilldownShares 表（报告分享权限）
CREATE TABLE drilldownShares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drilldownId INT NOT NULL,
  sharedWithUserId INT,
  sharedWithEmail VARCHAR(320),
  permission ENUM('view', 'edit', 'admin') NOT NULL DEFAULT 'view',
  shareToken VARCHAR(128),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 九、常见问题

**Q：迁移后 LLM 分析功能报错怎么办？**

检查 `BUILT_IN_FORGE_API_KEY` 是否正确配置，并确认 `server/_core/llm.ts` 中的模型名称与目标 API 支持的模型一致。

**Q：数据库迁移失败怎么办？**

确认 `DATABASE_URL` 格式正确（`mysql://user:pass@host:port/dbname`），并确保数据库用户有建表权限。运行 `pnpm db:push` 时如报错，可查看 `drizzle/migrations/` 目录下的迁移文件。

**Q：前端页面显示但 API 调用失败怎么办？**

检查 `/api/trpc` 请求是否正确代理到后端。本项目使用 Vite 开发服务器代理，生产环境需要在 Express 中配置静态文件服务（`server/_core/vite.ts` 已处理）。

**Q：Manus OAuth 登录在迁移后无法使用怎么办？**

Manus OAuth 是 Manus 平台专有服务，迁移后无法直接使用。需要替换为其他 OAuth 方案，或暂时去掉登录功能（将 `protectedProcedure` 改为 `publicProcedure`）。

---

## 十、版本历史

| checkpoint | 日期 | 主要变更 |
|-----------|------|--------|
| `5b1049a5` | 2026-04-02 | 方法学指标库质量核查；浮窗优化（灰色?提示） |
| `bd7b7cf4` | 2026-04-02 | 新增 Solar 行业 Drilldown；Excel 导出功能；企业分析页重构 |
| `cdeaf783` | 2026-03-30 | 初始化项目；房地产 Drilldown；LLM 对照分析；Drilldown 管理 |
