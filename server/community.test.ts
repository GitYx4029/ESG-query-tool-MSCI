import express from "express";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { CommunityStore, createCommunityRouter } from "./community";
import { APP_VERSION } from "../shared/community";
let directory: string, server: Server, origin: string;
const admin = {
  "X-Community-Token": "test-private-admin-token-123",
  "Content-Type": "application/json",
};
beforeAll(async () => {
  vi.stubEnv("COMMUNITY_ADMIN_TOKEN", "test-private-admin-token-123");
  directory = await mkdtemp(path.join(tmpdir(), "esg-community-test-"));
  const app = express();
  app.use(express.json());
  app.use(
    "/api/community",
    createCommunityRouter(new CommunityStore(directory))
  );
  server = await new Promise<Server>(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/community`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
  await rm(directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
const feedback = {
  outcome: "no",
  category: "missing_industry",
  role: "consultant",
  message: "需要更多行业别名",
  contact: "",
  consentToContact: false,
  page: "home",
  industry: "",
  version: APP_VERSION,
};
describe("private feedback and anonymous events", () => {
  it("keeps feedback after creating a fresh store and protects its read endpoint", async () => {
    const response = await fetch(`${origin}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    expect(response.status).toBe(201);
    const rows = await new CommunityStore(directory).feedback();
    expect(rows[0].message).toBe(feedback.message);
    expect((await fetch(`${origin}/summary`)).status).toBe(401);
    const summary = await (
      await fetch(`${origin}/summary`, { headers: admin })
    ).json();
    expect(summary.feedback).toHaveLength(1);
  });
  it("rejects contact details without permission and document content in events", async () => {
    const response = await fetch(`${origin}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...feedback, contact: "someone@example.com" }),
    });
    expect(response.status).toBe(400);
    const event = {
      event: "entry",
      session: "anonymous-session-123",
      version: APP_VERSION,
      source: "direct",
      note: "",
      page: "home",
      reportText: "private contents",
    };
    expect(
      (
        await fetch(`${origin}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        })
      ).status
    ).toBe(400);
    expect(await new CommunityStore(directory).read("events")).toEqual([]);
  });
  it("counts zero results separately and saves an admin status change", async () => {
    const event = {
      event: "search_result",
      session: "anonymous-session-123",
      version: APP_VERSION,
      source: "xiaohongshu",
      note: "launch01",
      page: "home",
      resultCount: 0,
    };
    expect(
      (
        await fetch(`${origin}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        })
      ).status
    ).toBe(204);
    const summary = await (
      await fetch(`${origin}/summary`, { headers: admin })
    ).json();
    expect(summary.zeroResults).toBe(1);
    expect(summary.sessions).toBe(1);
    const id = summary.feedback[0].id;
    expect(
      (
        await fetch(`${origin}/feedback/${id}`, {
          method: "PATCH",
          headers: admin,
          body: JSON.stringify({ status: "planned", priority: "high" }),
        })
      ).status
    ).toBe(200);
    expect((await new CommunityStore(directory).feedback())[0].status).toBe(
      "planned"
    );
  });
  it("rejects a disallowed browser origin", async () => {
    const response = await fetch(`${origin}/health`, {
      headers: { Origin: "https://unrelated.example" },
    });
    expect(response.status).toBe(403);
  });
});
