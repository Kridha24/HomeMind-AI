import { NotificationRepository } from './notification.repository';
import { queueService } from '../../infrastructure/queue/queueProducer';
import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';
import { QUEUE_NAMES } from '@homemind/shared';
import crypto from 'crypto';

export class NotificationService {
  public static async getNotifications(householdId: string) {
    const [notifications, unreadCount] = await Promise.all([
      NotificationRepository.findMany(householdId, 20),
      NotificationRepository.countUnread(householdId),
    ]);
    return { notifications, unreadCount };
  }

  public static async markAsRead(id: string, householdId: string) {
    const existing = await NotificationRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Notification not found');
    }
    return NotificationRepository.markAsRead(id);
  }

  /**
   * Dispatches a notification asynchronously with deduplication protection.
   */
  public static async dispatchNotification(params: {
    householdId: string;
    recipientId?: string;
    channel?: 'IN_APP' | 'PUSH' | 'EMAIL';
    title: string;
    message: string;
    data?: Record<string, any>;
    dedupKey?: string;
  }) {
    // 1. Deduplication check
    if (params.dedupKey) {
      const cacheKey = buildCacheKey('notif-dedup', params.householdId, params.dedupKey);
      const alreadySent = await redis.get(cacheKey);
      if (alreadySent) {
        return { success: true, deduped: true };
      }
      // Set dedupe window for 1 hour
      await redis.set(cacheKey, '1', 3600);
    }

    // 2. Immediate in-app persistence for reliable local UI display
    const saved = await NotificationRepository.create({
      householdId: params.householdId,
      userId: params.recipientId,
      title: params.title,
      message: params.message,
    });

    // 3. Dispatch to BullMQ for async delivery (push/email)
    const jobId = crypto.randomUUID();
    await queueService.publishJob(QUEUE_NAMES.NOTIFICATIONS, {
      version: 1,
      jobType: 'NOTIFICATION_DISPATCH',
      jobId,
      occurredAt: new Date().toISOString(),
      householdId: params.householdId,
      payload: {
        householdId: params.householdId,
        recipientId: params.recipientId || '',
        channel: params.channel || 'IN_APP',
        title: params.title,
        message: params.message,
        data: params.data,
        dedupKey: params.dedupKey,
      },
    });

    return { success: true, notification: saved };
  }
}
