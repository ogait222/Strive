import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import "./Register.css";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [applyForTrainer, setApplyForTrainer] = useState(false);
  const [trainerFullName, setTrainerFullName] = useState("");
  const [trainerBirthDate, setTrainerBirthDate] = useState("");
  const [trainerCertificate, setTrainerCertificate] = useState<File | null>(null);
  const [trainerIdDocument, setTrainerIdDocument] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "username" || name === "email") {
      const sanitized = value.replace(/\s+/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
    } else if (name === "password" || name === "confirmPassword") {
      const sanitized = value.replace(/\s+/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Preencha todos os campos");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("E-mail inválido. Deve conter '@' e um domínio válido.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("A senha deve ter pelo menos 6 caracteres, incluindo letras maiúsculas, minúsculas e números.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe não coincidem");
      return;
    }

    if (applyForTrainer) {
      if (!trainerFullName || !trainerBirthDate || !trainerCertificate || !trainerIdDocument) {
        setError("Preenche todos os dados para a candidatura a PT.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "client",
      };

      if (applyForTrainer) {
        payload.applyForTrainer = true;
        payload.fullName = trainerFullName;
        payload.birthDate = trainerBirthDate;
        payload.certificateFile = await toBase64(trainerCertificate as File);
        payload.idDocumentFile = await toBase64(trainerIdDocument as File);
      }

      await axios.post(`${API_BASE_URL}/auth/register`, payload);

      setSuccess("Conta criada com sucesso! Redirecionando para login...");
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setApplyForTrainer(false);
      setTrainerFullName("");
      setTrainerBirthDate("");
      setTrainerCertificate(null);
      setTrainerIdDocument(null);

      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registar utilizador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <button className="close-btn" onClick={() => navigate("/home")}>×</button>
        <div className="auth-header">
          <h1>🏋️ Junta-te ao Strive!</h1>
          <p>Cria a tua conta e comença o teu treino</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="João Silva"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="joao_silva"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="teu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Palavrapasse</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <label> <small>A senha deve ter pelo menos 6 caracteres, incluindo letras maiúsculas, minúsculas e números.</small></label>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Palavra-passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="trainer-apply">
            <label className="trainer-toggle">
              <input
                type="checkbox"
                checked={applyForTrainer}
                onChange={(e) => {
                  setApplyForTrainer(e.target.checked);
                  if (!e.target.checked) {
                    setTrainerFullName("");
                    setTrainerBirthDate("");
                    setTrainerCertificate(null);
                    setTrainerIdDocument(null);
                  }
                }}
              />
              Quero candidatar-me a Personal Trainer
            </label>
            <p className="trainer-hint">
              Envia os teus dados para validação do administrador.
            </p>
          </div>

          {applyForTrainer && (
            <div className="trainer-fields">
              <div className="form-group">
                <label htmlFor="trainerFullName">Nome completo</label>
                <input
                  type="text"
                  id="trainerFullName"
                  value={trainerFullName}
                  onChange={(e) => setTrainerFullName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="form-group">
                <label htmlFor="trainerBirthDate">Data de nascimento</label>
                <input
                  type="date"
                  id="trainerBirthDate"
                  value={trainerBirthDate}
                  onChange={(e) => setTrainerBirthDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="trainerCertificate">Certificado Profissional</label>
                <input
                  type="file"
                  id="trainerCertificate"
                  name="trainerCertificate"
                  accept="image/*,application/pdf"
                  onChange={(e) => setTrainerCertificate(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="trainerIdDocument">Documento de identificação</label>
                <input
                  type="file"
                  id="trainerIdDocument"
                  name="trainerIdDocument"
                  accept="image/*,application/pdf"
                  onChange={(e) => setTrainerIdDocument(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "A criar conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tens conta?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="btn-switch"
            >
              Entra aqui
            </button>
          </p>
        </div>


      </div>
    </div>
  );
}
