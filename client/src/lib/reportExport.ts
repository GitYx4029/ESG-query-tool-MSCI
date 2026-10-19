import { REPORT_FRAMEWORK_VERSION, statusLabels, type ReportFinding, type ReportPage } from "@shared/report";
import { criteriaForIssue } from "./reportFramework";
import { issueNamesCN } from "./esgData";
export const reviewLabels = {pending:"待复核",confirmed:"证据与要求相符",needs_more:"仍需补充证据",irrelevant:"线索不相关"};
export type ManualReview = keyof typeof reviewLabels;
export function buildReportCsv(input:{file:string;industry:string;results:Record<string,ReportFinding[]>;pages:ReportPage[];reviews?:Record<string,ManualReview>}){
  const rows:string[][]=[["文件","行业","议题","核验项","核验要点","检索结果","说明","待补充","核查要素（自动摘录，需核对）","人工复核","文件页序","原文","识别方式","框架版本","识别范围"]];
  const unread=input.pages.filter(p=>p.method==="unread").length;
  const weak=input.pages.filter(p=>p.method==="ocr"&&(p.confidence??0)<60).length;
  for(const [issue,findings] of Object.entries(input.results))for(const f of findings){
    const criterion=criteriaForIssue(issue).find(c=>c.id===f.criterionId);
    // One evidence per row keeps a quotation unambiguously linked to its page.
    for(const e of f.evidence.length?f.evidence:[undefined])rows.push([
      input.file,input.industry,issueNamesCN[issue]??issue,criterion?.label??f.criterionId,criterion?.requirement??"",statusLabels[f.status],f.summary,f.gaps.join("；"),
      (f.elements??[]).map(e=>`${e.label}：${e.detail}${e.page?`（文件第${e.page}页）`:""}`).join("\n"),reviewLabels[input.reviews?.[f.criterionId]??"pending"],
      e?String(e.page):"",e?.quote??"",e?(e.method==="ocr"?`OCR ${Math.round(e.confidence??0)}%`:"PDF文字"):"",REPORT_FRAMEWORK_VERSION,
      `${input.pages.length-unread}/${input.pages.length}页已识别；${weak}页OCR可信度较低`
    ]);
  }
  const cell=(value:string)=>`"${(/^[\s\uFEFF]*[=+\-@]/.test(value)||/^[\t\r]/.test(value)?"'":"")+value.replace(/"/g,'""')}"`;
  return {csv:"\uFEFF"+rows.map(r=>r.map(cell).join(",")).join("\r\n"),rowCount:rows.length-1};
}
