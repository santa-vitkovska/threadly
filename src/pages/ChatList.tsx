import { Layout } from '../components/Layout';
import { useChats } from '../contexts/ChatContext';
import { ChatListItem } from '../components/ChatListItem';

export const ChatList = () => {
  const { chats, loading } = useChats();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Chats</h1>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No chats yet. Start a conversation!</p>
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
    </Layout>
  );
};

