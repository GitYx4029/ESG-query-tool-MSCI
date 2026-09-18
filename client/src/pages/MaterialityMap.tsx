/*
 * MaterialityMap Page - MSCI 重要性议题地图
 * 设计风格：知识图谱风格，ESG三色体系
 * 复现MSCI行业重要性地图的核心交互，无需注册即可直接使用
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Leaf, Users, Shield, ExternalLink, BarChart3, Info, ArrowLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import {
  sectors,
  getESKeyIssues,
  sectorNamesCN,
  industryNamesCN,
  issueNamesCN,
  pillarNamesCN,
  getPillarColor,
  type PillarType,
  type KeyIssue,
  type Industry,
} from "@/lib/esgData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

const pillarIcons: Record<PillarType, React.ReactNode> = {
  Environment: <Leaf className="w-4 h-4" />,
  Social: <Users className="w-4 h-4" />,
  Governance: <Shield className="w-4 h-4" />,
};

const pillarBarColors: Record<PillarType, string> = {
  Environment: "#16a34a",
  Social: "#d97706",
  Governance: "#2563eb",
};

const pillarBgColors: Record<PillarType, string> = {
  Environment: "rgba(22,163,74,0.08)",
  Social: "rgba(217,119,6,0.08)",
  Governance: "rgba(37,99,235,0.08)",
};

const importanceLabelCN: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const importanceBadgeColors: Record<string, string> = {
  high: "bg-red-50 text-red-700 border border-red-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-slate-50 text-slate-600 border border-slate-200",
};

export default function MaterialityMap() {
  const [selectedSector, setSelectedSector] = useState<string>("Energy");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  const currentSector = useMemo(
    () => sectors.find((s) => s.name === selectedSector),
    [selectedSector]
  );

  const industryList = useMemo(() => currentSector?.industries || [], [currentSector]);

  const currentIndustry = useMemo(() => {
    if (selectedIndustry) return industryList.find((i) => i.name === selectedIndustry);
    return industryList[0];
  }, [selectedIndustry, industryList]);

  const esIssues = useMemo(
    () => (currentIndustry ? getESKeyIssues(currentIndustry) : []),
    [currentIndustry]
  );

  // 按支柱分组
  const envIssues = esIssues.filter((i) => i.pillar === "Environment");
  const socialIssues = esIssues.filter((i) => i.pillar === "Social");

  // 治理固定33%
  const govWeight = 33;
  const esTotal = esIssues.reduce((sum, i) => sum + (i.weight || 0), 0);

  // 所有议题（含治理占位）用于图表
  const chartData: { name: string; nameCN: string; weight: number; pillar: PillarType; importance: string }[] = [
    ...esIssues
      .filter((i) => i.weight && i.weight > 0)
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .map((i) => ({
        name: i.name,
        nameCN: issueNamesCN[i.name] || i.name,
        weight: i.weight || 0,
        pillar: i.pillar,
        importance: i.importance,
      })),
    {
      name: "Corporate Governance",
      nameCN: "公司治理（治理支柱）",
      weight: govWeight,
      pillar: "Governance" as PillarType,
      importance: "standard",
    },
  ];

  const maxWeight = Math.max(...chartData.map((d) => d.weight), 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="container pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors no-underline">
            行业查询
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">MSCI 重要性议题地图</span>
        </nav>
      </div>

      {/* Page Header */}
      <section className="container pt-4 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <Link href="/" className="mt-1 p-2 rounded-lg hover:bg-accent transition-colors no-underline shrink-0">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  MSCI 重要性议题地图
                </h1>
                <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)" }}>
                  基于 MSCI ESG 评级方法学，展示不同行业的关键议题及其估算权重分布
                </p>
              </div>
            </div>
            <a
              href="https://www.msci.com/data-and-analytics/sustainability-solutions/esg-industry-materiality-map"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors no-underline shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              MSCI 官方原版
            </a>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200"
        >
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            本页面权重数据基于 MSCI ESG 评级方法学（2024年版）中的权重设定框架估算：高重要性议题系数3×，中重要性2×，低重要性1×；治理支柱固定占比33%，E&S议题合计约67%。官方实际权重需访问 MSCI 官方平台获取。
          </p>
        </motion.div>
      </section>

      {/* Selectors */}
      <section className="container pb-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3 items-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">行业板块</span>
            <Select
              value={selectedSector}
              onValueChange={(v) => {
                setSelectedSector(v);
                setSelectedIndustry("");
              }}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {sectorNamesCN[s.name] || s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">子行业</span>
            <Select
              value={currentIndustry?.name || ""}
              onValueChange={(v) => setSelectedIndustry(v)}
            >
              <SelectTrigger className="w-64 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {industryList.map((ind) => (
                  <SelectItem key={ind.name} value={ind.name}>
                    {industryNamesCN[ind.name] || ind.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentIndustry && (
            <Link
              href={`/industry/${encodeURIComponent(currentIndustry.name)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-esg-gov text-white text-xs font-medium hover:opacity-90 transition-opacity no-underline"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              查看详情
            </Link>
          )}
        </motion.div>
      </section>

      {/* Main Content */}
      {currentIndustry && (
        <section className="container pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Weight Chart */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  议题权重分布
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {industryNamesCN[currentIndustry.name] || currentIndustry.name}
                </span>
              </div>

              {/* Pillar Legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                {(["Environment", "Social", "Governance"] as PillarType[]).map((p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: pillarBarColors[p] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {pillarNamesCN[p]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar Chart */}
              <div className="space-y-2.5">
                {chartData.map((item, idx) => (
                  <div key={item.name} className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium text-foreground truncate"
                        style={{ minWidth: 0, flex: "0 0 auto", maxWidth: "55%" }}
                        title={item.nameCN}
                      >
                        {item.nameCN}
                      </span>
                      {item.importance !== "standard" && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${importanceBadgeColors[item.importance]}`}
                        >
                          {importanceLabelCN[item.importance]}
                        </span>
                      )}
                      <span className="text-xs font-bold text-foreground ml-auto shrink-0">
                        {item.weight}%
                      </span>
                    </div>
                    <div className="h-5 bg-muted rounded-md overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.weight / maxWeight) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.25 + idx * 0.04, ease: "easeOut" }}
                        className="h-full rounded-md"
                        style={{
                          backgroundColor: pillarBarColors[item.pillar],
                          opacity: item.importance === "standard" ? 0.6 : 1,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weight Summary */}
              <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div
                    className="text-xl font-bold"
                    style={{ color: pillarBarColors.Environment, fontFamily: "var(--font-sans)" }}
                  >
                    {envIssues.reduce((s, i) => s + (i.weight || 0), 0)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">环境权重</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-xl font-bold"
                    style={{ color: pillarBarColors.Social, fontFamily: "var(--font-sans)" }}
                  >
                    {socialIssues.reduce((s, i) => s + (i.weight || 0), 0)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">社会权重</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-xl font-bold"
                    style={{ color: pillarBarColors.Governance, fontFamily: "var(--font-sans)" }}
                  >
                    {govWeight}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">治理权重</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Issue Cards by Pillar */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Environment */}
              {envIssues.length > 0 && (
                <PillarCard
                  pillar="Environment"
                  issues={envIssues}
                  totalWeight={envIssues.reduce((s, i) => s + (i.weight || 0), 0)}
                />
              )}
              {/* Social */}
              {socialIssues.length > 0 && (
                <PillarCard
                  pillar="Social"
                  issues={socialIssues}
                  totalWeight={socialIssues.reduce((s, i) => s + (i.weight || 0), 0)}
                />
              )}
              {/* Governance */}
              <div className="rounded-xl border border-esg-gov-light bg-esg-gov-bg/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-esg-gov-light flex items-center justify-center text-esg-gov">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                    治理 (Governance)
                  </span>
                  <span
                    className="ml-auto text-base font-bold"
                    style={{ color: pillarBarColors.Governance, fontFamily: "var(--font-sans)" }}
                  >
                    33%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  治理支柱权重在支柱层面统一设定，最低不低于33%，适用于所有行业。包含公司治理（董事会、薪酬、所有权与控制、会计）和企业行为（商业道德、税务透明度）两大主题。
                </p>
              </div>
            </motion.div>
          </div>

          {/* All Industries Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 rounded-xl border border-border bg-card p-5"
          >
            <h2 className="text-base font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-sans)" }}>
              {sectorNamesCN[selectedSector]} 板块 — 子行业议题重要性概览
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground whitespace-nowrap min-w-[140px]">
                      子行业
                    </th>
                    {/* 动态获取当前板块所有出现的E&S议题 */}
                    {getAllSectorIssues(currentSector?.industries || []).map((issueName) => (
                      <th
                        key={issueName}
                        className="text-center py-2 px-1 font-medium text-muted-foreground"
                        style={{ minWidth: 56 }}
                        title={issueName}
                      >
                        <div
                          className="text-[10px] leading-tight"
                          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", height: 80 }}
                        >
                          {issueNamesCN[issueName] || issueName}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(currentSector?.industries || []).map((ind) => {
                    const esMap: Record<string, string> = {};
                    getESKeyIssues(ind).forEach((i) => {
                      esMap[i.name] = i.importance;
                    });
                    return (
                      <tr key={ind.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
                          <Link
                            href={`/industry/${encodeURIComponent(ind.name)}`}
                            className="hover:text-esg-gov transition-colors no-underline"
                          >
                            {industryNamesCN[ind.name] || ind.name}
                          </Link>
                        </td>
                        {getAllSectorIssues(currentSector?.industries || []).map((issueName) => {
                          const imp = esMap[issueName];
                          return (
                            <td key={issueName} className="text-center py-2 px-1">
                              {imp ? (
                                <div
                                  className="w-6 h-6 rounded mx-auto flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      imp === "high"
                                        ? "#ef4444"
                                        : imp === "medium"
                                        ? "#f59e0b"
                                        : "#94a3b8",
                                  }}
                                  title={`${issueNamesCN[issueName]}: ${imp === "high" ? "高" : imp === "medium" ? "中" : "低"}`}
                                >
                                  {imp === "high" ? "高" : imp === "medium" ? "中" : "低"}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded mx-auto bg-muted/30" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center text-white text-[9px] font-bold">高</div>
                <span>高重要性</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-400 flex items-center justify-center text-white text-[9px] font-bold">中</div>
                <span>中重要性</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-400 flex items-center justify-center text-white text-[9px] font-bold">低</div>
                <span>低重要性</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-muted/30" />
                <span>不适用</span>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 mt-4">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            数据来源：
            <a
              href="https://www.msci.com/data-and-analytics/sustainability-solutions/esg-industry-materiality-map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-esg-gov hover:underline"
            >
              MSCI ESG Industry Materiality Map
            </a>
            {" "}·{" "}
            <a
              href="https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-esg-gov hover:underline"
            >
              MSCI ESG Ratings Methodology (2024)
            </a>
          </div>
          <div>权重为基于方法学框架的估算值，仅供研究参考</div>
        </div>
      </footer>
    </div>
  );
}

// 获取板块内所有子行业出现过的E&S议题（去重，按支柱排序）
function getAllSectorIssues(industries: Industry[]): string[] {
  const issueMap: Record<string, string> = {};
  industries.forEach((ind: Industry) => {
    getESKeyIssues(ind).forEach((i) => {
      issueMap[i.name] = i.pillar;
    });
  });
  const envAll: string[] = [];
  const socialAll: string[] = [];
  Object.entries(issueMap).forEach(([name, pillar]) => {
    if (pillar === "Social") socialAll.push(name);
    else envAll.push(name);
  });
  return [...envAll, ...socialAll];
}

function PillarCard({
  pillar,
  issues,
  totalWeight,
}: {
  pillar: PillarType;
  issues: KeyIssue[];
  totalWeight: number;
}) {
  const colorKey = getPillarColor(pillar);
  return (
    <div
      className={`rounded-xl border border-${colorKey}-light overflow-hidden`}
      style={{ background: pillarBgColors[pillar] }}
    >
      <div className={`px-4 py-3 border-b border-${colorKey}-light/50 flex items-center gap-2`}>
        <div className={`w-7 h-7 rounded-lg bg-${colorKey}-light flex items-center justify-center text-${colorKey}`}>
          {pillarIcons[pillar]}
        </div>
        <span className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          {pillarNamesCN[pillar]} ({pillar})
        </span>
        <span
          className="ml-auto text-base font-bold"
          style={{ color: pillarBarColors[pillar], fontFamily: "var(--font-sans)" }}
        >
          {totalWeight}%
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        {issues
          .sort((a, b) => (b.weight || 0) - (a.weight || 0))
          .map((issue) => (
            <div key={issue.name} className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${importanceBadgeColors[issue.importance]}`}
              >
                {importanceLabelCN[issue.importance]}
              </span>
              <span className="text-xs text-foreground flex-1 truncate" title={issueNamesCN[issue.name]}>
                {issueNamesCN[issue.name] || issue.name}
              </span>
              <span
                className="text-xs font-bold shrink-0"
                style={{ color: pillarBarColors[pillar] }}
              >
                {issue.weight}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
