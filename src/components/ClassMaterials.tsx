import React, { useState, useEffect } from 'react';
import { PlusIcon, RefreshCwIcon } from 'lucide-react';
import { ClassMaterial, getClassMaterials } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import MaterialsList from './MaterialsList';
import UploadMaterialModal from './UploadMaterialModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

interface ClassMaterialsProps {
  classId: string;
}

const ClassMaterials: React.FC<ClassMaterialsProps> = ({ classId }) => {
  const { user, isTeacherForClass } = useAuth();
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const fetchMaterials = async () => {
    try {
      setError(null);

      // Check if user is teacher for this class
      if (user && classId) {
        const teacherStatus = await isTeacherForClass(classId);
        setIsTeacher(teacherStatus);
      }

      const { data, error: fetchError } = await getClassMaterials(classId);

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch materials');
      }

      setMaterials(data || []);
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      setError(err.message || 'Failed to load materials');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const { data, error: fetchError } = await getClassMaterials(classId);

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch materials');
      }

      setMaterials(data || []);
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      setError(err.message || 'Failed to load materials');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMaterialsUploaded = () => {
    handleRefresh();
  };

  const handleMaterialDeleted = () => {
    handleRefresh();
  };

  useEffect(() => {
    if (classId && user) {
      fetchMaterials();
    }
  }, [classId, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Class Materials</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isTeacher 
              ? "Upload and manage materials for your students"
              : "Download materials shared by your teacher"
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCwIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Upload Button (Teachers Only) */}
          {isTeacher && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload Materials
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)}
        />
      )}

      {/* Materials Count */}
      {materials.length > 0 && (
        <div className="text-sm text-gray-600">
          {materials.length} material{materials.length !== 1 ? 's' : ''} available
        </div>
      )}

      {/* Materials List */}
      <MaterialsList
        materials={materials}
        isTeacher={isTeacher}
        onMaterialDeleted={handleMaterialDeleted}
      />

      {/* Upload Modal */}
      {isTeacher && user && (
        <UploadMaterialModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          classId={classId}
          teacherId={user.id}
          onMaterialsUploaded={handleMaterialsUploaded}
        />
      )}
    </div>
  );
};

export default ClassMaterials;
