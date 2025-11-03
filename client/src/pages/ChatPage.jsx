import React, { useEffect } from 'react';
import Header from '../components/Layout/Header';
import MessageList from '../components/Chat/MessageList';
import MessageInput from '../components/Chat/MessageInput';
import Sidebar from '../components/Layout/Sidebar';
import WelcomeBanner from '../components/Chat/WelcomeBanner';
import { useSocket } from '../hooks/useSocket';
import { useMessages } from '../hooks/useMessages';

const ChatPage = ({ currentUser, onLogout, onEnterGroupChat }) => {
  const { socket } = useSocket();
  const messages = useMessages();

  useEffect(() => {
    if (socket && currentUser) {
      console.log(' ChatPage - User loaded, NOT sending user:join to prevent message requests');
      
     
      socket.emit('users:get');
    }
  }, [socket, currentUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={onLogout} />
      
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          <div className="lg:col-span-3 flex flex-col h-full">
            <WelcomeBanner username={currentUser.username} />
            <div className="card bg-base-100 shadow-xl flex-1 flex flex-col mt-4">
              <div className="card-body p-0 flex flex-col flex-1">
                <MessageList currentUser={currentUser} />
                <MessageInput currentUser={currentUser} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Sidebar 
              currentUser={currentUser} 
              onEnterGroupChat={onEnterGroupChat}
              messages={messages} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;