import { prisma } from '../../repositories/db';

export interface EncryptedMessagePayload {
  conversationId: string;
  clientMessageId: string;
  senderDeviceId: string;
  ciphertext: string;
  iv: string;
  ephemeralPublicKey: string;
  recipientWrappedKeys: Record<string, string>; // { [deviceId]: wrappedCekBase64 }
  aad: string;
  encryptionVersion?: string;
  attachmentMetadata?: string;
}

export class SecureMessagingService {
  /**
   * Get or create the default household conversation
   */
  public static async getOrCreateHouseholdConversation(householdId: string) {
    let conversation = await prisma.conversation.findFirst({
      where: {
        householdId,
        type: 'HOUSEHOLD',
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, role: true, avatar: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          householdId,
          type: 'HOUSEHOLD',
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, role: true, avatar: true },
              },
            },
          },
        },
      });
    }

    // Sync all active household members into conversation members
    const activeHouseholdUsers = await prisma.user.findMany({
      where: { householdId, softDelete: false, isActive: true },
      select: { id: true },
    });

    const existingMemberUserIds = new Set(conversation.members.map((m) => m.userId));

    for (const u of activeHouseholdUsers) {
      if (!existingMemberUserIds.has(u.id)) {
        await prisma.conversationMember.create({
          data: {
            conversationId: conversation.id,
            userId: u.id,
          },
        });
      }
    }

    return conversation;
  }

  /**
   * Get or create a 1-to-1 direct conversation between two household members
   */
  public static async getOrCreateDirectConversation(
    householdId: string,
    currentUserId: string,
    targetUserId: string
  ) {
    if (currentUserId === targetUserId) {
      throw new Error('Self conversation is not allowed');
    }

    // Verify both users belong to the active household
    const activeUsers = await prisma.user.findMany({
      where: {
        id: { in: [currentUserId, targetUserId] },
        householdId,
        softDelete: false,
        isActive: true,
      },
      select: { id: true, name: true, role: true, avatar: true },
    });

    if (activeUsers.length !== 2) {
      throw new Error('Both users must belong to the active household');
    }

    // Canonicalize participant pair to prevent ordering discrepancies: (A, B) === (B, A)
    const sortedUserIds = [currentUserId, targetUserId].sort();

    return prisma.$transaction(async (tx) => {
      // Find existing 1-to-1 direct conversation with exactly these two participants
      const existingConversations = await tx.conversation.findMany({
        where: {
          householdId,
          type: 'DIRECT',
          AND: [
            { members: { some: { userId: sortedUserIds[0], leftAt: null } } },
            { members: { some: { userId: sortedUserIds[1], leftAt: null } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, role: true, avatar: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest canonical conversation first
      });

      const existing = existingConversations.find(
        (c) => c.members.filter((m) => m.leftAt === null).length === 2
      );

      if (existing) {
        return existing;
      }

      // Otherwise create one with canonical ordering
      const newConversation = await tx.conversation.create({
        data: {
          householdId,
          type: 'DIRECT',
          members: {
            create: [{ userId: sortedUserIds[0] }, { userId: sortedUserIds[1] }],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, role: true, avatar: true },
              },
            },
          },
        },
      });

      return newConversation;
    });
  }

  /**
   * Verify whether a user is an authorized active participant of a conversation
   */
  public static async isMemberOfConversation(
    conversationId: string,
    userId: string,
    householdId: string
  ): Promise<boolean> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { householdId: true },
    });

    if (!conversation || conversation.householdId !== householdId) {
      return false;
    }

    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    return Boolean(membership && membership.leftAt === null);
  }

  /**
   * Store an encrypted message envelope.
   * Server NEVER receives plaintext and NEVER decrypts.
   * Deduplicates by clientMessageId.
   */
  public static async storeEncryptedMessage(
    senderId: string,
    senderHouseholdId: string,
    payload: EncryptedMessagePayload
  ) {
    const {
      conversationId,
      clientMessageId,
      senderDeviceId,
      ciphertext,
      iv,
      ephemeralPublicKey,
      recipientWrappedKeys,
      aad,
      encryptionVersion = 'v1',
      attachmentMetadata,
    } = payload;

    // 1. Authorization & Cross-Household Defense
    const isMember = await this.isMemberOfConversation(conversationId, senderId, senderHouseholdId);
    if (!isMember) {
      return { success: false, error: 'Forbidden: Not an active member of this conversation' };
    }

    // 2. Client Message Deduplication
    const existing = await prisma.message.findUnique({
      where: { clientMessageId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receipts: true,
      },
    });

    if (existing) {
      return { success: true, message: existing, deduplicated: true };
    }

    // 3. Persist Ciphertext Envelope
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderDeviceId,
        clientMessageId,
        ciphertext,
        iv,
        ephemeralPublicKey,
        recipientWrappedKeys: JSON.stringify(recipientWrappedKeys),
        aad,
        encryptionVersion,
        attachmentMetadata: attachmentMetadata || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receipts: true,
      },
    });

    return { success: true, message, deduplicated: false };
  }

  /**
   * Get paginated encrypted messages for a conversation
   */
  public static async getMessages(
    conversationId: string,
    userId: string,
    householdId: string,
    limit = 50,
    beforeCursor?: string
  ) {
    const isMember = await this.isMemberOfConversation(conversationId, userId, householdId);
    if (!isMember) {
      throw new Error('Forbidden: Not an active member of this conversation');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(beforeCursor ? { createdAt: { lt: new Date(beforeCursor) } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receipts: true,
      },
    });

    return messages.map((m) => ({
      ...m,
      recipientWrappedKeys: JSON.parse(m.recipientWrappedKeys || '{}'),
    }));
  }

  /**
   * Record delivery receipt from a recipient device
   */
  public static async recordDeliveryReceipt(messageId: string, userId: string, deviceId: string) {
    return prisma.messageReceipt.upsert({
      where: {
        messageId_userId_deviceId: {
          messageId,
          userId,
          deviceId,
        },
      },
      create: {
        messageId,
        userId,
        deviceId,
        deliveredAt: new Date(),
      },
      update: {
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Record read receipt from a recipient device
   */
  public static async recordReadReceipt(messageId: string, userId: string, deviceId: string) {
    const now = new Date();
    return prisma.messageReceipt.upsert({
      where: {
        messageId_userId_deviceId: {
          messageId,
          userId,
          deviceId,
        },
      },
      create: {
        messageId,
        userId,
        deviceId,
        deliveredAt: now,
        readAt: now,
      },
      update: {
        readAt: now,
      },
    });
  }

  /**
   * Calculate unread message counts per conversation for a user in their household.
   * Backed by database message receipts.
   */
  public static async getUnreadCounts(
    userId: string,
    householdId: string
  ): Promise<{
    totalUnread: number;
    byConversation: Record<string, number>;
    unreadMessages: Array<{
      id: string;
      conversationId: string;
      conversationType: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string | null;
      ciphertext: string;
      iv: string;
      ephemeralPublicKey: string;
      recipientWrappedKeys: any;
      aad: string;
      createdAt: string;
    }>;
  }> {
    const userConversations = await prisma.conversation.findMany({
      where: {
        householdId,
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      select: {
        id: true,
        type: true,
        messages: {
          where: {
            senderId: { not: userId },
            deletedAt: null,
            receipts: {
              none: {
                userId,
                readAt: { not: null },
              },
            },
          },
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            ciphertext: true,
            iv: true,
            ephemeralPublicKey: true,
            recipientWrappedKeys: true,
            aad: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const byConversation: Record<string, number> = {};
    let totalUnread = 0;
    const unreadMessages: Array<any> = [];

    for (const conv of userConversations) {
      const count = conv.messages.length;
      byConversation[conv.id] = count;
      totalUnread += count;

      for (const msg of conv.messages) {
        unreadMessages.push({
          id: msg.id,
          conversationId: conv.id,
          conversationType: conv.type,
          senderId: msg.senderId,
          senderName: msg.sender?.name || 'Family Member',
          senderAvatar: msg.sender?.avatar || null,
          ciphertext: msg.ciphertext,
          iv: msg.iv,
          ephemeralPublicKey: msg.ephemeralPublicKey,
          recipientWrappedKeys: msg.recipientWrappedKeys,
          aad: msg.aad,
          createdAt: msg.createdAt.toISOString(),
        });
      }
    }

    // Sort all unread messages latest first
    unreadMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { totalUnread, byConversation, unreadMessages };
  }

  /**
   * Mark all unread messages in a conversation as read for a user.
   */
  public static async markConversationAsRead(
    conversationId: string,
    userId: string,
    householdId: string,
    deviceId: string
  ): Promise<{ success: boolean; markedCount: number }> {
    const isMember = await this.isMemberOfConversation(conversationId, userId, householdId);
    if (!isMember) {
      throw new Error('Forbidden: Not an active member of this conversation');
    }

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        deletedAt: null,
        receipts: {
          none: {
            userId,
            readAt: { not: null },
          },
        },
      },
      select: { id: true },
    });

    const now = new Date();
    for (const msg of unreadMessages) {
      await prisma.messageReceipt.upsert({
        where: {
          messageId_userId_deviceId: {
            messageId: msg.id,
            userId,
            deviceId,
          },
        },
        create: {
          messageId: msg.id,
          userId,
          deviceId,
          deliveredAt: now,
          readAt: now,
        },
        update: {
          readAt: now,
        },
      });
    }

    return { success: true, markedCount: unreadMessages.length };
  }
}

