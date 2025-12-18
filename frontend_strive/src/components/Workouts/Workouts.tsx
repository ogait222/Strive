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
  completionPhotoProof?: string; //ainda não implementado
  calendarDate?: string;
}

interface WorkoutPlan {
  _id: string;
  title: string;
  description?: string;
  days: WorkoutDay[];
  active?: boolean;
  archived?: boolean;
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
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [photoModalData, setPhotoModalData] = useState<{ planId: string; dayId: string; dayLabel: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");

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

  const handleStatusUpdate = async (planId: string, dayId: string, status: string, completionPhotoProof?: string) => {
    try {
      setUpdating(dayId);
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:3500/workouts/${planId}/day/${dayId}/status`,
        { status, completionPhotoProof },
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

  const handleCompleteClick = (planId: string, dayId: string, dayLabel: string, status?: WorkoutDay["status"]) => {
    if (status && status !== "pending") return;
    setPhotoModalData({ planId, dayId, dayLabel });
    setPhotoFile(null);
    setPhotoError("");
  };

  const handleFailClick = (planId: string, dayId: string, status?: WorkoutDay["status"]) => {
    if (status && status !== "pending") return;
    handleStatusUpdate(planId, dayId, "failed");
  };

  const handlePhotoSubmit = async () => {
    if (!photoModalData) return;
    if (!photoFile) {
      setPhotoError("Carrega uma foto para concluir o treino.");
      return;
    }

    try {
      setPhotoError("");
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const photoString = await toBase64(photoFile);
      await handleStatusUpdate(photoModalData.planId, photoModalData.dayId, "completed", photoString);
      setPhotoModalData(null);
      setPhotoFile(null);
    } catch (err) {
      setPhotoError("Erro ao enviar a foto. Tenta novamente.");
    }
  };

  const handleArchivePlan = async (planId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:3500/workouts/${planId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchWorkoutPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao arquivar plano");
    }
  };

  const plansPerPage = 4;
  const [page, setPage] = useState(1);

  const filteredPlans = workoutPlans.filter(plan =>
    activeTab === 'active'
      ? plan.active !== false && !plan.archived
      : activeTab === 'archived'
      ? plan.archived === true
      : plan.active === false && !plan.archived
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / plansPerPage));
  const paginatedPlans = filteredPlans.slice((page - 1) * plansPerPage, page * plansPerPage);

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
          <button
            className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            Arquivados
          </button>
        </div>

        {filteredPlans.length === 0 ? (
          <p>
            {activeTab === 'active'
              ? "Não há planos de treino ativos."
              : activeTab === 'archived'
              ? "Não há planos arquivados."
              : "Não há histórico de planos."}
          </p>
        ) : (
          paginatedPlans.map((plan) => {
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
                {activeTab === 'history' && !plan.archived && (
                  <div className="archive-row">
                    <button className="archive-btn" onClick={() => handleArchivePlan(plan._id)}>
                      Arquivar plano concluído
                    </button>
                  </div>
                )}

                <div className="week-schedule">
                  {plan.days && plan.days.length > 0 ? (
                    plan.days.map((dayData, index) => (
                      <div key={index} className={`day-card ${dayData.status || 'pending'}`}>
                        <div className="day-header">
                          <div className="day-title">
                            <h3>{dayData.day}</h3>
                          </div>
                          {activeTab === 'active' && (
                            <div className="status-actions">
                              <button
                                className={`status-btn complete ${dayData.status === 'completed' ? 'selected' : ''}`}
                                onClick={() => handleCompleteClick(plan._id, dayData._id || '', dayData.day, dayData.status)}
                                disabled={!!updating || (dayData.status && dayData.status !== 'pending')}
                              >
                                ✓
                              </button>
                              <button
                                className={`status-btn fail ${dayData.status === 'failed' ? 'selected' : ''}`}
                                onClick={() => handleFailClick(plan._id, dayData._id || '', dayData.status)}
                                disabled={!!updating || (dayData.status && dayData.status !== 'pending')}
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
                        {dayData.completionPhotoProof && (
                          <div className="photo-proof-tag">Prova fotográfica enviada</div>
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
      {filteredPlans.length > 0 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Seguinte
          </button>
        </div>
      )}
      {photoModalData && (
        <div className="photo-modal-backdrop">
          <div className="photo-modal">
            <h3>Concluir treino - {photoModalData.dayLabel}</h3>
            <p>Carrega uma foto como prova do treino deste dia.</p>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhotoFile(file);
                  setPhotoError("");
                }}
              />
            </div>
            {photoError && <div className="photo-error">{photoError}</div>}
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setPhotoModalData(null)} disabled={!!updating}>
                Cancelar
              </button>
              <button className="primary-btn" onClick={handlePhotoSubmit} disabled={!!updating}>
                Enviar e concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
