import { useLocation, useParams } from 'react-router-dom';
import type { AuthContextValue } from '../types/auth';
import { InternalAuthProvider } from '../contexts/InternalAuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { ChatList } from '../pages/ChatList';
import { ChatRoom } from '../pages/ChatRoom';

interface ChatProps {
  auth: AuthContextValue;
}

export const Chat = ({ auth }: ChatProps) => {
  const location = useLocation();
  const params = useParams<{ chatId?: string }>();
  
  // Determine which component to render based on current route
  // Check if we're on a chat room route (has chatId param)
  const isChatRoom = Boolean(params.chatId && location.pathname.match(/^\/chat\/[^/]+$/));

  return (
    <InternalAuthProvider auth={auth}>
      <ChatProvider>
        {isChatRoom ? <ChatRoom /> : <ChatList />}
      </ChatProvider>
    </InternalAuthProvider>
  );
};

