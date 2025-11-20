# Threadly

A modular chat component library for React applications. Threadly provides a complete chat interface that can be easily integrated into any React app.

## Installation

```bash
npm install threadly
```

## Peer Dependencies

Threadly requires the following peer dependencies to be installed in your project:

```bash
npm install react react-dom react-router-dom firebase
```

## Usage

### Basic Setup

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Chat } from 'threadly';
import type { AuthContextValue } from 'threadly';
import { useAuth } from './contexts/AuthContext';

// Convert your auth context to Threadly's format
const ChatWrapper = () => {
  const auth = useAuth();
  
  const chatAuth: AuthContextValue = {
    user: auth.user ? {
      uid: auth.user.uid,
      email: auth.user.email,
      displayName: auth.user.displayName,
      photoURL: auth.user.photoURL,
    } : null,
    loading: auth.loading,
  };

  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <Chat auth={chatAuth} />
    </Suspense>
  );
};

// In your App component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chats" element={<ChatWrapper />} />
        <Route path="/chat/:chatId" element={<ChatWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Lazy Loading (Recommended)

For better performance, lazy load the chat module:

```tsx
import { lazy, Suspense } from 'react';

const ChatModule = lazy(() => 
  import('threadly').then(module => ({ default: module.Chat }))
);

const ChatWrapper = () => {
  const auth = useAuth();
  const chatAuth: AuthContextValue = {
    user: auth.user ? {
      uid: auth.user.uid,
      email: auth.user.email,
      displayName: auth.user.displayName,
      photoURL: auth.user.photoURL,
    } : null,
    loading: auth.loading,
  };

  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatModule auth={chatAuth} />
    </Suspense>
  );
};
```

## Features

- 🚀 **Modular**: Load chat functionality as a separate module
- 🔒 **Type-safe**: Full TypeScript support
- 🎨 **Customizable**: Works with your existing auth and routing setup
- 📦 **Lightweight**: Only includes chat-specific code
- 🔥 **Firebase Ready**: Built for Firebase Firestore

## Requirements

- React 19.2.0 or higher
- React Router DOM 7.9.5 or higher
- Firebase 12.5.0 or higher
- A Firebase project with Firestore configured

## License

MIT
