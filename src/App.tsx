import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Welcome } from './pages/Welcome';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ChatRoom } from './pages/ChatRoom';
import { ChatList } from './pages/ChatList';
import { Board } from './pages/Board';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { InternalAuthProvider } from './contexts/InternalAuthContext';
import type { AuthContextValue } from './types/auth';

// Wrapper component to provide InternalAuthProvider with auth value
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  // Convert AuthContextType to AuthContextValue format
  const internalAuthValue: AuthContextValue = {
    user: auth.user
      ? {
          uid: auth.user.uid,
          email: auth.user.email,
          displayName: auth.user.displayName,
          photoURL: auth.user.photoURL,
        }
      : null,
    loading: auth.loading,
  };

  return (
    <InternalAuthProvider auth={internalAuthValue}>
      {children}
    </InternalAuthProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <ChatList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:chatId"
                element={
                  <ProtectedRoute>
                    <ChatRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/welcome" replace />} />
              <Route path="*" element={<Navigate to="/welcome" replace />} />
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;
