import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/Home/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Workouts from './components/Workouts/Workouts';
import TrainerSelection from './components/Trainers/TrainerSelection';

function App() {
	return (
		<BrowserRouter>
			<div className="App">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/register" element={<RegisterWrapper />} />
					<Route path="/login" element={<LoginWrapper />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/workouts" element={<Workouts />} />
					<Route path="/trainers" element={<TrainerSelection />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}

// Wrapper components to handle the prop requirements by using hooks
function RegisterWrapper() {
	const navigate = useNavigate();
	return <Register onSwitchToLogin={() => navigate('/login')} />;
}

function LoginWrapper() {
	const navigate = useNavigate();
	return <Login onSwitchToRegister={() => navigate('/register')} />;
}

export default App;
