import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useAuth } from './AuthContext';
import { 
  createVideoRoom, 
  joinVideoRoom, 
  leaveVideoRoom, 
  endVideoRoom, 
  getRoomParticipants,
  getVideoRoom,
  createNotification
} from '../utils/supabase';
import { toast } from 'react-hot-toast';

interface ParticipantPermissions {
  canSpeak: boolean;
  canShareScreen: boolean;
  isForceMuted: boolean; // Muted by host
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  stream?: MediaStream;
  peer?: SimplePeer.Instance;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  permissions: ParticipantPermissions;
  joinedAt: string;
}

interface WebRTCContextType {
  // Room state
  roomId: string | null;
  isInRoom: boolean;
  participants: Participant[];
  isHost: boolean;
  
  // Media state
  localStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  
  // Connection state
  isConnecting: boolean;
  connectionError: string | null;
  
  // Actions
  createRoom: (classId: string, title?: string) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  endRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;

  // Participant Management (Host only)
  kickParticipant: (participantId: string) => void;
  muteParticipant: (participantId: string, mute: boolean) => void;
  setParticipantPermissions: (participantId: string, permissions: Partial<ParticipantPermissions>) => void;
  toggleParticipantMic: (participantId: string) => void;
  toggleParticipantScreenShare: (participantId: string) => void;

