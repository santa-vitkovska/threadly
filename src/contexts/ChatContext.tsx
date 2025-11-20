import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useInternalAuth } from './InternalAuthContext';
import {
  getUserChats,
  listenMessages,
  listenTyping,
  type Chat,
  type Message,
} from '../lib/firebase/firestore';

interface ChatContextType {
  chats: Chat[];
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useInternalAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getUserChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const value: ChatContextType = {
    chats,
    loading,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChats = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatProvider');
  }
  return context;
};

/**
 * Hook to listen to messages in a specific chat
 */
export const useChat = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  return { messages, loading };
};

/**
 * Hook to listen to typing indicators in a specific chat
 */
export const useTyping = (chatId: string | null) => {
  const { user } = useInternalAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId || !user) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = listenTyping(chatId, (users) => {
      // Filter out current user
      setTypingUsers(users.filter((uid) => uid !== user.uid));
    });

    return () => unsubscribe();
  }, [chatId, user]);

  return typingUsers;
};

