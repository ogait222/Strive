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
    exercises: Exercise[];
}

const WEEKDAYS = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira"
];

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
        setPlanDays([{ day: WEEKDAYS[0], exercises: [] }]);
        setShowModal(true);
    };

    const handleAddDay = () => {
        const nextDayIndex = planDays.length % WEEKDAYS.length;
        setPlanDays([...planDays, { day: WEEKDAYS[nextDayIndex], exercises: [] }]);
    };

    const handleRemoveDay = (index: number) => {
        const newDays = [...planDays];
        newDays.splice(index, 1);
        setPlanDays(newDays);
    };

    const handleDayChange = (index: number, field: string, value: string) => {
        const newDays = [...planDays];
        (newDays[index] as any)[field] = value;
        setPlanDays(newDays);
    };

    const handleAddExercise = (dayIndex: number) => {
        const newDays = [...planDays];
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

    const handleSubmitPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const payload = {
                client: selectedStudent._id,
                trainer: user.id || user._id, // Handle potential id field name difference
                title: planTitle,
                description: planDescription,
                days: planDays
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
                <h1>Meus Alunos</h1>

                {error ? (
                    <div className="error-message">{error}</div>
                ) : students.length === 0 ? (
                    <p>Ainda não tens alunos associados.</p>
                ) : (
                    <div className="students-grid">
                        {students.map(student => (
                            <div key={student._id} className="student-card">
                                <div className="student-info">
                                    <h3>{student.name}</h3>
                                    <p>@{student.username}</p>
                                    <p>{student.email}</p>
                                </div>
                                <button
                                    className="btn-create-plan"
                                    onClick={() => handleOpenModal(student)}
                                >
                                    Criar Plano de Treino
                                </button>
                            </div>
                        ))}
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
                                                <select
                                                    value={day.day}
                                                    onChange={(e) => handleDayChange(dayIndex, 'day', e.target.value)}
                                                    className="day-name-input"
                                                >
                                                    {WEEKDAYS.map((weekday) => (
                                                        <option key={weekday} value={weekday}>
                                                            {weekday}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn-remove-day"
                                                    onClick={() => handleRemoveDay(dayIndex)}
                                                >
                                                    Remover Dia
                                                </button>
                                            </div>

                                            <div className="exercises-list">
                                                {day.exercises.map((exercise, exIndex) => (
                                                    <div key={exIndex} className="exercise-item">
                                                        <div className="exercise-grid">
                                                            <input
                                                                type="text"
                                                                placeholder="Nome do Exercício"
                                                                value={exercise.name}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'name', e.target.value)}
                                                                required
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Séries"
                                                                value={exercise.sets}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'sets', e.target.value)}
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Reps"
                                                                value={exercise.reps}
                                                                onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'reps', e.target.value)}
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="URL do vídeo (opcional)"
                                                            value={exercise.videoUrl}
                                                            onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'videoUrl', e.target.value)}
                                                            style={{ marginBottom: '0.5rem' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Notas de execução..."
                                                            value={exercise.notes}
                                                            onChange={(e) => handleExerciseChange(dayIndex, exIndex, 'notes', e.target.value)}
                                                        />
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
            </div>
        </div>
    );
}
