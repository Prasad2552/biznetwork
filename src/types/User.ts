// User.ts
import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  password?: string;
  image?: string;
  provider?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  image: { type: String },
  provider: { type: String },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;