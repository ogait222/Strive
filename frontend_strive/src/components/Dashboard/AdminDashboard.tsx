import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import NavBar from '../NavBar/NavBar';
import { useSearchParams } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
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
    avatarUrl?: string;
}

interface DocumentPreview {
    title: string;
    url: string;
    type: "image" | "pdf" | "file";
}

type AdminTab = "overview" | "change-requests" | "applications" | "trainer-register";

export default function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
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
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminUser["role"]>>({});
    const [roleSaving, setRoleSaving] = useState<Record<string, boolean>>({});
    const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
    const [userSearch, setUserSearch] = useState("");
    const [userSort, setUserSort] = useState<"az" | "za">("az");
    const [userRoleFilter, setUserRoleFilter] = useState<"all" | AdminUser["role"]>("all");
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize, setUsersPageSize] = useState(6);
    const [trainerForm, setTrainerForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [trainerCreateLoading, setTrainerCreateLoading] = useState(false);
    const [trainerCreateError, setTrainerCreateError] = useState("");
    const [trainerCreateSuccess, setTrainerCreateSuccess] = useState("");

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

    const tabParam = searchParams.get("tab");
    const activeTab: AdminTab = ["overview", "change-requests", "applications", "trainer-register"].includes(tabParam || "")
        ? (tabParam as AdminTab)
        : "overview";

    const handleTabChange = (tab: AdminTab) => {
        if (tab === "overview") {
            setSearchParams({}, { replace: true });
        } else {
            setSearchParams({ tab }, { replace: true });
        }
        setExpandedUserId(null);
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(" ").filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (parts[0]?.[0] || "U").toUpperCase();
    };

    const getRoleDraft = (user: AdminUser) => roleDrafts[user._id] || user.role;

    const handleRoleChange = (userId: string, role: AdminUser["role"]) => {
        setRoleDrafts((prev) => ({ ...prev, [userId]: role }));
    };

    const handleRoleSave = async (user: AdminUser) => {
        const nextRole = getRoleDraft(user);
        if (nextRole === user.role) return;

        try {
            setRoleSaving((prev) => ({ ...prev, [user._id]: true }));
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3500/users/${user._id}/role`,
                { role: nextRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers((prev) =>
                prev.map((item) => (item._id === user._id ? { ...item, role: response.data.role } : item))
            );
            setRoleDrafts((prev) => ({ ...prev, [user._id]: response.data.role }));
        } catch (error) {
            console.error("Erro ao atualizar role:", error);
            alert("Erro ao atualizar role do utilizador.");
        } finally {
            setRoleSaving((prev) => ({ ...prev, [user._id]: false }));
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        const confirmed = window.confirm(`Eliminar o utilizador ${user.name}? Esta ação é irreversível.`);
        if (!confirmed) return;

        try {
            setDeleteLoading((prev) => ({ ...prev, [user._id]: true }));
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3500/users/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers((prev) => prev.filter((item) => item._id !== user._id));
            setApplications((prev) => prev.filter((item) => item._id !== user._id));
            if (expandedUserId === user._id) {
                setExpandedUserId(null);
            }
        } catch (error) {
            console.error("Erro ao eliminar utilizador:", error);
            alert("Erro ao eliminar utilizador.");
        } finally {
            setDeleteLoading((prev) => ({ ...prev, [user._id]: false }));
        }
    };

    const handleTrainerInputChange = (field: keyof typeof trainerForm, value: string) => {
        setTrainerForm((prev) => ({ ...prev, [field]: value }));
        if (trainerCreateError) setTrainerCreateError("");
        if (trainerCreateSuccess) setTrainerCreateSuccess("");
    };

    const handleCreateTrainer = async (event: FormEvent) => {
        event.preventDefault();
        if (trainerCreateLoading) return;

        const payload = {
            name: trainerForm.name.trim(),
            username: trainerForm.username.trim(),
            email: trainerForm.email.trim(),
            password: trainerForm.password,
        };

        if (!payload.name || !payload.username || !payload.email || !payload.password) {
            setTrainerCreateError("Preenche todos os campos obrigatórios.");
            return;
        }

        if (trainerForm.password !== trainerForm.confirmPassword) {
            setTrainerCreateError("As passwords não coincidem.");
            return;
        }

        try {
            setTrainerCreateLoading(true);
            setTrainerCreateError("");
            const token = localStorage.getItem("token");
            if (!token) {
                setTrainerCreateError("Não autenticado.");
                return;
            }
            const response = await axios.post("http://localhost:3500/users/trainers", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const created = response.data?.user;
            if (created) {
                setUsers((prev) => [created, ...prev]);
            }
            setTrainerForm({ name: "", username: "", email: "", password: "", confirmPassword: "" });
            setTrainerCreateSuccess("Personal trainer criado com sucesso.");
        } catch (error: any) {
            setTrainerCreateError(error.response?.data?.message || "Erro ao criar personal trainer.");
        } finally {
            setTrainerCreateLoading(false);
        }
    };

    const pendingRequests = requests.length;
    const pendingApplications = applications.length;
    const filteredUsers = useMemo(() => {
        let result = [...users];
        const query = userSearch.trim().toLowerCase();
        if (query) {
            result = result.filter((user) =>
                [user.name, user.username, user.email].some((value) =>
                    value?.toLowerCase().includes(query)
                )
            );
        }
        if (userRoleFilter !== "all") {
            result = result.filter((user) => user.role === userRoleFilter);
        }
        result.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || "";
            const nameB = b.name?.toLowerCase() || "";
            if (nameA < nameB) return userSort === "az" ? -1 : 1;
            if (nameA > nameB) return userSort === "az" ? 1 : -1;
            return 0;
        });
        return result;
    }, [users, userSearch, userRoleFilter, userSort]);
    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPageSize));
    const paginatedUsers = filteredUsers.slice(
        (usersPage - 1) * usersPageSize,
        usersPage * usersPageSize
    );

    useEffect(() => {
        setUsersPage(1);
    }, [userSearch, userRoleFilter, userSort, usersPageSize]);

    useEffect(() => {
        if (usersPage > totalUserPages) {
            setUsersPage(totalUserPages);
        }
    }, [usersPage, totalUserPages]);

    const currentMonthLabel = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    }, []);

    const monthlyUsers = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return users.filter((user) => {
            const created = new Date(user.createdAt);
            if (Number.isNaN(created.getTime())) return false;
            return created >= monthStart && created <= monthEnd;
        });
    }, [users]);

    const dailyRegistrations = useMemo(() => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daily = Array.from({ length: daysInMonth }, (_, index) => ({
            day: index + 1,
            count: 0,
        }));

        monthlyUsers.forEach((user) => {
            const created = new Date(user.createdAt);
            if (Number.isNaN(created.getTime())) return;
            const dayIndex = created.getDate() - 1;
            if (daily[dayIndex]) {
                daily[dayIndex].count += 1;
            }
        });

        return daily;
    }, [monthlyUsers]);

    const roleBreakdown = useMemo(() => {
        const roles: Array<AdminUser["role"]> = ["client", "trainer", "admin"];
        return roles
            .map((role) => ({
                name: role,
                value: monthlyUsers.filter((user) => user.role === role).length,
            }))
            .filter((item) => item.value > 0);
    }, [monthlyUsers]);

    const roleColors: Record<AdminUser["role"], string> = {
        client: "#2563eb",
        trainer: "#10b981",
        admin: "#f97316",
    };

    const usersSection = (
        <div className="requests-section">
            <h2>Utilizadores registados</h2>
            {usersLoading ? (
                <div className="empty-state">A carregar utilizadores...</div>
            ) : usersError ? (
                <div className="empty-state">{usersError}</div>
            ) : (
                <>
                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>Sem utilizadores registados.</p>
                        </div>
                    ) : (
                        <>
                            <div className="users-toolbar">
                                <div className="users-search">
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome, username ou email"
                                        value={userSearch}
                                        onChange={(event) => setUserSearch(event.target.value)}
                                    />
                                </div>
                                <div className="users-filters">
                                    <label className="users-page-size">
                                        <span>Por página</span>
                                        <select
                                            value={usersPageSize}
                                            onChange={(event) => setUsersPageSize(Number(event.target.value))}
                                        >
                                            <option value={6}>6</option>
                                            <option value={12}>12</option>
                                            <option value={24}>24</option>
                                        </select>
                                    </label>
                                    <select
                                        value={userSort}
                                        onChange={(event) => setUserSort(event.target.value as "az" | "za")}
                                    >
                                        <option value="az">A-Z</option>
                                        <option value="za">Z-A</option>
                                    </select>
                                    <select
                                        value={userRoleFilter}
                                        onChange={(event) =>
                                            setUserRoleFilter(event.target.value as "all" | AdminUser["role"])
                                        }
                                    >
                                        <option value="all">Todas as roles</option>
                                        <option value="client">client</option>
                                        <option value="trainer">trainer</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </div>
                            </div>
                            {filteredUsers.length === 0 ? (
                                <div className="empty-state">
                                    <p>Sem resultados para os filtros aplicados.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="users-banner-list">
                                        {paginatedUsers.map((user) => {
                                            const isExpanded = expandedUserId === user._id;
                                            const roleDraft = getRoleDraft(user);
                                            const isSaving = roleSaving[user._id] || false;
                                            const isDeleting = deleteLoading[user._id] || false;
                                            const statusLabel =
                                                user.trainerApplication?.status && user.trainerApplication.status !== "none"
                                                    ? user.trainerApplication.status
                                                    : "-";

                                            return (
                                                <div key={user._id} className={`user-banner ${isExpanded ? "expanded" : ""}`}>
                                                    <div className="user-banner-header">
                                                        <div className="user-main">
                                                            <div className="user-avatar">
                                                                {user.avatarUrl ? (
                                                                    <img src={user.avatarUrl} alt={user.name} />
                                                                ) : (
                                                                    <span>{getInitials(user.name)}</span>
                                                                )}
                                                            </div>
                                                            <div className="user-meta">
                                                                <h3>{user.name}</h3>
                                                                <p>@{user.username}</p>
                                                            </div>
                                                        </div>
                                                        <div className="user-actions">
                                                            <span className={`role-pill ${user.role}`}>{user.role}</span>
                                                            <button
                                                                type="button"
                                                                className="expand-btn"
                                                                onClick={() =>
                                                                    setExpandedUserId((prev) =>
                                                                        prev === user._id ? null : user._id
                                                                    )
                                                                }
                                                            >
                                                                {isExpanded ? "Fechar" : "Ver detalhes"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="user-details">
                                                            <div className="user-details-grid">
                                                                <div>
                                                                    <span className="detail-label">Email</span>
                                                                    <span className="detail-value">{user.email}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="detail-label">Criado</span>
                                                                    <span className="detail-value">
                                                                        {formatDate(user.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="detail-label">Candidatura PT</span>
                                                                    <span className="detail-value">{statusLabel}</span>
                                                                </div>
                                                            </div>
                                                            <div className="role-editor">
                                                                <label htmlFor={`role-${user._id}`}>Editar role</label>
                                                                <div className="role-editor-controls">
                                                                    <select
                                                                        id={`role-${user._id}`}
                                                                        value={roleDraft}
                                                                        onChange={(event) =>
                                                                            handleRoleChange(
                                                                                user._id,
                                                                                event.target.value as AdminUser["role"]
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="client">client</option>
                                                                        <option value="trainer">trainer</option>
                                                                        <option value="admin">admin</option>
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-save"
                                                                        onClick={() => handleRoleSave(user)}
                                                                        disabled={isSaving || roleDraft === user.role}
                                                                    >
                                                                        {isSaving ? "A guardar..." : "Guardar"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="user-danger-zone">
                                                                <div className="danger-text">
                                                                    <span className="detail-label">Eliminar utilizador</span>
                                                                    <span className="detail-value">
                                                                        Esta ação remove permanentemente o utilizador.
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn-danger"
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    disabled={isDeleting}
                                                                >
                                                                    {isDeleting ? "A eliminar..." : "Eliminar utilizador"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {filteredUsers.length > usersPageSize && (
                                        <div className="pagination">
                                            <button
                                                type="button"
                                                disabled={usersPage === 1}
                                                onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                                            >
                                                Anterior
                                            </button>
                                            <span>
                                                {usersPage} / {totalUserPages}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={usersPage === totalUserPages}
                                                onClick={() => setUsersPage((prev) => Math.min(totalUserPages, prev + 1))}
                                            >
                                                Seguinte
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className="dashboard-container">
            <NavBar />
            <div className="dashboard-content">
                <div className="admin-dashboard">
                    <div className="dashboard-header">
                        <h1>Painel de Administrador</h1>
                    </div>

                    <div className="admin-tabs">
                        <button
                            type="button"
                            className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => handleTabChange("overview")}
                        >
                            Visão geral
                        </button>
                        <button
                            type="button"
                            className={`admin-tab ${activeTab === "change-requests" ? "active" : ""}`}
                            onClick={() => handleTabChange("change-requests")}
                        >
                            Trocas de treinador
                            {pendingRequests > 0 && <span className="tab-badge warn">{pendingRequests}</span>}
                        </button>
                        <button
                            type="button"
                            className={`admin-tab ${activeTab === "applications" ? "active" : ""}`}
                            onClick={() => handleTabChange("applications")}
                        >
                            Candidaturas PT
                            {pendingApplications > 0 && <span className="tab-badge warn">{pendingApplications}</span>}
                        </button>
                        <button
                            type="button"
                            className={`admin-tab ${activeTab === "trainer-register" ? "active" : ""}`}
                            onClick={() => handleTabChange("trainer-register")}
                        >
                            Registo de PTs
                        </button>
                    </div>

                    {activeTab === "overview" && (
                        <div className="admin-overview">
                            <section className="admin-overview-charts">
                                <div className="overview-card">
                                    <div className="overview-card-header">
                                        <div>
                                            <h2>Registos em {currentMonthLabel}</h2>
                                            <p className="muted">
                                                Total de contas criadas durante o mês atual.
                                            </p>
                                        </div>
                                        <div className="overview-metric">
                                            <span className="metric-label">Total</span>
                                            <span className="metric-value">{monthlyUsers.length}</span>
                                        </div>
                                    </div>
                                    <div className="overview-chart">
                                        {monthlyUsers.length === 0 ? (
                                            <div className="empty-state">
                                                <p>Sem registos neste mês.</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={240}>
                                                <BarChart data={dailyRegistrations}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        formatter={(value: number) => [`${value} registos`, "Total"]}
                                                        labelFormatter={(label) => `Dia ${label}`}
                                                    />
                                                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                                <div className="overview-card compact">
                                    <div className="overview-card-header">
                                        <div>
                                            <h3>Distribuição por role</h3>
                                            <p className="muted">Registos do mês atual.</p>
                                        </div>
                                    </div>
                                    {monthlyUsers.length === 0 ? (
                                        <div className="empty-state">
                                            <p>Sem registos neste mês.</p>
                                        </div>
                                    ) : (
                                        <div className="overview-pie">
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={roleBreakdown}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius="55%"
                                                        outerRadius="80%"
                                                        paddingAngle={3}
                                                    >
                                                        {roleBreakdown.map((entry) => (
                                                            <Cell
                                                                key={entry.name}
                                                                fill={roleColors[entry.name as AdminUser["role"]]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [`${value} registos`, "Total"]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="overview-legend">
                                                {roleBreakdown.map((entry) => (
                                                    <div key={entry.name} className="legend-item">
                                                        <span
                                                            className="legend-dot"
                                                            style={{ background: roleColors[entry.name as AdminUser["role"]] }}
                                                        />
                                                        <span className="legend-label">{entry.name}</span>
                                                        <span className="legend-value">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                            {usersSection}
                        </div>
                    )}

                    {activeTab === "applications" && (
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
                    )}

                    {activeTab === "trainer-register" && (
                        <div className="requests-section trainer-register">
                            <h2>Registar Personal Trainer</h2>
                            <form className="trainer-form" onSubmit={handleCreateTrainer}>
                                <div className="trainer-form-header">
                                    <div>
                                        <h3>Dados do PT</h3>
                                    </div>
                                </div>
                                <div className="trainer-form-layout">
                                    <div className="trainer-grid">
                                        <label>
                                            <span className="field-label">Nome completo</span>
                                            <input
                                                type="text"
                                                name="trainerName"
                                                placeholder="Ex.: Mariana Costa"
                                                value={trainerForm.name}
                                                onChange={(event) => handleTrainerInputChange("name", event.target.value)}
                                                autoComplete="name"
                                                required
                                            />
                                            <span className="field-hint">Nome que vai aparecer no perfil público.</span>
                                        </label>
                                        <label>
                                            <span className="field-label">Username</span>
                                            <input
                                                type="text"
                                                name="trainerUsername"
                                                placeholder="Ex.: mariana.pt"
                                                value={trainerForm.username}
                                                onChange={(event) => handleTrainerInputChange("username", event.target.value)}
                                                autoComplete="username"
                                                required
                                            />
                                            <span className="field-hint">Identificador único sem espaços.</span>
                                        </label>
                                        <label>
                                            <span className="field-label">Email</span>
                                            <input
                                                type="email"
                                                name="trainerEmail"
                                                placeholder="Ex.: mariana@strive.pt"
                                                value={trainerForm.email}
                                                onChange={(event) => handleTrainerInputChange("email", event.target.value)}
                                                autoComplete="email"
                                                required
                                            />
                                            <span className="field-hint">Será usado para login e notificações.</span>
                                        </label>
                                        <label>
                                            <span className="field-label">Password</span>
                                            <input
                                                type="password"
                                                name="trainerPassword"
                                                placeholder="Mínimo 6 caracteres"
                                                value={trainerForm.password}
                                                onChange={(event) => handleTrainerInputChange("password", event.target.value)}
                                                autoComplete="new-password"
                                                minLength={6}
                                                required
                                            />
                                            <span className="field-hint">
                                                Deve incluir maiúscula, minúscula e número.
                                            </span>
                                        </label>
                                        <label>
                                            <span className="field-label">Confirmar password</span>
                                            <input
                                                type="password"
                                                name="trainerConfirmPassword"
                                                placeholder="Repete a password"
                                                value={trainerForm.confirmPassword}
                                                onChange={(event) => handleTrainerInputChange("confirmPassword", event.target.value)}
                                                autoComplete="new-password"
                                                minLength={6}
                                                required
                                            />
                                        </label>
                                    </div>
                                    <aside className="trainer-form-tips">
                                        <h4>Checklist rápido</h4>
                                        <ul>
                                            <li>Confirma o email e o username.</li>
                                            <li>Partilha a password com o PT com segurança.</li>
                                            <li>Após registo, o PT já pode entrar.</li>
                                        </ul>
                                    </aside>
                                </div>
                                {trainerCreateError && <div className="trainer-form-status error">{trainerCreateError}</div>}
                                {trainerCreateSuccess && (
                                    <div className="trainer-form-status success">{trainerCreateSuccess}</div>
                                )}
                                <div className="trainer-actions">
                                    <button type="submit" className="btn-save" disabled={trainerCreateLoading}>
                                        {trainerCreateLoading ? "A registar..." : "Registar PT"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "change-requests" && (
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
                    )}
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
