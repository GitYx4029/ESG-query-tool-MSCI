import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";
import type { Worker } from "tesseract.js";
import type { ReportPage } from "@shared/report";
import { textFromPdfItems, type PdfTextItem } from "./reportText";
import { parseOcrPage, enhanceOcrContrast, mergeOcrHeader } from "./reportOcr";
import { textQuality } from "./reportQuality";
export interface ExtractionProgress {
  message: string;
  current: number;
  total: number;
}
export interface ExtractionSession {
  pages: ReportPage[];
  total: number;
  ocr: (
    numbers: number[],
    signal: AbortSignal,
    progress: (p: ExtractionProgress) => void
  ) => Promise<void>;
  dispose: () => Promise<void>;
}
export function validateReportFiles(files: File[]) {
  if (!files.length)
    throw new Error("请选择一份PDF，或一组按页序排列的报告图片。");
  const pdfs = files.filter(f => /\.pdf$/i.test(f.name));
  if (pdfs.length && (pdfs.length !== 1 || files.length !== 1))
    throw new Error("每次只分析一份PDF；图片请作为同一份报告按页序上传。");
  if (files.length > 20)
    throw new Error("一次最多选择20张图片，请分批或转换为PDF。");
  if (files.some(f => !/\.(pdf|png|jpe?g|webp)$/i.test(f.name)))
    throw new Error("支持PDF、PNG、JPG或WebP；其他格式请先转换。");
  if (
    files.some(
      f => f.size > (/\.pdf$/i.test(f.name) ? 80 : 20) * 1024 * 1024
    ) ||
    files.reduce((s, f) => s + f.size, 0) > 80 * 1024 * 1024
  )
    throw new Error("PDF最多80MB，单张图片最多20MB，图片合计最多80MB。");
  if (files.some(f => !f.size)) throw new Error("文件为空，请重新选择。");
}
const checkAbort = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException("已取消识别", "AbortError");
};
function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const stop = () => reject(new DOMException("已取消识别", "AbortError"));
    if (signal.aborted) {
      stop();
      return;
    }
    signal.addEventListener("abort", stop, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", stop));
  });
}
const assets = () =>
  new URL(`${import.meta.env.BASE_URL}report-assets/`, window.location.origin)
    .href;
