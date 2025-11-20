import { useState } from 'react';
import { useChats } from '../contexts/ChatContext';
import { ChatListItem } from '../components/ChatListItem';
import { NewChatModal } from '../components/NewChatModal';

export const ChatList = () => {
  const { chats, loading } = useChats();
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chats</h1>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No chats yet. Start a conversation!</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Your First Chat
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />
    </>
  );
};

