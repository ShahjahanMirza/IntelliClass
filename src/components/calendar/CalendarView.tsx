import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  classId: string;
  className: string;
  classColor?: string;
  type: 'assignment' | 'exam' | 'other';
}
interface CalendarViewProps {
  events: CalendarEvent[];
}
const CalendarView: React.FC<CalendarViewProps> = ({
  events
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper function to get lighter background color from hex
  const getLightBackgroundColor = (hexColor: string) => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Create a lighter version (mix with white)
    const lightR = Math.round(r + (255 - r) * 0.8);
    const lightG = Math.round(g + (255 - g) * 0.8);
    const lightB = Math.round(b + (255 - b) * 0.8);

    return `rgb(${lightR}, ${lightG}, ${lightB})`;
  };

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Calculate days from previous month to display
  const prevMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  // Get month name
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long'
  });
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  // Group events by date
  const eventsByDate: {
    [key: string]: CalendarEvent[];
  } = {};
  events.forEach(event => {
    // Use local date to avoid timezone issues
    const localDate = new Date(event.date);
    const dateKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });
  // Generate calendar days
  const calendarDays = [];
  // Add previous month days
  for (let i = 0; i < prevMonthDays; i++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth, -prevMonthDays + i + 1),
      isCurrentMonth: false
    });
  }
  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth, i),
      isCurrentMonth: true
    });
  }
  // Add next month days to fill out the grid (6 rows x 7 days = 42 cells)
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth + 1, i),
      isCurrentMonth: false
    });
  }
  return <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {monthName} {currentYear}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={goToToday} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
            Today
          </button>
          <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100" aria-label="Previous month">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100" aria-label="Next month">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Mon
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Tue
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Wed
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Thu
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Fri
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Sat
        </div>
        <div className="py-2 text-center text-sm font-medium text-gray-500">
          Sun
        </div>
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => {
        const dateKey = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
        const dayEvents = eventsByDate[dateKey] || [];
        const isToday = day.date.toDateString() === new Date().toDateString();
        return <div key={index} className={`min-h-[100px] border-b border-r border-gray-200 ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
              <div className="p-1">
                <div className={`text-right p-1 ${isToday ? 'bg-blue-100 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center ml-auto' : ''}`}>
                  {day.date.getDate()}
                </div>
                <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                  {dayEvents.map(event => {
                    const backgroundColor = event.type === 'assignment' && event.classColor
                      ? getLightBackgroundColor(event.classColor)
                      : event.type === 'assignment'
                        ? '#dbeafe' // bg-blue-100 fallback
                        : event.type === 'exam'
                          ? '#fecaca' // bg-red-100
                          : '#f3f4f6'; // bg-gray-100

                    const textColor = event.type === 'assignment' && event.classColor
                      ? event.classColor
                      : event.type === 'assignment'
                        ? '#1e40af' // text-blue-800 fallback
                        : event.type === 'exam'
                          ? '#991b1b' // text-red-800
                          : '#374151'; // text-gray-800

                    return (
                      <Link
                        key={event.id}
                        to={`/dashboard/classes/${event.classId}/assignments/${event.id}`}
                        className="block text-xs p-1 rounded truncate"
                        style={{
                          backgroundColor,
                          color: textColor
                        }}
                      >
                        {event.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
};
export default CalendarView;