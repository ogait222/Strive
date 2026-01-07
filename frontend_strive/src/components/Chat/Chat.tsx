import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import { useChatNotifications } from "../../context/ChatNotificationsContext";
import { API_BASE_URL } from "../../config";
import "./Chat.css";

interface IUser {
    _id: string;
    name: string;
    username: string;
    role: string;
}

interface IMessage {
    _id: string;
    chatId: string;
    sender: string;
    content: string;
    createdAt: string;
}

interface IChat {
    _id: string;
    participants: IUser[];
    lastMessage?: IMessage;
    updatedAt: string;
    unreadCount?: number;
    archivedBy?: string[];
}

const Chat: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);
    const [chats, setChats] = useState<IChat[]>([]);
    const [activeChat, setActiveChat] = useState<IChat | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<IUser[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeChatRef = useRef<IChat | null>(null);
    const joinedChatIdsRef = useRef<Set<string>>(new Set());
    const navigate = useNavigate();
    const { setActiveChatId, setUnreadChatCount } = useChatNotifications();

    // Initial Setup
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userStr || !token) {
            navigate("/login");
            return;
        }

        const user = JSON.parse(userStr);
        // Normalize user object: ensure _id exists (auth controller returns id)
        if (user.id && !user._id) {
            user._id = user.id;
        }
        setCurrentUser(user);

        // Socket Connection
        const newSocket = io(API_BASE_URL);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [navigate]);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        setActiveChatId(activeChat?._id ?? null);
    }, [activeChat, setActiveChatId]);

    useEffect(() => {
        return () => {
            setActiveChatId(null);
        };
    }, [setActiveChatId]);

    useEffect(() => {
        const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
        setUnreadChatCount(totalUnread);
    }, [chats, setUnreadChatCount]);

    // Load Chats
    useEffect(() => {
        if (currentUser) {
            fetchChats();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!socket) return;

        chats.forEach((chat) => {
            if (joinedChatIdsRef.current.has(chat._id)) return;
            socket.emit("joinChat", chat._id);
            joinedChatIdsRef.current.add(chat._id);
        });
    }, [socket, chats]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: IMessage) => {
            const active = activeChatRef.current;
            const isActiveChat = !!active && message.chatId === active._id;

            if (isActiveChat) {
                setMessages((prev) => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                // If we are in the chat, we should mark it as read immediately? 
                // Or rely on user action. For now let's leave it, but maybe update UI.
                markChatAsRead(active!._id);
                scrollToBottom();
            } else {
                // If message is for another chat, increment unread count locally if we want instant update
                setChats(prev => prev.map(c =>
                    c._id === message.chatId
                        ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: message, updatedAt: new Date().toISOString() }
                        : c
                ));
            }
            // We still fetch chats to ensure consistency, but local update above makes it snappy
            // fetchChats(); // Optional if local update is robust
        };

        socket.on("newMessage", handleNewMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [socket]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ...

    const fetchChats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_BASE_URL}/chats/user/${currentUser!._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setChats(response.data);
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    };

    const markChatAsRead = async (chatId: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_BASE_URL}/chats/${chatId}/read`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            // Update local state to clear unread count
            setChats(prev => prev.map(c =>
                c._id === chatId ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error("Error marking chat as read:", error);
        }
    };

    const handleArchiveChat = async (chatId: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_BASE_URL}/chats/${chatId}/archive`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const currentUserId = currentUser?._id;
            if (!currentUserId) return;
            setChats((prev) =>
                prev.map((chat) => {
                    if (chat._id !== chatId) return chat;
                    const archivedBy = chat.archivedBy ? [...chat.archivedBy] : [];
                    if (!archivedBy.includes(currentUserId)) {
                        archivedBy.push(currentUserId);
                    }
                    return { ...chat, archivedBy };
                })
            );
            if (activeChat?._id === chatId) {
                setActiveChat(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error archiving chat:", error);
        }
    };

    const handleUnarchiveChat = async (chatId: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_BASE_URL}/chats/${chatId}/unarchive`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const currentUserId = currentUser?._id;
            if (!currentUserId) return;
            setChats((prev) =>
                prev.map((chat) => {
                    if (chat._id !== chatId) return chat;
                    const archivedBy = (chat.archivedBy || []).filter((id) => id !== currentUserId);
                    return { ...chat, archivedBy };
                })
            );
        } catch (error) {
            console.error("Error unarchiving chat:", error);
        }
    };

    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_BASE_URL}/users/search?query=${query}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error searching users:", error);
        }
    };

    const startChat = async (targetUser: IUser) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_BASE_URL}/chats/create`,
                {
                    userId1: currentUser!._id,
                    userId2: targetUser._id,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await fetchChats();

            setSearchQuery("");
            setSearchResults([]);
            setShowSearch(false);

        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const selectChat = async (chat: IChat) => {
        setActiveChat(chat);
        // Mark as read immediately when selecting
        if (chat.unreadCount && chat.unreadCount > 0) {
            markChatAsRead(chat._id);
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API_BASE_URL}/chats/${chat._id}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(response.data);
            socket?.emit("joinChat", chat._id);
            scrollToBottom();
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const token = localStorage.getItem("token");
            const receiver = activeChat.participants.find(
                (p) => p._id !== currentUser!._id
            );

            const response = await axios.post(
                `${API_BASE_URL}/chats/message`,
                {
                    chatId: activeChat._id,
                    sender: currentUser!._id,
                    receiver: receiver?._id,
                    content: newMessage,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setNewMessage("");
            // Optimistically add message
            const sentMessage = response.data;
            setMessages((prev) =>
                prev.some((m) => m._id === sentMessage._id) ? prev : [...prev, sentMessage]
            );
            scrollToBottom();

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherParticipant = (chat: IChat) => {
        return chat.participants.find((p) => p._id !== currentUser?._id);
    };

    const isChatArchived = (chat: IChat) => {
        const currentUserId = currentUser?._id;
        if (!currentUserId) return false;
        return chat.archivedBy?.includes(currentUserId) || false;
    };

    // Organize chats: Trainer first, then others
    const sortedChats = [...chats].sort((a, b) => {
        const userA = getOtherParticipant(a);
        const userB = getOtherParticipant(b);

        // Explicitly check for trainer role
        if (userA?.role === 'trainer' && userB?.role !== 'trainer') return -1;
        if (userA?.role !== 'trainer' && userB?.role === 'trainer') return 1;

        // Default sort by date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const activeChats = sortedChats.filter((chat) => !isChatArchived(chat));
    const archivedChats = sortedChats.filter((chat) => isChatArchived(chat));

    const renderChatItem = (chat: IChat, archived: boolean) => {
        const otherUser = getOtherParticipant(chat);
        if (!otherUser) return null;

        return (
            <div
                key={chat._id}
                className={`chat-item ${activeChat?._id === chat._id ? "active" : ""}`}
                onClick={() => selectChat(chat)}
            >
                <div className={`avatar ${otherUser.role === 'trainer' ? 'trainer' : ''}`}>
                    {otherUser.name.charAt(0).toUpperCase()}
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                        <div className="unread-badge">{chat.unreadCount}</div>
                    ) : null}
                </div>
                <div className="chat-info">
                    <div className="chat-name">
                        {otherUser.name}
                        {otherUser.role === 'trainer' && <span className="trainer-badge">★ Treinador</span>}
                    </div>
                    {chat.lastMessage && (
                        <div className="chat-last-message">
                            {chat.lastMessage.sender === currentUser?._id && "Tu: "}
                            {chat.lastMessage.content}
                        </div>
                    )}
                </div>
                <div className="chat-item-actions">
                    <button
                        type="button"
                        className="archive-btn"
                        aria-label={archived ? "Desarquivar conversa" : "Arquivar conversa"}
                        title={archived ? "Desarquivar conversa" : "Arquivar conversa"}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (archived) {
                                handleUnarchiveChat(chat._id);
                            } else {
                                handleArchiveChat(chat._id);
                            }
                        }}
                    >
                        {archived ? (
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-1v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h2zm2-1h8v1H8V6zm-2 7v5h12v-5H6zm6-1 3-3h-2V7h-2v2H9l3 3z"
                                    fill="currentColor"
                                />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-1v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h2zm2-1h8v1H8V6zm-2 7v5h12v-5H6zm6-5 3 3h-2v2h-2v-2H9l3-3z"
                                    fill="currentColor"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <NavBar />
            <div className="chat-page">
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <h2>Mensagens</h2>
                        <button
                            className="new-chat-btn"
                            onClick={() => setShowSearch(!showSearch)}
                            title="Nova conversa"
                        >
                            +
                        </button>
                    </div>

                    {showSearch && (
                        <div className="user-search-container">
                            <input
                                type="text"
                                placeholder="Pesquisar utilizador..."
                                className="user-search-input"
                                value={searchQuery}
                                onChange={(e) => handleSearchUsers(e.target.value)}
                                autoFocus
                            />
                            <div className="search-results">
                                {searchResults.map((user) => (
                                    <div
                                        key={user._id}
                                        className="search-item"
                                        onClick={() => startChat(user)}
                                    >
                                        <div className={`avatar ${user.role === 'trainer' ? 'trainer' : ''}`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.name} ({user.role})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chat-list">
                        <div className="chat-list-section">
                            <div className="section-title">Conversas</div>
                            {activeChats.length === 0 ? (
                                <div className="chat-empty">Sem conversas ativas.</div>
                            ) : (
                                activeChats.map((chat) => renderChatItem(chat, false))
                            )}
                        </div>
                        <div className="chat-list-section">
                            <button
                                type="button"
                                className="archive-toggle"
                                onClick={() => setShowArchived((prev) => !prev)}
                            >
                                {showArchived
                                    ? "Ocultar arquivadas"
                                    : `Arquivadas${archivedChats.length ? ` (${archivedChats.length})` : ""}`}
                            </button>
                            {showArchived && (
                                archivedChats.length === 0 ? (
                                    <div className="chat-empty">Sem conversas arquivadas.</div>
                                ) : (
                                    archivedChats.map((chat) => renderChatItem(chat, true))
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="chat-main">
                    {activeChat ? (
                        <>
                            <div className="chat-header">
                                <div className={`avatar ${getOtherParticipant(activeChat)?.role === 'trainer' ? 'trainer' : ''}`}>
                                    {getOtherParticipant(activeChat)?.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="chat-header-info">
                                    <h3>{getOtherParticipant(activeChat)?.name}</h3>
                                    <div className="chat-header-status">{getOtherParticipant(activeChat)?.role === 'trainer' ? 'Teu Treinador' : 'Utilizador'}</div>
                                </div>
                            </div>

                            <div className="messages-container">
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`message ${msg.sender === currentUser?._id ? "sent" : "received"
                                            }`}
                                    >
                                        {msg.content}
                                        <span className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Escreve uma mensagem..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn">
                                    ➤
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Seleciona uma conversa para começares a falar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
