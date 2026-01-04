import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import type { KeyboardEvent } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./Dashboard.css";

interface Trainer {
  _id: string;
  name: string;
  username: string;
  email: string;
}

interface UserProfile {
  name: string;
  username: string;
  email?: string;
  role: string;
  trainerId?: Trainer | null;
  _id?: string;
  id?: string;
}

interface WorkoutDay {
  status?: "pending" | "completed" | "failed";
  calendarDate?: string;
  day?: string;
  completionPhotoProof?: string;
}

interface WorkoutPlan {
  title?: string;
  days: WorkoutDay[];
}

interface CalendarCell {
  label: string;
  workouts?: WorkoutDay[];
  dateKey?: string;
}

type Student = UserProfile;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [workoutStats, setWorkoutStats] = useState({
    week: { done: 0, total: 0, percent: 0 },
    month: { done: 0, total: 0, percent: 0 },
  });
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsError, setStudentsError] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<WorkoutPlan[]>([]);
  const [selectedStats, setSelectedStats] = useState({
    week: { done: 0, total: 0, percent: 0 },
    month: { done: 0, total: 0, percent: 0 },
  });
  const [selectedLoading, setSelectedLoading] = useState(false);

  const clientItems = [
    { title: "Treinos", description: "Veja e gerencie seus planos de treino", icon: "💪", path: "/workouts" },
    {
      title: "Notificações",
      description: "Verifique suas notificações",
      icon: (
        <div className="notification-badge-container">
          <span>🔔</span>
          {unreadCount > 0 && <div className="unread-badge">{unreadCount > 9 ? "9+" : unreadCount}</div>}
        </div>
      ),
      path: "/notifications",
    },
    {
      title: "Chat",
      description: "Fale com seu personal trainer",
      icon: (
        <div className="notification-badge-container">
          <span>💬</span>
          {unreadChatCount > 0 && <div className="unread-badge">{unreadChatCount > 9 ? "9+" : unreadChatCount}</div>}
        </div>
      ),
      path: "/chat",
    },
    { title: "Log de Treinos", description: "Registre seus treinos realizados", icon: "📝", path: "/workout-log" },
    { title: "Perfil", description: "Dados pessoais e foto de perfil", icon: "👤", path: "/profile" },
  ];

  const trainerItems = [
    { title: "Meus Alunos", description: "Gerencie seus alunos e planos de treino", icon: "👥", path: "/my-students" },
    {
      title: "Notificações",
      description: "Verifique suas notificações",
      icon: (
        <div className="notification-badge-container">
          <span>🔔</span>
          {unreadCount > 0 && <div className="unread-badge">{unreadCount > 9 ? "9+" : unreadCount}</div>}
        </div>
      ),
      path: "/notifications",
    },
    {
      title: "Chat",
      description: "Converse com seus alunos",
      icon: (
        <div className="notification-badge-container">
          <span>💬</span>
          {unreadChatCount > 0 && <div className="unread-badge">{unreadChatCount > 9 ? "9+" : unreadChatCount}</div>}
        </div>
      ),
      path: "/chat",
    },
    { title: "Perfil", description: "Dados pessoais e foto de perfil", icon: "👤", path: "/profile" },
  ];

  const dashboardItems = user?.role === "trainer" ? trainerItems : clientItems;

  const buildWorkoutStats = (plans: WorkoutPlan[]) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 29);

    let weekTotal = 0;
    let weekDone = 0;
    let monthTotal = 0;
    let monthDone = 0;

    plans.forEach((plan) => {
      plan.days?.forEach((day) => {
        if (!day.calendarDate) return;
        const dayDate = new Date(day.calendarDate);
        if (isNaN(dayDate.getTime())) return;

        const isFinished = day.status && day.status !== "pending";
        const isCompletedWithProof = day.status === "completed" && day.completionPhotoProof;

        if (dayDate >= weekStart && dayDate <= now && isFinished) {
          weekTotal += 1;
          if (isCompletedWithProof) weekDone += 1;
        }

        if (dayDate >= monthStart && dayDate <= now && isFinished) {
          monthTotal += 1;
          if (isCompletedWithProof) monthDone += 1;
        }
      });
    });

    const weekPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
    const monthPercent = monthTotal ? Math.round((monthDone / monthTotal) * 100) : 0;

    return {
      week: { done: weekDone, total: weekTotal, percent: weekPercent },
      month: { done: monthDone, total: monthTotal, percent: monthPercent },
    };
  };

  const buildCalendar = (plans: WorkoutPlan[]) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      cells.push({ label: "" });
    }

    const map: Record<string, WorkoutDay[]> = {};
    plans.forEach((plan) => {
      plan.days?.forEach((d) => {
        if (!d.calendarDate) return;
        const key = d.calendarDate.split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(d);
      });
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ label: String(day), workouts: map[key], dateKey: key });
    }

    return {
      monthLabel: today.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      cells,
    };
  };

  const formatCalendarLabel = (dateKey?: string) => {
    if (!dateKey) return "";
    const date = new Date(`${dateKey}T00:00:00`);
    if (isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });
  };

  const handleCalendarDayClick = (cell: CalendarCell) => {
    if (!cell.dateKey || !cell.workouts?.length) return;
    navigate(`/workouts?date=${cell.dateKey}`);
  };

  const handleCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>, cell: CalendarCell) => {
    if (!cell.dateKey || !cell.workouts?.length) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCalendarDayClick(cell);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token) return;

        let userId = "";
        try {
          if (userStr) {
            const u = JSON.parse(userStr);
            userId = u.id || u._id;
          }
        } catch (e) {
          console.error("Error parsing user from localstorage", e);
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const profileRes = await axios.get("http://localhost:3500/users/me", config);
        const currentUser = profileRes.data;
        setUser(currentUser);
        const currentUserId = currentUser._id || currentUser.id;

        const [notificationsRes, chatsRes] = await Promise.all([
          axios.get("http://localhost:3500/notifications", config),
          axios.get(`http://localhost:3500/chats/user/${currentUserId}`, config),
        ]);

        const notifCount = notificationsRes.data.filter((n: any) => !n.read).length;
        setUnreadCount(notifCount);

        const chats = chatsRes.data;
        const chatCount = chats.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
        setUnreadChatCount(chatCount);

        if (currentUser.role === "client") {
          const workoutsRes = await axios.get(
            `http://localhost:3500/workouts/client/${currentUserId}`,
            config
          );
          setWorkoutPlans(workoutsRes.data);
          setWorkoutStats(buildWorkoutStats(workoutsRes.data));
        }

        if (currentUser.role === "trainer") {
          try {
            setStudentsLoading(true);
            const studentsRes = await axios.get("http://localhost:3500/users/students", config);
            setStudents(studentsRes.data);
          } catch (err: any) {
            setStudentsError(err.response?.data?.message || "Erro ao carregar alunos.");
          } finally {
            setStudentsLoading(false);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const calendarData = useMemo(() => buildCalendar(workoutPlans), [workoutPlans]);
  const selectedCalendar = useMemo(() => buildCalendar(selectedPlans), [selectedPlans]);

  const statusColor = (status?: string) => {
    if (status === "completed") return "#22c55e";
    if (status === "failed") return "#ef4444";
    return "#f59e0b";
  };

  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));

  const handleSelectStudent = async (student: Student) => {
    try {
      setSelectedStudent(student);
      setSelectedLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `http://localhost:3500/workouts/client/${student._id || student.id}`,
        config
      );
      setSelectedPlans(res.data);
      setSelectedStats(buildWorkoutStats(res.data));
    } catch (err) {
      console.error("Erro ao carregar plano do aluno", err);
    } finally {
      setSelectedLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Bem-vindo ao seu painel de controle, {user?.name?.split(" ")[0] || ""}!</p>

        {user?.role !== "trainer" && (
          <div className="trainer-section">
            <h2>O meu Treinador</h2>
            {loading ? (
              <div className="trainer-loading">Carregando...</div>
            ) : user?.trainerId ? (
              <div className="my-trainer-card">
                <div className="trainer-info">
                  <div className="trainer-avatar-small">
                    {user.trainerId.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{user.trainerId.name}</h3>
                    <p>@{user.trainerId.username}</p>
                  </div>
                </div>
                <button className="change-trainer-btn" onClick={() => navigate("/change-trainer/request")}>
                  Mudar
                </button>
              </div>
            ) : (
              <div className="no-trainer-card">
                <p>Ainda não tens um treinador atribuído.</p>
                <button className="select-trainer-btn" onClick={() => navigate("/trainers")}>
                  Escolher Treinador
                </button>
              </div>
            )}
          </div>
        )}
        
        {user?.role === "client" && (
          <>
            <div className="workout-stats">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-eyebrow">Semana</span>
                  <span className="stat-meta">
                    {workoutStats.week.done}/{workoutStats.week.total} concluídos
                  </span>
                </div>
                <div className="stat-body">
                  <div
                    className="progress-circle"
                    style={{
                      background: `conic-gradient(var(--primary-color) ${workoutStats.week.percent * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                    }}
                  >
                    <div className="progress-inner">
                      <span>{workoutStats.week.percent}%</span>
                    </div>
                  </div>
                  <div className="stat-labels">
                    <strong>Ratio semanal</strong>
                    <p>Concluídos vs. agendados nos últimos 7 dias.</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-eyebrow">Mês</span>
                  <span className="stat-meta">
                    {workoutStats.month.done}/{workoutStats.month.total} concluídos
                  </span>
                </div>
                <div className="stat-body">
                  <div
                    className="progress-circle"
                    style={{
                      background: `conic-gradient(#10b981 ${workoutStats.month.percent * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                    }}
                  >
                    <div className="progress-inner">
                      <span>{workoutStats.month.percent}%</span>
                    </div>
                  </div>
                  <div className="stat-labels">
                    <strong>Ratio mensal</strong>
                    <p>Concluídos vs. agendados nos últimos 30 dias.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="calendar-section">
              <div className="calendar-header">
                <div>
                  <p className="eyebrow">Agenda de Treinos</p>
                  <h2>{calendarData.monthLabel}</h2>
                </div>
                <div className="legend">
                  <span>
                    <span className="dot completed"></span>Concluído
                  </span>
                  <span>
                    <span className="dot pending"></span>Pendente
                  </span>
                  <span>
                    <span className="dot failed"></span>Falhado
                  </span>
                </div>
              </div>
              <div className="calendar-grid">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                  <div key={d} className="calendar-day header">
                    {d}
                  </div>
                ))}
                {calendarData.cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`calendar-day ${cell.workouts?.length ? "has-workout clickable" : ""}`}
                    role={cell.workouts?.length ? "button" : undefined}
                    tabIndex={cell.workouts?.length ? 0 : -1}
                    aria-label={cell.workouts?.length ? `Treinos em ${formatCalendarLabel(cell.dateKey)}` : undefined}
                    onClick={cell.workouts?.length ? () => handleCalendarDayClick(cell) : undefined}
                    onKeyDown={cell.workouts?.length ? (event) => handleCalendarKeyDown(event, cell) : undefined}
                  >
                    <span className="day-number">{cell.label}</span>
                    <div className="day-tags">
                      {cell.workouts?.map((w, i) => (
                        <span
                          key={i}
                          className="tag"
                          style={{ background: statusColor(w.status) }}
                          title={`${w.day || "Treino"} - ${w.status || "pendente"}`}
                        >
                          {(w.day || "").split(" ")[0] || "Treino"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {user?.role === "trainer" && (
          <div className="students-section">
            <div className="students-header">
              <div>
                <p className="eyebrow">Clientes</p>
                <h2>Gestão rápida</h2>
              </div>
            </div>
            {studentsLoading ? (
              <div className="calendar-loading">A carregar alunos...</div>
            ) : studentsError ? (
              <div className="error-message">{studentsError}</div>
            ) : (
              <>
                <div className="students-grid">
                  {paginatedStudents.map((s) => (
                    <div key={s._id} className="student-card">
                      <div className="student-card-info">
                        <div className="student-card-avatar">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} />
                          ) : (
                            <span>{(s.name?.[0] || s.username?.[0] || "U").toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h4>{s.name}</h4>
                          <p className="muted">@{s.username}</p>
                          <p className="muted">{s.email}</p>
                        </div>
                      </div>
                      <button className="chip-btn" onClick={() => handleSelectStudent(s)}>
                        Ver detalhes
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pagination">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                    Anterior
                  </button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Seguinte
                  </button>
                </div>
              </>
            )}

            {selectedStudent && (
              <div className="student-details">
                <div className="student-details-header">
                  <div>
                    <p className="eyebrow">Cliente</p>
                    <h2>
                      {selectedStudent.name} 
                    </h2>
                    <h3>
                      @{selectedStudent.username}
                    </h3>
                    <p className="muted">{selectedStudent.email}</p>
                  </div>
                  <button className="btn-close-panel" onClick={() => setSelectedStudent(null)}>
                    Fechar
                  </button>
                </div>

                {selectedLoading ? (
                  <div className="calendar-loading">A carregar detalhes...</div>
                ) : (
                  <>
                    <div className="workout-stats">
                      <div className="stat-card">
                        <div className="stat-header">
                          <span className="stat-eyebrow">Semana</span>
                          <span className="stat-meta">
                            {selectedStats.week.done}/{selectedStats.week.total} concluídos
                          </span>
                        </div>
                        <div className="stat-body">
                          <div
                            className="progress-circle"
                            style={{
                              background: `conic-gradient(var(--primary-color) ${selectedStats.week.percent * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                            }}
                          >
                            <div className="progress-inner">
                              <span>{selectedStats.week.percent}%</span>
                            </div>
                          </div>
                          <div className="stat-labels">
                            <strong>Ratio semanal</strong>
                            <p>Concluídos vs. agendados nos últimos 7 dias.</p>
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-header">
                          <span className="stat-eyebrow">Mês</span>
                          <span className="stat-meta">
                            {selectedStats.month.done}/{selectedStats.month.total} concluídos
                          </span>
                        </div>
                        <div className="stat-body">
                          <div
                            className="progress-circle"
                            style={{
                              background: `conic-gradient(#10b981 ${selectedStats.month.percent * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                            }}
                          >
                            <div className="progress-inner">
                              <span>{selectedStats.month.percent}%</span>
                            </div>
                          </div>
                          <div className="stat-labels">
                            <strong>Ratio mensal</strong>
                            <p>Concluídos vs. agendados nos últimos 30 dias.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="calendar-section">
                      <div className="calendar-header">
                        <div>
                          <p className="eyebrow">Calendário do aluno</p>
                          <h2>{selectedCalendar.monthLabel}</h2>
                        </div>
                        <div className="legend">
                          <span>
                            <span className="dot completed"></span>Concluído
                          </span>
                          <span>
                            <span className="dot pending"></span>Pendente
                          </span>
                          <span>
                            <span className="dot failed"></span>Falhado
                          </span>
                        </div>
                      </div>
                      <div className="calendar-grid">
                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                          <div key={d} className="calendar-day header">
                            {d}
                          </div>
                        ))}
                        {selectedCalendar.cells.map((cell, idx) => (
                          <div key={idx} className={`calendar-day ${cell.workouts?.length ? "has-workout" : ""}`}>
                            <span className="day-number">{cell.label}</span>
                            <div className="day-tags">
                              {cell.workouts?.map((w, i) => (
                                <span
                                  key={i}
                                  className="tag"
                                  style={{ background: statusColor(w.status) }}
                                  title={`${w.day || "Treino"} - ${w.status || "pendente"}`}
                                >
                                  {(w.day || "").split(" ")[0] || "Treino"}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        
      </div>
    </div>
  );
}
