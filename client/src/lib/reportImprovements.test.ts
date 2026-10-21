import { describe, it, expect } from "vitest";
import type { Page } from "tesseract.js";
import type { Evidence, ReportPage } from "@shared/report";
import {
  analyzeLocally,
  buildEvidenceIndex,
  identifyIndustries,
  isContentsPage,
  makeReviewInput,
} from "./reportEngine";
import { textQuality, selectOcrPages } from "./reportQuality";
import {
  readableExcerpt,
  uniqueContexts,
  matchesResultFilter,
} from "./reportPresentation";
import { parseOcrPage, enhanceOcrContrast, mergeOcrHeader } from "./reportOcr";
import { textFromPdfItems, type PdfTextItem } from "./reportText";
const item = (str: string, x: number, y: number, width = 30): PdfTextItem => ({
  str,
  transform: [1, 0, 0, 1, x, y],
  width,
  height: 8,
});
const ocrLine = (cells: string[], y: number) => ({
  text: cells.join(" "),
  bbox: { x0: 20, x1: 450, y0: y, y1: y + 10 },
  words: cells.map((text, i) => ({
    text,
    bbox: {
      x0: [20, 165, 240, 310, 380][i],
      x1: [120, 185, 260, 330, 400][i],
      y0: y,
      y1: y + 10,
    },
  })),
});
const ocrFixture = () =>
  ({
    text: "original OCR",
    blocks: [
      {
        bbox: { x0: 0, y0: 0, x1: 500, y1: 600 },
        paragraphs: [
          {
            bbox: { x0: 0, y0: 0, x1: 500, y1: 600 },
            lines: [
              ocrLine(["指标名称", "单位", "2023年", "2024年", "2025年"], 100),
              ocrLine(["工伤死亡数量", "人", "/", "/", "0"], 130),
              ocrLine(["工伤死亡率", "%", "/", "/", "0"], 160),
              ocrLine(["百万工时损工事故率", "-", "/", "/", "0.14"], 190),
            ],
          },
        ],
      },
    ],
  }) as unknown as Page;
