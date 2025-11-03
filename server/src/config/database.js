import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinghub';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      
      console.log('Connected to MongoDB:', this.db.databaseName);
      
      
      await this.initializeCollections();
      
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async initializeCollections() {
    try {
      // Create messages collection if it doesn't exist
      const collections = await this.db.listCollections().toArray();
      const messagesCollectionExists = collections.some(c => c.name === 'messages');
      
      if (!messagesCollectionExists) {
        await this.db.createCollection('messages');
        console.log(' Created messages collection');
      }

      // Create indexes
      await this.db.collection('messages').createIndex({ timestamp: -1 });
      await this.db.collection('messages').createIndex({ room: 1 });
      await this.db.collection('messages').createIndex({ userId: 1 });
      
      console.log(' Database indexes created');
    } catch (error) {
      console.error('Error initializing collections:', error);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getDB() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

// Create single instance
const database = new Database();
export default database;