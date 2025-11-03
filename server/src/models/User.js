export class User {
  constructor({ userId, username, socketId, isOnline = true }) {
    this.userId = userId;
    this.username = username;
    this.socketId = socketId;
    this.isOnline = isOnline;
    this.joinedAt = new Date();
    this.lastSeen = new Date();
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      socketId: this.socketId,
      isOnline: this.isOnline,
      joinedAt: this.joinedAt,
      lastSeen: this.lastSeen
    };
  }
}

export class ConnectedUser {
  constructor(socketId) {
    this.socketId = socketId;
    this.connectedAt = new Date();
    this.username = null;
    this.userId = null;
  }

  login(userData) {
    this.username = userData.username;
    this.userId = userData.id;
    this.lastSeen = new Date();
  }

  toJSON() {
    return {
      socketId: this.socketId,
      username: this.username,
      userId: this.userId,
      connectedAt: this.connectedAt,
      lastSeen: this.lastSeen
    };
  }
}