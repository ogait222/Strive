import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './components/Home/Home';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import Workouts from './components/Workouts/Workouts';
import TrainerSelection from './components/Trainers/TrainerSelection';
import MyStudents from './components/MyStudents/MyStudents';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ChangeTrainerRequest from './components/Trainers/ChangeTrainerRequest';
import Notifications from './components/Notifications/Notifications';
import Chat from './components/Chat/Chat';
import Profile from './components/Profile/Profile';
import { ThemeProvider } from './context/ThemeContext';
import { ChatNotificationsProvider } from './context/ChatNotificationsContext';

function App() {
	return (
		<ThemeProvider>
			<BrowserRouter>
				<ChatNotificationsProvider>
					<div className="App">
						<ToastContainer position="top-right" autoClose={7000} closeOnClick pauseOnHover />
						<main className="app-main">
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/register" element={<RegisterWrapper />} />
								<Route path="/login" element={<LoginWrapper />} />
								<Route path="/forgot-password" element={<ForgotPassword />} />
								<Route path="/reset-password/:token" element={<ResetPassword />} />
								<Route path="/dashboard" element={<Dashboard />} />
								<Route path="/workouts" element={<Workouts />} />
								<Route path="/trainers" element={<TrainerSelection />} />
								<Route path="/my-students" element={<MyStudents />} />
								<Route path="/admin-dashboard" element={<AdminDashboard />} />
								<Route path="/change-trainer/request" element={<ChangeTrainerRequest />} />
								<Route path="/notifications" element={<Notifications />} />
								<Route path="/chat" element={<Chat />} />
								<Route path="/profile" element={<Profile />} />
							</Routes>
						</main>
					</div>
				</ChatNotificationsProvider>
			</BrowserRouter>
		</ThemeProvider>
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
