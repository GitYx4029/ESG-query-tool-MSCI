import { timingSafeEqual } from "node:crypto";
export function adminPasswordMatches(value: unknown): boolean {
  const expected = process.env.ANALYSIS_ADMIN_PASSWORD || "";
  if (expected.length < 16 || typeof value !== "string" || value.length > 256)
    return false;
  const a = Buffer.from(value),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
