import { REPORT_FRAMEWORK_VERSION, statusLabels, type ReportFinding, type ReportPage } from "@shared/report";
import { criteriaForIssue } from "./reportFramework";
import { issueNamesCN } from "./esgData";
export const reviewLabels = { pending: "待复核", confirmed: "证据与要求相符", needs_more: "仍需补充证据", irrelevant: "线索不相关" };
export type ManualReview = keyof typeof reviewLabels;
export function buildReportCsv(input: {
  file: string;
  industry: string;
  results: Record<string, ReportFinding[]>;
  pages: ReportPage[];
  reviews?: Record<string, ManualReview>;
  detail?: boolean;
}) {
  const rows: string[][] = [["文件", "行业", "议题", "核验项", "核验要点", "检索结果", "摘要", "待核验", "已定位要素（自动摘录）", "人工复核", "文件页序", "原文", "来源类型", "表头与范围注释（各附页序）", "框架版本", "识别范围"]];
  const unread = input.pages.filter(p => p.method === "unread").length;
  const weak = input.pages.filter(p => p.method === "ocr" && (p.confidence ?? 0) < 60).length;
  for (const [issue, findings] of Object.entries(input.results))
    for (const f of findings) {
      const criterion = criteriaForIssue(issue).find(c => c.id === f.criterionId);
      const entries = input.detail ? (f.evidence.length ? f.evidence.map(e => [e]) : [[]]) : [f.evidence];
      for (const evidence of entries)
        rows.push([
          input.file, input.industry, issueNamesCN[issue] ?? issue, criterion?.label ?? f.criterionId, criterion?.requirement ?? "", statusLabels[f.status], f.summary, f.gaps.join("；"),
          (f.elements ?? []).filter(e => e.page).map(e => `${e.label}：${e.detail}（文件第${e.page}页）`).join("\n"), reviewLabels[input.reviews?.[f.criterionId] ?? "pending"],
          [...new Set(evidence.map(e => e.page))].join("、"), evidence.map(e => input.detail ? e.quote : `[文件第${e.page}页] ${e.quote}`).join("\n\n"), evidence.map(e => `${e.role === "table" ? "绩效表" : e.role === "case" ? "案例" : e.role === "statement" ? "声明" : e.role === "assurance" ? "鉴证" : "正文"} · ${e.method === "ocr" ? `OCR ${Math.round(e.confidence ?? 0)}%` : "PDF文字"}`).join("；"),
          [...new Set(evidence.flatMap(e => (e.context ?? []).map(c => `[文件第${c.page}页] ${c.quote}`)))].join("\n\n"), REPORT_FRAMEWORK_VERSION,
          `${input.pages.length - unread}/${input.pages.length}页已识别；${weak}页OCR可信度较低`
        ]);
    }
  const cell = (value: string) => `"${(/^[\s\uFEFF]*[=+\-@]/.test(value) || /^[\t\r]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
  return { csv: "\uFEFF" + rows.map(r => r.map(cell).join(",")).join("\r\n"), rowCount: rows.length - 1 };
}
