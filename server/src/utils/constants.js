export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User events
  USER_LOGIN: 'user:login',
  USER_TYPING: 'user:typing',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USERS_UPDATE: 'users:update',
  
  // Message events
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGES_GET: 'messages:get',
  MESSAGES_HISTORY: 'messages:history',
  
  // System events
  WELCOME: 'welcome',
  ERROR: 'error'
};

export const DATABASE_CONFIG = {
  URL: 'mongodb://localhost:27017',
  NAME: 'pinghub'
};

export const MESSAGE_LIMITS = {
  RECENT: 50,
  HISTORY: 100
};