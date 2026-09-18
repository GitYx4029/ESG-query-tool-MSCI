import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with subscriptionTier for future paid features.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Subscription tier for future paid features */
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "enterprise"])
    .default("free")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Drilldown reports uploaded by users.
 * Original Excel file stored in S3 (s3FileKey/s3FileUrl).
 * Parsed JSON data stored in database (parsedData).
 * Default visibility: private (only owner can see).
 */
export const drilldowns = mysqlTable("drilldowns", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner of this drilldown report */
  userId: int("userId").notNull(),
  /** GICS industry name (e.g., "Real Estate Management & Development") */
  industryName: varchar("industryName", { length: 255 }).notNull(),
  /** Original uploaded filename */
  originalFilename: varchar("originalFilename", { length: 512 }),
  /** S3 file key for the original Excel file */
  s3FileKey: varchar("s3FileKey", { length: 1024 }).notNull(),
  /** S3 public URL for the original Excel file */
  s3FileUrl: varchar("s3FileUrl", { length: 2048 }).notNull(),
  /** Full parsed data stored as JSON */
  parsedData: json("parsedData"),
  /** Soft delete flag */
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Drilldown = typeof drilldowns.$inferSelect;
export type InsertDrilldown = typeof drilldowns.$inferInsert;

/**
 * Sharing permissions for drilldown reports.
 * Supports user-specific sharing (sharedWithEmail) and public link sharing (shareToken).
 */
export const drilldownShares = mysqlTable("drilldownShares", {
  id: int("id").autoincrement().primaryKey(),
  /** The drilldown being shared */
  drilldownId: int("drilldownId").notNull(),
  /** User ID this is shared with (resolved after login) */
  sharedWithUserId: int("sharedWithUserId"),
  /** Email address this is shared with */
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }),
  /** Permission level granted */
  permission: mysqlEnum("permission", ["view", "edit", "admin"])
    .default("view")
    .notNull(),
  /** Unique token for public link sharing */
  shareToken: varchar("shareToken", { length: 128 }),
  /** Whether this share is still active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrilldownShare = typeof drilldownShares.$inferSelect;
export type InsertDrilldownShare = typeof drilldownShares.$inferInsert;
