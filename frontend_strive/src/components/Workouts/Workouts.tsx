import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  completionPhotoProof?: string; 
  failureReason?: string;
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

const normalizeDateKey = (value?: string) => {
  if (!value) return "";
  return value.split("T")[0];
};

export default function Workouts() {
  const location = useLocation();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [photoModalData, setPhotoModalData] = useState<{ planId: string; dayId: string; dayLabel: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [failModalData, setFailModalData] = useState<{ planId: string; dayId: string; dayLabel: string } | null>(null);
  const [failReason, setFailReason] = useState("");
  const [failError, setFailError] = useState("");
  const [calendarSyncApplied, setCalendarSyncApplied] = useState(false);
  const selectedDayRef = useRef<HTMLDivElement | null>(null);

  const selectedDateKey = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("date") || "";
    return normalizeDateKey(raw);
  }, [location.search]);

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

  useEffect(() => {
    selectedDayRef.current = null;
    setCalendarSyncApplied(false);
  }, [selectedDateKey]);

  const handleStatusUpdate = async (
    planId: string,
    dayId: string,
    status: string,
    completionPhotoProof?: string,
    failureReason?: string
  ) => {
    try {
      setUpdating(dayId);
      const token = localStorage.getItem("token");

      const payload: { status: string; completionPhotoProof?: string; failureReason?: string } = { status };
      if (completionPhotoProof) {
        payload.completionPhotoProof = completionPhotoProof;
      }
      if (failureReason) {
        payload.failureReason = failureReason;
      }

      await axios.patch(
        `http://localhost:3500/workouts/${planId}/day/${dayId}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh plans to update UI and move to history if needed
      await fetchWorkoutPlans();
      return true;
    } catch (err) {
      console.error("Erro ao atualizar status", err);
      return false;
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
    setFailModalData(null);
    setPhotoModalData({ planId, dayId, dayLabel });
    setPhotoFile(null);
    setPhotoError("");
  };

  const handleFailClick = (planId: string, dayId: string, dayLabel: string, status?: WorkoutDay["status"]) => {
    if (status && status !== "pending") return;
    setPhotoModalData(null);
    setFailModalData({ planId, dayId, dayLabel });
    setFailReason("");
    setFailError("");
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
      const success = await handleStatusUpdate(photoModalData.planId, photoModalData.dayId, "completed", photoString);
      if (success) {
        setPhotoModalData(null);
        setPhotoFile(null);
      } else {
        setPhotoError("Erro ao enviar a foto. Tenta novamente.");
      }
    } catch (err) {
      setPhotoError("Erro ao enviar a foto. Tenta novamente.");
    }
  };

  const handleFailSubmit = async () => {
    if (!failModalData) return;
    const trimmedReason = failReason.trim();
    if (!trimmedReason) {
      setFailError("Indica o motivo para concluir a falha.");
      return;
    }

    const success = await handleStatusUpdate(failModalData.planId, failModalData.dayId, "failed", undefined, trimmedReason);
    if (success) {
      setFailModalData(null);
      setFailReason("");
      setFailError("");
    } else {
      setFailError("Erro ao registar a falha. Tenta novamente.");
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

  const plansByTab = useMemo(() => ({
    active: workoutPlans.filter(plan => plan.active !== false && !plan.archived),
    history: workoutPlans.filter(plan => plan.active === false && !plan.archived),
    archived: workoutPlans.filter(plan => plan.archived === true),
  }), [workoutPlans]);

  const filteredPlans = plansByTab[activeTab];

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / plansPerPage));
  const paginatedPlans = filteredPlans.slice((page - 1) * plansPerPage, page * plansPerPage);

  useEffect(() => {
    if (!selectedDateKey || calendarSyncApplied || workoutPlans.length === 0) return;

    const planMatch = workoutPlans.find(plan =>
      plan.days?.some(day => normalizeDateKey(day.calendarDate) === selectedDateKey)
    );

    if (planMatch) {
      const targetTab: 'active' | 'history' | 'archived' =
        planMatch.archived === true ? 'archived' : planMatch.active === false ? 'history' : 'active';
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      const plansInTab = plansByTab[targetTab];
      const planIndex = plansInTab.findIndex(plan => plan._id === planMatch._id);
      if (planIndex >= 0) {
        const desiredPage = Math.floor(planIndex / plansPerPage) + 1;
        if (desiredPage !== page) {
          setPage(desiredPage);
        }
      }
    }

    setCalendarSyncApplied(true);
  }, [
    activeTab,
    calendarSyncApplied,
    page,
    plansByTab,
    plansPerPage,
    selectedDateKey,
    workoutPlans,
  ]);

  useEffect(() => {
    if (!selectedDateKey) return;
    const target = selectedDayRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTab, page, selectedDateKey]);

  let selectedAssigned = false;

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
            onClick={() => {
              setActiveTab('active');
              setPage(1);
            }}
          >
            Ativos
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              setPage(1);
            }}
          >
            Histórico
          </button>
          <button
            className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('archived');
              setPage(1);
            }}
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
                    plan.days.map((dayData, index) => {
                      const dayDateKey = normalizeDateKey(dayData.calendarDate);
                      const isSelected = !!selectedDateKey && dayDateKey === selectedDateKey;
                      const attachRef = isSelected && !selectedAssigned;
                      if (attachRef) {
                        selectedAssigned = true;
                      }

                      return (
                        <div
                          key={index}
                          ref={attachRef ? selectedDayRef : undefined}
                          className={`day-card ${dayData.status || 'pending'} ${isSelected ? 'selected' : ''}`}
                        >
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
                                  onClick={() => handleFailClick(plan._id, dayData._id || '', dayData.day, dayData.status)}
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
                      );
                    })
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
      {failModalData && (
        <div className="photo-modal-backdrop">
          <div className="photo-modal">
            <h3>Falhar treino - {failModalData.dayLabel}</h3>
            <p>Indica o motivo para concluir esta ação.</p>
            <textarea
              className="reason-textarea"
              value={failReason}
              onChange={(e) => {
                setFailReason(e.target.value);
                if (failError) setFailError("");
              }}
              placeholder="Escreve o motivo..."
              rows={4}
              disabled={!!updating}
            />
            {failError && <div className="photo-error">{failError}</div>}
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setFailModalData(null)} disabled={!!updating}>
                Cancelar
              </button>
              <button className="primary-btn" onClick={handleFailSubmit} disabled={!!updating}>
                Confirmar falta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
