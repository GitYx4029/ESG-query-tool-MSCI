import { and, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  drilldownShares,
  drilldowns,
  InsertDrilldown,
  InsertDrilldownShare,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Drilldown helpers ───────────────────────────────────────────────────────

export async function createDrilldown(
  data: Omit<InsertDrilldown, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(drilldowns).values({ ...data, isDeleted: false });
  return (result[0] as { insertId: number }).insertId;
}

export async function getDrilldownById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(drilldowns)
    .where(and(eq(drilldowns.id, id), eq(drilldowns.isDeleted, false)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Summary fields for list views (excludes large parsedData) */
export async function getUserOwnedDrilldowns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: drilldowns.id,
      userId: drilldowns.userId,
      industryName: drilldowns.industryName,
      originalFilename: drilldowns.originalFilename,
      s3FileUrl: drilldowns.s3FileUrl,
      isDeleted: drilldowns.isDeleted,
      createdAt: drilldowns.createdAt,
      updatedAt: drilldowns.updatedAt,
    })
    .from(drilldowns)
    .where(and(eq(drilldowns.userId, userId), eq(drilldowns.isDeleted, false)))
    .orderBy(sql`${drilldowns.createdAt} DESC`);
}

/** Get drilldowns shared with a user (by userId or email), with owner info */
export async function getSharedDrilldowns(userId: number, email: string | null | undefined) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    and(eq(drilldownShares.sharedWithUserId, userId), eq(drilldownShares.isActive, true)),
  ];
  if (email) {
    conditions.push(
      and(eq(drilldownShares.sharedWithEmail, email), eq(drilldownShares.isActive, true))
    );
  }

  const rows = await db
    .select({
      id: drilldowns.id,
      userId: drilldowns.userId,
      industryName: drilldowns.industryName,
      originalFilename: drilldowns.originalFilename,
      s3FileUrl: drilldowns.s3FileUrl,
      isDeleted: drilldowns.isDeleted,
      createdAt: drilldowns.createdAt,
      updatedAt: drilldowns.updatedAt,
      sharePermission: drilldownShares.permission,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(drilldownShares)
    .innerJoin(drilldowns, eq(drilldownShares.drilldownId, drilldowns.id))
    .innerJoin(users, eq(drilldowns.userId, users.id))
    .where(
      and(
        eq(drilldowns.isDeleted, false),
        or(...conditions)
      )
    )
    .orderBy(sql`${drilldowns.createdAt} DESC`);

  return rows;
}

/** Admin: get all drilldowns with owner info */
export async function getAllDrilldowns() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: drilldowns.id,
      userId: drilldowns.userId,
      industryName: drilldowns.industryName,
      originalFilename: drilldowns.originalFilename,
      s3FileUrl: drilldowns.s3FileUrl,
      isDeleted: drilldowns.isDeleted,
      createdAt: drilldowns.createdAt,
      updatedAt: drilldowns.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(drilldowns)
    .innerJoin(users, eq(drilldowns.userId, users.id))
    .where(eq(drilldowns.isDeleted, false))
    .orderBy(sql`${drilldowns.createdAt} DESC`);
}

export async function softDeleteDrilldown(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(drilldowns).set({ isDeleted: true }).where(eq(drilldowns.id, id));
}

export async function countUserDrilldowns(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(drilldowns)
    .where(and(eq(drilldowns.userId, userId), eq(drilldowns.isDeleted, false)));
  return Number(result[0]?.count ?? 0);
}

// ─── Share helpers ────────────────────────────────────────────────────────────

export async function createShare(
  data: Omit<InsertDrilldownShare, "id" | "createdAt" | "updatedAt" | "isActive">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(drilldownShares).values({ ...data, isActive: true });
  return (result[0] as { insertId: number }).insertId;
}

export async function listSharesByDrilldown(drilldownId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(drilldownShares)
    .where(
      and(eq(drilldownShares.drilldownId, drilldownId), eq(drilldownShares.isActive, true))
    )
    .orderBy(sql`${drilldownShares.createdAt} DESC`);
}

export async function revokeShare(shareId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(drilldownShares)
    .set({ isActive: false })
    .where(eq(drilldownShares.id, shareId));
}

export async function getShareById(shareId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(drilldownShares)
    .where(eq(drilldownShares.id, shareId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getShareByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(drilldownShares)
    .where(
      and(eq(drilldownShares.shareToken, token), eq(drilldownShares.isActive, true))
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
