import database from '../config/database.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export class UserService {
  constructor() {
    this.db = null;
    this.users = null;
    this.saltRounds = 12;
  }

  async initialize() {
    this.db = database.getDB();
    this.users = this.db.collection('users');
  }

  async ensureInitialized() {
    if (!this.users) {
      await this.initialize();
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async checkUserExists(username, email) {
    await this.ensureInitialized();
    
    const existingUser = await this.users.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        return { exists: true, field: 'username' };
      }
      if (existingUser.email === email.toLowerCase()) {
        return { exists: true, field: 'email' };
      }
    }
    
    return { exists: false };
  }

  //  user with password
  async createUser(userData) {
    await this.ensureInitialized();

    const userId = new ObjectId().toString();
    
    
    const hashedPassword = await this.hashPassword(userData.password);

    const user = {
      userId: userId,
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      password: hashedPassword, 
      socketId: userData.socketId,
      isOnline: true,
      lastSeen: new Date(),
      joinedAt: new Date(),
      profile: {
        avatar: `https://ui-avatars.com/api/?name=${userData.username}&background=2563eb&color=fff`,
        status: 'Online',
        role: 'user'
      }
    };

    await this.users.insertOne(user);
    
    // Don't return password in the user object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Authenticate user with email and password
  async authenticateUser(email, password) {
    await this.ensureInitialized();
    
    const user = await this.users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid password' };
    }

   
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }

  //  Update user password
  async updatePassword(userId, newPassword) {
    await this.ensureInitialized();
    
    const hashedPassword = await this.hashPassword(newPassword);
    
    await this.users.updateOne(
      { userId },
      { $set: { password: hashedPassword } }
    );
    
    return true;
  }

  async setUserOnline(userId, socketId) {
    await this.ensureInitialized();
    
    await this.users.updateOne(
      { userId },
      { 
        $set: { 
          isOnline: true,
          socketId,
          lastSeen: new Date(),
          'profile.status': 'Online'
        } 
      }
    );
    
    console.log(` User ${userId} set online with socket ${socketId}`);
  }

  async setUserOfflineBySocketId(socketId) {
    await this.ensureInitialized();
    
    const user = await this.users.findOne({ socketId });
    
    if (user) {
      await this.users.updateOne(
        { socketId },
        { 
          $set: { 
            isOnline: false,
            socketId: null,
            'profile.status': 'Offline'
          } 
        }
      );
      
      console.log(` User ${user.username} set offline (socket: ${socketId})`);
    }
  }

  async setUserOffline(userId) {
    await this.ensureInitialized();
    
    await this.users.updateOne(
      { userId },
      { 
        $set: { 
          isOnline: false,
          socketId: null,
          'profile.status': 'Offline'
        } 
      }
    );
    
    console.log(` User ${userId} set offline`);
  }

  async getUserById(userId) {
    await this.ensureInitialized();
    const user = await this.users.findOne({ userId });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async getUserByEmail(email) {
    await this.ensureInitialized();
    const user = await this.users.findOne({ email: email.toLowerCase() });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  
  async getOnlineUsers() {
    await this.ensureInitialized();
    const users = await this.users
      .find({ isOnline: true })
      .project({ 
        userId: 1, 
        username: 1, 
        profile: 1, 
        email: 1, 
        isOnline: 1,
        lastSeen: 1
      
      })
      .toArray();
    return users;
  }

  
  async getAllUsers() {
    await this.ensureInitialized();
    const users = await this.users
      .find({})
      .project({ 
        userId: 1, 
        username: 1, 
        email: 1, 
        profile: 1, 
        isOnline: 1, 
        lastSeen: 1,
        joinedAt: 1
        
      })
      .sort({ isOnline: -1, username: 1 })
      .toArray();
    return users;
  }

  //user with password 
  async getUserWithPassword(userId) {
    await this.ensureInitialized();
    return await this.users.findOne({ userId });
  }
}

const userService = new UserService();
export default userService;