 Features
 Messaging
Real-time global chat - Instant messaging for all users

Group chats - Create public or private groups

File sharing - Upload and share images, documents, videos

Message reactions - Express with emoji reactions

Pinned messages - Highlight important messages

Typing indicators - See when others are typing

 User Management
User registration & login - Secure authentication

Online presence - Real-time user status

Profile management - User avatars and information

Connection management - Multiple device support

 Groups
Public groups - Open for anyone to join

Private groups - Admin approval required

Group administration - Manage members and permissions

Join requests - Streamlined group access control

 File Management
Multiple file types - Images, PDFs, documents, videos, audio

Secure uploads - Validation and type checking

Automatic cleanup - Expired file removal

Preview support - In-chat file previews

  Stack
Frontend
React 18 - UI framework

Tailwind CSS - Styling and design

Socket.io Client - Real-time communication

DaisyUI - Component library

Context API - State management

Backend
Node.js & Express - Server framework

Socket.io - WebSocket communication

MongoDB - Database

bcryptjs - Password hashing

Multer - File upload handling

getting the appl runing



first have a .env file and sructire it like thid if local testing
 # dev .env
server/.env
MONGODB_URI=mongodb://localhost:27017/dbname
PORT=5000
CLIENT_URL=http://localhost:3000---sample
NODE_ENV=development

    or

 # Production .env
MONGODB_URI=your_production_mongodb_uri
CLIENT_URL=your_frontend_domain
NODE_ENV=production


Prerequisites
Node.js 16+

MongoDB

npm

Install dependencies

# Backend
cd server
npm install

# Frontend  
cd ../client
npm install

Start the application
- Backend
cd server
npm run dev
- Frontend  
cd client
npm run dev