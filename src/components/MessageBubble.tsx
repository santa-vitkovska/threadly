import { useMemo } from 'react';
import { format } from 'date-fns';
import { Avatar } from './Avatar';
import type { Message } from '../lib/firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, type UserProfile } from '../lib/firebase/firestore';
import { useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showSender?: boolean;
}

export const MessageBubble = ({ message, showAvatar = false, showSender = false }: MessageBubbleProps) => {
  const { user } = useAuth();
  const [senderProfile, setSenderProfile] = useState<UserProfile | null>(null);
  const isOwnMessage = message.senderId === user?.uid;
  const isSystemMessage = message.type === 'system';

  useEffect(() => {
    if (message.senderId && !isSystemMessage) {
      getUserProfile(message.senderId)
        .then((profile) => {
          if (profile) setSenderProfile(profile);
        })
        .catch((error) => {
          console.error('Error fetching sender profile:', error);
        });
    }
  }, [message.senderId, isSystemMessage]);

  const formattedTime = useMemo(() => {
    if (!message.createdAt) return '';
    const timestamp = message.createdAt.toMillis?.() || message.createdAt;
    if (!timestamp) return '';
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  }, [message.createdAt]);

  // System message styling
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  // Image message
  if (message.type === 'image' && message.attachments && message.attachments.length > 0) {
    const imageAttachment = message.attachments.find((att) => att.type.startsWith('image/'));
    
    return (
      <div className={`flex items-end gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isOwnMessage && (
          <Avatar
            src={senderProfile?.avatar}
            alt={senderProfile?.displayName || 'User'}
            size="sm"
          />
        )}
        <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {showSender && !isOwnMessage && senderProfile && (
            <span className="text-xs text-gray-500 mb-1 px-2">{senderProfile.displayName}</span>
          )}
          <div
            className={`rounded-lg p-2 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {imageAttachment && (
              <img
                src={imageAttachment.url}
                alt={imageAttachment.name}
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '300px' }}
              />
            )}
            {message.text && (
              <p className="mt-2 text-sm">{message.text}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 mt-1 px-2">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // File message
  if (message.type === 'file' && message.attachments && message.attachments.length > 0) {
    return (
      <div className={`flex items-end gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isOwnMessage && (
          <Avatar
            src={senderProfile?.avatar}
            alt={senderProfile?.displayName || 'User'}
            size="sm"
          />
        )}
        <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {showSender && !isOwnMessage && senderProfile && (
            <span className="text-xs text-gray-500 mb-1 px-2">{senderProfile.displayName}</span>
          )}
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {message.attachments.map((attachment, idx) => (
              <a
                key={idx}
                href={attachment.url}
                download={attachment.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">{attachment.name}</span>
                {attachment.size && (
                  <span className="text-xs opacity-75">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </a>
            ))}
            {message.text && (
              <p className="mt-2 text-sm">{message.text}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 mt-1 px-2">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // Text message
  return (
    <div className={`flex items-end gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={senderProfile?.avatar}
          alt={senderProfile?.displayName || 'User'}
          size="sm"
        />
      )}
      <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwnMessage && senderProfile && (
          <span className="text-xs text-gray-500 mb-1 px-2">{senderProfile.displayName}</span>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1 px-2">{formattedTime}</span>
      </div>
    </div>
  );
};

