import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { HTTP_STATUS } from '../constants/http';

export class NotificationController {
  private notificationService = new NotificationService();

  getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const notifications = await this.notificationService.getUserNotifications(userId);
      res.status(HTTP_STATUS.OK).json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(userId, id);
      res.status(HTTP_STATUS.OK).json(notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const result = await this.notificationService.markAllAsRead(userId);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const result = await this.notificationService.deleteNotification(userId, id);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
