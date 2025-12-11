import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../NavBar/NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div
        className="main-buttons"
        onClick={() => user ? navigate("/dashboard") : navigate("/")}
        style={{ cursor: 'pointer' }}
      >
        <img src="/src/assets/strive-logozito.png" className="logo-strive" alt="Logo" />
      </div>

      <div className="nav-links">
        {user ? (
          <div className="user-menu" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
            <div className="user-toggle">
              <span className="username">Olá, {user.username}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
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