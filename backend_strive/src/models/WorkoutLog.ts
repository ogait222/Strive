import{ model ,Types, Schema } from "mongoose";

export interface IWorkoutLog extends Document {
    client: Types.ObjectId;
    personalTrainer: Types.ObjectId;
    workoutPlan: Types.ObjectId;
    date: Date;
    completed: boolean;
    reasonsForIncompletion?: string;
    exercises: {
        name: string;
        sets: number;
        reps: number;
        weight?: number;
        notes?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const WorkoutLogSchema = new Schema<IWorkoutLog>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    personalTrainer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workoutPlan: {
      type: Schema.Types.ObjectId,
      ref: "WorkoutPlan",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    reasonsForIncompletion: {
      type: String,
      trim: true,
    },
    exercises: [
      {
        name: { type: String, required: true },
        sets: { type: Number, required: true },
        reps: { type: Number, required: true },
        weight: { type: Number },
        notes: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true, }
);

export default model<IWorkoutLog>("WorkoutLog", WorkoutLogSchema);