/**
 * HomeMind.AI Centralized Role-Based Access Control (RBAC) Permissions Engine
 * 
 * Rules:
 * 1. FULL HOUSEHOLD FINANCIAL VISIBILITY: 'OWNER' and 'CO-OWNER' ONLY.
 * 2. RESTRICTED MEMBER VISIBILITY: Every other role ('MEMBER', 'GUEST', 'ADMIN', etc.)
 *    cannot view other members' financial details, household totals, or financial analytics.
 * 3. Only OWNER can promote/demote CO-OWNER.
 */

export type Role = 'OWNER' | 'CO-OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export function normalizeRole(role?: string | null): string {
  if (!role) return 'MEMBER';
  const clean = role.trim().toUpperCase().replace(/_/g, '-');
  return clean;
}

/**
 * Checks if the role has permission to view full household-level financial snapshots,
 * total incomes, total expenses, net savings, and financial reports.
 * STRICT: Only OWNER and CO-OWNER have this permission.
 */
export function canViewHouseholdFinancials(role?: string | null): boolean {
  const norm = normalizeRole(role);
  return norm === 'OWNER' || norm === 'CO-OWNER';
}

/**
 * Checks if the role has permission to view another member's income, expenses,
 * personal transaction history, and private financial activity.
 * STRICT: Only OWNER and CO-OWNER have this permission.
 */
export function canViewOtherMemberFinancials(role?: string | null): boolean {
  const norm = normalizeRole(role);
  return norm === 'OWNER' || norm === 'CO-OWNER';
}

/**
 * Checks if the role can view basic collaboration profile of a member (name, email, role, tasks).
 */
export function canViewMemberProfile(role?: string | null): boolean {
  return !!role; // Any authenticated member can view collaboration profiles in the same household
}

/**
 * Checks if the role has permission to view household financial analytics,
 * charts, category spending trends, and income distribution.
 * STRICT: Only OWNER and CO-OWNER have this permission.
 */
export function canViewHouseholdAnalytics(role?: string | null): boolean {
  const norm = normalizeRole(role);
  return norm === 'OWNER' || norm === 'CO-OWNER';
}

/**
 * Checks if the user can manage roles.
 * OWNER can manage all roles.
 * CO-OWNER can manage MEMBER and GUEST roles.
 */
export function canManageRoles(requesterRole?: string | null, targetRole?: string | null): boolean {
  const normRequester = normalizeRole(requesterRole);
  const normTarget = targetRole ? normalizeRole(targetRole) : null;

  if (normRequester === 'OWNER') {
    return true;
  }

  if (normRequester === 'CO-OWNER') {
    // Co-owner cannot change Owner or another Co-owner or Admin
    if (!normTarget || normTarget === 'OWNER' || normTarget === 'CO-OWNER' || normTarget === 'ADMIN') {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Only the household OWNER can promote someone to CO-OWNER or demote a CO-OWNER.
 */
export function canPromoteCoOwner(requesterRole?: string | null): boolean {
  const norm = normalizeRole(requesterRole);
  return norm === 'OWNER';
}
