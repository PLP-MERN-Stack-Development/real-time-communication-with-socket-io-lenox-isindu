import express from 'express';
import messageService from '../services/messageService.js';

const router = express.Router();

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await messageService.getMessages();
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get recent messages with limit
router.get('/recent/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const messages = await messageService.getRecentMessages(limit);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
});

// Get messages by room/group
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await messageService.getGroupMessages(roomId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room messages' });
  }
});

// Get messages by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await messageService.getUserMessages(userId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
});

// Delete message 
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await messageService.deleteMessage(messageId);
    
    if (result) {
      res.json({ message: 'Message deleted successfully' });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;