export class Group {
  constructor({ name, description, createdBy, isPrivate = false }) {
    this.groupId = new Date().getTime().toString();
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.members = [createdBy]; 
    this.admins = [createdBy]; 
    this.isPrivate = isPrivate;
    this.settings = {
      allowFiles: true,
      maxFileSize: 10, 
      allowedTypes: ['image', 'document', 'video']
    };
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
      settings: this.settings
    };
  }
}