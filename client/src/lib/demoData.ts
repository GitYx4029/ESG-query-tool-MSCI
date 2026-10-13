import type {
  DemoScoreProfile,
  EsgDrilldownData,
  KeyIssueData,
} from "./parseEsgExcel";

// Entirely synthetic examples. No third-party report is downloaded or relabeled.
export function createDemoData(profile: DemoScoreProfile): EsgDrilldownData {
  const issue = (
    name: string,
    score: number,
    weight: number,
    metric: string
  ): KeyIssueData => ({
    name,
    score,
    priorScore: score - 0.5,
    weight,
    managementScore: score,
    exposureScore: 6,
    controversyDeduction: 0,
    practices: [{ name: metric, score, weight: 100 }],
    performances: [],
  });
  const realEstate = profile === "realEstate";
  const envScore = realEstate ? 6.6 : 6.4;
  const socialScore = realEstate ? 6.8 : 6.2;
  return {
    companyName: realEstate ? "ABC虚构企业" : "XYZ虚构企业",
    ratingDate: "2026-06-30（虚构）",
    priorDate: "2025-12-31（虚构）",
    letterGrade: "A",
    priorLetterGrade: "BBB",
    industryAdjustedScore: realEstate ? 5.7 : 6.1,
    priorIndustryAdjustedScore: 5.2,
    industryMinScore: 2,
    industryMaxScore: 9,
    weightedAvgKeyIssueScore: (envScore * 30 + socialScore * 30 + 5 * 40) / 100,
    pillars: [
      {
        name: "Environmental",
        score: envScore,
        priorScore: envScore - 0.5,
        weight: 30,
        keyIssues: [
          issue(
            realEstate
              ? "Opportunities in Green Building"
              : "Opportunities in Clean Tech",
            envScore,
            30,
            realEstate
              ? "Green Building Certification Performance"
              : "Revenue from Clean Tech Products"
          ),
        ],
      },
      {
        name: "Social",
        score: socialScore,
        priorScore: socialScore - 0.5,
        weight: 30,
        keyIssues: [
          issue(
            "Health & Safety",
            socialScore,
            30,
            "Scope of health and safety policy"
          ),
        ],
      },
      {
        name: "Governance",
        score: 5,
        priorScore: 4.5,
        weight: 40,
        keyIssues: [issue("Corporate Governance", 5, 40, "Board Independence")],
      },
    ],
  };
}
