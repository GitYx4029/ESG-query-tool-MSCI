/*
 * Industry Detail Page - 行业ESG关键议题详情
 * 设计风格：知识图谱风格，ESG三色体系
 * 展示行业的关键议题、重要性等级、方法学文件链接
 */
import { useParams, Link } from "wouter";
import { useMemo } from "react";
import { ArrowLeft, Leaf, Users, Shield, FileText, ExternalLink, ChevronRight, Download, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import {
  getAllIndustries,
  getESKeyIssues,
  getGovernanceIssues,
  getCoreMethodologyUrl,
  sectorNamesCN,
  industryNamesCN,
  pillarNamesCN,
  issueNamesCN,
  themeNamesCN,
  getImportanceLabelCN,
  getPillarColor,
  keyIssueHierarchy,
  type Industry,
  type PillarType,
  type KeyIssue,
  type ImportanceLevel
} from "@/lib/esgData";

const pillarIcons: Record<PillarType, React.ReactNode> = {
  Environment: <Leaf className="w-4 h-4" />,
  Social: <Users className="w-4 h-4" />,
  Governance: <Shield className="w-4 h-4" />
};

const importanceColors: Record<ImportanceLevel, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
  standard: "bg-slate-50 text-slate-500 border-slate-200"
};

const importanceDotColors: Record<ImportanceLevel, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
  standard: "bg-slate-300"
};

