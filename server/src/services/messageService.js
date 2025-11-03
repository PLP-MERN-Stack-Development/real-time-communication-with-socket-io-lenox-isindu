import database from '../config/database.js';
import { ObjectId } from 'mongodb';

export class MessageService {
  constructor() {
    this.db = null;
    this.messages = null;
  }

  async initialize() {
    this.db = database.getDB();
    this.messages = this.db.collection('messages');
    
    //  indexes 
    await this.messages.createIndex({ timestamp: -1 });
    await this.messages.createIndex({ room: 1 });
    await this.messages.createIndex({ userId: 1 });
  }

  async ensureInitialized() {
    if (!this.messages) {
      await this.initialize();
    }
  }

  // convert ID to proper format for queries
  convertId(id) {
    try {
    
      if (ObjectId.isValid(id)) {
        return new ObjectId(id);
      }
      // Fallback to original ID (for other ID types)
      return id;
    } catch (error) {
      return id;
    }
  }

  async createMessage(messageData) {
  await this.ensureInitialized();

  const message = {
    _id: new ObjectId(),
    userId: messageData.userId,
    username: messageData.username,
    text: messageData.text,
    room: messageData.room || messageData.groupId || 'global',
    timestamp: new Date(),
    type: messageData.type || 'text',
    socketId: messageData.socketId,
    metadata: {
      repliedTo: messageData.repliedTo || null,
      reactions: {},
      edited: false,
      lastUpdated: new Date()
    }
  };

  
  if (messageData.type === 'file' && messageData.file) {
    console.log('Creating FILE message with data:', {
      filename: messageData.file.filename,
      originalName: messageData.file.originalName,
      fullFileData: messageData.file
    });
    
    message.file = { ...messageData.file }; 
    message.type = 'file';
    message.text = messageData.text || '';
    
  } else if (messageData.type === 'file') {
    console.log(' File message but NO file data!', {
      type: messageData.type,
      hasFile: !!messageData.file,
      messageData: messageData
    });
  }

  console.log('Saving message to database:', {
    id: message._id.toString(),
    userId: message.userId,
    username: message.username,
    room: message.room,
    type: message.type,
    hasFile: !!message.file,
    fileOriginalName: message.file?.originalName,
    text: message.text
  });

  try {
    const result = await this.messages.insertOne(message);
    console.log(' Message saved to database with ID:', result.insertedId);
    console.log('  Final message saved:', {
      _id: message._id,
      type: message.type,
      hasFile: !!message.file,
      file: message.file
    });
    return message;
  } catch (error) {
    console.error(' [DEBUG SERVICE] Error saving message to database:', error);
    throw error;
  }
}

  async getRecentMessages(limit = 50, room = 'global') {
    await this.ensureInitialized();
    
    console.log('Fetching recent messages for room:', room, 'limit:', limit);
    
    try {
      const messages = await this.messages
        .find({ room })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      console.log(` Found ${messages.length} messages for room: ${room}`);
      return messages.reverse();
    } catch (error) {
      console.error(' Error fetching messages:', error);
      return [];
    }
  }

