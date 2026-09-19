/*
 * Company Analysis Page - 企业ESG分析
 * 重构后工作流：
 * 1. 顶部：上传 MSCI ESG Ratings Drilldown 报告（上传后跳转对应行业分析页）
 * 2. 下方：ESG 评级量化细分分析 — 已有行业入口列表
 */
import { useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Upload, FileSpreadsheet, Building2, ChevronRight,
  Leaf, Users, Shield, ArrowRight, X, Loader2, Cpu
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { toast } from "sonner";
import { parseEsgDrilldown } from "@/lib/parseEsgExcel";

// 已支持的行业入口配置
const SUPPORTED_INDUSTRIES = [
  {
    id: "real-estate",
    name: "Real Estate Management & Development",
    nameCN: "房地产管理与开发",
    sector: "房地产",
    sectorEN: "Real Estate",
    path: "/drilldown/real-estate",
    icon: <Building2 className="w-5 h-5" />,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.06)",
    border: "rgba(37,99,235,0.18)",
    pillars: ["环境", "社会", "治理"],
    description: "涵盖绿色建筑、能源效率、社区关系、公司治理等核心ESG议题",
    // 文件名匹配关键词（用于自动识别行业）
    fileKeywords: ["cmsk", "real.estate", "realestate", "cre"],
  },
  {
    id: "solar",
    name: "Semiconductors & Semiconductor Equipment",
    nameCN: "半导体与半导体设备",
    sector: "信息技术",
    sectorEN: "Information Technology",
    path: "/drilldown/solar",
    icon: <Cpu className="w-5 h-5" />,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.06)",
    border: "rgba(22,163,74,0.18)",
    pillars: ["环境", "社会", "治理"],
    description: "涵盖清洁技术机遇、水资源压力、供应链劳工标准、争议性采购等光伏行业核心ESG议题",
    fileKeywords: ["ja", "solar", "jasolar", "jinkosolar", "longi", "trina", "canadian", "semiconductor", "jinko"],
  },
];

/**
 * 根据文件名自动识别目标行业路径
 * 若无法识别，返回 null（由用户手动选择）
 */
function detectIndustryPath(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  for (const industry of SUPPORTED_INDUSTRIES) {
    if (industry.fileKeywords.some(kw => lower.includes(kw))) {
      return industry.path;
    }
  }
  return null;
}

export default function CompanyAnalysis() {
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ buf: ArrayBuffer; name: string; company: string; b64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理上传的Drilldown Excel文件，解析后跳转到对应行业页面
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("请上传 .xlsx 或 .xls 格式的 Excel 文件");
      return;
    }
    setIsProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseEsgDrilldown(buf);

      // 将文件内容转为base64
      const uint8 = new Uint8Array(buf);
      let binary = "";
      uint8.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      // 尝试自动识别行业
      const detectedPath = detectIndustryPath(file.name);

      if (detectedPath) {
        // 自动跳转
        sessionStorage.setItem("drilldown_pending_file_name", file.name);
        sessionStorage.setItem("drilldown_pending_company", parsed.companyName || "");
        sessionStorage.setItem("drilldown_pending_file_b64", base64);
        toast.success("文件解析成功，正在跳转...");
        setTimeout(() => navigate(detectedPath), 400);
      } else {
        // 无法识别行业，让用户手动选择
        setPendingFile({ buf, name: file.name, company: parsed.companyName || "", b64: base64 });
        toast.info("请选择对应的行业分析模块");
      }
    } catch (e) {
      console.error(e);
      toast.error("文件解析失败，请确认是 MSCI ESG Ratings Drilldown 格式");
    } finally {
      setIsProcessing(false);
    }
  }, [navigate]);

  // 用户手动选择行业后跳转
  const handleIndustrySelect = useCallback((path: string) => {
    if (!pendingFile) return;
    sessionStorage.setItem("drilldown_pending_file_name", pendingFile.name);
    sessionStorage.setItem("drilldown_pending_company", pendingFile.company);
    sessionStorage.setItem("drilldown_pending_file_b64", pendingFile.b64);
    toast.success("正在跳转...");
    setTimeout(() => navigate(path), 300);
  }, [pendingFile, navigate]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

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
          <span className="text-foreground font-medium">企业ESG分析</span>
        </nav>
      </div>

      {/* Page Header */}
      <section className="container pt-2 pb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            企业 ESG 分析
          </h1>
          <p className="text-sm text-muted-foreground">
            上传 MSCI ESG Ratings Drilldown 报告，进行量化细分分析与 ESG 报告对照
          </p>
        </motion.div>
      </section>

      <section className="container pb-6">
        <Link href="/drilldowns" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 no-underline transition-colors">
          <FileSpreadsheet className="w-4 h-4" />
          已上传报告管理（Drilldown 管理）
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Upload Section */}
      <section className="container pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            上传 MSCI ESG Ratings Drilldown 报告
          </h2>

          {/* 待选择行业提示 */}
          {pendingFile && (
            <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    已解析文件：<strong>{pendingFile.name}</strong>
                  </p>
                  <p className="text-xs text-amber-700">
                    未能自动识别行业，请选择对应的分析模块：
                  </p>
                </div>
                <button onClick={() => setPendingFile(null)} className="text-amber-500 hover:text-amber-700 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUPPORTED_INDUSTRIES.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => handleIndustrySelect(ind.path)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-90"
                    style={{ borderColor: ind.border, background: ind.bg, color: ind.color }}
                  >
                    {ind.icon}
                    {ind.nameCN}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                {isProcessing
                  ? <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  : <FileSpreadsheet className="w-8 h-8 text-primary" />
                }
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {isProcessing ? "正在解析文件..." : "拖拽 Excel 文件到此处"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  或点击下方按钮选择文件
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  支持 .xlsx / .xls 格式 · 数据仅在浏览器本地解析，不会上传至服务器
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                选择文件
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              MSCI ESG Ratings Drilldown 报告可从 MSCI ESG Manager 平台导出（.xlsx 格式）。
              上传后系统将自动识别行业并跳转至对应的量化细分分析页面。
            </p>
          </div>
        </motion.div>
      </section>

      {/* Existing Industries Section */}
      <section className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            ESG 评级量化细分分析 — 已有行业
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            点击行业卡片直接进入分析页面，或上传 Drilldown 文件自动跳转
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_INDUSTRIES.map((industry, idx) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
              >
                <Link href={industry.path} className="no-underline block">
                  <div
                    className="rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer group"
                    style={{ borderColor: industry.border, background: industry.bg }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${industry.color}20`, color: industry.color }}
                      >
                        {industry.icon}
                      </div>
                      <ArrowRight
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: industry.color }}
                      />
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-0.5">{industry.sector}</div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">
                        {industry.nameCN}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{industry.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {industry.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {industry.pillars.map(p => (
                        <span
                          key={p}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${industry.color}15`, color: industry.color }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* 更多行业占位卡 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + SUPPORTED_INDUSTRIES.length * 0.05 }}
            >
              <div className="rounded-xl border border-dashed border-border p-5 flex flex-col items-center justify-center text-center min-h-[180px] opacity-60">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">更多行业</p>
                <p className="text-xs text-muted-foreground mt-1">即将支持</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
