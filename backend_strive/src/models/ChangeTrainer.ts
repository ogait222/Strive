import {model , Schema , Types } from "mongoose";

export interface IChangeTrainer {
    client: Types.ObjectId;
    currentTrainer: Types.ObjectId;
    newTrainer: Types.ObjectId;
    reason?: string;
    status: "pending" | "approved" | "rejected";
    adminHandler?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const ChangeTrainerSchema = new Schema<IChangeTrainer>(
    {
        client: { type: Schema.Types.ObjectId, ref: "User", required: true },
        currentTrainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        newTrainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reason: { type: String },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminHandler: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);


export default model<IChangeTrainer>("ChangeTrainer", ChangeTrainerSchema);