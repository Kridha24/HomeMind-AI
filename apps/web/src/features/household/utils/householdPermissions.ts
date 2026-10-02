export type UserRole = 'OWNER' | 'CO-OWNER' | 'ADMIN' | 'HEAD' | 'MEMBER' | 'GUEST';

/**
 * Centralized RBAC permission checks for household management
 */
export function canInviteMember(userRole?: string): boolean {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

export function canRenameHousehold(userRole?: string): boolean {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

export function canRegenerateInviteCode(userRole?: string): boolean {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

export function canManageRoles(userRole?: string, targetMemberRole?: string): boolean {
  if (!userRole) return false;
  // GUEST and MEMBER cannot manage roles
  if (['MEMBER', 'GUEST'].includes(userRole)) return false;

  // Only OWNER can modify another Admin or Co-Owner
  if (['ADMIN', 'CO-OWNER'].includes(targetMemberRole || '')) {
    return userRole === 'OWNER';
  }

  // Admins can modify Members and Guests
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

export function canRemoveMember(userRole?: string, targetMemberRole?: string, isSelf: boolean = false): boolean {
  if (!userRole || isSelf) return false;

  // Admins cannot remove Owners
  if (targetMemberRole === 'OWNER') {
    return false;
  }

  // Admins cannot remove other Admins (only Owners can)
  if (targetMemberRole === 'ADMIN' && userRole !== 'OWNER') {
    return false;
  }

  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

export function canTransferOwnership(userRole?: string): boolean {
  return userRole === 'OWNER';
}

export function canDeleteHousehold(userRole?: string): boolean {
  return userRole === 'OWNER';
}

export function canLeaveHousehold(
  userRole?: string,
  otherOwnersCount: number = 0,
  otherMembersCount: number = 0
): { canLeave: boolean; reason?: string } {
  if (userRole === 'OWNER' && otherOwnersCount === 0 && otherMembersCount > 0) {
    return {
      canLeave: false,
      reason: 'As the sole owner, please transfer ownership to another member before leaving.',
    };
  }
  return { canLeave: true };
}
