import React, { useState, useEffect } from 'react';
import { UsersIcon, UserIcon, UserPlusIcon, BookOpenIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { getUserClasses, getClassDetails, supabase, fixRLSForTeachers } from '../utils/supabase';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ScrollToTopButton from '../components/ScrollToTopButton';
const People = () => {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useError();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classMembers, setClassMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchClasses = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsLoading(false);
        setError('Please log in to view people');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: classesData, error: classesError } = await getUserClasses(user.id);

        if (classesError) {
          throw classesError;
        }

        setClasses(classesData || []);

        // Auto-select first class if available
        if (classesData && classesData.length > 0) {
          setSelectedClass(classesData[0].classes);
        }
      } catch (err: any) {
        console.error('Error fetching classes:', err);
        if (err.code === 'PGRST116' || err.message?.includes('No rows')) {
          setError('No classes found. Join or create a class to get started.');
        } else {
          showError('Failed to load classes', err, 'Classes Loading Error');
          setError('Failed to load classes. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [user, authLoading]);

  useEffect(() => {
    const fetchClassMembers = async () => {
      if (!selectedClass) {
        return;
      }

      try {
        // Try to fix RLS policies first
        await fixRLSForTeachers();

        // Use getClassDetails to get both class members and teacher info
        const { data: classData, error: classError } = await getClassDetails(selectedClass.id);

        if (classError) {
          throw classError;
        }

        // Combine class members with teacher info
        let allMembers = classData?.class_members || [];



        // Check if teacher is already in the members list
        const teacherInMembers = allMembers.some(member =>
          member.users?.id === classData?.teacher_id
        );

        // If teacher is not in members list, add them
        if (!teacherInMembers && classData?.teacher_id) {

          // Try to get teacher data from the class data first
          let teacherData = classData?.users;

          // If teacher data is not available from class data, try to fetch it separately
          if (!teacherData) {
            try {
              const { data: teacherUserData, error: teacherError } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('id', classData.teacher_id)
                .single();

              if (teacherUserData && !teacherError) {
                teacherData = teacherUserData;
              } else {
                // Create placeholder teacher data
                teacherData = {
                  id: classData.teacher_id,
                  name: `Teacher ${classData.teacher_id.slice(-8)}`,
                  email: 'Email not available'
                };
              }
            } catch (error) {
              teacherData = {
                id: classData.teacher_id,
                name: `Teacher ${classData.teacher_id.slice(-8)}`,
                email: 'Email not available'
              };
            }
          }

          const teacherMember = {
            id: `teacher-${classData.teacher_id}`,
            role: 'teacher',
            joined_at: classData.created_at,
            users: teacherData
          };

          allMembers = [teacherMember, ...allMembers];
        }

        setClassMembers(allMembers);
      } catch (err: any) {
        console.error('Error fetching class members:', err);
        if (err.code === 'PGRST116' || err.message?.includes('No rows')) {
          setError('No members found for this class.');
        } else {
          showError('Failed to load class members', err, 'Class Members Loading Error');
          setError('Failed to load class members. Please try again.');
        }
      }
    };

    fetchClassMembers();
  }, [selectedClass]);

  // Safely filter members with proper error handling
  const teachers = classMembers.filter(member => {
    try {
      return member && member.role === 'teacher';
    } catch (err) {
      console.warn('Error filtering teacher:', member, err);
      return false;
    }
  });

  const students = classMembers.filter(member => {
    try {
      return member && member.role === 'student';
    } catch (err) {
      console.warn('Error filtering student:', member, err);
      return false;
    }
  });

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  return <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">People</h1>

        {/* Class selector */}
        {classes.length > 1 && (
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="h-5 w-5 text-gray-500" />
            <select
              value={selectedClass?.id || ''}
              onChange={(e) => {
                const classId = e.target.value;
                const selected = classes.find(c => c.classes.id === classId);
                setSelectedClass(selected?.classes || null);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.classes.id} value={cls.classes.id}>
                  {cls.classes.name}
                </option>
              ))}
            </select>
          </div>
        )}


      </div>

      {!selectedClass ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Selected</h3>
          <p className="text-gray-500">
            {classes.length === 0
              ? "You're not a member of any classes yet."
              : "Select a class to view its members."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-medium text-blue-800">{selectedClass.name}</h2>
            <p className="text-sm text-blue-600">{selectedClass.subject}</p>
            <p className="text-xs text-blue-500 mt-1">
              Class Code: {selectedClass.class_code}
            </p>
          </div>

          {/* Teachers Section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 mr-3 text-blue-600" />
                <h2 className="text-xl font-semibold">Teachers</h2>
              </div>
              <span className="text-sm text-gray-500">
                {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
              </span>
            </div>
            {teachers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No teachers found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {teachers.map(teacher => {
                  const userName = teacher.users?.name || teacher.users?.email || 'Unknown User';
                  const userEmail = teacher.users?.email || 'No email';
                  const userInitial = userName.charAt(0).toUpperCase();

                  return (
                    <li key={teacher.id} className="p-6 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-medium">
                          {userInitial}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{userName}</p>
                        <p className="text-sm text-gray-500">{userEmail}</p>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(teacher.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Students Section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <UsersIcon className="h-6 w-6 mr-3 text-blue-600" />
                <h2 className="text-xl font-semibold">Students</h2>
              </div>
              <span className="text-sm text-gray-500">
                {students.length} student{students.length !== 1 ? 's' : ''}
              </span>
            </div>
            {students.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No students have joined this class yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {students.map(student => {
                  const userName = student.users?.name || student.users?.email || 'Unknown User';
                  const userEmail = student.users?.email || 'No email';
                  const userInitial = userName.charAt(0).toUpperCase();

                  return (
                    <li key={student.id} className="p-6 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <span className="text-gray-600 font-medium">
                          {userInitial}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{userName}</p>
                        <p className="text-sm text-gray-500">{userEmail}</p>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(student.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
      <ScrollToTopButton />
    </div>;
};
export default People;