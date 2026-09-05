import { Notification } from '../models/notification.model';

export class NotificationService {
  async getUserNotifications(userId: string) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    if (!notif) {
      throw { status: 404, message: 'Notification not found' };
    }
    return notif;
  }

  async markAllAsRead(userId: string) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) {
      throw { status: 404, message: 'Notification not found' };
    }
    return { message: 'Notification deleted successfully' };
  }

  async createNotification(userId: string, type: 'info' | 'success' | 'urgent', title: string, body: string) {
    return await Notification.create({
      userId,
      type,
      title,
      body,
      read: false
    });
  }
}
