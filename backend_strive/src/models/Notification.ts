import {Schema, model, Document, Types} from "mongoose";

export interface INotification {
    recipient: Types.ObjectId;
    type: "missedWorkout" | "message" | "changeTrainer";
    message: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["missedWorkout", "message", "changeTrainer"], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
 },
    { timestamps: true}
);

export default model<INotification>("Notification", notificationSchema);