import React, { useState } from 'react';
import { DownloadIcon, EditIcon, TrashIcon, FileIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import { ClassMaterial, deleteClassMaterial } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface MaterialsListProps {
  materials: ClassMaterial[];
  isTeacher: boolean;
  onMaterialDeleted: () => void;
  onMaterialEdit?: (material: ClassMaterial) => void;
}

const MaterialsList: React.FC<MaterialsListProps> = ({
  materials,
  isTeacher,
  onMaterialDeleted,
  onMaterialEdit
}) => {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileIcon = (fileType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension || '')) {
      return <ImageIcon className="h-6 w-6 text-green-600" />;
    }
    
    if (['pdf'].includes(extension || '')) {
      return <FileTextIcon className="h-6 w-6 text-red-600" />;
    }
    
    if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileIcon className="h-6 w-6 text-orange-600" />;
    }

    if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileIcon className="h-6 w-6 text-green-700" />;
    }

    if (['zip'].includes(extension || '')) {
      return <FileIcon className="h-6 w-6 text-purple-600" />;
    }
    
    return <FileIcon className="h-6 w-6 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (material: ClassMaterial) => {
    // Open the file URL in a new tab to trigger download
    window.open(material.file_url, '_blank');
    toast.success(`Downloading ${material.file_name}`);
  };

  const handleDelete = async (material: ClassMaterial) => {
    // Additional security check: only allow teachers to delete their own materials
    if (!isTeacher || !user || material.teacher_id !== user.id) {
      toast.error('You do not have permission to delete this material');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${material.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(material.id);

    try {
      const { error } = await deleteClassMaterial(material.id);

      if (error) {
        throw new Error(error.message || 'Failed to delete material');
      }

      toast.success('Material deleted successfully');
      onMaterialDeleted();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast.error(error.message || 'Failed to delete material');
    } finally {
      setDeletingId(null);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
        <p className="text-gray-500">
          {isTeacher 
            ? "Upload your first class material to get started." 
            : "Your teacher hasn't uploaded any materials yet."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <div
          key={material.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            {/* Material Info */}
            <div className="flex items-start space-x-4 flex-1">
              {/* File Icon */}
              <div className="flex-shrink-0 mt-1">
                {getFileIcon(material.file_type, material.file_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {material.title}
                </h3>
                
                {material.description && (
                  <p className="text-gray-600 mb-2 text-sm">
                    {material.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{material.file_name}</span>
                  <span>•</span>
                  <span>{formatFileSize(material.file_size)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(material.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Download Button */}
              <button
                onClick={() => handleDownload(material)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Download"
              >
                <DownloadIcon className="h-5 w-5" />
              </button>

              {/* Teacher Actions */}
              {isTeacher && (
                <>
                  {/* Edit Button */}
                  {onMaterialEdit && user && material.teacher_id === user.id && (
                    <button
                      onClick={() => onMaterialEdit(material)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  {user && material.teacher_id === user.id && (
                    <button
                      onClick={() => handleDelete(material)}
                      disabled={deletingId === material.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deletingId === material.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaterialsList;
