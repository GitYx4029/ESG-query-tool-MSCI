import { Router, type RequestHandler } from "express";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  eventSchema,
  feedbackSchema,
  type CommunityEvent,
  type FeedbackRecord,
} from "../shared/community";
import { timingSafeEqual } from "node:crypto";
import { getAllIndustries, keyIssueHierarchy } from "../client/src/lib/esgData";

const industries = new Set(getAllIndustries().map(i => i.name));
const issues = new Set(
  Object.values(keyIssueHierarchy).flatMap(themes =>
    Object.values(themes).flat()
  )
);
type StoredEvent = CommunityEvent & { createdAt: string };
export class CommunityStore {
  constructor(readonly directory: string) {}
  async append(name: string, record: unknown) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await appendFile(
      path.join(this.directory, `${name}.jsonl`),
      JSON.stringify(record) + "\n",
      { encoding: "utf8", mode: 0o600 }
    );
  }
  async read<T>(name: string): Promise<T[]> {
    try {
      return (
        await readFile(path.join(this.directory, `${name}.jsonl`), "utf8")
      )
        .split("\n")
        .filter(Boolean)
        .map(line => JSON.parse(line));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
  async feedback(): Promise<FeedbackRecord[]> {
    const rows = await this.read<FeedbackRecord>("feedback");
    const updates = await this.read<{
      id: string;
      status: FeedbackRecord["status"];
      priority: FeedbackRecord["priority"];
    }>("updates");
    const latest = new Map(updates.map(x => [x.id, x]));
    return rows.map(row => ({ ...row, ...latest.get(row.id) })).reverse();
  }
}

export function createCommunityRouter(
  store = new CommunityStore(
    process.env.COMMUNITY_DATA_DIR || path.resolve("private-data/community")
  )
) {
  const router = Router();
  const allowed = new Set(
    (
      process.env.COMMUNITY_ALLOWED_ORIGINS ||
      process.env.AI_ALLOWED_ORIGINS ||
      "https://gityx4029.github.io"
    )
      .split(",")
      .map(x => x.trim())
  );
  router.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin))
      return res.status(403).json({ error: "Origin not allowed" });
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Community-Token"
      );
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  // Transient abuse counters, never written to the event store. Configure proxy trust at the host.
  const counters = new Map<string, { count: number; expires: number }>();
  router.use((req, res, next) => {
    const now = Date.now();
    counters.forEach((value, key) => {
      if (value.expires < now) counters.delete(key);
    });
    const bucket = `${req.ip}:${req.path === "/events" ? "events" : "other"}`;
    const limit = req.path === "/events" ? 120 : 30;
    const current = counters.get(bucket) || { count: 0, expires: now + 60_000 };
    current.count++;
    counters.set(bucket, current);
    if (current.count > limit)
      return res.status(429).json({ error: "Too many requests" });
    next();
  });
  const admin: RequestHandler = (req, res, next) => {
    const expected = process.env.COMMUNITY_ADMIN_TOKEN || "";
    const supplied = String(req.headers["x-community-token"] || "");
    const valid =
      expected.length >= 16 &&
      supplied.length <= 256 &&
      Buffer.byteLength(expected) === Buffer.byteLength(supplied) &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (!valid)
      return res
        .status(401)
        .json({ error: "Administrator authentication required" });
    res.setHeader("Cache-Control", "no-store");
    next();
  };
  router.get("/health", (_req, res) => res.json({ available: true }));
  router.post("/events", async (req, res) => {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid event" });
    const event = parsed.data;
    if (
      (event.industry && !industries.has(event.industry)) ||
      (event.issue && !issues.has(event.issue))
    )
      return res.status(400).json({ error: "Unknown identifier" });
    try {
      await store.append("events", {
        ...event,
        createdAt: new Date().toISOString(),
      });
      res.sendStatus(204);
    } catch {
      res.status(503).json({ error: "Event was not saved" });
    }
  });
  router.post("/feedback", async (req, res) => {
    const parsed = feedbackSchema.safeParse(req.body);
    if (
      !parsed.success ||
      (parsed.data.industry && !industries.has(parsed.data.industry))
    )
      return res.status(400).json({ error: "Invalid feedback" });
    const row: FeedbackRecord = {
      ...parsed.data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      channel: "website",
      status: "new",
      priority: "normal",
    };
    try {
      await store.append("feedback", row);
      res.status(201).json({ id: row.id, saved: true });
    } catch {
      res.status(503).json({ error: "Feedback was not saved" });
    }
  });
  router.get("/summary", admin, async (_req, res) => {
    try {
      const cutoff = Date.now() - 30 * 86400_000;
      const events = (await store.read<StoredEvent>("events")).filter(
        e => Date.parse(e.createdAt) >= cutoff
      );
      const searches = events.filter(e => e.event === "search_result");
      const count = (values: string[]) =>
        Object.entries(
          values.reduce<Record<string, number>>((map, value) => {
            map[value] = (map[value] || 0) + 1;
            return map;
          }, {})
        ).sort((a, b) => b[1] - a[1]);
      res.json({
        periodDays: 30,
        sessions: new Set(events.map(e => e.session)).size,
        entries: events.filter(e => e.event === "entry").length,
        searches: searches.length,
        zeroResults: searches.filter(e => e.resultCount === 0).length,
        failures: events.filter(e => e.status === "failure").length,
        methodologyClicks: events.filter(e => e.event === "methodology_click")
          .length,
        industries: count(
          events
            .filter(e => e.event === "industry_view" && e.industry)
            .map(e => e.industry!)
        ),
        sources: count(
          events
            .filter(e => e.event === "entry")
            .map(e => [e.source, e.note].filter(Boolean).join("/"))
        ),
        feedback: await store.feedback(),
      });
    } catch {
      res.status(503).json({ error: "Summary unavailable" });
    }
  });
  router.post("/admin-feedback", admin, async (req, res) => {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid feedback" });
    try {
      const row: FeedbackRecord = {
        ...parsed.data,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        channel: "xiaohongshu",
        status: "new",
        priority: "normal",
      };
      await store.append("feedback", row);
      res.status(201).json({ saved: true, id: row.id });
    } catch {
      res.status(503).json({ error: "Feedback was not saved" });
    }
  });
  router.patch("/feedback/:id", admin, async (req, res) => {
    const parsed = z
      .object({
        status: z.enum(["new", "planned", "done"]),
        priority: z.enum(["normal", "high"]),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success || !z.string().uuid().safeParse(req.params.id).success)
      return res.status(400).json({ error: "Invalid update" });
    try {
      if (!(await store.feedback()).some(row => row.id === req.params.id))
        return res.sendStatus(404);
      await store.append("updates", { id: req.params.id, ...parsed.data });
      res.json({ saved: true });
    } catch {
      res.status(503).json({ error: "Update was not saved" });
    }
  });
  return router;
}
