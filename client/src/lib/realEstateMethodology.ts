/**
 * 房地产开发行业 MSCI ESG 方法学解析数据
 * 
 * 数据来源：
 * - MSCI ESG Ratings Methodology: Opportunities in Green Building Key Issue (October 2023)
 * - MSCI ESG Ratings Methodology: Health & Safety Key Issue (October 2023)
 * - MSCI ESG Ratings Methodology: Product Safety & Quality Key Issue (October 2023)
 * - MSCI ESG Ratings Methodology: Board Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Pay Key Issue
 * - MSCI ESG Ratings Methodology: Ownership & Control Key Issue
 * - MSCI ESG Ratings Methodology: Accounting Key Issue
 * - MSCI ESG Ratings Methodology: Business Ethics Key Issue (August 2025)
 * - MSCI ESG Ratings Methodology: Tax Transparency Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology (April 2024) - 总体框架
 * 
 * 所有定义严格来自MSCI方法学PDF原文，指标名称与CMSK ESG Ratings Drilldown报告完全匹配。
 * 对于方法学中未直接定义的合并指标，标注来源并给出基于方法学框架的解释。
 */

export interface MethodologyTooltip {
  nameCN: string;
  nameEN: string;
  definition: string;
  scoringCriteria: string;
  dataSource: string;
  scoreRange: string;
  /** 是否在方法学PDF中有直接对应的定义 */
  directlyFromMethodology: boolean;
  /** 如果非直接来源，说明推断依据 */
  sourceNote?: string;
}

export interface IssueMethodology {
  issueEN: string;
  issueCN: string;
  type: "environment" | "social" | "governance";
  methodologyUrl: string;
  overview: string;
  assessmentFramework: string;
  managementIndicators: Record<string, MethodologyTooltip>;
  performanceIndicators: Record<string, MethodologyTooltip>;
}

/**
 * 房地产开发行业完整方法学数据
 * Key = 议题的标准化key（小写下划线）
 */
