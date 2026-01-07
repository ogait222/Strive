import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Login.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Token inválido.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Preenche todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("As passwords não coincidem");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(`http://localhost:3500/auth/reset-password/${token}`, {
        newPassword: password,
      });
      setSuccess(response.data?.message || "Password atualizada com sucesso.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="close-btn" onClick={() => navigate("/login")}>×</button>
        <div className="auth-header">
          <h1>Nova password</h1>
          <p>Define uma nova password para a tua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Nova password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repete a password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "A atualizar..." : "Atualizar password"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tens nova password?{" "}
            <button type="button" onClick={() => navigate("/login")} className="btn-switch">
              Ir para o login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
