import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import "./Notifications.css";
import { useNavigate } from "react-router-dom";

interface Notification {
    _id: string;
    type: "missedWorkout" | "message" | "changeTrainer";
    message: string;
    read: boolean;
    createdAt: string;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await axios.get("http://localhost:3500/notifications", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setNotifications(response.data);

                // Mark all as read if there are unread ones
                const hasUnread = response.data.some((n: any) => !n.read);
                if (hasUnread) {
                    await axios.post("http://localhost:3500/notifications/read-all", {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Optimistically update local state
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }

            } catch (err: any) {
                setError("Erro ao carregar notificações.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [navigate]);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:3500/notifications/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error("Erro ao marcar como lida", err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "missedWorkout": return "💪";
            case "changeTrainer": return "🔄";
            case "message": return "💬";
            default: return "🔔";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="notifications-container">
                <NavBar />
                <div className="content">
                    <div className="loading">Carregando notificações...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-container">
            <NavBar />
            <div className="content">
                <h1>Notificações</h1>
                {error && <div className="error-message">{error}</div>}

                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <p>Não tens notificações novas.</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                                onClick={() => !notification.read && markAsRead(notification._id)}
                            >
                                <div className="notification-icon">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <p>{notification.message}</p>
                                    <span className="notification-date">
                                        {formatDate(notification.createdAt)}
                                    </span>
                                    {!notification.read && (
                                        <button
                                            className="mark-read-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification._id);
                                            }}
                                        >
                                            Marcar como lida
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
