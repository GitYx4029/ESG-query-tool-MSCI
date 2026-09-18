import { describe, it, expect } from "vitest";
import {
  realEstateMethodology,
  findMethodologyTooltip,
  findIssueMethodology,
  getMethodologyUrls,
} from "./realEstateMethodology";

/**
 * CMSK Excel中的完整34个指标列表
 * 这些指标名称必须与代码中的key完全匹配
 */
const CMSK_MANAGEMENT_INDICATORS = [
  // Green Building (7)
  "Evidence of urban revitalization developments",
  "Use of green or triple-net leases",
  "Green certification commitments for greenfield developments",
  "Evidence of flexible or mixed-use properties in portfolio",
  "Green building commitment extends to existing buildings in portfolio (in addition to new buildings)",
  "Extent of commercial arrangements to improve property environmental performance",
  "Extent of green building certification commitments in portfolio or development pipeline",
  // Health & Safety (8)
  "Scope of health and safety policy",
  "Health and safety policy and practices are audited",
  "Applicability of health and safety policy to contractors",
  "Health and safety performance is a factor in CEO compensation",
  "Executive body responsible for H&S strategy and performance",
  "Evaluation of Health & Safety Certification",
  "Contractors included in disclosed health and safety metrics",
  "Target to improve health and safety performance",
  // Product Safety & Quality (7)
  "Policy on responsible marketing, advertising and sales",
  "Scope of supplier training on quality standards",
  "Measures and reports quantitative indicators related to service quality performance or customer protection",
  "Audit/control procedures on responsible marketing",
  "Scope of employee training on product quality",
  "Certification program for suppliers",
  "Certification to product safety/quality standard",
  // Corporate Governance (4)
  "Board",
  "Pay",
  "Ownership & Control",
  "Accounting",
  // Corporate Behavior (2)
  "Business Ethics",
  "Tax Transparency",
];

const CMSK_PERFORMANCE_INDICATORS = [
  // Green Building (2)
  "Green Building Certification Performance",
  "Carbon Emission Performance Score",
  // Health & Safety (3)
  "Total Recordable Injury Rate Score",
  "Lost Time Incident Rate Score",
  "Fatalities Score",
  // Product Safety (1)
  "Warranty Performance Score",
];

