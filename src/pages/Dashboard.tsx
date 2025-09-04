import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, UsersIcon, FileTextIcon, CalendarIcon, PlusIcon, FileIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserClasses, getUserAssignments, getUnreadNotificationCount, getTotalStudentCount } from '../utils/supabase';
import ScrollToTopButton from '../components/ScrollToTopButton';
const Dashboard = React.memo(() => {
  const {
    user,
    canCreateClasses
  } = useAuth();
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    dueSoon: 0,
    notifications: 0
  });
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user's classes
        const { data: classesData, error: classesError } = await getUserClasses(user.id);
        if (classesError) {
          console.error('Error fetching classes:', classesError);
        } else {
          const transformedClasses = classesData?.map((membership: any) => ({
            id: membership.classes.id,
            name: membership.classes.name,
            subject: membership.classes.subject,
            color: membership.classes.color_scheme,
            role: membership.role
          })) || [];
          setClasses(transformedClasses);
        }

        // Fetch user's assignments
        const { data: assignmentsData, error: assignmentsError } = await getUserAssignments(user.id);
        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
        } else {
          const transformedAssignments = assignmentsData?.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            className: assignment.classes?.name || 'Unknown Class',
            dueDate: assignment.due_date,
            status: assignment.submissions?.[0] ? 'submitted' : 'pending'
          })) || [];
          setAssignments(transformedAssignments);
        }

        // Calculate due soon assignments
        const dueSoon = assignmentsData?.filter((assignment: any) => {
          const dueDate = new Date(assignment.due_date);
          const now = new Date();
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7 && diffDays >= 0;
        }).length || 0;

        // Get notification count
        const { count: notificationCount } = await getUnreadNotificationCount(user.id);

        // Get total student count
        const { count: studentCount } = await getTotalStudentCount(user.id);

        // Update stats
        setStats({
          totalClasses: classesData?.length || 0,
          totalStudents: studentCount || 0,
          totalAssignments: assignmentsData?.length || 0,
          dueSoon,
          notifications: notificationCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, [user]);
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome, {user?.name || 'User'}! 
        </h1> 
        <p className="text-gray-600 mt-2">
          Here's what's happening in your classes today
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
          <div>
            <p className="text-lg font-semibold opacity-90">Total Classes</p>
            <h2 className="text-4xl font-bold">{stats.totalClasses}</h2>
          </div>
          <BookOpenIcon className="h-12 w-12 opacity-80" />
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
          <div>
            <p className="text-lg font-semibold opacity-90">
              Total Students
            </p>
            <h2 className="text-4xl font-bold">{stats.totalStudents}</h2>
          </div>
          <UsersIcon className="h-12 w-12 opacity-80" />
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
          <div>
            <p className="text-lg font-semibold opacity-90">Assignments</p>
            <h2 className="text-4xl font-bold">{stats.totalAssignments}</h2>
          </div>
          <FileTextIcon className="h-12 w-12 opacity-80" />
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
          <div>
            <p className="text-lg font-semibold opacity-90">Due Soon</p>
            <h2 className="text-4xl font-bold">{stats.dueSoon}</h2>
          </div>
          <CalendarIcon className="h-12 w-12 opacity-80" />
        </div>
      </div>
      {/* Your Classes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Classes</h2>
          <Link to="classes" className="text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {classes.map((cls: any) => <Link
              key={cls.id}
              to={`classes/${cls.id}`}
              className="text-white rounded-lg p-6 hover:opacity-90 transition"
              style={{ backgroundColor: cls.color || '#3B82F6' }}
            >
              <h3 className="text-xl font-bold mb-2">{cls.name}</h3>
              <div className="flex items-center mt-4">
                <UsersIcon className="h-5 w-5 mr-2 opacity-80" />
                <span>{cls.students} students</span>
              </div>
            </Link>)}
        </div>
      </div>
      {/* Quick Actions */}
      {/*
      {canCreateClasses() && <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="classes/create" className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition flex items-center">
              <PlusIcon className="h-6 w-6 mr-3" />
              <div>
                <h3 className="text-lg font-bold">Create New Class</h3>
                <p className="opacity-80">
                  Set up a new classroom for your students
                </p>
              </div>
            </Link>
            <Link to="classes/1/create-assignment" className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition flex items-center">
              <FileIcon className="h-6 w-6 mr-3" />
              <div>
                <h3 className="text-lg font-bold">New Assignment</h3>
                <p className="opacity-80">
                  Create a new assignment with AI assistance
                </p>
              </div>
            </Link>
          </div>
        </div>}
      */}
      {/* Upcoming Deadlines */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Deadlines</h2>
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          {assignments
            .filter((assignment: any) => {
              const dueDate = new Date(assignment.dueDate);
              const now = new Date();
              const diffTime = dueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays >= 0;
            })
            .slice(0, 3)
            .map((assignment: any) => (
              <div key={assignment.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <h3 className="font-medium">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">
                    {assignment.className}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-orange-500 font-medium">
                    Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          {assignments.filter((assignment: any) => {
            const dueDate = new Date(assignment.dueDate);
            const now = new Date();
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0;
          }).length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No upcoming deadlines in the next 7 days
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
});

export default Dashboard;