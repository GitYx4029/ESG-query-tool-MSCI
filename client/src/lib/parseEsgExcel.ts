/*
 * MSCI ESG Ratings Drilldown Excel 解析器
 * 解析层级结构：总评级 → 支柱 → 关键议题 → 指标
 */
import * as XLSX from "xlsx";

// 数据类型定义
export interface EsgDrilldownData {
  companyName: string;
  ratingDate: string;
  priorDate: string;

  // 总评级
  letterGrade: string;
  priorLetterGrade: string;
  industryAdjustedScore: number;
  priorIndustryAdjustedScore: number;
  industryMinScore: number;
  industryMaxScore: number;
  weightedAvgKeyIssueScore: number;

  // 三支柱
  pillars: PillarData[];

  // 原始行数据（用于调试）
  rawRows?: RawRow[];
}

export interface PillarData {
  name: string; // "Environmental" | "Social" | "Governance"
  score: number;
  priorScore: number;
  weight: number; // 百分比如28.0
  keyIssues: KeyIssueData[];
}

export interface KeyIssueData {
  name: string;
  score: number;
  priorScore: number;
  weight: number;
  exposureScore?: number;
  businessSegmentExposure?: number;
  geographicExposure?: number;
  managementScore?: number;
  managementExclControversies?: number;
  practicesScore?: number;
  performanceScore?: number;
  controversyDeduction?: number;
  practices: IndicatorData[];
  performances: IndicatorData[];
}

export interface IndicatorData {
  name: string;
  score: number;
  weight: number; // 百分比
}

interface RawRow {
  description: string;
  priorScore: number | null;
  priorWeight: number | null;
  lastScore: number | null;
  lastWeight: number | null;
  diffScore: number | null;
}

function parseNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "-") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parsePercent(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "-") return null;
  const s = String(val).replace("%", "").trim();
  const n = Number(s);
  if (isNaN(n)) return null;
  // 如果原值包含%，说明已经是百分比形式
  if (String(val).includes("%")) return n;
  // 如果是小数（如0.28），转为百分比
  if (n > 0 && n < 1) return Math.round(n * 1000) / 10;
  return n;
}

