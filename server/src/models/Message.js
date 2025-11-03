export class Message {
  constructor({ username, userId, text, socketId }) {
    this._id = null;
    this.username = username;
    this.userId = userId;
    this.text = text;
    this.socketId = socketId;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      _id: this._id,
      username: this.username,
      userId: this.userId,
      text: this.text,
      socketId: this.socketId,
      timestamp: this.timestamp
    };
  }
}