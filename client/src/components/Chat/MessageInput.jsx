import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import FileUpload from '../UI/FileUpload';

const MessageInput = ({ currentUser, room = 'global' }) => {
  const [message, setMessage] = useState('');
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef(null);

  const sendMessage = () => {
    if (message.trim() && socket) {
      const messageData = {
        username: currentUser.username,
        userId: currentUser.userId || currentUser.id,
        text: message.trim()
      };

      if (room && room !== 'global') {
        messageData.room = room;
        socket.emit('group:message:send', messageData);
      } else {
        socket.emit('message:send', messageData);
      }
      
      setMessage('');
      handleStopTyping();
    }
  };

  const handleFileUpload = (fileData) => {
  console.log(' FileUpload callback received:', fileData);
  
  const messageData = {
    userId: currentUser.userId || currentUser.id,
    username: currentUser.username,
    type: 'file',
    file: fileData,
    text: ''
  };

  console.log('Main chat message before socket emit:', messageData);
  
  socket.emit('message:send', messageData);
};

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('user:typing', {
        username: currentUser.username,
        isTyping: true,
        room: room
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('user:typing', {
        username: currentUser.username,
        isTyping: false,
        room: room
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      handleStopTyping();
    }
  };

  return (
    <div className="p-4 border-t border-base-300">
      <div className="flex items-center gap-2">
        <FileUpload 
          onFileUpload={handleFileUpload}
          currentUser={currentUser}
          room={room}
        />
        
        <div className="join flex-1">
          <input
            type="text"
            placeholder={room === 'global' ? "Type your message to the team..." : `Type your message in ${room}...`}
            className="input input-bordered join-item flex-1"
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onBlur={handleStopTyping}
            maxLength={500}
          />
          <button 
            className="btn btn-primary join-item"
            onClick={sendMessage}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
      <div className="text-xs text-base-content/50 mt-2">
      </div>
    </div>
  );
};

export default MessageInput;