import { prisma } from '../../repositories/db';
import { fcmProvider, PushNotificationPayload } from '../../infrastructure/notifications/fcmProvider';
import { DeviceTokenService } from '../communication/deviceTokenService';
import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';

export interface DispatchNotificationEventParams {
  householdId: string;
  actorId?: string; // ID of user who initiated the action (will be excluded from receiving notification)
  recipientUserIds?: string[]; // If specified, only these users will be targeted (minus actor)
  category: 'FINANCE' | 'BILLS' | 'TASKS' | 'GROCERIES' | 'FAMILY' | 'SECURITY' | 'GENERAL';
  title: string;
  body: string;
  link: string; // Internal app route e.g. /finance, /bills, /tasks
  dedupKey?: string;
  data?: Record<string, string>;
}

export class NotificationDispatcher {
  /**
   * Dispatch notification to authorized recipients' active devices, respecting category preferences and actor exclusion.
   */
  public static async dispatchEvent(params: DispatchNotificationEventParams): Promise<{
    recipientCount: number;
    deviceCount: number;
    deduped?: boolean;
  }> {
    const {
      householdId,
      actorId,
      category,
      title,
      body,
      link,
      dedupKey,
      data,
    } = params;

    // 1. Deduplication safeguard (1-hour window)
    if (dedupKey) {
      const cacheKey = buildCacheKey('notif-dedup', householdId, dedupKey);
      try {
        const existing = await redis.get(cacheKey);
        if (existing) {
          return { recipientCount: 0, deviceCount: 0, deduped: true };
        }
        await redis.set(cacheKey, '1', 3600);
      } catch {
        // Degrade gracefully if redis unavailable
      }
    }

    // 2. Resolve authorized recipient IDs
    let targetUserIds: string[] = [];
    if (params.recipientUserIds && params.recipientUserIds.length > 0) {
      targetUserIds = params.recipientUserIds;
    } else if (householdId) {
      // Find all household members
      try {
        const members = await prisma.user.findMany({
          where: { householdId, isActive: true },
          select: { id: true },
        });
        targetUserIds = members.map((m) => m.id);
      } catch (err: any) {
        console.warn(`[NotificationDispatcher] Failed to fetch household members: ${err.message}`);
      }
    }

    // Exclude the actor
    if (actorId) {
      targetUserIds = targetUserIds.filter((id) => id !== actorId);
    }

    if (targetUserIds.length === 0) {
      return { recipientCount: 0, deviceCount: 0 };
    }

    let totalDevices = 0;
    let recipientsReached = 0;

    const pushPayload: PushNotificationPayload = {
      title,
      body,
      category,
      link,
      tag: `hm-${category.toLowerCase()}-${Date.now()}`,
      data: {
        ...(data || {}),
        category,
        householdId,
      },
    };

    // 3. Dispatch to each recipient's active registered devices
    for (const recipientId of targetUserIds) {
      try {
        // Create in-app notification in DB
        await prisma.notification.create({
          data: {
            householdId,
            title,
            message: body,
            type: category === 'BILLS' ? 'BILL_DUE' : category === 'TASKS' ? 'TASK_ASSIGNED' : 'ALERT',
            isRead: false,
          },
        }).catch(() => {});

        // Fetch recipient's active tokens filtered by category preference
        const tokens = await DeviceTokenService.getActiveTokensForUser(recipientId, category);
        if (tokens.length > 0) {
          totalDevices += tokens.length;
          recipientsReached++;
          await fcmProvider.sendMulticastPush(tokens, pushPayload);
        }
      } catch (err: any) {
        console.warn(`[NotificationDispatcher] Error dispatching to user ${recipientId}: ${err.message}`);
      }
    }

    return { recipientCount: recipientsReached, deviceCount: totalDevices };
  }
}
