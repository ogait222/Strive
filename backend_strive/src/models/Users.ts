import mongoose, {Schema, model , Model, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "client" | "trainer" | "admin";
  trainerId?: Types.ObjectId | null;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
  trainerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
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

