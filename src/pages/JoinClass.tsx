import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, LoaderIcon } from 'lucide-react';
import BackButton from '../components/BackButton';
import { joinClass } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { toast } from 'react-toastify';
import ScrollToTopButton from '../components/ScrollToTopButton';
const JoinClass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useError();
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to join a class');
      return;
    }

    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    setIsJoining(true);

    try {
      const { data, error: joinError } = await joinClass(user.id, classCode.trim().toUpperCase());

      if (joinError) {
        throw joinError;
      }

      toast.success('Successfully joined the class!');
      // Navigate to classes page to see the newly joined class
      navigate('/dashboard/classes');
    } catch (error: any) {
      console.error('Error joining class:', error);

      // Handle specific error cases
      let userMessage = 'An error occurred. Please try again.';
      let showModal = false;

      if (error.code === 'PGRST116') {
        userMessage = 'Class not found. Please check the class code and try again.';
        setError(userMessage);
      } else if (error.message?.includes('already a member')) {
        userMessage = 'You are already a member of this class.';
        setError(userMessage);
      } else if (error.message?.includes('Class not found')) {
        userMessage = 'Class not found. Please check the class code and try again.';
        setError(userMessage);
      } else {
        // For unexpected errors, show the modal with details
        showModal = true;
        showError('Failed to join class', error, 'Join Class Error');
        setError('An unexpected error occurred. Please try again.');
      }

      if (!showModal) {
        toast.error(userMessage);
      }
    } finally {
      setIsJoining(false);
    }
  };
  return <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton to="/dashboard/classes" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold mb-1">Join a Class</h1>
          <p className="text-gray-600">
            Enter the class code provided by your teacher
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-1">
              Class Code*
            </label>
            <input
              id="classCode"
              type="text"
              value={classCode}
              onChange={e => setClassCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ABC123"
              maxLength={6}
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the 6-character class code provided by your teacher
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button type="button" onClick={() => navigate('/dashboard/classes')} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={!classCode || isJoining} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50">
              {isJoining ? <>
                  <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                  Joining...
                </> : <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Join Class
                </>}
            </button>
          </div>
        </form>
      </div>
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">How to join a class?</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Ask your teacher for the class code</li>
          <li>Enter the code in the field above</li>
          <li>Click "Join Class" to get access to the class materials</li>
        </ol>
      </div>
      <ScrollToTopButton />
    </div>;
};
export default JoinClass;