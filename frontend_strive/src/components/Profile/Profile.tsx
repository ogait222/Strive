import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
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
          "http://localhost:3500/users/me/avatar",
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

  return (
    <div className="profile-container">
      <NavBar />
      <div className="profile-content">
        <h1>Perfil</h1>
        <p>Vê e atualiza as tuas informações pessoais.</p>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-card">
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
        </div>
      </div>
    </div>
  );
}
