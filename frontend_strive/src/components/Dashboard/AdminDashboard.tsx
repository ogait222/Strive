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

    useEffect(() => {
        fetchRequests();
    }, []);

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
