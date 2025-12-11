import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Workouts from './components/Workouts/Workouts';

function App() {
  return (
	<BrowserRouter>
	  <Routes>
		<Route path="/" element={<Home />} />
		<Route path="/register" element={<Register onSwitchToLogin={() => console.log('switch to login')} />} />
		<Route path="/login" element={<Login onSwitchToRegister={() => console.log('switch to register')} />} />
		<Route path="/dashboard" element={<Dashboard />} />
		<Route path="/workouts" element={<Workouts />} />
	  </Routes>
	</BrowserRouter>
  );
}

export default App;
