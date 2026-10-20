import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import ShareButton from "@/components/ShareButton";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import { trackEvent } from "@/lib/community";
import {
  sectors,
  getAllIndustries,
  getESKeyIssues,
  sectorNamesCN,
  industryNamesCN,
  issueNamesCN,
  pillarNamesCN,
  getMethodologyUrl,
  MSCI_MATERIALITY_MAP_URL,
  type PillarType,
} from "@/lib/esgData";
import { methodologyRegistry } from "@/lib/methodologyRegistry";
import { importanceColors } from "@/lib/importanceStyle";

const labels: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
  standard: "通用",
};
const colors: Record<PillarType, string> = {
  Environment: "border-esg-env-light bg-esg-env-bg/30",
  Social: "border-esg-social-light bg-esg-social-bg/30",
  Governance: "border-esg-gov-light bg-esg-gov-bg/30",
};

export default function MaterialityMap() {
  const initialIndustry = getAllIndustries().find(
    i => i.name === new URLSearchParams(window.location.search).get("industry")
  );
  const [sectorName, setSectorName] = useState(
    initialIndustry?.sector || "Energy"
  );
  const [industryName, setIndustryName] = useState(initialIndustry?.name || "");
  const sector = sectors.find(s => s.name === sectorName)!;
  const industry =
    sector.industries.find(i => i.name === industryName) ||
    sector.industries[0];
  const sectorIssues = useMemo(
    () =>
      Array.from(
        new Set(
          sector.industries.flatMap(i => getESKeyIssues(i).map(x => x.name))
        )
      ),
    [sector]
  );
  const shareUrl = new URL(
    `${import.meta.env.BASE_URL}materiality-map?industry=${encodeURIComponent(industry.name)}`,
    window.location.origin
  ).href;
  useEffect(() => {
    trackEvent("industry_view", {
      industry: industry.name,
      page: "materiality-map",
    });
  }, [industry.name]);
  const selectIndustry = (name: string) => {
    setIndustryName(name);
    window.history.replaceState(
      null,
      "",
      `${import.meta.env.BASE_URL}materiality-map?industry=${encodeURIComponent(name)}`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-5 space-y-5">
        <Link href="/" className="text-sm text-muted-foreground">
          ← 首页
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">行业议题地图</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              按行业浏览关键议题，查阅公开方法学原文。
            </p>
          </div>
          <a
            href={MSCI_MATERIALITY_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border rounded-lg px-3 py-2 text-sm"
          >
            MSCI 官方议题地图 ↗
          </a>
        </div>
        <div className="border rounded-xl p-3 text-xs leading-relaxed text-muted-foreground">
          本页为独立整理的学习参考。高／中／低为参考关注等级，不代表官方权重或企业最终适用议题；本页不展示估算百分比。企业实际分类与评级请查阅官方资料。
        </div>
        <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3">
          <label className="text-sm">
            行业板块
            <select
              className="mt-1 w-full border rounded-lg p-3 bg-white"
              value={sectorName}
              onChange={e => {
                setSectorName(e.target.value);
                const next = sectors.find(s => s.name === e.target.value)!
                  .industries[0];
                selectIndustry(next.name);
              }}
            >
              {sectors.map(s => (
                <option value={s.name} key={s.name}>
                  {sectorNamesCN[s.name]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            行业
            <select
              className="mt-1 w-full border rounded-lg p-3 bg-white"
              value={industry.name}
              onChange={e => selectIndustry(e.target.value)}
            >
              {sector.industries.map(i => (
                <option value={i.name} key={i.name}>
                  {industryNamesCN[i.name] || i.name}
                </option>
              ))}
            </select>
          </label>
          <div className="self-end flex gap-2">
            <Link
              className="border rounded-lg px-3 py-3 text-sm"
              href={`/industry/${encodeURIComponent(industry.name)}`}
            >
              查看详情
            </Link>
            <ShareButton url={shareUrl} />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {(["Environment", "Social", "Governance"] as PillarType[]).map(
            pillar => {
              const issues = industry.keyIssues.filter(
                i => i.pillar === pillar
              );
              return (
                <section
                  key={pillar}
                  className={`border rounded-xl p-4 ${colors[pillar]}`}
                >
                  <h2 className="font-bold mb-3">
                    {pillarNamesCN[pillar]}{" "}
                    <span className="font-normal text-xs text-muted-foreground">
                      {issues.length} 项
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {issues.map(issue => (
                      <a
                        key={issue.name}
                        href={getMethodologyUrl(issue.name)}
                        onClick={() =>
                          trackEvent("methodology_click", {
                            issue: issue.name,
                            industry: industry.name,
                          })
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white border rounded-lg p-3 text-sm"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span>{issueNamesCN[issue.name] || issue.name}</span>
                          <span className={`inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded border text-xs font-medium shrink-0 ${importanceColors[issue.importance]}`}>
                            {labels[issue.importance]}
                          </span>
                        </span>
                        <span className="block mt-1 text-xs text-muted-foreground">
                          {methodologyRegistry[issue.name]?.status ===
                          "verified"
                            ? "公开 PDF ↗"
                            : "官方目录 · 文件版本待核验 ↗"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              );
            }
          )}
        </div>
        <section className="border rounded-xl p-4">
          <h2 className="font-bold mb-1">
            {sectorNamesCN[sectorName]} · 行业对照
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            表格可左右滑动。— 表示本工具未列出，不能据此判断不适用。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-3 sticky left-0 bg-white min-w-[130px]">
                    行业
                  </th>
                  {sectorIssues.map(issue => (
                    <th key={issue} className="px-2 min-w-[78px]">
                      {issueNamesCN[issue] || issue}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sector.industries.map(i => (
                  <tr key={i.name} className="border-t">
                    <td className="py-3 sticky left-0 bg-white">
                      <Link href={`/industry/${encodeURIComponent(i.name)}`}>
                        {industryNamesCN[i.name] || i.name}
                      </Link>
                    </td>
                    {sectorIssues.map(name => {
                      const level = i.keyIssues.find(x => x.name === name)?.importance;
                      return (
                        <td className="text-center px-2" key={name}>
                          <span
                            className={level ? `inline-flex items-center justify-center min-w-8 px-2 py-1 rounded border font-medium ${importanceColors[level]}` : "text-slate-400"}
                            aria-label={level ? undefined : "本工具未列出"}
                          >
                            {labels[level || ""] || "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <FeedbackPrompt industry={industry.name} />

      </main>
    </div>
  );
}
