import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileTextIcon, LoaderIcon, CalendarIcon, CheckCircleIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateDocument } from '../utils/api';
import { createAssignment } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BackButton from '../components/BackButton';
import ErrorAlert from '../components/ErrorAlert';
import ScrollToTopButton from '../components/ScrollToTopButton';
const CreateAssignment = () => {
  const {
    classId
  } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    setGenerationSuccess(false);
    
    try {
      const result = await generateDocument(aiPrompt, maxMarks, 7); // Default to 7 days for AI generation
      if (result && result.success) {
        if (result.generated_content) {
          setContent(result.generated_content);
          setGenerationSuccess(true);
        } else {
          throw new Error('Generated content not found in response');
        }
      } else {
        const errorMessage = result?.error || 'Failed to generate document';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error generating document. Please try again.';
      setError(errorMessage);
      setGenerationSuccess(false);
    } finally {
      setIsGenerating(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    if (!title || !content) {
      setError('Title and content are required');
      setIsCreating(false);
      return;
    }

    if (!user || !classId) {
      setError('User or class information is missing');
      setIsCreating(false);
      return;
    }

    try {
      // Create assignment data object
      const assignmentData = {
        class_id: classId,
        teacher_id: user.id,
        title: title.trim(),
        content: content.trim(),
        max_marks: maxMarks,
        due_date: new Date(dueDate).toISOString(),
        is_ai_generated: isUsingAI,
        ai_prompt: isUsingAI ? aiPrompt : undefined,

      };

      // Call the API to create the assignment
      const { data, error } = await createAssignment(assignmentData);

      if (error) {
        throw error;
      }


      toast.success('Assignment created successfully!');
      // Navigate back to the class page on success
      navigate(`/dashboard/classes/${classId}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create assignment. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setIsCreating(false);
    }
  };

  if (error) {
    return <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton to={`/dashboard/classes/${classId}`} />
      </div>
      <ErrorAlert
        message={error}
        onDismiss={() => setError(null)}
      />
    </div>;
  }
  
  return <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton to={`/dashboard/classes/${classId}`} />
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-6">Create New Assignment</h1>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Title
              </label>
              <input type="text" id="title" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea id="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxMarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Marks
                </label>
                <input type="number" id="maxMarks" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={maxMarks} onChange={e => setMaxMarks(parseInt(e.target.value))} min="1" required />
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date & Time
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="dueDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Due: {new Date(dueDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assignment Content</h2>
              <div className="flex items-center">
                <button type="button" className={`px-4 py-2 rounded-md mr-2 ${!isUsingAI ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setIsUsingAI(false)}>
                  Manual
                </button>
                <button type="button" className={`px-4 py-2 rounded-md ${isUsingAI ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setIsUsingAI(true)}>
                  AI Generated
                </button>
              </div>
            </div>
            {isUsingAI ? <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">
                    AI Document Generation
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Describe the assignment you want to create, and our AI will
                    generate content, including questions and a marking scheme.
                  </p>
                  <div className="mb-4">
                    <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt for AI
                    </label>
                    <textarea id="aiPrompt" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="E.g., Create a quiz about quadratic equations with 3 questions of varying difficulty" />
                  </div>
                  <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center" onClick={handleAIGenerate} disabled={!aiPrompt || isGenerating}>
                    {isGenerating ? <>
                        <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </> : generationSuccess ? <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Generated
                      </> : 'Generate Document'}
                  </button>

                 </div>
                 {generationSuccess && <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Generated Content:</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  </div>}

              </div> : <div>
                <textarea id="content" rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={content} onChange={e => setContent(e.target.value)} placeholder="Enter your assignment content here..." required={!isUsingAI} />
              </div>}
          </div>
        </div>
        <div className="flex justify-end">
          <button type="button" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50" onClick={() => navigate(`/dashboard/classes/${classId}`)}>
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50" disabled={!title || !content && !isUsingAI || isCreating}>
            {isCreating ? <>
                <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </> : <>
                <FileTextIcon className="h-5 w-5 mr-2" />
                Create Assignment
              </>}
          </button>
        </div>
      </form>
      <ScrollToTopButton />
    </div>;
};
export default CreateAssignment;