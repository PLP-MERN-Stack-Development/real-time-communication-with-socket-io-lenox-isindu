import database from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Group {
  constructor({ name, description, createdBy, isPrivate = false }) {
    this.groupId = new ObjectId().toString();
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.members = [createdBy.userId]; 
    this.admins = [createdBy.userId]; 
    this.isPrivate = isPrivate;
  }

  toJSON() {
    return {
      groupId: this.groupId,
      name: this.name,
      description: this.description,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      members: this.members,
      admins: this.admins,
      isPrivate: this.isPrivate,
      memberCount: this.members.length
    };
  }
}

export class GroupService {
  constructor() {
    this.db = null;
    this.groups = null;
  }

  async initialize() {
    this.db = database.getDB();
    this.groups = this.db.collection('groups');
    
    // Create indexes
    await this.groups.createIndex({ groupId: 1 }, { unique: true });
    await this.groups.createIndex({ members: 1 });
    await this.groups.createIndex({ isPrivate: 1 });
  }

  async ensureInitialized() {
    if (!this.groups) {
      await this.initialize();
    }
  }

  async createGroup(groupData) {
    await this.ensureInitialized();

    const group = new Group(groupData);
    await this.groups.insertOne(group.toJSON());
    
    console.log(` Group created: ${group.name} with ID: ${group.groupId}`);
    return group.toJSON();
  }

  async getGroupById(groupId) {
    await this.ensureInitialized();
    const group = await this.groups.findOne({ groupId });
    
    if (group) {
      return {
        ...group,
        memberCount: group.members.length
      };
    }
    return null;
  }

  async getUserGroups(userId) {
    await this.ensureInitialized();
    const groups = await this.groups
      .find({ members: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return groups.map(group => ({
      ...group,
      memberCount: group.members.length
    }));
  }

  async getPublicGroups() {
    await this.ensureInitialized();
    const groups = await this.groups
      .find({ isPrivate: false })
      .sort({ createdAt: -1 })
      .toArray();
    
    return groups.map(group => ({
      ...group,
      memberCount: group.members.length
    }));
  }

  async getAllGroups() {
    await this.ensureInitialized();
    const groups = await this.groups
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return groups.map(group => ({
      ...group,
      memberCount: group.members.length
    }));
  }

  async addMember(groupId, userId) {
    await this.ensureInitialized();
    const result = await this.groups.updateOne(
      { groupId },
      { $addToSet: { members: userId } }
    );
    
    console.log(`User ${userId} added to group ${groupId}`);
    return result.modifiedCount > 0;
  }

  async removeMember(groupId, userId) {
    await this.ensureInitialized();
    await this.groups.updateOne(
      { groupId },
      { $pull: { members: userId, admins: userId } }
    );
  }

  async isGroupMember(groupId, userId) {
    await this.ensureInitialized();
    const group = await this.groups.findOne({ 
      groupId, 
      members: userId 
    });
    return !!group;
  }

  async isGroupAdmin(groupId, userId) {
    await this.ensureInitialized();
    const group = await this.groups.findOne({ 
      groupId, 
      admins: userId 
    });
    return !!group;
  }

  async getGroupMembers(groupId) {
    await this.ensureInitialized();
    const group = await this.groups.findOne({ groupId });
    return group ? group.members : [];
  }
}

const groupService = new GroupService();
export default groupService;