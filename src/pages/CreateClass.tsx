import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, LoaderIcon } from 'lucide-react';
import BackButton from '../components/BackButton';
import { createClass } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ErrorAlert from '../components/ErrorAlert';
import ScrollToTopButton from '../components/ScrollToTopButton';
const CreateClass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [colorScheme, setColorScheme] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const colorOptions = [{
    name: 'Blue',
    value: '#3B82F6',
    bgClass: 'bg-blue-500'
  }, {
    name: 'Green',
    value: '#10B981',
    bgClass: 'bg-green-500'
  }, {
    name: 'Purple',
    value: '#8B5CF6',
    bgClass: 'bg-purple-500'
  }, {
    name: 'Red',
    value: '#EF4444',
    bgClass: 'bg-red-500'
  }, {
    name: 'Orange',
    value: '#F59E0B',
    bgClass: 'bg-orange-500'
  }, {
    name: 'Teal',
    value: '#EC4899',
    bgClass: 'bg-teal-500'
  }, {
    name: 'Indigo',
    value: '#6366F1',
    bgClass: 'bg-indigo-500'
  }, {
    name: 'Pink',
    value: '#14B8A6',
    bgClass: 'bg-pink-500'
  }];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setError('Class name is required');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a class');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const { data, error: createError } = await createClass({
        name: className.trim(),
        subject: subject.trim(),
        description: description.trim(),
        color_scheme: colorScheme,
        teacher_id: user.id
      });

      if (createError) {
        throw createError;
      }

      toast.success('Class created successfully!');
      navigate('/dashboard/classes');
    } catch (error: any) {
      console.error('Error creating class:', error);
      const errorMessage = error.message || 'Failed to create class. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };
  return <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton to="/dashboard/classes" />
      </div>
      {error && <ErrorAlert message={error} className="mb-4" />}
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold mb-1">Create New Class</h1>
          <p className="text-gray-600">
            Set up a new classroom for your students
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
              Class Name*
            </label>
            <input id="className" type="text" value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Mathematics 101" required />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Mathematics" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Provide a description of your class" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Scheme
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map(color => <button key={color.value} type="button" className={`h-12 rounded-md ${color.bgClass} ${colorScheme === color.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} onClick={() => setColorScheme(color.value)} aria-label={`Select ${color.name} color`} />)}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button type="button" onClick={() => navigate('/dashboard/classes')} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={!className || isCreating} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50">
              {isCreating ? <>
                  <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                  Creating...
                </> : <>
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Create Class
                </>}
            </button>
          </div>
        </form>
      </div>
      <ScrollToTopButton />
    </div>;
};
export default CreateClass;