export default function IndustryDetail() {
  const params = useParams<{ name: string }>();
  const industryName = decodeURIComponent(params.name || "");

  const industry = useMemo(() => {
    return getAllIndustries().find(i => i.name === industryName);
  }, [industryName]);

  if (!industry) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">未找到行业：{industryName}</p>
          <Link href="/" className="text-esg-gov hover:underline mt-4 inline-block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const esIssues = getESKeyIssues(industry);
  const govIssues = getGovernanceIssues(industry);
  const envIssues = esIssues.filter(i => i.pillar === "Environment");
  const socialIssues = esIssues.filter(i => i.pillar === "Social");

  // Group by theme
  const groupByTheme = (issues: KeyIssue[]) => {
    const groups: Record<string, KeyIssue[]> = {};
    for (const issue of issues) {
      if (!groups[issue.theme]) groups[issue.theme] = [];
      groups[issue.theme].push(issue);
    }
    return groups;
  };

  const envByTheme = groupByTheme(envIssues);
  const socialByTheme = groupByTheme(socialIssues);

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
          <span className="text-foreground font-medium">
            {industryNamesCN[industry.name] || industry.name}
          </span>
        </nav>
      </div>

      {/* Industry Header */}
      <section className="container pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <Link href="/" className="mt-1 p-2 rounded-lg hover:bg-accent transition-colors no-underline">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">
              {sectorNamesCN[industry.sector]} ({industry.sector}) · GICS {industry.sectorCode}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              {industryNamesCN[industry.name] || industry.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{industry.name}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              {esIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">E&S 关键议题</div>
          </div>
          <div className="p-3 rounded-xl border border-esg-env-light bg-esg-env-bg/30">
            <div className="text-2xl font-bold text-esg-env" style={{ fontFamily: "var(--font-sans)" }}>
              {envIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">环境议题</div>
          </div>
          <div className="p-3 rounded-xl border border-esg-social-light bg-esg-social-bg/30">
            <div className="text-2xl font-bold text-esg-social" style={{ fontFamily: "var(--font-sans)" }}>
              {socialIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">社会议题</div>
          </div>
          <div className="p-3 rounded-xl border border-esg-gov-light bg-esg-gov-bg/30">
            <div className="text-2xl font-bold text-esg-gov" style={{ fontFamily: "var(--font-sans)" }}>
              {govIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">治理议题</div>
          </div>
        </motion.div>
      </section>

      {/* Weight Distribution Section */}
      <section className="container pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
              议题权重分布
            </h2>
            <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              基于MSCI方法学框架估算
            </span>
          </div>

          {/* Pillar Weight Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-esg-env-bg/40 border border-esg-env-light p-3 text-center">
              <div className="text-xl font-bold text-esg-env" style={{ fontFamily: "var(--font-sans)" }}>
                {envIssues.reduce((s, i) => s + (i.weight || 0), 0)}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">环境权重</div>
            </div>
            <div className="rounded-lg bg-esg-social-bg/40 border border-esg-social-light p-3 text-center">
              <div className="text-xl font-bold text-esg-social" style={{ fontFamily: "var(--font-sans)" }}>
                {socialIssues.reduce((s, i) => s + (i.weight || 0), 0)}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">社会权重</div>
            </div>
            <div className="rounded-lg bg-esg-gov-bg/40 border border-esg-gov-light p-3 text-center">
              <div className="text-xl font-bold text-esg-gov" style={{ fontFamily: "var(--font-sans)" }}>33%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">治理权重</div>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="space-y-2">
            {[
              ...esIssues
                .filter(i => (i.weight || 0) > 0)
                .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                .map(i => ({ ...i, isGov: false })),
              { name: "Corporate Governance", pillar: "Governance" as const, theme: "Corporate Governance", importance: "standard" as const, methodologyUrl: "", weight: 33, isGov: true }
            ].map((item, idx) => {
              const barColor = item.pillar === "Environment" ? "#16a34a" : item.pillar === "Social" ? "#d97706" : "#2563eb";
              const maxW = Math.max(...esIssues.map(i => i.weight || 0), 33);
              return (
                <div key={item.name + idx}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-foreground truncate" style={{ flex: "0 0 auto", maxWidth: "52%" }}>
                      {issueNamesCN[item.name] || item.name}
                    </span>
                    {!item.isGov && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        item.importance === "high" ? "bg-red-50 text-red-700 border border-red-200" :
                        item.importance === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}>
                        {item.importance === "high" ? "高" : item.importance === "medium" ? "中" : "低"}
                      </span>
                    )}
                    <span className="text-xs font-bold ml-auto shrink-0" style={{ color: barColor }}>
                      {item.weight}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((item.weight || 0) / maxW) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.2 + idx * 0.04, ease: "easeOut" }}
                      className="h-full rounded"
                      style={{ backgroundColor: barColor, opacity: item.isGov ? 0.6 : 1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground mt-3" style={{ fontFamily: "var(--font-body)" }}>
            权重估算基于MSCI方法学框架：高重要性议题系数3×，中重要性2×，低重要性1×；治理支柱固定33%，E&S议题合计约67%。
          </p>
        </motion.div>
      </section>

      {/* Key Issues Sections */}
      <section className="container pb-8 space-y-6">
        {/* Environment */}
        {envIssues.length > 0 && (
          <PillarSection
            pillar="Environment"
            issuesByTheme={envByTheme}
            delay={0.2}
          />
        )}

        {/* Social */}
        {socialIssues.length > 0 && (
          <PillarSection
            pillar="Social"
            issuesByTheme={socialByTheme}
            delay={0.3}
          />
        )}

        {/* Governance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-esg-gov-light bg-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-esg-gov-light/50 bg-esg-gov-bg/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-esg-gov-light flex items-center justify-center text-esg-gov">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {pillarNamesCN.Governance} (Governance)
              </h2>
              <p className="text-xs text-muted-foreground">所有行业均适用标准治理议题评估</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {govIssues.map(issue => (
                <a
                  key={issue.name}
                  href={issue.methodologyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-esg-gov/30 hover:bg-esg-gov-bg/20 transition-all no-underline"
                >
                  <FileText className="w-4 h-4 text-esg-gov shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-esg-gov transition-colors">
                      {issueNamesCN[issue.name] || issue.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{issue.name}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-esg-gov transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Core Methodology */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                MSCI ESG 评级核心方法学
              </h3>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)" }}>
                完整的MSCI ESG评级方法学文件，包含评级框架、关键议题权重计算、行业分类等核心内容
              </p>
              <a
                href={getCoreMethodologyUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-esg-gov text-white text-sm font-medium hover:opacity-90 transition-opacity no-underline"
              >
                <FileText className="w-4 h-4" />
                查看核心方法学文件 (PDF)
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Navigate to Company Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href={`/company?industry=${encodeURIComponent(industry.name)}`}
            className="block no-underline"
          >
            <div className="rounded-xl border border-dashed border-esg-gov/30 bg-esg-gov-bg/20 p-5 hover:border-esg-gov/50 hover:bg-esg-gov-bg/40 transition-all group">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-esg-gov" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground group-hover:text-esg-gov transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    进入企业 ESG 分析
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    查询该行业企业的ESG页面、可持续发展报告，并基于上述方法学进行ESG表现分析
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-esg-gov group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-4">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            数据来源：
            <a href="https://www.msci.com/data-and-analytics/sustainability-solutions/esg-industry-materiality-map" target="_blank" rel="noopener noreferrer" className="text-esg-gov hover:underline">
              MSCI ESG Industry Materiality Map
            </a>
          </div>
          <div>仅供研究参考</div>
        </div>
      </footer>
    </div>
  );
}

function PillarSection({
  pillar,
  issuesByTheme,
  delay
}: {
  pillar: PillarType;
  issuesByTheme: Record<string, KeyIssue[]>;
  delay: number;
}) {
  const colorKey = getPillarColor(pillar);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border border-${colorKey}-light bg-card overflow-hidden`}
    >
      <div className={`px-5 py-4 border-b border-${colorKey}-light/50 bg-${colorKey}-bg/30 flex items-center gap-3`}>
        <div className={`w-8 h-8 rounded-lg bg-${colorKey}-light flex items-center justify-center text-${colorKey}`}>
          {pillarIcons[pillar]}
        </div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          {pillarNamesCN[pillar]} ({pillar})
        </h2>
      </div>
      <div className="p-5 space-y-4">
        {Object.entries(issuesByTheme).map(([theme, issues]) => (
          <div key={theme}>
            <div className="text-sm font-semibold text-muted-foreground mb-2" style={{ fontFamily: "var(--font-sans)" }}>
              {themeNamesCN[theme] || theme} ({theme})
            </div>
            <div className="space-y-2">
              {issues.sort((a, b) => {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2, standard: 3 };
                return (order[a.importance] || 3) - (order[b.importance] || 3);
              }).map(issue => (
                <a
                  key={issue.name}
                  href={issue.methodologyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-current/20 hover:shadow-sm transition-all no-underline"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${importanceDotColors[issue.importance]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-esg-gov transition-colors">
                        {issueNamesCN[issue.name] || issue.name}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${importanceColors[issue.importance]}`}>
                        {getImportanceLabelCN(issue.importance)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{issue.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-esg-gov transition-colors" />
                    <span className="text-[10px] text-muted-foreground/60 group-hover:text-esg-gov transition-colors hidden sm:inline">
                      方法学
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-esg-gov transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
