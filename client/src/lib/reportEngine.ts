import { getAllIndustries, industryNamesCN, type Industry } from "./esgData";
import { criteriaForIssue } from "./reportFramework";
import { checkElements, reviewGaps, findingSummary } from "./reportChecks";
import {
  REPORT_FRAMEWORK_VERSION,
  type Evidence,
  type ReportPage,
  type ReportFinding,
  type ReportCriterion,
  type ReviewInput,
} from "@shared/report";
import { normalizeText } from "./reportNormalize";
import {
  runningText,
  sourceSegments,
  pageRole,
  noteContexts,
  relevantContexts,
  relevantToCriterion,
  documentRoles,
} from "./reportContext";
export { normalizeText } from "./reportNormalize";
export function isContentsPage(text: string) {
  const lines = text.split(/\n/).map(normalizeText).filter(Boolean);
  const normal = normalizeText(text);
  return (
    lines.some(l => /^(?:目录|contents|table of contents)$/.test(l)) ||
    /(?:gri|hkex|issb|sasb).{0,60}(?:content index|内容索引)/i.test(
      normal.slice(0, 1500)
    ) ||
    /^(?:gri对照表|可持续信息披露准则索引)/.test(
      lines.find(l => !/^\d+$/.test(l)) ?? ""
    ) ||
    /(?:gri standard.{0,40}disclosure.{0,50}references|topic code metrics references and remarks)/.test(
      normal.slice(0, 1500)
    ) ||
    (normal.match(/\b(?:[234]\d{2}-\d|[23]-\d{1,2}|[ab]\d{1,2}\.\d)\b/g) ?? [])
      .length >= 4 ||
    ((normal.match(/第[一二三四五六七八九十百]+条/g) ?? []).length >= 5 &&
      (normal.match(/绩效表/g) ?? []).length >= 3) ||
    lines.filter(l => /\.{3,}|…{2,}/.test(l)).length >=
      Math.max(5, lines.length * 0.55)
  );
}
export type EvidenceIndex = Array<{
  page: ReportPage;
  quote: string;
  normalized: string;
  id: string;
  table?: boolean;
  role: NonNullable<Evidence["role"]>;
  context: NonNullable<Evidence["context"]>;
}>;
export function buildEvidenceIndex(pages: ReportPage[]): EvidenceIndex {
  const repeated = runningText(pages);
  const roles = documentRoles(pages, repeated);
  const notes = new Map(pages.map(p => [p.page, noteContexts(p, repeated)]));
  return pages
    .filter(p => p.method !== "unread")
    .flatMap(page => {
      const segments = sourceSegments(page, repeated);
      const cleaned = segments.join("\n");
      if (isContentsPage(cleaned)) return [];
      const role = roles.get(page.page) ?? pageRole(cleaned);
      const result: EvidenceIndex = [];
      for (const segment of segments) {
        const headers = (page.tables ?? [])
          .map(t => segment.indexOf(t.columns.join(" | ")))
          .filter(n => n >= 0);
        const body = segment.slice(
          0,
          headers.length ? Math.min(...headers) : segment.length
        );
        for (let start = 0; start < body.length; start += 400) {
          const quote = body.slice(start, start + 600).trim();
          if (quote.length >= 20)
            result.push({
              page,
              quote,
              normalized: normalizeText(quote),
              id: `p${page.page}-s${page.text.indexOf(quote)}`,
              role:
                role === "body" && /案例|case study/i.test(quote)
                  ? "case"
                  : role,
              context: [],
            });
        }
      }
      for (const [t, table] of (page.tables ?? []).entries())
        for (const [r, row] of table.rows.entries()) {
          const quote = row.join(" | ");
          const context = [
            { page: page.page, quote: table.columns.join(" | ") },
            ...(notes.get(page.page) ?? []),
            ...(notes.get(page.page + 1) ?? []),
          ];
          if (quote.length >= 12)
            result.push({
              page,
              quote,
              normalized: normalizeText(quote),
              id: `p${page.page}-t${t}-r${r}`,
              table: true,
              role: "table",
              context: relevantContexts(context, quote),
            });
        }
      return result;
    });
}
export function findEvidence(
  index: EvidenceIndex,
  criterion: ReportCriterion,
  limit = criterion.id === "Carbon Emissions:1" ? 4 : 3
): Evidence[] {
  const terms = criterion.keywords.map(normalizeText);
  const numeric = /数据|人数|数量|面积|工伤率|量化|绩效|覆盖数据/.test(
    criterion.label
  );
  const specificity = (text: string) =>
    /目标/.test(criterion.label)
      ? Number(/20[23456]\d/.test(text)) +
        Number(/%|％|基准|下降|降低/.test(text)) * 2
      : 0;
  const candidates = index
    .map(block => ({
      ...block,
      hits: terms.filter(t => block.normalized.includes(t)).length,
    }))
    .filter(
      b =>
        b.hits > 0 &&
        relevantToCriterion(criterion, b.quote, b.role) &&
        (!criterion.groups ||
          criterion.groups.every(g =>
            g.some(t => b.normalized.includes(normalizeText(t)))
          ))
    )
    .sort(
      (a, b) =>
        (numeric ? Number(Boolean(b.table)) - Number(Boolean(a.table)) : 0) ||
        (a.role === "statement" ? 2 : a.role === "case" ? 1 : 0) -
          (b.role === "statement" ? 2 : b.role === "case" ? 1 : 0) ||
        Number(/仅为|园区/.test(a.context.map(c => c.quote).join(""))) -
          Number(/仅为|园区/.test(b.context.map(c => c.quote).join(""))) ||
        Number(/[\uFFFD\uE000-\uF8FF]/.test(a.quote)) -
          Number(/[\uFFFD\uE000-\uF8FF]/.test(b.quote)) ||
        specificity(b.normalized) - specificity(a.normalized) ||
        b.hits - a.hits ||
        (b.page.confidence ?? 100) - (a.page.confidence ?? 100) ||
        a.page.page - b.page.page
    );
  const chosen: typeof candidates = [];
  // Cover distinct requested elements before adding similar supplementary rows.
  const families =
    criterion.id === "Carbon Emissions:1"
      ? [
          /范围\s*[1一]|scope\s*1/,
          /范围\s*[2二]|scope\s*2/,
          /范围\s*[3三]|scope\s*3/,
        ]
      : criterion.id === "Health & Safety:4"
        ? [/员工|职工|employee/, /承包|外包|contractor/]
        : criterion.id === "Supply Chain Labor Standards:3"
          ? [/审核|审计|audit/, /整改|关闭|corrective/]
          : [];
  const add = (b: (typeof candidates)[number]) => {
    if (
      chosen.some(
        p =>
          p.id === b.id ||
          (p.normalized === b.normalized &&
            JSON.stringify(p.context.map(c => normalizeText(c.quote))) ===
              JSON.stringify(b.context.map(c => normalizeText(c.quote)))) ||
          (p.page.page === b.page.page &&
            (p.quote.includes(b.quote) ||
              b.quote.includes(p.quote) ||
              (!p.table &&
                !b.table &&
                Math.abs(
                  Number(p.id.split("-s")[1]) - Number(b.id.split("-s")[1])
                ) < 400)))
      )
    )
      return;
    chosen.push(b);
  };
  for (const family of families) {
    const b = candidates.find(b => family.test(b.normalized));
    if (b) add(b);
  }
  for (const b of candidates) {
    if (chosen.length >= limit) break;
    add(b);
  }
  return chosen.slice(0, limit).map(b => ({
    id: b.id,
    page: b.page.page,
    quote: b.quote,
    method: b.page.method as "text" | "ocr",
    confidence: b.page.confidence,
    role: b.role,
    context: b.context,
  }));
}
export function analyzeLocally(
  index: EvidenceIndex,
  pages: ReportPage[],
  issue: string
): ReportFinding[] {
  const incomplete = pages.some(
    p =>
      p.method === "unread" ||
      p.needsOcr ||
      (p.method === "ocr" && (p.confidence ?? 0) < 60)
  );
  return criteriaForIssue(issue).map(c => {
    const evidence = findEvidence(index, c);
    const weak =
      evidence.length > 0 &&
      evidence.every(e => e.method === "ocr" && (e.confidence ?? 0) < 60);
    const elements = checkElements(c, pages, evidence);
    return {
      criterionId: c.id,
      evidence,
      status:
        weak || (!evidence.length && incomplete)
          ? "insufficient"
          : evidence.length
            ? "related"
            : "not_found",
      summary: weak
        ? "OCR文字可信度较低，请查看原页核对。"
        : findingSummary(evidence, elements, c),
      gaps: reviewGaps(c, evidence, elements),
      elements,
    };
  });
}
const businessTerms: Record<string, string[]> = {
  "Real Estate Management & Development": [
    "房地产开发",
    "物业开发",
    "地产开发",
    "房地产管理",
    "物业投资",
    "物業投資",
    "物業發展",
    "property development",
    "real estate development",
    "property investment",
    "property trading",
    "real estate developer",
    "property developer",
  ],
  "Equity REITs": [
    "房地产投资信托",
    "房地产投资信託",
    "reits",
    "real estate investment trust",
  ],
  "Semiconductors & Semiconductor Equipment": [
    "光伏组件制造",
    "光伏组件生产",
    "太阳能组件制造",
    "硅片制造",
    "半导体制造",
    "晶圆制造",
    "semiconductor manufacturing",
    "solar module",
    "photovoltaic module",
    "芯片设计",
  ],
  "Independent Power & Renewable Electricity Producers": [
    "独立发电",
    "新能源发电业务",
    "可再生能源发电业务",
    "风力发电业务",
    "independent power producer",
    "renewable power generation",
  ],
  Banks: [
    "商业银行",
    "银行业务",
    "商业银行业务",
    "commercial bank",
    "banking services",
  ],
  Insurance: [
    "人寿保险",
    "财产保险",
    "保险业务",
    "life insurance",
    "insurance services",
  ],
  Automobiles: [
    "整车制造",
    "汽车制造",
    "汽车生产",
    "汽车企业",
    "汽车品牌",
    "乘用车",
    "商用车",
    "新能源车型",
    "automobile manufacturing",
    "vehicle manufacturing",
  ],
  "Auto Components": [
    "汽车零部件",
    "汽车配件制造",
    "auto components",
    "automotive parts",
  ],
  Software: [
    "软件开发",
    "软件产品",
    "软件服务",
    "software development",
    "software products",
  ],
  "IT Services": [
    "信息技术服务",
    "it服务",
    "it services",
    "information technology services",
  ],
  "Textiles, Apparel & Luxury Goods": [
    "羽绒服",
    "纺织服装",
    "服装品牌",
    "服装制造",
    "成衣制造",
    "apparel manufacturing",
    "down apparel",
    "luxury goods",
  ],
  "Electrical Equipment": [
    "低压电器",
    "断路器",
    "配电设备",
    "输配电",
    "光伏逆变器",
    "储能系统",
    "风电变流",
    "电气设备制造",
    "新能源电源设备",
    "电力电子转换设备",
    "photovoltaic inverter",
    "energy storage system",
    "electrical equipment manufacturing",
  ],
  Chemicals: [
    "尼龙66",
    "己二酸",
    "化学纤维",
    "高分子材料",
    "化工生产",
    "化学品制造",
    "化工产品",
    "chemical manufacturing",
    "chemical products",
  ],
  "Metals & Mining": [
    "矿产开采",
    "金属采矿",
    "矿业公司",
    "mining operations",
    "mineral extraction",
  ],
  "Construction & Engineering": [
    "建筑施工",
    "工程承包",
    "基础设施建设",
    "construction and engineering",
    "engineering contractor",
  ],
  Pharmaceuticals: [
    "药品研发",
    "药品生产",
    "制药业务",
    "pharmaceutical manufacturing",
    "drug development",
  ],
  "Food Products": [
    "食品生产",
    "食品制造",
    "food manufacturing",
    "food production",
  ],
  Airlines: ["航空运输", "航空公司", "airline", "air transport"],
};
export interface IndustryCandidate {
  industry: Industry;
  strength: "较强" | "待确认";
  evidence: Evidence;
  matched: string[];
}
export function identifyIndustries(pages: ReportPage[]): IndustryCandidate[] {
  // Prefer business descriptions and introductory pages; sustainability projects
  // (e.g. rooftop solar at a bank) must not determine a company's industry.
  const index = buildEvidenceIndex(pages);
  const business = index.filter(
    b =>
      b.page.page <= 12 ||
      /主营|主要业务|业务概况|公司概况|关于本|about (?:us|the company|this report)|principal business|business overview/i.test(
        normalizeText(b.quote)
      )
  );
  const candidates = getAllIndustries()
    .map(industry => {
      const terms = businessTerms[industry.name] ?? [
        industryNamesCN[industry.name] ?? "",
        industry.name.toLowerCase(),
      ];
      const matches = business
        .map(block => ({
          block,
          matched: terms.filter(t => {
            const term = normalizeText(t);
            if (term.length < 3) return false;
            if (/^[a-z &,-]+$/.test(term))
              return new RegExp(
                `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                "i"
              ).test(block.normalized);
            return block.normalized.includes(term);
          }),
        }))
        .filter(
          m =>
            m.matched.length &&
            (businessTerms[industry.name] ||
              /主营|主要业务|从事|专注|principal business|our business|company (?:provides|manufactures|develops)/i.test(
                normalizeText(m.block.quote)
              ))
        );
      const businessRank = (m: (typeof matches)[number]) =>
        m.matched.length +
        (/企业概况|公司概况|业务概况|主营|principal business|business overview/.test(
          m.block.normalized
        )
          ? 4
          : 0) -
        (m.block.role === "statement" ? 5 : 0);
      const best = matches.sort(
        (a, b) =>
          businessRank(b) - businessRank(a) ||
          a.block.page.page - b.block.page.page
      )[0];
      if (!best) return null;
      const explicit =
        /主营|主要业务|业务涵盖|从事|专注|principal business|we (?:manufacture|develop|provide)|our business/i.test(
          normalizeText(best.block.quote)
        );
      const strong =
        (best.matched.length >= 2 || explicit) &&
        !(
          best.block.page.method === "ocr" &&
          (best.block.page.confidence ?? 0) < 60
        );
      return {
        industry,
        strength: strong ? "较强" : "待确认",
        score: best.matched.length + (explicit ? 3 : 0),
        matched: best.matched,
        evidence: {
          id: best.block.id,
          page: best.block.page.page,
          quote: best.block.quote,
          method: best.block.page.method as "text" | "ocr",
          confidence: best.block.page.confidence,
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) as IndustryCandidate[];
}
function reviewEvidence(evidence: Evidence[]): Evidence[] {
  const result: Evidence[] = [];
  for (const e of evidence) {
    if (result.length >= 4) break;
    result.push({
      id: e.id,
      page: e.page,
      quote: e.quote,
      method: e.method,
      ...(e.confidence !== undefined ? { confidence: e.confidence } : {}),
    });
    for (const context of e.context ?? []) {
      if (result.length >= 4) break;
      if (
        result.some(r => r.page === context.page && r.quote === context.quote)
      )
        continue;
      result.push({
        id: `${e.id}-c${result.length}`,
        page: context.page,
        quote: context.quote,
        method: e.method,
      });
    }
  }
  return result;
}
export function makeReviewInput(
  industry: string,
  issue: string,
  findings: ReportFinding[],
  pages: ReportPage[]
): ReviewInput {
  return {
    version: REPORT_FRAMEWORK_VERSION,
    industry,
    issue,
    partialDocument: pages.some(
      p =>
        p.method === "unread" ||
        p.needsOcr ||
        (p.method === "ocr" && (p.confidence ?? 0) < 60)
    ),
    criteria: criteriaForIssue(issue).map(c => ({
      id: c.id,
      label: c.label,
      requirement: c.requirement,
      evidence: reviewEvidence(
        findings.find(f => f.criterionId === c.id)?.evidence ?? []
      ),
    })),
  };
}
export function createDemoReport(): ReportPage[] {
  return [
    {
      page: 1,
      method: "text",
      text: "虚构示例公司 · 星桥地产\n2025年度可持续发展报告（功能演示）\n公司概况\n本公司主营房地产开发与物业开发，主要业务包括住宅开发及商业物业管理。以下内容为测试数据，与真实企业无关。",
    },
    {
      page: 2,
      method: "text",
      text: "绿色建筑\n2025年，公司已有8个绿色认证项目，认证面积120万平方米；在营物业总面积200万平方米，绿色建筑认证面积比例60%。新建项目计划于2028年全部达到绿色建筑二星标准。\n职业健康与安全\n安全生产政策覆盖员工及所有承包商。安全委员会监督安全生产。2025年度员工因工死亡人数0人，承包商因工死亡人数0人。员工失时事故率LTIR为0.5，每百万工时计，承包商失时事故率尚未单列。",
    },
    {
      page: 3,
      method: "text",
      text: "商业道德\n董事会审计委员会监督反腐败与反贿赂政策，政策适用于全体员工及供应商。举报渠道支持匿名举报，公司禁止报复并保护举报人信息。2025年反腐培训覆盖95%的员工，未提供供应商培训覆盖率。\n产品安全与质量\n公司的质量管理体系取得ISO 9001认证，认证涵盖总部及3个项目。供应商质量审计覆盖直接供应商；本报告未列明间接供应商覆盖情况。2025年交付合格率为98%，无重大质量事故。",
    },
  ];
}
