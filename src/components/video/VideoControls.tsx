import React, { useState } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { toast } from 'react-hot-toast';

interface VideoControlsProps {
  onLeave: () => void;
  onEnd?: () => void;
  roomInfo?: any;
  onShowParticipants?: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({ onLeave, onEnd, roomInfo, onShowParticipants }) => {
  const {
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isHost
  } = useWebRTC();

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleToggleAudio = () => {
    toggleAudio();
    toast.success(isAudioMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const handleToggleVideo = () => {
    toggleVideo();
    toast.success(isVideoOff ? 'Camera turned on' : 'Camera turned off');
  };

  const handleToggleScreenShare = async () => {
    try {
      await toggleScreenShare();
      toast.success(isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started');
    } catch (error) {
      toast.error('Failed to toggle screen sharing');
    }
  };

  const handleLeave = () => {
    setShowLeaveConfirm(false);
    onLeave();
  };

  const handleEnd = () => {
    setShowEndConfirm(false);
    if (onEnd) {
      onEnd();
    }
  };

  return (
    <>
      <div className="flex items-center justify-center space-x-4">
        {/* Audio Control */}
        <button
          onClick={handleToggleAudio}
          className={`p-4 rounded-full transition-all duration-200 ${
            isAudioMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Video Control */}
        <button
          onClick={handleToggleVideo}
          className={`p-4 rounded-full transition-all duration-200 ${
            isVideoOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 13V7a2 2 0 00-2-2h-2.586l-.293-.293A1 1 0 0011.414 4H8.586L7.293 2.707a1 1 0 00-1.414 0L3.707 2.293zM13 9.586l2 2V13a1 1 0 01-1 1H5.414l2-2H13V9.586z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          )}
        </button>

        {/* Screen Share Control */}
        <button
          onClick={handleToggleScreenShare}
          className={`p-4 rounded-full transition-all duration-200 ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5v2h3a1 1 0 110 2H6a1 1 0 110-2h3v-2H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Participants (Host only) */}
        {isHost && onShowParticipants && (
          <button
            onClick={onShowParticipants}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
            title="Manage participants"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </button>
        )}

        {/* Settings/More Options */}
        <button
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          title="More options"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Leave Room */}
        <button
          onClick={() => setShowLeaveConfirm(true)}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
          title="Leave room"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>

        {/* End Room (Host only) */}
        {isHost && onEnd && (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="p-4 rounded-full bg-red-800 hover:bg-red-900 text-white transition-all duration-200"
            title="End room for everyone"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Room?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave this video conference?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Room Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">End Room?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this video conference for everyone? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEnd}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                End Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoControls;
