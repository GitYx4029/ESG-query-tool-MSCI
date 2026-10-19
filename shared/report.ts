// Provider-neutral contract. Reports and excerpts are never persisted by the API.
export const REPORT_FRAMEWORK_VERSION = "disclosure-review-2026-10-v1";
export type DisclosureStatus =
  | "related"
  | "disclosed"
  | "partial"
  | "not_found"
  | "insufficient";
export interface ReportTable {
  columns: string[];
  rows: string[][];
}
export interface ReportElement {
  label: string;
  detail: string;
  page?: number;
}
export interface ReportPage {
  page: number;
  text: string;
  method: "text" | "ocr" | "unread";
  confidence?: number;
  tables?: ReportTable[];
}
export interface Evidence {
  id: string;
  page: number;
  quote: string;
  method: "text" | "ocr";
  confidence?: number;
}
export interface ReportCriterion {
  id: string;
  label: string;
  requirement: string;
  keywords: string[];
  groups?: string[][];
}
export interface ReportFinding {
  criterionId: string;
  status: DisclosureStatus;
  summary: string;
  gaps: string[];
  evidence: Evidence[];
  ai?: boolean;
  elements?: ReportElement[];
}
export interface ReviewInput {
  version: string;
  industry: string;
  issue: string;
  partialDocument: boolean;
  criteria: Array<{
    id: string;
    label: string;
    requirement: string;
    evidence: Evidence[];
  }>;
}
export interface ReviewOutput {
  version: string;
  findings: ReportFinding[];
  usage?: { inputTokens?: number; outputTokens?: number };
}
export const statusLabels: Record<DisclosureStatus, string> = {
  related: "找到相关线索",
  disclosed: "披露较充分 · AI初判",
  partial: "披露不完整 · AI初判",
  not_found: "本次未检索到",
  insufficient: "识别或依据不足",
};
const onlyKeys = (value: object, allowed: string[]) =>
  Object.keys(value).every(key => allowed.includes(key));
export function validateReviewInput(value: unknown): value is ReviewInput {
  if (!value || typeof value !== "object") return false;
  const x = value as ReviewInput;
  if (
    !onlyKeys(x, [
      "version",
      "industry",
      "issue",
      "partialDocument",
      "criteria",
    ])
  )
    return false;
  if (
    x.version !== REPORT_FRAMEWORK_VERSION ||
    typeof x.industry !== "string" ||
    x.industry.length > 120 ||
    typeof x.issue !== "string" ||
    x.issue.length > 120 ||
    typeof x.partialDocument !== "boolean" ||
    !Array.isArray(x.criteria) ||
    x.criteria.length < 1 ||
    x.criteria.length > 5
  )
    return false;
  let chars = 0;
  const ids = new Set<string>();
  for (const c of x.criteria) {
    if (
      !c ||
      typeof c.id !== "string" ||
      c.id.length > 100 ||
      ids.has(c.id) ||
      typeof c.label !== "string" ||
      c.label.length > 180 ||
      typeof c.requirement !== "string" ||
      c.requirement.length > 900 ||
      !Array.isArray(c.evidence) ||
      c.evidence.length > 4
    )
      return false;
    ids.add(c.id);
    chars += c.requirement.length;
    if (!onlyKeys(c, ["id", "label", "requirement", "evidence"])) return false;
    const evidenceIds = new Set<string>();
    for (const e of c.evidence) {
      if (
        !e ||
        typeof e.id !== "string" ||
        e.id.length > 100 ||
        !Number.isInteger(e.page) ||
        e.page < 1 ||
        e.page > 600 ||
        typeof e.quote !== "string" ||
        e.quote.length > 1200 ||
        !["text", "ocr"].includes(e.method) ||
        (e.confidence !== undefined &&
          (!Number.isFinite(e.confidence) ||
            e.confidence < 0 ||
            e.confidence > 100))
      )
        return false;
      chars += e.quote.length;
      if (
        !onlyKeys(e, ["id", "page", "quote", "method", "confidence"]) ||
        evidenceIds.has(e.id)
      )
        return false;
      evidenceIds.add(e.id);
    }
  }
  return chars <= 15_000;
}
// Validate every citation against supplied evidence; do not trust model page numbers.
export function validateReviewOutput(
  raw: unknown,
  input: ReviewInput
): ReviewOutput {
  const value = raw as {
    findings?: Array<{
      criterionId: string;
      status: string;
      summary: string;
      gaps: string[];
      citations: Array<{ id: string; quote: string }>;
    }>;
  };
  if (
    !value ||
    !Array.isArray(value.findings) ||
    value.findings.length !== input.criteria.length
  )
    throw new Error("AI返回的指标数量不完整，请重试");
  const seen = new Set<string>();
  const findings = value.findings.map(row => {
    const criterion = input.criteria.find(c => c.id === row.criterionId);
    if (
      !criterion ||
      seen.has(row.criterionId) ||
      !["disclosed", "partial", "not_found", "insufficient"].includes(
        row.status
      ) ||
      typeof row.summary !== "string" ||
      row.summary.length > 700 ||
      !Array.isArray(row.gaps) ||
      row.gaps.length > 5 ||
      row.gaps.some(g => typeof g !== "string" || g.length > 300) ||
      !Array.isArray(row.citations) ||
      row.citations.length > 4
    )
      throw new Error("AI结果格式不完整，请重试");
    seen.add(row.criterionId);
    const evidence: Evidence[] = [];
    for (const citation of row.citations) {
      const source = criterion.evidence.find(e => e.id === citation.id);
      if (
        !source ||
        typeof citation.quote !== "string" ||
        citation.quote.trim().length < 6 ||
        !source.quote.includes(citation.quote)
      )
        throw new Error("AI引用未通过原文核验，已保留本地证据");
      if (!evidence.some(e => e.id === source.id))
        evidence.push({ ...source, quote: citation.quote });
    }
    let status = row.status as DisclosureStatus;
    if (["disclosed", "partial"].includes(status) && !evidence.length)
      throw new Error("AI判断缺少可核验的原文证据");
    if (status === "not_found" && input.partialDocument)
      status = "insufficient";
    if (
      status === "disclosed" &&
      evidence.some(e => e.method === "ocr" && (e.confidence ?? 0) < 60)
    )
      status = "insufficient";
    return {
      criterionId: row.criterionId,
      status,
      summary: row.summary,
      gaps: row.gaps,
      evidence,
      ai: true,
    };
  });
  return { version: input.version, findings };
}