  // Chat (for future implementation)
  messages: any[];
  sendMessage: (message: string) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

// Socket.IO server URL - you'll need to set up a Socket.IO server
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface WebRTCProviderProps {
  children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  
  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [key: string]: SimplePeer.Instance }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        query: { userId: user.id, userName: user.name },
        timeout: 5000,
        autoConnect: true
      });

      const socket = socketRef.current;

      // Socket connection event listeners
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setConnectionError(null);
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error.message);
        setConnectionError('Video conferencing service unavailable');
        // Don't throw error, just log it
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });

      socket.on('error', (error) => {
        console.warn('Socket error:', error);
        // Handle socket errors gracefully without throwing
      });

      // Socket event listeners
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      socket.on('receive-signal', handleReceiveSignal);
      socket.on('room-ended', handleRoomEnded);
      socket.on('chat-message', handleChatMessage);
      socket.on('user-media-changed', handleUserMediaChanged);
      socket.on('participant-kicked', handleParticipantKicked);
      socket.on('force-muted', handleForceMuted);
      socket.on('permissions-updated', handlePermissionsUpdated);

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Check media permissions
  const checkMediaPermissions = async (): Promise<{ camera: boolean; microphone: boolean }> => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      return {
        camera: cameraPermission.state === 'granted',
        microphone: microphonePermission.state === 'granted'
      };
    } catch (error) {
      console.warn('Permission API not supported, will try direct access');
      return { camera: false, microphone: false };
    }
  };

  // Try audio-only if video fails
  const tryAudioOnly = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnectionError(null);
      toast.success('Connected with audio only');
      return stream;
    } catch (error) {
      console.error('Audio-only also failed:', error);
      return null;
    }
  };

  // Get user media with better error handling
  const getUserMedia = async (video: boolean = true, audio: boolean = true, showPermissionDialog: boolean = true): Promise<MediaStream | null> => {
    try {
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnectionError(null); // Clear any previous errors
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);

      let errorMessage = 'Failed to access camera/microphone';
      let userGuidance = '';

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Camera/microphone access denied';
          userGuidance = 'Please allow camera and microphone access in your browser settings and refresh the page.';
          break;
        case 'NotFoundError':
          errorMessage = 'No camera or microphone found';
          userGuidance = 'Please ensure your camera and microphone are connected and try again.';
          break;
        case 'NotReadableError':
          errorMessage = 'Camera/microphone is being used by another application';
          userGuidance = 'Please close other applications (like Zoom, Teams, Skype, or other browser tabs) using your camera/microphone and try again. You may also need to restart your browser.';

          // If video was requested and failed, try audio-only
          if (video && audio) {
            console.log('Video failed, trying audio-only...');
            const audioStream = await tryAudioOnly();
            if (audioStream) {
              return audioStream;
            }
          }
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera/microphone constraints not supported';
          userGuidance = 'Your device may not support the required video/audio quality.';
          break;
        case 'SecurityError':
          errorMessage = 'Media access blocked by security policy';
          userGuidance = 'Please ensure you\'re using HTTPS or localhost.';
          break;
        default:
          userGuidance = 'Please check your camera and microphone settings.';
      }

      setConnectionError(`${errorMessage}. ${userGuidance}`);

      if (showPermissionDialog) {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }

      return null;
    }
  };

  // Create a new room
  const createRoom = async (classId: string, title?: string): Promise<string | null> => {
    if (!user) return null;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Create room in database
      const { data: room, error } = await createVideoRoom({
        class_id: classId,
        teacher_id: user.id,
        title: title || 'Class Session'
      });

      if (error || !room) {
        throw new Error('Failed to create room');
      }

      // Try to get user media, but allow room creation even if it fails
      const stream = await getUserMedia(true, true, false); // Don't show permission dialog immediately
      if (!stream) {
        // Show a warning but continue with room creation
        toast.error('Camera/microphone access denied. You can still create the room, but participants may have limited functionality.', {
          duration: 6000,
        });
      }

      // Join the room as host
      await joinVideoRoom(room.room_id, user.id, 'host');

      // Join socket room
      socketRef.current?.emit('join-room', {
        roomId: room.room_id,
        userId: user.id,
        userName: user.name,
        isHost: true
      });

      setRoomId(room.room_id);
      setIsInRoom(true);
      setIsHost(true);

      toast.success('Room created successfully!');
      return room.room_id;

    } catch (error: any) {
      console.error('Error creating room:', error);
      setConnectionError(error.message);
      toast.error('Failed to create room');
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Join an existing room
  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!user) return false;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Check if room exists and is active
      const { data: room, error } = await getVideoRoom(roomId);
      if (error || !room || !room.is_active) {
        throw new Error('Room not found or inactive');
      }

      // Try to get user media, but allow joining even if it fails
      const stream = await getUserMedia(true, true, false); // Don't show permission dialog immediately
      if (!stream) {
        // Show a warning but continue with joining
        toast.error('Camera/microphone access denied. You can still join the room but others won\'t see or hear you.', {
          duration: 6000,
        });
      }

      // Join room in database
      await joinVideoRoom(roomId, user.id, 'participant');

      // Join socket room
      socketRef.current?.emit('join-room', {
        roomId: roomId,
        userId: user.id,
        userName: user.name,
        isHost: false
      });

      setRoomId(roomId);
      setIsInRoom(true);
      setIsHost(false);

      toast.success('Joined room successfully!');
      return true;

    } catch (error: any) {
      console.error('Error joining room:', error);
      setConnectionError(error.message);
      toast.error('Failed to join room');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Leave the current room
  const leaveRoom = async (): Promise<void> => {
    if (!roomId || !user) return;
    
    try {
      // Leave room in database
      await leaveVideoRoom(roomId, user.id);
      
      // Leave socket room
      socketRef.current?.emit('leave-room', {
        roomId: roomId,
        userId: user.id
      });

      // Clean up local resources
      cleanupLocalResources();
      
      toast.success('Left room successfully');
      
    } catch (error: any) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room');
    }
  };

  // End the room (host only)
  const endRoom = async (): Promise<void> => {
    if (!roomId || !isHost) return;
    
    try {
      // End room in database
      await endVideoRoom(roomId);
      
      // Notify all participants
      socketRef.current?.emit('end-room', { roomId });
      
      // Clean up local resources
      cleanupLocalResources();
      
      toast.success('Room ended successfully');
      
    } catch (error: any) {
      console.error('Error ending room:', error);
      toast.error('Failed to end room');
    }
  };

  // Clean up local resources
  const cleanupLocalResources = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    peersRef.current = {};
    
    // Reset state
    setLocalStream(null);
    setRoomId(null);
    setIsInRoom(false);
    setIsHost(false);
    setParticipants([]);
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setMessages([]);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        
        // Notify other participants
        socketRef.current?.emit('media-changed', {
          roomId,
          userId: user?.id,
          isAudioMuted: !audioTrack.enabled,
          isVideoOff
        });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        
        // Notify other participants
        socketRef.current?.emit('media-changed', {
          roomId,
          userId: user?.id,
          isAudioMuted,
          isVideoOff: !videoTrack.enabled
        });
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async (): Promise<void> => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing, return to camera
        const stream = await getUserMedia();
        if (stream) {
          // Replace tracks in all peer connections
          Object.values(peersRef.current).forEach(peer => {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              peer.replaceTrack(
                localStreamRef.current?.getVideoTracks()[0]!,
                videoTrack,
                localStreamRef.current!
              );
            }
          });
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          if (localStreamRef.current) {
            peer.replaceTrack(
              localStreamRef.current.getVideoTracks()[0],
              videoTrack,
              screenStream
            );
          }
        });
        
        setIsScreenSharing(true);
        
        // Listen for screen share end
        videoTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  // Send chat message
  const sendMessage = (message: string) => {
    if (roomId && user) {
      const messageData = {
        id: Date.now().toString(),
        roomId,
        userId: user.id,
        userName: user.name,
        message,
        timestamp: new Date().toISOString()
      };

      socketRef.current?.emit('chat-message', messageData);
      setMessages(prev => [...prev, messageData]);
    }
  };

  // Participant Management Functions (Host only)
  const kickParticipant = (participantId: string) => {
    if (!isHost || !roomId) return;

    socketRef.current?.emit('kick-participant', {
      roomId,
      participantId,
      hostId: user?.id
    });

    // Remove from local participants list
    setParticipants(prev => prev.filter(p => p.id !== participantId));

    toast.success('Participant removed from session');
  };

  const muteParticipant = (participantId: string, mute: boolean) => {
    if (!isHost || !roomId) return;

    socketRef.current?.emit('force-mute-participant', {
      roomId,
      participantId,
      mute,
      hostId: user?.id
    });

    // Update local participant state
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId
          ? { ...p, permissions: { ...p.permissions, isForceMuted: mute } }
          : p
      )
    );

    toast.success(`Participant ${mute ? 'muted' : 'unmuted'}`);
  };

  const setParticipantPermissions = (participantId: string, permissions: Partial<ParticipantPermissions>) => {
    if (!isHost || !roomId) return;

    socketRef.current?.emit('update-participant-permissions', {
      roomId,
      participantId,
      permissions,
      hostId: user?.id
    });

    // Update local participant state
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId
          ? { ...p, permissions: { ...p.permissions, ...permissions } }
          : p
      )
    );
  };

  const toggleParticipantMic = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      const newPermission = !participant.permissions.canSpeak;
      setParticipantPermissions(participantId, { canSpeak: newPermission });
      toast.success(`Microphone ${newPermission ? 'enabled' : 'disabled'} for participant`);
    }
  };

  const toggleParticipantScreenShare = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      const newPermission = !participant.permissions.canShareScreen;
      setParticipantPermissions(participantId, { canShareScreen: newPermission });
      toast.success(`Screen sharing ${newPermission ? 'enabled' : 'disabled'} for participant`);
    }
  };

  // Socket event handlers
  const handleUserJoined = (data: any) => {
    console.log('User joined:', data);

    // Create peer connection for new user
    if (data.userId !== user?.id && localStreamRef.current) {
      createPeerConnection(data.userId, true);
    }

    // Update participants list
    setParticipants(prev => {
      const existing = prev.find(p => p.id === data.userId);
      if (existing) return prev;

      return [...prev, {
        id: data.userId,
        name: data.userName,
        email: '',
        isHost: data.isHost,
        isMuted: false,
        isVideoOff: false,
        permissions: {
          canSpeak: true,
          canShareScreen: false, // Default to false, host can enable
          isForceMuted: false
        },
        joinedAt: new Date().toISOString()
      }];
    });
  };

  const handleUserLeft = (data: any) => {
    console.log('User left:', data);

    // Clean up peer connection
    if (peersRef.current[data.userId]) {
      peersRef.current[data.userId].destroy();
      delete peersRef.current[data.userId];
    }

    // Remove from participants
    setParticipants(prev => prev.filter(p => p.id !== data.userId));
  };

  const handleReceiveSignal = (data: any) => {
    console.log('Received signal:', data);

    const { fromUserId, signal, type } = data;

    if (type === 'offer') {
      // Create peer connection for incoming call
      createPeerConnection(fromUserId, false);
    }

    // Handle the signal
    const peer = peersRef.current[fromUserId];
    if (peer) {
      peer.signal(signal);
    }
  };

  // Create peer connection
  const createPeerConnection = (userId: string, initiator: boolean) => {
    if (peersRef.current[userId] || !localStreamRef.current) return;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', {
        roomId,
        targetUserId: userId,
        signal,
        type: initiator ? 'offer' : 'answer'
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from:', userId);

      // Update participant with stream
      setParticipants(prev =>
        prev.map(p =>
          p.id === userId
            ? { ...p, stream: remoteStream }
            : p
        )
      );
    });

    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', userId);
      delete peersRef.current[userId];
    });

    peersRef.current[userId] = peer;
  };

  const handleRoomEnded = () => {
    cleanupLocalResources();
    toast.info('Room has been ended by the host');
  };

  const handleChatMessage = (message: any) => {
    setMessages(prev => [...prev, message]);
  };

  const handleUserMediaChanged = (data: any) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === data.userId
          ? { ...p, isMuted: data.isAudioMuted, isVideoOff: data.isVideoOff }
          : p
      )
    );
  };

  const handleParticipantKicked = (data: any) => {
    if (data.participantId === user?.id) {
      // Current user was kicked
      toast.error('You have been removed from the session by the host');
      cleanupLocalResources();
    } else {
      // Another participant was kicked
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
    }
  };

  const handleForceMuted = (data: any) => {
    if (data.participantId === user?.id) {
      // Current user was force muted/unmuted
      if (data.mute) {
        // Force mute the user
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioMuted(true);
        }
        toast.warning('You have been muted by the host');
      } else {
        toast.success('You can now unmute yourself');
      }
    }

    // Update participant state
    setParticipants(prev =>
      prev.map(p =>
        p.id === data.participantId
          ? { ...p, permissions: { ...p.permissions, isForceMuted: data.mute } }
          : p
      )
    );
  };

  const handlePermissionsUpdated = (data: any) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === data.participantId
          ? { ...p, permissions: { ...p.permissions, ...data.permissions } }
          : p
      )
    );

    if (data.participantId === user?.id) {
      // Notify user of permission changes
      const permissionMessages = [];
      if (data.permissions.canSpeak !== undefined) {
        permissionMessages.push(`Microphone ${data.permissions.canSpeak ? 'enabled' : 'disabled'}`);
      }
      if (data.permissions.canShareScreen !== undefined) {
        permissionMessages.push(`Screen sharing ${data.permissions.canShareScreen ? 'enabled' : 'disabled'}`);
      }

      if (permissionMessages.length > 0) {
        toast.success(`Permissions updated: ${permissionMessages.join(', ')}`);
      }
    }
  };

  const value: WebRTCContextType = {
    // Room state
    roomId,
    isInRoom,
    participants,
    isHost,
    
    // Media state
    localStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    
    // Connection state
    isConnecting,
    connectionError,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    endRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,

    // Participant Management
    kickParticipant,
    muteParticipant,
    setParticipantPermissions,
    toggleParticipantMic,
    toggleParticipantScreenShare,

    // Chat
    messages,
    sendMessage
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
