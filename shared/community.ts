import { z } from "zod";
export const APP_VERSION = "1.9.0";
export const eventSchema = z
  .object({
    event: z.enum([
      "entry",
      "search_result",
      "industry_view",
      "methodology_click",
      "example_loaded",
      "upload_parse_result",
      "analysis_result",
      "share_click",
      "feedback_submitted",
    ]),
    session: z.string().regex(/^[a-zA-Z0-9-]{8,80}$/),
    version: z.literal(APP_VERSION),
    source: z.enum(["xiaohongshu", "direct", "other"]),
    note: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{0,40}$/)
      .default(""),
    page: z.enum(["home", "industry", "materiality-map", "analysis", "other"]),
    industry: z.string().max(100).optional(),
    issue: z.string().max(100).optional(),
    resultCount: z.number().int().min(0).max(200).optional(),
    status: z
      .enum(["success", "failure", "unconfigured", "copied", "cancelled"])
      .optional(),
  })
  .strict();
export const feedbackSchema = z
  .object({
    outcome: z.enum(["yes", "partial", "no"]),
    category: z.enum([
      "missing_industry",
      "unclear",
      "incorrect",
      "feature",
      "other",
    ]),
    role: z
      .enum(["enterprise", "consultant", "student", "other"])
      .default("other"),
    message: z.string().trim().max(1000).default(""),
    contact: z.string().trim().max(120).default(""),
    consentToContact: z.boolean().default(false),
    page: z.enum(["home", "industry", "materiality-map", "analysis", "other"]),
    industry: z.string().max(100).default(""),
    version: z.literal(APP_VERSION),
  })
  .strict()
  .refine(data => !data.contact || data.consentToContact, {
    message: "填写联系方式时，请确认同意联系。",
  });
export type CommunityEvent = z.infer<typeof eventSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackRecord = FeedbackInput & {
  id: string;
  createdAt: string;
  channel: "website" | "xiaohongshu";
  status: "new" | "planned" | "done";
  priority: "normal" | "high";
};