export function parseEsgDrilldown(file: ArrayBuffer): EsgDrilldownData {
  const wb = XLSX.read(file, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // 提取日期信息
  const headerRow = rows[0] || [];
  const priorDate = extractDate(String(headerRow[1] || ""));
  const ratingDate = extractDate(String(headerRow[3] || ""));

  // 提取Letter Grade（字符串，不是数字）
  let letterGradeVal = "N/A";
  let priorLetterGradeVal = "N/A";

  // 解析所有行
  const rawRows: RawRow[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const desc = String(r[0]).trim();
    if (!desc) continue;

    // Letter Grade 是字符串（如 "A", "BBB"），特殊处理
    if (desc === "ESG Rating Letter Grade") {
      letterGradeVal = String(r[3] ?? r[1] ?? "N/A").trim();
      priorLetterGradeVal = String(r[1] ?? "N/A").trim();
      continue; // 不加入rawRows
    }

    rawRows.push({
      description: desc,
      priorScore: parseNum(r[1]),
      priorWeight: parsePercent(r[2]),
      lastScore: parseNum(r[3]),
      lastWeight: parsePercent(r[4]),
      diffScore: parseNum(r[7]),
    });
  }

  // 提取总评级
  const letterGradeRow = null; // handled above
  const adjScoreRow = rawRows.find(r => r.description === "Industry Adjusted Score");
  const minScoreRow = rawRows.find(r => r.description === "Industry Minimum Score");
  const maxScoreRow = rawRows.find(r => r.description === "Industry Maximum Score");
  const avgScoreRow = rawRows.find(r => r.description === "Weighted Average Key Issue Score");

  // 解析支柱和关键议题
  const pillars: PillarData[] = [];
  let currentPillar: PillarData | null = null;
  let currentKeyIssue: KeyIssueData | null = null;
  let collectingPractices = false;
  let collectingPerformance = false;

  for (const row of rawRows) {
    const desc = row.description;

    // 支柱行
    if (desc.includes("Pillar Score")) {
      if (currentKeyIssue && currentPillar) {
        currentPillar.keyIssues.push(currentKeyIssue);
        currentKeyIssue = null;
      }
      if (currentPillar) pillars.push(currentPillar);

      let pillarName = "Environmental";
      if (desc.includes("Social")) pillarName = "Social";
      else if (desc.includes("Governance")) pillarName = "Governance";

      currentPillar = {
        name: pillarName,
        score: row.lastScore ?? 0,
        priorScore: row.priorScore ?? 0,
        weight: row.lastWeight ?? row.priorWeight ?? 0,
        keyIssues: [],
      };
      collectingPractices = false;
      collectingPerformance = false;
      continue;
    }

    // 跳过总评级行（不属于任何支柱）
    if (desc === "Weighted Average Key Issue Score" || desc === "Industry Adjusted Score" || desc === "Industry Minimum Score" || desc === "Industry Maximum Score") {
      continue;
    }

    // 关键议题行
    if (desc.includes("Key Issue Score") || desc === "Corporate Behavior Score") {
      if (currentKeyIssue && currentPillar) {
        currentPillar.keyIssues.push(currentKeyIssue);
      }
      currentKeyIssue = {
        name: desc.replace(" Key Issue Score", "").replace(" Score", ""),
        score: row.lastScore ?? 0,
        priorScore: row.priorScore ?? 0,
        weight: row.lastWeight ?? row.priorWeight ?? 0,
        practices: [],
        performances: [],
      };
      collectingPractices = false;
      collectingPerformance = false;
      continue;
    }

    if (!currentKeyIssue) continue;

    // 子维度
    if (desc === "Exposure Score") {
      currentKeyIssue.exposureScore = row.lastScore ?? row.priorScore ?? undefined;
      collectingPractices = false;
      collectingPerformance = false;
    } else if (desc === "Business Segment Exposure Score") {
      currentKeyIssue.businessSegmentExposure = row.lastScore ?? row.priorScore ?? undefined;
    } else if (desc === "Geographic Exposure Score") {
      currentKeyIssue.geographicExposure = row.lastScore ?? row.priorScore ?? undefined;
    } else if (desc === "Management Score") {
      currentKeyIssue.managementScore = row.lastScore ?? row.priorScore ?? undefined;
      collectingPractices = false;
      collectingPerformance = false;
    } else if (desc === "Management Score - Excluding Controversies") {
      currentKeyIssue.managementExclControversies = row.lastScore ?? row.priorScore ?? undefined;
    } else if (desc === "Practices Score") {
      currentKeyIssue.practicesScore = row.lastScore ?? row.priorScore ?? undefined;
      collectingPractices = true;
      collectingPerformance = false;
    } else if (desc === "Performance Score") {
      currentKeyIssue.performanceScore = row.lastScore ?? row.priorScore ?? undefined;
      collectingPractices = false;
      collectingPerformance = true;
    } else if (desc === "Controversy Deduction") {
      currentKeyIssue.controversyDeduction = row.lastScore ?? row.priorScore ?? undefined;
      collectingPractices = false;
      collectingPerformance = false;
    } else if (collectingPractices && row.lastWeight !== null) {
      currentKeyIssue.practices.push({
        name: desc,
        score: row.lastScore ?? row.priorScore ?? 0,
        weight: row.lastWeight ?? 0,
      });
    } else if (collectingPerformance && row.lastWeight !== null) {
      currentKeyIssue.performances.push({
        name: desc,
        score: row.lastScore ?? row.priorScore ?? 0,
        weight: row.lastWeight ?? 0,
      });
    } else if (currentPillar?.name === "Governance" && !desc.includes("Score")) {
      // 治理子项（Board, Pay, Ownership & Control, Accounting, Business Ethics, Tax Transparency）
      if (currentKeyIssue.name === "Corporate Governance" || currentKeyIssue.name === "Corporate Behavior") {
        currentKeyIssue.practices.push({
          name: desc,
          score: row.lastScore ?? row.priorScore ?? 0,
          weight: 0,
        });
      }
    }
  }

  // 收尾
  if (currentKeyIssue && currentPillar) {
    currentPillar.keyIssues.push(currentKeyIssue);
  }
  if (currentPillar) pillars.push(currentPillar);

  // 提取公司名 - 从文件名或默认
  const companyName = "上传企业";

  return {
    companyName,
    ratingDate: ratingDate || "N/A",
    priorDate: priorDate || "N/A",
    letterGrade: letterGradeVal,
    priorLetterGrade: priorLetterGradeVal,
    industryAdjustedScore: adjScoreRow?.lastScore ?? 0,
    priorIndustryAdjustedScore: adjScoreRow?.priorScore ?? 0,
    industryMinScore: minScoreRow?.lastScore ?? 0,
    industryMaxScore: maxScoreRow?.lastScore ?? 0,
    weightedAvgKeyIssueScore: avgScoreRow?.lastScore ?? 0,
    pillars,
    rawRows,
  };
}

function extractDate(header: string): string {
  // "As of prior rating action date: Aug 05, 2025" → "Aug 05, 2025"
  const match = header.match(/:\s*(.+)/);
  return match ? match[1].trim() : header;
}

// 评级等级颜色
export function getRatingColor(grade: string): string {
  const colors: Record<string, string> = {
    AAA: "#15803d",
    AA: "#22c55e",
    A: "#86efac",
    BBB: "#facc15",
    BB: "#f59e0b",
    B: "#ef4444",
    CCC: "#991b1b",
  };
  return colors[grade] || "#6b7280";
}

// 评分颜色（0-10）
export function getScoreColor(score: number): string {
  if (score >= 8) return "#16a34a";
  if (score >= 6) return "#65a30d";
  if (score >= 4) return "#d97706";
  if (score >= 2) return "#ea580c";
  return "#dc2626";
}

// 评分等级文字
export function getScoreLabel(score: number): string {
  if (score >= 8) return "优秀";
  if (score >= 6) return "良好";
  if (score >= 4) return "中等";
  if (score >= 2) return "较弱";
  return "落后";
}
