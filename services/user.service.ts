// services/user.service.ts
import mongoose from 'mongoose';
import UserModel, { IUser } from '@/models/usertemp';

// Cast once — Model<IUser> is fully typed, no more red lines
const User = UserModel as mongoose.Model<IUser>;

const UserService = {

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password -__v');
  },

  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).select('-password -__v');
  },

  async findUserByReferralCode(referralCode: string): Promise<IUser | null> {
    const regex = new RegExp(`^${referralCode.trim()}$`, 'i');
    return User.findOne({ myReferralCode: { $regex: regex } }).select('-password -__v');
  },

  async updateUserById(
    userId: string,
    data: Record<string, unknown>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, data, { new: true }).select('-password -__v');
  },

  async referralCodeExists(referralCode: string): Promise<boolean> {
    const regex = new RegExp(`^${referralCode.trim()}$`, 'i');
    const user = await User.findOne({ myReferralCode: { $regex: regex } }).select('_id');
    return !!user;
  },

  async addNotification(
    userId: string,
    notification: { title: string; desc: string }
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          ...notification,
          unread: true,
          time: new Date(),
        },
      },
    });
  },
};

export default UserService;