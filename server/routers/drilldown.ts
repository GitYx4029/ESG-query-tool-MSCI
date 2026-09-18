import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  countUserDrilldowns,
  createDrilldown,
  createShare,
  getAllDrilldowns,
  getDrilldownById,
  getShareById,
  getSharedDrilldowns,
  getUserByEmail,
  getUserOwnedDrilldowns,
  listSharesByDrilldown,
  revokeShare,
  softDeleteDrilldown,
} from "../db";
import { storagePut } from "../storage";
import { checkDrilldownAccess } from "../_core/permissions";
import { protectedProcedure, router } from "../_core/trpc";

const FREE_TIER_LIMIT = 3;

export const drilldownRouter = router({
  /**
   * Upload a Drilldown Excel file.
   * - Decodes base64 → uploads to S3
   * - Stores metadata + parsedData in database
   * - Free tier: max 3 uploads
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileBase64: z.string().min(1),
        industryName: z.string().min(1),
        parsedData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const tier = (ctx.user as { subscriptionTier?: string }).subscriptionTier ?? "free";

      // Subscription limit check
      if (tier === "free") {
        const count = await countUserDrilldowns(userId);
        if (count >= FREE_TIER_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `免费用户最多上传 ${FREE_TIER_LIMIT} 个 Drilldown 报告。请升级到 Pro 以解锁无限上传。`,
          });
        }
      }

      // Decode base64 → upload to S3
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const suffix = nanoid(8);
      const s3Key = `drilldowns/${userId}/${suffix}-${input.fileName}`;
      const { key, url } = await storagePut(
        s3Key,
        fileBuffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Store in database
      const drilldownId = await createDrilldown({
        userId,
        industryName: input.industryName,
        originalFilename: input.fileName,
        s3FileKey: key,
        s3FileUrl: url,
        parsedData: input.parsedData ?? null,
      });

      return { drilldownId, s3FileUrl: url };
    }),

  /**
   * List drilldowns for the current user.
   * - Admin sees all drilldowns with owner info
   * - Regular user sees owned + shared
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const isAdmin = ctx.user.role === "admin";

    if (isAdmin) {
      const all = await getAllDrilldowns();
      return { owned: [], shared: [], all, isAdmin: true };
    }

    const [owned, shared] = await Promise.all([
      getUserOwnedDrilldowns(userId),
      getSharedDrilldowns(userId, ctx.user.email),
    ]);

    return { owned, shared, all: null, isAdmin: false };
  }),

  /**
   * Get full drilldown details including parsedData.
   * Requires at least "view" permission.
   */
  getDetail: protectedProcedure
    .input(z.object({ drilldownId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDrilldownAccess(
        ctx.user.id,
        ctx.user.role,
        ctx.user.email,
        input.drilldownId,
        "view"
      );

      if (!access.allowed) {
        if (access.reason === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在或已被删除" });
        }
        throw new TRPCError({ code: "FORBIDDEN", message: "您没有权限查看此报告" });
      }

      const drilldown = await getDrilldownById(input.drilldownId);
      return drilldown!;
    }),

  /**
   * Soft-delete a drilldown. Only the owner can delete.
   */
  deleteOne: protectedProcedure
    .input(z.object({ drilldownId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDrilldownAccess(
        ctx.user.id,
        ctx.user.role,
        ctx.user.email,
        input.drilldownId,
        "admin"
      );

      if (!access.allowed || access.reason !== "owner") {
        if (access.reason === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在或已被删除" });
        }
        throw new TRPCError({ code: "FORBIDDEN", message: "只有报告所有者可以删除" });
      }

      await softDeleteDrilldown(input.drilldownId);
      return { success: true };
    }),

  /**
   * Share a drilldown with another user (by email) or generate a public link.
   * Only the owner can share.
   */
  share: protectedProcedure
    .input(
      z.object({
        drilldownId: z.number().int().positive(),
        email: z.string().email().optional(),
        permission: z.enum(["view", "edit", "admin"]).default("view"),
        publicLink: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const access = await checkDrilldownAccess(
        ctx.user.id,
        ctx.user.role,
        ctx.user.email,
        input.drilldownId,
        "admin"
      );

      if (!access.allowed || access.reason !== "owner") {
        if (access.reason === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在或已被删除" });
        }
        throw new TRPCError({ code: "FORBIDDEN", message: "只有报告所有者可以分享" });
      }

      if (input.publicLink) {
        // Generate public link share
        const token = nanoid(32);
        const shareId = await createShare({
          drilldownId: input.drilldownId,
          sharedWithUserId: null,
          sharedWithEmail: null,
          permission: "view",
          shareToken: token,
        });
        return { shareId, type: "public_link" as const, shareToken: token };
      }

      if (!input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "请提供邮箱地址或选择生成公开链接",
        });
      }

      // Prevent sharing with self
      if (input.email.toLowerCase() === ctx.user.email?.toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "不能分享给自己" });
      }

      // Resolve user by email (if registered)
      const targetUser = await getUserByEmail(input.email);

      const shareId = await createShare({
        drilldownId: input.drilldownId,
        sharedWithUserId: targetUser?.id ?? null,
        sharedWithEmail: input.email,
        permission: input.permission,
        shareToken: null,
      });

      return { shareId, type: "email" as const, shareToken: null };
    }),

  /**
   * List all shares for a drilldown. Only owner or admin can view.
   */
  listShares: protectedProcedure
    .input(z.object({ drilldownId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDrilldownAccess(
        ctx.user.id,
        ctx.user.role,
        ctx.user.email,
        input.drilldownId,
        "admin"
      );

      // Allow admin role to list shares too
      if (!access.allowed && ctx.user.role !== "admin") {
        if (access.reason === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "报告不存在或已被删除" });
        }
        throw new TRPCError({ code: "FORBIDDEN", message: "只有报告所有者可以查看分享列表" });
      }

      return listSharesByDrilldown(input.drilldownId);
    }),

  /**
   * Revoke a share. Only the drilldown owner can revoke.
   */
  revokeShare: protectedProcedure
    .input(z.object({ shareId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const share = await getShareById(input.shareId);
      if (!share) {
        throw new TRPCError({ code: "NOT_FOUND", message: "分享记录不存在" });
      }

      // Check that the current user owns the drilldown
      const access = await checkDrilldownAccess(
        ctx.user.id,
        ctx.user.role,
        ctx.user.email,
        share.drilldownId,
        "admin"
      );

      if (!access.allowed || access.reason !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "只有报告所有者可以撤销分享" });
      }

      await revokeShare(input.shareId);
      return { success: true };
    }),
});
