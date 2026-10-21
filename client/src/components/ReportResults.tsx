import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  statusLabels,
  type Evidence,
  type ReportFinding,
} from "@shared/report";
import { criteriaForIssue } from "@/lib/reportFramework";
import { issueNamesCN, type Industry } from "@/lib/esgData";
import { reviewLabels, type ManualReview } from "@/lib/reportExport";
import {
  matchesResultFilter,
  type ResultFilter,
} from "@/lib/reportPresentation";
import { EvidenceCard, EvidenceContexts } from "./ReportEvidence";

type Props = {
  industry: Industry;
  results: Record<string, ReportFinding[]>;
  reviews: Record<string, ManualReview>;
  onReview: (id: string, value: ManualReview) => void;
  open: (e: Evidence) => void;
  aiReady: boolean;
  aiIssue: string | null;
  aiError: Record<string, string>;
  onAi: (issue: string) => void;
  cancelAi: () => void;
};
export default function ReportResults({
  industry,
  results,
  reviews,
  onReview,
  open,
  aiReady,
  aiIssue,
  aiError,
  onAi,
  cancelAi,
}: Props) {
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState<ResultFilter>("all");
  const issue =
    industry.keyIssues.find(i => i.name === selected) ??
    industry.keyIssues.find(i =>
      (results[i.name] ?? []).some(f => f.evidence.length)
    ) ??
    industry.keyIssues[0];
  const all = Object.values(results).flat();
  const counts = {
    all: all.length,
    found: all.filter(f => f.evidence.length).length,
    missing: all.filter(f => !f.evidence.length).length,
    pending: all.filter(f =>
      matchesResultFilter(f, "pending", reviews[f.criterionId])
    ).length,
  };
  const filters: Array<[ResultFilter, string]> = [
    ["all", "全部核验项"],
    ["found", "有相关线索"],
    ["missing", "未定位证据"],
    ["pending", "待人工复核"],
  ];
  const findings = (results[issue.name] ?? []).filter(f =>
    matchesResultFilter(f, filter, reviews[f.criterionId])
  );
  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-2"
        aria-label="结果筛选"
      >
        {filters.map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-xl border p-3 text-left ${filter === value ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
          >
            <span className="block text-xs text-slate-600">{label}</span>
            <strong className="block text-2xl font-semibold mt-1 tabular-nums text-slate-900">
              {counts[value]}
            </strong>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        命中数量表示检索覆盖，不代表披露充分程度。人工复核结果仅在当前页面保存，并随
        CSV 导出。
      </p>
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
        <nav
          aria-label="对照议题"
          className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto rounded-xl border bg-white p-2"
        >
          {industry.keyIssues.map(i => {
            const rows = results[i.name] ?? [];
            const visible = rows.filter(f =>
              matchesResultFilter(f, filter, reviews[f.criterionId])
            ).length;
            return (
              <button
                key={i.name}
                aria-pressed={issue.name === i.name}
                onClick={() => setSelected(i.name)}
                className={`shrink-0 lg:shrink flex items-center gap-2 text-sm text-left rounded-lg px-3 py-3 ${issue.name === i.name ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span className="flex-1">{issueNamesCN[i.name] ?? i.name}</span>
                <span className="text-xs tabular-nums opacity-60">
                  {visible}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {issueNamesCN[issue.name] ?? issue.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  当前筛选下 {findings.length} 项 · 先看关键摘录，再回查原文
                </p>
              </div>
              {aiReady && (
                <button
                  disabled={Boolean(aiIssue)}
                  onClick={() => onAi(issue.name)}
                  className="border rounded-lg p-2 text-xs flex items-center gap-2 disabled:opacity-40"
                >
                  {aiIssue === issue.name ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  AI精读本议题
                </button>
              )}
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <a
                href={issue.methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 underline"
              >
                MSCI方法学原文 ↗
              </a>
              {aiIssue === issue.name && (
                <button className="underline" onClick={cancelAi}>
                  取消精读
                </button>
              )}
            </div>
            {aiError[issue.name] && (
              <p role="alert" className="text-sm text-amber-800">
                {aiError[issue.name]}
              </p>
            )}
          </div>
          {!findings.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              本议题没有符合当前筛选条件的核验项。
            </div>
          )}
          {findings.map(f => {
            const criterion = criteriaForIssue(issue.name).find(
              c => c.id === f.criterionId
            )!;
            const located = (f.elements ?? []).filter(e => e.page);
            const primary = f.evidence[0];
            return (
              <article
                key={f.criterionId}
                className="rounded-xl border bg-white p-4 md:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-base">{criterion.label}</h4>
                  <span
                    className={`text-xs rounded-full px-2.5 py-1 ${f.evidence.length ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600"}`}
                  >
                    {statusLabels[f.status]}
                  </span>
                </div>
                {located.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      已定位数据 · 按原指标口径摘录
                    </p>
                    <div className="divide-y rounded-lg border border-slate-100">
                      {located.map((e, i) => (
                        <div
                          key={i}
                          className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-1 p-3 text-sm leading-relaxed"
                        >
                          <p>
                            <span className="font-medium">{e.label}</span>
                            {f.evidence.some(
                              source =>
                                source.page === e.page &&
                                source.quote.includes(e.label) &&
                                source.context?.some(context =>
                                  /仅为|园区/.test(context.quote)
                                )
                            ) && (
                              <span className="ml-2 text-xs text-amber-800">
                                局部场所口径
                              </span>
                            )}
                            <span className="block text-slate-600 mt-1">
                              {e.detail}
                            </span>
                          </p>
                          <button
                            className="text-xs text-blue-800 underline self-start sm:pt-1 text-left"
                            onClick={() =>
                              open({
                                ...primary,
                                id: `element-${f.criterionId}-${i}`,
                                page: e.page!,
                                quote:
                                  e.quote ??
                                  f.evidence.find(
                                    source => source.page === e.page
                                  )?.quote ??
                                  "请核对原页中的该项数据。",
                                method: primary?.method ?? "text",
                                context: [],
                              })
                            }
                          >
                            第{e.page}页
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-slate-700">
                    {f.summary}
                  </p>
                )}
                {f.gaps.length > 0 && (
                  <div className="border-l-2 border-slate-300 pl-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      待核验
                    </p>
                    <ul className="text-sm text-slate-600 leading-7 space-y-1">
                      {f.gaps.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 items-center justify-between border-t pt-3">
                  <div className="flex gap-3 text-xs">
                    {primary && (
                      <button
                        className="text-blue-800 underline"
                        onClick={() => open(primary)}
                      >
                        主证据 · 第{primary.page}页
                      </button>
                    )}
                    <details>
                      <summary className="cursor-pointer text-slate-500">
                        核验要点
                      </summary>
                      <p className="text-slate-600 max-w-lg leading-relaxed mt-2">
                        {criterion.requirement}
                      </p>
                    </details>
                  </div>
                  <label className="text-xs text-slate-500 flex gap-2 items-center">
                    人工复核
                    <select
                      aria-label={`${criterion.label}人工复核`}
                      className="border rounded-lg px-2 py-1.5 bg-white text-slate-700 max-w-44"
                      value={reviews[f.criterionId] ?? "pending"}
                      onChange={e =>
                        onReview(f.criterionId, e.target.value as ManualReview)
                      }
                    >
                      {Object.entries(reviewLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {f.evidence.length > 0 && (
                  <details className="border-t pt-3">
                    <summary className="text-sm text-blue-800 cursor-pointer">
                      查看 {f.evidence.length} 条原文证据与范围注释
                    </summary>
                    <div className="mt-4 space-y-3">
                      {f.evidence.map(e => (
                        <EvidenceCard
                          key={e.id}
                          evidence={e}
                          open={open}
                          showContext={false}
                        />
                      ))}
                      <EvidenceContexts evidence={f.evidence} open={open} />
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
