import type { EvidenceContext, ReportCriterion, ReportPage } from "@shared/report";
import { normalizeText } from "./reportNormalize";
/** Use repeated, geometrically marginal text only. Repeated body disclosures stay searchable. */
export function runningText(pages: ReportPage[]) {
  const counts = new Map<string, number>();
  for (const page of pages)
    for (const text of new Set(page.marginTexts ?? []))
      counts.set(text, (counts.get(text) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n >= Math.max(3, Math.ceil(pages.length * .2))).map(([s]) => s));
}
export function sourceSegments(page: ReportPage, repeated: Set<string>) {
  // Split at observed margin coordinates. An identical phrase inside body text stays intact.
  const ranges = (page.marginRanges ?? (page.marginTexts ?? []).map(text => ({ text, start: page.text.indexOf(text), end: page.text.indexOf(text) + text.length })))
    .filter(r => r.start >= 0 && repeated.has(r.text)).sort((a, b) => a.start - b.start);
  const spans: string[] = [];
  let start = 0;
  for (const range of ranges) {
    if (range.start > start)
      spans.push(page.text.slice(start, range.start));
    start = Math.max(start, range.end);
  }
  spans.push(page.text.slice(start));
  return spans.filter(s => /[\p{L}]/u.test(s));
}
export function pageRole(text: string): "body" | "statement" | "assurance" {
  const head = normalizeText(text.slice(0, 1000));
  if (/外部鉴证声明|独立鉴证|独立核证|independent assurance|assurance statement|assurance report/.test(head))
    return "assurance";
  if (/^(?:\s|\d|[a-z])*董事长(?:寄语|致辞)|^(?:\s|\d|[a-z])*董事会声明|chairman.?s (?:message|statement)/i.test(head))
    return "statement";
  return "body";
}
export function noteContexts(page: ReportPage, repeated: Set<string>): EvidenceContext[] {
  const result: EvidenceContext[] = [];
  for (const segment of sourceSegments(page, repeated)) {
    const lines = segment.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/注[：:]|统计(?:范围|边界|口径)|核算边界|指标仅|数据(?:范围|边界)|目标供应商[：:]|范围\s*[123一二三](?:[：:]|[-–至、])|^\s*〔\d+〕/.test(normalizeText(line)))
        continue;
      let quote = line;
      while (i + 1 < lines.length && quote.length < 850 && !lines[i + 1].includes(" | ")) {
        const next = lines[i + 1];
        // Each separately defined metric starts a new note, even with blank lines between them.
        if (/^\s*[^：:]{1,110}[：:]/.test(next) && next.trim())
          break;
        quote += "\n" + lines[++i];
      }
      if (quote.trim().length > 5)
        result.push({ page: page.page, quote: quote.trim().slice(0, 1100) });
    }
  }
  return result;
}
export function relevantContexts(context: EvidenceContext[], quote: string) {
  const text = normalizeText(quote);
  const topic = /温室|碳排放|范围\s*[123一二三]/.test(text) ? /范围\s*[123一二三]|温室|排放|sbti/
    : /供应商/.test(text) ? /供应商|采购/
      : /死亡|亡故|伤害|工伤|失时|ltir|trir/.test(text) ? /员工|工时|死亡|伤害|职业|工伤|亡故/ : undefined;
  return context.filter(c => c.quote.includes(" | ") || !topic || topic.test(normalizeText(c.quote)) || /仅为|园区|统计范围|统计边界/.test(normalizeText(c.quote))).slice(0, 4);
}
/** Specific metric gates are deliberately separate from broad discovery keywords. */
export function relevantToCriterion(criterion: ReportCriterion, text: string, role: string) {
  const t = normalizeText(text);
  if (role === "assurance" && criterion.id !== "Carbon Emissions:3")
    return false;
  if (criterion.id.startsWith("Health & Safety:")) {
    if (/信息安全|网络安全|数据安全|information security|cyber/.test(t) && !/职业|工伤|安全生产|occupational|injur/.test(t))
      return false;
    if (criterion.id.endsWith(":2") && /供应商|supplier/.test(t) && !/营运场所|运营场所|自有|our operations/.test(t))
      return false;
    if (criterion.id.endsWith(":2"))
      return /iso\s*45001|安全委员会|安全审计|安全检查|职业健康|occupational|health and safety audit/.test(t);
    if (criterion.id.endsWith(":3"))
      return /零死亡|零事故|安全生产目标|事故率目标|zero fatalit|safety target|(?:职业|工伤|安全生产|occupational|injur).{0,180}(?:目标|target)|(?:目标|target).{0,180}(?:职业|工伤|安全生产|occupational|injur)/.test(t);
    if (criterion.id.endsWith(":4"))
      return /死亡|亡故|fatalit/.test(t) && !/比率|比例|死亡率|fatality rate|损失.{0,10}(?:天|日|小时)|lost (?:days|hours)/.test(t);
  }
  if (criterion.id.startsWith("Supply Chain Labor Standards:"))
    return /供应商|供应链|supplier|supply chain/.test(t) && /劳工|劳动|人权|社会责任|可持续采购|行为(?:准则|守则)|整改|labor|labour|human rights|social responsibility|supplier code|corrective action|audit/.test(t);
  return true;
}
