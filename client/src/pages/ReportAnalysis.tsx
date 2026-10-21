import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/Header";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import ReportResults from "@/components/ReportResults";
import { EvidenceCard } from "@/components/ReportEvidence";
import { readableExcerpt } from "@/lib/reportPresentation";
import { getAllIndustries, industryNamesCN, issueNamesCN } from "@/lib/esgData";
import { buildReportCsv, type ManualReview } from "@/lib/reportExport";
import {
  analyzeLocally,
  buildEvidenceIndex,
  createDemoReport,
  findEvidence,
  identifyIndustries,
  makeReviewInput,
} from "@/lib/reportEngine";
import {
  extractReport,
  validateReportFiles,
  type ExtractionSession,
  type ExtractionProgress,
} from "@/lib/reportExtraction";
import { selectOcrPages } from "@/lib/reportQuality";
import { defaultCommunityOrigin } from "@/lib/backendConfig";
import {
  REPORT_FRAMEWORK_VERSION,
  validateReviewOutput,
  type Evidence,
  type ReportPage,
  type ReportFinding,
} from "@shared/report";
const apiOrigin = (
  import.meta.env.VITE_REPORT_API_ORIGIN || defaultCommunityOrigin
).replace(/\/+$/, "");
export default function ReportAnalysis() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [demo, setDemo] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [error, setError] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reviews, setReviews] = useState<Record<string, ManualReview>>({});
  const [results, setResults] = useState<Record<string, ReportFinding[]>>({});
  const [aiReady, setAiReady] = useState(false);
  const [aiIssue, setAiIssue] = useState<string | null>(null);
  const [aiError, setAiError] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [searchDone, setSearchDone] = useState("");
  const [viewer, setViewer] = useState<{
    evidence: Evidence;
    url: string;
  } | null>(null);
  const [ocrRange, setOcrRange] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const session = useRef<ExtractionSession | null>(null);
  const revision = useRef(0);
  const aiCache = useRef(new Map<string, ReportFinding[]>());
  const industry = getAllIndustries().find(i => i.name === industryName);
  const index = useMemo(() => buildEvidenceIndex(pages), [pages]);
  const candidates = useMemo(() => identifyIndustries(pages), [pages]);
  const unread = pages.filter(p => p.method === "unread");
  const damaged = pages.filter(p => p.needsOcr);
  const weak = pages.filter(
    p => p.method === "ocr" && (p.confidence ?? 0) < 60
  );
  const searchHits = useMemo(
    () =>
      searchDone
        ? findEvidence(
            index,
            {
              id: "manual",
              label: "搜索",
              requirement: "",
              keywords: [searchDone],
            },
            10
          )
        : [],
    [index, searchDone]
  );
  useEffect(() => {
    const abort = new AbortController();
    fetch(`${apiOrigin}/api/report/health`, { signal: abort.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setAiReady(data?.available === true))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(
    () => () => {
      controller.current?.abort();
      void session.current?.dispose();
    },
    []
  );
  useEffect(
    () => () => {
      if (viewer) URL.revokeObjectURL(viewer.url);
    },
    [viewer]
  );
  function resetFindings() {
    setConfirmed(false);
    setReviews({});
    setResults({});
    setAiError({});
    setSearchDone("");
    aiCache.current.clear();
    revision.current++;
  }
  async function startFiles(next: File[]) {
    try {
      validateReportFiles(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件格式不支持");
      return;
    }
    controller.current?.abort();
    await session.current?.dispose();
    session.current = null;
    const abort = new AbortController();
    controller.current = abort;
    resetFindings();
    setIndustryName("");
    setPages([]);
    setFiles(next);
    setDemo(false);
    setError("");
    setViewer(null);
    setProgress({ message: "正在读取报告…", current: 0, total: 1 });
    try {
      const current = await extractReport(next, abort.signal, setProgress);
      session.current = current;
      setPages([...current.pages]);
      const scans = selectOcrPages(current.pages);
      if (scans.length) {
        try {
          await current.ocr(scans, abort.signal, setProgress);
        } catch (e) {
          if (abort.signal.aborted) throw e;
          setError(
            "文字提取已完成，但OCR未完成。可以重试未识别页面。" +
              (e instanceof Error ? ` ${e.message}` : "")
          );
        }
      }
      setPages([...current.pages]);
      setIndustryName(
        identifyIndustries(current.pages)[0]?.industry.name ?? ""
      );
    } catch (e) {
      const partial = session.current?.pages ?? [];
      if (partial.some(p => p.method !== "unread")) {
        setPages([...partial]);
        setIndustryName(identifyIndustries(partial)[0]?.industry.name ?? "");
      }
      setError(
        abort.signal.aborted
          ? partial.some(p => p.method !== "unread")
            ? "识别已取消；已识别的页面仍可分析。"
            : "识别已取消，可以重新选择报告。"
          : e instanceof Error
            ? e.message
            : "报告读取失败，请检查文件或重试。"
      );
    } finally {
      if (controller.current === abort) {
        setProgress(null);
        controller.current = null;
      }
    }
  }
  async function continueOcr() {
    if (!session.current) return;
    let numbers = selectOcrPages(pages, 20);
    if (ocrRange.trim()) {
      const found = new Set<number>();
      for (const part of ocrRange.split(/[，,]/)) {
        const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) {
          setError("页码示例：1-5,8。请使用文件页序，每批最多20页。");
          return;
        }
        const a = Number(match[1]),
          b = Number(match[2] ?? a);
        if (a < 1 || b < a || b > pages.length || b - a > 19) {
          setError("页码超出报告范围，或单个范围超过20页。");
          return;
        }
        for (let n = a; n <= b; n++) found.add(n);
      }
      numbers = Array.from(found);
    }
    if (!numbers.length || numbers.length > 20) {
      setError("每批请选择1至20页。");
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setError("");
    try {
      await session.current.ocr(numbers, abort.signal, setProgress);
    } catch (e) {
      setError(
        abort.signal.aborted
          ? "OCR已取消，已完成页面已保留。"
          : e instanceof Error
            ? e.message
            : "OCR失败，请重试。"
      );
    } finally {
      setPages([...session.current.pages]);
      resetFindings();
      setOcrRange("");
      setProgress(null);
      controller.current = null;
    }
  }
  function runLocal() {
    if (!industry) return;
    const next: Record<string, ReportFinding[]> = {};
    for (const issue of industry.keyIssues)
      next[issue.name] = analyzeLocally(index, pages, issue.name);
    setResults(next);
    setConfirmed(true);
    setAiError({});
  }
  async function runAI(issue: string) {
    if (!industry || !aiReady) return;
    const local = results[issue];
    const key = `${revision.current}:${industry.name}:${issue}:${REPORT_FRAMEWORK_VERSION}`;
    const cached = aiCache.current.get(key);
    if (cached) {
      setResults(prev => ({ ...prev, [issue]: cached }));
      return;
    }
    const input = makeReviewInput(industry.name, issue, local, pages);
    const abort = new AbortController();
    controller.current = abort;
    setAiIssue(issue);
    setAiError(prev => ({ ...prev, [issue]: "" }));
    const timer = setTimeout(() => abort.abort(), 40_000);
    try {
      const response = await fetch(`${apiOrigin}/api/report/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI服务暂不可用");
      const verified = validateReviewOutput(body, input).findings.map(f => {
        const original = local.find(l => l.criterionId === f.criterionId);
        return {
          ...f,
          elements: original?.elements,
          evidence: f.evidence.map(e => {
            const source = original?.evidence.find(s => s.id === e.id);
            return { ...e, role: source?.role, context: source?.context };
          }),
        };
      });
      // Runtime returns canonical evidence; reconstruct the same validator payload.
      aiCache.current.set(key, verified);
      setResults(prev => ({ ...prev, [issue]: verified }));
    } catch (e) {
      setAiError(prev => ({
        ...prev,
        [issue]: abort.signal.aborted
          ? "AI精读已取消或超时，本地结果已保留。"
          : e instanceof Error
            ? e.message
            : "AI精读失败，本地结果已保留。",
      }));
    } finally {
      clearTimeout(timer);
      setAiIssue(null);
      controller.current = null;
    }
  }
  function openEvidence(evidence: Evidence) {
    if (demo || !files.length) {
      setViewer({ evidence, url: "" });
      return;
    }
    const source = /\.pdf$/i.test(files[0].name)
      ? files[0]
      : files[evidence.page - 1];
    setViewer({ evidence, url: URL.createObjectURL(source) });
  }
  function exportCsv(detail = false) {
    const { csv } = buildReportCsv({
      file: demo ? "虚构演示" : files.map(f => f.name).join(" / "),
      industry: industryNamesCN[industryName] ?? industryName,
      results,
      pages,
      reviews,
      detail,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = detail ? "ESG报告证据明细.csv" : "ESG报告披露对照.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const allFindings = Object.values(results).flat();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-7 space-y-6">
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/">首页</Link>
          <ChevronRight size={14} />
          <span>报告对照分析</span>
        </nav>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ESG 报告对照分析</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            上传企业报告，识别行业，对照 MSCI
            相关议题查找披露证据。无需评分文件或管理员密码。
          </p>
        </div>
        <ol
          className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"
          aria-label="分析流程"
        >
          {["上传报告", "识别文字", "确认行业", "披露对照"].map((label, n) => (
            <li
              key={label}
              className={`rounded-lg border px-3 py-2 ${(n === 0 && !pages.length) || (n === 1 && progress) || (n === 2 && pages.length && !confirmed) || (n === 3 && confirmed) ? "bg-blue-50 border-blue-300 text-blue-800" : "text-muted-foreground"}`}
            >
              {n + 1} · {label}
            </li>
          ))}
        </ol>
        <section
          className={`rounded-xl border-2 border-dashed p-5 bg-white ${drag ? "border-blue-500" : "border-slate-200"}`}
          onDragOver={e => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault();
            setDrag(false);
            if (!progress && !aiIssue)
              void startFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Upload className="text-blue-700" size={24} />
            <div className="flex-1 min-w-48">
              <h2 className="font-semibold">1 · 上传一份报告</h2>
              <p className="text-sm text-muted-foreground mt-1">
                PDF
                最大80MB；PNG／JPG／WebP单张最大20MB。多张图片按选择顺序作为页序，最多20张。
              </p>
            </div>
            <label
              className={`rounded-lg bg-blue-700 text-white px-4 py-3 text-sm font-medium cursor-pointer ${progress || aiIssue ? "opacity-50 pointer-events-none" : ""}`}
            >
              选择报告
              <input
                ref={input}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                disabled={Boolean(progress || aiIssue)}
                className="sr-only"
                onChange={e => {
                  if (e.target.files?.length)
                    void startFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="border rounded-lg px-4 py-3 text-sm"
              disabled={Boolean(progress || aiIssue)}
              onClick={() => {
                void session.current?.dispose();
                session.current = null;
                resetFindings();
                setFiles([]);
                setDemo(true);
                setViewer(null);
                setError("");
                setPages(createDemoReport());
                setIndustryName("Real Estate Management & Development");
              }}
            >
              试用示例
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            文字提取和图片识别在当前浏览器完成，文件不上传。图片识别首次需加载引擎；可随时取消。
          </p>
          {(files.length > 0 || demo) && (
            <p className="mt-3 text-sm break-all flex gap-2">
              <FileText size={16} />
              {demo
                ? "虚构示例公司报告 · 3页"
                : files.map(f => f.name).join(" / ")}
            </p>
          )}
        </section>
        {progress && (
          <div className="border rounded-xl p-4 space-y-3" role="status">
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span className="flex-1 text-sm">{progress.message}</span>
              <button
                className="border rounded-lg px-3 py-2 text-sm"
                onClick={() => controller.current?.abort()}
              >
                取消识别
              </button>
            </div>
            <progress
              className="w-full h-2"
              value={progress.current}
              max={progress.total}
            />
          </div>
        )}
        {error && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        {pages.length > 0 && !progress && (
          <>
            <section className="rounded-xl border bg-white p-5 space-y-3">
              <h2 className="font-semibold">2 · 识别范围</h2>
              <p className="text-sm">
                共 {pages.length} 页 · 已提取文字{" "}
                {pages.filter(p => p.method === "text").length} 页 · OCR已识别{" "}
                {pages.filter(p => p.method === "ocr").length} 页 · 未识别{" "}
                {unread.length} 页
                {weak.length > 0 ? ` · ${weak.length}页OCR可信度较低` : ""}
              </p>
              {damaged.length > 0 && (
                <p className="text-sm text-amber-800">
                  另有{damaged.length}
                  页文字层含乱码，建议补充图片识别后核验数字。
                </p>
              )}
              {unread.length > 0 && (
                <p className="text-sm text-amber-800">
                  未识别页：
                  {unread
                    .slice(0, 30)
                    .map(p => p.page)
                    .join("、")}
                  {unread.length > 30 ? "…" : ""}。当前结果仅覆盖已识别页面。
                </p>
              )}
              {session.current && (
                <details>
                  <summary className="text-sm cursor-pointer text-blue-800">
                    补充或重试图片识别
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <label className="text-sm flex-1 min-w-52">
                      文件页序
                      <input
                        value={ocrRange}
                        onChange={e => setOcrRange(e.target.value)}
                        placeholder="例如 1-5,8；留空优先处理下20个待补识别页"
                        className="block w-full border rounded-lg p-2 mt-1"
                      />
                    </label>
                    <button
                      className="border rounded-lg px-4 py-2 self-end text-sm"
                      disabled={Boolean(aiIssue)}
                      onClick={() => void continueOcr()}
                    >
                      识别所选页面
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    每批最多20页。完成后请重新确认行业与对照结果。
                  </p>
                </details>
              )}
            </section>
            <section className="rounded-xl border bg-white p-5 space-y-4">
              <div>
                <h2 className="font-semibold">3 · 确认企业行业</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  候选基于报告中的业务描述，不代表 MSCI
                  官方分类。多元业务企业可切换行业重新对照。
                </p>
              </div>
              {candidates.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-3">
                  {candidates.map(c => (
                    <div
                      key={c.industry.name}
                      className={`border rounded-lg p-3 ${industryName === c.industry.name ? "border-blue-400 bg-blue-50/40" : ""}`}
                    >
                      <button
                        disabled={Boolean(aiIssue)}
                        className="text-sm font-semibold text-left"
                        onClick={() => {
                          setReviews({});
                          setIndustryName(c.industry.name);
                          setConfirmed(false);
                          setResults({});
                        }}
                      >
                        {industryNamesCN[c.industry.name]}{" "}
                        <span className="text-xs font-normal">
                          · 依据{c.strength}
                        </span>
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        匹配：{c.matched.join("、")} · 第{c.evidence.page}页
                      </p>
                      <button
                        className="text-xs text-blue-800 underline mt-2"
                        onClick={() => openEvidence(c.evidence)}
                      >
                        查看行业判断原文
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-800">
                  未找到足够明确的业务描述，请手动选择行业。
                </p>
              )}
              <div className="flex flex-wrap gap-3 items-end">
                <label className="text-sm flex-1 min-w-60">
                  行业
                  <select
                    aria-label="选择企业行业"
                    value={industryName}
                    disabled={Boolean(aiIssue)}
                    onChange={e => {
                      setReviews({});
                      setIndustryName(e.target.value);
                      setConfirmed(false);
                      setResults({});
                      setAiError({});
                    }}
                    className="block w-full border rounded-lg p-3 mt-1 bg-white"
                  >
                    <option value="">请选择行业</option>
                    {getAllIndustries().map(i => (
                      <option key={i.name} value={i.name}>
                        {industryNamesCN[i.name]} · {i.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="rounded-lg bg-blue-700 text-white px-4 py-3 text-sm font-medium disabled:opacity-40"
                  disabled={!industry || Boolean(aiIssue)}
                  onClick={runLocal}
                >
                  {confirmed ? "重新对照" : "确认行业并开始对照"}
                </button>
              </div>
            </section>
          </>
        )}
        {confirmed && industry && (
          <section className="space-y-4" aria-label="披露对照结果">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold">4 · 披露对照结果</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {industryNamesCN[industry.name]} · {industry.keyIssues.length}{" "}
                  个议题 · {allFindings.filter(f => f.evidence.length).length}/
                  {allFindings.length} 项找到相关线索
                </p>
              </div>
              <button
                onClick={() => exportCsv()}
                className="border rounded-lg px-3 py-2 text-sm flex gap-2 items-center"
              >
                <Download size={16} />
                导出核验摘要 CSV
              </button>
            </div>
            <button
              className="text-sm text-muted-foreground underline"
              onClick={() => exportCsv(true)}
            >
              导出逐条证据明细 CSV
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed">
              本工具按 MSCI
              议题组织披露核验项，核验清单为项目整理。找到线索不等于充分披露，不生成评级或评分。页码使用文件页序；年报、治理报告等资料可能需要另行补充。
            </p>
            <form
              className="flex gap-2"
              onSubmit={e => {
                e.preventDefault();
                setSearchDone(query.trim());
              }}
            >
              <label className="flex-1 relative">
                <Search
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={16}
                />
                <input
                  aria-label="补充检索报告原文"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="没找到？补充关键词检索原文，例如 LTIR、承包商"
                  className="border rounded-lg w-full pl-9 pr-3 py-2.5 text-sm"
                />
              </label>
              <button className="border rounded-lg px-4 text-sm">检索</button>
            </form>
            {searchDone && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>
                    “{searchDone}” ·{" "}
                    {searchHits.length
                      ? `最多展示${searchHits.length}段证据`
                      : "本次未检索到"}
                  </span>
                  <button
                    aria-label="关闭补充检索"
                    onClick={() => {
                      setSearchDone("");
                      setQuery("");
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                {searchHits.map(e => (
                  <EvidenceCard key={e.id} evidence={e} open={openEvidence} />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {aiReady
                ? "AI精读仅发送当前议题的相关原文片段至模型服务；点击后开始，同一报告同一议题可复用结果。"
                : "AI精读尚未启用；本地报告识别、证据对照与导出可正常使用。"}
            </p>
            <ReportResults
              industry={industry}
              results={results}
              reviews={reviews}
              onReview={(id, value) =>
                setReviews(previous => ({ ...previous, [id]: value }))
              }
              open={openEvidence}
              aiReady={aiReady}
              aiIssue={aiIssue}
              aiError={aiError}
              onAi={issue => void runAI(issue)}
              cancelAi={() => controller.current?.abort()}
            />
            <FeedbackPrompt industry={industry.name} />
          </section>
        )}
        {viewer && (
          <div
            className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-3"
            role="dialog"
            aria-modal="true"
            aria-label="查看报告原文"
          >
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">
                  报告第{viewer.evidence.page}页 · 文件页序
                </h2>
                <button
                  className="p-2"
                  aria-label="关闭原文预览"
                  onClick={() => setViewer(null)}
                >
                  <X />
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap bg-slate-50 border rounded-lg p-3 leading-relaxed">
                {readableExcerpt(viewer.evidence.quote, viewer.evidence.role)}
              </p>
              {viewer.url &&
                (/\.pdf$/i.test(files[0]?.name ?? "") ? (
                  <>
                    <a
                      href={`${viewer.url}#page=${viewer.evidence.page}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-800 underline"
                    >
                      在新窗口查看PDF原页
                    </a>
                    <iframe
                      title="报告原页"
                      src={`${viewer.url}#page=${viewer.evidence.page}`}
                      className="w-full h-[55vh] border rounded-lg"
                    />
                  </>
                ) : (
                  <img
                    alt={`报告第${viewer.evidence.page}页原图`}
                    src={viewer.url}
                    className="max-w-full mx-auto"
                  />
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
