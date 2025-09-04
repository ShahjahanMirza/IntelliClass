import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { getClassDetails } from '../utils/supabase';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireTeacher?: boolean;
  requireClassMember?: boolean;
  requireClassExists?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireTeacher = false,
  requireClassMember = false,
  requireClassExists = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useError();
  const { classId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('ProtectedRoute: Checking permissions...', {
        requireAuth,
        requireTeacher,
        requireClassMember,
        requireClassExists,
        user: !!user,
        classId,
        authLoading
      });

      if (authLoading) {
        console.log('ProtectedRoute: Auth still loading...');
        return;
      }

      // Check authentication requirement
      if (requireAuth && !user) {
        console.log('ProtectedRoute: Auth required but no user found');
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      // If no class-specific checks are needed, allow access
      if (!requireTeacher && !requireClassMember && !requireClassExists) {
        console.log('ProtectedRoute: No class-specific checks needed, allowing access');
        setHasPermission(true);
        setIsLoading(false);
        return;
      }

      // Class-specific checks require a classId
      if (!classId) {
        console.log('ProtectedRoute: Class-specific checks required but no classId found');
        setError('Invalid class ID');
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if class exists
        if (requireClassExists || requireTeacher || requireClassMember) {
          console.log('ProtectedRoute: Checking if class exists...', classId);
          const { data: classData, error: classError } = await getClassDetails(classId);

          if (classError) {
            console.error('ProtectedRoute: Error fetching class details:', classError);
            if (classError.code === 'PGRST116') {
              setError('Class not found');
            } else {
              showError('Failed to verify class access', classError, 'Access Verification Error');
              setError('Failed to verify class access');
            }
            setHasPermission(false);
            setIsLoading(false);
            return;
          }

          if (!classData) {
            console.log('ProtectedRoute: Class not found');
            setError('Class not found');
            setHasPermission(false);
            setIsLoading(false);
            return;
          }

          console.log('ProtectedRoute: Class found:', classData.name);

          // Check teacher permission
          if (requireTeacher && user) {
            const isTeacher = classData.teacher_id === user.id;
            console.log('ProtectedRoute: Teacher check:', { isTeacher, teacherId: classData.teacher_id, userId: user.id });
            
            if (!isTeacher) {
              setError('You must be the teacher of this class to access this page');
              setHasPermission(false);
              setIsLoading(false);
              return;
            }
          }

          // Check class membership
          if (requireClassMember && user) {
            const isMember = classData.class_members?.some((member: any) => member.users.id === user.id);
            const isTeacher = classData.teacher_id === user.id;
            console.log('ProtectedRoute: Member check:', { isMember, isTeacher });
            
            if (!isMember && !isTeacher) {
              setError('You must be a member of this class to access this page');
              setHasPermission(false);
              setIsLoading(false);
              return;
            }
          }
        }

        console.log('ProtectedRoute: All checks passed, allowing access');
        setHasPermission(true);
      } catch (err: any) {
        console.error('ProtectedRoute: Unexpected error during permission check:', err);
        showError('Failed to verify permissions', err, 'Permission Check Error');
        setError('Failed to verify permissions');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user, authLoading, classId, requireAuth, requireTeacher, requireClassMember, requireClassExists, showError]);

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Show error if permission check failed
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      </div>
    );
  }

  // Redirect to classes if no permission
  if (!hasPermission) {
    return <Navigate to="/dashboard/classes" replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;
