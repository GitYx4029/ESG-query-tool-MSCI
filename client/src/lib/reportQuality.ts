import type { ReportPage } from "@shared/report";
import { normalizeText } from "./reportNormalize";

export function textQuality(text: string) {
  const chars = text.replace(/\s/g, "").length;
  const damaged = (text.match(/[\uFFFD\uE000-\uF8FF]/g) ?? []).length;
  return {
    readable: chars >= 35 && damaged < chars * 0.1,
    needsOcr: damaged >= 2,
    damaged,
  };
}

/** Spend the automatic OCR budget on usable metrics before reference indexes. */
export function selectOcrPages(pages: ReportPage[], limit = 16) {
  return pages
    .filter(p => p.method !== "ocr" && (p.method === "unread" || p.needsOcr))
    .map(p => {
      const text = normalizeText(p.text);
      const performance =
        /指标名称|performance (?:data|table)/.test(text) ||
        (/单位/.test(text) && /绩效表|关键绩效/.test(text));
      const safety = /工伤死亡|死亡数量|职业健康与安全|损工事故/.test(text);
      const supplier = /商业合作伙伴行为准则|供应商.*(?:人权|劳工|整改)/.test(
        text
      );
      const reference =
        /gri|对照|索引|披露项|披露位置|自律监管指引|[23]-\d/.test(text);
      return {
        page: p.page,
        score:
          (performance ? 100 : 0) +
          (safety ? 45 : 0) +
          (/商业合作伙伴行为准则/.test(text) ? 60 : supplier ? 25 : 0) +
          (p.method === "unread" ? 10 : 0) -
          (reference ? 150 : 0),
      };
    })
    .sort((a, b) => b.score - a.score || a.page - b.page)
    .slice(0, limit)
    .map(p => p.page);
}
