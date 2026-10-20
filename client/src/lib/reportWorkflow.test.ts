import {describe,it,expect} from "vitest";
import {textFromPdfItems,type PdfTextItem} from "./reportText";
import {buildEvidenceIndex,analyzeLocally,identifyIndustries,normalizeText} from "./reportEngine";
import {buildReportCsv} from "./reportExport";
import type {ReportPage} from "@shared/report";
const item=(str:string,x:number,y:number,width=20):PdfTextItem=>({str,transform:[9,0,0,9,x,y],width,height:9});
describe("real report regressions",()=>{
 it("matches traditional and spaced Chinese while retaining original evidence",()=>{
  const p:ReportPage={page:30,method:"text",text:"本集團全體員工須簽署廉潔承諾，並須完成反 腐 敗 培 訓。公司設立舉報渠道並保護舉報人。"};
  const result=analyzeLocally(buildEvidenceIndex([p]),[p],"Business Ethics");
  expect(result[0].evidence.length).toBeGreaterThan(0);
  expect(result[1].evidence[0].quote).toContain("舉報");
  expect(result[2].evidence[0].quote).toContain("反 腐 敗 培 訓");
  expect(normalizeText("範圍、環境、供應鏈")).toBe("范围、环境、供应链");
 });
 it("recognizes apparel and inverter/storage businesses without using filenames",()=>{
  expect(identifyIndustries([{page:11,method:"text",text:"關於我們：本公司專注於羽絨服主業，是紡織服裝品牌，從事服裝製造。"}])[0].industry.name).toBe("Textiles, Apparel & Luxury Goods");
  expect(identifyIndustries([{page:6,method:"text",text:"关于我们：公司专注光伏逆变器、储能系统、风电变流和新能源电源设备的研产销服。"}])[0].industry.name).toBe("Electrical Equipment");
 });
 it("restores column-drawn tables, preserving descending years, zero and absent values",()=>{
  const items=[item("指标",20,200),item("单位",150,200),item("2025 年",220,200),item("2024 年",300,200),
   item("员工因工死亡人数",20,180,100),item("百万工时损工事故率（LTIFR）",20,160,110),item("可记录工伤率（TRIR）",20,140,110),
   item("人",150,180),item("次/百万工时",140,160,60),item("次/二十万工时",140,140,60),
   item("0",230,180),item("0.25",230,160),item("0.13",230,140),item("0",310,180),item("/",310,160),item("0.23",310,140)];
  const parsed=textFromPdfItems(items,400);
  expect(parsed.tables).toHaveLength(1);
  expect(parsed.tables[0].rows[0]).toEqual(["员工因工死亡人数","人","0","0"]);
  const pages:ReportPage[]=[{page:167,method:"text",...parsed}];
  const results=analyzeLocally(buildEvidenceIndex(pages),pages,"Health & Safety");
  expect(results[3].elements?.find(e=>e.label==="员工死亡人数")?.detail).toContain("2025 年：0 人");
  expect(results[3].elements?.find(e=>e.label==="承包商／外包人员死亡人数（按原称谓）")?.page).toBeUndefined();
  expect(results[4].elements?.[0].detail).toContain("0.25 次/百万工时");
  expect(results[4].elements?.[1].detail).toContain("0.13 次/二十万工时");
 });
 it("keeps adjacent tables and different-year headers separate",()=>{
  const items:PdfTextItem[]=[];
  for(const [x,year] of [[0,"2025 年"],[400,"2023 年"]] as const){
   items.push(item("指标",x+20,200),item("单位",x+120,200),item(year,x+200,200),item("2022 年",x+280,200));
   for(let r=0;r<3;r++)items.push(item(`表${x}指标${r}`,x+20,180-r*20,70),item("人",x+120,180-r*20),item(String(x+r),x+210,180-r*20),item("0",x+290,180-r*20));
  }
  const parsed=textFromPdfItems(items,800);
  expect(parsed.tables).toHaveLength(2);
  expect(parsed.tables[0].rows[0][2]).toBe("0");
  expect(parsed.tables[1].rows[0][2]).toBe("400");
  expect(parsed.tables[0].columns[2]).toBe("2025 年");
  expect(parsed.tables[1].columns[2]).toBe("2023 年");
 });
 it("does not relabel generic accident rates or unidentified fatality scope",()=>{
  const pages:ReportPage[]=[{page:51,method:"text",text:"因工死亡人数 | 人 | 0 | 0\n每百万工时安全事故率 | 件/百万工时 | 0.06 | 0.18",tables:[{columns:["指标","单位","2025 年","2024 年"],rows:[["因工死亡人数","人","0","0"],["每百万工时安全事故率","件/百万工时","0.06","0.18"]]}]}];
  const results=analyzeLocally(buildEvidenceIndex(pages),pages,"Health & Safety");
  expect(results[3].elements?.[0].page).toBeUndefined();
  expect(results[3].elements?.[2].detail).toContain("0 人");
  expect(results[4].elements?.[0].page).toBeUndefined();
  expect(results[4].elements?.[2].detail).toContain("0.06 件/百万工时");
 });
 it("exports detailed quotations beside their own pages and includes manual review",()=>{
  const findings=[{criterionId:"Health & Safety:4",status:"related" as const,summary:"test",gaps:[],evidence:[{id:"a",page:40,quote:'员工0人，"已确认"',method:"text" as const},{id:"b",page:51,quote:"承包商0人\n另一行",method:"text" as const}]}];
  const result=buildReportCsv({file:" =SUM(1,2).pdf",industry:"Chemicals",results:{"Health & Safety":findings},pages:[],detail:true,reviews:{"Health & Safety:4":"needs_more"}});
  expect(result.rowCount).toBe(2);
  expect(result.csv).toContain('"40","员工0人，""已确认"""');
  expect(result.csv).toContain('"51","承包商0人\n另一行"');
  expect(result.csv).toContain("仍需补充证据");
  expect(result.csv).toContain("' =SUM");
 });
});
