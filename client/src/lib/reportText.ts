import type { ReportTable } from "@shared/report";
export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}
// Keep the original wording. Coordinates are used only to restore table cell order.
export function textFromPdfItems(items: PdfTextItem[], width: number, height?: number) {
  const visible = items.filter(i => i.str.trim());
  const units = visible.filter(i => /^(?:单位|單位)$/.test(i.str.trim()));
  const tables: ReportTable[] = [];
  const used = new Set<PdfTextItem>();
  for (const unit of units) {
    const y = unit.transform[5];
    const sameLine = visible.filter(i => Math.abs(i.transform[5] - y) < 3);
    const label = sameLine.filter(i => /^(?:指标(?:名称)?|指標(?:名稱)?)$/.test(i.str.trim()) && i.transform[4] < unit.transform[4]).sort((a, b) => b.transform[4] - a.transform[4])[0];
    if (!label)
      continue;
    const nextUnit = sameLine.filter(i => i !== unit && /^(?:单位|單位)$/.test(i.str.trim()) && i.transform[4] > unit.transform[4]).sort((a, b) => a.transform[4] - b.transform[4])[0];
    const nextLabel = sameLine.filter(i => /^(?:指标(?:名称)?|指標(?:名稱)?)$/.test(i.str.trim()) && i.transform[4] > unit.transform[4]).sort((a, b) => a.transform[4] - b.transform[4])[0];
    const endX = nextLabel ? (nextLabel.transform[4] + unit.transform[4]) / 2 : width;
    const years = sameLine.filter(i => /^20\d{2}(?:\s*[/／-]\s*\d{2,4})?\s*(?:财年|財年|年)?$/.test(i.str.trim()) && i.transform[4] > unit.transform[4] && i.transform[4] < (nextUnit?.transform[4] ?? width) && (!nextLabel || i.transform[4] < nextLabel.transform[4])).sort((a, b) => a.transform[4] - b.transform[4]);
    if (years.length < 1 || years.length > 5)
      continue;
    const lastYear = years.at(-1)!;
    const nextTheme = sameLine.find(i => /^(?:议题|議題)$/.test(i.str.trim()) && i.transform[4] > lastYear.transform[4]);
    const right = nextLabel ? (lastYear.transform[4] + lastYear.width + (nextTheme?.transform[4] ?? nextLabel.transform[4])) / 2 : Math.min(width, endX);
    // A title may be centred in a wide label column, so use the unit column's
    // left edge to distinguish text labels from units instead of nearest-centre.
    const centre = (i: PdfTextItem) => i.transform[4] + i.width / 2;
    const anchors = [label, unit, ...years].map(centre);
    const labelUnitBoundary = unit.transform[4] - Math.max(12, (unit.transform[4] - label.transform[4]) * 0.15);
    const headerItems = visible.filter(i => units.some(u => Math.abs(u.transform[5] - i.transform[5]) < 3));
    const previousYears = headerItems.filter(i => /^20\d{2}/.test(i.str.trim()) && i.transform[4] < label.transform[4]);
    const previousEnd = Math.max(0, ...previousYears.map(i => i.transform[4] + i.width));
    const theme = sameLine.filter(i => /^(?:议题|議題)$/.test(i.str.trim()) && i.transform[4] < label.transform[4]).sort((a, b) => b.transform[4] - a.transform[4])[0];
    const left = Math.max(previousEnd ? (previousEnd + label.transform[4]) / 2 : 0, theme ? (centre(theme) + centre(label)) / 2 : 0);
    const belowHeader = units.filter(i => i !== unit && Math.abs(i.transform[4] - unit.transform[4]) < 50 && i.transform[5] < y - 5).map(i => i.transform[5]);
    const bottom = belowHeader.length ? Math.max(...belowHeader) + 10 : 25;
    const body = visible.filter(i => i.transform[5] < y - 4 && i.transform[5] > bottom && centre(i) >= left && centre(i) < right);
    const column = (i: PdfTextItem) => {
      if (centre(i) < labelUnitBoundary)
        return 0;
      let best = 1;
      for (let c = 2; c < anchors.length; c++)
        if (Math.abs(centre(i) - anchors[c]) < Math.abs(centre(i) - anchors[best]))
          best = c;
      return best;
    };
    const numeric = (s: string) => /^(?:[+-]?\d[\d,.]*(?:\s*%)?[＊*†‡¹²³⁴⁵⁶⁷⁸⁹]*|[/／—–-])$/.test(s.trim());
    const firstValues = body.filter(i => column(i) === 2 && numeric(i.str)).sort((a, b) => b.transform[5] - a.transform[5]);
    const rowYs: number[] = [];
    for (const value of firstValues)
      if (!rowYs.some(r => Math.abs(r - value.transform[5]) < Math.max(3, value.height * .65)))
        rowYs.push(value.transform[5]);
    if (rowYs.length < 3)
      continue;
    const collected = rowYs.map(() => Array.from({ length: anchors.length }, () => [] as PdfTextItem[]));
    for (const item of body) {
      let r = 0;
      for (let j = 1; j < rowYs.length; j++)
        if (Math.abs(item.transform[5] - rowYs[j]) < Math.abs(item.transform[5] - rowYs[r]))
          r = j;
      const distance = Math.abs(item.transform[5] - rowYs[r]);
      if (distance > Math.max(item.height * 1.6, 13))
        continue;
      collected[r][column(item)].push(item);
    }
    const rows: string[][] = [];
    const accepted: PdfTextItem[] = [];
    for (const cells of collected) {
      const row = cells.map(cell => cell.sort((a, b) => Math.abs(a.transform[5] - b.transform[5]) > 3 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]).map(i => i.str.trim()).join(cells.indexOf(cell) > 1 ? "" : " "));
      if (!/[\p{L}]/u.test(row[0]) || row.slice(2).filter(numeric).length < years.length || row.slice(2).some(v => v && !numeric(v)))
        continue;
      rows.push(row);
      accepted.push(...cells.flat());
    }
    if (rows.length < 3)
      continue;
    tables.push({ columns: [label, unit, ...years].map(i => i.str.trim()), rows });
    for (const item of [...accepted, label, unit, ...years])
      used.add(item);
  }
  let text = "", prevY: number | undefined;
  const marginRanges: Array<{
    text: string;
    start: number;
    end: number;
  }> = [];
  for (const item of items) {
    if (used.has(item))
      continue;
    const line = prevY !== undefined && Math.abs(item.transform[5] - prevY) > 3;
    const prefix = line ? "\n" : " ";
    if (height && item.str.trim().length >= 2 && (item.transform[5] > height * .93 || item.transform[5] < height * .07)) {
      const start = text.length + prefix.length;
      marginRanges.push({ text: item.str.trim(), start, end: start + item.str.length });
    }
    text += prefix + item.str + (item.hasEOL ? "\n" : "");
    prevY = item.transform[5];
  }
  for (const table of tables)
    text += "\n\n" + [table.columns.join(" | "), ...table.rows.map(r => r.join(" | "))].join("\n");
  const leading = text.length - text.trimStart().length;
  return { text: text.trim(), tables, marginTexts: marginRanges.map(r => r.text), marginRanges: marginRanges.map(r => ({ ...r, start: r.start - leading, end: r.end - leading })) };
}
