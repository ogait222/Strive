import { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode";
import NavBar from "../NavBar/NavBar";
import { API_BASE_URL } from "../../config";
import "./Profile.css";

interface UserData {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const roleLabels: Record<string, string> = {
    client: "Cliente",
    trainer: "Personal Trainer",
    admin: "Administrador",
  };
  const roleLabel = user?.role ? roleLabels[user.role] || user.role : "Cliente";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAvatar = localStorage.getItem("avatarUrl");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.avatarUrl) setAvatar(parsed.avatarUrl);
      } catch (e) {
        setError("Não foi possível carregar o perfil.");
      }
    }
    if (storedAvatar) setAvatar(storedAvatar);
  }, []);

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE_URL}/users/me/avatar`,
          { avatarUrl: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvatar(base64);
        localStorage.setItem("avatarUrl", base64);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const updated = { ...JSON.parse(storedUser), avatarUrl: base64 };
          localStorage.setItem("user", JSON.stringify(updated));
          setUser(updated);
        }
      } catch (err) {
        setError("Erro ao atualizar foto de perfil.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordLoading) return;

    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Preenche todos os campos da password.");
      setPasswordSuccess("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As passwords não coincidem.");
      setPasswordSuccess("");
      return;
    }

    setPasswordError("");
    setPasswordSuccess("");
    setPasswordLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setPasswordError("Não autenticado.");
        return;
      }
      await axios.put(
        `${API_BASE_URL}/users/me/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordSuccess("Password atualizada com sucesso!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Erro ao atualizar password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    if (qrLoading) return;
    setQrError("");
    setQrLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setQrError("Não autenticado.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/qr`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const payloadToken = response.data?.token;
      if (!payloadToken) {
        setQrError("Não foi possível gerar o QR.");
        return;
      }

      const qrPayload = `strive-qr:${payloadToken}`;
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 240,
        color: { dark: "#111111", light: "#ffffff" },
      });

      setQrDataUrl(dataUrl);
      setQrExpiresAt(response.data?.expiresAt || null);
    } catch (err: any) {
      setQrError(err.response?.data?.message || "Erro ao gerar QR.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `strive-qr-${user?.username || "login"}.png`;
    link.click();
  };

  const formatQrExpiry = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("pt-PT");
  };

  return (
    <div className="profile-container">
      <NavBar />
      <div className="profile-content">
        <div className="profile-header">
          <div>
            <h1>Perfil</h1>
            <p>Vê e atualiza as tuas informações pessoais.</p>
          </div>
          <div className="profile-badges">
            <span className={`role-chip ${user?.role || "client"}`}>{roleLabel}</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-card">
          <div className="profile-sidebar">
            <div className="avatar-section">
              <div className="avatar-circle">
                {avatar ? (
                  <img src={avatar} alt="Avatar" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              <label className="upload-btn">
                Mudar foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="profile-main">
            <div className="info-grid">
              <div className="info-item">
                <p className="label">Nome</p>
                <p className="value">{user?.name || "-"}</p>
              </div>
              <div className="info-item">
                <p className="label">Username</p>
                <p className="value">{user?.username || "-"}</p>
              </div>
              <div className="info-item">
                <p className="label">Email</p>
                <p className="value">{user?.email || "-"}</p>
              </div>
            </div>

            <div className="qr-card">
              <div className="qr-header">
                <div>
                  <h3>Login com QR Code</h3>
                  <p>Gera um QR válido por 7 dias para entrares rapidamente.</p>
                </div>
                <button
                  type="button"
                  className="btn-generate-qr"
                  onClick={handleGenerateQr}
                  disabled={qrLoading}
                >
                  {qrLoading ? "A gerar..." : "Gerar QR"}
                </button>
              </div>
              <div className="qr-body">
                {qrDataUrl ? (
                  <div className="qr-preview">
                    <img src={qrDataUrl} alt="QR Code de login" />
                    <div className="qr-meta">
                      <span>Válido até {formatQrExpiry(qrExpiresAt)}</span>
                      <button type="button" className="btn-download-qr" onClick={handleDownloadQr}>
                        Descarregar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="qr-empty">
                    <p>Ainda não tens um QR gerado.</p>
                    <span>Usa o botão para criar um novo.</span>
                  </div>
                )}
              </div>
              {qrError && <div className="error-message">{qrError}</div>}
            </div>

            <div className="password-card">
              <div>
                <h3>Alterar password</h3>
                <p>Atualiza a tua password de acesso.</p>
              </div>
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => {
                  setShowPasswordForm((prev) => !prev);
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
              >
                {showPasswordForm ? "Cancelar" : "Alterar password"}
              </button>

              {showPasswordForm && (
                <form className="password-form" onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Password atual</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">Nova password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Mín. 6 caracteres"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Repete a nova password"
                    />
                  </div>

                  {passwordError && <div className="error-message">{passwordError}</div>}
                  {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                  <button type="submit" className="btn-save-password" disabled={passwordLoading}>
                    {passwordLoading ? "A atualizar..." : "Atualizar password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
