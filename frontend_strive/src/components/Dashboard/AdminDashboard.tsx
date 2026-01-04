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

interface TrainerApplication {
    status: "none" | "pending" | "approved" | "rejected";
    fullName?: string;
    birthDate?: string;
    certificateFile?: string;
    idDocumentFile?: string;
    submittedAt?: string;
}

interface AdminUser {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: "client" | "trainer" | "admin";
    createdAt: string;
    trainerApplication?: TrainerApplication;
}

interface DocumentPreview {
    title: string;
    url: string;
    type: "image" | "pdf" | "file";
}

export default function AdminDashboard() {
    const [requests, setRequests] = useState<TrainerChangeRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [requestsError, setRequestsError] = useState('');
    const [totalUnread, setTotalUnread] = useState(0);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [applications, setApplications] = useState<AdminUser[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(true);
    const [applicationsError, setApplicationsError] = useState('');
    const [previewDoc, setPreviewDoc] = useState<DocumentPreview | null>(null);

    useEffect(() => {
        fetchRequests();
        fetchUnreadCount();
        fetchUsers();
        fetchTrainerApplications();
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
            setRequestsError('Erro ao carregar solicitações');
            console.error(err);
        } finally {
            setRequestsLoading(false);
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

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3500/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            setUsersError('Erro ao carregar utilizadores');
            console.error(err);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchTrainerApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3500/users?applicationStatus=pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
        } catch (err) {
            setApplicationsError('Erro ao carregar candidaturas de PT');
            console.error(err);
        } finally {
            setApplicationsLoading(false);
        }
    };

    const handleApplicationStatus = async (userId: string, status: "approved" | "rejected") => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3500/users/${userId}/trainer-application`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setApplications((prev) => prev.filter((item) => item._id !== userId));
            setUsers((prev) =>
                prev.map((user) =>
                    user._id === userId
                        ? { ...user, role: response.data.role, trainerApplication: response.data.trainerApplication }
                        : user
                )
            );
        } catch (err) {
            console.error('Erro ao atualizar candidatura:', err);
            alert('Erro ao processar candidatura');
        }
    };

    const formatDate = (value?: string) => {
        if (!value) return "-";
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString("pt-PT");
    };

    const getDocType = (url?: string) => {
        if (!url) return "file";
        if (url.includes("application/pdf")) return "pdf";
        if (url.startsWith("data:image")) return "image";
        return "file";
    };

    const openDocPreview = (title: string, url?: string) => {
        if (!url) return;
        setPreviewDoc({ title, url, type: getDocType(url) });
    };

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
                        <h2>Candidaturas a Personal Trainer</h2>
                        {applicationsLoading ? (
                            <div className="empty-state">A carregar candidaturas...</div>
                        ) : applicationsError ? (
                            <div className="empty-state">{applicationsError}</div>
                        ) : applications.length === 0 ? (
                            <div className="empty-state">
                                <p>Não há candidaturas pendentes.</p>
                            </div>
                        ) : (
                            <div className="applications-list">
                                {applications.map((user) => (
                                    <div key={user._id} className="application-card">
                                        <div className="request-info">
                                            <h3>{user.trainerApplication?.fullName || user.name}</h3>
                                            <div className="request-details">
                                                <div>
                                                    <strong>Utilizador:</strong> @{user.username}
                                                </div>
                                                <div>
                                                    <strong>Email:</strong> {user.email}
                                                </div>
                                                <div>
                                                    <strong>Nascimento:</strong> {formatDate(user.trainerApplication?.birthDate)}
                                                </div>
                                                <div>
                                                    <strong>Submetido:</strong> {formatDate(user.trainerApplication?.submittedAt || user.createdAt)}
                                                </div>
                                            </div>
                                            <div className="application-docs">
                                                {user.trainerApplication?.certificateFile ? (
                                                    <button
                                                        type="button"
                                                        className="doc-link"
                                                        onClick={() => openDocPreview("Certificado de PT", user.trainerApplication?.certificateFile)}
                                                    >
                                                        Ver certificado
                                                    </button>
                                                ) : (
                                                    <span className="muted">Sem certificado</span>
                                                )}
                                                {user.trainerApplication?.idDocumentFile ? (
                                                    <button
                                                        type="button"
                                                        className="doc-link"
                                                        onClick={() => openDocPreview("Documento de identificação", user.trainerApplication?.idDocumentFile)}
                                                    >
                                                        Ver documento
                                                    </button>
                                                ) : (
                                                    <span className="muted">Sem documento</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                onClick={() => handleApplicationStatus(user._id, "approved")}
                                                className="btn-accept"
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleApplicationStatus(user._id, "rejected")}
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

                    <div className="requests-section">
                        <h2>Utilizadores registados</h2>
                        {usersLoading ? (
                            <div className="empty-state">A carregar utilizadores...</div>
                        ) : usersError ? (
                            <div className="empty-state">{usersError}</div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <p>Sem utilizadores registados.</p>
                            </div>
                        ) : (
                            <div className="users-table">
                                <div className="users-row users-header">
                                    <span>Nome</span>
                                    <span>Username</span>
                                    <span>Email</span>
                                    <span>Role</span>
                                    <span>Candidatura PT</span>
                                </div>
                                {users.map((user) => (
                                    <div key={user._id} className="users-row">
                                        <span>{user.name}</span>
                                        <span>@{user.username}</span>
                                        <span>{user.email}</span>
                                        <span className={`role-pill ${user.role}`}>{user.role}</span>
                                        <span>
                                            {user.trainerApplication?.status && user.trainerApplication.status !== "none"
                                                ? user.trainerApplication.status
                                                : "-"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="requests-section">
                        <h2>Solicitações de Troca de Treinador</h2>

                        {requestsLoading ? (
                            <div className="empty-state">A carregar solicitações...</div>
                        ) : requestsError ? (
                            <div className="empty-state">{requestsError}</div>
                        ) : requests.length === 0 ? (
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
            {previewDoc && (
                <div className="doc-modal-overlay" onClick={() => setPreviewDoc(null)}>
                    <div className="doc-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="doc-modal-header">
                            <h3>{previewDoc.title}</h3>
                            <button type="button" className="doc-close" onClick={() => setPreviewDoc(null)}>
                                ×
                            </button>
                        </div>
                        <div className="doc-modal-body">
                            {previewDoc.type === "image" && (
                                <img src={previewDoc.url} alt={previewDoc.title} />
                            )}
                            {previewDoc.type === "pdf" && (
                                <iframe title={previewDoc.title} src={previewDoc.url} />
                            )}
                            {previewDoc.type === "file" && (
                                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                                    Abrir documento
                                </a>
                            )}
                        </div>
                        <div className="doc-modal-footer">
                            <a
                                href={previewDoc.url}
                                download
                                className="doc-download"
                            >
                                Descarregar
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
