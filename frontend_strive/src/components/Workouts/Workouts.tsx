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
  _id?: string;
  day: string;
  status?: 'pending' | 'completed' | 'failed';
  exercises: Exercise[];
}

interface WorkoutPlan {
  _id: string;
  title: string;
  description?: string;
  days: WorkoutDay[];
  active?: boolean;
  client: any;
  trainer: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
}

export default function Workouts() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

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

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const handleStatusUpdate = async (planId: string, dayId: string, status: string) => {
    try {
      setUpdating(dayId);
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:3500/workouts/${planId}/day/${dayId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh plans to update UI and move to history if needed
      await fetchWorkoutPlans();
    } catch (err) {
      console.error("Erro ao atualizar status", err);
    } finally {
      setUpdating(null);
    }
  };

  const calculateProgress = (days: WorkoutDay[]) => {
    if (!days || days.length === 0) return 0;
    const completedOrFailed = days.filter(d => d.status === 'completed' || d.status === 'failed').length;
    return Math.round((completedOrFailed / days.length) * 100);
  };

  const filteredPlans = workoutPlans.filter(plan =>
    activeTab === 'active' ? plan.active !== false : plan.active === false
  );

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

        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Ativos
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Histórico
          </button>
        </div>

        {filteredPlans.length === 0 ? (
          <p>
            {activeTab === 'active'
              ? "Não há planos de treino ativos."
              : "Não há histórico de planos."}
          </p>
        ) : (
          filteredPlans.map((plan) => {
            const progress = calculateProgress(plan.days);

            return (
              <div key={plan._id} className={`workout-plan-card ${!plan.active ? 'archived' : ''}`}>
                <div className="plan-header">
                  <h2>{plan.title}</h2>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span>{progress}% Concluído</span>
                  </div>
                </div>

                {plan.description && <p><strong>Descrição:</strong> {plan.description}</p>}
                {plan.trainer && <p><strong>Treinador:</strong> {plan.trainer.username}</p>}

                <div className="week-schedule">
                  {plan.days && plan.days.length > 0 ? (
                    plan.days.map((dayData, index) => (
                      <div key={index} className={`day-card ${dayData.status || 'pending'}`}>
                        <div className="day-header">
                          <h3>{dayData.day}</h3>
                          {activeTab === 'active' && (
                            <div className="status-actions">
                              <button
                                className={`status-btn complete ${dayData.status === 'completed' ? 'selected' : ''}`}
                                onClick={() => handleStatusUpdate(plan._id, dayData._id || '', 'completed')}
                                disabled={!!updating}
                              >
                                ✓
                              </button>
                              <button
                                className={`status-btn fail ${dayData.status === 'failed' ? 'selected' : ''}`}
                                onClick={() => handleStatusUpdate(plan._id, dayData._id || '', 'failed')}
                                disabled={!!updating}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {activeTab === 'history' && (
                            <span className={`status-badge ${dayData.status}`}>
                              {dayData.status === 'completed' ? 'Concluído' : dayData.status === 'failed' ? 'Falhado' : 'Pendente'}
                            </span>
                          )}
                        </div>

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
            );
          })
        )}
      </div>
    </div>
  );
}
