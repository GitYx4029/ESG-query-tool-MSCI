// Real PDF.js + Tesseract acceptance check. Use only synthetic or public reports.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import {
  buildEvidenceIndex,
  analyzeLocally,
  identifyIndustries,
} from "../client/src/lib/reportEngine.ts";
import type { ReportPage } from "../shared/report.ts";
const folder = process.argv[2];
if (!folder) throw new Error("Pass fixture directory");
const start = performance.now();
const options = {
  cMapUrl: resolve("client/public/report-assets/cmaps") + "/",
  cMapPacked: true,
  standardFontDataUrl:
    resolve("client/public/report-assets/standard_fonts") + "/",
};
const task = getDocument({
  ...options,
  data: new Uint8Array(await readFile(resolve(folder, "text-report.pdf"))),
});
const pdf = await task.promise;
const pages: ReportPage[] = [];
for (let n = 1; n <= pdf.numPages; n++) {
  const page = await pdf.getPage(n);
  const { items } = await page.getTextContent();
  pages.push({
    page: n,
    method: "text",
    text: items
      .filter(i => "str" in i)
      .map(i => ("str" in i ? i.str : ""))
      .join("\n"),
  });
}
assert.equal(pages.length, 4);
assert.equal(
  identifyIndustries(pages)[0].industry.name,
  "Real Estate Management & Development"
);
const finding = analyzeLocally(
  buildEvidenceIndex(pages),
  pages,
  "Health & Safety"
).find(f => f.criterionId.endsWith(":4"))!;
assert.equal(finding.evidence[0].page, 3);
assert.match(finding.evidence[0].quote, /死亡人数0/);
await task.destroy();
const textMs = Math.round(performance.now() - start);
const scan = getDocument({
  ...options,
  data: new Uint8Array(await readFile(resolve(folder, "scanned-report.pdf"))),
});
const scanned = await scan.promise;
assert.equal(scanned.numPages, 2);
assert.equal(
  (await (await scanned.getPage(1)).getTextContent()).items.length,
  0
);
await scan.destroy();
const ocrStart = performance.now();
const worker = await createWorker("chi_sim+eng", 1, {
  langPath: resolve("client/public/report-assets"),
  cachePath: resolve(folder),
  gzip: true,
});
try {
  const { data } = await worker.recognize(resolve(folder, "report-page-3.png"));
  assert.match(data.text.replace(/\s/g, ""), /120万平方米/);
  assert.match(data.text.replace(/\s/g, ""), /死亡人数0/);
  assert.match(data.text, /LTIR/);
  const ocrPage: ReportPage = {
    page: 2,
    text: data.text,
    method: "ocr",
    confidence: data.confidence,
  };
  assert.equal(
    analyzeLocally(
      buildEvidenceIndex([ocrPage]),
      [ocrPage],
      "Health & Safety"
    ).find(f => f.criterionId.endsWith(":4"))?.evidence[0].page,
    2
  );
  console.log(
    JSON.stringify({
      textPdf: {
        pages: pages.length,
        milliseconds: textMs,
        industry: "Real Estate Management & Development",
        zeroFatalitiesPage: 3,
      },
      scannedPdf: { pages: 2, textLayer: false },
      ocr: {
        milliseconds: Math.round(performance.now() - ocrStart),
        confidence: Math.round(data.confidence),
        area: true,
        fatalitiesZero: true,
        LTIR: true,
      },
    })
  );
} finally {
  await worker.terminate();
}