describe("realEstateMethodology data structure", () => {
  it("should have exactly 5 issues", () => {
    expect(Object.keys(realEstateMethodology)).toHaveLength(5);
  });

  it("should have correct issue keys", () => {
    const keys = Object.keys(realEstateMethodology);
    expect(keys).toContain("opportunities_in_green_building");
    expect(keys).toContain("health_and_safety");
    expect(keys).toContain("product_safety_and_quality");
    expect(keys).toContain("corporate_governance");
    expect(keys).toContain("corporate_behavior");
  });

  it("each issue should have required fields", () => {
    for (const [key, issue] of Object.entries(realEstateMethodology)) {
      expect(issue.issueEN).toBeTruthy();
      expect(issue.issueCN).toBeTruthy();
      expect(["environment", "social", "governance"]).toContain(issue.type);
      expect(issue.methodologyUrl).toMatch(/^https?:\/\//);
      expect(issue.overview).toBeTruthy();
      expect(issue.assessmentFramework).toBeTruthy();
    }
  });
});

describe("CMSK indicator completeness", () => {
  it("should have all 28 management indicators from CMSK Excel", () => {
    const allMgmtKeys: string[] = [];
    for (const issue of Object.values(realEstateMethodology)) {
      allMgmtKeys.push(...Object.keys(issue.managementIndicators));
    }

    for (const indicator of CMSK_MANAGEMENT_INDICATORS) {
      expect(allMgmtKeys).toContain(indicator);
    }
  });

  it("should have all 6 performance indicators from CMSK Excel", () => {
    const allPerfKeys: string[] = [];
    for (const issue of Object.values(realEstateMethodology)) {
      allPerfKeys.push(...Object.keys(issue.performanceIndicators));
    }

    for (const indicator of CMSK_PERFORMANCE_INDICATORS) {
      expect(allPerfKeys).toContain(indicator);
    }
  });

  it("total indicator count should be 34 (28 management + 6 performance)", () => {
    let mgmtCount = 0;
    let perfCount = 0;
    for (const issue of Object.values(realEstateMethodology)) {
      mgmtCount += Object.keys(issue.managementIndicators).length;
      perfCount += Object.keys(issue.performanceIndicators).length;
    }
    expect(mgmtCount).toBe(28);
    expect(perfCount).toBe(6);
    expect(mgmtCount + perfCount).toBe(34);
  });
});

describe("indicator tooltip data quality", () => {
  it("every indicator should have non-empty required fields", () => {
    for (const issue of Object.values(realEstateMethodology)) {
      for (const [key, tooltip] of Object.entries(issue.managementIndicators)) {
        expect(tooltip.nameCN, `${key} missing nameCN`).toBeTruthy();
        expect(tooltip.nameEN, `${key} missing nameEN`).toBeTruthy();
        expect(tooltip.definition, `${key} missing definition`).toBeTruthy();
        expect(tooltip.scoringCriteria, `${key} missing scoringCriteria`).toBeTruthy();
        expect(tooltip.dataSource, `${key} missing dataSource`).toBeTruthy();
        expect(tooltip.scoreRange, `${key} missing scoreRange`).toBeTruthy();
        expect(typeof tooltip.directlyFromMethodology, `${key} missing directlyFromMethodology`).toBe("boolean");
      }
      for (const [key, tooltip] of Object.entries(issue.performanceIndicators)) {
        expect(tooltip.nameCN, `${key} missing nameCN`).toBeTruthy();
        expect(tooltip.nameEN, `${key} missing nameEN`).toBeTruthy();
        expect(tooltip.definition, `${key} missing definition`).toBeTruthy();
        expect(tooltip.scoringCriteria, `${key} missing scoringCriteria`).toBeTruthy();
        expect(typeof tooltip.directlyFromMethodology, `${key} missing directlyFromMethodology`).toBe("boolean");
      }
    }
  });

  it("non-methodology indicators should have sourceNote", () => {
    for (const issue of Object.values(realEstateMethodology)) {
      for (const [key, tooltip] of Object.entries(issue.managementIndicators)) {
        if (!tooltip.directlyFromMethodology) {
          expect(tooltip.sourceNote, `${key} is not directly from methodology but missing sourceNote`).toBeTruthy();
        }
      }
      for (const [key, tooltip] of Object.entries(issue.performanceIndicators)) {
        if (!tooltip.directlyFromMethodology) {
          expect(tooltip.sourceNote, `${key} is not directly from methodology but missing sourceNote`).toBeTruthy();
        }
      }
    }
  });
});

describe("governance issues are correctly identified as independent Key Issues", () => {
  it("Board should be described as independent Key Issue, not sub-issue", () => {
    const board = realEstateMethodology.corporate_governance.managementIndicators["Board"];
    expect(board).toBeDefined();
    expect(board.definition).toContain("独立Key Issue");
    expect(board.definition).not.toContain("子议题");
  });

  it("Pay should be described as independent Key Issue", () => {
    const pay = realEstateMethodology.corporate_governance.managementIndicators["Pay"];
    expect(pay).toBeDefined();
    expect(pay.definition).toContain("独立Key Issue");
    expect(pay.definition).not.toContain("子议题");
  });

  it("Ownership & Control should be described as independent Key Issue", () => {
    const oc = realEstateMethodology.corporate_governance.managementIndicators["Ownership & Control"];
    expect(oc).toBeDefined();
    expect(oc.definition).toContain("独立Key Issue");
    expect(oc.definition).not.toContain("子议题");
  });

  it("Accounting should be described as independent Key Issue with correct content", () => {
    const acc = realEstateMethodology.corporate_governance.managementIndicators["Accounting"];
    expect(acc).toBeDefined();
    expect(acc.definition).toContain("独立Key Issue");
    expect(acc.definition).not.toContain("子议题");
    // Accounting should mention financial reporting quality and auditor independence
    expect(acc.definition).toContain("财务报告");
    expect(acc.definition).toContain("审计师独立性");
    // Accounting should NOT contain Strategic Oversight items (those belong to Board)
    expect(acc.definition).not.toContain("破产");
    expect(acc.definition).not.toContain("债务契约");
  });
});

describe("Tax Transparency is correctly defined", () => {
  it("should mention Tax Controversies as the key metric", () => {
    const tt = realEstateMethodology.corporate_behavior.managementIndicators["Tax Transparency"];
    expect(tt).toBeDefined();
    expect(tt.definition).toContain("Tax Controversies");
  });

  it("should mention estimated tax gap", () => {
    const tt = realEstateMethodology.corporate_behavior.managementIndicators["Tax Transparency"];
    expect(tt.definition).toContain("估计税差");
  });
});

describe("findMethodologyTooltip function", () => {
  it("should find exact match indicators", () => {
    const result = findMethodologyTooltip("Scope of health and safety policy");
    expect(result).toBeDefined();
    expect(result!.nameCN).toBe("健康与安全政策的范围");
  });

  it("should find governance indicators", () => {
    const result = findMethodologyTooltip("Board");
    expect(result).toBeDefined();
    expect(result!.nameCN).toBe("董事会");
  });

  it("should find performance indicators", () => {
    const result = findMethodologyTooltip("Total Recordable Injury Rate Score");
    expect(result).toBeDefined();
    expect(result!.nameCN).toBe("总可记录工伤率得分");
  });

  it("should return undefined for non-existent indicators", () => {
    const result = findMethodologyTooltip("Non Existent Indicator XYZ");
    expect(result).toBeUndefined();
  });
});

describe("findIssueMethodology function", () => {
  it("should find by English name", () => {
    const result = findIssueMethodology("Health & Safety");
    expect(result).toBeDefined();
    expect(result!.issueCN).toBe("健康与安全");
  });

  it("should find by Chinese name", () => {
    const result = findIssueMethodology("绿色建筑机遇");
    expect(result).toBeDefined();
    expect(result!.issueEN).toBe("Opportunities in Green Building");
  });

  it("should find by key", () => {
    const result = findIssueMethodology("corporate_governance");
    expect(result).toBeDefined();
    expect(result!.issueCN).toBe("公司治理");
  });
});

describe("getMethodologyUrls function", () => {
  it("should return URLs for all issues", () => {
    const urls = getMethodologyUrls();
    expect(Object.keys(urls).length).toBeGreaterThanOrEqual(10); // 5 issues x 2 (EN + CN)
    expect(urls["Health & Safety"]).toMatch(/^https?:\/\//);
    expect(urls["健康与安全"]).toMatch(/^https?:\/\//);
  });
});

describe("indicators not directly from methodology are properly flagged", () => {
  it("'Green building commitment extends to existing buildings' should be flagged", () => {
    const tooltip = findMethodologyTooltip(
      "Green building commitment extends to existing buildings in portfolio (in addition to new buildings)"
    );
    expect(tooltip).toBeDefined();
    expect(tooltip!.directlyFromMethodology).toBe(false);
    expect(tooltip!.sourceNote).toBeTruthy();
  });

  it("'Contractors included in disclosed health and safety metrics' should be flagged", () => {
    const tooltip = findMethodologyTooltip(
      "Contractors included in disclosed health and safety metrics"
    );
    expect(tooltip).toBeDefined();
    expect(tooltip!.directlyFromMethodology).toBe(false);
    expect(tooltip!.sourceNote).toBeTruthy();
  });

  it("'Certification program for suppliers' should be flagged as composite", () => {
    const tooltip = findMethodologyTooltip("Certification program for suppliers");
    expect(tooltip).toBeDefined();
    expect(tooltip!.directlyFromMethodology).toBe(false);
    expect(tooltip!.sourceNote).toBeTruthy();
    expect(tooltip!.sourceNote).toContain("Tier 1");
  });

  it("directly-from-methodology indicators should be marked true", () => {
    const tooltip = findMethodologyTooltip("Scope of health and safety policy");
    expect(tooltip).toBeDefined();
    expect(tooltip!.directlyFromMethodology).toBe(true);
  });
});
