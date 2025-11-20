import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from './Avatar';
import { getUserProfile, type UserProfile } from '../lib/firebase/firestore';
import type { Chat } from '../lib/firebase/firestore';
import { useInternalAuth } from '../contexts/InternalAuthContext';

interface ChatListItemProps {
  chat: Chat;
}

export const ChatListItem = ({ chat }: ChatListItemProps) => {
  const { user } = useInternalAuth();
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);

  // Fetch member profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const profiles: Record<string, UserProfile> = {};
      const online: string[] = [];
      
      for (const memberId of chat.members) {
        if (memberId === user?.uid) continue;
        
        try {
          const profile = await getUserProfile(memberId);
          if (profile) {
            profiles[memberId] = profile;
            
            // Check if online (lastSeen within last 5 minutes)
            if (profile.lastSeen) {
              const lastSeenTime = profile.lastSeen.toMillis?.() || profile.lastSeen;
              const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
              if (lastSeenTime > fiveMinutesAgo) {
                online.push(memberId);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile for ${memberId}:`, error);
        }
      }
      
      setMemberProfiles(profiles);
      setOnlineMembers(online);
    };

    if (user) {
      fetchProfiles();
    }
  }, [chat.members, user]);

  // Calculate unread count (simplified - would need to check read receipts in real implementation)
  // For now, we'll show a placeholder
  useEffect(() => {
    // TODO: Calculate actual unread count from read receipts
    setUnreadCount(0);
  }, [chat]);

  // Generate chat name
  const chatName = useMemo(() => {
    if (!user) return 'Chat';
    
    const otherMembers = chat.members.filter((id) => id !== user.uid);
    
    if (otherMembers.length === 0) return 'Chat';
    if (otherMembers.length === 1) {
      const profile = memberProfiles[otherMembers[0]];
      return profile?.displayName || 'User';
    }
    
    // Group chat - show first few names
    const names = otherMembers
      .slice(0, 2)
      .map((id) => memberProfiles[id]?.displayName || 'User')
      .join(', ');
    
    if (otherMembers.length > 2) {
      return `${names} +${otherMembers.length - 2}`;
    }
    
    return names;
  }, [chat.members, memberProfiles, user]);

  // Get avatar for display (first other member)
  const displayAvatar = useMemo(() => {
    if (!user) return undefined;
    
    const otherMembers = chat.members.filter((id) => id !== user.uid);
    if (otherMembers.length === 0) return undefined;
    
    const firstMember = memberProfiles[otherMembers[0]];
    return {
      src: firstMember?.avatar,
      alt: firstMember?.displayName || 'User',
    };
  }, [chat.members, memberProfiles, user]);

  // Format timestamp
  const formattedTime = useMemo(() => {
    if (!chat.lastMessageAt) return '';
    
    const timestamp = chat.lastMessageAt.toMillis?.() || chat.lastMessageAt;
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  }, [chat.lastMessageAt]);

  // Truncate last message
  const truncatedMessage = useMemo(() => {
    if (!chat.lastMessage) return 'No messages yet';
    if (chat.lastMessage.length > 50) {
      return chat.lastMessage.substring(0, 50) + '...';
    }
    return chat.lastMessage;
  }, [chat.lastMessage]);

  return (
    <Link
      to={`/chat/${chat.id}`}
      className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={displayAvatar?.src}
          alt={displayAvatar?.alt || 'Chat'}
          size="md"
        />
        {onlineMembers.length > 0 && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {chatName}
          </h3>
          {formattedTime && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formattedTime}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-600 truncate">{truncatedMessage}</p>
          {unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

