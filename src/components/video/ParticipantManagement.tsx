import React, { useState, useMemo } from 'react';
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  UserX,
  Crown,
  Clock,
  MoreVertical,
  Shield,
  ShieldOff,
  Search,
  Filter,
  Settings,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  UserCheck,
  UserMinus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';
import { formatDistanceToNow } from 'date-fns';

interface ParticipantManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantManagement: React.FC<ParticipantManagementProps> = ({ isOpen, onClose }) => {
  const {
    participants,
    isHost,
    kickParticipant,
    muteParticipant,
    toggleParticipantMic,
    toggleParticipantScreenShare
  } = useWebRTC();

  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hosts' | 'participants' | 'muted' | 'unmuted'>('all');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and search participants
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(participant => {
      // Search filter
      const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           participant.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      let matchesFilter = true;
      switch (filterType) {
        case 'hosts':
          matchesFilter = participant.isHost;
          break;
        case 'participants':
          matchesFilter = !participant.isHost;
          break;
        case 'muted':
          matchesFilter = participant.isMuted || participant.permissions.isForceMuted;
          break;
        case 'unmuted':
          matchesFilter = !participant.isMuted && !participant.permissions.isForceMuted;
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });

    // Sort by: hosts first, then by join time
    return filtered.sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [participants, searchTerm, filterType]);

  // Participant statistics
  const stats = useMemo(() => {
    const total = participants.length;
    const hosts = participants.filter(p => p.isHost).length;
    const muted = participants.filter(p => p.isMuted || p.permissions.isForceMuted).length;
    const videoOff = participants.filter(p => p.isVideoOff).length;
    const canShareScreen = participants.filter(p => p.permissions.canShareScreen).length;

    return { total, hosts, muted, videoOff, canShareScreen };
  }, [participants]);

  if (!isOpen) return null;

  const handleKickParticipant = (participantId: string, participantName: string) => {
    if (window.confirm(`Are you sure you want to remove ${participantName} from the session?`)) {
      kickParticipant(participantId);
    }
  };

  const toggleParticipantMenu = (participantId: string) => {
    setExpandedParticipant(expandedParticipant === participantId ? null : participantId);
  };

