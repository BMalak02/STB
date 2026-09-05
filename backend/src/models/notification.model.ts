import { Schema, model } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: ['info', 'success', 'urgent'], default: 'info' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Notification = model<INotification>('Notification', notificationSchema);
