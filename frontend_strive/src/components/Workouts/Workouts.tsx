import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./Workouts.css";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  videoUrl?: string;
  notes?: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  _id: string;
  title: string;
  description?: string;
  days: WorkoutDay[];
  client: any;
  trainer: any;
  createdAt: string;
}

export default function Workouts() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || !user.id) {
          setError("Utilizador não autenticado");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:3500/workouts/client/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setWorkoutPlans(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao carregar planos de treino");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutPlans();
  }, []);

  if (loading) {
    return (
      <div className="workouts-container">
        <NavBar />
        <div className="workouts-content">
          <div className="loading">Carregando planos de treino...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workouts-container">
        <NavBar />
        <div className="workouts-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="workouts-container">
      <NavBar />
      <div className="workouts-content">
        <h1>Meus Planos de Treino</h1>

        {workoutPlans.length === 0 ? (
          <p>Não há planos de treino disponíveis.</p>
        ) : (
          workoutPlans.map((plan) => (
            <div key={plan._id} className="workout-plan-card">
              <h2>{plan.title}</h2>
              {plan.description && <p><strong>Descrição:</strong> {plan.description}</p>}

              <div className="week-schedule">
                {plan.days && plan.days.length > 0 ? (
                  plan.days.map((dayData, index) => (
                    <div key={index} className="day-card">
                      <h3>{dayData.day}</h3>
                      {dayData.exercises.length === 0 ? (
                        <p>Descanso</p>
                      ) : (
                        <ul>
                          {dayData.exercises.map((exercise, idx) => (
                            <li key={idx} className="exercise-item">
                              <strong>{exercise.name}</strong>
                              <p>Séries: {exercise.sets} | Repetições: {exercise.reps}</p>
                              {exercise.notes && <p>Notas: {exercise.notes}</p>}
                              {exercise.videoUrl && (
                                <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                                  Ver vídeo
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Sem horário definido.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
