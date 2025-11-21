import { useState, useRef, useEffect } from 'react';
import { sendMessage, setTyping } from '../lib/firebase/firestore';
import { useInternalAuth } from '../contexts/InternalAuthContext';

interface MessageComposerProps {
  chatId: string;
  onMessageSent?: () => void;
}

export const MessageComposer = ({ chatId, onMessageSent }: MessageComposerProps) => {
  const { user } = useInternalAuth();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typing indicator management
  useEffect(() => {
    if (!user || !chatId) return;

    const handleTyping = () => {
      if (!isTyping) {
        setIsTypingState(true);
        setTyping(chatId, user.uid, true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingState(false);
        setTyping(chatId, user.uid, false);
      }, 3000);
    };

    if (text.trim().length > 0) {
      handleTyping();
    } else {
      if (isTyping) {
        setIsTypingState(false);
        setTyping(chatId, user.uid, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        setTyping(chatId, user.uid, false);
      }
    };
  }, [text, chatId, user, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user && chatId && isTyping) {
        setTyping(chatId, user.uid, false);
      }
    };
  }, [chatId, user, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || isUploading) return;

    const messageText = text.trim();

    try {
      setIsUploading(true);

      // Send message
      await sendMessage(chatId, {
        text: messageText,
        senderId: user.uid,
        type: 'text',
      });

      setText('');
      
      // Stop typing
      if (isTyping) {
        setIsTypingState(false);
        await setTyping(chatId, user.uid, false);
      }

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white">
      <div className="flex items-end gap-2 p-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <button
          type="submit"
          disabled={!text.trim() || isUploading}
          className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

