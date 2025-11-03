import { ConnectedUser } from '../models/User.js';
import userService from './userService.js';
import messageService from './messageService.js';

export class SocketService {
  constructor() {
    this.connectedUsers = new Map();
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(' New user connected:', socket.id);

      this.connectedUsers.set(socket.id, new ConnectedUser(socket.id));

      this.handleConnection(socket);
      
      // handlers
      this.setupUserHandlers(socket);
      this.setupMessageHandlers(socket);
      this.setupDisconnectionHandler(socket);
    });
  }

  async handleConnection(socket) {
    // Send welcome message
    socket.emit('welcome', {
      message: 'Welcome to PingHub!  Connect with your team in real-time.',
      userId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Send current user count
    this.broadcastUserUpdate();

    // Send recent messages
    try {
      const messages = await messageService.getRecentMessages();
      socket.emit('messages:history', messages);
    } catch (error) {
      console.error('Error sending initial messages:', error);
    }
  }

  setupUserHandlers(socket) {
    socket.on('user:login', async (userData) => {
      try {
        const connectedUser = this.connectedUsers.get(socket.id);
        if (connectedUser) {
          connectedUser.login(userData);
          
          // Save to database
          await userService.createOrUpdateUser({
            userId: userData.id,
            username: userData.username,
            socketId: socket.id,
            isOnline: true
          });

          // Broadcast user joined
          this.io.emit('user:joined', {
            username: userData.username,
            timestamp: new Date().toISOString()
          });

          // Update online users
          this.broadcastUserUpdate();

          console.log(` User ${userData.username} logged in`);
        }
      } catch (error) {
        console.error('Error handling user login:', error);
        socket.emit('error', { message: 'Login failed' });
      }
    });
  }

  setupMessageHandlers(socket) {
    socket.on('message:send', async (messageData) => {
      try {
        const message = await messageService.createMessage({
          ...messageData,
          socketId: socket.id
        });

        // Broadcast to all clients
        this.io.emit('message:new', message);

        console.log(`Message from ${messageData.username}: ${messageData.text}`);
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

 socket.on("messages:get", async ({ room, userId }) => {
  const user = await userService.getUserById(userId);

  if (!user) {
    console.log("No user found, sending new-user messages only");
    const messages = await messageService.getMessagesForNewUser();
    socket.emit("messages:history", messages);
    return;
  }

  const joinedRecently = new Date(user.joinedAt) > new Date(Date.now() - 60 * 1000);
  const messages = joinedRecently
    ? await messageService.getMessagesForNewUser()
    : await messageService.getRecentMessages(room, 50);

  socket.emit("messages:history", messages);
});


    socket.on('user:typing', (data) => {
      socket.broadcast.emit('user:typing', {
        username: data.username,
        isTyping: data.isTyping
      });
    });
  }

  setupDisconnectionHandler(socket) {
    socket.on('disconnect', async () => {
      const connectedUser = this.connectedUsers.get(socket.id);
      
      if (connectedUser && connectedUser.username) {
        // Update user status in database
        await userService.setUserOffline(connectedUser.userId);

        // Broadcast user left
        this.io.emit('user:left', {
          username: connectedUser.username,
          timestamp: new Date().toISOString()
        });
      }

      this.connectedUsers.delete(socket.id);
      this.broadcastUserUpdate();

      console.log(' User disconnected:', socket.id);
    });
  }

  broadcastUserUpdate() {
    const onlineUsers = Array.from(this.connectedUsers.values())
      .filter(user => user.username)
      .map(user => user.toJSON());

    this.io.emit('users:update', {
      count: onlineUsers.length,
      users: onlineUsers
    });
  }

  getConnectedUsersCount() {
    return Array.from(this.connectedUsers.values()).filter(user => user.username).length;
  }
}

export default new SocketService();