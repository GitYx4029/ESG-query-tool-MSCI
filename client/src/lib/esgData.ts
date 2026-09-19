// ESG行业关键议题数据 - 基于MSCI ESG Industry Materiality Map
// 设计风格：知识图谱风格，ESG三色体系（绿/橙/蓝）映射三支柱

export type PillarType = "Environment" | "Social" | "Governance";
export type ImportanceLevel = "high" | "medium" | "low" | "standard";

export interface KeyIssue {
  name: string;
  pillar: PillarType;
  theme: string;
  importance: ImportanceLevel;
  methodologyUrl: string;
  weight?: number; // 估算权重百分比（占总ESG评级，仅E&S议题有值）
}

// 基于MSCI方法学框架的权重系数映射
// 框架：High+Short-term=3x, High+Long-term=2x, Medium+Short-term=2x,
//       Medium+Long-term=1.5x, Low+Short-term=1.5x, Low+Long-term=1x
// 治理支柱权重固定33%，E&S议题权重之和为67%
const importanceWeightCoeff: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  standard: 0
};

// 计算行业E&S议题的估算权重（百分比，所有E&S议题权重之和约为67%）
export function calcIssueWeights(issues: KeyIssue[]): KeyIssue[] {
  const esIssues = issues.filter(i => i.importance !== 'standard');
  const totalCoeff = esIssues.reduce((sum, i) => sum + (importanceWeightCoeff[i.importance] || 0), 0);
  if (totalCoeff === 0) return issues;
  const esWeight = 67; // E&S合计权重约67%，治理33%
  return issues.map(issue => {
    if (issue.importance === 'standard') return issue;
    const coeff = importanceWeightCoeff[issue.importance] || 0;
    const weight = Math.round((coeff / totalCoeff) * esWeight);
    return { ...issue, weight };
  });
}

export interface Industry {
  name: string;
  sector: string;
  sectorCode: string;
  keyIssues: KeyIssue[];
}

export interface Sector {
  name: string;
  code: string;
  industries: Industry[];
}

// MSCI ESG关键议题层级结构
export const keyIssueHierarchy: Record<PillarType, Record<string, string[]>> = {
  Environment: {
    "Climate Change": ["Carbon Emissions", "Climate Change Vulnerability", "Financing Environmental Impact", "Product Carbon Footprint"],
    "Natural Capital": ["Biodiversity & Land Use", "Raw Material Sourcing", "Water Stress"],
    "Pollution & Waste": ["Electronic Waste", "Packaging Material & Waste", "Toxic Emissions & Waste"],
    "Environmental Opportunities": ["Opportunities in Clean Tech", "Opportunities in Green Building", "Opportunities in Renewable Energy"]
  },
  Social: {
    "Human Capital": ["Health & Safety", "Human Capital Development", "Labor Management", "Supply Chain Labor Standards"],
    "Product Liability": ["Chemical Safety", "Consumer Financial Protection", "Privacy & Data Security", "Product Safety & Quality", "Responsible Investment"],
    "Stakeholder Opposition": ["Community Relations", "Controversial Sourcing"],
    "Social Opportunities": ["Access to Finance", "Access to Health Care", "Opportunities in Nutrition & Health"]
  },
  Governance: {
    "Corporate Governance": ["Board", "Pay", "Ownership & Control", "Accounting"],
    "Corporate Behavior": ["Business Ethics", "Tax Transparency"]
  }
};

// 议题到主题的映射
const issueToTheme: Record<string, string> = {};
const issueToPillar: Record<string, PillarType> = {};
for (const [pillar, themes] of Object.entries(keyIssueHierarchy)) {
  for (const [theme, issues] of Object.entries(themes)) {
    for (const issue of issues) {
      issueToTheme[issue] = theme;
      issueToPillar[issue] = pillar as PillarType;
    }
  }
}

export const MSCI_METHODOLOGY_INDEX_URL = "https://www.msci.com/legal/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies";

