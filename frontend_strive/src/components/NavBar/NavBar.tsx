import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../NavBar/NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <div className="user-menu" ref={dropdownRef}>
            <div className="user-toggle" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="username">Olá, {user.username}</span>
              <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                {user.role === 'trainer' && (
                  <button onClick={() => navigate('/my-students')} className="dropdown-item">
                    Meus Alunos
                  </button>
                )}
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