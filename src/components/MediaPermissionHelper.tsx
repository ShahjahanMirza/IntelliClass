import React, { useState, useEffect } from 'react';
import { Camera, Mic, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface MediaPermissionHelperProps {
  onPermissionsGranted?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const MediaPermissionHelper: React.FC<MediaPermissionHelperProps> = ({
  onPermissionsGranted,
  onSkip,
  showSkipOption = true
}) => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'unknown',
    microphone: 'unknown'
  });
  const [isChecking, setIsChecking] = useState(false);
  const [hasMediaDevices, setHasMediaDevices] = useState(true);

  useEffect(() => {
    checkPermissions();
    checkMediaDevicesSupport();
  }, []);

  const checkMediaDevicesSupport = () => {
    setHasMediaDevices(
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  };

  const checkPermissions = async () => {
    try {
      if (!navigator.permissions) {
        setPermissions({ camera: 'unknown', microphone: 'unknown' });
        return;
      }

      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      setPermissions({
        camera: cameraPermission.state,
        microphone: microphonePermission.state
      });
    } catch (error) {
      console.warn('Permission API not supported');
      setPermissions({ camera: 'unknown', microphone: 'unknown' });
    }
  };

  const requestPermissions = async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Stop the stream immediately as we just needed to request permissions
      stream.getTracks().forEach(track => track.stop());
      
      await checkPermissions();
      
      if (onPermissionsGranted) {
        onPermissionsGranted();
      }
    } catch (error: any) {
      console.error('Error requesting permissions:', error);
      await checkPermissions();
    } finally {
      setIsChecking(false);
    }
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPermissionText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'prompt':
        return 'Not requested';
      default:
        return 'Unknown';
    }
  };

  const allPermissionsGranted = permissions.camera === 'granted' && permissions.microphone === 'granted';

  if (!hasMediaDevices) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center mb-4">
          <XCircle className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-800">Media Not Supported</h3>
        </div>
        <p className="text-red-700 mb-4">
          Your browser doesn't support camera and microphone access. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
        {showSkipOption && onSkip && (
          <button
            onClick={onSkip}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Continue Without Media
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto shadow-sm">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Camera className="h-8 w-8 text-blue-500 mr-2" />
          <Mic className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Camera & Microphone Access
        </h3>
        <p className="text-gray-600 text-sm">
          To participate in video calls, please allow access to your camera and microphone.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Camera className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Camera</span>
          </div>
          <div className="flex items-center">
            {getPermissionIcon(permissions.camera)}
            <span className="text-sm text-gray-600 ml-2">
              {getPermissionText(permissions.camera)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Mic className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Microphone</span>
          </div>
          <div className="flex items-center">
            {getPermissionIcon(permissions.microphone)}
            <span className="text-sm text-gray-600 ml-2">
              {getPermissionText(permissions.microphone)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {!allPermissionsGranted && (
          <button
            onClick={requestPermissions}
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Requesting Access...
              </>
            ) : (
              'Allow Camera & Microphone'
            )}
          </button>
        )}

        {allPermissionsGranted && onPermissionsGranted && (
          <button
            onClick={onPermissionsGranted}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue
          </button>
        )}

        {showSkipOption && onSkip && (
          <button
            onClick={onSkip}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Continue Without Media
          </button>
        )}
      </div>

      {(permissions.camera === 'denied' || permissions.microphone === 'denied') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Permissions denied:</strong> To enable camera/microphone, click the camera icon in your browser's address bar and allow access, then refresh the page.
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaPermissionHelper;
