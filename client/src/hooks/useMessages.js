import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export const useMessages = () => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log(' New message:', message);
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageHistory = (history) => {
      console.log(' Received message history:', history.length);
      setMessages(history);
    };

    const handleMessageUpdated = (updatedMessage) => {
      console.log(' Updated message:', updatedMessage._id);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('messages:history', handleMessageHistory);
    socket.on('message:updated', handleMessageUpdated);

    
    console.log('[useMessages] NOT requesting messages - waiting for server');

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('messages:history', handleMessageHistory);
      socket.off('message:updated', handleMessageUpdated);
    };
  }, [socket]);

  return messages;
};