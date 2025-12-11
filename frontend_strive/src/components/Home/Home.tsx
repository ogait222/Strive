import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import NavBar from "../NavBar/NavBar";


export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/dashboard");
    }
  }, [navigate]);
  return (
    <div className="home-container">
      <NavBar />
      <section className="main-section">
        <div className="main-text">
          <h1>
            Treinos inteligentes. <br /> Acompanhamento real.
          </h1>
          <p>
            Transforme os seus treinos com orientação profissional, planos inteligentes e acompanhamento contínuo para alcançar resultados reais.
          </p>

          <div className="main-buttons">
            <button className="btn-comecar" >Começar</button>
            <button className="btn-sabermais">Saber mais</button>
          </div>
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
    </div >
  );
}
