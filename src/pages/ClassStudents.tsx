import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserMinusIcon, SearchIcon } from 'lucide-react';
import BackButton from '../components/BackButton';
import ScrollToTopButton from '../components/ScrollToTopButton';
interface Student {
  id: string;
  name: string;
  email: string;
  status?: 'active' | 'invited';
}
const ClassStudents = () => {
  const {
    classId
  } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState('');
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;

      setIsLoading(true);
      try {
        // Import the function we need
        const { getClassMembers } = await import('../utils/supabase');
        const { data, error } = await getClassMembers(classId);

        if (error) {
          console.error('Error fetching class members:', error);
          setStudents([]);
          return;
        }

        // Transform the data to match the expected format
        const transformedStudents = data?.map((member: any) => ({
          id: member.id,
          name: member.users.name,
          email: member.users.email,
          status: 'active' as const,
          role: member.role
        })) || [];

        setStudents(transformedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [classId]);

  const handleRemoveStudent = (id: string) => {
    // In a real app, you'd call an API to remove the student
    setStudents(students.filter(student => student.id !== id));
  };
  const filteredStudents = students.filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton to={`/classes/${classId}`} />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Class Students</h1>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <input type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>}
          {isLoading ? <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div> : <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? filteredStudents.map(student => <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <span className="text-gray-600 font-medium">
                                {student.name[0]}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.status === 'invited' ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Invited
                            </span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => handleRemoveStudent(student.id)} className="text-red-600 hover:text-red-900">
                            <UserMinusIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>) : <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>}
        </div>
      </div>
      <ScrollToTopButton />
    </div>;
};
export default ClassStudents;