const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active rooms and participants
const rooms = new Map();
const participants = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    totalParticipants: participants.size
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, userId, userName, isHost } = data;
    
    console.log(`${userName} (${userId}) joining room ${roomId} as ${isHost ? 'host' : 'participant'}`);
    
    // Join the socket room
    socket.join(roomId);
    
    // Store participant info
    participants.set(socket.id, {
      userId,
      userName,
      roomId,
      isHost,
      socketId: socket.id
    });
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        participants: new Map(),
        host: isHost ? userId : null,
        createdAt: new Date().toISOString()
      });
    }
    
    const room = rooms.get(roomId);
    room.participants.set(userId, {
      userId,
      userName,
      socketId: socket.id,
      isHost,
      joinedAt: new Date().toISOString(),
      permissions: {
        canSpeak: true,
        canShareScreen: false, // Default to false, host can enable
        isForceMuted: false
      }
    });
    
    // Notify existing participants about new user
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      isHost,
      participants: Array.from(room.participants.values())
    });
    
    // Send current participants to the new user
    socket.emit('room-participants', {
      participants: Array.from(room.participants.values())
    });
    
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);
  });

  // Handle leaving a room
  socket.on('leave-room', (data) => {
    const { roomId, userId } = data;
    handleUserLeaving(socket, roomId, userId);
  });

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    const { roomId, targetUserId, signal, type } = data;
    
    // Find target user's socket
    const room = rooms.get(roomId);
    if (room && room.participants.has(targetUserId)) {
      const targetParticipant = room.participants.get(targetUserId);
      
      socket.to(targetParticipant.socketId).emit('receive-signal', {
        fromUserId: participants.get(socket.id)?.userId,
        signal,
        type
      });
    }
  });

  // Handle chat messages
  socket.on('chat-message', (messageData) => {
    const { roomId } = messageData;
    
    // Broadcast message to all participants in the room
    socket.to(roomId).emit('chat-message', messageData);
    
    console.log(`Chat message in room ${roomId}: ${messageData.message}`);
  });

  // Handle media state changes (mute/unmute, video on/off)
  socket.on('media-changed', (data) => {
    const { roomId, userId, isAudioMuted, isVideoOff } = data;
    
    // Broadcast media state change to other participants
    socket.to(roomId).emit('user-media-changed', {
      userId,
      isAudioMuted,
      isVideoOff
    });
    
    console.log(`User ${userId} media changed: audio=${isAudioMuted ? 'muted' : 'unmuted'}, video=${isVideoOff ? 'off' : 'on'}`);
  });

  // Handle ending a room (host only)
  socket.on('end-room', (data) => {
    const { roomId } = data;
    const participant = participants.get(socket.id);
    
    if (participant && participant.isHost) {
      console.log(`Host ending room ${roomId}`);
      
      // Notify all participants that room is ending
      socket.to(roomId).emit('room-ended', { roomId });
      
      // Remove room
      rooms.delete(roomId);
      
      // Remove all participants from this room
      for (const [socketId, p] of participants.entries()) {
        if (p.roomId === roomId) {
          participants.delete(socketId);
        }
      }
    }
  });

  // Handle screen sharing
  socket.on('screen-share-started', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user-screen-share-started', { userId });
  });

  socket.on('screen-share-stopped', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user-screen-share-stopped', { userId });
  });

  // Participant Management Events (Host only)
  socket.on('kick-participant', (data) => {
    const { roomId, participantId, hostId } = data;

    // Verify the sender is the host
    const room = rooms.get(roomId);
    if (!room) return;

    const hostParticipant = room.participants.get(hostId);
    if (!hostParticipant || !hostParticipant.isHost) {
      console.log('Unauthorized kick attempt');
      return;
    }

    // Find the participant to kick
    const participantToKick = room.participants.get(participantId);
    if (participantToKick) {
      // Notify the participant they were kicked
      io.to(participantToKick.socketId).emit('participant-kicked', {
        participantId,
        reason: 'Removed by host'
      });

      // Notify other participants
      socket.to(roomId).emit('participant-kicked', {
        participantId
      });

      // Remove from room
      handleUserLeaving(null, roomId, participantId);

      console.log(`Participant ${participantId} kicked from room ${roomId} by host ${hostId}`);
    }
  });

  socket.on('force-mute-participant', (data) => {
    const { roomId, participantId, mute, hostId } = data;

    // Verify the sender is the host
    const room = rooms.get(roomId);
    if (!room) return;

    const hostParticipant = room.participants.get(hostId);
    if (!hostParticipant || !hostParticipant.isHost) {
      console.log('Unauthorized mute attempt');
      return;
    }

    // Find the participant to mute/unmute
    const participantToMute = room.participants.get(participantId);
    if (participantToMute) {
      // Notify the participant
      io.to(participantToMute.socketId).emit('force-muted', {
        participantId,
        mute
      });

      // Notify other participants
      socket.to(roomId).emit('force-muted', {
        participantId,
        mute
      });

      console.log(`Participant ${participantId} ${mute ? 'muted' : 'unmuted'} by host ${hostId}`);
    }
  });

  socket.on('update-participant-permissions', (data) => {
    const { roomId, participantId, permissions, hostId } = data;

    // Verify the sender is the host
    const room = rooms.get(roomId);
    if (!room) return;

    const hostParticipant = room.participants.get(hostId);
    if (!hostParticipant || !hostParticipant.isHost) {
      console.log('Unauthorized permission update attempt');
      return;
    }

    // Find the participant to update
    const participantToUpdate = room.participants.get(participantId);
    if (participantToUpdate) {
      // Update permissions in room data
      participantToUpdate.permissions = {
        ...participantToUpdate.permissions,
        ...permissions
      };

      // Notify the participant
      io.to(participantToUpdate.socketId).emit('permissions-updated', {
        participantId,
        permissions
      });

      // Notify other participants
      socket.to(roomId).emit('permissions-updated', {
        participantId,
        permissions
      });

      console.log(`Permissions updated for participant ${participantId} by host ${hostId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const participant = participants.get(socket.id);
    if (participant) {
      handleUserLeaving(socket, participant.roomId, participant.userId);
    }
  });

  // Helper function to handle user leaving
  function handleUserLeaving(socket, roomId, userId) {
    console.log(`User ${userId} leaving room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (room) {
      // Remove participant from room
      room.participants.delete(userId);
      
      // Notify other participants
      socket.to(roomId).emit('user-left', {
        userId,
        participants: Array.from(room.participants.values())
      });
      
      // If room is empty or host left, clean up
      if (room.participants.size === 0 || (room.host === userId)) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
      }
    }
    
    // Remove from participants map
    participants.delete(socket.id);
    
    // Leave socket room
    socket.leave(roomId);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Video conferencing server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
