import { User } from '../models/user.model';
import { IUser } from '../types';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';

export class AuthService {
  async register(email: string, passwordPlain: string, name: string) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw { status: 409, message: 'Email already registered' };
    }

    const hashedPassword = await hashPassword(passwordPlain);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, passwordPlain: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    if (!user.password) {
      throw { status: 401, message: 'Invalid credentials' };
    }
    const match = await comparePassword(passwordPlain, user.password);
    if (!match) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; address?: string; avatar?: string }) {
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select('-password');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return user;
  }

  async updatePassword(userId: string, oldPasswordPlain: string, newPasswordPlain: string) {
    const user = await User.findById(userId);
    if (!user || !user.password) {
      throw { status: 404, message: 'User not found' };
    }

    const match = await comparePassword(oldPasswordPlain, user.password);
    if (!match) {
      throw { status: 400, message: 'Ancien mot de passe incorrect' };
    }

    user.password = await hashPassword(newPasswordPlain);
    await user.save();
    return { message: 'Mot de passe mis à jour avec succès' };
  }
}
