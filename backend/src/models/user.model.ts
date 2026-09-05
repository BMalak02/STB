import { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '+216 98 123 456' },
    address: { type: String, default: 'Tunis, Tunisie' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model<IUser>('User', userSchema);
