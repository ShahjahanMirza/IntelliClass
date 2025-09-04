import React, { useState } from 'react';
import { XIcon, AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  error?: any;
  showDetails?: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  error,
  showDetails = true
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!isOpen) return null;

  const getErrorDetails = () => {
    if (!error) return null;

    const details = {
      message: error.message || 'Unknown error',
      code: error.code || 'N/A',
      details: error.details || 'No additional details',
      hint: error.hint || 'No hints available',
      timestamp: new Date().toISOString(),
      stack: error.stack || 'No stack trace available'
    };

    return details;
  };

  const getErrorType = () => {
    if (!error?.code) return 'Unknown Error';
    
    switch (error.code) {
      case 'PGRST116':
        return 'Database Query Error';
      case 'PGRST301':
        return 'Permission Denied';
      case 'PGRST204':
        return 'Resource Not Found';
      case '23505':
        return 'Duplicate Entry';
      case '23503':
        return 'Foreign Key Violation';
      default:
        return `Database Error (${error.code})`;
    }
  };

  const getUserFriendlyMessage = () => {
    if (!error?.code) return message;

    switch (error.code) {
      case 'PGRST116':
        return 'The requested data could not be found or you may not have permission to access it.';
      case 'PGRST301':
        return 'You do not have permission to perform this action.';
      case 'PGRST204':
        return 'The requested resource was not found.';
      case '23505':
        return 'This item already exists. Please try with different information.';
      case '23503':
        return 'This action cannot be completed because it would break data relationships.';
      default:
        return message;
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {getUserFriendlyMessage()}
                </p>
                
                {error && (
                  <div className="mt-3 text-xs text-gray-400">
                    <span className="font-medium">Error Type:</span> {getErrorType()}
                  </div>
                )}

                {showDetails && error && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showErrorDetails ? (
                        <>
                          <ChevronUpIcon className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-4 w-4 mr-1" />
                          Show Details
                        </>
                      )}
                    </button>

                    {showErrorDetails && errorDetails && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono">
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-gray-700">Message:</span>
                            <div className="text-gray-600">{errorDetails.message}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Code:</span>
                            <div className="text-gray-600">{errorDetails.code}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Details:</span>
                            <div className="text-gray-600">{errorDetails.details}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Hint:</span>
                            <div className="text-gray-600">{errorDetails.hint}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Timestamp:</span>
                            <div className="text-gray-600">{errorDetails.timestamp}</div>
                          </div>
                          {import.meta.env.MODE === 'development' && (
                            <div>
                              <span className="font-semibold text-gray-700">Stack Trace:</span>
                              <div className="text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {errorDetails.stack}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                onClick={onClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
