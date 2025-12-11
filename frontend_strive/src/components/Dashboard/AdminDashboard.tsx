import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../NavBar/NavBar';
import './AdminDashboard.css';

interface TrainerChangeRequest {
    _id: string;
    client: {
        _id: string;
        name: string;
        email: string;
    };
    currentTrainer: {
        _id: string;
        name: string;
        email: string;
    };
    newTrainer: {
        _id: string;
        name: string;
        email: string;
    };
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export default function AdminDashboard() {
    const [requests, setRequests] = useState<TrainerChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalUnread, setTotalUnread] = useState(0);

    useEffect(() => {
        fetchRequests();
        fetchUnreadCount();
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const userId = user.id || user._id;

            const response = await axios.get(`http://localhost:3500/chats/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const chats = response.data;
            // Calculate total unread (assuming chat object now has unreadCount property from updated backend)
            const total = chats.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
            setTotalUnread(total);
        } catch (error) {
            console.error('Erro ao buscar mensagens não lidas:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            // Assuming the user token is stored in localStorage
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3500/change-trainer/request?status=pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (err) {
            setError('Erro ao carregar solicitações');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3500/change-trainer/request/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state to remove the processed request
            setRequests(requests.filter(req => req._id !== id));

            // Optional: Show success message
        } catch (err) {
            console.error('Erro ao atualizar solicitação:', err);
            alert('Erro ao processar solicitação');
        }
    };

    if (loading) return <div className="admin-dashboard">Carregando...</div>;
    if (error) return <div className="admin-dashboard error">{error}</div>;

    return (
        <div className="dashboard-container">
            <NavBar />
            <div className="dashboard-content">
                <div className="admin-dashboard">
                    <div className="dashboard-header">
                        <h1>Painel de Administrador</h1>
                    </div>

                    <div className="admin-actions-section">
                        <h2>Ações Rápidas</h2>
                        <div className="admin-action-cards">
                            <div className="admin-card action-chat" onClick={() => (window.location.href = '/chat')} style={{ position: 'relative' }}>
                                <div className="admin-card-icon">💬</div>
                                <h3>Chats</h3>
                                <p>Falar com utilizadores</p>
                                {totalUnread > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        backgroundColor: '#e53e3e',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        border: '2px solid white'
                                    }}>
                                        {totalUnread}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="requests-section">
                        <h2>Solicitações de Troca de Treinador</h2>

                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <p>Não há solicitações pendentes no momento.</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {requests.map((req) => (
                                    <div key={req._id} className="request-card">
                                        <div className="request-info">
                                            <h3>{req.client.name}</h3>
                                            <div className="request-details">
                                                <div>
                                                    <strong>De:</strong> {req.currentTrainer.name}
                                                </div>
                                                <div>
                                                    <strong>Para:</strong> {req.newTrainer.name}
                                                </div>
                                            </div>
                                            {req.reason && (
                                                <div className="request-reason">
                                                    <strong>Motivo:</strong> {req.reason}
                                                </div>
                                            )}
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'approved')}
                                                className="btn-accept"
                                            >
                                                Aceitar
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                                className="btn-reject"
                                            >
                                                Rejeitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
