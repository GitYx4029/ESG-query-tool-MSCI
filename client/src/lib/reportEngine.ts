import { getAllIndustries, industryNamesCN, type Industry } from "./esgData";
import { criteriaForIssue } from "./reportFramework";
import { checkElements } from "./reportChecks";
import {
  REPORT_FRAMEWORK_VERSION,
  type Evidence,
  type ReportPage,
  type ReportFinding,
  type ReportCriterion,
  type ReviewInput,
} from "@shared/report";
import { normalizeText } from "./reportNormalize";
export { normalizeText } from "./reportNormalize";
export function isContentsPage(text: string) {
  const lines = text.split(/\n/).filter(x => x.trim());
  const heading = text.slice(0, 700).replace(/\s+/g, " ");
  const indexHeading =
    /(?:GRI|HKEX|ISSB|SASB).{0,60}(?:content index|内容索引|內容索引)/i.test(
      heading
    );
  const continuedIndex =
    /(?:GRI Standard.{0,40}Disclosure.{0,50}References|Topic Code Metrics References and Remarks)/i.test(
      heading
    );
  const indexRows =
    (text.match(/\b(?:[234]\d{2}-\d|[23]-\d{1,2}|[AB]\d{1,2}\.\d)\b/g) ?? [])
      .length >= 4;
  return (
    /(?:^|\n)\s*(?:目录|目錄|contents|table of contents)\s*(?:\n|$)/i.test(
      text.slice(0, 700)
    ) ||
    indexHeading ||
    continuedIndex ||
    indexRows ||
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
}>;
export function buildEvidenceIndex(pages: ReportPage[]): EvidenceIndex {
  return pages
    .filter(p => p.method !== "unread" && !isContentsPage(p.text))
    .flatMap(page => {
      const result: EvidenceIndex = [];
      // Overlap keeps a table heading near data rows. Quotes always remain original substrings.
      for (let start = 0; start < page.text.length; start += 650) {
        const quote = page.text.slice(start, start + 900).trim();
        if (quote.length >= 20)
          result.push({
            page,
            quote,
            normalized: normalizeText(quote),
            id: `p${page.page}-s${start}`,
          });
      }
      for (const [t, table] of (page.tables ?? []).entries()) {
        for (const [r, row] of table.rows.entries()) {
          const quote = row.join(" | ");
          if (quote.length >= 15) result.push({page,quote,normalized:normalizeText(quote),id:`p${page.page}-t${t}-r${r}`,table:true});
        }
      }
      return result;
    });
}
export function findEvidence(
  index: EvidenceIndex,
  criterion: ReportCriterion,
  limit = 3
): Evidence[] {
  const terms = criterion.keywords.map(normalizeText);
  const numeric = /数据|人数|数量|面积|工伤率|量化|绩效|覆盖数据/.test(criterion.label);
  return index
    .map(block => ({
      ...block,
      hits: terms.filter(t => block.normalized.includes(t)).length,
    }))
    .filter(
      b =>
        b.hits > 0 &&
        (!criterion.groups ||
          criterion.groups.every(group =>
            group.some(t => b.normalized.includes(normalizeText(t)))
          ))
    )
    .sort(
      (a, b) =>
        (numeric ? Number(Boolean(b.table)) - Number(Boolean(a.table)) : 0) ||
        b.hits - a.hits ||
        (b.page.confidence ?? 100) - (a.page.confidence ?? 100) ||
        a.page.page - b.page.page
    )
    .filter(
      (b, i, arr) =>
        !arr
          .slice(0, i)
          .some(
            prev =>
              prev.page.page === b.page.page &&
              (prev.quote.includes(b.quote) || b.quote.includes(prev.quote) ||
                (!prev.table && !b.table && Math.abs(
                  Number(prev.id.split("-s")[1]) - Number(b.id.split("-s")[1])
                ) < 700))
          )
    )
    .slice(0, limit)
    .map(b => ({
      id: b.id,
      page: b.page.page,
      quote: b.quote,
      method: b.page.method as "text" | "ocr",
      confidence: b.page.confidence,
    }));
}
export function analyzeLocally(
  index: EvidenceIndex,
  pages: ReportPage[],
  issue: string
): ReportFinding[] {
  const incomplete = pages.some(
    p =>
      p.method === "unread" || (p.method === "ocr" && (p.confidence ?? 0) < 60)
  );
  return criteriaForIssue(issue).map(c => {
    const evidence = findEvidence(index, c);
    const weak =
      evidence.length > 0 &&
      evidence.every(e => e.method === "ocr" && (e.confidence ?? 0) < 60);
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
        : evidence.length
          ? "已定位相关原文；是否覆盖指标要求，需对照范围、年度与数据口径复核。"
          : incomplete
            ? "仍有未识别或低可信度页面，暂不能判断披露情况。"
            : "在本次可检索文本中未找到相关证据；可补充关键词或其他报告复核。",
      gaps: [],
      elements: checkElements(c, pages),
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
    "羽绒服", "纺织服装", "服装品牌", "服装制造", "成衣制造", "apparel manufacturing", "down apparel", "luxury goods",
  ],
  "Electrical Equipment": [
    "光伏逆变器", "储能系统", "风电变流", "电气设备制造", "新能源电源设备", "电力电子转换设备", "photovoltaic inverter", "energy storage system", "electrical equipment manufacturing",
  ],
  Chemicals: [
    "尼龙66", "己二酸", "化学纤维", "高分子材料",
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
      const best = matches.sort(
        (a, b) =>
          b.matched.length - a.matched.length ||
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
        (p.method === "ocr" && (p.confidence ?? 0) < 60)
    ),
    criteria: criteriaForIssue(issue).map(c => ({
      id: c.id,
      label: c.label,
      requirement: c.requirement,
      evidence: findings.find(f => f.criterionId === c.id)?.evidence ?? [],
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
