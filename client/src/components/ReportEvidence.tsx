import { useState } from "react";
import type { Evidence } from "@shared/report";
import { readableExcerpt, uniqueContexts } from "@/lib/reportPresentation";

export function EvidenceContexts({
  evidence,
  open,
}: {
  evidence: Evidence[];
  open: (e: Evidence) => void;
}) {
  const notes = uniqueContexts(evidence).filter(
    ({ context }) => !context.quote.includes(" | ")
  );
  if (!notes.length) return null;
  return (
    <div className="border-t pt-3 space-y-3">
      <p className="text-xs font-medium text-slate-600">
        范围与口径注释 · 相同注释合并展示
      </p>
      {notes.map(({ context, source }, i) => (
        <div
          key={`${context.page}-${i}`}
          className="text-xs leading-relaxed text-slate-600"
        >
          <button
            className="text-blue-800 underline mb-1"
            onClick={() =>
              open({
                ...source,
                page: context.page,
                quote: context.quote,
                context: [],
              })
            }
          >
            文件第{context.page}页
          </button>
          <p className="whitespace-pre-line">
            {readableExcerpt(context.quote)}
          </p>
        </div>
      ))}
    </div>
  );
}
export function EvidenceCard({
  evidence,
  open,
  showContext = true,
}: {
  evidence: Evidence;
  open: (e: Evidence) => void;
  showContext?: boolean;
}) {
  const [raw, setRaw] = useState(false);
  const columns = evidence.context
    ?.find(c => c.quote.includes(" | "))
    ?.quote.split(" | ");
  const cells =
    evidence.role === "table" ? evidence.quote.split(" | ") : undefined;
  const table = columns && cells && columns.length === cells.length;
  const roles = {
    table: "绩效表",
    body: "正文",
    case: "案例",
    statement: "声明",
    assurance: "鉴证",
  };
  return (
    <div className="border rounded-lg bg-slate-50/70 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          className="text-blue-800 underline font-medium"
          onClick={() => open(evidence)}
        >
          文件第{evidence.page}页 · 查看原页
        </button>
        <span className="text-slate-500">
          {roles[evidence.role ?? "body"]} ·{" "}
          {evidence.method === "ocr"
            ? `OCR ${Math.round(evidence.confidence ?? 0)}%`
            : "PDF文字"}
        </span>
      </div>
      {table && !raw ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className="border-b px-2 py-2 text-left font-medium text-slate-500 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {cells.map((c, i) => (
                  <td key={i} className="px-2 py-2 align-top">
                    {c}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <blockquote className="text-sm leading-7 whitespace-pre-line break-words">
          {raw
            ? evidence.quote
            : readableExcerpt(evidence.quote, evidence.role)}
        </blockquote>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <button
          className="underline"
          aria-pressed={raw}
          onClick={() => setRaw(v => !v)}
        >
          {raw ? "切换阅读版" : "查看原始换行"}
        </button>
        <span>
          {raw ? "保留抽取时的换行" : "段落合并排版换行，表格与列表保留结构"}
        </span>
      </div>
      {showContext && <EvidenceContexts evidence={[evidence]} open={open} />}
    </div>
  );
}
