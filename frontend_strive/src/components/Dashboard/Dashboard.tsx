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
  role: string;
  trainerId?: Trainer | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Dashboard items for Clients
  const clientItems = [
    {
      title: "Treinos",
      description: "Veja e gerencie seus planos de treino",
      icon: "💪",
      path: "/workouts"
    },
    {
      title: "Notificações",
      description: "Verifique suas notificações",
      icon: (
        <div className="notification-badge-container">
          <span>🔔</span>
          {unreadCount > 0 && <div className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>}
        </div>
      ),
      path: "/notifications"
    },
    {
      title: "Chat",
      description: "Fale com seu personal trainer",
      icon: (
        <div className="notification-badge-container">
          <span>💬</span>
          {unreadChatCount > 0 && <div className="unread-badge">{unreadChatCount > 9 ? '9+' : unreadChatCount}</div>}
        </div>
      ),
      path: "/chat"
    },
    {
      title: "Log de Treinos",
      description: "Registre seus treinos realizados",
      icon: "📝",
      path: "/workout-log"
    }
  ];

  // Dashboard items for Trainers
  const trainerItems = [
    {
      title: "Meus Alunos",
      description: "Gerencie seus alunos e planos de treino",
      icon: "👥",
      path: "/my-students"
    },
    {
      title: "Notificações",
      description: "Verifique suas notificações",
      icon: (
        <div className="notification-badge-container">
          <span>🔔</span>
          {unreadCount > 0 && <div className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>}
        </div>
      ),
      path: "/notifications"
    },
    {
      title: "Chat",
      description: "Converse com seus alunos",
      icon: (
        <div className="notification-badge-container">
          <span>💬</span>
          {unreadChatCount > 0 && <div className="unread-badge">{unreadChatCount > 9 ? '9+' : unreadChatCount}</div>}
        </div>
      ),
      path: "/chat"
    }
  ];

  const dashboardItems = user?.role === 'trainer' ? trainerItems : clientItems;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token) return;

        // Need userId to fetch chats
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

        const promises = [
          axios.get("http://localhost:3500/users/me", config),
          axios.get("http://localhost:3500/notifications", config)
        ];

        // Only fetch chats if we have userId (though /users/me returns it too, better to wait? No, let's use what we have or do sequential)
        // Actually, let's rely on /users/me response if userId is missing? 
        // Safer to just wait for profile to get ID? 
        // Ideally we fetch profile first.

        const profileRes = await axios.get("http://localhost:3500/users/me", config);
        const currentUser = profileRes.data;
        setUser(currentUser);

        // Now fetch other stuff with confirmed ID
        const currentUserId = currentUser._id || currentUser.id;

        const [notificationsRes, chatsRes] = await Promise.all([
          axios.get("http://localhost:3500/notifications", config),
          axios.get(`http://localhost:3500/chats/user/${currentUserId}`, config)
        ]);

        // Count unread notifications
        const notifCount = notificationsRes.data.filter((n: any) => !n.read).length;
        setUnreadCount(notifCount);

        // Count unread chat messages
        const chats = chatsRes.data;
        const chatCount = chats.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
        setUnreadChatCount(chatCount);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
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

        {/* My Trainer Section - Only for Clients */}
        {user?.role !== 'trainer' && (
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
