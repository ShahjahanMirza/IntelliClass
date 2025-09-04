import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CalendarIcon, CheckCircleIcon, DownloadIcon, ChevronDownIcon, ChevronUpIcon, KeyIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getAssignmentDetails, getAssignmentSubmissions, getSubmission, getTicketsBySubmission, updateAssignmentAnswerKey } from '../utils/supabase';
import { generateAnswers } from '../utils/api';
import { toast } from 'sonner';
import CreateTicket from '../components/CreateTicket';
import ScrollToTopButton from '../components/ScrollToTopButton';
const AssignmentDetail = () => {
  const {
    classId,
    assignmentId
  } = useParams();
  const {
    user,
    isTeacherForClass
  } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState([]);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const downloadPdf = () => {
    if (contentRef.current) {
      const element = contentRef.current;

      const originalMaxHeight = element.style.maxHeight;
      const originalOverflowY = element.style.overflowY;
      element.style.maxHeight = 'none';
      element.style.overflowY = 'visible';
      // Give the browser a moment to apply the style changes
      setTimeout(() => {
        html2canvas(element, {
            scrollY: -window.scrollY
        }).then((canvas) => {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;

          const ratio = pdfWidth / canvasWidth;
          const scaledHeight = canvasHeight * ratio;

          let y = 0;
          let page = 1;
          while (y < scaledHeight) {
              const sliceHeight = Math.min(pdfHeight, scaledHeight - y);
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvasWidth;
              sliceCanvas.height = sliceHeight / ratio;

              const sliceCtx = sliceCanvas.getContext('2d');
              if (sliceCtx) {
                sliceCtx.drawImage(canvas, 0, y / ratio, canvasWidth, sliceHeight / ratio, 0, 0, canvasWidth, sliceHeight / ratio);
              }


              if (page > 1) {
                  pdf.addPage();
              }

              const sliceDataUrl = sliceCanvas.toDataURL('image/png');
              pdf.addImage(sliceDataUrl, 'PNG', 0, 0, pdfWidth, sliceHeight);

              y += pdfHeight;
              page++;
          }

          pdf.save(`${assignment.title}.pdf`);
        }).finally(() => {
          element.style.maxHeight = originalMaxHeight;
          element.style.overflowY = originalOverflowY;
        });
      }, 0);
    }
  };

  const handleGenerateAnswerKey = async () => {
    if (!assignment?.content || !assignmentId) return;
    
    setIsGeneratingAnswers(true);
    setAnswerKeyError(null);
    
    try {
      const result = await generateAnswers(assignment.content, assignment.max_marks);
      
      if (result.success && result.generated_answers) {
        // Save the answer key to the database
        const { error: updateError } = await updateAssignmentAnswerKey(assignmentId, result.generated_answers);
        
        if (updateError) {
          throw new Error('Failed to save answer key to database');
        }
        
        // Update the local assignment state
        setAssignment(prev => ({
          ...prev,
          answer_key: result.generated_answers
        }));
        
        toast.success('Answer key generated and saved successfully!');
        
        // Also create a downloadable text file with the answer key
        const answerKeyContent = `ANSWER KEY\n${assignment.title}\n\nGenerated on: ${new Date().toLocaleString()}\nMaximum Marks: ${assignment.max_marks}\n\n${result.generated_answers}`;
        
        const blob = new Blob([answerKeyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${assignment.title}_Answer_Key.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate answer key');
      }
    } catch (error: any) {
      console.error('Error generating answer key:', error);
      setAnswerKeyError(error.message || 'Failed to generate answer key');
      toast.error(error.message || 'Failed to generate answer key');
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data: assignment, error } = await getAssignmentDetails(assignmentId);

        if (error) {
          throw error;
        }

        if (!assignment) {
          throw new Error('Assignment not found');
        }
        
        setAssignment(assignment);

        // Check if user is teacher for this class
        let teacherStatus = false;
        if (user && classId) {
          teacherStatus = await isTeacherForClass(classId);
          setIsTeacher(teacherStatus);

          // Fetch submissions for teachers
          if (teacherStatus) {
          const { data: submissionsData, error: submissionsError } = await getAssignmentSubmissions(assignmentId);

          if (submissionsError) {
            console.error('Error fetching submissions:', submissionsError);
          } else {

            setSubmissions(submissionsData || []);
          }
          }
        }

        // Fetch user's submission for students (if not teacher)
        if (!teacherStatus && user) {
          const { data: submissionData, error: submissionError } = await getSubmission(assignmentId, user.id);

          if (submissionData) {
            setUserSubmission(submissionData);

            // Fetch tickets for this submission
            const { data: ticketsData, error: ticketsError } = await getTicketsBySubmission(submissionData.id);
            if (ticketsData) {
              setUserTickets(ticketsData);
            }
          }
          // If no submission exists, that's fine - user can create one
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment details');
        console.error('Error fetching assignment:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssignment();
  }, [assignmentId, classId, user, isTeacherForClass]);
  if (isLoading) {
    return <div className="h-64">
        <LoadingSpinner size="medium" />
      </div>;
  }
  
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
          <div className="flex items-center text-gray-500 mb-4">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Due {new Date(assignment.due_date).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{assignment.max_marks} points</span>
          </div>
          <p className="text-gray-700">{assignment.description}</p>
        </div>
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Assignment Content</h2>
            <div className="flex space-x-2">
              {isTeacher && (
                <button
                  onClick={handleGenerateAnswerKey}
                  disabled={isGeneratingAnswers}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 text-sm flex items-center"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  {isGeneratingAnswers ? 'Generating...' : 'Generate Answer Key'}
                </button>
              )}
              <button
                onClick={downloadPdf}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm flex items-center"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download as PDF
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6 max-h-96 overflow-y-auto" ref={contentRef}>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>
                  {assignment.content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center rounded-b-lg">
              Scroll to view full content
            </div>
          </div>
          {answerKeyError && (
            <div className="mt-4">
              <ErrorAlert 
                message={answerKeyError} 
                onDismiss={() => setAnswerKeyError(null)} 
              />
            </div>
          )}
          
          {/* Answer Key Section - Only visible to teachers */}
          {isTeacher && assignment.answer_key && (
            <div className="mt-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 mr-3 text-blue-600" />
                    <span className="font-medium text-gray-900">Answer Key</span>
                  </div>
                  {showAnswerKey ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {showAnswerKey && (
                  <div className="border-t border-gray-200">
                    <div className="p-6 max-h-96 overflow-y-auto">
                      <div className="prose prose-lg max-w-none">
                        <ReactMarkdown>
                          {assignment.answer_key}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center rounded-b-lg">
                      Answer key content
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {!isTeacher && (
          <div className="p-6">
            {userSubmission ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-800 mb-2">Assignment Submitted</h3>
                    <p className="text-sm text-green-700 mb-1">
                      File: {userSubmission.file_name}
                    </p>
                    <p className="text-sm text-green-700 mb-1">
                      Submitted: {new Date(userSubmission.submitted_at).toLocaleString()}
                    </p>
                    {userSubmission.grade !== null && (
                      <p className="text-sm text-green-700">
                        Grade: {userSubmission.grade}/{assignment.max_marks}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {userSubmission.grade !== null && (
                      <button
                        onClick={() => setShowCreateTicket(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-sm"
                      >
                        Dispute Grade
                      </button>
                    )}
                  </div>
                </div>

                {/* Show existing tickets */}
                {userTickets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Grade Disputes:</h4>
                    <div className="space-y-2">
                      {userTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white border border-green-300 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{ticket.title}</p>
                              <p className="text-xs text-gray-600">
                                Class: {ticket.submissions.assignments.classes.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                Status: <span className={`font-medium ${
                                  ticket.status === 'resolved' ? 'text-green-600' :
                                  ticket.status === 'open' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {ticket.status.toUpperCase()}
                                </span>
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {ticket.response && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <p className="font-medium text-blue-800">Teacher Response:</p>
                              <p className="text-blue-700">{ticket.response}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Link
                  to={`/dashboard/classes/${classId}/assignments/${assignmentId}/submit`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Submit Assignment
                </Link>
              </div>
            )}
          </div>
        )}
        {isTeacher && submissions.length > 0 && <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Student Submissions</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub: any) => <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {sub.users?.name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sub.users?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Submitted
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.grade !== null ? <span className="text-gray-900">
                            {sub.grade}/{assignment.max_marks}
                          </span> : <span className="text-gray-500">Pending</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/dashboard/classes/${classId}/assignments/${assignmentId}/submissions/${sub.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>)}
                </tbody>
              </table>
              </div>
            </div>
          </div>}
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicket && userSubmission && (
        <CreateTicket
          submissionId={userSubmission.id}
          assignmentTitle={assignment.title}
          currentGrade={userSubmission.grade}
          maxMarks={assignment.max_marks}
          onTicketCreated={() => {
            setShowCreateTicket(false);
            // Refresh tickets
            if (userSubmission) {
              getTicketsBySubmission(userSubmission.id).then(({ data }) => {
                if (data) setUserTickets(data);
              });
            }
          }}
          onCancel={() => setShowCreateTicket(false)}
          className={assignment.classes.name}
        />
      )}
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>;
};
export default AssignmentDetail;
