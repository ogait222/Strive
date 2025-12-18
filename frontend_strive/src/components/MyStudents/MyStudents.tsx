import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./MyStudents.css";

interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: string;
}

interface Exercise {
    name: string;
    sets: number;
    reps: number;
    videoUrl?: string;
    notes?: string;
}

interface WorkoutDay {
    day: string;
    calendarDate?: string;
    status?: 'pending' | 'completed' | 'failed';
    exercises: Exercise[];
    completionPhotoProof?: string;
}

interface WorkoutPlan {
    _id: string;
    title: string;
    description?: string;
    days: WorkoutDay[];
    active?: boolean;
    archived?: boolean;
    createdAt: string;
}

export default function MyStudents() {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [planTitle, setPlanTitle] = useState("");
    const [planDescription, setPlanDescription] = useState("");
    const [planDays, setPlanDays] = useState<WorkoutDay[]>([]);
    const [viewStudent, setViewStudent] = useState<User | null>(null);
    const [studentPlans, setStudentPlans] = useState<WorkoutPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansError, setPlansError] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");

            if (!token || !userStr) {
                setError("Não autenticado");
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            if (user.role !== "trainer") {
                setError("Acesso restrito a treinadores");
                setLoading(false);
                return;
            }

            const response = await axios.get("http://localhost:3500/users/students", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStudents(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao carregar alunos");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (student: User) => {
        setSelectedStudent(student);
        setPlanTitle("");
        setPlanDescription("");
        setPlanDays([{ day: "", calendarDate: "", exercises: [] }]);
        setShowModal(true);
    };

    const handleAddDay = () => {
        setPlanDays([...planDays, { day: "", calendarDate: "", exercises: [] }]);
    };

    const handleRemoveDay = (index: number) => {
        const newDays = [...planDays];
        newDays.splice(index, 1);
        setPlanDays(newDays);
    };

    const formatDayLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        const weekday = d.toLocaleDateString("pt-PT", { weekday: "long" });
        const dayMonth = d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
        return `${weekday} - ${dayMonth}`;
    };

    const todayLocalISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

    const handleCalendarChange = (index: number, value: string) => {
        if (!value) return;
        const duplicate = planDays.some((d, idx) => idx !== index && d.calendarDate === value);
        if (duplicate) {
            return;
        }

        const chosen = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen < today) {
            return;
        }

        const newDays = [...planDays];
        newDays[index].calendarDate = value;
        newDays[index].day = formatDayLabel(value);
        setPlanDays(newDays);
    };

    const handleAddExercise = (dayIndex: number) => {
        const newDays = [...planDays];
        if (newDays[dayIndex].exercises.length >= 10) {
            alert("Limite de 10 exercícios por dia atingido.");
            return;
        }
        newDays[dayIndex].exercises.push({
            name: "",
            sets: 3,
            reps: 10,
            notes: "",
            videoUrl: ""
        });
        setPlanDays(newDays);
    };

    const handleExerciseChange = (dayIndex: number, exerciseIndex: number, field: string, value: any) => {
        const newDays = [...planDays];
        const exercise = newDays[dayIndex].exercises[exerciseIndex];
        if (field === 'sets' || field === 'reps') {
            (exercise as any)[field] = parseInt(value) || 0;
        } else {
            (exercise as any)[field] = value;
        }
        setPlanDays(newDays);
    };

    const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
        const newDays = [...planDays];
        newDays[dayIndex].exercises.splice(exerciseIndex, 1);
        setPlanDays(newDays);
    };

    const calculateProgress = (days: WorkoutDay[]) => {
        if (!days || days.length === 0) return 0;
        const done = days.filter((d: any) => d.status && d.status !== "pending").length;
        return Math.round((done / days.length) * 100);
    };

    const handleViewStudentPlans = async (student: User) => {
        try {
            setPlansError("");
            setPlansLoading(true);
            setViewStudent(student);
            const token = localStorage.getItem("token");
            if (!token) {
                setPlansError("Não autenticado");
                return;
            }
            const response = await axios.get(
                `http://localhost:3500/workouts/client/${student._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStudentPlans(response.data);
        } catch (err: any) {
            setPlansError(err.response?.data?.message || "Erro ao carregar planos do aluno");
        } finally {
            setPlansLoading(false);
        }
    };

    const handleSubmitPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        const allHaveDate = planDays.every(d => d.calendarDate);
        if (!allHaveDate) {
            alert("Seleciona uma data para cada dia de treino.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const daysPayload = planDays.map((d) => ({
                ...d,
                day: d.day || (d.calendarDate ? formatDayLabel(d.calendarDate) : ""),
            }));

            const payload = {
                client: selectedStudent._id,
                trainer: user.id || user._id, // Handle potential id field name difference
                title: planTitle,
                description: planDescription,
                days: daysPayload
            };

            await axios.post("http://localhost:3500/workouts", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Plano de treino criado com sucesso!");
            setShowModal(false);
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao criar plano");
        }
    };

    if (loading) return <div className="loading">Carregando...</div>;

    return (
        <div className="my-students-container">
            <NavBar />
            <div className="my-students-content">
                <h1>Meus Clientes</h1>

                {error ? (
                    <div className="error-message">{error}</div>
                ) : students.length === 0 ? (
                    <p>Ainda não tens clientes associados.</p>
                ) : (
                    <div className="students-grid">
                    {students.map(student => (
                        <div key={student._id} className="student-card">
                            <div className="student-info">
                                <h3>{student.name}</h3>
                                <p>@{student.username}</p>
                                <p>{student.email}</p>
                            </div>
                            <div className="student-actions">
                                <button className="btn-create-plan" onClick={() => handleOpenModal(student)}>
                                    Criar Plano de Treino
                                </button>
                                <button className="btn-view-plans" onClick={() => handleViewStudentPlans(student)}>
                                    Ver treinos
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

                {viewStudent && (
                    <div className="student-plans-panel">
                        <div className="student-plans-header">
                            <div>
                                <p className="eyebrow">Aluno</p>
                                <h3>{viewStudent.name} @{viewStudent.username}</h3>
                                <p className="muted">{viewStudent.email}</p>
                            </div>
                            <button className="btn-close-panel" onClick={() => setViewStudent(null)}>Fechar</button>
                        </div>

                        {plansLoading ? (
                            <div className="plans-loading">A carregar planos...</div>
                        ) : plansError ? (
                            <div className="error-message">{plansError}</div>
                        ) : studentPlans.length === 0 ? (
                            <p className="muted">Sem planos para este aluno.</p>
                        ) : (
                            <div className="plans-grid">
                                <div className="plans-column">
                                    <h4>Em progresso</h4>
                                    {studentPlans.filter(p => p.active !== false).map(plan => (
                                        <div key={plan._id} className="plan-chip active">
                                            <div>
                                                <h5>{plan.title}</h5>
                                                {plan.description && <p className="muted">{plan.description}</p>}
                                                <p className="muted">Progresso: {calculateProgress(plan.days)}%</p>
                                            </div>
                                            <div className="plan-chip-actions">
                                                <button className="chip-btn" onClick={() => setSelectedPlan(plan)}>Ver detalhes</button>
                                                <span className="status-dot active"></span>
                                            </div>
                                        </div>
                                    ))}
                                    {studentPlans.filter(p => p.active !== false).length === 0 && (
                                        <p className="muted">Nenhum plano ativo.</p>
                                    )}
                                </div>
                                <div className="plans-column">
                                    <h4>Histórico</h4>
                                    {studentPlans.filter(p => p.active === false).map(plan => (
                                        <div key={plan._id} className="plan-chip archived">
                                            <div>
                                                <h5>{plan.title}</h5>
                                                {plan.description && <p className="muted">{plan.description}</p>}
                                                <p className="muted">Concluído em {new Date(plan.createdAt).toLocaleDateString("pt-PT")}</p>
                                            </div>
                                            <div className="plan-chip-actions">
                                                <button className="chip-btn" onClick={() => setSelectedPlan(plan)}>Ver detalhes</button>
                                                <span className="status-dot archived"></span>
                                            </div>
                                        </div>
                                    ))}
                                    {studentPlans.filter(p => p.active === false).length === 0 && (
                                        <p className="muted">Sem histórico.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showModal && selectedStudent && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Novo Plano para {selectedStudent.name}</h2>
                                <button className="close-modal-btn" onClick={() => setShowModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleSubmitPlan}>
                                <div className="form-group">
                                    <label>Título do Plano</label>
                                    <input
                                        type="text"
                                        required
                                        value={planTitle}
                                        onChange={(e) => setPlanTitle(e.target.value)}
                                        placeholder="Ex: Hipertrofia Iniciante"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea
                                        value={planDescription}
                                        onChange={(e) => setPlanDescription(e.target.value)}
                                        placeholder="Objetivos e observações gerais..."
                                    />
                                </div>

                                <div className="days-container">
                                    {planDays.map((day, dayIndex) => (
                                        <div key={dayIndex} className="day-item">
                                            <div className="day-header-inputs">
                                                <div className="day-label">
                                                    {day.day || "Seleciona uma data"}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn-remove-day"
                                                    onClick={() => handleRemoveDay(dayIndex)}
                                                >
                                                    Remover Dia
                                                </button>
                                            </div>
                                            <div className="date-picker-row">
                                                <input
                                                    type="date"
                                                    value={day.calendarDate || ""}
                                                    min={todayLocalISO}
                                                    onChange={(e) => handleCalendarChange(dayIndex, e.target.value)}
                                                />
                                            </div>

                                            <div className="exercises-list">
                                                {day.exercises.map((exercise, exIndex) => (
                                                    <div key={exIndex} className="exercise-item">
                                                        <div className="exercise-header-row">
                                                            <span className="exercise-chip">Exercício {exIndex + 1}</span>
                                                            <button
                                                                type="button"
                                                                className="btn-remove-exercise"
                                                                onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                        <div className="exercise-field">
                                                            <label>Nome do exercício</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ex.: Supino inclinado"
                                                                value={exercise.name}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'name', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="exercise-meta-grid">
                                                            <div className="exercise-field">
                                                                <label>Séries</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="3"
                                                                    value={exercise.sets}
                                                                    onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'sets', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="exercise-field">
                                                                <label>Reps</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="12"
                                                                    value={exercise.reps}
                                                                    onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'reps', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="exercise-field">
                                                            <label>URL do vídeo (opcional)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="https://..."
                                                                value={exercise.videoUrl}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'videoUrl', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="exercise-field">
                                                            <label>Notas de execução</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Dica rápida para execução"
                                                                value={exercise.notes}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'notes', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn-add-exercise"
                                                    onClick={() => handleAddExercise(dayIndex)}
                                                >
                                                    + Adicionar Exercício
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn-add-day" onClick={handleAddDay}>
                                        + Adicionar Dia
                                    </button>
                                </div>

                                <button type="submit" className="btn-submit-plan">
                                    Salvar Plano de Treino
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {selectedPlan && (
                    <div className="modal-overlay">
                        <div className="modal-content plan-details-modal">
                            <div className="modal-header">
                                <div>
                                    <p className="eyebrow">Plano</p>
                                    <h2>{selectedPlan.title}</h2>
                                    {selectedPlan.description && <p className="muted">{selectedPlan.description}</p>}
                                </div>
                                <button className="close-modal-btn" onClick={() => setSelectedPlan(null)}>×</button>
                            </div>

                            <div className="plan-days-grid">
                                {selectedPlan.days && selectedPlan.days.length > 0 ? (
                                    selectedPlan.days.map((day, idx) => (
                                        <div key={idx} className="day-detail-card">
                                            <div className="day-detail-header">
                                                <div>
                                                    <p className="eyebrow small">{day.calendarDate ? new Date(day.calendarDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", weekday: "long" }) : day.day}</p>
                                                    <h4>{day.day}</h4>
                                                </div>
                                                {day.status && (
                                                    <span className={`status-pill ${day.status}`}>
                                                        {day.status === "completed" ? "Concluído" : day.status === "failed" ? "Falhado" : "Pendente"}
                                                    </span>
                                                )}
                                            </div>
                                            {day.exercises && day.exercises.length > 0 ? (
                                                <ul className="detail-exercise-list">
                                                    {day.exercises.map((ex, exIdx) => (
                                                        <li key={exIdx}>
                                                            <strong>{ex.name}</strong>
                                                            <p>Séries: {ex.sets} • Reps: {ex.reps}</p>
                                                            {ex.notes && <p className="muted">{ex.notes}</p>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="muted">Sem exercícios.</p>
                                            )}
                                            {day.completionPhotoProof && (
                                                <div className="photo-proof-block">
                                                    <p className="eyebrow small">Photo Proof</p>
                                                    <img src={day.completionPhotoProof} alt="Prova fotográfica" className="photo-proof-img" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="muted">Plano sem dias registados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
