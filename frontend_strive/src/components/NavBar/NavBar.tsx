import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../NavBar/NavBar.css";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../config";
import { useChatNotifications } from "../../context/ChatNotificationsContext";

import logo from "../../assets/strive-logozito.png";

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; role: string; name?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { unreadChatCount } = useChatNotifications();
  const navItems: { label: string; path: string }[] = user
    ? user.role === "client"
      ? [
        { label: "Treinos", path: "/workouts" },
        { label: "Notificações", path: "/notifications" },
        { label: "Chat", path: "/chat" },
      ]
      : user.role === "trainer"
        ? [
          { label: "Meus Clientes", path: "/my-students" },
          { label: "Notificações", path: "/notifications" },
          { label: "Chat", path: "/chat" },
        ]
        : user.role === "admin"
          ? [
            { label: "Dashboard", path: "/admin-dashboard" },
            { label: "Chat", path: "/chat" },
          ]
          : []
    : [];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedAvatar = localStorage.getItem("avatarUrl");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    if (storedAvatar) {
      setAvatar(storedAvatar);
    } else {
      try {
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (parsedUser?.avatarUrl) setAvatar(parsedUser.avatarUrl);
      } catch (e) {
        console.error("Erro a ler avatar do user", e);
      }
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        if (!user) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const unread = response.data.filter((item: any) => !item.read).length;
        setUnreadNotifications(unread);
      } catch (error) {
        console.error("Erro ao carregar notificações", error);
      }
    };

    fetchUnreadNotifications();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("avatarUrl");
    setUser(null);
    navigate("/");
  };

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <nav className="navbar">
      <div
        className="main-buttons"
        onClick={() => {
          if (user) {
            if (user.role === 'admin') {
              navigate("/admin-dashboard");
            } else {
              navigate("/dashboard");
            }
          } else {
            navigate("/");
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <img src={logo} className="logo-strive" alt="Logo" />
      </div>


      <div className="app-nav-buttons">
        {user ? (
          <div className="nav-buttons-container">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`main-btns ${item.path === "/notifications" ? "notification-btn" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
                {item.path === "/notifications" && unreadNotifications > 0 && (
                  <span className="nav-badge" aria-label="Novas notificações">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
                {item.path === "/chat" && unreadChatCount > 0 && (
                  <span className="nav-badge" aria-label="Mensagens não lidas">
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="nav-links">
        {user ? (
          <div className="user-menu" ref={dropdownRef}>
            <div className="user-toggle" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="nav-avatar">
                {avatar ? (
                  <img src={avatar} alt="Avatar" />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <span className="username">Olá, {user.name}</span>
              <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={() => navigate('/profile')} className="dropdown-item">
                  Perfil
                </button>
                <button
                  onClick={toggleTheme}
                  className="dropdown-item theme-item"
                  aria-pressed={theme === "dark"}
                >
                  <span>{theme === "dark" ? "Desativar modo escuro" : "Ativar modo escuro"}</span>
                  <span className="theme-indicator">{theme === "dark" ? "🌙" : "☀️"}</span>
                </button>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="signup-button"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>

            <button
              type="button"
              className="login-button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
