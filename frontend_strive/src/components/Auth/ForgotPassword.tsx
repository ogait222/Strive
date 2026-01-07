import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Preenche o email");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: email.trim(),
      });
      setSuccess(response.data?.message || "Email de recuperação enviado.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="close-btn" onClick={() => navigate("/login")}>×</button>
        <div className="auth-header">
          <h1>Recuperar password</h1>
          <p>Enviaremos um link para redefinir a tua password.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teu@email.com"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "A enviar..." : "Enviar link"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Lembraste da password?{" "}
            <button type="button" onClick={() => navigate("/login")} className="btn-switch">
              Voltar ao login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
