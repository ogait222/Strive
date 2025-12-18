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
    calendarDate?: Date;
    status?: 'pending' | 'completed' | 'failed';
    exercises: IExercise[];
    completionPhotoProof?: string;
}

export interface IWorkoutPlan extends Document {
    trainer: Types.ObjectId;
    client: Types.ObjectId;
    title: string;
    description?: string;
    days: IWorkoutDay[];
    active: boolean;
    archived?: boolean;
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
    calendarDate: { type: Date },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    exercises: {
        type: [ExerciseSchema],
        validate: [(val: IExercise[]) => val.length <= 10, 'Máximo de 10 exercicios por dia.']
    },
    completionPhotoProof: { type: String },
});

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
    {
        client: { type: Schema.Types.ObjectId, ref: "User", required: true },
        trainer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        description: { type: String },
        days: { type: [WorkoutDaySchema], },
        active: { type: Boolean, default: true },
        archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default model<IWorkoutPlan>("WorkoutPlan", WorkoutPlanSchema);
