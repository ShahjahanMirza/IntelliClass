# 🎥 Video Conferencing System Setup Guide

This guide will help you set up and test the custom video conferencing system integrated into your FYP project.

## 🚀 Quick Start

### 1. Start the Socket.IO Server

First, start the video conferencing server:

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Start the Frontend Application

In a new terminal, start your React application:

```bash
# Navigate back to project root
cd ..

# Start the frontend (if not already running)
npm run dev
```

Your app will be available at `http://localhost:5174`

### 3. Test the Video System

1. **Login as a Teacher**:
   - Create or join a class
   - Go to the class detail page
   - Click on the "Live Session" tab
   - Click "Start Live Session"

2. **Login as a Student** (in another browser/incognito):
   - Join the same class
   - You should receive a notification about the live session
   - Click "Join Live" or go to the "Live Session" tab
   - Click "Join Session"

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Socket.IO Server URL
VITE_SOCKET_URL=http://localhost:3001

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server Configuration

The server is pre-configured for development. For production, update:

1. **CORS Origins** in `server/server.js`
2. **Environment variables** in `server/.env`
3. **SSL/HTTPS** configuration

## 🎯 Features Implemented

### ✅ Core Features
- [x] **Room Creation**: Teachers can start live sessions
- [x] **Room Joining**: Students can join active sessions
- [x] **Real-time Notifications**: Students get notified when sessions start
- [x] **Video/Audio Controls**: Mute/unmute, camera on/off
- [x] **Screen Sharing**: Share screen during sessions
- [x] **Live Chat**: Real-time messaging
- [x] **Participant Grid**: Zoom-like video layout
- [x] **Host Controls**: End session, manage participants

### ✅ Database Integration
- [x] **Video Rooms Table**: Tracks active sessions
- [x] **Room Participants**: Manages who's in each room
- [x] **Notifications**: Real-time alerts for students
- [x] **Class Integration**: Seamlessly integrated with existing classes

### ✅ UI/UX Features
- [x] **Responsive Design**: Works on desktop and mobile
- [x] **Live Session Tab**: Integrated into class detail page
- [x] **Visual Indicators**: Shows active sessions with red dot
- [x] **Toast Notifications**: Real-time alerts
- [x] **Join Buttons**: Quick access to active sessions

## 🧪 Testing Scenarios

### Basic Functionality
1. **Teacher starts session** → Students receive notifications
2. **Student joins session** → Video/audio works
3. **Multiple participants** → Grid layout adjusts
4. **Chat messaging** → Real-time communication
5. **Screen sharing** → Content sharing works
6. **Session ending** → All participants disconnected

### Edge Cases
1. **Network disconnection** → Graceful reconnection
2. **Browser refresh** → Rejoin session
3. **Permission denied** → Fallback handling
4. **Server restart** → Client reconnection
5. **Multiple tabs** → Single session per user

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to access camera/microphone"
**Solution**: 
- Grant browser permissions for camera/microphone
- Use HTTPS in production (required for WebRTC)
- Check if camera/microphone is being used by other apps

#### 2. "Connection failed"
**Solution**:
- Ensure Socket.IO server is running on port 3001
- Check CORS configuration
- Verify REACT_APP_SOCKET_URL environment variable

#### 3. "No video/audio from other participants"
**Solution**:
- Check WebRTC peer connections in browser dev tools
- Ensure both participants have granted media permissions
- Check firewall/NAT settings (may need STUN/TURN servers)

#### 4. "Room not found"
**Solution**:
- Verify room exists in database
- Check if room is still active
- Ensure user has permission to join

### Debug Mode

Enable debug logging:

```bash
# In server directory
DEBUG=socket.io:* npm run dev
```

Check browser console for WebRTC logs and errors.

## 🔒 Security Considerations

### Current Implementation
- ✅ User authentication required
- ✅ Class membership validation
- ✅ Teacher-only room creation
- ✅ Database-level permissions (RLS)

### Production Recommendations
- [ ] Add rate limiting for socket events
- [ ] Implement STUN/TURN servers for NAT traversal
- [ ] Add input validation for all socket events
- [ ] Use HTTPS/WSS in production
- [ ] Add session timeouts
- [ ] Implement participant limits

## 📊 Performance Optimization

### Current Optimizations
- Efficient participant grid layout
- Automatic video quality adjustment
- Graceful connection handling
- Memory cleanup on disconnect

### Future Improvements
- [ ] Adaptive bitrate streaming
- [ ] Video quality selection
- [ ] Bandwidth monitoring
- [ ] Connection quality indicators
- [ ] Recording capabilities

## 🚀 Deployment

### Frontend Deployment
Your existing frontend deployment process remains the same. Just ensure:
1. Environment variables are set correctly
2. Socket.IO server URL points to production server

### Server Deployment Options

#### Option 1: Heroku
```bash
cd server
heroku create fyp-video-server
git push heroku main
```

#### Option 2: DigitalOcean/AWS
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name video-server
```

#### Option 3: Docker
```bash
docker build -t fyp-video-server .
docker run -p 3001:3001 fyp-video-server
```

## 📈 Monitoring

### Health Checks
- Server health: `GET /health`
- Active rooms count
- Participant statistics
- Connection status

### Metrics to Monitor
- Concurrent users
- Room duration
- Connection failures
- Server resource usage

## 🎓 Usage Instructions for Users

### For Teachers
1. Go to your class detail page
2. Click "Live Session" tab
3. Click "Start Live Session"
4. Students will be automatically notified
5. Use controls to mute/unmute, share screen, etc.
6. Click "End Room" to finish the session

### For Students
1. You'll receive a notification when teacher starts a session
2. Click "Join Live" in the notification
3. Or go to class detail → "Live Session" tab → "Join Session"
4. Grant camera/microphone permissions
5. Participate in the session
6. Use chat for questions/comments

## 🔄 Next Steps

### Immediate Improvements
- [ ] Add recording functionality
- [ ] Implement breakout rooms
- [ ] Add whiteboard/annotation tools
- [ ] Improve mobile experience

### Advanced Features
- [ ] AI-powered transcription
- [ ] Attendance tracking
- [ ] Session analytics
- [ ] Integration with calendar

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review browser console for errors
3. Check server logs
4. Verify database permissions
5. Test with different browsers/devices

---

**🎉 Congratulations!** You now have a fully functional video conferencing system integrated into your FYP project!
