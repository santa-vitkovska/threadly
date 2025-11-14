import { useState, useRef, useEffect } from 'react';
import { sendMessage, setTyping } from '../lib/firebase/firestore';
import { uploadMessageAttachment } from '../lib/firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { summarizeMessages } from '../lib/ai/summarize';

interface MessageComposerProps {
  chatId: string;
  onMessageSent?: () => void;
  recentMessages?: any[];
}

export const MessageComposer = ({ chatId, onMessageSent, recentMessages = [] }: MessageComposerProps) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTypingState] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setAttachments((prev) => [...prev, ...fileArray]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || isUploading) return;

    const messageText = text.trim();
    
    // Check for slash commands
    if (messageText.startsWith('/')) {
      const [command] = messageText.slice(1).split(' ');
      
      if (command === 'summarize') {
        await handleSummarizeCommand();
        setText('');
        return;
      }
    }

    try {
      setIsUploading(true);

      // Upload attachments if any
      const uploadedAttachments = [];
      for (const file of attachments) {
        const attachment = await uploadMessageAttachment(chatId, file);
        uploadedAttachments.push(attachment);
      }

      // Determine message type
      let messageType: 'text' | 'image' | 'file' = 'text';
      if (uploadedAttachments.length > 0) {
        const hasImage = uploadedAttachments.some((att) => att.type.startsWith('image/'));
        messageType = hasImage ? 'image' : 'file';
      }

      // Send message
      await sendMessage(chatId, {
        text: messageText,
        senderId: user.uid,
        type: messageType,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      setText('');
      setAttachments([]);
      
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

  const handleSummarizeCommand = async () => {
    if (!user || recentMessages.length === 0) {
      alert('No messages to summarize');
      return;
    }

    try {
      setIsUploading(true);
      const summary = await summarizeMessages(recentMessages);
      
      // Send summary as a system message
      await sendMessage(chatId, {
        text: `Summary: ${summary}`,
        senderId: user.uid,
        type: 'system',
      });

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error summarizing messages:', error);
      alert('Failed to summarize messages. Please try again.');
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
    <form onSubmit={handleSubmit} onDrop={handleDrop} onDragOver={handleDragOver} className="border-t border-gray-200 bg-white">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm"
            >
              <span className="text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700"
          title="Attach file"
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
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a2 2 0 00-2.828-2.828L9 10.172 4.828 6l4.586-4.586a2 2 0 012.828 2.828L8.828 6l6.586 6.586a2 2 0 11-2.828 2.828L6 8.828l-4.586 4.586a2 2 0 102.828 2.828L8.828 12l6.586-6.586z"
            />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message... (use /summarize to summarize recent messages)"
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
          disabled={(!text.trim() && attachments.length === 0) || isUploading}
          className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