describe("report reading and extraction improvements", () => {
  it("recognizes alternate radicals and business descriptions without converting quotations", () => {
    const pages: ReportPage[] = [
      {
        page: 8,
        method: "text",
        text: "企业概况：⻓安汽⻋是汽⻋品牌，具有整车制造基地，提供乘用车与商用车。",
      },
    ];
    const c = identifyIndustries(pages)[0];
    expect(c.industry.name).toBe("Automobiles");
    expect(c.evidence.quote).toContain("⻋");
  });
  it("finds a contents title at the end of a long page and ignores control characters", () => {
    expect(
      isContentsPage("5.1 应对气候变化\n19\n".repeat(60) + "⽬\u0001录")
    ).toBe(true);
    expect(
      isContentsPage(
        "第十九条 参见绩效表\n第二十条 参见绩效表\n第二十一条 参见绩效表\n第二十二条\n第二十三条"
      )
    ).toBe(true);
  });
  it("inherits a speech role from a section divider and ranks operational targets ahead", () => {
    const pages: ReportPage[] = [
      { page: 5, method: "text", text: "董事⻓致辞" },
      {
        page: 6,
        method: "text",
        text: "我们响应碳中和与净零减排目标，推动高质量发展。国家提出碳达峰、碳中和。",
      },
      { page: 7, method: "text", text: "关于本公司" },
      {
        page: 28,
        method: "text",
        text: "公司减排目标：以2020年为基准，到2030年碳排放强度降低35%。",
      },
    ];
    const f = analyzeLocally(
      buildEvidenceIndex(pages),
      pages,
      "Carbon Emissions"
    )[1];
    expect(f.evidence[0].page).toBe(28);
    expect(f.evidence.find(e => e.page === 6)?.role).toBe("statement");
  });
  it("flags damaged numeric glyphs even when most of the text is readable", () => {
    expect(
      textQuality("职业健康与安全制度完整。".repeat(30) + "工伤死亡数量 ��")
    ).toMatchObject({ readable: true, needsOcr: true });
    const pages: ReportPage[] = [
      { page: 1, text: "GRI索引 2-1 3-3", method: "unread" },
      { page: 122, text: "指标名称 单位 绩效表 范围一 ����", method: "unread" },
      { page: 98, text: "职业健康与安全 � �", method: "text", needsOcr: true },
    ];
    expect(selectOcrPages(pages, 2)).toEqual([122, 98]);
    expect(
      makeReviewInput("Automobiles", "Health & Safety", [], [pages[2]])
        .partialDocument
    ).toBe(true);
  });
  it("restores OCR table coordinates, latest-year zero values and unnamed injury rates", () => {
    const parsed = parseOcrPage(ocrFixture(), 500, 600);
    expect(parsed.tables).toHaveLength(1);
    const pages: ReportPage[] = [
      { page: 127, ...parsed, method: "ocr", confidence: 90 },
    ];
    const f = analyzeLocally(
      buildEvidenceIndex(pages),
      pages,
      "Health & Safety"
    );
    expect(f[3].elements?.find(e => e.page)?.detail).toContain("2025年：0 人");
    expect(f[3].elements?.[0].page).toBeUndefined();
    expect(f[4].elements?.[2].detail).toContain("0.14");
    expect(f[4].elements?.[0].page).toBeUndefined();
    for (const x of f)
      for (const e of x.evidence) expect(pages[0].text).toContain(e.quote);
  });
  it("restores split year headings instead of assigning later values to the first year", () => {
    const items = [
      item("指标类型", 20, 200, 80),
      item("单位", 150, 200),
      item("2023年", 210, 200),
      item("202", 290, 200, 18),
      item("4 年", 309, 200, 18),
      item("202", 370, 200, 18),
      item("5 年", 389, 200, 18),
    ];
    for (let i = 0; i < 3; i++)
      items.push(
        item(`范围${i + 1}排放`, 20, 180 - i * 20, 80),
        item("吨", 150, 180 - i * 20),
        item("1", 220, 180 - i * 20),
        item("2", 300, 180 - i * 20),
        item("3", 380, 180 - i * 20)
      );
    const p = textFromPdfItems(items, 450);
    expect(p.tables[0].columns).toHaveLength(5);
    expect(p.tables[0].rows[0].slice(2)).toEqual(["1", "2", "3"]);
  });
  it("keeps narrow header OCR in the original page coordinate system", () => {
    const data = ocrFixture();
    const header = {
      ...data,
      blocks: [
        {
          ...data.blocks![0],
          paragraphs: [
            {
              ...data.blocks![0].paragraphs[0],
              lines: [
                ocrLine(["指标名称", "单位", "2023年", "2024年", "2025年"], 20),
              ],
            },
          ],
        },
      ],
    } as Page;
    const combined = mergeOcrHeader(
      { text: "body", blocks: [] },
      header,
      { left: 10, top: 100 },
      2
    );
    expect(combined.blocks?.[0].paragraphs[0].lines[0].bbox.y0).toBe(110);
  });
  it("improves contrast in dark header bands while retaining the body background", () => {
    const w = 100,
      h = 30,
      pixels = new Uint8ClampedArray(w * h * 4).fill(255);
    for (let y = 5; y < 20; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        pixels[i] = 20;
        pixels[i + 1] = 50;
        pixels[i + 2] = 90;
      }
    const bands = enhanceOcrContrast(pixels, w, h);
    expect(bands).toHaveLength(1);
    expect(pixels[6 * w * 4]).toBe(255);
    expect(pixels[0]).toBe(255);
  });
  it("retrieves partner labour codes and quantitative footprint coverage", () => {
    const pages: ReportPage[] = [
      {
        page: 81,
        method: "text",
        text: "供应商行为规范：公司要求供应商签署商业合作伙伴行为准则，包括责任雇佣、劳工权益和人权要求。",
      },
      {
        page: 34,
        method: "text",
        text: "2025年，143款在售乘用车完成碳足迹核算，产品碳⾜迹测算覆盖率\n\n100%。",
      },
    ];
    const index = buildEvidenceIndex(pages);
    expect(
      analyzeLocally(index, pages, "Supply Chain Labor Standards")[0]
        .evidence[0].page
    ).toBe(81);
    expect(
      analyzeLocally(index, pages, "Product Carbon Footprint")[2].evidence[0]
        .page
    ).toBe(34);
    expect(
      analyzeLocally(index, pages, "Product Carbon Footprint")[2].elements?.[0]
        .detail
    ).toContain("100 %");
  });
  it("excludes stakeholder communication tables from supplier audit evidence", () => {
    const pages: ReportPage[] = [
      {
        page: 120,
        method: "text",
        text: "利益相关方 诉求 沟通方式\n人权保障 社会责任 供应商\n现场检查 供应商审核",
      },
      {
        page: 79,
        method: "text",
        text: "供应商审核与评估：对供应商开展社会责任现场审核与第三方尽职调查，识别劳工与人权风险并督促整改。",
      },
    ];
    const f = analyzeLocally(
      buildEvidenceIndex(pages),
      pages,
      "Supply Chain Labor Standards"
    )[1];
    expect(f.evidence.map(e => e.page)).toEqual([79]);
  });
  it("reflows paragraph wraps and English words while preserving lists and tables", () => {
    const original =
      "公司建立温室气体\n\n排放管理体系，保障数据\n可靠。\nScope 1\nemissions are measured.";
    const result = readableExcerpt(original);
    expect(result).toContain("公司建立温室气体排放管理体系，保障数据可靠。");
    expect(result).toContain("Scope 1 emissions");
    expect(original).toContain("\n\n");
    expect(readableExcerpt("1. 员工政策\n2. 承包商政策")).toContain("\n\n2.");
    expect(readableExcerpt("指标 | 年度\n排放 | 2025", "table")).toBe(
      "指标 | 年度\n排放 | 2025"
    );
  });
  it("deduplicates shared notes and keeps different scope pages separate", () => {
    const base: Evidence = {
      id: "a",
      page: 1,
      quote: "原文",
      method: "text",
      context: [{ page: 3, quote: "仅为园区范围" }],
    };
    expect(uniqueContexts([base, { ...base, id: "b" }])).toHaveLength(1);
    expect(
      uniqueContexts([
        base,
        { ...base, id: "b", context: [{ page: 4, quote: "仅为园区范围" }] },
      ])
    ).toHaveLength(2);
  });
  it("filters results and respects completed manual decisions", () => {
    const finding = {
      criterionId: "a",
      status: "related" as const,
      summary: "",
      gaps: [],
      evidence: [],
    };
    expect(matchesResultFilter(finding, "missing")).toBe(true);
    expect(matchesResultFilter(finding, "found")).toBe(false);
    expect(matchesResultFilter(finding, "pending", "confirmed")).toBe(false);
    expect(matchesResultFilter(finding, "pending", "needs_more")).toBe(true);
  });
});