// 用户提供的 2026 年议题级方法学 PDF。
export const methodology2026Urls: Record<string, string> = {
  "Climate Change Vulnerability": "https://www.msci.com/downloads/documents/access/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies/esg-ratings/esg-key-issue-methodologies/environmental-pillar/climate-change-vulnerability-key-issue.pdf",
  "Electronic Waste": "https://www.msci.com/downloads/documents/access/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies/esg-ratings/esg-key-issue-methodologies/environmental-pillar/electronic-waste-key-issue.pdf",
  "Biodiversity & Land Use": "https://www.msci.com/downloads/documents/access/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies/esg-ratings/esg-key-issue-methodologies/environmental-pillar/biodiversity-and-land-use-key-issue.pdf",
  "Product Carbon Footprint": "https://www.msci.com/downloads/documents/access/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies/esg-ratings/esg-key-issue-methodologies/environmental-pillar/product-carbon-footprint-key-issue.pdf",
};

const issuePdfUrl = (pillar: "environmental" | "social" | "governance", slug: string) =>
  `https://www.msci.com/downloads/documents/access/sustainability-and-climate-resources-and-disclosures/msci-sustainability-and-climate-methodologies/esg-ratings/esg-key-issue-methodologies/${pillar}-pillar/${slug}-key-issue.pdf`;

// 按 MSCI 官方目录格式生成其余议题的议题级 PDF 链接；是否已发布由后续访问结果确认。
export const methodologyDirectUrls: Record<string, string> = {
  ...methodology2026Urls,
  "Carbon Emissions": issuePdfUrl("environmental", "carbon-emissions"),
  "Financing Environmental Impact": issuePdfUrl("environmental", "financing-environmental-impact"),
  "Raw Material Sourcing": issuePdfUrl("environmental", "raw-material-sourcing"),
  "Water Stress": issuePdfUrl("environmental", "water-stress"),
  "Packaging Material & Waste": issuePdfUrl("environmental", "packaging-material-and-waste"),
  "Toxic Emissions & Waste": issuePdfUrl("environmental", "toxic-emissions-and-waste"),
  "Opportunities in Clean Tech": issuePdfUrl("environmental", "opportunities-in-clean-tech"),
  "Opportunities in Green Building": issuePdfUrl("environmental", "opportunities-in-green-building"),
  "Opportunities in Renewable Energy": issuePdfUrl("environmental", "opportunities-in-renewable-energy"),
  "Health & Safety": issuePdfUrl("social", "health-and-safety"),
  "Human Capital Development": issuePdfUrl("social", "human-capital-development"),
  "Labor Management": issuePdfUrl("social", "labor-management"),
  "Supply Chain Labor Standards": issuePdfUrl("social", "supply-chain-labor-standards"),
  "Chemical Safety": issuePdfUrl("social", "chemical-safety"),
  "Consumer Financial Protection": issuePdfUrl("social", "consumer-financial-protection"),
  "Privacy & Data Security": issuePdfUrl("social", "privacy-and-data-security"),
  "Product Safety & Quality": issuePdfUrl("social", "product-safety-and-quality"),
  "Responsible Investment": issuePdfUrl("social", "responsible-investment"),
  "Community Relations": issuePdfUrl("social", "community-relations"),
  "Controversial Sourcing": issuePdfUrl("social", "controversial-sourcing"),
  "Access to Finance": issuePdfUrl("social", "access-to-finance"),
  "Access to Health Care": issuePdfUrl("social", "access-to-health-care"),
  "Opportunities in Nutrition & Health": issuePdfUrl("social", "opportunities-in-nutrition-and-health"),
  "Board": issuePdfUrl("governance", "board"),
  "Pay": issuePdfUrl("governance", "pay"),
  "Ownership & Control": issuePdfUrl("governance", "ownership-and-control"),
  "Accounting": issuePdfUrl("governance", "accounting"),
  "Business Ethics": issuePdfUrl("governance", "business-ethics"),
  "Tax Transparency": issuePdfUrl("governance", "tax-transparency"),
};