export const realEstateMethodology: Record<string, IssueMethodology> = {

  // ============================================================
  // ENVIRONMENT PILLAR
  // ============================================================

  "opportunities_in_green_building": {
    issueEN: "Opportunities in Green Building",
    issueCN: "绿色建筑机遇",
    type: "environment",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Opportunities+in+Green+Building+Key+Issue.pdf",
    overview: "评估房地产企业在绿色建筑方面的管理实践和绩效表现。管理得分基于实践得分（Practices Score）和绩效得分（Performance Score）的加权平均，实践得分采用0-10分制，10分代表最佳实践，0分代表缺乏证据。",
    assessmentFramework: "管理得分 = (实践得分 + 绩效得分) / 2。实践得分评估企业绿色建筑承诺的广度和深度；绩效得分评估企业在绿色认证建筑比例、碳排放、水资源消耗等量化指标上相对于同行的表现。争议扣分（0-5分）从管理得分中扣除。",
    managementIndicators: {
      // === 以下7个指标与CMSK Excel完全匹配 ===
      "Evidence of urban revitalization developments": {
        nameCN: "城市更新开发项目证据",
        nameEN: "Evidence of urban revitalization developments",
        definition: "评估企业进行城市更新开发的水平。方法学原文定义：'The level of urban redevelopment that the company undertakes.'最佳实践是有证据表明企业致力于改善社区参与度或物理城市环境质量的举措，尤其是在有经济或社会需求的社区，且范围超出单个建筑或地块。仅适用于房地产企业。",
        scoringCriteria: "该指标为分级评估，最佳实践为有证据表明企业致力于改善社区参与度或物理城市环境质量的举措，且范围超出单个建筑或地块。具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、年报、项目公告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Use of green or triple-net leases": {
        nameCN: "绿色租赁或三净租赁的使用",
        nameEN: "Use of green or triple-net leases",
        definition: "方法学原文定义：'Indicates whether the company provides evidence of implementing green leases or triple-net leases in its tenancies.'评估企业是否有证据表明在其租赁中实施了绿色租赁或三净租赁。仅适用于房地产企业。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、租赁合同披露、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Green certification commitments for greenfield developments": {
        nameCN: "新建项目绿色认证承诺",
        nameEN: "Green certification commitments for greenfield developments",
        definition: "方法学原文定义：'The company's green building strategy for greenfield sites, including whether there is a clear statement on avoiding greenfield sites, the company only develops green-certified properties on greenfield developments, or we found no evidence of green certification for greenfield developments.'评估企业在新建（greenfield）项目上的绿色建筑策略。仅适用于房地产企业。",
        scoringCriteria: "该指标为分级评估，最佳实践为企业仅在新建项目上开发绿色认证物业，或有明确声明避免新建项目。具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、开发策略文件",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Evidence of flexible or mixed-use properties in portfolio": {
        nameCN: "投资组合中灵活或混合用途物业的证据",
        nameEN: "Evidence of flexible or mixed-use properties in portfolio",
        definition: "方法学原文定义：'Indicates whether the company provides evidence of flexible or mixed-use properties in its property portfolio.'评估企业是否有证据表明其物业组合中包含灵活用途或混合用途物业。仅适用于房地产企业。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、年报、物业组合披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Green building commitment extends to existing buildings in portfolio (in addition to new buildings)": {
        nameCN: "绿色建筑承诺延伸至存量建筑（不仅限于新建）",
        nameEN: "Green building commitment extends to existing buildings in portfolio (in addition to new buildings)",
        definition: "【方法学PDF中未以此名称直接定义】该指标评估企业的绿色建筑承诺是否不仅覆盖新建项目，还延伸至投资组合中的现有建筑（包括翻新和改造）。方法学中与之最密切相关的指标是'Extent of green building certification commitments in portfolio or development pipeline'（评估投资组合或开发管线中被绿色建筑承诺覆盖的比例）以及'Level of green building commitment relative to national standards'（评估企业翻新和新建项目的绿色建筑认证水平）。本指标是对绿色认证承诺覆盖范围（新建 vs 存量）的进一步细分。",
        scoringCriteria: "该指标为分级评估，具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档（参考'Extent of green building certification commitments in portfolio or development pipeline'相关标准）。",
        dataSource: "企业ESG报告、可持续发展报告、绿色建筑策略文件",
        scoreRange: "0-10分",
        directlyFromMethodology: false,
        sourceNote: "方法学PDF中未直接定义此指标名称。推断基于'Extent of green building certification commitments in portfolio or development pipeline'和'Level of green building commitment relative to national standards'（后者评估翻新和新建项目的认证水平）。"
      },
      "Extent of commercial arrangements to improve property environmental performance": {
        nameCN: "改善物业环境绩效的商业安排范围",
        nameEN: "Extent of commercial arrangements to improve property environmental performance",
        definition: "方法学原文定义：'Indicates whether the company provides evidence of implementing commercial agreements to incentivize tenants and property managers to improve property environmental performance.'注：方法学PDF中的原始指标名称为'Extent of commercial arrangements to improve or maintain property environmental performance'，包含'or maintain'（或维持），CMSK报告中省略了'or maintain'部分。仅适用于房地产企业。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、物业管理协议披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "方法学PDF中原始名称为'Extent of commercial arrangements to improve or maintain property environmental performance'，CMSK报告中省略了'or maintain'。"
      },
      "Extent of green building certification commitments in portfolio or development pipeline": {
        nameCN: "投资组合或开发管线中绿色建筑认证承诺的范围",
        nameEN: "Extent of green building certification commitments in portfolio or development pipeline",
        definition: "方法学原文定义：'The portion of the company's portfolio or development projects that are covered by its green building commitments.'评估企业投资组合或开发项目中被绿色建筑承诺覆盖的比例。仅适用于房地产企业。",
        scoringCriteria: "该指标为分级评估，评估企业投资组合或开发管线中被绿色建筑承诺覆盖的比例。具体评分标准详见MSCI Opportunities in Green Building Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、开发管线披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      }
    },
    performanceIndicators: {
      "Green Building Certification Performance": {
        nameCN: "绿色建筑认证绩效",
        nameEN: "Green Building Certification Performance",
        definition: "评估企业物业组合中绿色认证建筑的比例。方法学中列出的代表性绩效指标包括：(1) 投资组合中绿色认证建筑的百分比（按建筑数量）；(2) 投资组合中绿色认证空间的百分比（按面积，如百万平方英尺）。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平。绩效得分评估企业在绿色建筑指标上相对于同行的表现。",
        dataSource: "企业ESG报告、绿色建筑认证机构数据（LEED、BREEAM、Green Star等）",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Percentage of green certified buildings in portfolio (by number of buildings); Percentage of green-certified space in portfolio (by area)'描述。"
      },
      "Carbon Emission Performance Score": {
        nameCN: "碳排放绩效得分",
        nameEN: "Carbon Emission Performance Score",
        definition: "评估企业的碳排放绩效表现。方法学中将碳排放（Carbon emissions）列为绿色建筑绩效的代表性指标之一。评估企业在碳排放指标上相对于行业同行的表现。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平（即最低碳排放强度）。评估维度包括Scope 1+2碳排放强度及其与行业同行的对比。",
        dataSource: "企业ESG报告、CDP碳披露、年报",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Carbon emissions'描述，属于绿色建筑绩效得分的组成部分。"
      }
    }
  },

  // ============================================================
  // SOCIAL PILLAR
  // ============================================================

  "health_and_safety": {
    issueEN: "Health & Safety",
    issueCN: "健康与安全",
    type: "social",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Health+%26+Safety+Key+Issue.pdf",
    overview: "评估企业对工作场所安全的管理以及其运营所在行业和地区的工作场所安全标准。管理得分基于治理与策略得分（Governance & Strategy Score）、目标得分（Targets Score）和绩效得分（Performance Score）的加权平均。",
    assessmentFramework: "管理得分 = f(治理与策略得分, 目标得分, 绩效得分) - 争议扣分。治理与策略得分评估H&S政策范围、审计、高管责任等；目标得分评估安全改善目标的设定；绩效得分评估工伤率、失时事故率、死亡人数等量化指标相对于同行的表现。",
    managementIndicators: {
      // === 以下8个指标与CMSK Excel完全匹配 ===
      "Scope of health and safety policy": {
        nameCN: "健康与安全政策的范围",
        nameEN: "Scope of health and safety policy",
        definition: "方法学原文定义：'Indicates whether the company's health and safety policy applies to all operations or select operations.'评估企业的健康与安全政策是适用于所有运营还是仅适用于部分运营。",
        scoringCriteria: "该指标为分级评估，最佳实践为H&S政策适用于所有运营。具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、健康安全政策文件、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Health and safety policy and practices are audited": {
        nameCN: "健康与安全政策和实践是否经过审计",
        nameEN: "Health and safety policy and practices are audited",
        definition: "方法学原文定义：'Indicates whether audits are part of the company's health and safety management approach.'评估审计是否是企业健康与安全管理方法的一部分。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、审计报告、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Applicability of health and safety policy to contractors": {
        nameCN: "健康与安全政策对承包商的适用性",
        nameEN: "Applicability of health and safety policy to contractors",
        definition: "方法学原文定义：'Indicates whether contractors are held to the same health and safety policies as employees.'评估承包商是否被要求遵守与员工相同的健康与安全政策。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、承包商管理政策、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Health and safety performance is a factor in CEO compensation": {
        nameCN: "健康与安全绩效是否纳入CEO薪酬考核",
        nameEN: "Health and safety performance is a factor in CEO compensation",
        definition: "方法学原文定义：'Indicates whether CEO compensation is linked to health and safety performance.'评估CEO薪酬是否与健康与安全绩效挂钩。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业年报、薪酬委员会报告、代理声明书",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Executive body responsible for H&S strategy and performance": {
        nameCN: "负责H&S策略和绩效的高管机构",
        nameEN: "Executive body responsible for H&S strategy and performance",
        definition: "方法学中将此指标细分为四个独立评估维度：(1) 'Executive body is responsible for health and safety strategy'——是否有高管机构对H&S策略和绩效负有明确监督责任；(2) 'CEO is responsible for health and safety strategy'——CEO是否对H&S策略有明确责任；(3) 'Senior executive or executive committee is responsible for health and safety strategy'——是否有高级管理人员或执行委员会负责H&S；(4) 'Board-level committee is responsible for health and safety strategy'——是否有董事会层面的委员会负责H&S。CMSK报告中将这四个维度合并为一个综合指标。",
        scoringCriteria: "该指标为分级评估（0-10分），评估层级越高（如CEO+高管团队均有明确责任），得分越高。10分表示CEO负责H&S策略。具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、公司治理报告、年报",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "方法学中分为4个独立指标（Executive body / CEO / Senior executive or committee / Board-level committee），CMSK报告中合并为一个综合评估指标。"
      },
      "Evaluation of Health & Safety Certification": {
        nameCN: "健康与安全认证评估",
        nameEN: "Evaluation of Health & Safety Certification",
        definition: "方法学中对应两个指标：(1) 'Percentage of operations having health and safety management systems certified to recognized standard'——通过OHSAS 18001、ISO 45001或GB/T28001标准认证的运营百分比；(2) 'Evidence of health and safety management system certified to recognized standard'——是否有证据表明企业部分运营拥有经认证的H&S管理体系。CMSK报告中将这两个维度合并为一个综合评估指标。",
        scoringCriteria: "该指标为分级评估（0-10分），评估企业H&S管理体系的认证程度（如ISO 45001认证覆盖的运营比例）。具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、ISO认证证书、安全管理报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "方法学中分为两个指标：'Percentage of operations having H&S management systems certified to recognized standard'和'Evidence of H&S management system certified to recognized standard'。CMSK报告中合并为一个综合评估指标。"
      },
      "Contractors included in disclosed health and safety metrics": {
        nameCN: "披露的健康与安全指标中是否包含承包商",
        nameEN: "Contractors included in disclosed health and safety metrics",
        definition: "方法学原文定义：'Indicates whether contractor health and safety performance is measured and disclosed in the same or similar manner as employees.'评估企业是否以与员工相同或类似的方式衡量和披露承包商的健康与安全绩效。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、GRI报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Target to improve health and safety performance": {
        nameCN: "改善健康与安全绩效的目标",
        nameEN: "Target to improve health and safety performance",
        definition: "方法学原文定义：'The type of target set by the company to reduce employee accidents and fatalities. Best practice is to set a quantifiable (non-zero) accident reduction target that includes contractors and employees.'评估企业为减少员工事故和死亡而设定的目标类型。最佳实践是设定包含承包商和员工的可量化（非零）事故减少目标。",
        scoringCriteria: "该指标为分级评估，最佳实践为设定包含承包商和员工的可量化（非零）事故减少目标。具体评分标准详见MSCI Health & Safety Key Issue方法学文档。",
        dataSource: "企业ESG报告、可持续发展报告、安全管理报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      }
    },
    performanceIndicators: {
      // === 以下3个指标与CMSK Excel完全匹配 ===
      "Total Recordable Injury Rate Score": {
        nameCN: "总可记录工伤率得分",
        nameEN: "Total Recordable Injury Rate Score",
        definition: "评估企业的总可记录工伤率（TRIR）相对于行业同行的表现。总可记录工伤率是衡量工作场所安全的核心指标，包括所有需要医疗处理、限制工作或导致缺勤的工伤事件。方法学中将其列为代表性绩效指标之一。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平（即最低工伤率）。",
        dataSource: "企业ESG报告、OSHA记录、GRI报告",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Total recordable injury rate'描述。"
      },
      "Lost Time Incident Rate Score": {
        nameCN: "失时事故率得分",
        nameEN: "Lost Time Incident Rate Score",
        definition: "评估企业的失时事故率（LTIR）相对于行业同行的表现。失时事故率衡量导致员工无法在下一个计划工作日正常工作的工伤事件频率。方法学中将其列为代表性绩效指标之一。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平（即最低失时事故率）。",
        dataSource: "企业ESG报告、OSHA记录、GRI报告",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Lost-time incident rate'描述。"
      },
      "Fatalities Score": {
        nameCN: "死亡事故得分",
        nameEN: "Fatalities Score",
        definition: "评估企业的员工和承包商死亡事故情况相对于行业同行的表现。方法学中将'Employee and contractor fatalities'列为代表性绩效指标之一。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平（即零死亡或最低死亡率）。方法学中还考虑行业死亡率（基于OSHA美国数据和HSE英国数据）和国家死亡率（基于ILO数据）。",
        dataSource: "企业ESG报告、OSHA记录、HSE记录、ILO数据",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Employee and contractor fatalities'描述。"
      }
    }
  },

  "product_safety_and_quality": {
    issueEN: "Product Safety & Quality",
    issueCN: "产品安全与质量",
    type: "social",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Product+Safety+%26+Quality+Key+Issue.pdf",
    overview: "评估企业面临的产品召回或产品安全问题的风险暴露、供应链和采购体系的强度、制造质量管理以及负责任营销实践。管理得分基于制造与处理得分、营销广告与销售得分、供应链与采购得分以及绩效得分的加权平均。",
    assessmentFramework: "管理得分 = f(制造与处理得分, 营销广告与销售得分, 供应链与采购得分, 绩效得分) - 争议扣分。争议类别包括：产品安全与质量争议、客户欺诈与计费争议、虚假营销争议。争议扣分范围0-5分。",
    managementIndicators: {
      // === 以下7个指标与CMSK Excel完全匹配 ===
      "Policy on responsible marketing, advertising and sales": {
        nameCN: "负责任营销、广告和销售政策",
        nameEN: "Policy on responsible marketing, advertising and sales",
        definition: "方法学原文定义：'Indicates whether the company has explicitly stated a policy on responsible marketing and advertising, and the ethical promotion of its products.'评估企业是否明确声明了关于负责任营销和广告以及道德推广其产品的政策。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、营销政策文件、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "属于方法学中'Marketing, Advertising and Sales Score'子类别。"
      },
      "Scope of supplier training on quality standards": {
        nameCN: "供应商质量标准培训范围",
        nameEN: "Scope of supplier training on quality standards",
        definition: "方法学原文定义：'The extent to which the company trains suppliers on quality standards, requirements and processes. Best practice is to train all suppliers.'评估企业对供应商进行质量标准、要求和流程培训的范围。最佳实践是对所有供应商进行培训。",
        scoringCriteria: "该指标为分级评估，最佳实践为对所有供应商进行质量标准培训。具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、供应链管理报告、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "属于方法学中'Supply Chain and Sourcing Score'子类别。"
      },
      "Measures and reports quantitative indicators related to service quality performance or customer protection": {
        nameCN: "衡量并报告与服务质量绩效或客户保护相关的量化指标",
        nameEN: "Measures and reports quantitative indicators related to service quality performance or customer protection",
        definition: "方法学原文定义：'Indicates whether the company measures and reports quantitative indicators related to service quality performance or customer protection (e.g., clinical quality reports, customer surveys).'评估企业是否衡量并报告与服务质量绩效或客户保护相关的量化指标。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、客户满意度报告、年报",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "属于方法学中'Manufacturing and Handling Score'子类别。"
      },
      "Audit/control procedures on responsible marketing": {
        nameCN: "负责任营销的审计/控制程序",
        nameEN: "Audit/control procedures on responsible marketing",
        definition: "方法学原文定义：'Indicates whether the company audits its own operations to assess compliance with its responsible marketing policies and ethical product promotion.'评估企业是否对自身运营进行审计，以评估其对负责任营销政策和道德产品推广的合规情况。",
        scoringCriteria: "该指标为是/否型评估，具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、内部审计报告、合规报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "属于方法学中'Marketing, Advertising and Sales Score'子类别。"
      },
      "Scope of employee training on product quality": {
        nameCN: "员工产品质量培训范围",
        nameEN: "Scope of employee training on product quality",
        definition: "方法学原文定义：'The scope of the company's employee training on product safety and quality. Best practice is for all employees to receive training on product quality standards.'评估企业员工产品安全和质量培训的范围。最佳实践是所有员工都接受产品质量标准培训。",
        scoringCriteria: "该指标为分级评估，最佳实践为所有员工接受产品质量标准培训。具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、培训记录、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "属于方法学中'Manufacturing and Handling Score'子类别。"
      },
      "Certification program for suppliers": {
        nameCN: "供应商认证计划",
        nameEN: "Certification program for suppliers",
        definition: "方法学中对应'Supply Chain and Sourcing Score'子类别下的多个独立指标的综合评估：(1) 'General statement on supplier certification of quality procedures'——是否有关于供应商质量认证的一般性声明；(2) 'Tier 1 - Direct supplier facilities and processes certified by company employees or third-party auditors'——直接供应商（Tier 1）设施和流程是否经公司员工或第三方审计师认证；(3) 'Tier 2 - Indirect/sub supplier facilities and processes certified'——间接/分包供应商（Tier 2）的认证；(4) 'Tier 3 - Ingredients/raw materials checked for quality on a regular basis'——原材料/成分（Tier 3）是否定期进行质量检查；(5) 'Membership in recognized industry-wide partnership(s) on supply chain risk evaluation and mitigation'——是否参与行业供应链风险评估和缓解合作伙伴关系。CMSK报告中将这五个维度合并为一个综合指标。",
        scoringCriteria: "该指标为分级评估（综合Tier 1-3供应商认证及行业合作伙伴关系参与情况），具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、供应链管理报告、第三方审计报告",
        scoreRange: "0-10分",
        directlyFromMethodology: false,
        sourceNote: "方法学中分为5个独立指标：General statement on supplier certification, Tier 1/2/3 supplier certification, Membership in industry partnerships。CMSK报告中合并为一个综合评估指标。"
      },
      "Certification to product safety/quality standard": {
        nameCN: "产品安全/质量标准认证",
        nameEN: "Certification to product safety/quality standard",
        definition: "方法学中对应两个指标的综合评估：(1) 'Extent of certification to a widely accepted product safety/quality standard'——方法学原文定义：'Indicates whether the company certifies its own operations with a widely accepted product safety/quality standard (e.g., HACCP, ISO 9001, ISO/TS 16949, ISO 13485 or equivalent).'；(2) 'Extent of certification to an internally developed product safety/quality standard'——方法学原文定义：'Indicates whether the company certifies its own operations with an internally developed product safety/quality standard.'CMSK报告中将这两个维度合并为一个综合指标。",
        scoringCriteria: "该指标为分级评估（0-10分），综合评估企业通过广泛接受标准认证和内部标准认证的程度。具体评分标准详见MSCI Product Safety & Quality Key Issue方法学文档。",
        dataSource: "企业ESG报告、ISO认证证书、质量管理报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "方法学中分为两个指标：'Extent of certification to a widely accepted standard'和'Extent of certification to an internally developed standard'。CMSK报告中合并为一个综合评估指标。"
      }
    },
    performanceIndicators: {
      "Warranty Performance Score": {
        nameCN: "保修绩效得分",
        nameEN: "Warranty Performance Score",
        definition: "评估企业的保修支出绩效相对于行业同行的表现。方法学中将保修支出（Warranty payments: Amount in USD millions, warranty payments/sales）列为代表性绩效指标之一。此外，绩效评估还包括产品召回（Recalls: Severe Class I / Moderate Class II / Minor Class III）、监管警告（Regulatory warnings）、FDA Form 483等指标。",
        scoringCriteria: "0-10分制，基于行业同行百分位排名。10分表示最高绩效水平（即最低保修支出比例或最少产品质量问题）。",
        dataSource: "企业年报、保修支出披露、监管机构记录（FDA、MHRA等）",
        scoreRange: "0-10分，基于行业百分位排名",
        directlyFromMethodology: true,
        sourceNote: "方法学中以'Representative performance metrics: Warranty payments (Amount, warranty payments/sales)'描述。对于房地产行业，主要关注物业质量保修和维修支出。"
      }
    }
  },

  // ============================================================
  // GOVERNANCE PILLAR
  // ============================================================

  "corporate_governance": {
    issueEN: "Corporate Governance",
    issueCN: "公司治理",
    type: "governance",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Board+Key+Issue.pdf",
    overview: "评估企业的公司治理结构和实践。公司治理主题（Corporate Governance Theme）包含四个独立的Key Issues：Board（董事会）、Pay（薪酬）、Ownership & Control（所有权与控制）、Accounting（会计）。每个Key Issue都有独立的方法学PDF和评分体系。治理类议题采用flag-based评分方式——每个Key Metric评估是否存在治理缺陷，被标记的缺陷会导致扣分。",
    assessmentFramework: "公司治理主题得分 = 10 - Σ(所有Key Issue扣分)。每个Key Issue的扣分 = Σ(该Key Issue下各Key Metric扣分)。最终0-10分的主题得分通过分数转换公式计算得出。四个Key Issue各有独立的0-10分Key Issue Score。",
    managementIndicators: {
      "Board": {
        nameCN: "董事会",
        nameEN: "Board",
        definition: "Board是公司治理主题下的独立Key Issue（有独立方法学PDF：Board Key Issue, March 2026）。评估董事会的领导力、独立性、有效性、技能与多元化、审计监督、薪酬监督和提名流程监督。方法学中包含8个评估类别和40+个Key Metrics，主要包括：Board Leadership（主席独立性、CEO/主席合一、领导力问题）、Board Independence（董事会多数独立于管理层、独立于其他利益、关联交易）、Board Effectiveness（被标记董事、过度兼职、投票反对、董事会规模、出席率）、Board Skills & Diversity（董事会固化、女性董事比例、风险管理专业知识）、Audit Oversight（审计委员会独立性和专业能力）、Pay Oversight（薪酬委员会独立性）、Nomination Process Oversight（提名委员会独立性）、Strategic Oversight（破产/清算、债务契约问题、融资困难、资本管理问题、证券违规、退市风险、高管不当行为等）。",
        scoringCriteria: "Flag-based评分。起始分10分，每个被标记的治理缺陷扣除相应分数。典型扣分示例：Independent Chair（-0.1）、Combined CEO/Chair（-0.2）、No Independent Directors（-1.4）、Leadership Concerns（-0.2至-0.7）、Not 30% Female Directors（-0.1）、Board Attendance Failures（-0.2）、Entrenched Board（-0.2至-0.7）、Bankruptcy or Liquidation（-2.0）等。",
        dataSource: "企业年报、公司治理报告、股东大会记录、证券交易所披露、代理声明书",
        scoreRange: "0-10分，起始10分逐项扣减",
        directlyFromMethodology: true,
        sourceNote: "方法学PDF（Board Key Issue, March 2026）中详细定义了8个类别、40+个Key Metrics及其扣分标准。Board Key Issue还包含Strategic Oversight类别（破产、债务、证券违规等高影响事件）。"
      },
      "Pay": {
        nameCN: "薪酬",
        nameEN: "Pay",
        definition: "Pay是公司治理主题下的独立Key Issue（有独立方法学PDF：Pay Key Issue）。评估高管薪酬结构的合理性、与业绩的关联度以及薪酬治理实践。方法学中包含5个评估类别：(1) Pay Performance Alignment（薪酬绩效一致性）——CEO股权政策、长期/短期薪酬绩效、薪酬与可持续性挂钩、追回条款、签约奖金、薪酬争议、Say-on-Pay投票等；(2) Pay Figures（薪酬数据）——高管薪酬披露、CEO总薪酬（实现/授予/固定/津贴/递延/养老金）、内部薪酬公平性；(3) Severance & Change of Control（离职与控制权变更）——黄金降落伞、离职归属；(4) Equity Plan Dilution（股权计划稀释）——稀释问题、授予速率；(5) Non-executive Director Pay（非执行董事薪酬）——董事股权政策。",
        scoringCriteria: "Flag-based评分。起始分10分，每个被标记的薪酬治理缺陷扣除相应分数。典型扣分：Pay Controversy（-0.2至-0.7）、Significant Vote Against Pay Practices（-0.2至-0.7）、Golden Parachutes（-0.2至-0.7）、Dilution Concerns（-0.2至-0.7）等。",
        dataSource: "企业年报、薪酬委员会报告、代理声明书、股东大会投票记录",
        scoreRange: "0-10分，起始10分逐项扣减",
        directlyFromMethodology: true,
        sourceNote: "Pay是独立的Key Issue，有独立的方法学PDF，包含5个类别和20+个Key Metrics。"
      },
      "Ownership & Control": {
        nameCN: "所有权与控制",
        nameEN: "Ownership & Control",
        definition: "Ownership & Control是公司治理主题下的独立Key Issue（有独立方法学PDF：Ownership & Control Key Issue）。评估企业的所有权结构是否存在可能损害少数股东利益的安排。方法学中包含6个评估类别：(1) Ownership Structure（所有权结构）——控股股东、控股股东问题、分散所有权问题、交叉持股、跟踪股票、可变利益实体；(2) One Share, One Vote（一股一票）——多重股权类别、不同投票权、投票权限制、政府干预问题；(3) Control Mechanisms（控制机制）——毒丸计划；(4) Shareholder Rights（股东权利）——章程修改、股东召集会议权、Say-on-Pay政策、保密投票；(5) Director Elections（董事选举）——代理投票权、年度董事选举、分级董事会、多数投票制、累积投票制、无故免职董事；(6) Takeover Provisions（收购条款）——选区条款、商业合并条款、公平出价条款。",
        scoringCriteria: "Flag-based评分。起始分10分，每个被标记的所有权治理缺陷扣除相应分数。典型扣分：Multiple Equity Classes with Different Voting Rights（-0.2至-0.7）、Poison Pill（-0.2至-0.7）、Controlling Shareholder Concerns（-0.2至-0.7）等。",
        dataSource: "企业章程、年报、证券监管文件、股权结构披露",
        scoreRange: "0-10分，起始10分逐项扣减",
        directlyFromMethodology: true,
        sourceNote: "Ownership & Control是独立的Key Issue，有独立的方法学PDF，包含6个类别和20+个Key Metrics。"
      },
      "Accounting": {
        nameCN: "会计",
        nameEN: "Accounting",
        definition: "Accounting是公司治理主题下的独立Key Issue（有独立方法学PDF：Accounting Key Issue）。评估企业财务报告的质量和审计师独立性。方法学中包含2个评估类别：(1) Accounting Events（会计事件）——Accounting Investigations（会计调查，评估企业是否涉及会计相关调查或诉讼）、Auditor Report Concerns（审计报告问题，如持续经营意见、保留意见）、Internal Controls（内部控制缺陷）、Restatements or Special Charges（财务重述或特殊费用）、Late Filings（延迟申报）；(2) Auditor Independence（审计师独立性）——Auditor Independence（审计师独立性，评估非审计费用占比等）、Auditor Tenure（审计师任期，评估审计师轮换情况）。",
        scoringCriteria: "Flag-based评分。起始分10分，每个被标记的会计/审计治理缺陷扣除相应分数。典型扣分：Accounting Investigations（-0.2至-0.7）、Auditor Report Concerns（-0.2至-0.7）、Internal Controls（-0.2至-0.7）、Restatements（-0.2至-0.7）、Late Filings（-0.2至-0.7）等。",
        dataSource: "审计报告、企业年报、证券监管文件、财务报表附注",
        scoreRange: "0-10分，起始10分逐项扣减",
        directlyFromMethodology: true,
        sourceNote: "Accounting是独立的Key Issue，有独立的方法学PDF，包含2个类别（Accounting Events和Auditor Independence）共7个Key Metrics。注意：Strategic Oversight类别（破产、债务契约、证券违规等）属于Board Key Issue而非Accounting。"
      }
    },
    performanceIndicators: {}
  },

  "corporate_behavior": {
    issueEN: "Corporate Behavior",
    issueCN: "企业行为",
    type: "governance",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Business+Ethics+Key+Issue.pdf",
    overview: "评估企业的商业道德和税务透明度。企业行为主题（Corporate Behavior Theme）包含两个独立的Key Issues：Business Ethics（商业道德）和Tax Transparency（税务透明度）。Business Ethics采用flag-based评分方式，评估企业在反腐败、合规管理等方面的治理实践；Tax Transparency评估企业的税务争议和估计税差。",
    assessmentFramework: "企业行为主题得分 = 10 - Σ(Business Ethics扣分 + Tax Transparency扣分)。Business Ethics评分基于Policies & Practices（政策与实践）和Risk & Controversies（风险与争议）两个类别。Tax Transparency评分基于税务争议和估计税差的组合评估。",
    managementIndicators: {
      "Business Ethics": {
        nameCN: "商业道德",
        nameEN: "Business Ethics",
        definition: "Business Ethics是企业行为主题下的独立Key Issue（有独立方法学PDF：Business Ethics Key Issue, August 2025）。评估企业的商业道德管理体系。方法学中包含以下Key Metrics：Policies & Practices类别——(1) Oversight of Ethics Issues（道德问题监督：董事会委员会/C-suite/执行委员会 0分，特别工作组/风险官 -0.7分，无证据 -1.4分）；(2) Bribery and Anti-corruption Policy（反腐败政策：详细正式政策 0分，一般性声明 -0.7分，无证据 -1.4分）；(3) Anti-Corruption Policy for Suppliers（供应商反腐政策：所有供应商需有反腐政策和合规验证 0分，所有供应商需有反腐政策 -0.7分，覆盖部分供应商 -1.0分，无证据 -1.4分）；(4) Whistleblower Protection（举报人保护：有保护政策 0分，无证据 -1.4分）；(5) Employee Training on Ethical Standards（员工道德培训：覆盖所有员工含兼职和承包商 0分，覆盖全职员工 -0.7分，一般性声明 -1.0分，无证据 -1.4分）；(6) Regular Audits of Ethical Standards（道德审计：所有运营每三年至少一次 0分，部分运营 -0.7分，有审计但无具体细节 -0.7分，无证据 -1.4分）；(7) Anti-Money Laundering Policy（反洗钱政策：有政策和实施策略 0分，有政策但无实施披露 -0.7分，未披露 -1.4分）。Risk & Controversies类别——Corruption Risk Exposure & Controversies（0至-7.0分）和Business Ethics Controversies（0至-7.0分）。",
        scoringCriteria: "Flag-based评分。起始分10分，Policies & Practices类别每个Key Metric扣除0至-1.4分；Risk & Controversies类别可扣除0至-7.0分（基于运营所在地区腐败风险、政府持股比例和争议严重程度）。",
        dataSource: "企业ESG报告、合规报告、监管处罚记录、媒体报道、Transparency International腐败感知指数",
        scoreRange: "0-10分，起始10分逐项扣减（争议类扣分可能导致负分）",
        directlyFromMethodology: true,
        sourceNote: "方法学PDF（Business Ethics Key Issue, August 2025）中详细定义了每个Key Metric的评分标准和扣分值。"
      },
      "Tax Transparency": {
        nameCN: "税务透明度",
        nameEN: "Tax Transparency",
        definition: "Tax Transparency是企业行为主题下的独立Key Issue（有独立方法学PDF：Tax Transparency Key Issue, March 2026）。方法学中仅包含一个Key Metric：Tax Controversies（税务争议），属于Controversies类别。方法学原文定义：'Indicates the company's involvement in ongoing tax-related controversies.'评分基于企业是否涉及税务争议以及估计税差（Estimated Tax Gap）的组合评估。估计税差 = 估计有效税率 - 估计法定税率。重要规则：企业的估计税差仅在其涉及持续的税务相关争议时，才会影响其0-10企业行为主题得分和治理支柱得分。",
        scoringCriteria: "评分范围0至-2.0分。具体扣分规则：涉及税务争议且估计税差≤5%（Low）：-0.8分，Tax Transparency得分6；涉及税务争议且估计税差5-10%（Medium）：-1.4分，得分3；涉及税务争议且估计税差>10%（High）：-2.0分，得分0。未涉及税务争议：无论估计税差大小，扣分均为0，Tax Transparency得分10。",
        dataSource: "MSCI S&C数据、企业披露、税务监管记录",
        scoreRange: "0-10分（10=无税务争议，6/3/0=有争议且税差Low/Medium/High）",
        directlyFromMethodology: true,
        sourceNote: "方法学PDF（Tax Transparency Key Issue, March 2026）中详细定义了Tax Controversies Key Metric和Tax Controversy Deduction Key评分表。估计税差基于五年平均有效税率与基于收入来源地的估计法定税率之差。"
      }
    },
    performanceIndicators: {}
  }
};

/**
 * 获取所有关键议题的方法学URL映射
 */
export function getMethodologyUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [, value] of Object.entries(realEstateMethodology)) {
    urls[value.issueEN] = value.methodologyUrl;
    urls[value.issueCN] = value.methodologyUrl;
  }
  return urls;
}

/**
 * 根据指标名称查找方法学tooltip数据
 * @param indicatorName - 指标名称（英文，与Excel中完全匹配）
 * @returns MethodologyTooltip 或 undefined
 */
export function findMethodologyTooltip(indicatorName: string): MethodologyTooltip | undefined {
  const normalizedName = indicatorName.trim();
  
  for (const issue of Object.values(realEstateMethodology)) {
    // 先在管理实践指标中查找
    for (const [key, tooltip] of Object.entries(issue.managementIndicators)) {
      if (key === normalizedName || tooltip.nameEN === normalizedName) {
        return tooltip;
      }
    }
    // 再在绩效指标中查找
    for (const [key, tooltip] of Object.entries(issue.performanceIndicators)) {
      if (key === normalizedName || tooltip.nameEN === normalizedName) {
        return tooltip;
      }
    }
  }
  
  // 模糊匹配：处理名称中的细微差异
  const lowerName = normalizedName.toLowerCase();
  for (const issue of Object.values(realEstateMethodology)) {
    for (const [key, tooltip] of Object.entries(issue.managementIndicators)) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase()) ||
          tooltip.nameEN.toLowerCase().includes(lowerName) || lowerName.includes(tooltip.nameEN.toLowerCase())) {
        return tooltip;
      }
    }
    for (const [key, tooltip] of Object.entries(issue.performanceIndicators)) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase()) ||
          tooltip.nameEN.toLowerCase().includes(lowerName) || lowerName.includes(tooltip.nameEN.toLowerCase())) {
        return tooltip;
      }
    }
  }
  
  return undefined;
}

/**
 * 根据议题名称获取方法学数据
 */
export function findIssueMethodology(issueName: string): IssueMethodology | undefined {
  const normalizedName = issueName.trim().toLowerCase();
  
  for (const [key, issue] of Object.entries(realEstateMethodology)) {
    if (key === normalizedName ||
        issue.issueEN.toLowerCase() === normalizedName ||
        issue.issueCN === issueName.trim()) {
      return issue;
    }
  }
  
  // 模糊匹配
  for (const issue of Object.values(realEstateMethodology)) {
    if (issue.issueEN.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(issue.issueEN.toLowerCase())) {
      return issue;
    }
  }
  
  return undefined;
}
