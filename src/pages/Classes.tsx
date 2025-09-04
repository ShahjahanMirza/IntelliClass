import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, UsersIcon, BookOpenIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserClasses, getClassMemberCount } from '../utils/supabase';
import ScrollToTopButton from '../components/ScrollToTopButton';
const Classes = () => {
  const {
    user,
    canCreateClasses,
    canJoinClasses
  } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await getUserClasses(user.id);
        if (error) {
          console.error('Error fetching classes:', error);
          return;
        }

        // Transform the data and fetch member counts
        const transformedClasses = await Promise.all(
          (data || []).map(async (membership: any) => {
            const { count: memberCount } = await getClassMemberCount(membership.classes.id);
            return {
              id: membership.classes.id,
              name: membership.classes.name,
              subject: membership.classes.subject,
              description: membership.classes.description,
              color: membership.classes.color_scheme,
              class_code: membership.classes.class_code,
              teacher: membership.classes.users,
              role: membership.role,
              memberCount: memberCount || 0,
              joinedAt: membership.joined_at
            };
          })
        );

        console.log('Transformed classes:', transformedClasses);

        setClasses(transformedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Classes</h1>
        <div className="flex gap-3">
          {canJoinClasses() && (
            <Link to="join" className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Join Class
            </Link>
          )}
          {canCreateClasses() && (
            <Link to="create" className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Class
            </Link>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first class or join an existing one to get started
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="create" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
              Create Class
            </Link>
            <Link to="join" className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700">
              Join Class
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {classes.map((cls: any) => (
            <Link
              key={cls.id}
              to={`${cls.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              style={{ borderTop: `4px solid ${cls.color}` }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  cls.role === 'teacher'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {cls.role}
                </span>
              </div>

              {cls.subject && (
                <p className="text-gray-600 mb-2">{cls.subject}</p>
              )}

              {cls.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{cls.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  <span>{cls.memberCount || 0} members</span>
                </div>
                {cls.role === 'student' && cls.teacher && (
                  <span>by {cls.teacher.name}</span>
                )}
              </div>

              {cls.role === 'teacher' && cls.class_code && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Class Code</div>
                  <div className="font-mono text-sm font-bold text-gray-700">{cls.class_code}</div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>;
};
export default Classes;