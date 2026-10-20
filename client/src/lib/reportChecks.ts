import type { Evidence, ReportCriterion, ReportElement, ReportPage } from "@shared/report";
import { normalizeText } from "./reportNormalize";
type Row = {
  page: number;
  label: string;
  year: string;
  unit: string;
  value: string;
  quote: string;
};
// A malformed source number is preserved verbatim and flagged; never silently repaired.
const validNumber = (value: string) => /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?\s*%?[＊*†‡¹²³⁴⁵⁶⁷⁸⁹]*$/.test(value);
export function checkElements(criterion: ReportCriterion, pages: ReportPage[], evidence: Evidence[] = []): ReportElement[] {
  const rows: Row[] = [];
  for (const page of pages)
    for (const table of page.tables ?? []) {
      const year = table.columns.map((s, i) => ({ s, i, y: parseInt(s.match(/20\d{2}/)?.[0] ?? "0") })).filter(x => x.y > 0).sort((a, b) => b.y - a.y)[0];
      if (!year)
        continue;
      for (const row of table.rows)
        if (row[year.i] !== undefined)
          rows.push({ page: page.page, label: row[0], unit: row[1], year: year.s, value: row[year.i], quote: row.join(" | ") });
    }
  const describe = (label: string, matches: Row[]): ReportElement => {
    const usable = matches.filter(r => validNumber(r.value));
    if (!usable.length)
      return { label, detail: "本次未定位到可对应年度、单位和统计对象的表格数据。" };
    const best = usable.sort((a, b) => parseInt(b.year) - parseInt(a.year) || Number(!evidence.some(e => e.page === a.page && e.quote === a.quote)) - Number(!evidence.some(e => e.page === b.page && e.quote === b.quote)) || b.page - a.page)[0];
    const other = usable.filter(r => usable.some(x => x.year.replace(/\s/g, "") === r.year.replace(/\s/g, "") && normalizeText(x.label) === normalizeText(r.label) && x.unit === r.unit && x.value !== r.value));
    return { label, detail: `${best.year}：${best.value} ${best.unit}；原指标“${best.label}”${other.length ? "。另有不同值，须分别核对对象与边界" : "。统计对象及因工口径需查原文"}`, page: best.page };
  };
  if (criterion.id === "Health & Safety:4") {
    const death = rows.filter(r => /死亡|亡故|殉职|fatalit/.test(normalizeText(r.label)) && !/比率|比例|死亡率|损失|天数|小时|rate|lost/.test(normalizeText(r.label)) && /^(?:人|人数|名|people|persons?|number|no\.?|count)$/i.test(r.unit.trim()));
    const contractor = death.filter(r => /承包|外包|contractor/.test(normalizeText(r.label)));
    const employee = death.filter(r => !contractor.includes(r) && /员工|职工|employee/.test(normalizeText(r.label)));
    const general = death.filter(r => !employee.includes(r) && !contractor.includes(r));
    return [describe("员工死亡人数", employee), describe("承包商／外包人员死亡人数（按原称谓）", contractor), ...(general.length ? [describe("未明确统计对象的死亡数据", general)] : [])];
  }
  if (criterion.id === "Health & Safety:5") {
    const rate = rows.filter(r => /\blti(?:f)?r\b|\btri(?:f)?r\b|伤害频率|损失率|事故率|工伤率|injury rate/i.test(normalizeText(r.label)) && /工时|工作小时|hours?|%|‰|次\/|件\//i.test(r.unit));
    return [describe("LTIR / LTIFR", rate.filter(r => /\blti(?:f)?r\b/i.test(r.label))), describe("TRIR / TRIFR", rate.filter(r => /\btri(?:f)?r\b/i.test(r.label))), describe("其他伤害频率／事故率（保留原口径）", rate.filter(r => !/\b(?:lti|tri)(?:f)?r\b/i.test(r.label)))];
  }
  return evidence.flatMap(e => {
    const row = rows.find(r => r.page === e.page && r.quote === e.quote);
    if (!row)
      return [];
    return [{ label: row.label, detail: `${row.year}：${row.value} ${row.unit}${validNumber(row.value) ? "；按原指标口径摘录" : "；原文数字格式异常或含缺失标记，需核对，未作数值换算"}`, page: row.page }];
  });
}
export function reviewGaps(c: ReportCriterion, evidence: Evidence[], elements: ReportElement[]) {
  if (!evidence.length)
    return ["尚无可用证据；建议查看相关章节或补充年报等资料。"];
  const text = normalizeText(evidence.map(e => e.quote + "\n" + (e.context ?? []).map(c => c.quote).join("\n")).join("\n"));
  if (c.id === "Carbon Emissions:1")
    return [!/(?:范围\s*[1一]|scope\s*1)/.test(text) ? "未定位范围一" : "", !/(?:范围\s*[2二]|scope\s*2)/.test(text) ? "未定位范围二" : "", !/(?:范围\s*[3三]|scope\s*3)/.test(text) ? "未定位范围三" : "", evidence.some(e => (e.context ?? []).some(c => /仅为|园区/.test(c.quote))) ? "同时列有园区数据；核对组织边界、抵消及范围二方法，不同范围不能合并。" : "核对组织边界、抵消及范围二方法；不同范围数据不能直接合并。"].filter(Boolean);
  if (c.id === "Health & Safety:4")
    return [elements.some(e => !e.page) ? "部分人员类别未取得表格数据。" : "", "核对因工定义；外包员工不自动代表全部承包商。"].filter(Boolean);
  if (c.id === "Health & Safety:5")
    return [elements.some(e => /不同值/.test(e.detail)) ? "原文同年伤害频率存在不同值或脚注混入，须回查原页核实。" : "", "核对工时分母、人员范围与计算定义；未明确命名的频率不改称LTIR或TRIR。"].filter(Boolean);
  if (c.id === "Supply Chain Labor Standards:3")
    return [!/整改|关闭|corrective/.test(text) ? "已找到审核／评估覆盖线索，整改结果与关闭证据仍待核验。" : "已找到整改安排线索，实际问题、完成情况与关闭结果仍待核验。", "核对目标供应商分母，不能推及全部供应商。"];
  if (c.id.startsWith("Supply Chain Labor Standards:"))
    return ["核对劳工与人权条款、目标供应商定义和实际执行范围。"];
  if (evidence.some(e => e.role === "case"))
    return ["包含场所案例；核对整体运营覆盖、标准及有效期。"];
  if (evidence.every(e => e.role === "statement"))
    return ["目前仅有声明线索，仍需正文中的制度、执行或绩效证据。"];
  if (evidence.some(e => (e.context ?? []).some(c => /仅为|园区/.test(c.quote))))
    return ["包含局部场所数据，需核对整体运营覆盖范围。"];
  return ["核对原文的适用范围、年度及执行依据。"];
}
export function findingSummary(evidence: Evidence[], elements: ReportElement[], criterion?: ReportCriterion) {
  const located = elements.filter(e => e.page);
  if (located.length)
    return located.slice(0, 3).map(e => `${e.label}：${e.detail.split("；")[0]}${/异常|不同值/.test(e.detail) ? "（数值待核实）" : ""}（第${e.page}页）`).join("；");
  if (!evidence.length)
    return "本次未定位到符合检索条件的原文。";
  const source = evidence[0];
  const sentences = source.quote.split(/(?<=。|；)/).map(s => s.trim()).filter(s => s.length >= 12);
  const terms = criterion?.keywords.map(normalizeText) ?? [];
  const score = (s: string) => terms.filter(t => normalizeText(s).includes(t)).length;
  const best = sentences.sort((a, b) => score(b) - score(a))[0] ?? source.quote;
  const excerpt = best.replace(/\s+/g, " ");
  return `原文线索：${excerpt.slice(0, 140)}${excerpt.length > 140 ? "…" : ""}（文件第${source.page}页）`;
}
