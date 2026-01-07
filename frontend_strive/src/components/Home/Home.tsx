import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";


export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);
  return (
    <div className="home-container">
      <NavBar />
      <section className="hero-section">
        <div className="hero-overlay" aria-hidden="true"></div>
        <div className="hero-content">
          <h1>
            Diz olá ao Strive,
            <br /> #1 em acompanhemento fitness personalizado 
          </h1>
          <p>
            Uma plataforma clara, elegante e focada no teu progresso. Acompanha resultados 
            e comunica diretamente com o teu PT.
          </p>
          <button className="btn-signup" onClick={() => navigate("/register")}>
            Sign up
          </button>
        </div>
      </section>

      <section className="main-features">
        <div className="feature-card">
          <h3>📅 Calendário de Treinos</h3>
          <p>Organize e consulte o seu plano semanal de forma clara e simples.</p>
        </div>
        <div className="feature-card">
          <h3>💬 Fale com um Personal Trainer</h3>
          <p>Comunique diretamente com o seu personal trainer em tempo real.</p>
        </div>
        <div className="feature-card">
          <h3>📈 Dashboard Inteligente</h3>
          <p>Acompanhe o seu progresso com gráficos e estatísticas claras para analísar o seu próprio progresso.</p>
        </div>
      </section>
      <Footer />
    </div >
  );
}
