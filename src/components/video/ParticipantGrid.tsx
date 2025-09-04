import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  stream?: MediaStream;
  peer?: any;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  permissions?: {
    canSpeak: boolean;
    canShareScreen: boolean;
    isForceMuted: boolean;
  };
}

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  currentUser: any;
  isHost: boolean;
}

const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants,
  localStream,
  currentUser,
  isHost
}) => {
  const [mainParticipant, setMainParticipant] = useState<Participant | null>(null);
  const [mainStream, setMainStream] = useState<MediaStream | null>(null);

  // Initialize main participant (teacher/host by default)
  useEffect(() => {
    const hostParticipant = participants.find(p => p.isHost);
    if (hostParticipant && !mainParticipant) {
      setMainParticipant(hostParticipant);
      setMainStream(hostParticipant.stream || null);
    } else if (!hostParticipant && currentUser && isHost && !mainParticipant) {
      // If current user is host but not in participants list yet
      setMainParticipant({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        isHost: true,
        isMuted: false,
        isVideoOff: false,
        stream: localStream || undefined
      });
      setMainStream(localStream);
    }
  }, [participants, currentUser, isHost, localStream, mainParticipant]);

  // Handle participant click to switch main view
  const handleParticipantClick = (participant: Participant) => {
    setMainParticipant(participant);
    setMainStream(participant.stream || null);
  };

  // Handle local user click to switch to own view
  const handleLocalClick = () => {
    if (currentUser) {
      setMainParticipant({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        isHost: isHost,
        isMuted: false,
        isVideoOff: false,
        stream: localStream || undefined
      });
      setMainStream(localStream);
    }
  };

  // Create participant video component
  const ParticipantVideo: React.FC<{
    participant: Participant;
    stream: MediaStream | null;
    isLocal?: boolean;
    isMain?: boolean;
    onClick?: () => void;
  }> = ({ participant, stream, isLocal = false, isMain = false, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div 
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${
          isMain ? 'h-full' : 'h-32 cursor-pointer hover:ring-2 hover:ring-blue-500'
        } ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {stream && !participant.isVideoOff ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xl font-semibold">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isMain && (
                <p className="text-white text-sm">{participant.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Participant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-medium">
                {participant.name}
                {isLocal && ' (You)'}
              </span>
              {participant.isHost && (
                <Crown className="h-4 w-4 text-yellow-400" />
              )}
            </div>
            <div className="flex items-center space-x-1">
              {participant.isMuted || participant.permissions?.isForceMuted ? (
                <MicOff className="h-4 w-4 text-red-400" />
              ) : (
                <Mic className="h-4 w-4 text-green-400" />
              )}
              {participant.isVideoOff ? (
                <VideoOff className="h-4 w-4 text-red-400" />
              ) : (
                <Video className="h-4 w-4 text-green-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 p-4">
        {mainParticipant ? (
          <ParticipantVideo
            participant={mainParticipant}
            stream={mainStream}
            isLocal={mainParticipant.id === currentUser?.id}
            isMain={true}
          />
        ) : (
          <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Video className="h-16 w-16 mx-auto mb-4" />
              <p>No video stream available</p>
            </div>
          </div>
        )}
      </div>

      {/* Participant Thumbnails */}
      <div className="h-40 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex space-x-4 overflow-x-auto h-full">
          {/* Local User Thumbnail */}
          <div className="flex-shrink-0">
            <ParticipantVideo
              participant={{
                id: currentUser?.id || 'local',
                name: currentUser?.name || 'You',
                email: currentUser?.email || '',
                isHost: isHost,
                isMuted: false,
                isVideoOff: false,
                stream: localStream || undefined
              }}
              stream={localStream}
              isLocal={true}
              onClick={handleLocalClick}
            />
          </div>

          {/* Other Participants Thumbnails */}
          {participants.map((participant) => (
            <div key={participant.id} className="flex-shrink-0">
              <ParticipantVideo
                participant={participant}
                stream={participant.stream || null}
                onClick={() => handleParticipantClick(participant)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParticipantGrid;
