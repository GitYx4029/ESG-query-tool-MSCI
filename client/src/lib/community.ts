import {
  APP_VERSION,
  type CommunityEvent,
  type FeedbackInput,
} from "@shared/community";
import { getCommunityToken } from "@/lib/adminSession";
import { defaultCommunityOrigin } from "./backendConfig";

const configuredOrigin = (
  import.meta.env.VITE_COMMUNITY_API_ORIGIN ||
  import.meta.env.VITE_AI_API_ORIGIN ||
  (import.meta.env.BASE_URL === "/" ? "" : defaultCommunityOrigin)
)
  .trim()
  .replace(/\/+$/, "");
export const communityOrigin: string | null =
  configuredOrigin || (import.meta.env.BASE_URL === "/" ? "" : null);
export const hasCommunityApi = communityOrigin !== null;
const CONSENT_KEY = "esg-anonymous-statistics";
export const getStatisticsConsent = () =>
  localStorage.getItem(CONSENT_KEY) === "yes";
export const setStatisticsConsent = (enabled: boolean) => {
  localStorage.setItem(CONSENT_KEY, enabled ? "yes" : "no");
  if (enabled) trackEvent("entry");
};
export function pageCategory(): CommunityEvent["page"] {
  const path = window.location.pathname.replace(
    import.meta.env.BASE_URL.replace(/\/$/, ""),
    ""
  );
  if (path.startsWith("/industry/")) return "industry";
  if (path === "/materiality-map") return "materiality-map";
  if (path.startsWith("/company") || path.startsWith("/drilldown"))
    return "analysis";
  return path === "/" ? "home" : "other";
}
let session = "";
export function trackEvent(
  event: CommunityEvent["event"],
  data: Partial<
    Pick<
      CommunityEvent,
      "industry" | "issue" | "resultCount" | "status" | "page"
    >
  > = {}
) {
  const params = new URLSearchParams(window.location.search);
  const source: CommunityEvent["source"] =
    params.get("utm_source") === "xiaohongshu"
      ? "xiaohongshu"
      : params.has("utm_source")
        ? "other"
        : "direct";
  const note = (params.get("note") || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 40);
  // No raw search text, URLs, file names, documents, scores, contacts, or password.
  let attribution: Pick<CommunityEvent, "source" | "note"> = { source, note };
  const previous = sessionStorage.getItem("esg-statistics-attribution");
  if (previous && !params.has("utm_source")) {
    try {
      attribution = JSON.parse(previous);
    } catch {}
  }
  sessionStorage.setItem(
    "esg-statistics-attribution",
    JSON.stringify(attribution)
  );
  if (!hasCommunityApi || !getStatisticsConsent()) return;
  if (!session) {
    session =
      sessionStorage.getItem("esg-statistics-session") || crypto.randomUUID();
    sessionStorage.setItem("esg-statistics-session", session);
  }
  const payload: CommunityEvent = {
    event,
    session,
    version: APP_VERSION,
    ...attribution,
    page: pageCategory(),
    ...data,
  };
  void fetch(`${communityOrigin}/api/community/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
export async function submitFeedback(input: FeedbackInput) {
  if (!hasCommunityApi) throw new Error("反馈服务尚未连接，可生成反馈邮件。");
  const response = await fetch(`${communityOrigin}/api/community/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("反馈未保存，请稍后重试或生成反馈邮件。");
  trackEvent("feedback_submitted");
  return response.json();
}
export async function adminRequest(path: string, init: RequestInit = {}) {
  if (!hasCommunityApi)
    throw new Error("需要接入反馈统计服务后才能查看集中记录。");
  const response = await fetch(`${communityOrigin}/api/community/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Community-Token": getCommunityToken(),
      ...init.headers,
    },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "服务端管理凭证未配置或不匹配。"
        : "读取失败，请检查服务状态。"
    );
  return response.json();
}
