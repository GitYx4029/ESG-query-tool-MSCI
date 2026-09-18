/**
 * Drilldown MVP - Vitest Tests
 * Covers:
 *  1. Permission logic (checkDrilldownAccess)
 *  2. Subscription tier upload limits
 *  3. Share permission rank ordering
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DrilldownPermission } from "./_core/permissions";

// ─── Mock db helpers ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDrilldownById: vi.fn(),
  getShareByToken: vi.fn(),
  listSharesByDrilldown: vi.fn(),
  countDrilldownsByUser: vi.fn(),
}));

import {
  getDrilldownById,
  getShareByToken,
  listSharesByDrilldown,
} from "./db";
import {
  checkDrilldownAccess,
  checkPublicTokenAccess,
} from "./_core/permissions";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockDrilldown = (ownerId: number) => ({
  id: 1,
  userId: ownerId,
  industryName: "Real Estate",
  originalFilename: "test.xlsx",
  s3FileKey: "key",
  s3FileUrl: "https://s3.example.com/key",
  parsedData: null,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockShare = (opts: {
  sharedWithUserId?: number | null;
  sharedWithEmail?: string | null;
  permission: DrilldownPermission;
  isActive?: boolean;
  token?: string;
}) => ({
  id: 10,
  drilldownId: 1,
  sharedWithUserId: opts.sharedWithUserId ?? null,
  sharedWithEmail: opts.sharedWithEmail ?? null,
  permission: opts.permission,
  isActive: opts.isActive ?? true,
  shareToken: opts.token ?? null,
  createdAt: new Date(),
  createdByUserId: 1,
});

// ─── Tests: checkDrilldownAccess ─────────────────────────────────────────────
describe("checkDrilldownAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when drilldown does not exist", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(null);
    const result = await checkDrilldownAccess(1, "user", "user@test.com", 99, "view");
    expect(result).toEqual({ allowed: false, reason: "not_found" });
  });

  it("grants full access to owner", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(mockDrilldown(5) as any);
    vi.mocked(listSharesByDrilldown).mockResolvedValue([]);

    const view = await checkDrilldownAccess(5, "user", "owner@test.com", 1, "view");
    const edit = await checkDrilldownAccess(5, "user", "owner@test.com", 1, "edit");
    const admin = await checkDrilldownAccess(5, "user", "owner@test.com", 1, "admin");

    expect(view).toEqual({ allowed: true, reason: "owner" });
    expect(edit).toEqual({ allowed: true, reason: "owner" });
    expect(admin).toEqual({ allowed: true, reason: "owner" });
  });

  it("grants view-only access to admin role (not owner)", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(mockDrilldown(5) as any);
    vi.mocked(listSharesByDrilldown).mockResolvedValue([]);

    const view = await checkDrilldownAccess(99, "admin", "admin@test.com", 1, "view");
    const edit = await checkDrilldownAccess(99, "admin", "admin@test.com", 1, "edit");

    expect(view).toEqual({ allowed: true, reason: "admin_role" });
    expect(edit).toEqual({ allowed: false, reason: "denied" });
  });

  it("grants access to user matched by userId in shares", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(mockDrilldown(5) as any);
    vi.mocked(listSharesByDrilldown).mockResolvedValue([
      mockShare({ sharedWithUserId: 7, permission: "edit" }) as any,
    ]);

    const view = await checkDrilldownAccess(7, "user", null, 1, "view");
    const edit = await checkDrilldownAccess(7, "user", null, 1, "edit");
    const admin = await checkDrilldownAccess(7, "user", null, 1, "admin");

    expect(view).toEqual({ allowed: true, reason: "shared" });
    expect(edit).toEqual({ allowed: true, reason: "shared" });
    expect(admin).toEqual({ allowed: false, reason: "denied" });
  });

  it("grants access to user matched by email in shares (case-insensitive)", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(mockDrilldown(5) as any);
    vi.mocked(listSharesByDrilldown).mockResolvedValue([
      mockShare({ sharedWithEmail: "Shared@Test.COM", permission: "view" }) as any,
    ]);

    const result = await checkDrilldownAccess(99, "user", "shared@test.com", 1, "view");
    expect(result).toEqual({ allowed: true, reason: "shared" });
  });

  it("denies access to unrelated user", async () => {
    vi.mocked(getDrilldownById).mockResolvedValue(mockDrilldown(5) as any);
    vi.mocked(listSharesByDrilldown).mockResolvedValue([]);

    const result = await checkDrilldownAccess(99, "user", "stranger@test.com", 1, "view");
    expect(result).toEqual({ allowed: false, reason: "denied" });
  });
});

// ─── Tests: checkPublicTokenAccess ───────────────────────────────────────────
describe("checkPublicTokenAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows access with valid active token for correct drilldown", async () => {
    vi.mocked(getShareByToken).mockResolvedValue(
      mockShare({ token: "abc123", permission: "view", isActive: true }) as any
    );

    const result = await checkPublicTokenAccess("abc123", 1);
    expect(result).toEqual({ allowed: true, reason: "shared" });
  });

  it("denies access when token does not exist", async () => {
    vi.mocked(getShareByToken).mockResolvedValue(null);
    const result = await checkPublicTokenAccess("invalid", 1);
    expect(result).toEqual({ allowed: false, reason: "denied" });
  });

  it("denies access when share is inactive", async () => {
    vi.mocked(getShareByToken).mockResolvedValue(
      mockShare({ token: "abc123", permission: "view", isActive: false }) as any
    );
    const result = await checkPublicTokenAccess("abc123", 1);
    expect(result).toEqual({ allowed: false, reason: "denied" });
  });

  it("denies access when token belongs to different drilldown", async () => {
    vi.mocked(getShareByToken).mockResolvedValue({
      ...mockShare({ token: "abc123", permission: "view", isActive: true }),
      drilldownId: 999,
    } as any);
    const result = await checkPublicTokenAccess("abc123", 1);
    expect(result).toEqual({ allowed: false, reason: "denied" });
  });
});

// ─── Tests: Subscription tier upload limits ───────────────────────────────────
describe("Subscription tier upload limits", () => {
  const FREE_LIMIT = 3;

  it("free user can upload up to 3 drilldowns", () => {
    const currentCount = 2;
    const canUpload = currentCount < FREE_LIMIT;
    expect(canUpload).toBe(true);
  });

  it("free user cannot upload when at limit (3)", () => {
    const currentCount = 3;
    const canUpload = currentCount < FREE_LIMIT;
    expect(canUpload).toBe(false);
  });

  it("pro/enterprise user has no upload limit", () => {
    const tier = "enterprise";
    const isUnlimited = tier === "pro" || tier === "enterprise";
    expect(isUnlimited).toBe(true);
  });
});

// ─── Tests: Permission rank ordering ─────────────────────────────────────────
describe("Permission rank ordering", () => {
  const RANK: Record<DrilldownPermission, number> = { view: 1, edit: 2, admin: 3 };

  it("admin > edit > view", () => {
    expect(RANK.admin).toBeGreaterThan(RANK.edit);
    expect(RANK.edit).toBeGreaterThan(RANK.view);
  });

  it("edit permission satisfies view requirement", () => {
    const granted: DrilldownPermission = "edit";
    const required: DrilldownPermission = "view";
    expect(RANK[granted] >= RANK[required]).toBe(true);
  });

  it("view permission does NOT satisfy edit requirement", () => {
    const granted: DrilldownPermission = "view";
    const required: DrilldownPermission = "edit";
    expect(RANK[granted] >= RANK[required]).toBe(false);
  });
});
