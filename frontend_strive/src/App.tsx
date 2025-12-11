import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/Home/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Workouts from './components/Workouts/Workouts';
import TrainerSelection from './components/Trainers/TrainerSelection';
import MyStudents from './components/MyStudents/MyStudents';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ChangeTrainerRequest from './components/Trainers/ChangeTrainerRequest';
import Notifications from './components/Notifications/Notifications';
import Chat from './components/Chat/Chat';

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
					<Route path="/my-students" element={<MyStudents />} />
					<Route path="/admin-dashboard" element={<AdminDashboard />} />
					<Route path="/change-trainer/request" element={<ChangeTrainerRequest />} />
					<Route path="/notifications" element={<Notifications />} />
					<Route path="/chat" element={<Chat />} />
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
