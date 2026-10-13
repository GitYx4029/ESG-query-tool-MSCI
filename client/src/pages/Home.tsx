/*
 * Home Page - 行业查询主页
 * 设计风格：知识图谱风格，ESG三色体系（绿/橙/蓝）
 * 搜索驱动的渐进式探索，从行业选择到关键议题展示
 */
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  Search,
  ChevronRight,
  Leaf,
  Users,
  Shield,
  Building2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import { trackEvent } from "@/lib/community";
import Header from "@/components/Header";
import {
  sectors,
  searchIndustries,
  getESKeyIssues,
  sectorNamesCN,
  industryNamesCN,
  pillarNamesCN,
  issueNamesCN,
  getImportanceLabelCN,
  getPillarColor,
  type Industry,
  type PillarType,
} from "@/lib/esgData";

const pillarIcons: Record<PillarType, React.ReactNode> = {
  Environment: <Leaf className="w-4 h-4" />,
  Social: <Users className="w-4 h-4" />,
  Governance: <Shield className="w-4 h-4" />,
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const filteredIndustries = useMemo(() => {
    if (searchQuery.trim()) {
      return searchIndustries(searchQuery.trim());
    }
    if (selectedSector) {
      const sector = sectors.find(s => s.name === selectedSector);
      return sector ? sector.industries : [];
    }
    return [];
  }, [searchQuery, selectedSector]);

  const showResults = searchQuery.trim() || selectedSector;
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(
      () =>
        trackEvent("search_result", { resultCount: filteredIndustries.length }),
      700
    );
    return () => clearTimeout(timer);
  }, [searchQuery, filteredIndustries.length]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container relative pt-7 pb-6 md:pt-10 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              ESG 行业议题
              <span className="block mt-1 bg-gradient-to-r from-esg-env via-esg-social to-esg-gov bg-clip-text text-transparent">
                查询与学习工具
              </span>
            </h1>
            <p
              className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              免费公益学习工具：查行业议题，读方法学原文。无需注册。
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-esg-gov transition-colors" />
              <input
                type="text"
                aria-label="搜索行业"
                placeholder="搜索行业，如：汽车、银行、光伏、AI"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) setSelectedSector(null);
                }}
                className="w-full h-13 pl-12 pr-16 rounded-xl border-2 border-border bg-white text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-esg-gov/50 focus:ring-4 focus:ring-esg-gov/10 transition-all shadow-sm hover:shadow-md"
                style={{ fontFamily: "var(--font-body)" }}
              />
              {searchQuery && (
                <button
                  aria-label="清空搜索"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs p-2"
                  onClick={() => setSearchQuery("")}
                >
                  清空
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {["汽车", "光伏", "银行", "AI"].map(word => (
                <button
                  key={word}
                  className="border rounded-full px-3 py-2"
                  onClick={() => {
                    setSelectedSector(null);
                    setSearchQuery(word);
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Primary entry points */}
      <section className="container -mt-2 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/industry/Automobiles"
            className="group rounded-2xl border-2 border-esg-env/30 bg-esg-env-bg/30 p-5 no-underline shadow-sm hover:shadow-md hover:border-esg-env/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-esg-env uppercase tracking-wide">
                  01 · 快速体验
                </div>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  试查汽车行业
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  无需准备文件，直接查看结果
                </p>
              </div>
              <Search className="w-7 h-7 text-esg-env group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          <Link
            href="/materiality-map"
            className="group rounded-2xl border-2 border-esg-gov/30 bg-esg-gov-bg/30 p-5 no-underline shadow-sm hover:shadow-md hover:border-esg-gov/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-esg-gov uppercase tracking-wide">
                  02 · 核心入口
                </div>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  重要性议题地图
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  查看各子行业议题重要性分布
                </p>
              </div>
              <Building2 className="w-7 h-7 text-esg-gov group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          <Link
            href="/company"
            className="group rounded-2xl border-2 border-esg-social/30 bg-esg-social-bg/30 p-5 no-underline shadow-sm hover:shadow-md hover:border-esg-social/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-esg-social uppercase tracking-wide">
                  03 · 管理员入口
                </div>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  企业分析
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  暂仅向管理员开放
                </p>
              </div>
              <ArrowRight className="w-7 h-7 text-esg-social group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ESG Three Pillars Overview */}
      {!showResults && (
        <section className="container py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {(["Environment", "Social", "Governance"] as PillarType[]).map(
              (pillar, idx) => (
                <motion.div
                  key={pillar}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`relative rounded-xl border overflow-hidden bg-${getPillarColor(pillar)}-bg/30 border-${getPillarColor(pillar)}-light hover:shadow-lg transition-all duration-300`}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-${getPillarColor(pillar)}-light flex items-center justify-center text-${getPillarColor(pillar)}`}
                      >
                        {pillarIcons[pillar]}
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {pillarNamesCN[pillar]}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {pillar}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className="text-sm text-muted-foreground leading-relaxed flex-1"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {pillar === "Environment" &&
                          "涵盖气候变化、自然资本、污染与废弃物、环境机遇四大主题，共13项关键议题"}
                        {pillar === "Social" &&
                          "涵盖人力资本、产品责任、利益相关方反对、社会机遇四大主题，共14项关键议题"}
                        {pillar === "Governance" &&
                          "涵盖公司治理和企业行为两大主题，共6项关键议题，适用于所有行业"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </motion.div>
        </section>
      )}

      {/* Sector Grid */}
      <section className="container pb-8">
        {!showResults && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                按 GICS 行业板块浏览
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {sectors.length} 个板块
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sectors.map((sector, idx) => (
                <motion.button
                  key={sector.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * idx }}
                  onClick={() => {
                    setSelectedSector(sector.name);
                    setSearchQuery("");
                  }}
                  className={`group p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md ${
                    selectedSector === sector.name
                      ? "border-esg-gov bg-esg-gov-bg shadow-sm"
                      : "border-border bg-card hover:border-esg-gov/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    GICS {sector.code}
                  </div>
                  <div
                    className="font-semibold text-sm text-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {sectorNamesCN[sector.name]}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sector.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-2">
                    {sector.industries.length} 个子行业
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Search/Filter Results */}
        {showResults && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {searchQuery.trim()
                    ? `搜索结果`
                    : `${sectorNamesCN[selectedSector!]} 板块`}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {filteredIndustries.length} 个候选行业
                </span>
              </div>
              {selectedSector && (
                <button
                  onClick={() => setSelectedSector(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  返回全部板块
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              常用业务词会匹配相关候选行业，企业实际 GICS 分类请另行核对。
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery + selectedSector}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredIndustries.map((industry, idx) => (
                  <IndustryCard
                    key={industry.name}
                    industry={industry}
                    index={idx}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredIndustries.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">未找到匹配的行业</p>
                <button
                  className="border rounded-lg px-4 py-2 mt-3 text-sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSector(null);
                  }}
                >
                  浏览全部行业
                </button>
                <p className="text-sm mt-1">
                  请尝试“汽车”“光伏”“银行”等常用词，或返回行业板块。
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="container pb-5">
        <FeedbackPrompt />
      </section>
      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            原始资料：
            <a
              href="https://www.msci.com/legal/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-esg-gov hover:underline"
            >
              MSCI 方法学资源目录
            </a>
          </div>
          <div>
            方法学来源：MSCI 官方方法学资源页（以页面最新版本为准） |
            仅供研究参考
          </div>
        </div>
      </footer>
    </div>
  );
}

function IndustryCard({
  industry,
  index,
}: {
  industry: Industry;
  index: number;
}) {
  const esIssues = getESKeyIssues(industry);
  const envIssues = esIssues.filter(i => i.pillar === "Environment");
  const socialIssues = esIssues.filter(i => i.pillar === "Social");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/industry/${encodeURIComponent(industry.name)}`}
        className="block no-underline"
      >
        <div className="group p-5 rounded-xl border border-border bg-card hover:shadow-lg hover:border-esg-gov/30 transition-all duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-0.5">
                {sectorNamesCN[industry.sector]} · GICS {industry.sectorCode}
              </div>
              <h3
                className="text-base font-bold text-foreground group-hover:text-esg-gov transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {industryNamesCN[industry.name] || industry.name}
              </h3>
              <div className="text-xs text-muted-foreground">
                {industry.name}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-esg-gov group-hover:translate-x-0.5 transition-all mt-1" />
          </div>

          {/* Key Issues Preview */}
          <div className="space-y-2">
            {envIssues.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded bg-esg-env-light text-esg-env flex items-center justify-center">
                  <Leaf className="w-3 h-3" />
                </span>
                <div className="flex flex-wrap gap-1">
                  {envIssues.slice(0, 4).map(issue => (
                    <span
                      key={issue.name}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        issue.importance === "high"
                          ? "bg-esg-env-light text-esg-env"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {issueNamesCN[issue.name] || issue.name}
                      {issue.importance === "high" && (
                        <span className="text-[9px] opacity-70">高</span>
                      )}
                    </span>
                  ))}
                  {envIssues.length > 4 && (
                    <span className="text-[11px] text-muted-foreground px-1">
                      +{envIssues.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
            {socialIssues.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded bg-esg-social-light text-esg-social flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </span>
                <div className="flex flex-wrap gap-1">
                  {socialIssues.slice(0, 4).map(issue => (
                    <span
                      key={issue.name}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        issue.importance === "high"
                          ? "bg-esg-social-light text-esg-social"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {issueNamesCN[issue.name] || issue.name}
                      {issue.importance === "high" && (
                        <span className="text-[9px] opacity-70">高</span>
                      )}
                    </span>
                  ))}
                  {socialIssues.length > 4 && (
                    <span className="text-[11px] text-muted-foreground px-1">
                      +{socialIssues.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
