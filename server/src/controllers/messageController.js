import messageService from '../services/messageService.js';
import groupService from '../services/groupService.js';




class MessageController {
  constructor(io, connectedUsers) {
    this.io = io;
    this.connectedUsers = connectedUsers;
  }

 
  async handleSendMessage(socket, messageData) {
    try {
      console.log('Saving global message:', {
        user: messageData.username,
        text: messageData.text
      });

      const message = await messageService.createMessage({
        ...messageData,
        socketId: socket.id,
        room: 'global'
      });
      this.io.emit('message:new', message);

      console.log(`Message from ${messageData.username}: ${messageData.text}`);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }
  //  HISTORY - GLOBAL
async handleGetMessages(socket, room = 'global') {
  try {
    console.log('Client requested message history for room:', room);
    
    const user = this.connectedUsers.get(socket.id);
    if (user && !user.joinedAt) {
      console.log(' Blocking messages for new user:', user.username);
      
      socket.emit('messages:history', []);
      return;
    }
    
    const messages = await messageService.getRecentMessages(50, room);
    console.log(`Sending ${messages.length} messages to client`);
    socket.emit('messages:history', messages);
  } catch (error) {
    console.error(' History error:', error);
    socket.emit('error', { message: 'Failed to load message history' });
  }
}

  // GROUP MESSAGE SEND
async handleGroupMessageSend(socket, messageData) {
  try {
    console.log('group:message:send received:', {
      groupId: messageData.groupId,
      userId: messageData.userId,
      username: messageData.username,
      type: messageData.type,
      hasFile: !!messageData.file,
      fileData: messageData.file,
      text: messageData.text,
      fullData: messageData
    });

    const { groupId, userId, username } = messageData;
    
    console.log(' Group message attempt:', {
      groupId: groupId,
      userId: userId,
      username: username,
      text: messageData.text,
      type: messageData.type,
      file: messageData.file
    });

    // Check if user is member of the group
    const isMember = await groupService.isGroupMember(groupId, userId);
    if (!isMember) {
      console.log('User not member of group:', { userId, groupId, username });
      socket.emit('group:error', { 
        message: `You are not a member of this group. Please join the group first.` 
      });
      return;
    }

    console.log('User is member, creating message...');

    
    const message = await messageService.createMessage({
      ...messageData, 
      room: groupId,
      type: messageData.type || 'group' 
    });

    console.log(' Message created, broadcasting to group:', groupId);

   
    this.io.to(groupId).emit('group:message:new', message);
    
    console.log(`Group message from ${username} in ${groupId}: ${message.text}`);
  } catch (error) {
    console.error(' Group message error:', error);
    socket.emit('error', { message: 'Failed to send group message' });
  }
}
 
//  HISTORY FOR GROUPS
async handleGetGroupMessages(socket, groupId) {
  try {
    console.log(' Client requested group message history for:', groupId);
    
    
    const user = this.connectedUsers.get(socket.id);
    
    if (!user) {
      console.log(' User not found for group message request');
      return;
    }

    // Check if user is member of the group
    const isMember = await groupService.isGroupMember(groupId, user.userId);
    if (!isMember) {
      console.log('User not member of group, cannot fetch messages');
      socket.emit('group:error', { message: 'You are not a member of this group' });
      return;
    }

    const messages = await messageService.getGroupMessages(groupId);
    console.log(` Sending ${messages.length} group messages to client for group ${groupId}`);
    socket.emit('group:messages:history', messages);
    
  } catch (error) {
    console.error('Group history error:', error);
    socket.emit('error', { message: 'Failed to load group messages' });
  }
}
  // TYPING INDICATOR
  handleTypingIndicator(socket, data) {
    console.log(' Typing indicator received:', {
      username: data.username,
      isTyping: data.isTyping,
      room: data.room,
      socketId: socket.id
    });

    if (data.room && data.room !== 'global') {
      // Group typing indicator
      console.log(` Sending typing indicator to group ${data.room}`);
      socket.to(data.room).emit('user:typing', data);
      console.log(` Typing event sent to group ${data.room}`);
    } else {
      // Global typing indicator
      console.log('Sending typing indicator to global chat');
      socket.broadcast.emit('user:typing', data);
    }
  }

  //  REACTION TO MESSAGE
async handleAddReaction(socket, data) {
  try {
    const { messageId, reaction, userId, username } = data;
    
    console.log(' Adding reaction:', {
      messageId,
      reaction,
      userId,
      username
    });

    // Validate required fields
    if (!userId) {
      console.error(' User ID is missing in reaction data');
      socket.emit('error', { message: 'User authentication error. Please refresh and try again.' });
      return;
    }

    const updatedMessage = await messageService.addReaction(messageId, userId, reaction);
    
    if (updatedMessage) {
      
      this.io.emit('message:updated', updatedMessage);
      console.log(`Reaction ${reaction} added to message by ${username}`);
    } else {
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  } catch (error) {
    console.error(' Reaction error:', error);
    socket.emit('error', { message: 'Failed to add reaction: ' + error.message });
  }
}
  // REMOVE REACTION FROM MESSAGE
  async handleRemoveReaction(socket, data) {
    try {
      const { messageId, userId } = data;
      
      console.log(' Removing reaction:', { messageId, userId });

      const updatedMessage = await messageService.removeReaction(messageId, userId);
      
      if (updatedMessage) {
        
        this.io.emit('message:updated', updatedMessage);
        console.log(` Reaction removed from message by user ${userId}`);
      } else {
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    } catch (error) {
      console.error(' Remove reaction error:', error);
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  }

  // FILE UPLOAD NOTIFICATION
  handleFileUpload(socket, fileData) {
    try {
      console.log('File upload notification:', fileData);
      
      
      if (fileData.room && fileData.room !== 'global') {
        socket.to(fileData.room).emit('file:new', fileData);
      } else {
        socket.broadcast.emit('file:new', fileData);
      }
      
      console.log(`File uploaded by ${fileData.username}: ${fileData.originalName}`);
    } catch (error) {
      console.error('File notification error:', error);
    }
  }
// PIN MESSAGE
async handlePinMessage(socket, data) {
  try {
    const { messageId, pinnedBy } = data;
    
    console.log(' Pin message request:', { messageId, pinnedBy });

    const updatedMessage = await messageService.pinMessage(messageId, pinnedBy);
    
    if (updatedMessage) {
      
      this.io.to(updatedMessage.room).emit('message:pinned', updatedMessage);
      console.log(`Message pinned by ${pinnedBy} in room ${updatedMessage.room}`);
    } else {
      socket.emit('error', { message: 'Failed to pin message' });
    }
  } catch (error) {
    console.error('Pin message error:', error);
    socket.emit('error', { message: 'Failed to pin message' });
  }
}

// UNPIN MESSAGE
async handleUnpinMessage(socket, data) {
  try {
    const { messageId } = data;
    
    console.log(' Unpin message request:', { messageId });

    const updatedMessage = await messageService.unpinMessage(messageId);
    
    if (updatedMessage) {
      
      this.io.to(updatedMessage.room).emit('message:unpinned', updatedMessage);
      console.log(`Message unpinned in room ${updatedMessage.room}`);
    } else {
      socket.emit('error', { message: 'Failed to unpin message' });
    }
  } catch (error) {
    console.error(' Unpin message error:', error);
    socket.emit('error', { message: 'Failed to unpin message' });
  }
}

// PINNED MESSAGES
async handleGetPinnedMessages(socket, room) {
  try {
    console.log('Getting pinned messages for room:', room);
    
    const pinnedMessages = await messageService.getPinnedMessages(room);
    socket.emit('pinned:messages:list', pinnedMessages);
    
    console.log(`Sent ${pinnedMessages.length} pinned messages to client`);
  } catch (error) {
    console.error(' Get pinned messages error:', error);
    socket.emit('error', { message: 'Failed to get pinned messages' });
  }
}
registerSocketEvents(socket) {
  // Global messages
  socket.on('message:send', (messageData) =>
    this.handleSendMessage(socket, messageData)
  );

  socket.on('messages:get', (payload) => {
    const room = typeof payload === 'string' ? payload : payload?.room || 'global';
    this.handleGetMessages(socket, room); 
  });

  //  Group messages
  socket.on('group:message:send', (messageData) =>
    this.handleGroupMessageSend(socket, messageData)
  );

  socket.on('group:messages:get', (groupId) =>
    this.handleGetGroupMessages(socket, groupId)
  );

  // Typing indicator
  socket.on('user:typing', (data) =>
    this.handleTypingIndicator(socket, data)
  );

  //  Reactions
  socket.on('message:react', (data) =>
    this.handleAddReaction(socket, data)
  );
  socket.on('message:remove-reaction', (data) =>
    this.handleRemoveReaction(socket, data)
  );

  // File upload notifications
  socket.on('file:uploaded', (fileData) =>
    this.handleFileUpload(socket, fileData)
  );


  socket.on('message:pin', (data) =>
    this.handlePinMessage(socket, data)
  );
  socket.on('message:unpin', (data) =>
    this.handleUnpinMessage(socket, data)
  );
  socket.on('pinned:messages:get', (room) =>
    this.handleGetPinnedMessages(socket, room)
  );
}

}

export default MessageController;