import { useEffect, useState } from "react";
import { getCommunityToken } from "@/lib/adminSession";
import Header from "@/components/Header";
import { adminRequest, hasCommunityApi, communityOrigin } from "@/lib/community";
import { APP_VERSION, type FeedbackRecord } from "@shared/community";
type Summary = {
  periodDays: number;
  sessions: number;
  entries: number;
  searches: number;
  zeroResults: number;
  failures: number;
  methodologyClicks: number;
  industries: [string, number][];
  sources: [string, number][];
  feedback: FeedbackRecord[];
};
const categories: Record<string, string> = {
  missing_industry: "找不到行业",
  unclear: "内容看不懂",
  incorrect: "信息或链接有误",
  feature: "新功能",
  other: "其他",
};
export default function AdminInsights() {
  if (communityOrigin?.endsWith(".chatgpt.site")) {
    return <div><Header /><main className="container py-8 max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">项目反馈与使用统计</h1>
      <p className="text-sm text-muted-foreground">反馈与需求集中保存在项目后台。请使用创建项目时的 ChatGPT 账号登录，只有项目管理员可以查看记录。</p>
      <a className="inline-flex rounded-lg border px-4 py-3 bg-esg-env text-white" href={`${communityOrigin}/admin`} target="_blank" rel="noopener noreferrer">打开项目管理后台</a>
      <p className="text-xs text-muted-foreground">可查看近30天匿名统计、记录小红书建议、更新处理状态并导出需求表。</p>
    </main></div>;
  }
  return <LegacyAdminInsights />;
}
function LegacyAdminInsights() {
  const [data, setData] = useState<Summary | null>(null),
    [error, setError] = useState("");
  const [token, setToken] = useState(getCommunityToken);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await adminRequest("summary"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const update = async (
    row: FeedbackRecord,
    patch: Partial<FeedbackRecord>
  ) => {
    try {
      await adminRequest(`feedback/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: row.status,
          priority: row.priority,
          ...patch,
        }),
      });
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };
  const exportCsv = () => {
    if (!data) return;
    const cell = (value: unknown) => {
      let s = String(value ?? "");
      if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const rows = [
      [
        "编号",
        "日期",
        "渠道",
        "类型",
        "场景",
        "行业",
        "建议",
        "优先级",
        "状态",
        "联系许可",
        "联系方式",
      ],
      ...data.feedback.map(r => [
        r.id,
        r.createdAt,
        r.channel,
        categories[r.category],
        r.role,
        r.industry,
        r.message,
        r.priority,
        r.status,
        r.consentToContact ? "已同意" : "无",
        r.contact,
      ]),
    ];
    const href = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map(row => row.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" }
      )
    );
    const a = document.createElement("a");
    a.href = href;
    a.download = "ESG-project-feedback.csv";
    a.click();
    URL.revokeObjectURL(href);
  };
  return (
    <div>
      <Header />
      <main className="container py-5 space-y-4">
        <h1 className="text-2xl font-bold">项目反馈与使用统计</h1>
        <p className="text-sm text-muted-foreground">
          仅统计同意匿名统计的访问，按近30天汇总。会话数不等于真实人数；PDF点击不代表阅读完成。
        </p>
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="border rounded-lg px-3 py-2"
            onClick={refresh}
          >
            {busy ? "读取中…" : "刷新"}
          </button>
          <button
            disabled={!data}
            className="border rounded-lg px-3 py-2 disabled:opacity-40"
            onClick={exportCsv}
          >
            导出需求表 CSV
          </button>
        </div>
        {hasCommunityApi && (
          <form
            className="border rounded-xl p-4 flex flex-wrap gap-2 items-end"
            onSubmit={e => {
              e.preventDefault();
              sessionStorage.setItem("esg-community-admin-token", token);
              void refresh();
            }}
          >
            <label className="text-sm flex-1">
              私有反馈服务管理凭证
              <input
                type="password"
                value={token}
                autoComplete="off"
                onChange={e => setToken(e.target.value)}
                className="block w-full border rounded-lg p-2 mt-1"
              />
            </label>
            <button className="border rounded-lg px-3 py-2">验证并读取</button>
            <p className="w-full text-xs text-muted-foreground">
              由服务端配置的独立管理凭证保护私有记录，仅保留在当前标签页。
            </p>
          </form>
        )}
        {error && (
          <div role="alert" className="border rounded-xl p-4 text-sm">
            {error}
            {!hasCommunityApi && (
              <p className="mt-2">
                集中记录需要运行仓库中的反馈统计服务，并设置网站的服务地址。目前不会展示虚构统计数字。
              </p>
            )}
          </div>
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["匿名会话", data.sessions],
                ["搜索完成", data.searches],
                ["零结果搜索", `${data.zeroResults}/${data.searches}`],
                ["方法学点击", data.methodologyClicks],
              ].map(([label, value]) => (
                <div className="border rounded-xl p-4" key={String(label)}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <section className="border rounded-xl p-4">
                <h2 className="font-bold mb-2">关注行业</h2>
                {data.industries.length ? (
                  data.industries.slice(0, 10).map(([name, count]) => (
                    <p className="flex justify-between text-sm py-1" key={name}>
                      <span>{name}</span>
                      <span>{count}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂无记录</p>
                )}
              </section>
              <section className="border rounded-xl p-4">
                <h2 className="font-bold mb-2">入口来源／笔记</h2>
                {data.sources.map(([name, count]) => (
                  <p className="flex justify-between text-sm py-1" key={name}>
                    <span>{name}</span>
                    <span>{count}</span>
                  </p>
                ))}
              </section>
            </div>
            <section className="border rounded-xl p-4">
              <h2 className="font-bold">统一需求记录</h2>
              <p className="text-xs text-muted-foreground mt-1">
                站内反馈和手工录入的小红书建议统一管理。按出现频次、是否阻碍完成任务和处理成本排优先级。
              </p>
              <form
                className="flex flex-col sm:flex-row gap-2 my-3"
                onSubmit={async e => {
                  e.preventDefault();
                  try {
                    await adminRequest("admin-feedback", {
                      method: "POST",
                      body: JSON.stringify({
                        outcome: "partial",
                        category: "other",
                        role: "other",
                        message,
                        contact: "",
                        consentToContact: false,
                        page: "other",
                        industry: "",
                        version: APP_VERSION,
                      }),
                    });
                    setMessage("");
                    await refresh();
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                <input
                  required
                  maxLength={1000}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  aria-label="小红书需求内容"
                  placeholder="手工记录小红书建议（不含私人联系方式）"
                  className="border rounded-lg p-2 flex-1"
                />
                <button className="border rounded-lg px-3 py-2">
                  添加记录
                </button>
              </form>
              <div className="overflow-x-auto">
                <table className="text-xs w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">时间／渠道</th>
                      <th>需求与场景</th>
                      <th>优先级</th>
                      <th>状态</th>
                      <th>联系</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.feedback.map(row => (
                      <tr key={row.id} className="border-b">
                        <td className="p-2 whitespace-nowrap">
                          {row.createdAt.slice(0, 10)}
                          <br />
                          {row.channel}
                        </td>
                        <td className="p-2 max-w-[380px] whitespace-pre-wrap break-words">
                          {categories[row.category]} · {row.role}
                          <br />
                          {row.industry}
                          <br />
                          {row.message || "未补充说明"}
                        </td>
                        <td>
                          <select
                            aria-label="优先级"
                            value={row.priority}
                            onChange={e =>
                              void update(row, {
                                priority: e.target
                                  .value as FeedbackRecord["priority"],
                              })
                            }
                          >
                            <option value="normal">一般</option>
                            <option value="high">高</option>
                          </select>
                        </td>
                        <td>
                          <select
                            aria-label="处理状态"
                            value={row.status}
                            onChange={e =>
                              void update(row, {
                                status: e.target
                                  .value as FeedbackRecord["status"],
                              })
                            }
                          >
                            <option value="new">待看</option>
                            <option value="planned">已计划</option>
                            <option value="done">已处理</option>
                          </select>
                        </td>
                        <td>
                          {row.consentToContact
                            ? row.contact || "未填写"
                            : "未同意联系"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.feedback.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">暂无反馈</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
