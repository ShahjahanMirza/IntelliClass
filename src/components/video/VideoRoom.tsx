import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../../context/WebRTCContext';
import { useAuth } from '../../context/AuthContext';
import ParticipantGrid from './ParticipantGrid';
import VideoControls from './VideoControls';
import VideoChat from './VideoChat';
import ParticipantManagement from './ParticipantManagement';
import { getVideoRoom } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

interface VideoRoomProps {
  roomId?: string;
  onLeave?: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomId: propRoomId, onLeave }) => {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    roomId: contextRoomId,
    isInRoom,
    participants,
    isHost,
    localStream,
    isConnecting,
    connectionError,
    joinRoom,
    leaveRoom,
    endRoom,
    messages
  } = useWebRTC();

  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const roomId = propRoomId || paramRoomId;

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomId || !user) {
        navigate('/dashboard/classes');
        return;
      }

      setIsLoading(true);
      
      try {
        // Get room information
        const { data: room, error } = await getVideoRoom(roomId);
        if (error || !room) {
          toast.error('Room not found');
          navigate('/dashboard/classes');
          return;
        }

        setRoomInfo(room);

        // Join the room if not already in it
        if (!isInRoom || contextRoomId !== roomId) {
          const success = await joinRoom(roomId);
          if (!success) {
            navigate('/dashboard/classes');
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing room:', error);
        toast.error('Failed to join room');
        navigate('/dashboard/classes');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [roomId, user, navigate, isInRoom, contextRoomId, joinRoom]);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      if (onLeave) {
        onLeave();
      } else {
        navigate('/dashboard/classes');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleEndRoom = async () => {
    try {
      await endRoom();
      if (onLeave) {
        onLeave();
      } else {
        navigate('/dashboard/classes');
      }
    } catch (error) {
      console.error('Error ending room:', error);
    }
  };

  if (isLoading || isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {isLoading ? 'Loading room...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{connectionError}</p>
          <button
            onClick={() => navigate('/dashboard/classes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-6xl mb-4">🚪</div>
          <h2 className="text-white text-2xl font-bold mb-2">Not in Room</h2>
          <p className="text-gray-300 mb-4">You are not currently in this room.</p>
          <button
            onClick={() => navigate('/dashboard/classes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-xl font-semibold">
              {roomInfo?.title || 'Video Conference'}
            </h1>
            {roomInfo?.classes && (
              <span className="text-gray-400 text-sm">
                {roomInfo.classes.name} - {roomInfo.classes.subject}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300 text-sm">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </span>
            </div>
            
            <button
              onClick={() => setShowChat(!showChat)}
              className="relative bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              💬 Chat
              {messages.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messages.length > 99 ? '99+' : messages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 flex flex-col ${showChat ? 'mr-80' : ''}`}>
          {/* Participant Grid */}
          <div className="flex-1 p-4">
            <ParticipantGrid 
              participants={participants}
              localStream={localStream}
              currentUser={user}
              isHost={isHost}
            />
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <VideoControls
              onLeave={handleLeaveRoom}
              onEnd={isHost ? handleEndRoom : undefined}
              roomInfo={roomInfo}
              onShowParticipants={() => setShowParticipants(true)}
            />
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <VideoChat />
            </div>
          </div>
        )}

        {/* Participant Management Panel */}
        <ParticipantManagement
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
        />
      </div>
    </div>
  );
};

export default VideoRoom;
