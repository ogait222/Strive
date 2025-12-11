import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./ChangeTrainerRequest.css";
import { useNavigate } from "react-router-dom";

interface Trainer {
    _id: string;
    name: string;
    username: string;
    email: string;
}

interface UserProfile {
    _id: string;
    trainerId?: {
        _id: string;
        name: string;
    } | null;
}

export default function ChangeTrainerRequest() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [reason, setReason] = useState("");
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch current user and all trainers in parallel
                const [userRes, trainersRes] = await Promise.all([
                    axios.get("http://localhost:3500/users/me", config),
                    axios.get("http://localhost:3500/users/trainers", config)
                ]);

                setCurrentUser(userRes.data);
                setTrainers(trainersRes.data);
            } catch (err: any) {
                setError("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleRequestClick = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setShowModal(true);
    };

    const submitRequest = async () => {
        if (!selectedTrainer || !currentUser) return;

        try {
            const token = localStorage.getItem("token");

            // Assuming currentUser.trainerId is populated as an object based on userController
            // We need the ID string for the request
            const currentTrainerId = currentUser.trainerId?._id;

            if (!currentTrainerId) {
                alert("Você não tem um treinador atual para trocar.");
                return;
            }

            await axios.post(
                "http://localhost:3500/change-trainer/request",
                {
                    client: currentUser._id,
                    currentTrainer: currentTrainerId,
                    requestedTrainer: selectedTrainer._id,
                    reason: reason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Solicitação enviada com sucesso! Aguarde aprovação do administrador.");
            setShowModal(false);
            navigate("/dashboard");
        } catch (err: any) {
            alert("Erro ao enviar solicitação: " + (err.response?.data?.message || "Erro desconhecido"));
        }
    };

    // Filter out the current trainer
    const availableTrainers = trainers.filter(
        t => t._id !== currentUser?.trainerId?._id
    );

    if (loading) {
        return (
            <div className="change-trainer-container">
                <NavBar />
                <div className="content">
                    <div className="loading">Carregando treinadores...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="change-trainer-container">
            <NavBar />
            <div className="content">
                <h1>Solicitar Mudança de Treinador</h1>
                {error && <div className="error-message">{error}</div>}

                <div className="trainers-grid">
                    {availableTrainers.map((trainer) => (
                        <div key={trainer._id} className="trainer-card">
                            <div className="trainer-avatar">
                                {trainer.name.charAt(0).toUpperCase()}
                            </div>
                            <h2>{trainer.name}</h2>
                            <p>@{trainer.username}</p>
                            <button
                                className="request-btn"
                                onClick={() => handleRequestClick(trainer)}
                            >
                                Solicitar Mudança
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && selectedTrainer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Mudar para {selectedTrainer.name}</h2>
                        <p>Por que deseja mudar de treinador?</p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Digite o motivo aqui..."
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm" onClick={submitRequest}>
                                Enviar Solicitação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
