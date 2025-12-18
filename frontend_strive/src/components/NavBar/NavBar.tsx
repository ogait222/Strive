import { useState, useEffect, useRef} from "react";
import { useNavigate } from "react-router-dom";
import "../NavBar/NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; role: string; name?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [avatar, setAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navItems: { label: string; path: string }[] = user
    ? user.role === "client"
      ? [
          { label: "Treinos", path: "/workouts" },
          { label: "Notificações", path: "/notifications" },
          { label: "Chat", path: "/chat" },
          { label: "Log Treinos", path: "/*" },
        ]
      : user.role === "trainer"
      ? [
          { label: "Meus Clientes", path: "/my-students" },
          { label: "Notificações", path: "/notifications" },
          { label: "Chat", path: "/chat" },
        ]
      : []
    : [];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedTheme = localStorage.getItem("theme");
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

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = (storedTheme as "light" | "dark") || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

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

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

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
        <img src="/src/assets/strive-logozito.png" className="logo-strive" alt="Logo" />
      </div>


      <div className="app-nav-buttons">
        {user ? (
          <div className="nav-buttons-container">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="main-btns"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="nav-links">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
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
