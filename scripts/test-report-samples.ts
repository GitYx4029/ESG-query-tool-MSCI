// Read supplied PDFs locally. No network, model, upload, or report persistence.
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {textFromPdfItems,type PdfTextItem} from "../client/src/lib/reportText";
import {analyzeLocally,buildEvidenceIndex,identifyIndustries} from "../client/src/lib/reportEngine";
import {buildReportCsv} from "../client/src/lib/reportExport";
import {criteriaForIssue} from "../client/src/lib/reportFramework";
import type {ReportPage} from "../shared/report";
const pdfRoot=dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
const paths=process.argv.slice(2);
if(!paths.length)throw new Error("Pass one or more local PDF paths");
for(const path of paths){
 const start=performance.now();const pdf=await getDocument({data:new Uint8Array(await readFile(resolve(path))),cMapUrl:pdfRoot+"/cmaps/",cMapPacked:true,standardFontDataUrl:pdfRoot+"/standard_fonts/",wasmUrl:pdfRoot+"/wasm/"}).promise;
 const pages:ReportPage[]=[];
 try{
  for(let n=1;n<=pdf.numPages;n++){
   const page=await pdf.getPage(n);const content=await page.getTextContent();
   const {text,tables}=textFromPdfItems(content.items.filter(i=>"str"in i) as PdfTextItem[],page.getViewport({scale:1}).width);
   pages.push({page:n,text,tables,method:text.replace(/\s/g,"").length>=35?"text":"unread"});page.cleanup();
  }
  const extractMs=Math.round(performance.now()-start);const reviewStart=performance.now();
  const index=buildEvidenceIndex(pages);const candidates=identifyIndustries(pages);const industry=candidates[0]?.industry;
  assert(industry,"No industry candidate; select manually and investigate");
  const results=Object.fromEntries(industry.keyIssues.map(i=>[i.name,analyzeLocally(index,pages,i.name)]));
  for(const [issue,findings]of Object.entries(results)){
   assert.equal(findings.length,criteriaForIssue(issue).length);
   for(const finding of findings){
    assert(!["disclosed","partial"].includes(finding.status),"Rule retrieval must not claim semantic sufficiency");
    for(const evidence of finding.evidence)assert(pages[evidence.page-1].text.includes(evidence.quote),"Quote/page mismatch");
   }
  }
  const exported=buildReportCsv({file:path,industry:industry.name,results,pages});
  assert(exported.csv.startsWith("\uFEFF"));assert(exported.rowCount>=Object.values(results).flat().length);
  console.log(JSON.stringify({file:path,pages:pages.length,textPages:pages.filter(p=>p.method==="text").length,industry:industry.name,industryPage:candidates[0].evidence.page,issues:industry.keyIssues.length,checks:Object.values(results).flat().length,related:Object.values(results).flat().filter(f=>f.evidence.length).length,csvEvidenceRows:exported.rowCount,tablePages:pages.filter(p=>p.tables?.length).length,extractMs,reviewMs:Math.round(performance.now()-reviewStart)}));
 }finally{await pdf.destroy();}
}
