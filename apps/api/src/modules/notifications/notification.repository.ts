import { prisma } from '../../repositories/db';

export class NotificationRepository {
  public static async findMany(householdId: string, take: number = 20) {
    return prisma.notification.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  public static async countUnread(householdId: string) {
    return prisma.notification.count({
      where: { householdId, isRead: false },
    });
  }

  public static async findById(id: string, householdId: string) {
    return prisma.notification.findFirst({
      where: { id, householdId },
    });
  }

  public static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  public static async create(data: {
    householdId: string;
    userId?: string;
    title: string;
    message: string;
    type?: string;
  }) {
    return prisma.notification.create({
      data: {
        householdId: data.householdId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        isRead: false,
      },
    });
  }
}
