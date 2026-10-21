import Notification from '../models/Notification.js';

export const notificationController = {
  // GET /notifications — get all notifications for logged-in user
  async getAll(req, res, next) {
    try {
      const notifications = await Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50);
      const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });
      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
      next(error);
    }
  },

  // POST /notifications/:id/read — mark one as read
  async markRead(req, res, next) {
    try {
      await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { read: true }
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // POST /notifications/read-all — mark all as read
  async markAllRead(req, res, next) {
    try {
      await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /notifications/:id — delete a notification
  async deleteOne(req, res, next) {
    try {
      await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