// 方法学文件链接
const methodologyUrls: Record<string, string> = {
  "ESG Ratings Methodology (Core)": MSCI_METHODOLOGY_INDEX_URL,
  "Carbon Emissions": MSCI_METHODOLOGY_INDEX_URL,
  "Climate Change Vulnerability": methodology2026Urls["Climate Change Vulnerability"],
  "Financing Environmental Impact": MSCI_METHODOLOGY_INDEX_URL,
  "Product Carbon Footprint": methodology2026Urls["Product Carbon Footprint"],
  "Biodiversity & Land Use": methodology2026Urls["Biodiversity & Land Use"],
  "Raw Material Sourcing": MSCI_METHODOLOGY_INDEX_URL,
  "Water Stress": MSCI_METHODOLOGY_INDEX_URL,
  "Electronic Waste": methodology2026Urls["Electronic Waste"],
  "Packaging Material & Waste": MSCI_METHODOLOGY_INDEX_URL,
  "Toxic Emissions & Waste": MSCI_METHODOLOGY_INDEX_URL,
  "Opportunities in Clean Tech": MSCI_METHODOLOGY_INDEX_URL,
  "Opportunities in Green Building": MSCI_METHODOLOGY_INDEX_URL,
  "Opportunities in Renewable Energy": MSCI_METHODOLOGY_INDEX_URL,
  "Health & Safety": MSCI_METHODOLOGY_INDEX_URL,
  "Human Capital Development": MSCI_METHODOLOGY_INDEX_URL,
  "Labor Management": MSCI_METHODOLOGY_INDEX_URL,
  "Supply Chain Labor Standards": MSCI_METHODOLOGY_INDEX_URL,
  "Chemical Safety": MSCI_METHODOLOGY_INDEX_URL,
  "Consumer Financial Protection": MSCI_METHODOLOGY_INDEX_URL,
  "Privacy & Data Security": MSCI_METHODOLOGY_INDEX_URL,
  "Product Safety & Quality": MSCI_METHODOLOGY_INDEX_URL,
  "Responsible Investment": MSCI_METHODOLOGY_INDEX_URL,
  "Community Relations": MSCI_METHODOLOGY_INDEX_URL,
  "Controversial Sourcing": MSCI_METHODOLOGY_INDEX_URL,
  "Access to Finance": MSCI_METHODOLOGY_INDEX_URL,
  "Access to Health Care": MSCI_METHODOLOGY_INDEX_URL,
  "Opportunities in Nutrition & Health": MSCI_METHODOLOGY_INDEX_URL,
  "Board": MSCI_METHODOLOGY_INDEX_URL,
  "Pay": MSCI_METHODOLOGY_INDEX_URL,
  "Ownership & Control": MSCI_METHODOLOGY_INDEX_URL,
  "Accounting": MSCI_METHODOLOGY_INDEX_URL,
  "Business Ethics": MSCI_METHODOLOGY_INDEX_URL,
  "Tax Transparency": MSCI_METHODOLOGY_INDEX_URL
};

// 议题中文名称映射
export const issueNamesCN: Record<string, string> = {
  "Carbon Emissions": "碳排放",
  "Climate Change Vulnerability": "气候变化脆弱性",
  "Financing Environmental Impact": "环境影响融资",
  "Product Carbon Footprint": "产品碳足迹",
  "Biodiversity & Land Use": "生物多样性与土地利用",
  "Raw Material Sourcing": "原材料采购",
  "Water Stress": "水资源压力",
  "Electronic Waste": "电子废弃物",
  "Packaging Material & Waste": "包装材料与废弃物",
  "Toxic Emissions & Waste": "有毒排放与废弃物",
  "Opportunities in Clean Tech": "清洁技术机遇",
  "Opportunities in Green Building": "绿色建筑机遇",
  "Opportunities in Renewable Energy": "可再生能源机遇",
  "Health & Safety": "健康与安全",
  "Human Capital Development": "人力资本开发",
  "Labor Management": "劳动管理",
  "Supply Chain Labor Standards": "供应链劳工标准",
  "Chemical Safety": "化学品安全",
  "Consumer Financial Protection": "消费者金融保护",
  "Privacy & Data Security": "隐私与数据安全",
  "Product Safety & Quality": "产品安全与质量",
  "Responsible Investment": "负责任投资",
  "Community Relations": "社区关系",
  "Controversial Sourcing": "争议性采购",
  "Access to Finance": "金融服务可及性",
  "Access to Health Care": "医疗服务可及性",
  "Opportunities in Nutrition & Health": "营养与健康机遇",
  "Board": "董事会",
  "Pay": "薪酬",
  "Ownership & Control": "所有权与控制",
  "Accounting": "会计",
  "Business Ethics": "商业道德",
  "Tax Transparency": "税务透明度"
};

