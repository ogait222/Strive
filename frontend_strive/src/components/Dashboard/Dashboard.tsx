import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  trainerId?: Trainer | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Define dashboard items (excluding "Change Trainer" as it will be in the new section)
  const dashboardItems = [
    {
      title: "Treinos",
      description: "Veja e gerencie seus planos de treino",
      icon: "💪",
      path: "/workouts"
    },
    {
      title: "Notificações",
      description: "Verifique suas notificações",
      icon: "🔔",
      path: "/notifications"
    },
    {
      title: "Chat",
      description: "Fale com seu personal trainer",
      icon: "💬",
      path: "/chat"
    },
    {
      title: "Log de Treinos",
      description: "Registre seus treinos realizados",
      icon: "📝",
      path: "/workout-log"
    }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:3500/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Bem-vindo ao seu painel de controle, {user?.name.split(' ')[0]}!</p>

        {/* My Trainer Section */}
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

        <div className="dashboard-grid">
          {dashboardItems.map((item, index) => (
            <div key={index} className="dashboard-card" onClick={() => navigate(item.path)}>
              <div className="card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
