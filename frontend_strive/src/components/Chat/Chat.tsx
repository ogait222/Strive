import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
        const newSocket = io("http://localhost:3500");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [navigate]);

    // Load Chats
    useEffect(() => {
        if (currentUser) {
            fetchChats();
        }
    }, [currentUser]);

    // Socket Listeners
    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (message: IMessage) => {
                if (activeChat && message.chatId === activeChat._id) {
                    setMessages((prev) => {
                        if (prev.some(m => m._id === message._id)) return prev;
                        return [...prev, message];
                    });
                    // If we are in the chat, we should mark it as read immediately? 
                    // Or rely on user action. For now let's leave it, but maybe update UI.
                    markChatAsRead(activeChat._id);
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
            });
        }
        return () => {
            socket?.off("newMessage");
        };
    }, [socket, activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ...

    const fetchChats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:3500/chats/user/${currentUser!._id}`,
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
                `http://localhost:3500/chats/${chatId}/read`,
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

    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:3500/users/search?query=${query}`,
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
                "http://localhost:3500/chats/create",
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
                `http://localhost:3500/chats/${chat._id}/messages`,
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
                "http://localhost:3500/chats/message",
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
            setMessages((prev) => [...prev, sentMessage]);
            scrollToBottom();

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherParticipant = (chat: IChat) => {
        return chat.participants.find((p) => p._id !== currentUser?._id);
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
                        {sortedChats.map((chat) => {
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
                                            {otherUser.role === 'trainer' && <span style={{ fontSize: '0.8em', color: '#ff8c00', marginLeft: 6 }}>★ Treinador</span>}
                                        </div>
                                        {chat.lastMessage && (
                                            <div className="chat-last-message">
                                                {chat.lastMessage.sender === currentUser?._id && "Tu: "}
                                                {chat.lastMessage.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                            <span style={{ fontSize: 60 }}>💬</span>
                            <p>Seleciona uma conversa para começares a falar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