// 主题中文名称映射
export const themeNamesCN: Record<string, string> = {
  "Climate Change": "气候变化",
  "Natural Capital": "自然资本",
  "Pollution & Waste": "污染与废弃物",
  "Environmental Opportunities": "环境机遇",
  "Human Capital": "人力资本",
  "Product Liability": "产品责任",
  "Stakeholder Opposition": "利益相关方反对",
  "Social Opportunities": "社会机遇",
  "Corporate Governance": "公司治理",
  "Corporate Behavior": "企业行为"
};

// 支柱中文名称映射
export const pillarNamesCN: Record<PillarType, string> = {
  Environment: "环境",
  Social: "社会",
  Governance: "治理"
};

// 行业板块中文名称
export const sectorNamesCN: Record<string, string> = {
  "Energy": "能源",
  "Materials": "材料",
  "Industrials": "工业",
  "Consumer Discretionary": "可选消费",
  "Consumer Staples": "必需消费",
  "Health Care": "医疗保健",
  "Financials": "金融",
  "Information Technology": "信息技术",
  "Communication Services": "通信服务",
  "Utilities": "公用事业",
  "Real Estate": "房地产"
};

// 行业中文名称
export const industryNamesCN: Record<string, string> = {
  "Oil & Gas Exploration & Production": "油气勘探与生产",
  "Integrated Oil & Gas": "综合油气",
  "Oil & Gas Refining & Marketing": "油气炼化与销售",
  "Oil & Gas Equipment & Services": "油气设备与服务",
  "Oil & Gas Storage & Transportation": "油气储运",
  "Coal & Consumable Fuels": "煤炭与消费燃料",
  "Chemicals": "化工",
  "Construction Materials": "建筑材料",
  "Metals & Mining": "金属与采矿",
  "Paper & Forest Products": "纸业与林产品",
  "Containers & Packaging": "容器与包装",
  "Steel": "钢铁",
  "Aluminum": "铝业",
  "Aerospace & Defense": "航空航天与国防",
  "Building Products": "建筑产品",
  "Construction & Engineering": "建筑与工程",
  "Electrical Equipment": "电气设备",
  "Industrial Conglomerates": "工业综合企业",
  "Machinery": "机械",
  "Airlines": "航空公司",
  "Marine Transportation": "海运",
  "Road & Rail": "公路与铁路",
  "Air Freight & Logistics": "航空货运与物流",
  "Trading Companies & Distributors": "贸易公司与分销商",
  "Professional Services": "专业服务",
  "Commercial Services & Supplies": "商业服务与用品",
  "Automobiles": "汽车",
  "Auto Components": "汽车零部件",
  "Hotels, Restaurants & Leisure": "酒店、餐饮与休闲",
  "Household Durables": "家用耐用品",
  "Leisure Products": "休闲产品",
  "Textiles, Apparel & Luxury Goods": "纺织、服装与奢侈品",
  "Multiline Retail": "多元零售",
  "Specialty Retail": "专业零售",
  "Internet & Direct Marketing Retail": "互联网与直销零售",
  "Food Products": "食品",
  "Beverages": "饮料",
  "Tobacco": "烟草",
  "Household Products": "家用产品",
  "Personal Products": "个人用品",
  "Food & Staples Retailing": "食品与日用品零售",
  "Pharmaceuticals": "制药",
  "Biotechnology": "生物技术",
  "Health Care Equipment & Supplies": "医疗设备与用品",
  "Health Care Providers & Services": "医疗服务提供商",
  "Health Care Technology": "医疗技术",
  "Life Sciences Tools & Services": "生命科学工具与服务",
  "Banks": "银行",
  "Insurance": "保险",
  "Diversified Financial Services": "多元金融服务",
  "Capital Markets": "资本市场",
  "Consumer Finance": "消费金融",
  "Mortgage REITs": "抵押REITs",
  "Software": "软件",
  "IT Services": "IT服务",
  "Semiconductors & Semiconductor Equipment": "半导体与半导体设备",
  "Technology Hardware, Storage & Peripherals": "技术硬件、存储与外设",
  "Electronic Equipment, Instruments & Components": "电子设备、仪器与元件",
  "Communications Equipment": "通信设备",
  "Interactive Media & Services": "互动媒体与服务",
  "Entertainment": "娱乐",
  "Media": "媒体",
  "Diversified Telecommunication Services": "多元电信服务",
  "Wireless Telecommunication Services": "无线电信服务",
  "Electric Utilities": "电力公用事业",
  "Gas Utilities": "燃气公用事业",
  "Multi-Utilities": "多元公用事业",
  "Water Utilities": "水务公用事业",
  "Independent Power & Renewable Electricity Producers": "独立电力与可再生能源生产商",
  "Equity REITs": "权益REITs",
  "Real Estate Management & Development": "房地产管理与开发"
};

