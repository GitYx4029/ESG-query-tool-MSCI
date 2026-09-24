/*
 * SolarDrilldown - 半导体与半导体设备行业（含光伏太阳能）ESG 评级量化细分模块
 * 适用企业：XYZ企业等光伏制造商
 * 参照 RealEstateDrilldown 模板构建，方法学数据来源：solarMethodology.ts
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileSpreadsheet, Building2, Leaf, Users, Shield,
  ChevronDown, ChevronRight, ExternalLink, TrendingUp, TrendingDown,
  Minus, Info, BarChart3, Target, AlertTriangle, Search, Plus, X, Globe,
  BookOpen, HelpCircle, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, Download
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  parseEsgDrilldown, applyDemoScoreProfile, getRatingColor, getScoreColor, getScoreLabel,
  type EsgDrilldownData, type PillarData, type KeyIssueData, type IndicatorData
} from "@/lib/parseEsgExcel";
import {
  findSolarIssueMethodology as findIssueMethodology,
  findSolarMethodologyTooltip as findMethodologyTooltip,
  type IssueMethodology, type MethodologyTooltip
} from "@/lib/solarMethodology";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import * as XLSX from "xlsx";

// 支柱配色
const pillarConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  Environmental: { color: "#16a34a", bg: "rgba(22,163,74,0.06)", border: "rgba(22,163,74,0.2)", icon: <Leaf className="w-4 h-4" />, label: "环境" },
  Social: { color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: <Users className="w-4 h-4" />, label: "社会" },
  Governance: { color: "#2563eb", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)", icon: <Shield className="w-4 h-4" />, label: "治理" },
};

// 同行企业类型
interface PeerCompany {
  id: string;
  name: string;
  esgPageUrl?: string;
  reportUrl?: string;
  searching?: boolean;
}

// 对照分析结果
interface DisclosureAnalysis {
  indicatorName: string;
  status: "met" | "partial" | "not_met" | "not_found";
  summary: string;
  source: string;
  details: string;
}

interface IssueAnalysisResult {
  issueName: string;
  analyses: DisclosureAnalysis[];
  overallAssessment: string;
}

export default function SolarDrilldown() {
  const isStaticSite = import.meta.env.BASE_URL !== "/";
  const [data, setData] = useState<EsgDrilldownData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 同行参考
  const [peers, setPeers] = useState<PeerCompany[]>([]);
  const [peerInput, setPeerInput] = useState("");

  // ESG报告上传与分析
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportFileName, setReportFileName] = useState("");
  const [analysisResults, setAnalysisResults] = useState<Map<string, IssueAnalysisResult>>(new Map());
  const [analyzingIssue, setAnalyzingIssue] = useState<string | null>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  // LLM分析mutation
  const analyzeDisclosure = trpc.esgAnalysis.analyzeDisclosure.useMutation();

  // 从企业分析页跳转过来时，自动读取sessionStorage中的文件并解析
  useEffect(() => {
    const pendingB64 = sessionStorage.getItem("drilldown_pending_file_b64");
    const pendingName = sessionStorage.getItem("drilldown_pending_file_name");
    if (!pendingB64 || !pendingName) return;

    // 清理sessionStorage，避免重复加载
    sessionStorage.removeItem("drilldown_pending_file_b64");
    sessionStorage.removeItem("drilldown_pending_file_name");
    sessionStorage.removeItem("drilldown_pending_company");

    try {
      // base64 → ArrayBuffer
      const binary = atob(pendingB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const buf = bytes.buffer;

      let parsed = parseEsgDrilldown(buf);
      const nameMatch = pendingName.match(/^([A-Z]+)_/);
      if (nameMatch) parsed.companyName = nameMatch[1];
      if (/^(XYZ(?:企业)?|JA)_/i.test(pendingName)) parsed = applyDemoScoreProfile(parsed, "semiconductor");
      setData(parsed);
      setFileName(pendingName);
      toast.success("ESG评分报告已自动加载");
    } catch (e) {
      console.error(e);
      toast.error("自动加载文件失败，请手动上传");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("请上传 .xlsx 或 .xls 格式的 Excel 文件");
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      let parsed = parseEsgDrilldown(buf);
      const nameMatch = file.name.match(/^([A-Z]+)_/);
      if (nameMatch) parsed.companyName = nameMatch[1];
      if (/^(XYZ(?:企业)?|JA)_/i.test(file.name)) parsed = applyDemoScoreProfile(parsed, "semiconductor");
      setData(parsed);
      setFileName(file.name);
      toast.success("ESG评分报告解析成功");
    } catch (e) {
      console.error(e);
      toast.error("文件解析失败，请确认是MSCI ESG Ratings Drilldown格式");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleIssue = (name: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // 处理ESG报告上传
  const handleReportUpload = useCallback((file: File) => {
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      toast.error("请上传 PDF 或 Word 格式的 ESG 报告");
      return;
    }
    setReportFile(file);
    setReportFileName(file.name);
    setAnalysisResults(new Map());
    toast.success(`已加载报告: ${file.name}`);
  }, []);

  // 对照分析某个议题
  const analyzeIssue = useCallback(async (issue: KeyIssueData) => {
    if (!reportFile || !data) return;
    if (isStaticSite) {
      toast.info("PDF 已成功加载。当前 GitHub Pages 为静态版本，逐条 AI 对照分析需要连接后端服务。");
      return;
    }
    setAnalyzingIssue(issue.name);

    try {
      // 将报告文件转为base64
      const buf = await reportFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const methodology = findIssueMethodology(issue.name);
      const indicators = [
        ...issue.practices.map(p => ({ name: p.name, score: p.score, weight: p.weight, type: "management" as const })),
        ...issue.performances.map(p => ({ name: p.name, score: p.score, weight: p.weight, type: "performance" as const })),
      ];

      const result = await analyzeDisclosure.mutateAsync({
        issueName: issue.name,
        companyName: data.companyName || "未知企业",
        reportBase64: base64,
        reportFileName: reportFileName,
        indicators: indicators.map(ind => ({
          name: ind.name,
          score: ind.score,
          type: ind.type,
          methodologyHint: methodology
            ? (findMethodologyTooltip(issue.name, ind.name)?.scoringCriteria || "")
            : "",
        })),
        methodologyOverview: methodology?.assessmentFramework || "",
      });

      setAnalysisResults(prev => {
        const next = new Map(prev);
        next.set(issue.name, result);
        return next;
      });
      toast.success(`${issue.name} 对照分析完成`);
    } catch (e) {
      console.error(e);
      toast.error("分析失败，请稍后重试");
    } finally {
      setAnalyzingIssue(null);
    }
  }, [reportFile, data, reportFileName, analyzeDisclosure, isStaticSite]);

  // 构建Excel行数据的通用函数（支持全部或单个议题）
  const buildExcelRows = useCallback((filterIssueName?: string) => {
    const statusMap: Record<string, string> = {
      met: "满足要求",
      partial: "部分满足",
      not_met: "未满足",
      not_found: "未找到相关披露",
    };

    const rows: string[][] = [
      ["指标归属", "指标名称", "权重", "满足状态", "分析结果", "信息出处", "方法学定义"],
    ];

    if (data) {
      for (const pillar of data.pillars) {
        const pillarLabel = pillarConfig[pillar.name]?.label || pillar.name;
        for (const issue of pillar.keyIssues) {
          if (filterIssueName && issue.name !== filterIssueName) continue;
          const result = analysisResults.get(issue.name);
          if (!result) continue;

          rows.push([
            `${pillarLabel} - ${issue.name}`,
            "总体评估",
            `${issue.weight}`,
            "",
            result.overallAssessment,
            "",
            "",
          ]);

          for (const analysis of result.analyses) {
            const allIndicators = [
              ...issue.practices.map(p => ({ name: p.name, weight: p.weight })),
              ...issue.performances.map(p => ({ name: p.name, weight: p.weight })),
            ];
            const matchedIndicator = allIndicators.find(
              ind => ind.name === analysis.indicatorName ||
                     analysis.indicatorName.includes(ind.name) ||
                     ind.name.includes(analysis.indicatorName)
            );
            const weight = matchedIndicator ? `${matchedIndicator.weight}` : "";
            const statusLabel = statusMap[analysis.status] || analysis.status;
            // 查找方法学定义（不含评分标准）
            const tooltip = findMethodologyTooltip(issue.name, analysis.indicatorName);
            const methodologyDef = tooltip?.definition || "";

            rows.push([
              `${pillarLabel} - ${issue.name}`,
              analysis.indicatorName,
              weight,
              statusLabel,
              `${analysis.summary}${analysis.details ? `\n${analysis.details}` : ""}`,
              analysis.source || "",
              methodologyDef,
            ]);
          }
        }
      }
    }
    return rows;
  }, [analysisResults, data]);

  // Excel导出功能（全部议题）
  const exportAnalysisToExcel = useCallback(() => {
    if (analysisResults.size === 0) {
      toast.error("暂无分析结果，请先对至少一个议题进行对照分析");
      return;
    }
    const rows = buildExcelRows();
    if (rows.length <= 1) { toast.error("未找到可导出的分析数据"); return; }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 28 }, { wch: 35 }, { wch: 8 }, { wch: 14 }, { wch: 55 }, { wch: 40 }, { wch: 60 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ESG对照分析结果");
    const companyLabel = data?.companyName || "企业";
    const dateLabel = data?.ratingDate ? `_${data.ratingDate.replace(/\s/g, "")}` : "";
    XLSX.writeFile(wb, `ESG对照分析_${companyLabel}${dateLabel}.xlsx`);
    toast.success("Excel文件已导出");
  }, [analysisResults, data, buildExcelRows]);

  // Excel导出功能（单个议题）
  const exportIssueToExcel = useCallback((issue: KeyIssueData) => {
    const rows = buildExcelRows(issue.name);
    if (rows.length <= 1) { toast.error("该议题暂无分析结果"); return; }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 28 }, { wch: 35 }, { wch: 8 }, { wch: 14 }, { wch: 55 }, { wch: 40 }, { wch: 60 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, issue.name);
    const companyLabel = data?.companyName || "企业";
    XLSX.writeFile(wb, `ESG对照分析_${companyLabel}_${issue.name}.xlsx`);
    toast.success(`${issue.name} 分析结果已导出`);
  }, [buildExcelRows, data]);

  // 添加同行企业
  const addPeer = useCallback(() => {
    const name = peerInput.trim();
    if (!name) return;
    if (peers.find(p => p.name === name)) { toast.error("该企业已添加"); return; }
    const newPeer: PeerCompany = { id: Date.now().toString(), name, searching: true };
    setPeers(prev => [...prev, newPeer]);
    setPeerInput("");
    setTimeout(() => {
      setPeers(prev => prev.map(p =>
        p.id === newPeer.id ? {
          ...p, searching: false,
          esgPageUrl: generateEsgPageUrl(name),
          reportUrl: generateReportUrl(name),
        } : p
      ));
    }, 1500);
  }, [peerInput, peers]);

  const removePeer = (id: string) => setPeers(prev => prev.filter(p => p.id !== id));

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
          <span className="text-foreground font-medium">ESG 评级量化细分</span>
        </nav>
      </div>

      {/* Page Header */}
      <section className="container pt-4 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-3">
            <Link href="/" className="mt-1 p-2 rounded-lg hover:bg-accent transition-colors no-underline shrink-0">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span>半导体与半导体设备 (Semiconductors & Semiconductor Equipment)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                ESG 评级量化细分分析
              </h1>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)" }}>
                上传 MSCI ESG Ratings Drilldown 报告，深入分析各议题得分、管理实践与绩效表现
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Upload Area */}
      {!data && (
        <section className="container pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
              dragActive ? "border-esg-gov bg-esg-gov-bg/30" : "border-border hover:border-esg-gov/50 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-esg-gov-bg flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-esg-gov" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  上传 MSCI ESG Ratings Drilldown 报告
                </h3>
                <p className="text-sm text-muted-foreground mt-1">拖拽 Excel 文件到此处，或点击下方按钮选择文件</p>
                <p className="text-xs text-muted-foreground mt-2">支持 .xlsx / .xls 格式 · 数据仅在浏览器本地解析，不会上传至服务器</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} className="bg-esg-gov hover:bg-esg-gov/90 text-white">
                <Upload className="w-4 h-4 mr-2" /> 选择文件
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p>本模块当前针对<strong>半导体与半导体设备</strong>行业设计（含光伏太阳能制造商）。MSCI ESG Ratings Drilldown 报告可从 MSCI ESG Manager 平台导出。</p>
              <p className="mt-1.5">
                <button onClick={async () => {
                  try {
                    const resp = await fetch('https://d2xsxph8kpxj0f.cloudfront.net/310519663376710174/iU5gURrSUnaBxwLDP9tjuN/JA-ESGRatingsDrilldown_01-April-2026_06_52_AM_e738518b.xlsx');
                    const blob = await resp.blob();
                    const file = new File([blob], 'XYZ企业_ESG评级细分示例.xlsx', { type: blob.type });
                    handleFile(file);
                  } catch { toast.error('加载示例文件失败'); }
                }} className="underline font-medium text-amber-900 hover:text-amber-700">
                  点此加载示例报告体验
                </button>
              </p>
            </div>
          </motion.div>
        </section>
      )}

      {/* Parsed Data Dashboard */}
      {data && (
        <>
          {/* Summary Cards */}
          <section className="container pb-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex flex-col gap-1">
                {/* 企业全称和上市代码 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">当前ESG Rating Drilldown数据来源为:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {data.companyName === "JA" || data.companyName === "上传企业"
                      ? "XYZ企业（半导体与半导体设备）"
                      : data.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    已解析: <strong className="text-foreground">{fileName}</strong>
                  </span>
                  <span className="text-xs text-muted-foreground">评级日期: {data.ratingDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => document.getElementById("report-analysis")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-esg-gov/40 text-esg-gov hover:bg-esg-gov-bg/40">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  ESG 报告对照
                </Button>
                {analysisResults.size > 0 && (
                  <Button variant="outline" size="sm" onClick={exportAnalysisToExcel}
                    className="border-green-200 text-green-700 hover:bg-green-50">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    导出分析结果
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setData(null); setFileName(""); }}>
                  重新上传
                </Button>
              </div>
            </motion.div>

            {/* Overall Rating */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center col-span-2 md:col-span-1">
                <div className="text-xs text-muted-foreground mb-2">ESG 评级</div>
                <div className="text-4xl font-black" style={{ color: getRatingColor(data.letterGrade), fontFamily: "var(--font-sans)" }}>
                  {data.letterGrade}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {data.priorLetterGrade !== data.letterGrade ? (
                    <span className="text-xs text-muted-foreground">前次: {data.priorLetterGrade}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">维持不变</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">行业调整分</div>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(data.industryAdjustedScore), fontFamily: "var(--font-sans)" }}>
                  {data.industryAdjustedScore.toFixed(1)}
                </div>
                <DiffBadge current={data.industryAdjustedScore} prior={data.priorIndustryAdjustedScore} />
              </div>

              {data.pillars.map(pillar => {
                const cfg = pillarConfig[pillar.name];
                return (
                  <div key={pillar.name} className="rounded-xl border bg-card p-4 text-center" style={{ borderColor: cfg?.border }}>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                      {cfg?.icon} {cfg?.label} ({pillar.weight}%)
                    </div>
                    <div className="text-2xl font-bold" style={{ color: cfg?.color, fontFamily: "var(--font-sans)" }}>
                      {pillar.score.toFixed(1)}
                    </div>
                    <DiffBadge current={pillar.score} prior={pillar.priorScore} />
                  </div>
                );
              })}
            </motion.div>

            {/* Industry Position Bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">行业定位</span>
                <span className="text-xs text-muted-foreground">
                  {getScoreLabel(data.industryAdjustedScore)}
                </span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full">
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm"
                  style={{ left: `${(data.industryAdjustedScore / 10) * 100}%`, transform: "translate(-50%, -50%)", borderColor: getRatingColor(data.letterGrade) }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>CCC</span><span>B</span><span>BB</span><span>BBB</span><span>A</span><span>AA</span><span>AAA</span>
              </div>
            </motion.div>
          </section>

          {/* ESG Report Upload for Analysis */}
          <section className="container pb-4">
            <motion.div id="report-analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl border-2 border-esg-gov/30 bg-esg-gov-bg/20 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-esg-gov text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  ESG 报告对照分析
                </h2>
                <span className="ml-auto text-xs font-medium text-esg-gov bg-white/70 border border-esg-gov/20 rounded-full px-2 py-1">重点功能</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 ml-11">上传企业 ESG 报告，逐条对照方法学指标，分析披露情况。</p>

              {!reportFile ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input ref={reportInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleReportUpload(file); }} />
                  <Button variant="outline" onClick={() => reportInputRef.current?.click()}
                    className="border-dashed border-2 h-12 px-6">
                    <Upload className="w-4 h-4 mr-2" />
                    上传企业 ESG/可持续发展报告（PDF）
                  </Button>
                  <span className="text-xs text-muted-foreground">支持 PDF / Word 格式</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-esg-gov-bg/30 border border-esg-gov/20">
                  <FileText className="w-5 h-5 text-esg-gov shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{reportFileName}</div>
                    <div className="text-xs text-muted-foreground">已加载，可在下方各议题中点击「对照分析」按钮{isStaticSite ? "（静态版仅验证上传，AI分析需后端）" : ""}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setReportFile(null); setReportFileName(""); setAnalysisResults(new Map()); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </section>

          {/* Pillar Sections */}
          <section className="container pb-6 space-y-4">
            {data.pillars.map((pillar, idx) => (
              <motion.div key={pillar.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}>
                <PillarSection
                  pillar={pillar}
                  expandedIssues={expandedIssues}
                  toggleIssue={toggleIssue}
                  reportLoaded={!!reportFile}
                  analyzingIssue={analyzingIssue}
                  analysisResults={analysisResults}
                  onAnalyzeIssue={analyzeIssue}
                  onExportIssue={exportIssueToExcel}
                />
              </motion.div>
            ))}
          </section>

          {/* Peer Comparison Section */}
          <section className="container pb-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-esg-gov" />
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  优秀同行参考
                </h2>
                <span className="text-xs text-muted-foreground">房地产开发行业</span>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={peerInput} onChange={(e) => setPeerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPeer()}
                    placeholder="输入同行企业名称，如：光伏企业A、光伏企业B..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-esg-gov/30 focus:border-esg-gov" />
                </div>
                <Button onClick={addPeer} size="sm" className="bg-esg-gov hover:bg-esg-gov/90 text-white h-9">
                  <Plus className="w-4 h-4 mr-1" /> 添加
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-muted-foreground self-center">快速添加：</span>
                {["光伏企业A", "光伏企业B", "光伏企业C", "光伏企业D", "光伏企业E", "光伏企业F"].map(name => (
                  <button key={name} onClick={() => {
                    const newPeer: PeerCompany = { id: Date.now().toString(), name, searching: true };
                    setPeers(prev => { if (prev.find(p => p.name === name)) return prev; return [...prev, newPeer]; });
                    setPeerInput("");
                    setTimeout(() => {
                      setPeers(prev => prev.map(p =>
                        p.id === newPeer.id ? { ...p, searching: false, esgPageUrl: generateEsgPageUrl(name), reportUrl: generateReportUrl(name) } : p
                      ));
                    }, 1200);
                  }}
                    className="px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-esg-gov/30 hover:bg-esg-gov-bg/20 transition-all">
                    {name}
                  </button>
                ))}
              </div>

              {peers.length > 0 && (
                <div className="space-y-2">
                  {peers.map(peer => (
                    <motion.div key={peer.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-esg-gov/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-esg-gov-bg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-esg-gov" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{peer.name}</div>
                        {peer.searching ? (
                          <div className="text-xs text-muted-foreground animate-pulse">正在搜索ESG信息...</div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {peer.esgPageUrl && (
                              <a href={peer.esgPageUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-esg-env-bg text-esg-env border border-esg-env-light hover:opacity-80 transition-opacity no-underline">
                                <Globe className="w-3 h-3" /> ESG官网 <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {peer.reportUrl && (
                              <a href={peer.reportUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-esg-social-bg text-esg-social border border-esg-social-light hover:opacity-80 transition-opacity no-underline">
                                <FileSpreadsheet className="w-3 h-3" /> ESG/可持续发展报告 <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removePeer(peer.id)} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {peers.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  输入同行企业名称，自动搜索其ESG官网页面和可持续发展报告
                </div>
              )}
            </motion.div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 mt-4">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>数据来源：MSCI ESG Ratings Drilldown · 仅在浏览器本地解析</div>
          <div>仅供研究参考，不构成投资建议</div>
        </div>
      </footer>
    </div>
  );
}

// ========== Sub Components ==========

function DiffBadge({ current, prior }: { current: number; prior: number }) {
  const diff = current - prior;
  if (Math.abs(diff) < 0.05) return <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="w-3 h-3" /> 不变</span>;
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-medium"><TrendingUp className="w-3 h-3" /> +{diff.toFixed(1)}</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-medium"><TrendingDown className="w-3 h-3" /> {diff.toFixed(1)}</span>;
}

function PillarSection({
  pillar, expandedIssues, toggleIssue, reportLoaded, analyzingIssue, analysisResults, onAnalyzeIssue, onExportIssue,
}: {
  pillar: PillarData;
  expandedIssues: Set<string>;
  toggleIssue: (name: string) => void;
  reportLoaded: boolean;
  analyzingIssue: string | null;
  analysisResults: Map<string, IssueAnalysisResult>;
  onAnalyzeIssue: (issue: KeyIssueData) => void;
  onExportIssue: (issue: KeyIssueData) => void;
}) {
  const cfg = pillarConfig[pillar.name];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: cfg.border }}>
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: cfg.bg }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.border, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            {cfg.label} ({pillar.name})
          </h3>
          <div className="text-xs text-muted-foreground">权重 {pillar.weight}% · 得分 {pillar.score.toFixed(1)}/10</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold" style={{ color: cfg.color, fontFamily: "var(--font-sans)" }}>{pillar.score.toFixed(1)}</div>
          <DiffBadge current={pillar.score} prior={pillar.priorScore} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {pillar.keyIssues.map((issue) => (
          <KeyIssueCard
            key={issue.name}
            issue={issue}
            pillarColor={cfg.color}
            pillarBorder={cfg.border}
            expanded={expandedIssues.has(issue.name)}
            onToggle={() => toggleIssue(issue.name)}
            reportLoaded={reportLoaded}
            analyzing={analyzingIssue === issue.name}
            analysisResult={analysisResults.get(issue.name)}
            onAnalyze={() => onAnalyzeIssue(issue)}
            onExportIssue={() => onExportIssue(issue)}
          />
        ))}
      </div>
    </div>
  );
}

function KeyIssueCard({
  issue, pillarColor, pillarBorder, expanded, onToggle,
  reportLoaded, analyzing, analysisResult, onAnalyze, onExportIssue,
}: {
  issue: KeyIssueData;
  pillarColor: string;
  pillarBorder: string;
  expanded: boolean;
  onToggle: () => void;
  reportLoaded: boolean;
  analyzing: boolean;
  analysisResult?: IssueAnalysisResult;
  onAnalyze: () => void;
  onExportIssue: () => void;
}) {
  const methodology = findIssueMethodology(issue.name);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header - clickable */}
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{issue.name}</span>
            {/* 方法学文件链接 */}
            {methodology && (
              <a href={methodology.methodologyUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors no-underline shrink-0"
                title={`查看 MSCI ${methodology.issueCN} 方法学文件`}>
                <BookOpen className="w-3 h-3" />
                方法学
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          {issue.weight > 0 && <div className="text-[11px] text-muted-foreground">权重 {issue.weight}%</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: getScoreColor(issue.score), fontFamily: "var(--font-sans)" }}>
              {issue.score.toFixed(1)}
            </div>
            <DiffBadge current={issue.score} prior={issue.priorScore} />
          </div>
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
            <div className="h-full rounded-full transition-all" style={{ width: `${(issue.score / 10) * 100}%`, backgroundColor: pillarColor }} />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Methodology Overview */}
              {methodology && (
                <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">方法学概述</span>
                    <span className="text-[10px] text-blue-500">({methodology.type === "environment" ? "环境" : methodology.type === "social" ? "社会" : "治理"}支柱)</span>
                  </div>
                  <p className="text-xs text-blue-800/80 leading-relaxed">{methodology.overview}</p>
                </div>
              )}

              {/* Score Breakdown Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {issue.exposureScore !== undefined && <ScoreCell label="风险暴露" score={issue.exposureScore} color={pillarColor} />}
                {issue.managementScore !== undefined && <ScoreCell label="管理得分" score={issue.managementScore} color={pillarColor} />}
                {issue.practicesScore !== undefined && <ScoreCell label="实践得分" score={issue.practicesScore} color={pillarColor} />}
                {issue.performanceScore !== undefined && <ScoreCell label="绩效得分" score={issue.performanceScore} color={pillarColor} />}
                {issue.controversyDeduction !== undefined && (
                  <ScoreCell label="争议扣分" score={issue.controversyDeduction} color={issue.controversyDeduction > 0 ? "#dc2626" : "#6b7280"} />
                )}
              </div>

              {/* Exposure Breakdown */}
              {(issue.businessSegmentExposure !== undefined || issue.geographicExposure !== undefined) && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">风险暴露分解</div>
                  <div className="grid grid-cols-2 gap-2">
                    {issue.businessSegmentExposure !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">业务分部暴露</span>
                        <span className="text-xs font-bold" style={{ color: getScoreColor(issue.businessSegmentExposure) }}>
                          {issue.businessSegmentExposure.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {issue.geographicExposure !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">地理暴露</span>
                        <span className="text-xs font-bold" style={{ color: getScoreColor(issue.geographicExposure) }}>
                          {issue.geographicExposure.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Practices */}
              {issue.practices.length > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    {issue.name === "Corporate Governance" || issue.name === "Corporate Behavior" ? "治理子项" : "管理实践指标"}
                  </div>
                  <div className="space-y-1.5">
                    {issue.practices.map((ind, idx) => (
                      <IndicatorRow key={idx} indicator={ind} color={pillarColor} issueName={issue.name} isPerformance={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Performance */}
              {issue.performances.length > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">绩效指标</div>
                  <div className="space-y-1.5">
                    {issue.performances.map((ind, idx) => (
                      <IndicatorRow key={idx} indicator={ind} color={pillarColor} issueName={issue.name} isPerformance={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze Button & Results */}
              {reportLoaded && (
                <div className="rounded-lg border border-esg-gov/20 bg-esg-gov-bg/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-esg-gov" />
                      <span className="text-xs font-semibold text-esg-gov">ESG 报告对照分析</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {analysisResult && (
                        <Button size="sm" variant="outline" onClick={onExportIssue}
                          className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50">
                          <Download className="w-3 h-3 mr-1" />
                          导出本议题
                        </Button>
                      )}
                      <Button size="sm" onClick={onAnalyze} disabled={analyzing}
                        className="h-7 text-xs bg-esg-gov hover:bg-esg-gov/90 text-white">
                        {analyzing ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 分析中...</>
                        ) : analysisResult ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> 重新分析</>
                        ) : (
                          <><Target className="w-3 h-3 mr-1" /> 对照分析</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Analysis Results */}
                  {analysisResult && (
                    <div className="space-y-2 mt-3">
                      {/* Overall Assessment */}
                      <div className="rounded-lg bg-white/80 border border-border p-3">
                        <div className="text-xs font-semibold text-foreground mb-1">总体评估</div>
                        <div className="text-xs text-muted-foreground leading-relaxed prose prose-xs max-w-none">
                          <Streamdown>{analysisResult.overallAssessment}</Streamdown>
                        </div>
                      </div>

                      {/* Per-Indicator Results */}
                      {analysisResult.analyses.map((a, idx) => (
                        <div key={idx} className="rounded-lg bg-white/80 border border-border p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <DisclosureStatusIcon status={a.status} />
                            <span className="text-xs font-semibold text-foreground">{a.indicatorName}</span>
                            <DisclosureStatusBadge status={a.status} />
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed">{a.summary}</div>
                          {a.source && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600">
                              <FileText className="w-3 h-3" />
                              <span>信息出处：{a.source}</span>
                            </div>
                          )}
                          {a.details && (
                            <div className="mt-1.5 text-[11px] text-muted-foreground/80 leading-relaxed border-t border-border/50 pt-1.5">
                              {a.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreCell({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color: getScoreColor(score), fontFamily: "var(--font-sans)" }}>
        {score.toFixed(1)}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// 带方法学悬浮窗的指标行
function IndicatorRow({ indicator, color, issueName, isPerformance }: {
  indicator: IndicatorData;
  color: string;
  issueName: string;
  isPerformance: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipAbove, setTooltipAbove] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 查找方法学解析数据
  const methodology = findIssueMethodology(issueName);
  let tooltipData: MethodologyTooltip | null = null;
  if (methodology) {
    const indicators = isPerformance ? methodology.performanceIndicators : methodology.managementIndicators;
    const nameLower = indicator.name.toLowerCase();
    // 1. 精确匹配key
    for (const [key, value] of Object.entries(indicators)) {
      if (key.toLowerCase() === nameLower || value.nameEN.toLowerCase() === nameLower) {
        tooltipData = value;
        break;
      }
    }
    // 2. 模糊匹配：包含关系
    if (!tooltipData) {
      for (const [key, value] of Object.entries(indicators)) {
        const keyLower = key.toLowerCase();
        const enLower = value.nameEN.toLowerCase();
        if (nameLower.includes(keyLower) || keyLower.includes(nameLower) ||
            nameLower.includes(enLower) || enLower.includes(nameLower)) {
          tooltipData = value;
          break;
        }
      }
    }
    // 3. 关键词匹配：取指标名中的关键词
    if (!tooltipData) {
      const words = nameLower.split(/\s+/).filter(w => w.length > 3);
      for (const [, value] of Object.entries(indicators)) {
        const enLower = value.nameEN.toLowerCase();
        if (words.some(w => enLower.includes(w))) {
          tooltipData = value;
          break;
        }
      }
    }
  }

  return (
    <div className="flex items-center gap-2 relative">
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <div className="text-xs text-foreground truncate" title={indicator.name}>
          {indicator.name}
        </div>
        {/* 方法学解析悬浮窗触发按钮（有数据显示蓝色，无数据显示灰色提示） */}
        <div className="relative shrink-0" ref={triggerRef}>
          <button
            className="p-0.5 rounded transition-colors"
            style={{ cursor: 'pointer' }}
            title={tooltipData ? "查看方法学解析" : "该指标在MSCI方法学PDF文档中未找到直接定义"}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(prev => !prev);
            }}
          >
            <HelpCircle className={`w-3.5 h-3.5 transition-colors ${
              tooltipData
                ? (showTooltip ? 'text-blue-600' : 'text-blue-400 hover:text-blue-600')
                : (showTooltip ? 'text-gray-400' : 'text-gray-200 hover:text-gray-400')
            }`} />
          </button>
          {/* Tooltip - rendered via Portal to avoid overflow clipping */}
          {showTooltip && createPortal(
            tooltipData
              ? <MethodologyPopover triggerRef={triggerRef} tooltipData={tooltipData} onClose={() => setShowTooltip(false)} />
              : <NoMethodologyPopover triggerRef={triggerRef} indicatorName={indicator.name} onClose={() => setShowTooltip(false)} />,
            document.body
          )}
        </div>
      </div>
      {indicator.weight > 0 && <span className="text-[10px] text-muted-foreground shrink-0">{indicator.weight}%</span>}
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${(indicator.score / 10) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold shrink-0 w-7 text-right" style={{ color: getScoreColor(indicator.score) }}>
        {indicator.score.toFixed(1)}
      </span>
    </div>
  );
}

// ========== 方法学解析弹出层（Portal渲染，避免overflow截断）==========
function MethodologyPopover({ triggerRef, tooltipData, onClose }: {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  tooltipData: MethodologyTooltip;
  onClose: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, above: false });

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < 350;
    setPos({
      top: above ? rect.top : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 340),
      above,
    });
  }, [triggerRef]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, triggerRef]);

  return (
    <div
      ref={popRef}
      className="fixed z-[9999] w-80 p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xl"
      style={{
        top: pos.above ? undefined : `${pos.top}px`,
        bottom: pos.above ? `${window.innerHeight - pos.top + 4}px` : undefined,
        left: pos.left,
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <div className="flex items-start gap-1.5 mb-2.5">
        <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-blue-700">{tooltipData.nameCN}</div>
          <div className="text-[10px] text-blue-400">{tooltipData.nameEN}</div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">方法学定义</div>
          <div className="text-[11px] text-gray-800 leading-relaxed">{tooltipData.definition}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">评分标准</div>
          <div className="text-[11px] text-gray-800 leading-relaxed">{tooltipData.scoringCriteria}</div>
        </div>
        <div className="flex items-start gap-4 pt-2 border-t border-blue-100">
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-gray-500">数据来源</div>
            <div className="text-[10px] text-gray-700">{tooltipData.dataSource}</div>
          </div>
          {tooltipData.scoreRange && (
            <div className="shrink-0">
              <div className="text-[10px] font-semibold text-gray-500">评分范围</div>
              <div className="text-[10px] text-gray-700">{tooltipData.scoreRange}</div>
            </div>
          )}
        </div>
        {!tooltipData.directlyFromMethodology && (
          <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50/50 -mx-3.5 px-3.5 pb-1 rounded-b-xl">
            <div className="flex items-center gap-1 mb-0.5">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="text-[10px] font-semibold text-amber-700">方法学来源说明</span>
            </div>
            <div className="text-[10px] text-amber-800 leading-relaxed">{tooltipData.sourceNote || '该指标未在MSCI方法学PDF中以此名称直接定义，定义基于方法学框架推断。'}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== 无方法学数据提示层（当指标在Excel中出现但方法学PDF中未找到）==========
function NoMethodologyPopover({ triggerRef, indicatorName, onClose }: {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  indicatorName: string;
  onClose: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, above: false });

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < 200;
    setPos({
      top: above ? rect.top : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 300),
      above,
    });
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, triggerRef]);

  return (
    <div
      ref={popRef}
      className="fixed z-[9999] w-72 p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xl"
      style={{
        top: pos.above ? undefined : `${pos.top}px`,
        bottom: pos.above ? `${window.innerHeight - pos.top + 4}px` : undefined,
        left: pos.left,
      }}
    >
      <div className="flex items-start gap-1.5 mb-2">
        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-gray-600">方法学文档中未找到此指标</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{indicatorName}</div>
        </div>
      </div>
      <div className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2.5">
        该指标在 MSCI 方法学 PDF 文档中未找到直接定义。可能原因包括：
        <ul className="mt-1.5 space-y-0.5 list-none">
          <li className="flex items-start gap-1"><span className="text-gray-400 shrink-0">•</span>该指标为 MSCI 内部评估维度，未在公开方法学中单独列出</li>
          <li className="flex items-start gap-1"><span className="text-gray-400 shrink-0">•</span>该指标可能是多个子指标的综合，方法学中分别定义</li>
          <li className="flex items-start gap-1"><span className="text-gray-400 shrink-0">•</span>该指标名称与方法学 PDF 中的官方名称存在差异</li>
        </ul>
      </div>
      <div className="mt-2 text-[10px] text-gray-400">建议参考 MSCI 官方方法学文档获取详细定义。</div>
    </div>
  );
}

function DisclosureStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "met": return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />;
    case "partial": return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case "not_met": return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    default: return <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
  }
}

function DisclosureStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    met: { label: "满足要求", className: "bg-green-50 text-green-700 border-green-200" },
    partial: { label: "部分满足", className: "bg-amber-50 text-amber-700 border-amber-200" },
    not_met: { label: "未满足", className: "bg-red-50 text-red-700 border-red-200" },
    not_found: { label: "未找到相关披露", className: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const c = config[status] || config.not_found;
  return <span className={`px-1.5 py-0.5 rounded text-[10px] border ${c.className}`}>{c.label}</span>;
}

// ========== 同行企业URL生成 ==========
function generateEsgPageUrl(companyName: string): string {
  const searchQuery = encodeURIComponent(`${companyName} ESG 可持续发展`);
  return `https://www.google.com/search?q=${searchQuery}+site%3A${getDomainHint(companyName)}+OR+ESG`;
}

function generateReportUrl(companyName: string): string {
  const searchQuery = encodeURIComponent(`${companyName} ESG报告 OR 可持续发展报告 OR sustainability report filetype:pdf`);
  return `https://www.google.com/search?q=${searchQuery}`;
}

function getDomainHint(name: string): string {
  const domainMap: Record<string, string> = {
    "光伏企业A": "example.com", "光伏企业B": "example.org", "光伏企业C": "example.net",
    "光伏企业D": "example.com", "光伏企业E": "example.org", "光伏企业F": "example.net",
  };
  return domainMap[name] || "";
}
