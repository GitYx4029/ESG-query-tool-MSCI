import type { ImportanceLevel } from "./esgData";

// Reference attention levels share the same colors across cards and tables.
export const importanceColors: Record<ImportanceLevel, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
  standard: "bg-slate-50 text-slate-500 border-slate-200",
};
export const importanceDotColors: Record<ImportanceLevel, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
  standard: "bg-slate-400",
};
