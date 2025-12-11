import { model, Schema, Types } from "mongoose";

export interface IExercise {
    name: string;
    sets: number;
    reps: number;
    videoUrl?: string;
    notes?: string;
}

interface IWorkoutDay {
    day: string;
    status?: 'pending' | 'completed' | 'failed';
    exercises: IExercise[];
}

export interface IWorkoutPlan extends Document {
    trainer: Types.ObjectId;
    client: Types.ObjectId;
    title: string;
    description?: string;
    days: IWorkoutDay[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    videoUrl: { type: String },
    notes: { type: String },
});

const WorkoutDaySchema = new Schema<IWorkoutDay>({
    day: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    exercises: {
        type: [ExerciseSchema],
        validate: [(val: IExercise[]) => val.length <= 10, 'Máximo de 10 exercicios por dia.']
    }
});

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
    {
        client: { type: Schema.Types.ObjectId, ref: "User", required: true },
        trainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        description: { type: String },
        days: { type: [WorkoutDaySchema], },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default model<IWorkoutPlan>("WorkoutPlan", WorkoutPlanSchema);