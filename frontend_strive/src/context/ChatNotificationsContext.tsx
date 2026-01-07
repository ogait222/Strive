import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface IUser {
  _id: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
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
  unreadCount?: number;
}

interface ChatNotificationsContextValue {
  unreadChatCount: number;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;
  setActiveChatId: (chatId: string | null) => void;
}

const ChatNotificationsContext = createContext<ChatNotificationsContextValue | undefined>(
  undefined
);

export function ChatNotificationsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentUserRef = useRef<IUser | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const chatsRef = useRef<IChat[]>([]);
  const joinedChatIdsRef = useRef<Set<string>>(new Set());
  const toastedMessageIdsRef = useRef<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return null;
    try {
      const parsed = JSON.parse(storedUser);
      const id = parsed._id || parsed.id;
      if (!id) return null;
      currentUserRef.current = { _id: id, name: parsed.name, role: parsed.role };
      return id;
    } catch {
      return null;
    }
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const syncCurrentUser = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      currentUserRef.current = null;
      setCurrentUserId(null);
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      const id = parsed._id || parsed.id;
      if (!id) {
        currentUserRef.current = null;
        setCurrentUserId(null);
        return;
      }
      currentUserRef.current = { _id: id, name: parsed.name, role: parsed.role };
      setCurrentUserId(id);
    } catch {
      currentUserRef.current = null;
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    syncCurrentUser();
  }, [syncCurrentUser, location.pathname]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    joinedChatIdsRef.current = new Set();
    chatsRef.current = [];
    toastedMessageIdsRef.current = new Set();
    if (!currentUserId) {
      setUnreadChatCount(0);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }


    // Use API_BASE_URL for socket connection
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [currentUserId]);

  const fetchChats = useCallback(async () => {
    const userId = currentUserRef.current?._id;
    if (!userId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/chats/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chats = response.data || [];
      chatsRef.current = chats;
      const totalUnread = chats.reduce(
        (acc: number, chat: IChat) => acc + (chat.unreadCount || 0),
        0
      );
      setUnreadChatCount(totalUnread);

      if (socket) {
        chats.forEach((chat: IChat) => {
          if (joinedChatIdsRef.current.has(chat._id)) return;
          socket.emit("joinChat", chat._id);
          joinedChatIdsRef.current.add(chat._id);
        });
      }
    } catch (error) {
      console.error("Erro ao obter chats:", error);
    }
  }, [socket]);

  useEffect(() => {
    if (currentUserId) {
      fetchChats();
    }
  }, [currentUserId, fetchChats]);

  useEffect(() => {
    if (!socket) return;
    chatsRef.current.forEach((chat) => {
      if (joinedChatIdsRef.current.has(chat._id)) return;
      socket.emit("joinChat", chat._id);
      joinedChatIdsRef.current.add(chat._id);
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      const userId = currentUserRef.current?._id;
      if (!userId) return;
      if (message.sender === userId) return;

      const isActiveChat = activeChatIdRef.current === message.chatId;
      if (!isActiveChat) {
        setUnreadChatCount((prev) => prev + 1);
      }

      if (isActiveChat) return;
      if (toastedMessageIdsRef.current.has(message._id)) return;
      toastedMessageIdsRef.current.add(message._id);

      const chat = chatsRef.current.find((c) => c._id === message.chatId);
      const otherUser = chat?.participants.find((p) => p._id !== userId);
      const displayName = otherUser?.name || "Nova mensagem";
      const initial = (otherUser?.name?.charAt(0) || "N").toUpperCase();
      const isTrainer = otherUser?.role === "trainer";
      const avatarUrl = otherUser?.avatarUrl;

      toast(
        <div className="chat-toast">
          <div className={`chat-toast__avatar ${isTrainer ? "trainer" : ""}`}>
            {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : initial}
          </div>
          <div>
            <div className="chat-toast__title">{displayName}</div>
            <div className="chat-toast__message">{message.content}</div>
          </div>
        </div>,
        { autoClose: 7000, closeOnClick: true }
      );
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      unreadChatCount,
      setUnreadChatCount,
      setActiveChatId,
    }),
    [unreadChatCount, setUnreadChatCount, setActiveChatId]
  );

  return (
    <ChatNotificationsContext.Provider value={value}>
      {children}
    </ChatNotificationsContext.Provider>
  );
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationsContext);
  if (!context) {
    throw new Error("useChatNotifications must be used within ChatNotificationsProvider");
  }
  return context;
}