export async function extractReport(
  files: File[],
  signal: AbortSignal,
  progress: (p: ExtractionProgress) => void
): Promise<ExtractionSession> {
  validateReportFiles(files);
  let pdf: PDFDocumentProxy | undefined;
  let task: PDFDocumentLoadingTask | undefined;
  let worker: Worker | undefined;
  let disposed = false;
  const pages: ReportPage[] = [];
  const abort = () => {
    void worker?.terminate();
    void task?.destroy();
  };
  signal.addEventListener("abort", abort, { once: true });
  const dispose = async () => {
    disposed = true;
    signal.removeEventListener("abort", abort);
    await worker?.terminate().catch(() => {});
    worker = undefined;
    await task?.destroy().catch(() => {});
    pdf = undefined;
  };
  try {
    if (/\.pdf$/i.test(files[0].name)) {
      const data = new Uint8Array(await files[0].arrayBuffer());
      if (!new TextDecoder().decode(data.slice(0, 1024)).includes("%PDF-"))
        throw new Error("文件内容不是有效PDF，请检查格式。");
      checkAbort(signal);
      const pdfjs = await import("pdfjs-dist");
      const { default: workerUrl } =
        await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({
        data,
        cMapUrl: assets() + "cmaps/",
        cMapPacked: true,
        standardFontDataUrl: assets() + "standard_fonts/",
        wasmUrl: assets() + "wasm/",
      });
      pdf = await task.promise;
      if (pdf.numPages > 600) throw new Error("报告超过600页，请拆分后分析。");
      for (let n = 1; n <= pdf.numPages; n++) {
        checkAbort(signal);
        progress({
          message: `提取PDF文字 · 第${n}/${pdf.numPages}页`,
          current: n,
          total: pdf.numPages,
        });
        const page = await pdf.getPage(n);
        let text = "";
        let tables: ReportPage["tables"] = [];
        let marginTexts: string[] = [];
        let marginRanges: ReportPage["marginRanges"] = [];
        try {
          const content = await page.getTextContent();
          const parsed = textFromPdfItems(
            content.items.filter(i => "str" in i) as PdfTextItem[],
            page.getViewport({ scale: 1 }).width,
            page.getViewport({ scale: 1 }).height
          );
          text = parsed.text;
          tables = parsed.tables;
          marginTexts = parsed.marginTexts;
          marginRanges = parsed.marginRanges;
        } catch {
          /* Unreadable pages can be retried with OCR. */
        }
        const quality = textQuality(text);
        pages.push({
          page: n,
          text,
          tables,
          marginTexts,
          marginRanges,
          needsOcr: quality.needsOcr,
          method: quality.readable ? "text" : "unread",
        });
        page.cleanup();
      }
    } else {
      for (let n = 1; n <= files.length; n++)
        pages.push({ page: n, text: "", method: "unread" });
    }
    const ocr: ExtractionSession["ocr"] = async (
      numbers,
      nextSignal,
      onProgress
    ) => {
      if (disposed) throw new Error("报告已关闭，请重新上传。");
      if (numbers.length > 20) throw new Error("OCR每批最多20页。");
      let currentPage = 0;
      const stop = () => {
        void worker?.terminate();
        worker = undefined;
      };
      nextSignal.addEventListener("abort", stop, { once: true });
      try {
        checkAbort(nextSignal);
        onProgress({
          message: "首次加载中英文识别引擎，之后可复用缓存…",
          current: 0,
          total: numbers.length,
        });
        const { createWorker, PSM } = await import("tesseract.js");
        const pending = createWorker("chi_sim+eng", 1, {
          workerPath: assets() + "ocr-worker.min.js",
          corePath: assets(),
          langPath: assets().replace(/\/$/, ""),
          workerBlobURL: false,
          cacheMethod: "write",
          logger: m => {
            if (!nextSignal.aborted && m.status === "recognizing text")
              onProgress({
                message: `OCR识别 · 第${currentPage}页 · ${Math.round(m.progress * 100)}%`,
                current: numbers.indexOf(currentPage),
                total: numbers.length,
              });
          },
        }).then(created => {
          if (nextSignal.aborted) void created.terminate();
          return created;
        });
        // If cancelled while loading the engine, terminate as soon as it exists.
        const created = await withAbort(pending, nextSignal);
        checkAbort(nextSignal);
        worker = created;
        for (const n of numbers) {
          checkAbort(nextSignal);
          currentPage = n;
          let source: File | HTMLCanvasElement = files[n - 1];
          let canvas: HTMLCanvasElement | undefined;
          if (pdf) {
            const page = await pdf.getPage(n);
            const size = page.getViewport({ scale: 1 });
            const scale = Math.min(2, 2200 / Math.max(size.width, size.height));
            const viewport = page.getViewport({ scale });
            canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext("2d");
            if (!context) throw new Error("当前浏览器无法生成页面图片。");
            const render = page.render({
              canvas,
              canvasContext: context,
              viewport,
            });
            const cancel = () => render.cancel();
            nextSignal.addEventListener("abort", cancel, { once: true });
            try {
              await render.promise;
            } finally {
              nextSignal.removeEventListener("abort", cancel);
              page.cleanup();
            }
            source = canvas;
          } else {
            const bitmap = await createImageBitmap(source as File);
            const scale = Math.min(
              1,
              2400 / Math.max(bitmap.width, bitmap.height)
            );
            canvas = document.createElement("canvas");
            canvas.width = Math.ceil(bitmap.width * scale);
            canvas.height = Math.ceil(bitmap.height * scale);
            canvas
              .getContext("2d")
              ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close();
            source = canvas;
          }
          try {
            let headerBands: Array<{ top: number; height: number }> = [];
            let headerImage: HTMLCanvasElement | undefined;
            if (canvas) {
              const context = canvas.getContext("2d");
              if (context) {
                const pixels = context.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );
                headerBands = enhanceOcrContrast(
                  pixels.data,
                  canvas.width,
                  canvas.height
                );
                if (headerBands.length) {
                  headerImage = document.createElement("canvas");
                  headerImage.width = canvas.width;
                  headerImage.height = canvas.height;
                  headerImage.getContext("2d")?.putImageData(pixels, 0, 0);
                }
              }
            }
            const recognized = await withAbort(
              worker.recognize(source, {}, { blocks: true }),
              nextSignal
            );
            checkAbort(nextSignal);
            let data = recognized.data;
            for (const band of headerBands) {
              checkAbort(nextSignal);
              if (!canvas) break;
              const headerCanvas = document.createElement("canvas");
              const top = Math.max(0, band.top - 3),
                height = Math.min(canvas.height - top, band.height + 6);
              headerCanvas.width = canvas.width * 2;
              headerCanvas.height = height * 2;
              const context = headerCanvas.getContext("2d");
              if (!context) continue;
              context.drawImage(
                headerImage ?? canvas,
                0,
                top,
                canvas.width,
                height,
                0,
                0,
                headerCanvas.width,
                headerCanvas.height
              );
              try {
                await worker.setParameters({
                  tessedit_pageseg_mode: PSM.SINGLE_LINE,
                });
                const extra = await withAbort(
                  worker.recognize(headerCanvas, {}, { blocks: true }),
                  nextSignal
                );
                if (
                  /单位|unit/i.test(extra.data.text) &&
                  /20\d{2}/.test(extra.data.text.replace(/\s/g, ""))
                )
                  data = {
                    ...data,
                    ...mergeOcrHeader(data, extra.data, { left: 0, top }),
                  };
              } finally {
                headerCanvas.width = headerCanvas.height = 0;
                if (!nextSignal.aborted)
                  await worker.setParameters({
                    tessedit_pageseg_mode: PSM.AUTO,
                  });
              }
            }
            if (headerImage) {
              headerImage.width = headerImage.height = 0;
            }
            const parsed = parseOcrPage(
              data,
              canvas?.width ?? 2200,
              canvas?.height ?? 2200
            );
            pages[n - 1] = {
              page: n,
              ...parsed,
              needsOcr: false,
              method: data.text.trim().length >= 20 ? "ocr" : "unread",
              confidence: data.confidence,
            };
          } finally {
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
            }
          }
          onProgress({
            message: `已识别第${n}页`,
            current: numbers.indexOf(n) + 1,
            total: numbers.length,
          });
        }
      } finally {
        nextSignal.removeEventListener("abort", stop);
        await worker?.terminate().catch(() => {});
        worker = undefined;
      }
    };
    return { pages, total: pages.length, ocr, dispose };
  } catch (error) {
    await dispose();
    if (signal.aborted) throw new DOMException("已取消识别", "AbortError");
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error("PDF受密码保护，请先解除文件密码后再上传。");
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
