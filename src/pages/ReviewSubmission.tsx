import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gradeSubmission } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { CheckCircleIcon, FileIcon, DownloadIcon, XIcon } from 'lucide-react';
import { getSubmissionById, updateSubmission, createNotification } from '../utils/supabase';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { toast } from 'react-toastify';

interface GradingResult {
  final_marks: number;
  max_marks: number;
  percentage: number;
  grade_letter: string;
  review: string;
  improvement?: number;
  breakdown?: Record<string, string>;
  graded_at: string;
  grading_mode: string;
}

const ReviewSubmission: React.FC = () => {
  const { assignmentId, submissionId } = useParams<{ assignmentId: string; submissionId: string }>();
  const navigate = useNavigate();

  // States
  const [submission, setSubmission] = useState<any>(null);
  const [gradingMode, setGradingMode] = useState<string>("Compare OCR'd content with Generated document");
  const [gradingCriteria, setGradingCriteria] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingGrade, setIsEditingGrade] = useState<boolean>(false);
  const [manualGrade, setManualGrade] = useState<number>(0);
  const [manualFeedback, setManualFeedback] = useState<string>('');
  const [showContentModal, setShowContentModal] = useState<boolean>(false);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [showSideBySideModal, setShowSideBySideModal] = useState<boolean>(false);

  // Debug modal states
  console.log('Modal states:', { showContentModal, showOcrModal, showSideBySideModal });
  
  // Fetch submission and assignment data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!submissionId) {
          throw new Error('Submission ID is required');
        }

        const { data: submissionData, error: submissionError } = await getSubmissionById(submissionId);

        if (submissionError) {
          throw submissionError;
        }

        if (!submissionData) {
          throw new Error('Submission not found');
        }


        setSubmission(submissionData);

        // Set existing grade as grading result if available
        if (submissionData.grade !== null) {
          setGradingResult({
            final_marks: submissionData.grade,
            max_marks: submissionData.assignments.max_marks,
            percentage: Math.round((submissionData.grade / submissionData.assignments.max_marks) * 100),
            grade_letter: getGradeLetter((submissionData.grade / submissionData.assignments.max_marks) * 100),
            review: submissionData.feedback || 'No feedback provided',
            graded_at: submissionData.graded_at || new Date().toISOString(),
            grading_mode: "Compare OCR'd content with Generated document"
          });
          setManualGrade(submissionData.grade);
          setManualFeedback(submissionData.feedback || '');
        } else {
          setManualGrade(0);
          setManualFeedback('');
        }

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load submission data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [assignmentId, submissionId]);

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handleManualGrade = async () => {
    // Add null checks to prevent the error
    if (!submission || !submission.assignments) {
      setError('Submission data not loaded. Please refresh the page and try again.');
      return;
    }

    if (manualGrade < 0 || manualGrade > submission.assignments.max_marks) {
      setError(`Grade must be between 0 and ${submission.assignments.max_marks}`);
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      const percentage = Math.round((manualGrade / submission.assignments.max_marks) * 100);

      // Update submission with manual grade
      await updateSubmission(submission.id, {
        grade: manualGrade,
        feedback: manualFeedback,
        graded_at: new Date().toISOString(),
        graded_by: 'manual'
      });

      // Update grading result display
      setGradingResult({
        final_marks: manualGrade,
        max_marks: submission.assignments.max_marks,
        percentage: percentage,
        grade_letter: getGradeLetter(percentage),
        review: manualFeedback,
        graded_at: new Date().toISOString(),
        grading_mode: 'Manual grading by teacher'
      });

      // Create notification for student about grade update
      await createNotification({
        user_id: submission.users.id,
        title: 'Grade Updated',
        message: `Your grade for "${submission.assignments.title}" has been updated to ${manualGrade}/${submission.assignments.max_marks}`,
        type: 'grade',
        related_id: submission.id
      });

      setIsEditingGrade(false);
      toast.success('Grade updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update grade');
      console.error('Error updating grade:', err);
    } finally {
      setIsGrading(false);
    }
  };
  
  // Handle grading
  const handleGrade = async () => {
    // Add null checks to prevent the error
    if (!submission || !submission.assignments) {
      setError('Submission data not loaded. Please refresh the page and try again.');
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      const generatedContent = {
        content: submission.assignments.content,
        max_marks: submission.assignments.max_marks,
        marks: Math.floor(submission.assignments.max_marks * 0.8),
        due_date: submission.assignments.due_date,
        generated_at: submission.assignments.created_at,
        prompt_used: submission.assignments.ai_prompt || 'Standard assignment'
      };

      const response = await gradeSubmission(
        gradingMode,
        submission.ocr_text,
        generatedContent,
        gradingCriteria || undefined,
        customInstructions || undefined
      );

      if (response.success) {
        setGradingResult(response);

        // Update submission with new grade
        await updateSubmission(submission.id, {
          grade: response.final_marks,
          feedback: response.review,
          graded_at: new Date().toISOString(),
          graded_by: 'manual' // Manual grading by teacher
        });

        toast.success('Submission graded successfully!');
      } else {
        setError(response.error || 'Grading failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during grading');
      console.error('Grading error:', err);
    } finally {
      setIsGrading(false);
    }
  };
  
  if (error) {
    return (
      <div className="p-6">
        <BackButton to="/dashboard" />
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)} 
          className="mt-4"
        />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-6">
        <BackButton to="/dashboard" />
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6">
        <BackButton to="/dashboard" />
        <div className="text-center">
          <p className="text-gray-500">Submission not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton to={submission ? `/dashboard/classes/${submission.assignments.classes.id}/assignments/${assignmentId}` : '/dashboard'} />
      </div>

      {/* Debug indicator */}
      {(showContentModal || showOcrModal || showSideBySideModal) && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50">
          Modal Active: {showContentModal ? 'Content' : showOcrModal ? 'OCR' : 'Side-by-Side'}
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">Review Submission</h1>
          <div className="text-gray-600 mb-4">
            Assignment: {submission.assignments.title} • Student: {submission.users?.name || 'Loading student info...'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Assignment</h2>
          <h3 className="text-lg font-medium mb-2">{submission.assignments.title}</h3>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Max Marks:</span>
            <span className="ml-2">{submission.assignments.max_marks}</span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Due Date:</span>
            <span className="ml-2">{new Date(submission.assignments.due_date).toLocaleDateString()}</span>
          </div>
          <div className="bg-gray-50 rounded-md">
            <div className="flex items-center justify-between p-4 pb-2">
              <h4 className="text-sm font-medium text-gray-500">Content:</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    console.log('Content modal button clicked');
                    setShowContentModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View Full
                </button>
                <button
                  onClick={() => {
                    console.log('Side-by-side modal button clicked');
                    setShowSideBySideModal(true);
                  }}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Compare Side-by-Side
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div
                className="bg-white border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto cursor-pointer hover:bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                onClick={() => setShowContentModal(true)}
              >
                <ReactMarkdown>
                  {submission.assignments.content}
                </ReactMarkdown>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Click to view full content • Scroll to see more
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Student Submission</h2>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Student:</span>
            <span className="ml-2">{submission.users?.name || 'Loading student info...'}</span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Email:</span>
            <span className="ml-2">{submission.users?.email || 'Loading email...'}</span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Submitted:</span>
            <span className="ml-2">{new Date(submission.submitted_at).toLocaleString()}</span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">File:</span>
            <div className="ml-2 flex items-center">
              <FileIcon className="h-4 w-4 mr-1" />
              <span className="mr-2">{submission.file_name}</span>
              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <DownloadIcon className="h-4 w-4 mr-1" />
                View File
              </a>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Submitted
            </span>
          </div>
          <div className="bg-gray-50 rounded-md">
            <div className="flex items-center justify-between p-4 pb-2">
              <h4 className="text-sm font-medium text-gray-500">Extracted Text (OCR):</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    console.log('OCR modal button clicked');
                    setShowOcrModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View Full
                </button>
                <button
                  onClick={() => setShowSideBySideModal(true)}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Compare Side-by-Side
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div
                className="bg-white border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto cursor-pointer hover:bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                onClick={() => setShowOcrModal(true)}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {submission.ocr_text || 'No OCR text available'}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Click to view full OCR text • Scroll to see more
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Grading Options</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Grading Mode</label>
          <select
            value={gradingMode}
            onChange={(e) => setGradingMode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isGrading}
          >
            <option value="Compare OCR'd content with Generated document">Compare with Original</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Grading Criteria (Optional)</label>
          <textarea
            value={gradingCriteria}
            onChange={(e) => setGradingCriteria(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="E.g., Focus on mathematical accuracy and step-by-step solutions"
            disabled={isGrading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions (Optional)</label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="E.g., Be lenient on formatting but strict on conceptual understanding"
            disabled={isGrading}
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleGrade}
            disabled={isGrading || !submission?.assignments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isGrading ? (
              <span className="flex items-center">
                <span className="inline-block animate-spin mr-2">⟳</span>
                Grading...
              </span>
            ) : !submission?.assignments ? 'Loading...' : 'Auto Grade'}
          </button>

          <button
            onClick={() => setIsEditingGrade(!isEditingGrade)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            {isEditingGrade ? 'Cancel Manual Grade' : 'Manual Grade'}
          </button>
        </div>
      </div>

      {/* Manual Grading Section */}
      {isEditingGrade && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Grading</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (out of {submission?.assignments?.max_marks || 0})
              </label>
              <input
                type="number"
                min="0"
                max={submission?.assignments?.max_marks || 0}
                value={manualGrade}
                onChange={(e) => setManualGrade(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isGrading || !submission?.assignments}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage
              </label>
              <input
                type="text"
                value={submission.assignments.max_marks > 0 ? `${Math.round((manualGrade / submission.assignments.max_marks) * 100)}%` : '0%'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback
            </label>
            <textarea
              value={manualFeedback}
              onChange={(e) => setManualFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              placeholder="Provide feedback for the student..."
              disabled={isGrading}
            />
          </div>

          <button
            onClick={handleManualGrade}
            disabled={isGrading || !submission?.assignments}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isGrading ? 'Saving...' : !submission?.assignments ? 'Loading...' : 'Save Grade'}
          </button>
        </div>
      )}
      
      {gradingResult && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Grading Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Marks</h3>
              <p className="text-2xl font-bold">{gradingResult.final_marks} / {submission?.assignments?.max_marks || 100}</p>
              <p className="text-sm text-gray-500">
                {submission?.assignments?.max_marks > 0 
                  ? ((gradingResult.final_marks / submission.assignments.max_marks) * 100).toFixed(1)
                  : '0'
                }%
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Grade</h3>
              <p className="text-2xl font-bold">
                {(() => {
                  const percentage = submission?.assignments?.max_marks > 0 
                    ? (gradingResult.final_marks / submission.assignments.max_marks) * 100
                    : 0;
                  if (percentage >= 90) return 'A+';
                  if (percentage >= 85) return 'A';
                  if (percentage >= 80) return 'A-';
                  if (percentage >= 75) return 'B+';
                  if (percentage >= 70) return 'B';
                  if (percentage >= 65) return 'B-';
                  if (percentage >= 60) return 'C+';
                  if (percentage >= 55) return 'C';
                  if (percentage >= 50) return 'C-';
                  if (percentage >= 45) return 'D+';
                  if (percentage >= 40) return 'D';
                  return 'F';
                })()} 
              </p>
              <p className="text-sm text-gray-500">Grade based on percentage</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Graded At</h3>
              <p className="text-lg font-medium">{new Date().toLocaleString()}</p>
              <p className="text-sm text-gray-500">Automatic Grading</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Review</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="bg-white border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {(() => {
                    try {
                      let reviewText = gradingResult.review;
                      
                      // Handle markdown code block format
                      if (typeof reviewText === 'string' && reviewText.includes('```json')) {
                        // Extract JSON from markdown code block
                        const jsonMatch = reviewText.match(/```json\s*([\s\S]*?)\s*```/);
                        if (jsonMatch) {
                          reviewText = jsonMatch[1].trim();
                        }
                      }
                      
                      // Check if review is a JSON string
                      if (typeof reviewText === 'string' && reviewText.trim().startsWith('{')) {
                        const parsed = JSON.parse(reviewText);
                        // Extract only the feedback from the parsed JSON
                        return parsed.feedback || 'No feedback available';
                      }
                      
                      // If it's already a string or object, return as is
                      return reviewText;
                    } catch (error) {
                      // If JSON parsing fails, try to extract feedback manually
                      if (typeof gradingResult.review === 'string' && gradingResult.review.includes('"feedback"')) {
                        const feedbackMatch = gradingResult.review.match(/"feedback"\s*:\s*"([^"]*)"/s);
                        if (feedbackMatch) {
                          return feedbackMatch[1];
                        }
                      }
                      return gradingResult.review;
                    }
                  })()}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Scroll to view full review
              </div>
            </div>
          </div>
          
          {gradingResult.breakdown && (
            <div>
              <h3 className="text-lg font-medium mb-2">Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(gradingResult.breakdown).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{category}</h4>
                    <p className="text-lg font-medium">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate(`/dashboard/classes/${submission?.assignments?.classes.id}/assignments/${assignmentId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Assignment
            </button>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Assignment Content</h2>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ReactMarkdown>
                {submission.assignments.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* OCR Modal */}
      {showOcrModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Extracted Text (OCR)</h2>
              <button
                onClick={() => setShowOcrModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {submission.ocr_text || 'No OCR text available'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Modal */}
      {showSideBySideModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Side-by-Side Comparison</h2>
              <button
                onClick={() => setShowSideBySideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div>
                <h3 className="text-lg font-medium mb-4 text-blue-600">Assignment Content</h3>
                <div className="bg-gray-50 rounded-md p-4 h-full">
                  <ReactMarkdown>
                    {submission.assignments.content}
                  </ReactMarkdown>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4 text-green-600">Student Submission (OCR)</h3>
                <div className="bg-gray-50 rounded-md p-4 h-full">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {submission.ocr_text || 'No OCR text available'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default ReviewSubmission;