import { describe, it, expect } from "vitest";
import {
  analyzeLocally,
  buildEvidenceIndex,
  findEvidence,
  identifyIndustries,
  createDemoReport,
  makeReviewInput,
} from "./reportEngine";
import { frameworkIssues, criteriaForIssue } from "./reportFramework";
import { keyIssueHierarchy, getAllIndustries } from "./esgData";
import {
  validateReviewInput,
  validateReviewOutput,
  type ReportPage,
} from "@shared/report";
describe("independent report disclosure workflow", () => {
  it("covers every issue and industry without requiring a ratings workbook", () => {
    expect(new Set(frameworkIssues)).toEqual(
      new Set(
        Object.values(keyIssueHierarchy).flatMap(themes =>
          Object.values(themes).flat()
        )
      )
    );
    for (const industry of getAllIndustries())
      for (const issue of industry.keyIssues)
        expect(criteriaForIssue(issue.name).length).toBeGreaterThan(0);
    const pages = createDemoReport();
    expect(identifyIndustries(pages)[0].industry.name).toBe(
      "Real Estate Management & Development"
    );
  });
  it("does not mistake a filename or a table of contents for disclosures", () => {
    const pages: ReportPage[] = [
      {
        page: 1,
        method: "text",
        text: "目录\n绿色建筑........12\n商业道德........15\n健康与安全........18\n员工与承包商死亡人数........20",
      },
    ];
    expect(buildEvidenceIndex(pages)).toHaveLength(0);
    expect(
      analyzeLocally(buildEvidenceIndex(pages), pages, "Business Ethics").every(
        f => f.status === "not_found"
      )
    ).toBe(true);
    expect(
      identifyIndustries([
        {
          page: 1,
          method: "text",
          text: "一家商业银行。主营商业银行业务，银行业务包括金融服务。办公室安装光伏发电系统以节能。",
        },
      ])[0].industry.name
    ).toBe("Banks");
    expect(
      identifyIndustries([
        {
          page: 1,
          method: "text",
          text: "We reviewed our immediate priorities with stakeholders and shared progress on social media.",
        },
      ])
    ).toEqual([]);
    expect(
      buildEvidenceIndex([
        {
          page: 30,
          method: "text",
          text: "GRI Content Index\n416-1 Product safety and quality: refer to annual report\n416-2 No information",
        },
      ])
    ).toHaveLength(0);
    expect(
      buildEvidenceIndex([
        {
          page: 31,
          method: "text",
          text: "Performance data\nEmployee fatalities 0\nContractor fatalities 0\nLost time incidents 3\nTraining hours 20\nStaff total 100\nEnergy 200",
        },
      ]).length
    ).toBeGreaterThan(0);
  });
  it("preserves physical page numbers, original quotations and zero fatalities", () => {
    const pages: ReportPage[] = [
      {
        page: 7,
        method: "text",
        text: "2025年度，员工因工死亡人数0人，承包商因工死亡人数0人。统计边界为全部自有业务。",
      },
    ];
    const finding = analyzeLocally(
      buildEvidenceIndex(pages),
      pages,
      "Health & Safety"
    ).find(f => f.criterionId.endsWith(":4"))!;
    expect(finding.status).toBe("related");
    expect(finding.evidence[0].page).toBe(7);
    expect(pages[0].text).toContain(finding.evidence[0].quote);
    expect(finding.status).not.toBe("disclosed");
  });
  it("keeps missing and weak OCR pages uncertain", () => {
    const pages: ReportPage[] = [
      { page: 1, method: "unread", text: "" },
      {
        page: 2,
        method: "ocr",
        confidence: 35,
        text: "商业道德，反腐败与反贿赂政策由董事会监督。所有员工与供应商应遵守本政策。",
      },
    ];
    expect(
      analyzeLocally(buildEvidenceIndex(pages), pages, "Business Ethics").every(
        f => f.status === "insufficient"
      )
    ).toBe(true);
  });
  it("retrieves English synonyms, deduplicates overlap and retains original text", () => {
    const pages: ReportPage[] = [
      {
        page: 3,
        method: "text",
        text: "Business ethics: our anti-corruption policy prohibits bribery. Whistleblower channels maintain confidentiality and prohibit retaliation. ".repeat(
          20
        ),
      },
    ];
    const hits = findEvidence(
      buildEvidenceIndex(pages),
      criteriaForIssue("Business Ethics")[1]
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(h => pages[0].text.includes(h.quote))).toBe(true);
    expect(new Set(hits.map(h => h.id)).size).toBe(hits.length);
  });
  it("accepts only verifiable AI citations and complete unique criteria", () => {
    const pages = createDemoReport();
    const findings = analyzeLocally(
      buildEvidenceIndex(pages),
      pages,
      "Business Ethics"
    );
    const input = makeReviewInput(
      "Real Estate Management & Development",
      "Business Ethics",
      findings,
      pages
    );
    expect(validateReviewInput(input)).toBe(true);
    const raw = {
      findings: input.criteria.map(c => ({
        criterionId: c.id,
        status: c.evidence.length ? "partial" : "not_found",
        summary: "需核验覆盖范围",
        gaps: ["年度覆盖范围"],
        citations: c.evidence
          .slice(0, 1)
          .map(e => ({ id: e.id, quote: e.quote.slice(0, 40) })),
      })),
    };
    expect(validateReviewOutput(raw, input).findings.length).toBe(
      input.criteria.length
    );
    const forged = structuredClone(raw);
    forged.findings[0].citations = [
      { id: "p999-s0", quote: "不存在的外部审计证明" },
    ];
    expect(() => validateReviewOutput(forged, input)).toThrow();
    const altered = structuredClone(raw);
    altered.findings[0].citations[0].quote = "伪造认证范围";
    expect(() => validateReviewOutput(altered, input)).toThrow();
    expect(() =>
      validateReviewOutput({ findings: raw.findings.slice(1) }, input)
    ).toThrow();
    const duplicate = structuredClone(raw);
    duplicate.findings[1] = duplicate.findings[0];
    expect(() => validateReviewOutput(duplicate, input)).toThrow();
  });
  it("does not turn missing snippets in a partial document into non-disclosure", () => {
    const pages: ReportPage[] = [{ page: 1, method: "unread", text: "" }];
    const f = analyzeLocally([], pages, "Water Stress"),
      input = makeReviewInput("Banks", "Water Stress", f, pages);
    const output = validateReviewOutput(
      {
        findings: input.criteria.map(c => ({
          criterionId: c.id,
          status: "not_found",
          summary: "未找到",
          gaps: [],
          citations: [],
        })),
      },
      input
    );
    expect(output.findings.every(f => f.status === "insufficient")).toBe(true);
  });
});
