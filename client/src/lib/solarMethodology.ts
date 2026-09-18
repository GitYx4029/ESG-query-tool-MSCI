/**
 * 半导体与半导体设备行业（含光伏太阳能）MSCI ESG 方法学解析数据
 *
 * 数据来源：
 * - MSCI ESG Ratings Methodology: Water Stress Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Opportunities in Clean Tech Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Human Capital Development Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Supply Chain Labor Standards Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Controversial Sourcing Key Issue (March 2026)
 * - MSCI ESG Ratings Methodology: Corporate Governance Key Issue (March 2026)
 *
 * 行业：Semiconductors & Semiconductor Equipment（含光伏太阳能制造商）
 * 适用企业示例：晶澳太阳能科技股份有限公司 002459.SZ
 *
 * 说明：
 * - 指标键名（managementIndicators/performanceIndicators 的 key）与 MSCI 系统 Excel 导出文件中的名称保持一致
 * - definition 字段直接来源于 MSCI 官方方法学 PDF 文档（英文原文翻译）
 * - scoringCriteria 字段：仅对 PDF 中有明确量化评分描述的指标填写，其余填写方法学文档的定性说明
 * - 当 Excel 名称与 PDF 官方名称不同时，通过 nameEN 字段注明 PDF 中的完整名称
 */

export interface MethodologyTooltip {
  nameCN: string;
  nameEN: string;       // PDF 中的官方完整名称（可能与 Excel 键名不同）
  definition: string;
  scoringCriteria: string;
  dataSource: string;
  scoreRange: string;
  directlyFromMethodology: boolean;
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

export const solarMethodology: Record<string, IssueMethodology> = {

  // ============================================================
  // ENVIRONMENT PILLAR
  // ============================================================

  "water_stress": {
    issueEN: "Water Stress",
    issueCN: "水资源压力",
    type: "environment",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Water+Stress+Key+Issue.pdf",
    overview: "评估企业在水资源压力地区的用水风险敞口及管理能力。半导体与光伏制造行业高度依赖超纯水（UPW），生产过程中水资源消耗强度大，且主要生产基地往往位于水资源紧张地区（如中国西北、东南亚）。MSCI通过曝险得分（Exposure Score）和管理得分（Management Score）综合评估企业的水资源风险。",
    assessmentFramework: "关键议题得分 = 曝险得分 × 管理得分。管理得分由治理与战略得分（Governance & Strategy）、目标得分（Targets）和绩效得分（Performance）加权计算，再扣除争议分。",
    managementIndicators: {
      "Executive body responsible for water management strategy and performance": {
        nameCN: "负责水资源管理战略与绩效的执行机构",
        nameEN: "Executive body responsible for water management strategy and performance",
        definition: "Assesses the governing level of water strategy and performance oversight assigned to dedicated individuals or a committee. Expressed as a 0-10 score, with 10 indicating CEO or board-level oversight.",
        scoringCriteria: "0-10分评分，10分表示CEO或董事会级别负责水资源管理战略与绩效；较低分对应高级管理人员、可持续发展委员会或非执行层面负责；0分表示无相关证据。",
        dataSource: "企业ESG报告、可持续发展报告、公司治理报告、年报",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Scope of implementation of water reduction programs": {
        nameCN: "节水项目实施范围",
        nameEN: "Scope of water reduction programs at own operations",
        definition: "Assesses the extent to which the company has implemented water reduction measures at its direct operations.",
        scoringCriteria: "评估企业在自有运营中实施节水措施的程度，覆盖范围越广、措施越系统，得分越高（0-10分）。",
        dataSource: "企业ESG报告、环境数据披露、工厂运营报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Scope of implementation of water reduction programs'，PDF官方名称为'Scope of water reduction programs at own operations'。"
      },
      "Water recycling rate": {
        nameCN: "水资源循环利用率",
        nameEN: "Water recycling rate",
        definition: "The percentage of recycled or recirculated water of total water usage.",
        scoringCriteria: "基于企业披露的水循环利用率数值进行同行比较评分（0-10分），循环利用率越高、相对同行表现越好，得分越高。",
        dataSource: "企业ESG报告、环境数据表、可持续发展数据附录",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Alternative water sources": {
        nameCN: "替代水源使用",
        nameEN: "Use of alternative water",
        definition: "The amount of water that the company obtains from alternative sources. Alternative water sources include seawater, brackish water, gray water, and rainwater. Expressed as a 0-10 score, with 10 indicating higher usage from non-freshwater sources.",
        scoringCriteria: "0-10分评分，10分表示使用较高比例的非淡水水源（海水、苦咸水、灰水、雨水）；0分表示完全依赖淡水。",
        dataSource: "企业ESG报告、水资源管理报告、环境数据披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Alternative water sources'，PDF官方名称为'Use of alternative water'。"
      },
      "Comprehensiveness of Water Stress target": {
        nameCN: "水资源压力目标的全面性",
        nameEN: "Water stress target comprehensiveness",
        definition: "Assesses the extent to which a company has established measurable water-related targets that are comprehensive in operational scope. Expressed as a 0-10 score, with 10 indicating a quantitative target that covers all relevant segments.",
        scoringCriteria: "0-10分评分，10分表示设定了量化的、覆盖所有相关业务部门的水资源目标；较低分对应目标覆盖范围有限或仅为定性承诺；0分表示无水资源目标。",
        dataSource: "企业可持续发展报告、ESG目标披露、气候相关信息披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Comprehensiveness of Water Stress target'，PDF官方名称为'Water stress target comprehensiveness'。"
      },
      "Status of achieving Water Stress targets": {
        nameCN: "水资源压力目标达成状态",
        nameEN: "Water stress target progress",
        definition: "Assesses the company's progress toward any ongoing water reduction targets or track record of progress toward historical targets. Expressed as a 0-10 score, with 10 indicating higher progress towards targets.",
        scoringCriteria: "0-10分评分，10分表示已实现或按计划实现水资源减少目标，有历史目标完成记录；0分表示目标进展严重落后或无进展报告。",
        dataSource: "企业年度ESG报告、可持续发展进展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Status of achieving Water Stress targets'，PDF官方名称为'Water stress target progress'，综合评估进行中目标和历史目标的达成状态。"
      }
    },
    performanceIndicators: {
      "Freshwater Withdrawal Score": {
        nameCN: "淡水取用得分",
        nameEN: "Freshwater withdrawal performance relative to peers",
        definition: "Assesses the company's performance on freshwater withdrawal intensity (normalized by sales or by units of production), and trend in freshwater withdrawal intensity, relative to its peers. Expressed as a 0-10 score, where 10 indicates strong performance.",
        scoringCriteria: "0-10分评分，10分表示淡水取用强度处于行业最优水平；5分表示处于行业中等水平；0分表示处于行业最差水平或无数据披露。",
        dataSource: "企业ESG报告、环境数据附录、CDP水资源问卷",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Freshwater Withdrawal Score'，PDF官方名称为'Freshwater withdrawal performance relative to peers'。"
      }
    }
  },

  "opportunities_in_clean_tech": {
    issueEN: "Opportunities in Clean Tech",
    issueCN: "清洁技术机遇",
    type: "environment",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Opportunities+in+Clean+Tech+Key+Issue.pdf",
    overview: "评估企业在清洁技术领域的战略布局、研发投入和收入贡献。对于光伏太阳能制造企业，这是最核心的正向ESG议题——企业的主营业务本身即是清洁技术解决方案。MSCI通过清洁技术收入占比、研发投入和战略承诺三个维度综合评估。",
    assessmentFramework: "清洁技术机遇得分由战略得分（Strategy Score）、项目与举措得分（Programs & Initiatives Score）和绩效得分（Performance Score）加权计算。战略得分评估清洁技术战略承诺；项目与举措得分评估研发投入强度；绩效得分基于清洁技术收入占比。",
    managementIndicators: {
      "Targets to increase investment in clean tech": {
        nameCN: "增加清洁技术投资的目标",
        nameEN: "Targets to increase investment in clean tech",
        definition: "Indicates whether the company has disclosed quantitative targets to increase investment in clean technology.",
        scoringCriteria: "企业是否披露了增加清洁技术投资的量化目标（是/否型指标）。",
        dataSource: "企业战略规划、年报、ESG报告、投资者关系材料",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Strategic focus on clean technology development": {
        nameCN: "清洁技术开发的战略重点",
        nameEN: "Strategic focus on clean technology development",
        definition: "Assesses the company's strategic commitment to clean technology as part of its core business focus and growth plans. Highest performance reflects clean technology being a core business line or a primary focus for future R&D and innovation. Expressed as a 0–10 score, where 10 indicates the highest level of performance.",
        scoringCriteria: "0-10分评分，10分表示清洁技术是企业核心业务线或未来研发创新的主要方向；较低分对应清洁技术是重要战略方向之一；0分表示清洁技术仅为边缘业务或无明确战略定位。",
        dataSource: "企业战略文件、年报、CEO致股东信、投资者日材料",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Research and development focused on clean tech applications": {
        nameCN: "研发强度得分（占销售额百分比）",
        nameEN: "Research and development intensity (as percentage of sales) score",
        definition: "Assesses the company's performance on R&D intensity metrics (including R&D intensity normalized by sales, and trend in R&D intensity) relative to its peers. Expressed as a 0–10 score, where 10 indicates the highest level of performance.",
        scoringCriteria: "0-10分评分，10分表示研发强度（研发支出/销售额）处于行业最高水平；5分表示处于行业中等水平；0分表示处于行业最低水平或无研发数据披露。",
        dataSource: "企业年报、研发报告、专利披露、ESG报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Research and development focused on clean tech applications'，PDF官方名称为'Research and development intensity (as percentage of sales) score'，基于研发支出占销售额比例进行同行比较评分。"
      }
    },
    performanceIndicators: {
      "Clean Tech Revenue Score": {
        nameCN: "清洁技术收入得分",
        nameEN: "Clean tech revenue score",
        definition: "The percentage of the company's revenue from clean tech activities. Expressed as a 0-10 score, where 10 indicates that the company derives more than 50% of its revenue from clean technology products and services.",
        scoringCriteria: "0-10分评分，10分表示清洁技术收入占总收入超过50%。对于光伏组件制造商，主营业务收入均被视为清洁技术收入，通常可获得满分。",
        dataSource: "企业年报、分部收入披露、MSCI Sustainable Impact Metrics数据库",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      }
    }
  },

  // ============================================================
  // SOCIAL PILLAR
  // ============================================================

  "human_capital_development": {
    issueEN: "Human Capital Development",
    issueCN: "人力资本发展",
    type: "social",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Human+Capital+Development+Key+Issue.pdf",
    overview: "评估企业在吸引、培养和留住人才方面的能力。对于半导体与光伏制造行业，人力资本是核心竞争力——技术工人短缺、高离职率和技能断层是行业面临的主要挑战。MSCI通过薪酬结构、培训投入、员工福利和人才保留率等指标综合评估。",
    assessmentFramework: "管理得分由战略得分（Strategy Score）和项目与举措得分（Programs & Initiatives Score）加权计算，再扣除争议分；绩效得分基于员工离职率等量化指标。战略得分评估人才管道战略、申诉机制和员工反馈机制；项目与举措得分评估福利、薪酬结构和培训项目。",
    managementIndicators: {
      "Variable performance-based component to pay": {
        nameCN: "绩效挂钩的可变薪酬",
        nameEN: "Variable performance-based component to pay",
        definition: "Indicates whether non-officer and non-sales staff are eligible for variable performance-based pay, such as bonuses.",
        scoringCriteria: "企业是否为非高管、非销售人员提供绩效挂钩的可变薪酬（如奖金）。此为是/否型指标。",
        dataSource: "企业ESG报告、薪酬政策披露、年报",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Regular performance appraisals and feedback processes": {
        nameCN: "定期绩效评估和反馈流程",
        nameEN: "Regular performance appraisals and feedback processes",
        definition: "Indicates whether and to what extent the company undertakes programs for employee professional development, such as performance reviews, goal setting and review, or similar. Best practice is for such programs to be provided to all permanent employees.",
        scoringCriteria: "最佳实践：为所有正式员工提供绩效评估、目标设定与回顾等职业发展项目。",
        dataSource: "企业ESG报告、人力资源管理政策、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Workforce eligible for non-pay benefits": {
        nameCN: "享有带薪育儿假政策的员工比例",
        nameEN: "Workforce eligible for paid parental leave policy",
        definition: "Assesses the extent to which the company's workforce is eligible for material non-pay benefits, evaluated through the company's paid parental leave policies, considering both the duration of paid leave and the scope of employee coverage based on publicly available information. The industry-leading practice is when a company's paid parental leave policies cover all employees across its global operations.",
        scoringCriteria: "行业领先实践：带薪育儿假政策覆盖全球所有员工。评估综合考虑带薪假期时长和员工覆盖范围两个维度。",
        dataSource: "企业ESG报告、员工手册、福利政策披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Workforce eligible for non-pay benefits'，PDF官方名称为'Workforce eligible for paid parental leave policy'，通过带薪育儿假政策评估员工非薪酬福利的覆盖程度。"
      },
      "Skills and knowledge development training": {
        nameCN: "技能与知识发展培训",
        nameEN: "Skills and knowledge development training",
        definition: "The extent of managerial/leadership development training. Best practice is a training program in which all employees participate.",
        scoringCriteria: "最佳实践：所有员工均参与管理/领导力发展培训项目。",
        dataSource: "企业ESG报告、培训数据披露、人力资源报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Employee equity programs": {
        nameCN: "员工股权计划",
        nameEN: "Employee equity programs",
        definition: "The extent of eligibility for an employee stock ownership plan and/or an employee stock purchase plan. Best practice is for all permanent employees to have access to such programs to participate.",
        scoringCriteria: "最佳实践：所有正式员工均可参与员工持股计划（ESOP）和/或员工股票购买计划（ESPP）。",
        dataSource: "企业年报、股权激励计划公告、ESG报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Formal talent pipeline development strategy": {
        nameCN: "正式的人才梯队发展战略",
        nameEN: "Formal talent pipeline development strategy",
        definition: "Indicates whether a company has a formal talent pipeline development strategy in place, evidenced through structured recruitment programs (such as graduate traineeships, internships, or apprenticeships) and explicit statements linking talent pipeline development to the company's long-term business or workforce strategy.",
        scoringCriteria: "企业是否有正式的人才梯队发展战略，通过结构化招聘项目（如校园招聘、实习、学徒制）和明确的人才发展与长期业务战略的关联声明来证明。此为是/否型指标。",
        dataSource: "企业ESG报告、人力资源战略文件、年报",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Extent of human resource-related grievance reporting or escalation procedures": {
        nameCN: "人力资源相关申诉报告或升级程序的覆盖范围",
        nameEN: "Extent of human resource-related grievance reporting or escalation procedures",
        definition: "Indicates whether the company has an internal reporting channel or escalation procedures for employees to report human resource-related grievances.",
        scoringCriteria: "企业是否建立了员工申诉和问题升级的内部渠道（是/否及覆盖范围）。",
        dataSource: "企业ESG报告、员工关系政策、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Employee satisfaction survey frequency": {
        nameCN: "员工满意度调查频率",
        nameEN: "Employee satisfaction survey frequency",
        definition: "The frequency of employee satisfaction surveys. Best practice is at least annually.",
        scoringCriteria: "最佳实践：至少每年开展一次员工满意度调查。",
        dataSource: "企业ESG报告、员工调查结果披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      }
    },
    performanceIndicators: {
      "Employee turnover": {
        nameCN: "员工离职率",
        nameEN: "Employee turnover rate performance relative to peers",
        definition: "Assesses the company's performance on reported employee turnover rate, and trend in employee turnover rate, relative to its peers. Expressed as a 0–10 score, where 10 indicates strong performance.",
        scoringCriteria: "0-10分评分，10分表示员工离职率显著低于行业平均水平，且呈下降趋势；5分表示接近行业平均；0分表示显著高于行业平均或无相关数据披露。",
        dataSource: "企业ESG报告、人力资源数据披露、可持续发展报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Employee turnover'，PDF官方名称为'Employee turnover rate performance relative to peers'，基于员工离职率与行业同行的相对比较进行评分。"
      }
    }
  },

  "supply_chain_labor_standards": {
    issueEN: "Supply Chain Labor Standards",
    issueCN: "供应链劳工标准",
    type: "social",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Supply+Chain+Labor+Standards+Key+Issue.pdf",
    overview: "评估企业在供应链中执行劳工标准的能力。对于光伏行业，供应链劳工标准是最受国际关注的ESG议题之一——多晶硅主要产自新疆，面临强迫劳动指控的国际压力；此外，供应链延伸至多个发展中国家，童工、强迫劳动等风险不可忽视。MSCI通过供应商审计、行为准则和申诉机制评估企业的供应链管理能力。",
    assessmentFramework: "管理得分 = 实践得分（Practices Score），评估企业政策和举措的完善程度，再扣除争议分。曝险得分基于业务部门曝险和企业特定曝险（供应链劳工风险敞口）。",
    managementIndicators: {
      "Supplier training": {
        nameCN: "供应商培训",
        nameEN: "Trains suppliers on labor related social issues",
        definition: "Indicates whether the company has specific training programs in place with its suppliers on its supplier code of conduct or specific labor-related issues.",
        scoringCriteria: "企业是否对供应商开展供应商行为准则或特定劳工相关议题的专项培训（是/否型指标）。",
        dataSource: "企业ESG报告、供应链管理报告、可持续发展报告",
        scoreRange: "0或10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Supplier training'，PDF官方名称为'Trains suppliers on labor related social issues'。"
      },
      "Supplier selection based on labor management performance": {
        nameCN: "基于劳工管理绩效的供应商选择",
        nameEN: "Supplier selection based on labor management performance",
        definition: "Indicates whether the company considers suppliers' performance in allocating or renewing contracts, and/or placing further orders.",
        scoringCriteria: "企业是否在分配或续签合同及追加订单时考虑供应商的劳工管理绩效（是/否型指标）。",
        dataSource: "企业ESG报告、采购政策、供应链管理报告",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Evidence of Supplier audit": {
        nameCN: "供应商审计证据",
        nameEN: "Evidence of supplier audits",
        definition: "Indicates whether the company conducts internal and/or external audits across its supply chain.",
        scoringCriteria: "企业是否在供应链中开展内部和/或外部审计（是/否型指标）。",
        dataSource: "企业ESG报告、第三方审计报告、供应链透明度报告",
        scoreRange: "0或10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Evidence of Supplier audit'，PDF官方名称为'Evidence of supplier audits'。"
      },
      "Scope of supplier audits": {
        nameCN: "供应商审计范围",
        nameEN: "Scope of supplier audits",
        definition: "Assesses the extent of audits conducted across the company's supply chains. Expressed as a 0-10 score, with 10 indicating strong initiatives.",
        scoringCriteria: "0-10分评分，10分表示审计覆盖一级（直接供应商）、二级（零部件）和三级（原材料）供应商；较低分对应仅覆盖部分层级；0分表示无供应商审计。",
        dataSource: "企业ESG报告、供应链审计报告、供应链透明度披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Scope of code of conduct": {
        nameCN: "供应商行为准则覆盖范围",
        nameEN: "Scope of supplier code of conduct",
        definition: "Assesses inclusion of key labor standards in supplier code of conduct such as wages, working hours and worker protections. Expressed as a 0-10 score, with 10 indicating strong initiatives.",
        scoringCriteria: "0-10分评分，10分表示供应商行为准则覆盖反歧视、禁止童工、禁止强迫劳动、结社自由、健康安全、最低工资、加班工资、工作时间等所有关键劳工标准；较低分对应覆盖部分标准；0分表示无供应商行为准则。",
        dataSource: "企业ESG报告、供应商行为准则文件、采购政策",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Scope of code of conduct'，PDF官方名称为'Scope of supplier code of conduct'。"
      },
      "Action taken to address supplier misconduct": {
        nameCN: "处理供应商不当行为的措施",
        nameEN: "Action taken to address supplier misconduct",
        definition: "Indicates whether the company provides evidence of developing a remediation action plan when incidents of noncompliance with its code of conduct are found.",
        scoringCriteria: "企业是否在发现供应商违反行为准则时制定整改行动计划（是/否型指标）。",
        dataSource: "企业ESG报告、供应链管理报告、案例披露",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Effectiveness of Grievance Mechanisms": {
        nameCN: "申诉机制有效性",
        nameEN: "Effectiveness of grievance mechanisms",
        definition: "Assesses the effectiveness of grievance mechanisms for supply chain workers.",
        scoringCriteria: "评估供应链工人申诉机制的有效性，包括可及性、匿名性和处理流程的透明度（0-10分）。",
        dataSource: "企业ESG报告、供应链管理报告、申诉机制说明",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Extent of disclosure on instances of supplier misconduct": {
        nameCN: "供应商不当行为披露程度",
        nameEN: "Extent of disclosure on instances of supplier misconduct",
        definition: "Indicates whether the company discloses the frequency and type of noncompliance incidents found in its supply chain.",
        scoringCriteria: "企业是否披露供应链中发现的违规事件的频率和类型（是/否及详细程度）。",
        dataSource: "企业ESG报告、供应链透明度报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true
      },
      "Commitment to living wage": {
        nameCN: "对供应链工人支付生活工资的承诺",
        nameEN: "Commitment to pay living wage for workers in supply chains",
        definition: "Assesses the company's commitment to pay a living wage to its supply chain workers. Sources: company disclosures, International Labour Organization.",
        scoringCriteria: "评估企业对供应链工人支付生活工资的承诺程度，参考国际劳工组织（ILO）标准。",
        dataSource: "企业ESG报告、薪酬政策、供应链管理报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Commitment to living wage'，PDF官方名称为'Commitment to pay living wage for workers in supply chains'。"
      }
    },
    performanceIndicators: {}
  },

  "controversial_sourcing": {
    issueEN: "Controversial Sourcing",
    issueCN: "争议性采购",
    type: "social",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Controversial+Sourcing+Key+Issue.pdf",
    overview: "评估企业在采购高风险原材料方面的管理能力。对于光伏行业，多晶硅（主要来自新疆）是最核心的争议性原材料——美国《维吾尔强迫劳动预防法》（UFLPA）已将新疆多晶硅列为强迫劳动风险材料，欧盟也正在推进类似立法。此外，银浆（含银）、铟、碲等稀有金属也存在采购争议。MSCI通过溯源能力、认证和政策承诺评估企业的争议性采购风险管理。",
    assessmentFramework: "管理得分基于实践得分（Practices Score），评估企业在争议性原材料采购方面的政策、认证和溯源能力，再扣除争议分。争议性采购议题无单独的绩效得分，主要依赖管理实践评估。",
    managementIndicators: {
      "Supplier/material certification as conflict-free": {
        nameCN: "供应商/材料无冲突认证",
        nameEN: "Extent of supplier/material certification as conflict-free by external agencies using the most stringent criteria",
        definition: "The extent of relevant products externally certified as conflict-free using the most stringent criteria, which may differ from industry to industry. Example: Responsible Minerals Assurance Process (RMAP) for Consumer Electronics.",
        scoringCriteria: "评估相关产品经外部机构以最严格标准认证为无冲突矿产的程度，不同行业标准可能不同（如消费电子行业使用RMAP）。",
        dataSource: "企业ESG报告、供应链认证文件、第三方审计报告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Supplier/material certification as conflict-free'，PDF官方完整名称为'Extent of supplier/material certification as conflict-free by external agencies using the most stringent criteria'。"
      },
      "Efforts to ensure compliance with sourcing policy": {
        nameCN: "确保采购政策合规的努力",
        nameEN: "Extent of efforts to ensure compliance with controversial materials sourcing policy",
        definition: "Indicates whether the company carries out initiatives to ensure compliance with its controversial sourcing policy, or collaborates with stakeholders to promote supply chain transparency and accountability.",
        scoringCriteria: "企业是否开展确保争议性采购政策合规的举措，或与利益相关方合作促进供应链透明度和问责制（是/否及程度）。",
        dataSource: "企业ESG报告、合规报告、采购政策文件",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Efforts to ensure compliance with sourcing policy'，PDF官方名称为'Extent of efforts to ensure compliance with controversial materials sourcing policy'。"
      },
      "Material traceability to place of origin": {
        nameCN: "原材料溯源至产地",
        nameEN: "Extent of material traceability to place of origin",
        definition: "Indicates the estimated share of relevant products with traceable origin of raw materials. Traceable origin refers to the location where the ore was mined, to the best detail possible. At a minimum, the description must include the country, but more details may be provided including the province/state, city, mine site and mine name.",
        scoringCriteria: "评估具有可追溯原材料来源的相关产品的估计比例。可追溯来源至少需包含国家信息，更详细的信息包括省/州、城市、矿山地点和矿山名称。",
        dataSource: "企业ESG报告、供应链透明度报告、溯源认证文件",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "注：Excel中显示为'Material traceability to place of origin'，PDF官方名称为'Extent of material traceability to place of origin'。"
      },
      "Targets for ensuring compliance with controversial materials sourcing policy": {
        nameCN: "确保争议性材料采购政策合规的目标",
        nameEN: "Targets for ensuring compliance with controversial materials sourcing policy",
        definition: "Indicates whether the company has targets for ensuring compliance with its controversial materials sourcing policy.",
        scoringCriteria: "企业是否设定了确保争议性材料采购政策合规的目标（是/否型指标）。",
        dataSource: "企业ESG报告、可持续发展目标披露",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      },
      "Commitments to address controversial sourcing practices": {
        nameCN: "解决争议性采购实践的承诺",
        nameEN: "Commitments to address controversial sourcing practices",
        definition: "Indicates whether the company has a policy to address sourcing and use of raw materials that may originate from areas associated with human rights violations, illicit trade and/or financing of violence.",
        scoringCriteria: "企业是否有政策应对可能来自人权侵犯、非法贸易和/或暴力融资地区的原材料采购和使用（是/否型指标）。",
        dataSource: "企业ESG报告、董事会声明、行业倡议参与证明",
        scoreRange: "0或10分",
        directlyFromMethodology: true
      }
    },
    performanceIndicators: {}
  },

  // ============================================================
  // GOVERNANCE PILLAR
  // ============================================================
  "corporate_governance": {
    issueEN: "Corporate Governance",
    issueCN: "公司治理",
    type: "governance",
    methodologyUrl: "https://www.msci.com/documents/1296102/34424357/MSCI+ESG+Ratings+Methodology+-+Corporate+Governance+Key+Issue.pdf",
    overview: "评估企业在董事会结构、薪酬制度、股权控制和会计透明度方面的治理质量。对于中国上市的光伏企业，MSCI特别关注控股股东与中小股东之间的利益平衡、独立董事的实质独立性以及财务信息披露的透明度。",
    assessmentFramework: "公司治理得分由四个子议题加权计算：董事会（Board）、薪酬（Pay）、股权与控制（Ownership & Control）、会计（Accounting）。各子议题再细分为多个具体指标，综合反映企业治理质量。",
    managementIndicators: {
      "Board": {
        nameCN: "董事会",
        nameEN: "Board",
        definition: "评估董事会的独立性、多元性和有效性，包括独立董事比例、审计委员会独立性、董事会多元化（性别、专业背景）、董事长与CEO是否分离等核心治理指标。",
        scoringCriteria: "Corporate Governance Key Issue包含Board、Pay、Ownership & Control、Accounting四个子议题，各子议题有独立的评分体系，详见MSCI方法学文档。",
        dataSource: "企业年报、公司治理报告、董事会信息披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "Corporate Governance Key Issue的具体评分标准详见MSCI官方方法学文档，各子议题（Board、Pay、Ownership & Control、Accounting）均有独立的细分指标体系。"
      },
      "Pay": {
        nameCN: "薪酬",
        nameEN: "Pay",
        definition: "评估高管薪酬与企业长期绩效的挂钩程度，以及薪酬信息的透明度，包括薪酬结构合理性、是否与ESG目标挂钩以及股东说薪权（Say on Pay）。",
        scoringCriteria: "Corporate Governance Key Issue包含Board、Pay、Ownership & Control、Accounting四个子议题，各子议题有独立的评分体系，详见MSCI方法学文档。",
        dataSource: "企业年报、薪酬委员会报告、股东大会材料",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "Corporate Governance Key Issue的具体评分标准详见MSCI官方方法学文档，各子议题（Board、Pay、Ownership & Control、Accounting）均有独立的细分指标体系。"
      },
      "Ownership & Control": {
        nameCN: "股权与控制",
        nameEN: "Ownership & Control",
        definition: "评估企业股权结构对中小股东权益的保护程度，包括控股股东持股比例、是否存在双重股权结构、关联交易透明度以及股东权利保护机制。",
        scoringCriteria: "Corporate Governance Key Issue包含Board、Pay、Ownership & Control、Accounting四个子议题，各子议题有独立的评分体系，详见MSCI方法学文档。",
        dataSource: "企业年报、股权结构披露、关联交易公告",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "Corporate Governance Key Issue的具体评分标准详见MSCI官方方法学文档，各子议题（Board、Pay、Ownership & Control、Accounting）均有独立的细分指标体系。"
      },
      "Accounting": {
        nameCN: "会计",
        nameEN: "Accounting",
        definition: "评估企业财务报告的质量和透明度，包括审计师独立性、会计政策保守性以及财务信息披露完整性，特别关注是否存在会计重述、审计意见是否清洁以及审计委员会有效性。",
        scoringCriteria: "Corporate Governance Key Issue包含Board、Pay、Ownership & Control、Accounting四个子议题，各子议题有独立的评分体系，详见MSCI方法学文档。",
        dataSource: "企业年报、审计报告、财务信息披露",
        scoreRange: "0-10分",
        directlyFromMethodology: true,
        sourceNote: "Corporate Governance Key Issue的具体评分标准详见MSCI官方方法学文档，各子议题（Board、Pay、Ownership & Control、Accounting）均有独立的细分指标体系。"
      }
    },
    performanceIndicators: {}
  }
};

/**
 * 根据议题英文名称查找方法学数据
 */
export function findSolarIssueMethodology(issueEN: string): IssueMethodology | undefined {
  // 标准化key：转小写，空格替换为下划线
  const key = issueEN.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  
  // 直接匹配
  if (solarMethodology[key]) return solarMethodology[key];
  
  // 模糊匹配
  for (const [k, v] of Object.entries(solarMethodology)) {
    if (v.issueEN.toLowerCase() === issueEN.toLowerCase()) return v;
    if (issueEN.toLowerCase().includes(k.replace(/_/g, " "))) return v;
  }
  
  return undefined;
}

/**
 * 根据指标英文名称查找方法学tooltip
 */
export function findSolarMethodologyTooltip(
  issueEN: string,
  indicatorEN: string
): MethodologyTooltip | undefined {
  const methodology = findSolarIssueMethodology(issueEN);
  if (!methodology) return undefined;
  
  const allIndicators = {
    ...methodology.managementIndicators,
    ...methodology.performanceIndicators
  };
  
  // 精确匹配
  if (allIndicators[indicatorEN]) return allIndicators[indicatorEN];
  
  // 模糊匹配（忽略大小写）
  for (const [k, v] of Object.entries(allIndicators)) {
    if (k.toLowerCase() === indicatorEN.toLowerCase()) return v;
  }
  
  return undefined;
}

