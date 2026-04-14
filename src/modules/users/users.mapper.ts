import { Interfaces } from 'lideris-commoms-microservice';

/**
 * Lean Mongoose document shape returned by .select('-password').lean()
 * Uses _id from Mongoose and timestamps from { timestamps: true }.
 */
export interface UserLeanDoc {
  _id: unknown;
  fullName: string;
  userName: string;
  email: string;
  phone?: string;
  gender?: string;
  isActive: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export function toUserResponse(doc: UserLeanDoc): Interfaces.UserResponse {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    userName: doc.userName,
    email: doc.email,
    phone: doc.phone,
    gender: doc.gender,
    isActive: doc.isActive,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ''),
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ''),
  };
}
