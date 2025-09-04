import React, { createContext, useContext, useState, ReactNode } from 'react';
import ErrorModal from '../components/ErrorModal';

interface ErrorInfo {
  id: string;
  title?: string;
  message: string;
  error?: any;
  timestamp: Date;
}

interface ErrorContextType {
  showError: (message: string, error?: any, title?: string) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  errors: ErrorInfo[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const showError = (message: string, error?: any, title?: string) => {
    const errorInfo: ErrorInfo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      message,
      error,
      timestamp: new Date()
    };

    console.error('Global Error:', {
      message,
      error,
      title,
      timestamp: errorInfo.timestamp
    });

    setErrors(prev => [...prev, errorInfo]);
  };

  const clearError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const currentError = errors[0]; // Show the first error in the queue

  return (
    <ErrorContext.Provider value={{ showError, clearError, clearAllErrors, errors }}>
      {children}
      {currentError && (
        <ErrorModal
          isOpen={true}
          onClose={() => clearError(currentError.id)}
          title={currentError.title}
          message={currentError.message}
          error={currentError.error}
          showDetails={true}
        />
      )}
    </ErrorContext.Provider>
  );
};

// Utility function to handle common error patterns
export const handleSupabaseError = (error: any, defaultMessage: string = 'An error occurred') => {
  const context = useContext(ErrorContext);
  if (!context) {
    console.error('handleSupabaseError called outside ErrorProvider:', error);
    return;
  }

  let userMessage = defaultMessage;
  let title = 'Error';

  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        title = 'Data Not Found';
        userMessage = 'The requested information could not be found. You may not have permission to access it, or it may have been deleted.';
        break;
      case 'PGRST301':
        title = 'Permission Denied';
        userMessage = 'You do not have permission to perform this action.';
        break;
      case 'PGRST204':
        title = 'Not Found';
        userMessage = 'The requested resource was not found.';
        break;
      case '23505':
        title = 'Duplicate Entry';
        userMessage = 'This item already exists. Please try with different information.';
        break;
      case '23503':
        title = 'Data Relationship Error';
        userMessage = 'This action cannot be completed because it would break data relationships.';
        break;
      default:
        title = 'Database Error';
        userMessage = error.message || defaultMessage;
    }
  } else if (error?.message) {
    userMessage = error.message;
  }

  context.showError(userMessage, error, title);
};

export default ErrorContext;
