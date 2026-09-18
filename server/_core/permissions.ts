import { getDrilldownById, getShareByToken, listSharesByDrilldown } from "../db";

export type DrilldownPermission = "view" | "edit" | "admin";

export interface AccessCheckResult {
  allowed: boolean;
  reason: "owner" | "admin_role" | "shared" | "denied" | "not_found";
}

const PERMISSION_RANK: Record<DrilldownPermission, number> = {
  view: 1,
  edit: 2,
  admin: 3,
};

function hasRequiredPermission(
  granted: DrilldownPermission,
  required: DrilldownPermission
): boolean {
  return PERMISSION_RANK[granted] >= PERMISSION_RANK[required];
}

/**
 * Check if a user has the required permission for a drilldown.
 *
 * Priority:
 * 1. Owner → full access (all permissions)
 * 2. Admin role → view access to all drilldowns
 * 3. Shared user → permission from drilldownShares table
 * 4. Otherwise → denied
 */
export async function checkDrilldownAccess(
  userId: number,
  userRole: "user" | "admin",
  userEmail: string | null | undefined,
  drilldownId: number,
  requiredPermission: DrilldownPermission
): Promise<AccessCheckResult> {
  // 1. Fetch the drilldown
  const drilldown = await getDrilldownById(drilldownId);
  if (!drilldown) {
    return { allowed: false, reason: "not_found" };
  }

  // 2. Owner has full access
  if (drilldown.userId === userId) {
    return { allowed: true, reason: "owner" };
  }

  // 3. Admin role can view (but not edit/delete) any drilldown
  if (userRole === "admin" && requiredPermission === "view") {
    return { allowed: true, reason: "admin_role" };
  }

  // 4. Check shares
  const shares = await listSharesByDrilldown(drilldownId);
  for (const share of shares) {
    const matchByUserId = share.sharedWithUserId === userId;
    const matchByEmail =
      userEmail && share.sharedWithEmail?.toLowerCase() === userEmail.toLowerCase();

    if (matchByUserId || matchByEmail) {
      const granted = share.permission as DrilldownPermission;
      if (hasRequiredPermission(granted, requiredPermission)) {
        return { allowed: true, reason: "shared" };
      }
    }
  }

  return { allowed: false, reason: "denied" };
}

/**
 * Check public link access via shareToken.
 * Public links only grant "view" permission.
 */
export async function checkPublicTokenAccess(
  token: string,
  drilldownId: number
): Promise<AccessCheckResult> {
  const share = await getShareByToken(token);
  if (!share || share.drilldownId !== drilldownId || !share.isActive) {
    return { allowed: false, reason: "denied" };
  }
  return { allowed: true, reason: "shared" };
}
