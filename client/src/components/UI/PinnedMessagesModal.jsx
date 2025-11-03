import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import FileMessage from './FileMessage';
import MessageReactions from './MessageReactions';

const PinnedMessagesModal = ({ isOpen, onClose, room, currentUser }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (isOpen && socket) {
      // Request pinned messages when modal opens
      socket.emit('pinned:messages:get', room);
      
      const handlePinnedMessages = (messages) => {
        setPinnedMessages(messages);
      };

      const handleMessagePinned = (message) => {
        setPinnedMessages(prev => [message, ...prev]);
      };

      const handleMessageUnpinned = (message) => {
        setPinnedMessages(prev => prev.filter(msg => msg._id !== message._id));
      };

      socket.on('pinned:messages:list', handlePinnedMessages);
      socket.on('message:pinned', handleMessagePinned);
      socket.on('message:unpinned', handleMessageUnpinned);

      return () => {
        socket.off('pinned:messages:list', handlePinnedMessages);
        socket.off('message:pinned', handleMessagePinned);
        socket.off('message:unpinned', handleMessageUnpinned);
      };
    }
  }, [isOpen, room, socket]);

  const handleUnpinMessage = (messageId) => {
    if (socket) {
      socket.emit('message:unpin', { messageId });
    }
  };

  const canUnpin = (message) => {
    // Allow unpin if user is the one who pinned it or is admin
    return message.metadata?.pinnedBy === currentUser.userId || 
           message.userId === currentUser.userId;
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">📌 Pinned Messages</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pinnedMessages.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <div className="text-4xl mb-2">📌</div>
              <p>No pinned messages yet</p>
              <p className="text-sm">Pin important messages to keep them easily accessible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedMessages.map((message) => (
                <div key={message._id} className="bg-base-200 rounded-lg p-4 border-l-4 border-warning">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {message.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <span className="font-medium text-sm">{message.username}</span>
                      <span className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {canUnpin(message) && (
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleUnpinMessage(message._id)}
                        title="Unpin message"
                      >
                        Unpin
                      </button>
                    )}
                  </div>

                  {message.type === 'file' ? (
                    <FileMessage 
                      file={message.file}
                      currentUser={currentUser}
                      messageUser={message.username}
                    />
                  ) : (
                    <p className="text-base-content mb-2">{message.text}</p>
                  )}

                  <MessageReactions
                    reactions={message.metadata?.reactions}
                    currentUserId={currentUser.userId || currentUser.id}
                    onReactionClick={() => {}} 
                  />

                  <div className="text-xs text-base-content/60 mt-2">
                     Pinned by {message.metadata?.pinnedBy === currentUser.userId ? 'You' : 'User'} • 
                    {new Date(message.metadata?.pinnedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesModal;