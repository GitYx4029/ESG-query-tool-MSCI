import type { ReportCriterion } from "@shared/report";
// An editorial disclosure checklist associated with MSCI issues, not an official
// scoring model. Never import scores/weights from screenshots or old skill files.
type Row = [string, string, string];
const rows: Record<string, Row[]> = {
  "Opportunities in Green Building": [
    [
      "绿色认证承诺与范围",
      "披露绿色建筑认证的标准、目标、覆盖项目范围与期限。",
      "绿色建筑|绿色认证|green building|LEED|BREEAM|BEAM|绿建",
    ],
    [
      "认证面积、数量与分母",
      "披露认证物业数量或面积、总物业数量或面积、统计年度；区分存量与在建项目。",
      "认证面积|认证比例|绿色建筑面积|认证项目|certified|portfolio|LEED|绿建",
    ],
    [
      "物业环境绩效",
      "披露物业能源、碳排放和用水的年度数据、单位及统计边界。",
      "建筑能耗|物业能耗|能源消耗|碳排放|用水|energy consumption|water consumption",
    ],
    [
      "绿色租约与改造",
      "披露绿色租约或商业安排、既有建筑改造措施及实施范围；项目案例不能代表全部物业。",
      "绿色租约|绿色租赁|green lease|triple-net|建筑改造|节能改造|棕地|brownfield",
    ],
  ],
  "Health & Safety": [
    [
      "员工与承包商政策",
      "说明职业健康安全政策适用的员工、承包商及运营范围，不以员工政策推断承包商覆盖。",
      "职业健康|安全生产|承包商安全|occupational|health and safety|contractor safety",
    ],
    [
      "治理、审计与认证",
      "说明监督责任、独立审计或认证标准、有效期和认证运营覆盖率；ISO证书不能替代所有独立审计证据。",
      "ISO 45001|ISO45001|安全委员会|安全审计|安全检查|occupational|health and safety audit",
    ],
    [
      "改善目标",
      "披露安全绩效改善目标、期限、基准和范围。",
      "零死亡|零事故|安全目标|事故率目标|安全生产目标|safety target|zero fatalit",
    ],
    [
      "员工与承包商死亡人数",
      "按年度分别列明员工、承包商因工死亡人数和覆盖范围，零值也属于数据。",
      "因工死亡|因公死亡|因公亡故|工伤死亡|死亡人数|死亡事故|死亡的员工|fatalit",
    ],
    [
      "工伤率及计算口径",
      "披露LTIR或TRIR、年度、工时分母及员工/承包商范围；不将普通事故数等同于工伤率。",
      "LTIR|LTIFR|TRIR|TRIFR|伤害频率|百万工时损失率|失时|损工事故率|工伤率|每百万工时安全事故率|可记录工伤|lost time|recordable injury",
    ],
  ],
  "Product Safety & Quality": [
    [
      "质量管理与认证",
      "披露质量政策、检测与质量认证的标准、覆盖范围和有效期。",
      "产品质量|质量管理|ISO 9001|ISO9001|product safety|product quality|quality management",
    ],
    [
      "供应商质量与培训",
      "披露供应商质量审计、原材料检测和培训范围；区分直接供应商与间接供应商。",
      "供应商质量|质量审计|材料检测|进场检验|supplier quality|quality audit|供应商培训",
    ],
    [
      "负责任营销",
      "披露营销、广告、销售的管理政策、控制措施及执行证据。",
      "负责任营销|责任营销|广告审查|营销合规|responsible marketing|advertising",
    ],
    [
      "质量绩效与事件",
      "披露质量指标、产品召回、监管处罚或保修支出及年度、边界；公司自述不能证明不存在外部争议。",
      "召回|质量事故|保修|缺陷率|合格率|recall|warranty|defect|质量投诉",
    ],
  ],
  "Business Ethics": [
    [
      "反腐败政策与监督",
      "说明反贿赂、反腐败政策、监督责任和适用员工、供应商范围。",
      "反腐败|反贿赂|商业道德|廉洁|anti-corruption|anti-bribery|business ethics",
    ],
    [
      "举报渠道与保护",
      "披露举报渠道、匿名或保密安排、禁止报复及调查处理机制。",
      "举报|吹哨|不报复|保密|whistleblow|non-retaliation|hotline",
    ],
    [
      "培训与审计",
      "披露商业道德培训覆盖、审计或检查的范围、频率和执行情况；认证不能自动证明道德审计。",
      "廉洁培训|廉政教育|反腐败培训|反腐培训|道德培训|合规审计|廉洁检查|ethics training|ethics audit|anti-corruption training|anti-bribery training|code of conduct training|反贪污培训",
    ],
    [
      "案件与风险管理",
      "披露腐败案件、风险评估及处置的年度和范围；仅凭报告无法独立核验外部争议。",
      "贪污诉讼|腐败案件|腐败风险|反洗钱|corruption cases|corruption risk|anti-money laundering",
    ],
  ],
  "Carbon Emissions": [
    [
      "排放数据与边界",
      "列明范围一、范围二及相关范围三排放、单位、年度、组织边界和核算方法。",
      "范围一|范围二|范围三|范围 1|范围 2|范围 3|温室气体|碳排放|scope 1|scope 2|scope 3|GHG",
    ],
    [
      "减排目标",
      "说明目标年、基准年、覆盖范围及阶段进展。",
      "减排目标|碳中和|净零|SBTi|emission target|net zero",
    ],
    [
      "管理措施与核验",
      "说明减排治理、措施以及数据核验的范围。",
      "节能减排|碳核查|碳管理|排放核验|carbon management|verification",
    ],
  ],
  "Climate Change Vulnerability": [
    [
      "物理气候风险",
      "说明资产或运营的气候物理风险、地点、时间跨度和情景。",
      "物理风险|洪水|极端天气|气候风险|physical risk|flood|climate risk",
    ],
    [
      "适应与韧性",
      "披露应对措施、责任、覆盖范围及应急安排。",
      "气候适应|韧性|应急预案|adaptation|resilience",
    ],
    [
      "评估与进展",
      "披露情景分析、资产覆盖和适应措施进展。",
      "情景分析|风险评估|scenario analysis|TCFD",
    ],
  ],
  "Financing Environmental Impact": [
    [
      "投融资环境风险",
      "说明信贷或投资环境风险评估范围。",
      "绿色信贷|环境风险|financed emission|environmental risk",
    ],
    [
      "政策与审查",
      "披露行业限制、环境尽调和执行机制。",
      "环境尽调|信贷政策|融资限制|due diligence|lending policy",
    ],
    [
      "组合绩效",
      "披露融资排放或绿色融资规模、年度及口径。",
      "融资排放|绿色融资|绿色贷款|financed emissions|green financing",
    ],
  ],
  "Product Carbon Footprint": [
    [
      "产品全周期排放",
      "披露生命周期或产品碳足迹、边界与方法。",
      "产品碳足迹|生命周期|LCA|product carbon|life cycle",
    ],
    [
      "低碳产品措施",
      "披露产品低碳设计、目标和应用范围。",
      "低碳产品|低碳设计|eco-design|low-carbon product",
    ],
    [
      "量化进展",
      "披露产品排放、强度或低碳产品销售数据及口径。",
      "碳足迹认证|产品排放|carbon footprint|carbon intensity",
    ],
  ],
  "Biodiversity & Land Use": [
    [
      "生态与土地风险",
      "披露运营涉及的敏感区域、生态风险及评估范围。",
      "生物多样性|保护区|生态敏感|biodiversity|protected area",
    ],
    [
      "管理与恢复",
      "披露保护、土地恢复、责任及实施范围。",
      "生态修复|复垦|生态保护|restoration|rehabilitation",
    ],
    [
      "绩效与事件",
      "披露修复面积、生态影响、事件及年度口径。",
      "复垦面积|恢复面积|栖息地|habitat|land use",
    ],
  ],
  "Raw Material Sourcing": [
    [
      "原料来源与风险",
      "说明关键原料及可追溯来源、采购范围和风险。",
      "原材料采购|可追溯|raw material|traceability",
    ],
    [
      "可持续采购",
      "披露认证、供应商要求和尽调措施。",
      "FSC|可持续采购|森林认证|sustainable sourcing",
    ],
    [
      "覆盖数据",
      "披露认证或可持续原料占比、分母及年度。",
      "认证原料|再生原料|采购比例|certified material|recycled material",
    ],
  ],
  "Water Stress": [
    [
      "水风险与责任",
      "披露缺水地区运营、用水风险评估及监督责任。",
      "水压力|水风险|缺水|水资源管理|water stress|water risk",
    ],
    [
      "用水、回用及边界",
      "披露取水、耗水、回用数据、年度、单位与范围。",
      "取水|用水量|耗水|回用率|water withdrawal|water consumption|water recycling",
    ],
    [
      "目标与节水",
      "披露节水目标、期限、基准和实施进展。",
      "节水|用水目标|节水目标|water reduction|water target",
    ],
  ],
  "Electronic Waste": [
    [
      "电子废弃物管理",
      "披露回收、处理政策和责任范围。",
      "电子废弃物|电子垃圾|e-waste|electronic waste",
    ],
    [
      "回收措施",
      "披露回收体系、处理商及产品回收设计。",
      "以旧换新|回收计划|take-back|recycling program",
    ],
    [
      "回收绩效",
      "披露电子废弃物数量、回收量或回收率及年度。",
      "电子废弃物回收|电子垃圾回收|recycling rate|recovered electronics",
    ],
  ],
  "Packaging Material & Waste": [
    [
      "包装风险与政策",
      "披露包装材料、减量策略及责任。",
      "包装材料|包装废弃物|packaging material|packaging waste",
    ],
    [
      "循环设计",
      "披露可回收设计、再生材料和塑料替代。",
      "可回收包装|再生塑料|减塑|recyclable packaging",
    ],
    [
      "包装绩效",
      "披露包装用量、可回收比例或减量及年度。",
      "包装用量|包装回收|包装减量|packaging volume|recycled content",
    ],
  ],
  "Toxic Emissions & Waste": [
    [
      "污染物与危废",
      "披露污染物、危险废弃物类型、数量和范围。",
      "危险废物|危废|有害排放|toxic emission|hazardous waste",
    ],
    [
      "治理与合规",
      "说明污染治理、危废处置和合规监督。",
      "排污许可|危废处置|污染防治|waste treatment|pollution control",
    ],
    [
      "绩效与事件",
      "列明排放或危废年度数据、单位、减量目标及相关事件。",
      "废气|废水|危废量|污染事故|effluent|hazardous waste",
    ],
  ],
  "Opportunities in Clean Tech": [
    [
      "清洁技术业务",
      "说明清洁技术产品与业务的定义及范围。",
      "清洁技术|光伏逆变器|储能系统|光伏组件|新能源汽车|clean tech|solar module",
    ],
    [
      "研发与投入",
      "披露清洁技术研发、资本投入、目标及年度。",
      "研发投入|转换效率|技术创新|R&D|research and development",
    ],
    [
      "业务绩效",
      "披露清洁技术收入、产品销量及统计口径。",
      "清洁技术收入|逆变器出货|储能出货|组件出货|清洁产品|clean technology revenue|shipment",
    ],
  ],
  "Opportunities in Renewable Energy": [
    [
      "可再生能源业务",
      "说明可再生能源发电或投资业务范围。",
      "可再生能源|风电|光伏发电|renewable energy|wind power",
    ],
    [
      "发展目标与投入",
      "披露装机目标、期限和投资进展。",
      "装机目标|新能源投资|installed capacity|renewable investment",
    ],
    [
      "业务绩效",
      "披露装机、发电量或相关收入、年度及口径。",
      "发电量|装机容量|generation|capacity",
    ],
  ],
  "Human Capital Development": [
    [
      "人才战略与责任",
      "说明员工发展和人才治理安排。",
      "人才发展|人才培养|human capital|talent development",
    ],
    [
      "培训与人才机制",
      "披露培训、职业发展、绩效反馈及范围。",
      "员工培训|职业发展|培训小时|training hours|career development",
    ],
    [
      "人才绩效",
      "列明员工培训覆盖、投入或人均学时、年度及口径。",
      "培训覆盖率|人均培训|培训投入|training coverage|training hours",
    ],
  ],
  "Labor Management": [
    [
      "劳动政策与范围",
      "披露劳动权益、平等、雇佣及适用范围。",
      "劳动权益|平等雇佣|劳工|labor rights|employment",
    ],
    [
      "员工沟通与保障",
      "披露薪酬、员工沟通、集体协商和投诉机制。",
      "员工沟通|集体协商|工会|employee engagement|collective bargaining",
    ],
    [
      "员工绩效",
      "披露员工人数、流失、争议等年度数据及口径。",
      "流失率|离职率|劳动争议|turnover|labor dispute",
    ],
  ],
  "Supply Chain Labor Standards": [
    [
      "供应链劳工政策",
      "说明供应商劳动、人权及行为准则范围。",
      "供应商行为准则|供应商行为守则|可持续采购章程|劳工和人权要求|供应链劳工|供应商人权|supplier code|supply chain labor",
    ],
    [
      "风险与审核",
      "披露供应商劳工风险、审计范围及整改跟踪。",
      "供应商审核|供应商审计|社会责任审核|社会责任现场审核|社会责任评估|supplier audit|labor audit",
    ],
    [
      "覆盖与整改绩效",
      "披露受审核供应商比例、问题和整改结果及年度。",
      "供应商整改|审核覆盖|整改关闭|社会责任现场审核|社会责任评估|corrective action|audit coverage",
    ],
  ],
  "Chemical Safety": [
    [
      "化学品风险",
      "说明有害化学品识别、清单和安全评估。",
      "化学品安全|有害物质|chemical safety|hazardous substance",
    ],
    [
      "替代与控制",
      "披露限制、替代、产品测试和执行范围。",
      "REACH|RoHS|化学品替代|物质管控|restricted substance",
    ],
    [
      "安全进展",
      "披露受检产品、替代比例或合规事件及年度。",
      "有害物质检测|化学品事故|chemical incident|substance testing",
    ],
  ],
  "Consumer Financial Protection": [
    [
      "消费者金融权益",
      "披露产品适当性、公平销售及消费者保护政策。",
      "金融消费者|消费者权益|consumer protection|suitability",
    ],
    [
      "销售与投诉机制",
      "披露负责任销售、费用透明、投诉渠道及处理。",
      "适当性|投诉处理|误导销售|complaint|mis-selling",
    ],
    [
      "权益绩效",
      "披露投诉、补偿、处罚等年度数据和口径。",
      "投诉数量|投诉率|赔偿|consumer complaints|compensation",
    ],
  ],
  "Privacy & Data Security": [
    [
      "数据治理与范围",
      "说明隐私和信息安全政策、治理责任和范围。",
      "隐私|信息安全|数据安全|privacy|data security",
    ],
    [
      "安全控制与响应",
      "披露安全测试、审计、人员培训和事件响应。",
      "渗透测试|ISO 27001|ISO27001|数据泄露|penetration|data breach",
    ],
    [
      "事件与绩效",
      "披露数据安全或隐私事件、影响和年度范围。",
      "隐私投诉|安全事件|泄露事件|privacy complaint|security incident",
    ],
  ],
  "Responsible Investment": [
    [
      "责任投资政策",
      "披露ESG投资政策、治理和资产覆盖。",
      "责任投资|ESG投资|responsible investment|investment policy",
    ],
    [
      "整合与参与",
      "说明筛选、ESG整合、参与或投票的执行。",
      "ESG整合|尽责管理|投票|stewardship|ESG integration",
    ],
    [
      "覆盖绩效",
      "披露责任投资资产、覆盖率、参与结果及年度。",
      "责任投资规模|管理资产|AUM|engagement outcomes",
    ],
  ],
  "Community Relations": [
    [
      "社区影响与权益",
      "披露社区影响评估、土地或原住民权益安排。",
      "社区关系|社区影响|原住民|community relations|indigenous",
    ],
    [
      "沟通与申诉",
      "说明社区沟通、申诉和协商机制及范围。",
      "社区沟通|社区申诉|社区协商|community grievance|consultation",
    ],
    [
      "影响与事件",
      "披露社区影响、纠纷或改进结果；公益捐赠不能替代社区风险管理。",
      "社区纠纷|社区投诉|搬迁|community dispute|resettlement",
    ],
  ],
  "Controversial Sourcing": [
    [
      "敏感采购风险",
      "说明矿产等敏感采购、来源和供应链风险。",
      "冲突矿产|争议矿产|钴|conflict mineral|controversial sourcing",
    ],
    [
      "尽调与追溯",
      "披露供应商尽调、冶炼厂核验及可追溯机制。",
      "RMI|RMAP|冶炼厂|CMRT|EMRT|smelter|due diligence",
    ],
    [
      "覆盖与结果",
      "说明尽调覆盖率、整改及年度范围，不推断未披露供应商合规。",
      "冶炼厂覆盖|矿产追溯|尽调覆盖|smelter coverage|traceability",
    ],
  ],
  "Access to Finance": [
    [
      "金融服务覆盖",
      "说明低服务人群、地区和金融普惠策略。",
      "普惠金融|金融服务可及|financial inclusion|underserved",
    ],
    [
      "产品与可负担性",
      "披露普惠产品、定价和推广措施。",
      "小微贷款|农村金融|可负担|microfinance|affordability",
    ],
    [
      "覆盖绩效",
      "披露普惠客户、贷款规模或覆盖地区及年度。",
      "普惠贷款|小微客户|普惠客户|inclusive loan|microfinance clients",
    ],
  ],
  "Access to Health Care": [
    [
      "医疗服务可及",
      "说明服务不足人群、地区及可及性策略。",
      "医疗可及|药品可及|access to health|access to medicine",
    ],
    [
      "可负担与服务措施",
      "披露可负担定价、援助或可及服务计划。",
      "患者援助|可负担药品|药品援助|patient assistance|affordable medicine",
    ],
    [
      "覆盖绩效",
      "披露覆盖患者、地区、定价或援助数据及年度。",
      "受益患者|援助患者|覆盖患者|patients reached|beneficiaries",
    ],
  ],
  "Opportunities in Nutrition & Health": [
    [
      "营养健康产品",
      "披露营养健康产品、定义和业务范围。",
      "营养|健康食品|低糖|nutrition|healthy food",
    ],
    [
      "产品研发与管理",
      "说明营养策略、产品改良及研发投入。",
      "营养改良|减糖|减盐|reformulation|sugar reduction",
    ],
    [
      "产品绩效",
      "披露健康产品收入、销量或营养指标及口径。",
      "营养产品收入|健康产品|nutritional profile|healthy product sales",
    ],
  ],
  Board: [
    [
      "董事会结构",
      "列明董事会成员、独立性、多样性和年度范围。",
      "独立董事|董事会|independent director|board",
    ],
    [
      "委员会与监督",
      "披露委员会组成、职责及监督活动。",
      "审计委员会|提名委员会|董事会监督|audit committee|nomination committee",
    ],
    [
      "履职与问责",
      "披露出席、任期、选举或评估安排。",
      "董事出席|董事任期|董事评估|board attendance|board evaluation",
    ],
  ],
  Pay: [
    [
      "薪酬结构与披露",
      "说明董事与高管薪酬构成、金额及年度。",
      "高管薪酬|董事薪酬|executive pay|remuneration",
    ],
    [
      "绩效关联",
      "披露绩效指标、考核期间及长期激励机制。",
      "长期激励|绩效薪酬|ESG薪酬|long-term incentive|performance pay",
    ],
    [
      "监督与股东权利",
      "说明薪酬委员会、批准和追回安排。",
      "薪酬委员会|薪酬追回|say on pay|clawback",
    ],
  ],
  "Ownership & Control": [
    [
      "所有权结构",
      "披露控股股东、最终控制人及持股比例。",
      "控股股东|实际控制人|股权结构|controlling shareholder|ownership",
    ],
    [
      "投票与股东权利",
      "说明股东投票、同股权利及重大决策安排。",
      "投票权|股东权利|一股一票|voting rights|shareholder rights",
    ],
    [
      "控制与关联交易",
      "披露控制安排、关联交易和监督机制。",
      "关联交易|控制权|related party|control structure",
    ],
  ],
  Accounting: [
    [
      "财务与审计披露",
      "说明财务报告、审计机构、意见及年度。",
      "审计意见|外部审计|审计机构|audit opinion|external auditor",
    ],
    [
      "内控与监督",
      "披露财务内控、审计委员会与缺陷整改。",
      "内部控制|财务内控|内控缺陷|internal control|material weakness",
    ],
    [
      "异常与透明度",
      "披露重述、保留意见、审计费用等适用信息；ESG报告缺项可能需要年报补充。",
      "财务重述|保留意见|审计费用|restatement|qualified opinion",
    ],
  ],
  "Tax Transparency": [
    [
      "税务政策与监督",
      "披露税务政策、治理责任和风险管理。",
      "税务政策|税务风险|tax policy|tax risk",
    ],
    [
      "税务透明信息",
      "披露税项、税率、国别信息及口径，区分所得税和其他税费。",
      "有效税率|国别税务|所得税|effective tax rate|country-by-country",
    ],
    [
      "合规与进展",
      "说明税务合规、争议和政策执行情况。",
      "税务合规|税务争议|税收处罚|tax compliance|tax controversy",
    ],
  ],
};
export function criteriaForIssue(issue: string): ReportCriterion[] {
  return (rows[issue] ?? []).map(([label, requirement, words], index) => ({
    id: `${issue}:${index + 1}`,
    label,
    requirement,
    keywords: words.split("|"),
    ...(issue === "Product Safety & Quality" && index === 0
      ? {
          groups: [
            [
              "product",
              "customer",
              "ISO 9001",
              "ISO9001",
              "产品",
              "交付",
              "房屋",
              "客户",
              "质量管理体系认证",
            ],
          ],
        }
      : {}),
  }));
}
export const frameworkIssues = Object.keys(rows);
