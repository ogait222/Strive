import { model, Schema, Types, Document } from "mongoose";
import type { IExercise } from "./WorkoutPlan";

interface ITemplateDay {
    day?: string;
    exercises: IExercise[];
}

export interface IWorkoutTemplate extends Document {
    trainer: Types.ObjectId;
    title: string;
    description?: string;
    days: ITemplateDay[];
    createdAt: Date;
    updatedAt: Date;
}

const TemplateDaySchema = new Schema<ITemplateDay>({
    day: { type: String },
    exercises: {
        type: [
            new Schema<IExercise>({
                name: { type: String, required: true },
                sets: { type: Number, required: true },
                reps: { type: Number, required: true },
                videoUrl: { type: String },
                notes: { type: String },
            })
        ],
        validate: [(val: IExercise[]) => val.length <= 10, "Máximo de 10 exercicios por dia."]
    },
});

const WorkoutTemplateSchema = new Schema<IWorkoutTemplate>(
    {
        trainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        description: { type: String },
        days: { type: [TemplateDaySchema], default: [] },
    },
    { timestamps: true }
);

export default model<IWorkoutTemplate>("WorkoutTemplate", WorkoutTemplateSchema);
