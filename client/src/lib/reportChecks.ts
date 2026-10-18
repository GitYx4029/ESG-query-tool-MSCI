import type { ReportCriterion, ReportElement, ReportPage } from "@shared/report";
import { normalizeText } from "./reportNormalize";
type Row = {page:number; label:string; year:string; unit:string; value:string};
export function checkElements(criterion: ReportCriterion, pages: ReportPage[]): ReportElement[] {
  if (!/^Health & Safety:[45]$/.test(criterion.id)) return [];
  const rows:Row[]=[];
  for(const page of pages) for(const table of page.tables??[]){
    const years=table.columns.map((s,i)=>({s,i,y:parseInt(s.match(/20\d{2}/)?.[0]??"0")})).filter(x=>x.y>0).sort((a,b)=>b.y-a.y);
    const year=years[0];if(!year)continue;
    for(const row of table.rows) if(row[year.i]!==undefined) rows.push({page:page.page,label:row[0],unit:row[1],year:year.s,value:row[year.i]});
  }
  const describe=(label:string, matches:Row[]):ReportElement=>{
    const usable=matches.filter(r=>/^\d[\d,.]*(?:\s*%)?$/.test(r.value));
    if(!usable.length)return {label,detail:"本次未定位到可对应年度、单位和统计对象的表格数据，请查阅原文确认。"};
    const best=usable.sort((a,b)=>parseInt(b.year)-parseInt(a.year)||a.page-b.page)[0];
    const conflicts=usable.some(r=>r.year.replace(/\s/g,"")===best.year.replace(/\s/g,"")&&r.unit===best.unit&&r.value!==best.value);
    return {label,detail:`${best.year}：${best.value} ${best.unit}；原指标“${best.label}”${conflicts?"。同年数据存在差异，须核对范围与口径":"。统计边界仍需核对原文"}`,page:best.page};
  };
  if(criterion.id.endsWith(":4")){
    const death=rows.filter(r=>/(?:因工|因公|工伤|工作).*(?:死亡|殉职)|fatalit/.test(normalizeText(r.label))&&!/比率|比例|死亡率|rate/.test(normalizeText(r.label)));
    const employee=death.filter(r=>/员工|职工|employee/.test(normalizeText(r.label)));
    const contractor=death.filter(r=>/承包商|承包方|外包|contractor/.test(normalizeText(r.label)));
    const general=death.filter(r=>!employee.includes(r)&&!contractor.includes(r));
    return [describe("员工死亡人数",employee),describe("承包商死亡人数",contractor),...(general.length?[describe("未明确统计对象的死亡数据",general)]:[])];
  }
  return [describe("LTIR / LTIFR",rows.filter(r=>/\blti(?:f)?r\b/i.test(r.label))),describe("TRIR / TRIFR",rows.filter(r=>/\btri(?:f)?r\b/i.test(r.label))),describe("其他安全事故率（保留原口径）",rows.filter(r=>/安全事故率/.test(normalizeText(r.label))&&!/\b(?:lti|tri)(?:f)?r\b/i.test(r.label)))];
}
