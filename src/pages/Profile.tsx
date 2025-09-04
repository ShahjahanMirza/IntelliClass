import React, { useState, useEffect } from 'react';
import { UserIcon, SaveIcon, LoaderIcon, CameraIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadAvatar } from '../utils/supabase';
import { toast } from 'react-toastify';
import BackButton from '../components/BackButton';
import ScrollToTopButton from '../components/ScrollToTopButton';
const Profile = () => {
  const {
    user,
    updateProfile
  } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      let avatarUrl = user.avatar_url;

      // Upload avatar if a new one was selected
      if (avatarFile) {
        try {
          const { data: uploadData, error: uploadError } = await uploadAvatar(user.id, avatarFile);
          if (uploadError) {
            console.warn('Avatar upload failed, continuing with profile update:', uploadError);
            toast.warn('Avatar upload failed, but profile will be updated');
            // Don't throw error, just continue without updating avatar
          } else {
            avatarUrl = uploadData?.publicUrl;
          }
        } catch (avatarError) {
          console.warn('Avatar upload failed, continuing with profile update:', avatarError);
          toast.warn('Avatar upload failed, but profile will be updated');
          // Don't throw error, just continue without updating avatar
        }
      }

      // Update profile
      const updates = {
        name: name.trim(),
        email: email.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl })
      };

      const { data, error } = await updateUserProfile(user.id, updates);
      if (error) {
        throw error;
      }

      // Update the user context with new data
      if (data) {
        updateProfile(data);
      }

      setShowSuccess(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset avatar file after successful upload
      setAvatarFile(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  return <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center">
          <UserIcon className="h-6 w-6 mr-3 text-blue-600" />
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mr-4 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 text-2xl font-medium">
                    {name ? name[0]?.toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-4 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700"
              >
                <CameraIcon className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {/* <div>
              <h2 className="text-xl font-medium">{name || 'User'}</h2>
              <p className="text-gray-500 capitalize">{user?.role || 'Role'}</p>
            </div> */}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={user?.role || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Role cannot be changed after account creation</p>
          </div> */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            {showSuccess && <div className="text-green-600 flex items-center">
                <span className="mr-2">✓</span> Profile updated successfully!
              </div>}
            <div className="ml-auto">
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50">
                {isSaving ? <>
                    <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </> : <>
                    <SaveIcon className="h-5 w-5 mr-2" />
                    Save Changes
                  </>}
              </button>
            </div>
          </div>
        </form>
      </div>
      <ScrollToTopButton />
    </div>;
};
export default Profile;