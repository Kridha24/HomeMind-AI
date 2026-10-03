import { prisma } from '../../repositories/db';

export interface DeviceKeyDTO {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: string;
  deviceName?: string | null;
  publicKey: string;
  version: number;
  createdAt: Date;
  revokedAt?: Date | null;
}

export class DeviceKeyService {
  /**
   * Register or update a device public cryptographic identity key.
   * Private keys NEVER touch the server.
   */
  public static async registerDeviceKey(
    userId: string,
    data: {
      deviceId: string;
      deviceType?: string;
      deviceName?: string;
      publicKey: string;
    }
  ): Promise<DeviceKeyDTO> {
    const { deviceId, deviceType = 'web', deviceName, publicKey } = data;

    if (!userId || !deviceId || !publicKey) {
      throw new Error('userId, deviceId, and publicKey are required');
    }

    const existing = await prisma.deviceKey.findUnique({
      where: { deviceId },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new Error('Device is already registered to another user account');
      }

      const updated = await prisma.deviceKey.update({
        where: { deviceId },
        data: {
          publicKey,
          deviceType,
          deviceName: deviceName ?? existing.deviceName,
          version: existing.version + 1,
          revokedAt: null, // Un-revoke if re-registering
        },
      });
      return updated;
    }

    const created = await prisma.deviceKey.create({
      data: {
        userId,
        deviceId,
        deviceType,
        deviceName,
        publicKey,
        version: 1,
      },
    });

    return created;
  }

  /**
   * Revoke a device key so future messages will no longer wrap keys for it
   */
  public static async revokeDevice(userId: string, deviceId: string): Promise<boolean> {
    const existing = await prisma.deviceKey.findUnique({
      where: { deviceId },
    });

    if (!existing || existing.userId !== userId) {
      return false;
    }

    await prisma.deviceKey.update({
      where: { deviceId },
      data: { revokedAt: new Date() },
    });

    return true;
  }

  /**
   * Get active (non-revoked) devices for a user
   */
  public static async getUserDevices(userId: string): Promise<DeviceKeyDTO[]> {
    return prisma.deviceKey.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all active recipient devices for all active members in a household.
   * Forward secrecy rule: If a member has been removed from the household,
   * they are NOT in the active household member list and their devices are excluded!
   */
  public static async getHouseholdRecipientDevices(
    householdId: string,
    excludeDeviceId?: string
  ): Promise<{ userId: string; deviceId: string; publicKey: string; deviceType: string }[]> {
    // 1. Fetch active members belonging to this household
    const activeMembers = await prisma.user.findMany({
      where: {
        householdId,
        softDelete: false,
        isActive: true,
      },
      select: { id: true },
    });

    const activeUserIds = activeMembers.map((m) => m.id);
    if (activeUserIds.length === 0) return [];

    // 2. Fetch active keys for those members
    const deviceKeys = await prisma.deviceKey.findMany({
      where: {
        userId: { in: activeUserIds },
        revokedAt: null,
        ...(excludeDeviceId ? { deviceId: { not: excludeDeviceId } } : {}),
      },
      select: {
        userId: true,
        deviceId: true,
        publicKey: true,
        deviceType: true,
      },
    });

    return deviceKeys;
  }

  /**
   * Get all active recipient devices for active members of a specific conversation.
   * Ensures forward secrecy: only active members of this conversation get the wrapped CEKs.
   */
  public static async getConversationRecipientDevices(
    conversationId: string,
    householdId: string,
    excludeDeviceId?: string
  ): Promise<{ userId: string; deviceId: string; publicKey: string; deviceType: string }[]> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!conversation || conversation.householdId !== householdId) {
      return [];
    }

    const memberUserIds = conversation.members.map((m) => m.userId);
    if (memberUserIds.length === 0) return [];

    const activeMembers = await prisma.user.findMany({
      where: {
        id: { in: memberUserIds },
        householdId,
        softDelete: false,
        isActive: true,
      },
      select: { id: true },
    });

    const activeUserIds = activeMembers.map((m) => m.id);
    if (activeUserIds.length === 0) return [];

    return prisma.deviceKey.findMany({
      where: {
        userId: { in: activeUserIds },
        revokedAt: null,
        ...(excludeDeviceId ? { deviceId: { not: excludeDeviceId } } : {}),
      },
      select: {
        userId: true,
        deviceId: true,
        publicKey: true,
        deviceType: true,
      },
    });
  }
}
