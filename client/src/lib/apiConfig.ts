// GitHub Pages needs a separately deployed API; the full-stack site uses its own origin.
const configuredApiOrigin = (import.meta.env.VITE_AI_API_ORIGIN || "")
  .trim()
  .replace(/\/+$/, "");

export const hasAnalysisApi =
  import.meta.env.BASE_URL === "/" || Boolean(configuredApiOrigin);
export const trpcUrl = `${configuredApiOrigin}/api/trpc`;
