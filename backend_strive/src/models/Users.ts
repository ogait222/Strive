import mongoose, {Schema, model , Model, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "client" | "trainer" | "admin";
  trainerId?: Types.ObjectId | null;
  trainerApplication?: {
    status: "none" | "pending" | "approved" | "rejected";
    fullName?: string;
    birthDate?: Date;
    certificateFile?: string;
    idDocumentFile?: string;
    submittedAt?: Date;
  };
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatarUrl?: string;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export interface UserModel extends Model<IUser, {}, IUserMethods> {}

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true }, 
  email: { type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function (value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: "E-mail inválido. Deve conter '@' e um domínio válido.",
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (value: string) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);
      },
      message:
        "A senha deve ter pelo menos 6 caracteres, incluindo letras maiúsculas, minúsculas e números.",
    },
   },
  role: {
    type: String,
    enum: ["client", "trainer", "admin"],
    default: "client",
  },
  avatarUrl: { type: String },
  trainerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  trainerApplication: {
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    fullName: { type: String },
    birthDate: { type: Date },
    certificateFile: { type: String },
    idDocumentFile: { type: String },
    submittedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  resetPasswordExpires : { type: Date },
  resetPasswordToken : { type: String },
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};


export type UserDocument = mongoose.HydratedDocument<IUser, IUserMethods>;
export const User = model<IUser, UserModel>("User", userSchema);
export default User;
