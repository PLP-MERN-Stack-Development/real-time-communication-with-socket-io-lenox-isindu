export const UserSchema = {
  userId: String,       
  username: String,      
  email: String,       
  socketId: String,      
  isOnline: Boolean,     
  lastSeen: Date,       
  joinedAt: Date,        
  profile: {             
    avatar: String,     
    status: String,      
    role: String         
  }
};

export const MessageSchema = {
  _id: Object,           
  userId: String,        
  username: String,      
  text: String,         
  room: String,          
  timestamp: Date,       
  type: String,          
  metadata: {            
    repliedTo: String,   
    reactions: Object,   
    edited: Boolean      
  }
};

export const RoomSchema = {
  name: String,          
  description: String,   
  createdBy: String,     
  createdAt: Date,       
  members: Array,        
  isPrivate: Boolean,    
  settings: {            
    allowFiles: Boolean,
    maxFileSize: Number,
    allowedTypes: Array
  }
};