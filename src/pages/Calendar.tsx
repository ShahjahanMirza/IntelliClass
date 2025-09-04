import React, { useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserAssignments } from '../utils/supabase';
import CalendarView from '../components/calendar/CalendarView';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  classId: string;
  className: string;
  classColor?: string;
  type: 'assignment' | 'exam' | 'other';
}
const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data: assignments, error } = await getUserAssignments(user.id);

        if (error) {
          console.error('Error fetching assignments:', error);
          return;
        }

        // Convert assignments to calendar events
        const calendarEvents: CalendarEvent[] = (assignments || []).map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          date: new Date(assignment.due_date),
          classId: assignment.classes?.id || '',
          className: assignment.classes?.name || 'Unknown Class',
          classColor: assignment.classes?.color_scheme || '#3B82F6',
          type: 'assignment'
        }));

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);
  return <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold mb-8">Calendar</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          <CalendarView events={events} />
          {events.length === 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-blue-700 text-sm">
                No upcoming assignment deadlines. Calendar will show deadlines when assignments are created.
              </p>
            </div>
          )}
        </>
      )}
      <ScrollToTopButton />
    </div>;
};
export default Calendar;