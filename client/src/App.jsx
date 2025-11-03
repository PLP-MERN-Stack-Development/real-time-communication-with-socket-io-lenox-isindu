import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import GroupChatPage from './pages/GroupChatPage';
import { useSocket } from './hooks/useSocket';
import NotificationToast from './components/UI/NotificationToast';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentView, setCurrentView] = useState('global'); 
  const [currentGroup, setCurrentGroup] = useState(null);

  const { socket } = useSocket();

  const handleLogout = () => {
    if (socket && currentUser) {
      socket.emit('user:logout', {
        userId: currentUser.userId,
        username: currentUser.username,
      });
      socket.disconnect();
    }

    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentView('global');
    setCurrentGroup(null);
  };

  const enterGroupChat = (group) => {
    setCurrentGroup(group);
    setCurrentView('group');
  };

  const exitGroupChat = () => {
    setCurrentGroup(null);
    setCurrentView('global');
  };

  return (
    <div className="min-h-screen gradient-bg">
      {currentUser ? (
        currentView === 'global' ? (
          <ChatPage 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onEnterGroupChat={enterGroupChat}
          />
        ) : (
          <GroupChatPage 
            currentUser={currentUser}
            currentGroup={currentGroup}
            onBack={exitGroupChat}
          />
        )
      ) : (
        <LandingPage onLogin={(user) => {
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentUser(user);
        }} />
      )}
      <NotificationToast />
    </div>
  );
}

export default App;