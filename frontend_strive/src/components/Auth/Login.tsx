import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "./Login.css";

interface LoginProps {
  onSwitchToRegister: () => void;
}

export default function Login({ onSwitchToRegister }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrProcessing, setQrProcessing] = useState(false);
  const qrScannerRef = useRef<any>(null);
  const navigate = useNavigate();
  const qrRegionId = "qr-reader";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const stopQrScanner = async () => {
    const scanner = qrScannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // Ignore camera stop errors.
    } finally {
      qrScannerRef.current = null;
    }
  };

  const handleQrDecoded = async (decodedText: string) => {
    if (qrProcessing) return;
    setQrProcessing(true);
    setQrError("");
    await stopQrScanner();

    try {
      const prefix = "strive-qr:";
      const token = decodedText.startsWith(prefix)
        ? decodedText.slice(prefix.length)
        : decodedText;

      const response = await axios.post(`${API_BASE_URL}/auth/qr/login`, { token });
      const { token: jwtToken, user } = response.data;
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setQrError(err.response?.data?.message || "Erro ao fazer login com QR.");
      setQrProcessing(false);
      if (showQrScanner) {
        void startQrScanner();
      }
    }
  };

  const startQrScanner = async () => {
    if (qrLoading || qrProcessing) return;
    setQrLoading(true);
    setQrError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(qrRegionId);
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void handleQrDecoded(decodedText);
        },
        (_) => {
          // parse error, ignore it.
        }
      );
    } catch (err: any) {
      const message =
        err?.name === "NotAllowedError"
          ? "Permissão da câmara negada."
          : err?.name === "NotFoundError"
            ? "Câmara não encontrada."
            : "Não foi possível iniciar a câmara.";
      setQrError(message);
      await stopQrScanner();
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (showQrScanner) {
      void startQrScanner();
    } else {
      void stopQrScanner();
      setQrError("");
    }

    return () => {
      void stopQrScanner();
    };
  }, [showQrScanner]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="close-btn" onClick={() => navigate("/home")}>×</button>
        <div className="auth-header">
          <h1>💪 Bem-vindo de volta!</h1>
          <p>Entra na tua conta Strive</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Nome de Utilizador</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              placeholder="teu_username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Palavra-passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ""))}
              placeholder="••••••••"
            />
          </div>

          <div className="auth-links">
            <button
              type="button"
              className="btn-link"
              onClick={() => navigate("/forgot-password")}
            >
              Esqueceste-te da password?
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "A entrar..." : "🔓 Entrar"}
          </button>
        </form>

        <div className="qr-login">
          <button
            type="button"
            className="btn-qr"
            onClick={() => setShowQrScanner((prev) => !prev)}
            disabled={qrLoading}
          >
            {showQrScanner ? "Fechar QR" : "Entrar com QR Code"}
          </button>
          {showQrScanner && (
            <div className="qr-panel">
              <div id={qrRegionId} className="qr-reader" />
              <p className="qr-hint">Aponta a câmara ao QR Code para entrar.</p>
              {qrProcessing && <p className="qr-hint">A validar QR...</p>}
              {qrError && <div className="error-message">{qrError}</div>}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <p>
            Não tens conta?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="btn-switch"
            >
              Regista-te aqui
            </button>
          </p>
        </div>


      </div>
    </div>
  );
}
