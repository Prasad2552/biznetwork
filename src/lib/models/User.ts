// src\lib\models\User.ts

import { Schema, model, models, Document, Types } from 'mongoose'

export interface IUserDocument extends Document {
  email: string
  password?: string
  name?: string
  image?: string
  provider?: string
  firstName?: string
  lastName?: string
  role?: string
  savedPosts: Types.ObjectId[];
  savedTechNews: Types.ObjectId[]; // Add this line
  savedPDFs: Types.ObjectId[]; // Added
}

export interface ExtendedUser {
  id: string
  email: string
  name?: string
  image?: string
  provider?: string
  firstName?: string
  lastName?: string
  role?: string
  savedPosts: Types.ObjectId[];
  savedTechNews: Types.ObjectId[]; // Add this line
  savedPDFs: Types.ObjectId[]; //Added
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  name: String,
  image: String,
  provider: String,
  firstName: String,
  lastName: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  savedPosts: [{ type: Schema.Types.ObjectId, ref: 'BlogPost' }],
  savedTechNews: [{ type: Schema.Types.ObjectId, ref: 'TechNews' }], // Add this line
  savedPDFs: [{ type: Schema.Types.ObjectId, ref: 'PDF' }]// Changed ref
}, {
  timestamps: true
})

const User = models.User || model<IUserDocument>('User', userSchema)

export default User