  async getGroupMessages(groupId, limit = 50) {
    await this.ensureInitialized();
    
    console.log(' Fetching group messages for group:', groupId);
    
    try {
      const messages = await this.messages
        .find({ room: groupId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      console.log(`Found ${messages.length} messages for group: ${groupId}`);
      return messages.reverse();
    } catch (error) {
      console.error(' Error fetching group messages:', error);
      return [];
    }
  }

  async getMessageHistory(limit = 50) {
    return this.getRecentMessages(limit, 'global');
  }

  async getMessages(room = 'global', limit = 50) {
    return this.getRecentMessages(limit, room);
  }

  async getMessageById(messageId) {
    await this.ensureInitialized();
    try {
      const queryId = this.convertId(messageId);
      return await this.messages.findOne({ _id: queryId });
    } catch (error) {
      console.error('Error finding message by ID:', error);
      return null;
    }
  }

  
  async getAllMessages() {
    await this.ensureInitialized();
    return await this.messages.find({}).sort({ timestamp: 1 }).toArray();
  }

  // ADD REACTION TO MESSAGE
  async addReaction(messageId, userId, reaction) {
    await this.ensureInitialized();
    
    try {
      console.log(' Adding reaction to message:', { messageId, userId, reaction });
      
      
      if (!userId) {
        throw new Error('User ID is required to add reaction');
      }

      const queryId = this.convertId(messageId);
      
      const result = await this.messages.findOneAndUpdate(
        { _id: queryId },
        { 
          $set: { 
            [`metadata.reactions.${userId}`]: reaction,
            'metadata.lastUpdated': new Date()
          } 
        },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        throw new Error(`Message with ID ${messageId} not found`);
      }
      
      console.log('Reaction added successfully');
      return result;
    } catch (error) {
      console.error(' Error adding reaction:', error);
      throw error;
    }
  }

  // REMOVE REACTION FROM MESSAGE
  async removeReaction(messageId, userId) {
    await this.ensureInitialized();
    
    try {
      console.log(' Removing reaction from message:', { messageId, userId });
      
      if (!userId) {
        throw new Error('User ID is required to remove reaction');
      }

      const queryId = this.convertId(messageId);
      
      const result = await this.messages.findOneAndUpdate(
        { _id: queryId },
        { 
          $unset: { 
            [`metadata.reactions.${userId}`]: "" 
          },
          $set: {
            'metadata.lastUpdated': new Date()
          }
        },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        throw new Error(`Message with ID ${messageId} not found`);
      }
      
      console.log('Reaction removed successfully');
      return result;
    } catch (error) {
      console.error(' Error removing reaction:', error);
      throw error;
    }
  }

  // UPDATE MESSAGE
  async updateMessage(messageId, updates) {
    await this.ensureInitialized();
    
    try {
      const queryId = this.convertId(messageId);
      const result = await this.messages.findOneAndUpdate(
        { _id: queryId },
        { 
          $set: {
            ...updates,
            'metadata.lastUpdated': new Date(),
            'metadata.edited': true
          }
        },
        { returnDocument: 'after' }
      );
      
      return result;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  // DELETE MESSAGE
  async deleteMessage(messageId) {
    await this.ensureInitialized();
    
    try {
      const queryId = this.convertId(messageId);
      const result = await this.messages.deleteOne({ _id: queryId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // GET USER MESSAGES
  async getUserMessages(userId, limit = 50) {
    await this.ensureInitialized();
    
    try {
      const messages = await this.messages
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching user messages:', error);
      return [];
    }
  }
// PIN MESSAGE
async pinMessage(messageId, pinnedBy) {
  await this.ensureInitialized();
  
  try {
    console.log(' Pinning message:', { messageId, pinnedBy });
    
    const result = await this.messages.findOneAndUpdate(
      { _id: this.convertId(messageId) },
      { 
        $set: { 
          'metadata.pinned': true,
          'metadata.pinnedBy': pinnedBy,
          'metadata.pinnedAt': new Date(),
          'metadata.lastUpdated': new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    console.log(' Message pinned successfully');
    return result;
  } catch (error) {
    console.error(' Error pinning message:', error);
    throw error;
  }
}

// UNPIN MESSAGE
async unpinMessage(messageId) {
  await this.ensureInitialized();
  
  try {
    console.log('Unpinning message:', messageId);
    
    const result = await this.messages.findOneAndUpdate(
      { _id: this.convertId(messageId) },
      { 
        $unset: { 
          'metadata.pinned': "",
          'metadata.pinnedBy': "",
          'metadata.pinnedAt': ""
        },
        $set: {
          'metadata.lastUpdated': new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    console.log('Message unpinned successfully');
    return result;
  } catch (error) {
    console.error(' Error unpinning message:', error);
    throw error;
  }
}

// GET PINNED MESSAGES
async getPinnedMessages(room, limit = 10) {
  await this.ensureInitialized();
  
  try {
    const messages = await this.messages
      .find({ 
        room: room,
        'metadata.pinned': true 
      })
      .sort({ 'metadata.pinnedAt': -1 })
      .limit(limit)
      .toArray();
    
    console.log(` Found ${messages.length} pinned messages for room: ${room}`);
    return messages;
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    return [];
  }
}

async getRecentMessagesWithFilter(limit = 50, room = 'global', userJoinDate = null) {
  await this.ensureInitialized();
  
  console.log('Fetching filtered messages for room:', room, 'user joined:', userJoinDate);
  
  try {
    
    const query = { room };
    if (userJoinDate) {
      query.timestamp = { $gte: new Date(userJoinDate) };
    }
    
    const messages = await this.messages
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    console.log(` Found ${messages.length} filtered messages for room: ${room}`);
    return messages.reverse();
  } catch (error) {
    console.error('Error fetching filtered messages:', error);
    return [];
  }
}

// GET GROUP MESSAGES
async getGroupMessagesWithFilter(groupId, limit = 50, userJoinDate = null) {
  await this.ensureInitialized();
  
  console.log(' Fetching filtered group messages for group:', groupId, 'user joined:', userJoinDate);
  
  try {
    
    const query = { room: groupId };
    if (userJoinDate) {
      query.timestamp = { $gte: new Date(userJoinDate) };
    }
    
    const messages = await this.messages
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    console.log(` Found ${messages.length} filtered messages for group: ${groupId}`);
    return messages.reverse();
  } catch (error) {
    console.error(' Error fetching filtered group messages:', error);
    return [];
  }
}


async getMessagesForNewUser(limit = 20) {
  await this.ensureInitialized();
  
  try {
    // Get pinned messages first
    const pinnedMessages = await this.getPinnedMessages('global', 10);
    
    // Get very recent messages 
    const recentMessages = await this.getRecentMessages(5, 'global');
    
    
    const allMessages = [...pinnedMessages, ...recentMessages];
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => m._id.toString() === message._id.toString())
    );
    
    console.log(`New user messages - Pinned: ${pinnedMessages.length}, Recent: ${recentMessages.length}, Total: ${uniqueMessages.length}`);
    return uniqueMessages.slice(0, limit);
  } catch (error) {
    console.error(' Error getting messages for new user:', error);
    return [];
  }
}
  //  Convert old timestamp IDs to ObjectIds
  async migrateOldMessages() {
    await this.ensureInitialized();
    
    try {
      const messages = await this.messages.find({}).toArray();
      let migratedCount = 0;
      
      for (const message of messages) {
        // Check if _id is a timestamp string 
        if (typeof message._id === 'string' && /^\d+$/.test(message._id)) {
          const newId = new ObjectId();
          await this.messages.deleteOne({ _id: message._id });
          
          message._id = newId;
          await this.messages.insertOne(message);
          
          migratedCount++;
        }
      }
      
      console.log(`Migrated ${migratedCount} messages to ObjectId format`);
      return migratedCount;
    } catch (error) {
      console.error('Error migrating messages:', error);
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;