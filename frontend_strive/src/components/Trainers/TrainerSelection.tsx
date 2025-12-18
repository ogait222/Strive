import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./TrainerSelection.css";
import { useNavigate } from "react-router-dom";

interface Trainer {
    _id: string;
    name: string;
    username: string;
    email: string;
}

export default function TrainerSelection() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [filtered, setFiltered] = useState<Trainer[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reason, setReason] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await axios.get("http://localhost:3500/users/trainers", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setTrainers(response.data);
                setFiltered(response.data);
            } catch (err: any) {
                setError("Erro ao carregar treinadores.");
            } finally {
                setLoading(false);
            }
        };

        fetchTrainers();
    }, [navigate]);

    const handleSelectTrainer = async (trainerId: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                "http://localhost:3500/users/select-trainer",
                { trainerId, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Treinador selecionado com sucesso!");
            navigate("/dashboard");
        } catch (err: any) {
            alert("Erro ao selecionar treinador: " + (err.response?.data?.message || "Erro desconhecido"));
        }
    };

    const handleSearch = (value: string) => {
        setQuery(value);
        const term = value.trim().toLowerCase();
        if (!term) {
            setFiltered(trainers);
            return;
        }
        setFiltered(
            trainers.filter((t) =>
                t.name.toLowerCase().includes(term) ||
                t.username.toLowerCase().includes(term) ||
                t.email.toLowerCase().includes(term)
            )
        );
    };

    if (loading) {
        return (
            <div className="trainer-selection-container">
                <NavBar />
                <div className="content">
                    <div className="loading">Carregando treinadores...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="trainer-selection-container">
            <NavBar />
            <div className="content">
                <h1>Escolha o seu Treinador</h1>
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, username ou email"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                {error && <div className="error-message">{error}</div>}

                <div className="trainers-grid">
                    {filtered.map((trainer) => (
                        <div key={trainer._id} className="trainer-card">
                            <div className="trainer-avatar">
                                {trainer.name.charAt(0).toUpperCase()}
                            </div>
                            <h2>{trainer.name}</h2>
                            <p>@{trainer.username}</p>
                            <button
                                className="select-btn"
                                onClick={() => handleSelectTrainer(trainer._id)}
                            >
                                Selecionar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
