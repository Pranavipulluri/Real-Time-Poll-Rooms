require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Get client IP helper
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress;
};

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-app';
mongoose.connect(MONGODB_URI)
.then(() => console.log('✓ MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Create poll
app.post('/api/polls', async (req, res) => {
  try {
    const { question, options } = req.body;

    // Validation
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ 
        error: 'Question and at least 2 options are required' 
      });
    }

    // Generate unique ID
    const pollId = crypto.randomBytes(6).toString('hex');

    // Create poll with vote counts initialized to 0
    const poll = new Poll({
      id: pollId,
      question: question.trim(),
      options: options.map(opt => ({
        text: opt.trim(),
        votes: 0
      })),
      voterIPs: []
    });

    await poll.save();

    res.status(201).json({
      success: true,
      pollId: poll.id,
      shareLink: `${req.protocol}://${req.get('host')}/poll/${poll.id}`
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Get poll by ID
app.get('/api/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({ id: req.params.id });
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if this IP has already voted
    const clientIP = getClientIP(req);
    const hasVoted = poll.voterIPs.includes(clientIP);

    res.json({
      id: poll.id,
      question: poll.question,
      options: poll.options,
      hasVoted,
      createdAt: poll.createdAt
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Vote on poll
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const pollId = req.params.id;
    const clientIP = getClientIP(req);

    // Find poll
    const poll = await Poll.findOne({ id: pollId });
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Validate option index
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Anti-abuse Mechanism #2: IP-based restriction
    if (poll.voterIPs.includes(clientIP)) {
      return res.status(403).json({ 
        error: 'You have already voted on this poll',
        hasVoted: true
      });
    }

    // Update vote count
    poll.options[optionIndex].votes += 1;
    poll.voterIPs.push(clientIP);
    await poll.save();

    // Emit real-time update to all connected clients
    io.to(pollId).emit('pollUpdate', {
      id: poll.id,
      question: poll.question,
      options: poll.options
    });

    res.json({
      success: true,
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options
      }
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join poll room
  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined poll: ${pollId}`);
  });

  // Leave poll room
  socket.on('leavePoll', (pollId) => {
    socket.leave(pollId);
    console.log(`Socket ${socket.id} left poll: ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
