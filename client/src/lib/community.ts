import {
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
export function pageCategory(): CommunityEvent["page"] {
  const path = window.location.pathname.replace(
    import.meta.env.BASE_URL.replace(/\/$/, ""),
    ""
  );
  if (path.startsWith("/industry/")) return "industry";
  if (path === "/report-analysis") return "report-analysis";
  if (path === "/materiality-map") return "materiality-map";
  if (path.startsWith("/company") || path.startsWith("/drilldown"))
    return "analysis";
  return path === "/" ? "home" : "other";
}
export function trackEvent(
  _event: CommunityEvent["event"],
  _data: Partial<
    Pick<
      CommunityEvent,
      "industry" | "issue" | "resultCount" | "status" | "page"
    >
  > = {}
) {
  // Collection is paused while the public consent control is removed.
  // Keep the call sites for future opt-in statistics; never restore old consent.
  return;
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
