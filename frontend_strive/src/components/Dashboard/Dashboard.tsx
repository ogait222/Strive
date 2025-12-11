import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

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
    },
    {
      title: "Mudar Treinador",
      description: "Solicite mudança de personal trainer",
      icon: "🔄",
      path: "/change-trainer"
    }
  ];

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Bem-vindo ao seu painel de controle!</p>
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
