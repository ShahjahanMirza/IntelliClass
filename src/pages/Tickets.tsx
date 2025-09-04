import React, { useState, useEffect } from 'react';
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, MessageSquareIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserTickets, getTeacherTickets, updateTicket, supabase } from '../utils/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { toast } from 'react-toastify';
import ScrollToTopButton from '../components/ScrollToTopButton';

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        let ticketsData;

        // First, determine user role by checking if they have any classes as teacher
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user.id)
          .limit(1);

        const isTeacher = teacherClasses && teacherClasses.length > 0;
        setUserRole(isTeacher ? 'teacher' : 'student');

        if (isTeacher) {
          // For teachers, get tickets from all their classes
          const { data, error: ticketsError } = await getTeacherTickets(user.id);
          ticketsData = data;
          if (ticketsError) throw ticketsError;
        } else {
          // For students, get their own tickets
          const { data, error: ticketsError } = await getUserTickets(user.id);
          ticketsData = data;
          if (ticketsError) throw ticketsError;
        }


        setTickets(ticketsData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load tickets');
        console.error('Error fetching tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  const handleRespond = async (ticketId: string) => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsResponding(true);

    try {
      const { error: updateError } = await updateTicket(ticketId, {
        status: 'resolved',
        teacher_response: response.trim(),
        responded_by: user?.id,
        responded_at: new Date().toISOString()
      });

      if (updateError) throw updateError;

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              status: 'resolved', 
              response: response.trim(),
              responded_at: new Date().toISOString(),
              users_responded_by: { id: user?.id, name: user?.name }
            }
          : ticket
      ));

      setSelectedTicket(null);
      setResponse('');
      toast.success('Response sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-64">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {userRole === 'student' ? 'My Grade Disputes' : 'Student Grade Disputes'}
        </h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'student'
            ? 'Track your grade dispute submissions and responses'
            : 'Review and respond to student grade disputes'
          }
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
          <p className="text-gray-500">
            {userRole === 'student'
              ? "You haven't submitted any grade disputes yet."
              : "No students have submitted grade disputes."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="text-lg font-medium ml-2">{ticket.title}</h3>
                    <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    {userRole === 'teacher' && (
                      <div className="flex items-center mb-1">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Student: {ticket.student?.name} ({ticket.student?.email})
                      </div>
                    )}
                    <div>
                      Class: {ticket.submissions?.assignments?.classes?.name}
                    </div>
                    <div>
                      Assignment: {ticket.submissions?.assignments?.title}
                    </div>
                    <div>
                      Created: {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{ticket.reason}</p>

                  {ticket.teacher_response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-800 mb-1">Teacher Response:</h4>
                      <p className="text-blue-700">{ticket.teacher_response}</p>
                      <p className="text-xs text-blue-600 mt-2">
                        Responded by {ticket.responder?.name} on {new Date(ticket.responded_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                {userRole === 'teacher' && ticket.status === 'open' && (
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Respond
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Respond to Grade Dispute</h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedTicket.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTicket.reason}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Provide your response to the student's concern..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={6}
                  disabled={isResponding}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setResponse('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isResponding}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRespond(selectedTicket.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isResponding || !response.trim()}
                >
                  {isResponding ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
};

export default Tickets;
