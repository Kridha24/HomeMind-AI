import { DeviceTokenService } from './deviceTokenService';
import { fcmProvider } from '../../infrastructure/notifications/fcmProvider';

export interface MessagePushDispatchParams {
  recipientUserIds: string[];
  conversationId: string;
  conversationType: 'DIRECT' | 'HOUSEHOLD';
  senderId: string;
  senderName: string;
  messageId: string;
  createdAt: Date | string;
}

export class PushNotificationService {
  /**
   * Dispatch privacy-safe background push notifications for new messages.
   * E2EE GUARANTEE:
   * - ZERO message plaintext
   * - ZERO ciphertext
   * - ZERO ephemeral public keys or wrapped CEKs
   * - Only sanitized routing metadata is dispatched.
   */
  public static async dispatchMessagePush(params: {
    recipientUserIds: string[];
    conversationId: string;
    conversationType: 'DIRECT' | 'HOUSEHOLD';
    senderId: string;
    senderName: string;
    messageId: string;
    createdAt: Date | string;
  }): Promise<{ dispatchedCount: number; deviceCount: number }> {
    const {
      recipientUserIds,
      conversationId,
      conversationType,
      senderId,
      senderName,
      messageId,
      createdAt,
    } = params;

    let dispatchedCount = 0;
    let deviceCount = 0;

    const timestamp = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();

    for (const recipientUserId of recipientUserIds) {
      // Exclude sender
      if (!recipientUserId || recipientUserId === senderId) continue;

      try {
        const tokens = await DeviceTokenService.getActiveTokensForUser(recipientUserId, 'FAMILY');
        if (!tokens || tokens.length === 0) continue;

        deviceCount += tokens.length;
        dispatchedCount++;

        // Sanitized payload containing ONLY safe metadata
        const pushPayload: Record<string, string> = {
          type: 'NEW_MESSAGE',
          conversationId,
          conversationType,
          senderId,
          senderName: senderName || 'Family Member',
          messageId,
          timestamp,
        };

        await fcmProvider.sendMulticastPush(tokens, {
          title: 'New Message',
          body: `${senderName || 'A family member'} sent a message`,
          link: '/messages',
          category: 'FAMILY',
          tag: `msg-${conversationId}`,
          data: pushPayload,
        });

        console.log(
          `[PushNotificationService] Dispatched NEW_MESSAGE notification to ${tokens.length} device(s) for user ${recipientUserId} (conv=${conversationId})`
        );
      } catch (err) {
        console.warn(`[PushNotificationService] Failed to dispatch push for user ${recipientUserId}:`, err);
      }
    }

    return { dispatchedCount, deviceCount };
  }
}
