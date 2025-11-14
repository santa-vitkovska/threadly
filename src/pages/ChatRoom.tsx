import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useChat, useTyping } from '../contexts/ChatContext';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { markMessageAsRead, updateLastSeen } from '../lib/firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase/config';
import { getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, type UserProfile } from '../lib/firebase/firestore';

export const ChatRoom = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { messages, loading } = useChat(chatId || null);
  const typingUsers = useTyping(chatId || null);
  const [chatMembers, setChatMembers] = useState<Record<string, UserProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chat members' profiles
  useEffect(() => {
    const fetchChatMembers = async () => {
      if (!chatId || !user) return;

      try {
        const db = getFirebaseFirestore();
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const members = chatData.members || [];
          
          const profiles: Record<string, UserProfile> = {};
          for (const memberId of members) {
            try {
              const profile = await getUserProfile(memberId);
              if (profile) {
                profiles[memberId] = profile;
              }
            } catch (error) {
              console.error(`Error fetching profile for ${memberId}:`, error);
            }
          }
          
          setChatMembers(profiles);
        }
      } catch (error) {
        console.error('Error fetching chat members:', error);
      }
    };

    fetchChatMembers();
  }, [chatId, user]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!chatId || !user || messages.length === 0) return;

    const markAsRead = async () => {
      for (const message of messages) {
        if (message.senderId !== user.uid && !message.readBy[user.uid]) {
          try {
            await markMessageAsRead(chatId, message.id, user.uid);
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      }
    };

    markAsRead();
  }, [chatId, user, messages]);

  // Update last seen
  useEffect(() => {
    if (!user) return;

    const updateSeen = async () => {
      try {
        await updateLastSeen(user.uid);
      } catch (error) {
        console.error('Error updating last seen:', error);
      }
    };

    updateSeen();
    const interval = setInterval(updateSeen, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get chat name
  const chatName = (() => {
    if (!user || Object.keys(chatMembers).length === 0) return 'Chat';
    
    const otherMembers = Object.keys(chatMembers).filter((id) => id !== user.uid);
    
    if (otherMembers.length === 0) return 'Chat';
    if (otherMembers.length === 1) {
      return chatMembers[otherMembers[0]]?.displayName || 'User';
    }
    
    const names = otherMembers
      .slice(0, 2)
      .map((id) => chatMembers[id]?.displayName || 'User')
      .join(', ');
    
    if (otherMembers.length > 2) {
      return `${names} +${otherMembers.length - 2}`;
    }
    
    return names;
  })();

  // Get typing indicator text
  const typingText = (() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      const typingUser = chatMembers[typingUsers[0]];
      return `${typingUser?.displayName || 'Someone'} is typing...`;
    }
    return 'Multiple people are typing...';
  })();

  if (!chatId) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Invalid chat ID</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen max-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">{chatName}</h1>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
        >
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
          ) : (
            <>
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showAvatar = prevMessage?.senderId !== message.senderId;
                const showSender = showAvatar && message.senderId !== user?.uid;
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                    showSender={showSender}
                  />
                );
              })}
              {typingText && (
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm italic">
                  <span>{typingText}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Composer */}
        <MessageComposer
          chatId={chatId}
          recentMessages={messages}
        />
      </div>
    </Layout>
  );
};
