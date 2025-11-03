import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import TypingIndicator from '../UI/TypingIndicator';
import ReactionPicker from '../UI/ReactionPicker';
import MessageReactions from '../UI/MessageReactions';
import FileMessage from '../UI/FileMessage';
import ReactionsDetailModal from '../UI/ReactionsDetailModal';

const GroupMessageList = ({ currentUser, group }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = React.useState([]);
  const [typingUsers, setTypingUsers] = React.useState([]);
  const [reactionsModal, setReactionsModal] = useState({
    isOpen: false,
    reactions: null,
    reactionFilter: null
  });

  React.useEffect(() => {
    if (!socket || !group) return;

    console.log('GroupMessageList mounted for group:', group.groupId);

    const handleGroupMessage = (message) => {
      if (message.room === group.groupId) {
        console.log('group:message:new event received:', message);
        setMessages(prev => [...prev, message]);
        setTypingUsers(prev => prev.filter(user => user !== message.username));
      }
    };

    const handleGroupMessageHistory = (history) => {
      console.log('group:messages:history event received:', history);
      setMessages(history);
    };

    const handleUserTyping = (data) => {
      if (data.room === group.groupId) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            if (!prev.includes(data.username) && data.username !== currentUser.username) {
              return [...prev, data.username];
            }
            return prev;
          } else {
            return prev.filter(user => user !== data.username);
          }
        });
      }
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    };

    //  PIN EVENT LISTENERS 
    const handleMessagePinned = (pinnedMessage) => {
      console.log('Group message pinned:', pinnedMessage);
      if (pinnedMessage.room === group.groupId) {
        setMessages(prev => prev.map(msg => 
          msg._id === pinnedMessage._id ? pinnedMessage : msg
        ));
      }
    };

    const handleMessageUnpinned = (unpinnedMessage) => {
      console.log(' Group message unpinned:', unpinnedMessage);
      if (unpinnedMessage.room === group.groupId) {
        setMessages(prev => prev.map(msg => 
          msg._id === unpinnedMessage._id ? unpinnedMessage : msg
        ));
      }
    };

    // listeners
    socket.on('group:message:new', handleGroupMessage);
    socket.on('group:messages:history', handleGroupMessageHistory);
    socket.on('user:typing', handleUserTyping);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:pinned', handleMessagePinned); 
    socket.on('message:unpinned', handleMessageUnpinned); 

    //  request message history
    socket.emit('group:join:room', group.groupId);
    socket.emit('group:messages:get', group.groupId);

    return () => {
      socket.off('group:message:new', handleGroupMessage);
      socket.off('group:messages:history', handleGroupMessageHistory);
      socket.off('user:typing', handleUserTyping);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:pinned', handleMessagePinned); 
      socket.off('message:unpinned', handleMessageUnpinned); 
      socket.emit('group:leave:room', group.groupId);
    };
  }, [socket, group, currentUser]);

  const handleReaction = (messageId, reaction) => {
    const userId = currentUser.userId || currentUser.id;
    
    const message = messages.find(msg => msg._id === messageId);
    const existingReaction = message?.metadata?.reactions?.[userId];

    if (existingReaction === reaction) {
      socket.emit('message:remove-reaction', {
        messageId,
        userId: userId
      });
    } else {
      socket.emit('message:react', {
        messageId,
        reaction,
        userId: userId,
        username: currentUser.username
      });
    }
  };

  
  const handlePinMessage = (messageId) => {
    console.log('Attempting to pin message:', messageId);
    
    const message = messages.find(msg => msg._id === messageId);
    
    if (message?.metadata?.pinned) {
      console.log(' Unpinning message:', messageId);
      socket.emit('message:unpin', { messageId });
    } else {
      console.log(' Pinning message:', messageId);
      socket.emit('message:pin', {
        messageId,
        pinnedBy: currentUser.userId || currentUser.id
      });
    }
  };

  const handleReactionsDetail = (message) => {
    setReactionsModal({
      isOpen: true,
      reactions: message.metadata?.reactions,
      reactionFilter: null
    });
  };

  const closeReactionsModal = () => {
    setReactionsModal({ isOpen: false, reactions: null, reactionFilter: null });
  };

  const renderMessageContent = (message, isOwnMessage) => {
    const messageClasses = isOwnMessage 
      ? "bg-primary text-primary-content rounded-2xl rounded-br-none px-4 py-2 shadow-sm relative"
      : "bg-base-100 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-base-300 relative";

   
    const isPinned = message.metadata?.pinned;

    if (message.type === 'file') {
      return (
        <div className={messageClasses}>
          {/*  PIN INDICATOR */}
          {isPinned && (
            <div className="absolute -top-2 -left-2 text-warning text-sm" title="Pinned message">
              📌
            </div>
          )}
          
          <FileMessage 
            file={message.file}
            currentUser={currentUser}
            messageUser={message.username}
          />
          
          <MessageReactions
            reactions={message.metadata?.reactions}
            currentUserId={currentUser.userId || currentUser.id}
            onReactionClick={(reaction) => handleReaction(message._id, reaction)}
            onReactionsClick={() => handleReactionsDetail(message)}
          />
          
          <div className={`absolute ${
            isOwnMessage ? '-bottom-2 -left-2' : '-bottom-2 -right-2'
          } opacity-0 group-hover:opacity-100 transition-opacity`}>
            <ReactionPicker
              onSelectReaction={(reaction) => handleReaction(message._id, reaction)}
              position="top"
            />
          </div>

          {/*  PIN BUTTON */}
          <div className={`absolute ${
            isOwnMessage ? '-top-2 -left-8' : '-top-2 -right-8'
          } opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button
              className={`btn btn-ghost btn-xs ${isPinned ? 'text-warning' : 'text-base-content/60'}`}
              onClick={() => handlePinMessage(message._id)}
              title={isPinned ? "Unpin message" : "Pin message"}
            >
              {isPinned ? '📌' : '📌'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={messageClasses}>
        {/*  PIN INDICATOR */}
        {isPinned && (
          <div className="absolute -top-2 -left-2 text-warning text-sm" title="Pinned message">
            📌
          </div>
        )}
        
        <p className={isOwnMessage ? "text-white" : "text-base-content"}>
          {message.text}
        </p>
        
        <MessageReactions
          reactions={message.metadata?.reactions}
          currentUserId={currentUser.userId || currentUser.id}
          onReactionClick={(reaction) => handleReaction(message._id, reaction)}
          onReactionsClick={() => handleReactionsDetail(message)}
        />
        
        <div className={`absolute ${
          isOwnMessage ? '-bottom-2 -left-2' : '-bottom-2 -right-2'
        } opacity-0 group-hover:opacity-100 transition-opacity`}>
          <ReactionPicker
            onSelectReaction={(reaction) => handleReaction(message._id, reaction)}
            position="top"
          />
        </div>

        {/* PIN BUTTON */}
        <div className={`absolute ${
          isOwnMessage ? '-top-2 -left-8' : '-top-2 -right-8'
        } opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button
            className={`btn btn-ghost btn-xs ${isPinned ? 'text-warning' : 'text-base-content/60'}`}
            onClick={() => handlePinMessage(message._id)}
            title={isPinned ? "Unpin message" : "Pin message"}
          >
            {isPinned ? '📌' : '📌'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-base-200">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-base-content/60 py-12">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-semibold">No messages yet</p>
          <p className="text-sm mt-2">Start a conversation in {group.name}!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isOwnMessage = message.userId === (currentUser.userId || currentUser.id);
            
            return (
              <div
                key={message._id || message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                data-message-id={message._id}
              >
                {!isOwnMessage && (
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {message.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-base-content/80">
                          {message.username}
                        </span>
                        <time className="text-xs opacity-50">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </time>
                      </div>
                      {renderMessageContent(message, false)}
                    </div>
                  </div>
                )}

                {isOwnMessage && (
                  <div className="flex flex-col items-end max-w-[80%] group">
                    <div className="flex items-center gap-2 mb-1">
                      <time className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </time>
                      <span className="font-semibold text-sm text-base-content/80">
                        You
                      </span>
                    </div>
                    {renderMessageContent(message, true)}
                  </div>
                )}
              </div>
            );
          })}
          
          <TypingIndicator typingUsers={typingUsers} />
        </div>
      )}

      <ReactionsDetailModal
        isOpen={reactionsModal.isOpen}
        onClose={closeReactionsModal}
        reactions={reactionsModal.reactions}
        reactionFilter={reactionsModal.reactionFilter}
      />
    </div>
  );
};

export default GroupMessageList;