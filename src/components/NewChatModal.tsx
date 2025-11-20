import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers, createOrGetChat, type UserProfileWithId } from '../lib/firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from './Avatar';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal = ({ isOpen, onClose }: NewChatModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileWithId[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim() || !user) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchTerm, 10);
        // Filter out current user
        const filteredResults = results.filter((u) => u.uid !== user.uid);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  const handleStartChat = async (otherUserId: string) => {
    if (!user || isCreating) return;

    try {
      setIsCreating(true);
      const chatId = await createOrGetChat([user.uid, otherUserId]);
      // Reset state before closing
      setSearchTerm('');
      setSearchResults([]);
      onClose();
      navigate(`/chat/${chatId}`);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorCode = error?.code || '';
      console.error('Error details:', { errorMessage, errorCode, error });
      alert(`Failed to start chat: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}. Please check the console for more details.`);
    } finally {
      setIsCreating(false);
    }
  };

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for users..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isSearching ? (
            <div className="text-center text-gray-500 py-8">
              <p>Searching...</p>
            </div>
          ) : searchTerm.trim() && searchResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No users found</p>
            </div>
          ) : !searchTerm.trim() ? (
            <div className="text-center text-gray-500 py-8">
              <p>Start typing to search for users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((userProfile) => (
                <button
                  key={userProfile.uid}
                  onClick={() => handleStartChat(userProfile.uid)}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar
                    src={userProfile.avatar}
                    alt={userProfile.displayName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {userProfile.displayName}
                    </p>
                    {userProfile.status && (
                      <p className="text-sm text-gray-500 truncate">
                        {userProfile.status}
                      </p>
                    )}
                  </div>
                  {isCreating && (
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

