import { useNavigate } from "react-router-dom";
import "../NavBar/NavBar.css";




export default function NavBar() {

const navigate = useNavigate();

  return (
    <nav className="navbar">
        <div className="main-buttons">
            <img src="/src/assets/strive-logozito.png" className="logo-strive"/>
        </div>

        <div className="nav-links">
            <button 
            type="button"
            className="signup-button"
            onClick={() => navigate("/register")}> Sign Up </button>
            
            <button
            type="button" 
            className="login-button"
            onClick={() => navigate("/login")}> Login </button>

            
        </div>
    </nav>
  );
}   