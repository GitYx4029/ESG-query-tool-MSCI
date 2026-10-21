import type { Page, Word, Block } from "tesseract.js";
import { textFromPdfItems, type PdfTextItem } from "./reportText";

const joinWords = (words: Word[]) =>
  words.reduce((text, word) => {
    const space =
      (/[a-z]$/i.test(text) && /^[a-z\d]/i.test(word.text)) ||
      (/\d$/.test(text) && /^[a-z]/i.test(word.text));
    return text + (space ? " " : "") + word.text.trim();
  }, "");

/** OCR geometry follows the same table parser as the PDF text layer. */
export function parseOcrPage(
  data: Pick<Page, "text" | "blocks">,
  width: number,
  height: number
) {
  const lines =
    data.blocks?.flatMap(block =>
      block.paragraphs.flatMap(paragraph => paragraph.lines)
    ) ?? [];
  if (!lines.length)
    return {
      text: data.text.trim(),
      tables: [],
      marginTexts: [],
      marginRanges: [],
    };
  const scale = 600 / height;
  const items: PdfTextItem[] = [];
  for (const line of lines) {
    const words = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const groups: Word[][] = [];
    for (const word of words) {
      const previous = groups.at(-1)?.at(-1);
      if (
        !previous ||
        word.bbox.x0 - previous.bbox.x1 >
          Math.max(24, (line.bbox.y1 - line.bbox.y0) * 1.4)
      )
        groups.push([word]);
      else groups.at(-1)!.push(word);
    }
    for (const group of groups) {
      const x = Math.min(...group.map(word => word.bbox.x0));
      items.push({
        str: joinWords(group),
        transform: [1, 0, 0, 1, x * scale, (height - line.bbox.y1) * scale],
        width: (Math.max(...group.map(word => word.bbox.x1)) - x) * scale,
        height: (line.bbox.y1 - line.bbox.y0) * scale,
      });
    }
  }
  items.sort((a, b) =>
    Math.abs(a.transform[5] - b.transform[5]) > 3
      ? b.transform[5] - a.transform[5]
      : a.transform[4] - b.transform[4]
  );
  const parsed = textFromPdfItems(items, width * scale, height * scale);
  const body = data.text.trim();
  const tables = parsed.tables;
  const text =
    body +
    (tables.length
      ? "\n\n" +
        tables
          .map(table =>
            [
              table.columns.join(" | "),
              ...table.rows.map(row => row.join(" | ")),
            ].join("\n")
          )
          .join("\n\n")
      : "");
  const marginRanges = lines
    .filter(
      line => line.bbox.y1 < height * 0.07 || line.bbox.y0 > height * 0.93
    )
    .flatMap(line => {
      const value = line.text.trim(),
        start = body.indexOf(value);
      return value.length >= 2 && start >= 0
        ? [{ text: value, start, end: start + value.length }]
        : [];
    });
  return {
    text,
    tables,
    marginTexts: marginRanges.map(r => r.text),
    marginRanges,
  };
}

/** Invert wide dark table-header bands so white lettering remains readable. */
export function enhanceOcrContrast(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
) {
  const bands: Array<{ top: number; height: number }> = [];
  let start = -1;
  for (let y = 0; y < height; y++) {
    let dark = 0,
      samples = 0;
    for (let x = 0; x < width; x += 8) {
      const i = (y * width + x) * 4;
      if (
        pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114 <
        125
      )
        dark++;
      samples++;
    }
    if (dark / samples < 0.55) {
      if (start >= 0) {
        bands.push({ top: start, height: y - start });
        start = -1;
      }
      continue;
    }
    if (start < 0) start = y;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const value =
        pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114 > 135
          ? 0
          : 255;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
  }
  if (start >= 0) bands.push({ top: start, height: height - start });
  return bands
    .filter(b => b.height >= 10 && b.height <= 90 && b.top < height * 0.85)
    .slice(0, 3);
}

export function mergeOcrHeader(
  data: Pick<Page, "text" | "blocks">,
  header: Pick<Page, "text" | "blocks">,
  rect: { left: number; top: number },
  scale = 2
): Pick<Page, "text" | "blocks"> {
  const convert = (b: { x0: number; y0: number; x1: number; y1: number }) => ({
    x0: b.x0 / scale + rect.left,
    x1: b.x1 / scale + rect.left,
    y0: b.y0 / scale + rect.top,
    y1: b.y1 / scale + rect.top,
  });
  const blocks = (header.blocks ?? []).map(block => ({
    ...block,
    bbox: convert(block.bbox),
    paragraphs: block.paragraphs.map(p => ({
      ...p,
      bbox: convert(p.bbox),
      lines: p.lines.map(line => ({
        ...line,
        bbox: convert(line.bbox),
        words: line.words.map(word => ({ ...word, bbox: convert(word.bbox) })),
      })),
    })),
  })) as Block[];
  return {
    text: data.text + "\n" + header.text,
    blocks: [...(data.blocks ?? []), ...blocks],
  };
}
