import { describe, it, expect } from "vitest";
import { analyzeLocally, buildEvidenceIndex, makeReviewInput, identifyIndustries } from "./reportEngine";
import { buildReportCsv } from "./reportExport";
import { textFromPdfItems, type PdfTextItem } from "./reportText";
import { validateReviewInput, type ReportPage } from "@shared/report";
const tablePage = (page: number, rows: string[][], note = ""): ReportPage => ({ page, method: "text", tables: [{ columns: ["指标", "单位", "2023 年", "2024 年", "2025 年"], rows }], text: note + "\n\n" + ["指标 | 单位 | 2023 年 | 2024 年 | 2025 年", ...rows.map(r => r.join(" | "))].join("\n") });
const find = (pages: ReportPage[], issue: string, n: number) => analyzeLocally(buildEvidenceIndex(pages), pages, issue)[n - 1];
describe("report relevance and boundary regressions", () => {
  it("filters spaced contents, recurring margins and assurance without dropping body evidence", () => {
    const nav = "董事长寄语 公司治理";
    const pages: ReportPage[] = [{ page: 1, method: "text", text: "目 录\n职业健康 80\n供应链 90" }, ...Array.from({ length: 3 }, (_, i) => ({ page: i + 2, method: "text" as const, text: nav + "\n公司通过职业健康安全管理体系 ISO45001 认证。公司治理由董事会监督。", marginTexts: [nav] })), { page: 5, method: "text", text: "外部鉴证声明\n本鉴证机构独立于公司，无关联交易及控制权关系。" }];
    const index = buildEvidenceIndex(pages);
    expect(index.every(b => b.page.page !== 1)).toBe(true);
    expect(find(pages, "Health & Safety", 2).evidence.every(e => !e.quote.includes(nav))).toBe(true);
    expect(find(pages, "Ownership & Control", 3).evidence).toHaveLength(0);
    expect(find(pages, "Health & Safety", 2).evidence.length).toBeGreaterThan(0);
    expect(index.some(b => b.quote.includes("公司治理由董事会监督"))).toBe(true);
  });
  it("does not treat cyber goals, zero-carbon certification, supplier certificates or lost days as own safety metrics", () => {
    const pages = [tablePage(1, [["因工伤、死亡和健康状况不佳而损失的天数", "天", "0", "0", "0"], ["供应商通过 ISO 45001 认证数量", "个", "0", "0", "459"]]), { page: 2, method: "text" as const, text: "信息安全管理：信息安全目标为零事故。零碳工厂认证已完成。" }];
    expect(find(pages, "Health & Safety", 2).evidence).toHaveLength(0);
    expect(find(pages, "Health & Safety", 3).evidence).toHaveLength(0);
    expect(find(pages, "Health & Safety", 4).elements?.some(e => e.page)).toBe(false);
  });
  it("keeps employee and outsourced mortality labels, zero values, year and person unit", () => {
    const pages = [tablePage(127, [["内部员工死亡人数", "人", "0", "0", "0"], ["外包员工死亡人数", "人", "-", "-", "0"], ["因公亡故比率", "%", "0", "0", "0"]])];
    const f = find(pages, "Health & Safety", 4);
    expect(f.elements?.[0].detail).toContain("2025 年：0 人");
    expect(f.elements?.[1].detail).toContain("外包员工死亡人数");
    expect(f.evidence.every(e => !e.quote.includes("比率"))).toBe(true);
    expect(f.gaps.join("")).toContain("不自动代表全部承包商");
  });
  it("finds injury frequency without relabeling it and flags different source values", () => {
    const pages = [tablePage(84, [["百万工时损失率", "次 / 百万工时", "-", "-", "0.115"]]), tablePage(123, [["百万工时损失率", "次 / 百万工时", "-", "-", "0.11"]]), tablePage(127, [["内部每百万工作小时伤害频率", "工伤事故次数 / 百万工作小时", "-", "0.10", "0.11"]])];
    const f = find(pages, "Health & Safety", 5);
    expect(f.evidence.length).toBeGreaterThan(0);
    expect(f.elements?.[0].page).toBeUndefined();
    expect(f.elements?.[2].detail).toContain("不同值");
    expect(f.gaps.join("")).toContain("不同值");
  });
  it("covers all emission scopes, keeps local boundary notes and preserves malformed numbers", () => {
    const pages = [tablePage(50, [["范围 1 碳排放", "吨", "292.47", "520.60", "497.10"], ["拥有 ISO 45001 认证的营运场所所占百分比", "%", "100", "100", "100"]], "注：如上表格指标仅为某园区。"), tablePage(128, [["总直接温室气体排放（范围 1）", "吨二氧化碳当量", "4,652.59", "4,638.01", "4,690.22"], ["基于位置（范围 2）", "吨二氧化碳当量", "50,010.54", "56,475.75", "50.887.58"], ["总间接温室气体排放（范围 3）", "吨二氧化碳当量", "1", "2", "3"]]), { page: 129, method: "text" as const, text: "注：\n范围 1-3：采用温室气体核算体系。自2025年依SBTI扩大核算边界，2023与2024年数据已重述。" }];
    const f = find(pages, "Carbon Emissions", 1);
    expect(find(pages, "Health & Safety", 2).summary).toContain("局部场所口径");
    expect(f.evidence.slice(0, 3).every(e => e.page === 128)).toBe(true);
    expect(f.evidence[0].context?.some(c => c.page === 129 && c.quote.includes("重述"))).toBe(true);
    expect(f.evidence.find(e => e.page === 50)?.context?.some(c => c.quote.includes("仅为某园区"))).toBe(true);
    expect(f.elements?.find(e => e.label.includes("范围 2"))?.detail).toContain("格式异常");
    for (const e of f.evidence)
      for (const c of e.context ?? [])
        expect(pages.find(p => p.page === c.page)?.text).toContain(c.quote);
    expect(validateReviewInput(makeReviewInput("Electrical Equipment", "Carbon Emissions", [f], pages))).toBe(true);
  });
  it("retrieves supplier human-rights clauses and audit coverage while retaining denominator and closure limits", () => {
    const pages = [tablePage(129, [["签订包含环境、劳工和人权要求条款合同的供应商的百分比", "%", "100", "100", "100"], ["已经过企业社会责任现场审核的目标供应商的百分比", "%", "100", "100", "100"]], "注：\n目标供应商：为采购额占比80%的主要供应商。")];
    expect(find(pages, "Supply Chain Labor Standards", 1).evidence.length).toBeGreaterThan(0);
    const f = find(pages, "Supply Chain Labor Standards", 3);
    expect(f.evidence[0].context?.some(c => c.quote.includes("80%"))).toBe(true);
    expect(f.gaps.join("")).toContain("关闭证据仍待核验");
  });
  it("restores one-year tables, fragmented thousands and footnote marks", () => {
    const item = (str: string, x: number, y: number, width = 25): PdfTextItem => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 8 });
    const items = [item("指标", 20, 200), item("单位", 170, 200), item("2025 年", 250, 200), item("死亡人数", 20, 180, 80), item("人", 170, 180), item("0", 250, 180), item("排放量", 20, 160, 80), item("吨", 170, 160), item("1", 250, 160, 5), item(",", 255, 160, 3), item("234.56", 258, 160, 25), item("废气量", 20, 140, 80), item("吨", 170, 140), item("22.48*", 250, 140)];
    const parsed = textFromPdfItems(items, 400, 300);
    expect(parsed.tables[0].rows[1][2]).toBe("1,234.56");
    expect(parsed.tables[0].rows[2][2]).toBe("22.48*");
  });
  it("exports one criterion per summary row, keeps detailed evidence and manual decisions", () => {
    const pages = [tablePage(1, [["员工因工死亡人数", "人", "0", "0", "0"], ["承包商因工死亡人数", "人", "0", "0", "0"]])];
    const results = { "Health & Safety": [find(pages, "Health & Safety", 4)] };
    const input = { file: "test.pdf", industry: "test", pages, results, reviews: { "Health & Safety:4": "confirmed" as const } };
    expect(buildReportCsv(input).rowCount).toBe(1);
    expect(buildReportCsv({ ...input, detail: true }).rowCount).toBe(2);
    expect(buildReportCsv(input).csv).toContain("证据与要求相符");
    expect(identifyIndustries([{ page: 6, method: "text", text: "关于我们：本公司主营低压电器，研发生产断路器及配电设备。" }])[0].industry.name).toBe("Electrical Equipment");
  });
});
