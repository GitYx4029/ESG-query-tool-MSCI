import type { Evidence, EvidenceContext, ReportFinding } from "@shared/report";

const structured = (line: string) =>
  /\s\|\s|^\s*(?:[•●▪◆]|[-—–]\s|\d+[.、)）]|[（(][一二三四五六七八九十\d]+[)）])/.test(
    line
  );
const numericLine = (line: string) =>
  /^[\d,.%％+−/\s]+(?:人|吨|件|次|小时|万元|万|年)?$/.test(line);
const joinLine = (a: string, b: string) =>
  a +
  (/[\p{Script=Han}，、：（(]$/u.test(a) &&
  /^[\p{Script=Han}，。；、！？）)]/u.test(b)
    ? ""
    : " ") +
  b;

/** Display-only reflow. Never pass this string to citation validation. */
export function readableExcerpt(text: string, role?: Evidence["role"]) {
  if (role === "table" || text.includes(" | ")) return text.trim();
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map(s => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim())
    .filter(Boolean);
  const paragraphs: string[] = [];
  for (const line of lines) {
    const previous = paragraphs.at(-1);
    if (
      !previous ||
      structured(line) ||
      structured(previous) ||
      numericLine(line) ||
      numericLine(previous) ||
      /[。！？!?；;：:]$/.test(previous)
    )
      paragraphs.push(line);
    else paragraphs[paragraphs.length - 1] = joinLine(previous, line);
  }
  return paragraphs.join("\n\n");
}
export function uniqueContexts(
  evidence: Evidence[]
): Array<{ context: EvidenceContext; source: Evidence }> {
  const seen = new Set<string>();
  return evidence.flatMap(source =>
    (source.context ?? []).flatMap(context => {
      const key = `${context.page}:${context.quote}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ context, source }];
    })
  );
}
export type ResultFilter = "all" | "found" | "missing" | "pending";
export function matchesResultFilter(
  finding: ReportFinding,
  filter: ResultFilter,
  review = "pending"
) {
  return (
    filter === "all" ||
    (filter === "found" && finding.evidence.length > 0) ||
    (filter === "missing" && finding.evidence.length === 0) ||
    (filter === "pending" && review !== "confirmed" && review !== "irrelevant")
  );
}
