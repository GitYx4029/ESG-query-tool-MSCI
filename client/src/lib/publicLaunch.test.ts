import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseEsgDrilldown } from "./parseEsgExcel";
import { createDemoData } from "./demoData";
import {
  searchIndustries,
  getMethodologyUrl,
  MSCI_METHODOLOGY_INDEX_URL,
} from "./esgData";
import { matchesUiPassword } from "./adminSession";
describe("public launch regressions", () => {
  it("finds photovoltaic candidates and trims search input", () => {
    expect(searchIndustries(" 光伏 ").map(i => i.name)).toContain(
      "Semiconductors & Semiconductor Equipment"
    );
    expect(searchIndustries(" ai ").map(i => i.name)).toContain("Software");
    expect(searchIndustries("未收录的行业")).toEqual([]);
  });
  it("preserves uploaded scores and rejects an ordinary spreadsheet", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        [
          "",
          "As of prior rating action date: 2025-01-01",
          "",
          "As of rating action date: 2026-06-01",
        ],
        ["Description", "Prior score", "Prior weight", "Score", "Weight"],
        ["ESG Rating Letter Grade", "BBB", "", "AA"],
        ["Industry Adjusted Score", 5, "", 9.2],
        ["Environmental Pillar Score", 5, 0.3, 9.3, 0.3],
        ["Carbon Emissions Key Issue Score", 5, 0.3, 9.3, 0.3],
      ]),
      "Drilldown"
    );
    const parsed = parseEsgDrilldown(
      XLSX.write(wb, { type: "array", bookType: "xlsx" })
    );
    expect(parsed.industryAdjustedScore).toBe(9.2);
    expect(parsed.pillars[0].score).toBe(9.3);
    const invalid = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      invalid,
      XLSX.utils.aoa_to_sheet([["ordinary", "data"]]),
      "Sheet1"
    );
    expect(() =>
      parseEsgDrilldown(
        XLSX.write(invalid, { type: "array", bookType: "xlsx" })
      )
    ).toThrow();
  });
  it("keeps synthetic demos explicit and uses the official directory for unverified documents", () => {
    expect(createDemoData("realEstate").companyName).toContain("虚构");
    expect(getMethodologyUrl("Unknown Issue")).toBe(MSCI_METHODOLOGY_INDEX_URL);
    expect(getMethodologyUrl("Carbon Emissions")).toContain(
      "carbon-emissions-key-issue.pdf"
    );
  });
  it("rejects an incorrect administrator password", () => {
    expect(matchesUiPassword("4029")).toBe(true);
    expect(matchesUiPassword("4028")).toBe(false);
  });
});
