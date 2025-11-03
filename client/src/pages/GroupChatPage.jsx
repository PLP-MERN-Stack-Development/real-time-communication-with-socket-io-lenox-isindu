// GroupChatPage.jsx
import React, { useEffect } from 'react';
import GroupMessageList from '../components/GroupChat/GroupMessageList';
import GroupMessageInput from '../components/GroupChat/GroupMessageInput';
import GroupSidebar from '../components/GroupChat/GroupSidebar';
import { useSocket } from '../hooks/useSocket';

const GroupChatPage = ({ currentUser, currentGroup, onBack }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = React.useState([]);

  
  useEffect(() => {
    if (!socket || !currentGroup) return;

    console.log(' GroupChatPage mounted for group:', currentGroup.groupId);

    const handleGroupMessage = (message) => {
      if (message.room === currentGroup.groupId) {
        console.log(' New group message received:', message);
        setMessages(prev => [...prev, message]);
      }
    };

    const handleGroupMessageHistory = (history) => {
      console.log('Group message history received:', history.length, 'messages');
      setMessages(history);
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (updatedMessage.room === currentGroup.groupId) {
        setMessages(prev => prev.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      }
    };

    socket.on('group:message:new', handleGroupMessage);
    socket.on('group:messages:history', handleGroupMessageHistory);
    socket.on('message:updated', handleMessageUpdated);

    // Join group room and request message history
    socket.emit('group:join:room', currentGroup.groupId);
    socket.emit('group:messages:get', currentGroup.groupId);

    return () => {
      socket.off('group:message:new', handleGroupMessage);
      socket.off('group:messages:history', handleGroupMessageHistory);
      socket.off('message:updated', handleMessageUpdated);
      socket.emit('group:leave:room', currentGroup.groupId);
    };
  }, [socket, currentGroup]); 

  // Filter messages for this specific group
  const groupMessages = messages.filter(msg => msg.room === currentGroup.groupId);

  console.log('GroupChatPage Debug:', {
    groupId: currentGroup.groupId,
    allMessages: messages.length,
    groupMessages: groupMessages.length,
    groupFiles: groupMessages.filter(msg => msg.type === 'file').length
  });

  return (
    <div className="flex h-screen bg-base-200">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn btn-ghost btn-sm">
              ← Back
            </button>
            <div>
              <h2 className="font-bold text-lg">{currentGroup.name}</h2>
              <p className="text-sm text-base-content/60">
                {currentGroup.isPrivate ? '🔒 Private Group' : '🏠 Public Group'} • 
                {groupMessages.length} messages
              </p>
            </div>
          </div>
        </div>

        {/* Message List */}
        <GroupMessageList 
          currentUser={currentUser} 
          group={currentGroup}
          messages={messages}
          setMessages={setMessages}
        />

        {/* Message Input */}
        <GroupMessageInput 
          currentUser={currentUser} 
          group={currentGroup}
        />
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-base-100 border-l border-base-300">
        <GroupSidebar 
          group={currentGroup}
          currentUser={currentUser}
          messages={groupMessages}
        />
      </div>
    </div>
  );
};

export default GroupChatPage;