  // Bulk action handlers
  const handleSelectParticipant = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const nonHostParticipants = filteredParticipants.filter(p => !p.isHost);
    if (selectedParticipants.size === nonHostParticipants.length) {
      setSelectedParticipants(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedParticipants(new Set(nonHostParticipants.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkMute = () => {
    selectedParticipants.forEach(participantId => {
      muteParticipant(participantId, true);
    });
    setSelectedParticipants(new Set());
    setShowBulkActions(false);
  };

  const handleBulkUnmute = () => {
    selectedParticipants.forEach(participantId => {
      muteParticipant(participantId, false);
    });
    setSelectedParticipants(new Set());
    setShowBulkActions(false);
  };

  const handleBulkKick = () => {
    if (window.confirm(`Are you sure you want to remove ${selectedParticipants.size} participants from the session?`)) {
      selectedParticipants.forEach(participantId => {
        kickParticipant(participantId);
      });
      setSelectedParticipants(new Set());
      setShowBulkActions(false);
    }
  };

  const getConnectionQuality = (participant: any) => {
    // Simulate connection quality based on participant status
    // In a real implementation, this would come from WebRTC stats
    if (participant.isVideoOff && (participant.isMuted || participant.permissions.isForceMuted)) {
      return 'poor';
    } else if (participant.isVideoOff || participant.isMuted) {
      return 'fair';
    }
    return 'good';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">
                Participant Management
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-80">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.hosts}</div>
              <div className="text-xs opacity-80">Hosts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.muted}</div>
              <div className="text-xs opacity-80">Muted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.videoOff}</div>
              <div className="text-xs opacity-80">Video Off</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.canShareScreen}</div>
              <div className="text-xs opacity-80">Can Share</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">All</option>
              <option value="hosts">Hosts</option>
              <option value="participants">Participants</option>
              <option value="muted">Muted</option>
              <option value="unmuted">Unmuted</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && isHost && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-yellow-800">
                  {selectedParticipants.size} participant(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkMute}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                >
                  <VolumeX className="h-4 w-4 mr-1" />
                  Mute All
                </button>
                <button
                  onClick={handleBulkUnmute}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  Unmute All
                </button>
                <button
                  onClick={handleBulkKick}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Remove All
                </button>
                <button
                  onClick={() => {
                    setSelectedParticipants(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants List Header */}
        {isHost && filteredParticipants.filter(p => !p.isHost).length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="flex items-center">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedParticipants.size === filteredParticipants.filter(p => !p.isHost).length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Select All Participants
              </button>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No participants in the session</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredParticipants.map((participant) => (
                <div key={participant.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* Selection Checkbox (for non-hosts) */}
                    {isHost && !participant.isHost && (
                      <div className="mr-3">
                        <button
                          onClick={() => handleSelectParticipant(participant.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedParticipants.has(participant.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Participant Info */}
                    <div className="flex items-center flex-1">
                      <div className="relative">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        {participant.isHost && (
                          <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />
                        )}

                        {/* Connection Quality Indicator */}
                        <div className="absolute -bottom-1 -right-1">
                          {getConnectionQuality(participant) === 'good' && (
                            <Wifi className="h-4 w-4 text-green-500 bg-white rounded-full p-0.5" />
                          )}
                          {getConnectionQuality(participant) === 'fair' && (
                            <Wifi className="h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                          )}
                          {getConnectionQuality(participant) === 'poor' && (
                            <WifiOff className="h-4 w-4 text-red-500 bg-white rounded-full p-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center">
                              {participant.name}
                              {participant.isHost && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Host
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{participant.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Joined {formatDistanceToNow(new Date(participant.joinedAt))} ago
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              getConnectionQuality(participant) === 'good' ? 'bg-green-500' :
                              getConnectionQuality(participant) === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            {getConnectionQuality(participant)} connection
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Media Status & Quick Actions */}
                    <div className="flex items-center space-x-3">
                      {/* Media Status Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Microphone Status */}
                        <div className={`p-2 rounded-lg border-2 ${
                          participant.isMuted || participant.permissions.isForceMuted
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : participant.permissions.canSpeak
                            ? 'bg-green-50 border-green-200 text-green-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`} title={
                          participant.isMuted || participant.permissions.isForceMuted
                            ? 'Microphone muted'
                            : participant.permissions.canSpeak
                            ? 'Microphone enabled'
                            : 'Microphone disabled'
                        }>
                          {participant.isMuted || participant.permissions.isForceMuted ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </div>

                        {/* Video Status */}
                        <div className={`p-2 rounded-lg border-2 ${
                          participant.isVideoOff
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-green-50 border-green-200 text-green-600'
                        }`} title={participant.isVideoOff ? 'Video off' : 'Video on'}>
                          {participant.isVideoOff ? (
                            <VideoOff className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                        </div>

                        {/* Screen Share Permission */}
                        <div className={`p-2 rounded-lg border-2 ${
                          participant.permissions.canShareScreen
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`} title={
                          participant.permissions.canShareScreen
                            ? 'Can share screen'
                            : 'Cannot share screen'
                        }>
                          {participant.permissions.canShareScreen ? (
                            <Monitor className="h-4 w-4" />
                          ) : (
                            <MonitorOff className="h-4 w-4" />
                          )}
                        </div>

                        {/* Force Mute Status */}
                        <div className={`p-2 rounded-lg border-2 ${
                          participant.permissions.isForceMuted
                            ? 'bg-orange-50 border-orange-200 text-orange-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`} title={
                          participant.permissions.isForceMuted
                            ? 'Force muted by host'
                            : 'Not force muted'
                        }>
                          {participant.permissions.isForceMuted ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons (Host only) */}
                      {isHost && !participant.isHost && (
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => muteParticipant(participant.id, !participant.permissions.isForceMuted)}
                            className={`px-2 py-1 text-xs rounded ${
                              participant.permissions.isForceMuted
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={participant.permissions.isForceMuted ? 'Unmute' : 'Force mute'}
                          >
                            {participant.permissions.isForceMuted ? 'Unmute' : 'Mute'}
                          </button>
                          <button
                            onClick={() => toggleParticipantScreenShare(participant.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              participant.permissions.canShareScreen
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title={participant.permissions.canShareScreen ? 'Disable screen share' : 'Enable screen share'}
                          >
                            {participant.permissions.canShareScreen ? 'Block' : 'Allow'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Host Controls */}
                    {isHost && !participant.isHost && (
                      <div className="relative">
                        <button
                          onClick={() => toggleParticipantMenu(participant.id)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {expandedParticipant === participant.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              {/* Microphone Control */}
                              <button
                                onClick={() => {
                                  toggleParticipantMic(participant.id);
                                  setExpandedParticipant(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {participant.permissions.canSpeak ? (
                                  <>
                                    <MicOff className="h-4 w-4 mr-2" />
                                    Disable Microphone
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-4 w-4 mr-2" />
                                    Enable Microphone
                                  </>
                                )}
                              </button>

                              {/* Force Mute */}
                              <button
                                onClick={() => {
                                  muteParticipant(participant.id, !participant.permissions.isForceMuted);
                                  setExpandedParticipant(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {participant.permissions.isForceMuted ? (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Unmute Participant
                                  </>
                                ) : (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Force Mute
                                  </>
                                )}
                              </button>

                              {/* Screen Share Control */}
                              <button
                                onClick={() => {
                                  toggleParticipantScreenShare(participant.id);
                                  setExpandedParticipant(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {participant.permissions.canShareScreen ? (
                                  <>
                                    <MonitorOff className="h-4 w-4 mr-2" />
                                    Disable Screen Share
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="h-4 w-4 mr-2" />
                                    Enable Screen Share
                                  </>
                                )}
                              </button>

                              <hr className="my-1" />

                              {/* Kick Participant */}
                              <button
                                onClick={() => {
                                  handleKickParticipant(participant.id, participant.name);
                                  setExpandedParticipant(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove from Session
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              {isHost ? (
                <div className="flex items-center space-x-4">
                  <span>Showing {filteredParticipants.length} of {participants.length} participants</span>
                  {selectedParticipants.size > 0 && (
                    <span className="text-blue-600 font-medium">
                      {selectedParticipants.size} selected
                    </span>
                  )}
                </div>
              ) : (
                'Participant view - limited management options'
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setSelectedParticipants(new Set());
                  setShowBulkActions(false);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Status Indicators:</strong>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span>Good</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                    <span>Fair</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    <span>Poor</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>Quick Actions:</strong>
                <div className="mt-1">
                  {isHost ? 'Click icons or use dropdown for detailed controls' : 'View-only mode'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManagement;