// 构建行业数据的辅助函数
function buildKeyIssues(issueData: Record<string, Record<string, string>>): KeyIssue[] {
  const rawIssues: KeyIssue[] = [];
  for (const [pillar, pillarIssues] of Object.entries(issueData)) {
    for (const [issueName, importance] of Object.entries(pillarIssues)) {
      rawIssues.push({
        name: issueName,
        pillar: pillar as PillarType,
        theme: issueToTheme[issueName] || "Unknown",
        importance: importance as ImportanceLevel,
        methodologyUrl: methodologyDirectUrls[issueName] || methodologyUrls[issueName] || methodologyUrls["ESG Ratings Methodology (Core)"]
      });
    }
  }
  return calcIssueWeights(rawIssues);
}

// 完整行业数据
export const sectors: Sector[] = [
  {
    name: "Energy",
    code: "10",
    industries: [
      { name: "Oil & Gas Exploration & Production", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Biodiversity & Land Use": "high", "Toxic Emissions & Waste": "medium", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Community Relations": "medium", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Integrated Oil & Gas", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "medium", "Biodiversity & Land Use": "medium", "Toxic Emissions & Waste": "medium", "Water Stress": "low", "Opportunities in Renewable Energy": "low" }, Social: { "Health & Safety": "high", "Community Relations": "medium", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Oil & Gas Refining & Marketing", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "medium", "Toxic Emissions & Waste": "high", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Community Relations": "low", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Oil & Gas Equipment & Services", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "high", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Oil & Gas Storage & Transportation", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Biodiversity & Land Use": "medium", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "high", "Community Relations": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Coal & Consumable Fuels", sector: "Energy", sectorCode: "10", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "high", "Biodiversity & Land Use": "high", "Toxic Emissions & Waste": "high", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Community Relations": "medium", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Materials",
    code: "15",
    industries: [
      { name: "Chemicals", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Toxic Emissions & Waste": "high", "Water Stress": "medium", "Opportunities in Clean Tech": "low" }, Social: { "Health & Safety": "high", "Chemical Safety": "high", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Construction Materials", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Biodiversity & Land Use": "medium", "Toxic Emissions & Waste": "medium", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Community Relations": "low", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Metals & Mining", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Biodiversity & Land Use": "high", "Toxic Emissions & Waste": "high", "Water Stress": "high" }, Social: { "Health & Safety": "high", "Community Relations": "high", "Labor Management": "medium", "Supply Chain Labor Standards": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Paper & Forest Products", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Biodiversity & Land Use": "high", "Raw Material Sourcing": "high", "Toxic Emissions & Waste": "medium", "Water Stress": "medium", "Packaging Material & Waste": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Containers & Packaging", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Packaging Material & Waste": "high", "Toxic Emissions & Waste": "medium", "Raw Material Sourcing": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Steel", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Toxic Emissions & Waste": "high", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Aluminum", sector: "Materials", sectorCode: "15", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Biodiversity & Land Use": "medium", "Toxic Emissions & Waste": "high", "Water Stress": "medium" }, Social: { "Health & Safety": "high", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Industrials",
    code: "20",
    industries: [
      { name: "Aerospace & Defense", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Product Carbon Footprint": "medium", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Product Safety & Quality": "high", "Controversial Sourcing": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Building Products", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Green Building": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "low", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Construction & Engineering", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Biodiversity & Land Use": "low", "Opportunities in Green Building": "medium" }, Social: { "Health & Safety": "high", "Labor Management": "medium", "Supply Chain Labor Standards": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Electrical Equipment", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "high", "Opportunities in Renewable Energy": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Industrial Conglomerates", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "low" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Machinery", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Product Carbon Footprint": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Airlines", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "high" }, Social: { "Health & Safety": "medium", "Labor Management": "high", "Privacy & Data Security": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Marine Transportation", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Road & Rail", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "medium" }, Social: { "Health & Safety": "high", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Air Freight & Logistics", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Product Carbon Footprint": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Trading Companies & Distributors", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Professional Services", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "high", "Labor Management": "high", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Commercial Services & Supplies", sector: "Industrials", sectorCode: "20", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Consumer Discretionary",
    code: "25",
    industries: [
      { name: "Automobiles", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Product Carbon Footprint": "high", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "high" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Auto Components", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Product Safety & Quality": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Hotels, Restaurants & Leisure", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "low" }, Social: { "Health & Safety": "medium", "Human Capital Development": "medium", "Labor Management": "high", "Supply Chain Labor Standards": "low", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Household Durables", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Product Carbon Footprint": "medium", "Electronic Waste": "medium", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "low", "Labor Management": "medium", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Leisure Products", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Labor Management": "medium", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Textiles, Apparel & Luxury Goods", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Raw Material Sourcing": "medium", "Toxic Emissions & Waste": "medium", "Packaging Material & Waste": "low" }, Social: { "Labor Management": "medium", "Supply Chain Labor Standards": "high", "Chemical Safety": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Multiline Retail", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "medium", "Labor Management": "high", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Specialty Retail", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "medium", "Labor Management": "high", "Supply Chain Labor Standards": "low", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Internet & Direct Marketing Retail", sector: "Consumer Discretionary", sectorCode: "25", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Packaging Material & Waste": "medium" }, Social: { "Human Capital Development": "medium", "Labor Management": "high", "Supply Chain Labor Standards": "medium", "Privacy & Data Security": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Consumer Staples",
    code: "30",
    industries: [
      { name: "Food Products", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "medium", "Biodiversity & Land Use": "medium", "Raw Material Sourcing": "medium", "Packaging Material & Waste": "medium" }, Social: { "Labor Management": "low", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "high", "Opportunities in Nutrition & Health": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Beverages", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "high", "Packaging Material & Waste": "high", "Raw Material Sourcing": "medium" }, Social: { "Labor Management": "low", "Supply Chain Labor Standards": "low", "Product Safety & Quality": "medium", "Opportunities in Nutrition & Health": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Tobacco", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Product Safety & Quality": "high", "Controversial Sourcing": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Household Products", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "medium", "Packaging Material & Waste": "high", "Raw Material Sourcing": "medium" }, Social: { "Labor Management": "low", "Chemical Safety": "high", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Personal Products", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "medium", "Packaging Material & Waste": "medium", "Raw Material Sourcing": "medium" }, Social: { "Labor Management": "low", "Supply Chain Labor Standards": "medium", "Chemical Safety": "high", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Food & Staples Retailing", sector: "Consumer Staples", sectorCode: "30", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Packaging Material & Waste": "medium" }, Social: { "Human Capital Development": "medium", "Labor Management": "high", "Supply Chain Labor Standards": "medium", "Product Safety & Quality": "medium", "Opportunities in Nutrition & Health": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Health Care",
    code: "35",
    industries: [
      { name: "Pharmaceuticals", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "low", "Human Capital Development": "medium", "Labor Management": "low", "Product Safety & Quality": "high", "Access to Health Care": "high", "Chemical Safety": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Biotechnology", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Human Capital Development": "medium", "Product Safety & Quality": "high", "Access to Health Care": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Health Care Equipment & Supplies", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Human Capital Development": "medium", "Product Safety & Quality": "high", "Access to Health Care": "medium", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Health Care Providers & Services", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "high", "Labor Management": "medium", "Product Safety & Quality": "high", "Access to Health Care": "medium", "Privacy & Data Security": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Health Care Technology", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "high", "Privacy & Data Security": "high", "Product Safety & Quality": "medium", "Access to Health Care": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Life Sciences Tools & Services", sector: "Health Care", sectorCode: "35", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Toxic Emissions & Waste": "low" }, Social: { "Human Capital Development": "medium", "Product Safety & Quality": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Financials",
    code: "40",
    industries: [
      { name: "Banks", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Financing Environmental Impact": "high" }, Social: { "Human Capital Development": "medium", "Labor Management": "low", "Privacy & Data Security": "high", "Consumer Financial Protection": "high", "Access to Finance": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Insurance", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Climate Change Vulnerability": "high", "Financing Environmental Impact": "medium" }, Social: { "Human Capital Development": "medium", "Privacy & Data Security": "medium", "Consumer Financial Protection": "high", "Responsible Investment": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Diversified Financial Services", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Financing Environmental Impact": "medium" }, Social: { "Human Capital Development": "medium", "Privacy & Data Security": "high", "Consumer Financial Protection": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Capital Markets", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Financing Environmental Impact": "medium" }, Social: { "Human Capital Development": "high", "Privacy & Data Security": "medium", "Consumer Financial Protection": "medium", "Responsible Investment": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Consumer Finance", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "medium", "Privacy & Data Security": "high", "Consumer Financial Protection": "high", "Access to Finance": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Mortgage REITs", sector: "Financials", sectorCode: "40", keyIssues: buildKeyIssues({ Environment: { "Financing Environmental Impact": "medium" }, Social: { "Consumer Financial Protection": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Information Technology",
    code: "45",
    industries: [
      { name: "Software", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "high", "Labor Management": "medium", "Privacy & Data Security": "high", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "IT Services", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium" }, Social: { "Human Capital Development": "high", "Labor Management": "medium", "Privacy & Data Security": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Semiconductors & Semiconductor Equipment", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "medium" }, Social: { "Human Capital Development": "high", "Labor Management": "medium", "Supply Chain Labor Standards": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Technology Hardware, Storage & Peripherals", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Product Carbon Footprint": "medium", "Electronic Waste": "high", "Toxic Emissions & Waste": "medium" }, Social: { "Human Capital Development": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "high", "Privacy & Data Security": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Electronic Equipment, Instruments & Components", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Electronic Waste": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Clean Tech": "medium" }, Social: { "Health & Safety": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Communications Equipment", sector: "Information Technology", sectorCode: "45", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low", "Electronic Waste": "medium" }, Social: { "Human Capital Development": "medium", "Labor Management": "medium", "Supply Chain Labor Standards": "medium", "Privacy & Data Security": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Communication Services",
    code: "50",
    industries: [
      { name: "Interactive Media & Services", sector: "Communication Services", sectorCode: "50", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "high", "Labor Management": "medium", "Privacy & Data Security": "high", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Entertainment", sector: "Communication Services", sectorCode: "50", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "medium", "Labor Management": "medium", "Privacy & Data Security": "medium", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Media", sector: "Communication Services", sectorCode: "50", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "low" }, Social: { "Human Capital Development": "medium", "Labor Management": "medium", "Privacy & Data Security": "high", "Product Safety & Quality": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Diversified Telecommunication Services", sector: "Communication Services", sectorCode: "50", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Electronic Waste": "low" }, Social: { "Human Capital Development": "medium", "Labor Management": "medium", "Privacy & Data Security": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Wireless Telecommunication Services", sector: "Communication Services", sectorCode: "50", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Electronic Waste": "low" }, Social: { "Human Capital Development": "medium", "Privacy & Data Security": "high" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Utilities",
    code: "55",
    industries: [
      { name: "Electric Utilities", sector: "Utilities", sectorCode: "55", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Water Stress": "medium", "Biodiversity & Land Use": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Renewable Energy": "high" }, Social: { "Health & Safety": "medium", "Community Relations": "medium", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Gas Utilities", sector: "Utilities", sectorCode: "55", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "medium", "Community Relations": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Multi-Utilities", sector: "Utilities", sectorCode: "55", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Water Stress": "medium", "Toxic Emissions & Waste": "medium", "Opportunities in Renewable Energy": "medium" }, Social: { "Health & Safety": "medium", "Community Relations": "low", "Labor Management": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Water Utilities", sector: "Utilities", sectorCode: "55", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "high", "Toxic Emissions & Waste": "medium" }, Social: { "Health & Safety": "medium", "Community Relations": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Independent Power & Renewable Electricity Producers", sector: "Utilities", sectorCode: "55", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "high", "Biodiversity & Land Use": "medium", "Opportunities in Renewable Energy": "high" }, Social: { "Health & Safety": "medium", "Community Relations": "medium" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  },
  {
    name: "Real Estate",
    code: "60",
    industries: [
      { name: "Equity REITs", sector: "Real Estate", sectorCode: "60", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "low", "Opportunities in Green Building": "high" }, Social: { "Health & Safety": "low", "Labor Management": "low", "Community Relations": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) },
      { name: "Real Estate Management & Development", sector: "Real Estate", sectorCode: "60", keyIssues: buildKeyIssues({ Environment: { "Carbon Emissions": "medium", "Water Stress": "low", "Opportunities in Green Building": "high" }, Social: { "Health & Safety": "medium", "Labor Management": "low", "Community Relations": "low" }, Governance: { "Board": "standard", "Pay": "standard", "Ownership & Control": "standard", "Accounting": "standard", "Business Ethics": "standard", "Tax Transparency": "standard" } }) }
    ]
  }
];

// 获取所有行业列表（扁平化）
export function getAllIndustries(): Industry[] {
  return sectors.flatMap(s => s.industries);
}

// 按行业名称搜索
export function searchIndustries(query: string): Industry[] {
  const q = query.toLowerCase();
  return getAllIndustries().filter(ind => {
    const enName = ind.name.toLowerCase();
    const cnName = (industryNamesCN[ind.name] || "").toLowerCase();
    const sectorEN = ind.sector.toLowerCase();
    const sectorCN = (sectorNamesCN[ind.sector] || "").toLowerCase();
    return enName.includes(q) || cnName.includes(q) || sectorEN.includes(q) || sectorCN.includes(q);
  });
}

// 获取行业的非标准（E&S）关键议题
export function getESKeyIssues(industry: Industry): KeyIssue[] {
  return industry.keyIssues.filter(i => i.importance !== "standard");
}

// 获取行业的治理议题
export function getGovernanceIssues(industry: Industry): KeyIssue[] {
  return industry.keyIssues.filter(i => i.pillar === "Governance");
}

// 获取支柱颜色
export function getPillarColor(pillar: PillarType): string {
  switch (pillar) {
    case "Environment": return "esg-env";
    case "Social": return "esg-social";
    case "Governance": return "esg-gov";
  }
}

// 获取重要性等级标签
export function getImportanceLabelCN(level: ImportanceLevel): string {
  switch (level) {
    case "high": return "高";
    case "medium": return "中";
    case "low": return "低";
    case "standard": return "标准";
  }
}

// 获取方法学核心文件URL
export function getCoreMethodologyUrl(): string {
  return methodologyUrls["ESG Ratings Methodology (Core)"];
}
