export interface NotificationDto {
  householdId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  dedupKey?: string;
}

export interface GetNotificationsResult {
  notifications: any[];
  unreadCount: number;
}
