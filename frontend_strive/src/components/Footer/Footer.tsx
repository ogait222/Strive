import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/src/assets/strive-logozito.png" className="footer-logo-img" alt="Strive" />
            <div>
              <h3>Strive</h3>
              <p>Fitness em modo inteligente.</p>
            </div>
          </div>
          <p className="footer-tagline">
            Planos focados, comunicação fluida e progresso visível em cada treino.
          </p>
          <div className="footer-links">
            <Link to="/register">Criar conta</Link>
            <Link to="/login">Entrar</Link>
          </div>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h4>Suporte</h4>
            <a href="mailto:suporte@strive.app">suporte@strive.app</a>
            <a href="tel:+351000000000">+351 000 000 000</a>
            <span className="footer-badge">Resposta em 24h</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} Strive. Todos os direitos reservados.</p>
        <div className="footer-social">
          <span>Instagram</span>
          <span>LinkedIn</span>
          <span>YouTube</span>
        </div>
      </div>
    </footer>
  );
}
