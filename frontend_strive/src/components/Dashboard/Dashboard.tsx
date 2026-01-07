import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import NavBar from "../NavBar/NavBar";
import { API_BASE_URL } from "../../config";
import "./Dashboard.css";

interface Trainer {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface UserProfile {
  name: string;
  username: string;
  email?: string;
  role: string;
  trainerId?: Trainer | null;
  _id?: string;
  id?: string;
  avatarUrl?: string;
}

interface WorkoutDay {
  status?: "pending" | "completed" | "failed";
  calendarDate?: string | Date;
  day?: string;
  completionPhotoProof?: string;
}

interface WorkoutPlan {
  title?: string;
  days: WorkoutDay[];
}

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface CalendarCell {
  label: string;
  workouts?: WorkoutDay[];
  dateKey?: string;
  isToday?: boolean;
}

interface TodayWorkout {
  workoutDay: WorkoutDay;
  planTitle?: string;
}

type Student = UserProfile;

type WorkoutPeriodStats = {
  done: number;
  failed: number;
  total: number;
  percent: number;
  isFallback?: boolean;
};

type RatioChartProps = {
  done: number;
  total: number;
  percent: number;
  color: string;
  label: string;
};

const RatioChart = ({ done, total, percent, color, label }: RatioChartProps) => {
  const remaining = Math.max(total - done, 0);
  const hasData = total > 0;
  const data = hasData
    ? [
      { name: "Concluidos", value: done },
      { name: "Restantes", value: remaining },
    ]
    : [{ name: "Sem dados", value: 1 }];
  const colors = hasData ? [color, "var(--card-border)"] : ["var(--card-border)"];

  return (
    <div className="stat-chart" role="img" aria-label={`${label} ${percent}%`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="65%"
            outerRadius="90%"
            paddingAngle={hasData ? 2 : 0}
            cornerRadius={hasData ? 6 : 0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="stat-chart__label">{percent}%</div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const lastToastAtRef = useRef(0);


  const [workoutStats, setWorkoutStats] = useState({
    week: { done: 0, failed: 0, total: 0, percent: 0 },
    month: { done: 0, failed: 0, total: 0, percent: 0 },
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
    week: { done: 0, failed: 0, total: 0, percent: 0 },
    month: { done: 0, failed: 0, total: 0, percent: 0 },
  });
  const [selectedLoading, setSelectedLoading] = useState(false);
  const toastStorageKey = "trainerLastNotificationToastAt";

  const buildWorkoutStats = (plans: WorkoutPlan[]) => {
    const allDays = plans.flatMap((plan) => plan.days || []);
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    const weekDay = weekStart.getDay();
    const weekOffset = (weekDay + 6) % 7;
    weekStart.setDate(weekStart.getDate() - weekOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const normalizeDate = (value?: string | Date) => {
      if (!value) return null;
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      const raw = (value as string).split("T")[0];
      const parts = raw.split("-");
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        if (year && month && day) {
          return new Date(year, month - 1, day);
        }
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const computeStats = (days: WorkoutDay[]): WorkoutPeriodStats => {
      const total = days.length;
      const done = days.filter((day) => day.status === "completed").length;
      const failed = days.filter((day) => day.status === "failed").length;
      const percent = total ? Math.round((done / total) * 100) : 0;
      return { done, failed, total, percent };
    };

    const weekDays = allDays.filter((day) => {
      const dayDate = normalizeDate(day.calendarDate);
      return dayDate ? dayDate >= weekStart && dayDate <= weekEnd : false;
    });

    const monthDays = allDays.filter((day) => {
      const dayDate = normalizeDate(day.calendarDate);
      return dayDate ? dayDate >= monthStart && dayDate <= monthEnd : false;
    });

    const weekStats = computeStats(weekDays);
    const monthStats = computeStats(monthDays);

    return {
      week: weekStats,
      month: monthStats,
    };
  };

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const buildCalendar = (plans: WorkoutPlan[]) => {
    const today = new Date();
    const todayKey = getDateKey(today);
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
        const key = d.calendarDate instanceof Date ? d.calendarDate.toISOString().split("T")[0] : d.calendarDate.split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(d);
      });
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ label: String(day), workouts: map[key], dateKey: key, isToday: key === todayKey });
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

  const parseNotificationTime = (value?: string) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getLastToastAt = () => {
    if (lastToastAtRef.current) return lastToastAtRef.current;
    const stored = localStorage.getItem(toastStorageKey);
    const parsed = stored ? Date.parse(stored) : 0;
    lastToastAtRef.current = Number.isNaN(parsed) ? 0 : parsed;
    return lastToastAtRef.current;
  };

  const setLastToastAt = (value: number) => {
    lastToastAtRef.current = value;
    if (value > 0) {
      localStorage.setItem(toastStorageKey, new Date(value).toISOString());
    }
  };

  const maybeShowTrainerToast = (notifications: Notification[], role?: string) => {
    if (role !== "trainer") return;
    const latestUnread = notifications
      .filter((notification) => !notification.read)
      .reduce<Notification | null>((latest, current) => {
        if (!latest) return current;
        return parseNotificationTime(current.createdAt) > parseNotificationTime(latest.createdAt)
          ? current
          : latest;
      }, null);

    if (!latestUnread) return;
    const latestTime = parseNotificationTime(latestUnread.createdAt);
    if (!latestTime || latestTime <= getLastToastAt()) return;

    toast.info(`Nova notificação: ${latestUnread.message}`, {
      onClick: () => navigate("/notifications"),
      closeOnClick: true,
      autoClose: 7000,
    });
    setLastToastAt(latestTime);
  };

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const refreshNotifications = async (role?: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifications = response.data || [];
        maybeShowTrainerToast(notifications, role);
      } catch (error) {
        console.error("Erro ao atualizar notificações:", error);
      }
    };

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token) return;

        try {
          if (userStr) {
            // validating user string exists
            JSON.parse(userStr);
          }
        } catch (e) {
          console.error("Error parsing user from localstorage", e);
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const profileRes = await axios.get(`${API_BASE_URL}/users/me`, config);
        const currentUser = profileRes.data;
        setUser(currentUser);
        const currentUserId = currentUser._id || currentUser.id;







        if (currentUser.role === "client") {
          const workoutsRes = await axios.get(
            `${API_BASE_URL}/workouts/client/${currentUserId}`,
            config
          );
          setWorkoutPlans(workoutsRes.data);
          setWorkoutStats(buildWorkoutStats(workoutsRes.data));
        }

        if (currentUser.role === "trainer") {
          try {
            setStudentsLoading(true);
            const studentsRes = await axios.get(`${API_BASE_URL}/users/students`, config);
            setStudents(studentsRes.data);
          } catch (err: any) {
            setStudentsError(err.response?.data?.message || "Erro ao carregar alunos.");
          } finally {
            setStudentsLoading(false);
          }
        }

        if (currentUser.role === "trainer") {
          pollTimer = setInterval(() => {
            refreshNotifications(currentUser.role);
          }, 30000);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const calendarData = useMemo(() => buildCalendar(workoutPlans), [workoutPlans]);
  const selectedCalendar = useMemo(() => buildCalendar(selectedPlans), [selectedPlans]);
  const todayKey = getDateKey(new Date());
  const todayWorkouts = useMemo(() => {
    const workouts: TodayWorkout[] = [];
    workoutPlans.forEach((plan) => {
      plan.days?.forEach((day) => {
        if (!day.calendarDate) return;
        const key = day.calendarDate instanceof Date ? day.calendarDate.toISOString().split("T")[0] : day.calendarDate.split("T")[0];
        if (key === todayKey) {
          workouts.push({ workoutDay: day, planTitle: plan.title });
        }
      });
    });
    return workouts;
  }, [todayKey, workoutPlans]);

  const statusColor = (status?: string) => {
    if (status === "completed") return "#22c55e";
    if (status === "failed") return "#ef4444";
    return "#f59e0b";
  };

  const statusLabel = (status?: string) => {
    if (status === "completed") return "Concluído";
    if (status === "failed") return "Falhado";
    return "Pendente";
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
        `${API_BASE_URL}/workouts/client/${student._id || student.id}`,
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
                    {user.trainerId.avatarUrl ? (
                      <img src={user.trainerId.avatarUrl} alt={user.trainerId.name} />
                    ) : (
                      user.trainerId.name.charAt(0).toUpperCase()
                    )}
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
                    {workoutStats.week.done}/{workoutStats.week.total} concluídos · {workoutStats.week.failed} falhados
                  </span>
                </div>
                <div className="stat-body">
                  <RatioChart
                    done={workoutStats.week.done}
                    total={workoutStats.week.total}
                    percent={workoutStats.week.percent}
                    color="var(--primary-color)"
                    label="Ratio semanal"
                  />
                  <div className="stat-labels">
                    <strong>Ratio semanal</strong>
                    <p>Concluídos vs. agendados na semana atual.</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-eyebrow">Mês</span>
                  <span className="stat-meta">
                    {workoutStats.month.done}/{workoutStats.month.total} concluídos · {workoutStats.month.failed} falhados
                  </span>
                </div>
                <div className="stat-body">
                  <RatioChart
                    done={workoutStats.month.done}
                    total={workoutStats.month.total}
                    percent={workoutStats.month.percent}
                    color="#10b981"
                    label="Ratio mensal"
                  />
                  <div className="stat-labels">
                    <strong>Ratio mensal</strong>
                    <p>Concluídos vs. agendados no mês atual.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="today-workout">
              <div className="today-header">
                <div>
                  <p className="eyebrow">Treino de hoje</p>
                  <h2>{formatCalendarLabel(todayKey)}</h2>
                </div>
                {todayWorkouts.length > 0 && (
                  <button className="today-link" onClick={() => navigate(`/workouts?date=${todayKey}`)}>
                    Ver plano
                  </button>
                )}
              </div>
              {todayWorkouts.length === 0 ? (
                <div className="today-empty">
                  <p>Hoje não tens treino agendado.</p>
                </div>
              ) : (
                <div className="today-list">
                  {todayWorkouts.map((workout, idx) => (
                    <div key={idx} className="today-item">
                      <div>
                        <strong>{workout.planTitle || workout.workoutDay.day || "Treino"}</strong>
                        <p>{statusLabel(workout.workoutDay.status)}</p>
                      </div>
                      <span className="today-status" style={{ background: statusColor(workout.workoutDay.status) }}>
                        {statusLabel(workout.workoutDay.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                    className={`calendar-day ${cell.workouts?.length ? "has-workout clickable" : ""} ${cell.isToday && cell.label ? "is-today" : ""}`}
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
                            {selectedStats.week.done}/{selectedStats.week.total} concluídos · {selectedStats.week.failed} falhados
                          </span>
                        </div>
                        <div className="stat-body">
                          <RatioChart
                            done={selectedStats.week.done}
                            total={selectedStats.week.total}
                            percent={selectedStats.week.percent}
                            color="var(--primary-color)"
                            label="Ratio semanal"
                          />
                          <div className="stat-labels">
                            <strong>Ratio semanal</strong>
                            <p>Concluídos vs. agendados na semana atual.</p>
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-header">
                          <span className="stat-eyebrow">Mês</span>
                          <span className="stat-meta">
                            {selectedStats.month.done}/{selectedStats.month.total} concluídos · {selectedStats.month.failed} falhados
                          </span>
                        </div>
                        <div className="stat-body">
                          <RatioChart
                            done={selectedStats.month.done}
                            total={selectedStats.month.total}
                            percent={selectedStats.month.percent}
                            color="#10b981"
                            label="Ratio mensal"
                          />
                          <div className="stat-labels">
                            <strong>Ratio mensal</strong>
                            <p>Concluídos vs. agendados no mês atual (inclui futuros).</p>
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
