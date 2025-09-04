# FYP Video Conferencing Server

This is the Socket.IO server for the FYP video conferencing system. It handles real-time communication, WebRTC signaling, and room management.

## Features

- 🏠 **Room Management**: Create, join, and leave video rooms
- 🔄 **WebRTC Signaling**: Peer-to-peer connection establishment
- 💬 **Real-time Chat**: Live messaging during video sessions
- 📺 **Screen Sharing**: Share screens with participants
- 🎤 **Media Controls**: Handle audio/video mute states
- 👥 **Participant Management**: Track who's in each room
- 🔒 **Host Controls**: Room management by teachers

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on port 3001 by default.

### 3. Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=production
```

### 4. Health Check

Visit `http://localhost:3001/health` to check if the server is running.

## API Endpoints

### HTTP Endpoints

- `GET /health` - Server health check

### Socket.IO Events

#### Client to Server Events

- `join-room` - Join a video room
- `leave-room` - Leave a video room
- `signal` - WebRTC signaling data
- `chat-message` - Send chat message
- `media-changed` - Audio/video state change
- `end-room` - End room (host only)
- `screen-share-started` - Start screen sharing
- `screen-share-stopped` - Stop screen sharing

#### Server to Client Events

- `user-joined` - New user joined room
- `user-left` - User left room
- `room-participants` - Current room participants
- `receive-signal` - WebRTC signaling data
- `chat-message` - Receive chat message
- `user-media-changed` - User's media state changed
- `room-ended` - Room was ended by host
- `user-screen-share-started` - User started screen sharing
- `user-screen-share-stopped` - User stopped screen sharing

## Data Structures

### Room Data
```javascript
{
  id: "room_123",
  participants: Map<userId, ParticipantData>,
  host: "user_456",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Participant Data
```javascript
{
  userId: "user_123",
  userName: "John Doe",
  socketId: "socket_abc",
  isHost: false,
  joinedAt: "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the server:
```bash
pm2 start server.js --name "fyp-video-server"
```

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

### Using Docker

1. Create a Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t fyp-video-server .
docker run -p 3001:3001 fyp-video-server
```

### Using Heroku

1. Create a Procfile:
```
web: npm start
```

2. Deploy:
```bash
heroku create fyp-video-server
git push heroku main
```

## Configuration

### CORS Settings

The server is configured to accept connections from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174` (Vite dev server alt port)
- `http://localhost:3000` (React dev server)

Update the CORS origins in `server.js` for production deployment.

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Monitoring

### Health Check Response
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activeRooms": 5,
  "totalParticipants": 23
}
```

### Logs

The server logs important events:
- User connections/disconnections
- Room creation/deletion
- Chat messages
- Media state changes

## Security Considerations

1. **Authentication**: Implement proper user authentication
2. **Rate Limiting**: Add rate limiting for socket events
3. **Input Validation**: Validate all incoming data
4. **CORS**: Configure CORS properly for production
5. **SSL/TLS**: Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check CORS settings and server URL
2. **Room Not Found**: Ensure room exists in database
3. **Audio/Video Issues**: Check WebRTC STUN/TURN servers
4. **High CPU Usage**: Monitor participant count and optimize

### Debug Mode

Set `DEBUG=socket.io:*` environment variable for detailed logs:

```bash
DEBUG=socket.io:* npm run dev
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test with multiple participants

## License

MIT License - see LICENSE file for details.
