import { BrowserRouter , Routes, Route} from 'react-router-dom';
import Home from './components/Home/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
export default function App() {
  return (
   <BrowserRouter>
    <Routes>
    <Route path="/login" element={<Login onSwitchToRegister={() => { window.location.pathname = '/register'; }} />} />
    <Route path="/register" element={<Register onSwitchToLogin={() => { window.location.pathname = '/login'; }} />} />
    <Route path="/home" element={<Home />} />
    <Route path="*" element={<Home />} />
    </Routes>
   </BrowserRouter>
  )
}
