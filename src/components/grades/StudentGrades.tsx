import React from 'react';
import { CalendarIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';

interface StudentGrade {
  id: string;
  assignmentTitle: string;
  assignmentId: string;
  maxMarks: number;
  marks: number | null;
  submitted: boolean;
  submittedAt?: string;
  gradedAt?: string;
  dueDate: string;
  feedback?: string;
}

interface StudentGradesProps {
  grades: StudentGrade[];
  studentName?: string;
}

const StudentGrades: React.FC<StudentGradesProps> = ({ grades, studentName }) => {
  const calculateOverallStats = () => {
    const gradedAssignments = grades.filter(g => g.marks !== null);
    const totalMarks = gradedAssignments.reduce((sum, g) => sum + (g.marks || 0), 0);
    const totalMaxMarks = gradedAssignments.reduce((sum, g) => sum + g.maxMarks, 0);
    const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    
    return {
      totalMarks,
      totalMaxMarks,
      percentage,
      gradedCount: gradedAssignments.length,
      totalCount: grades.length
    };
  };

  const getGradeStatus = (grade: StudentGrade) => {
    if (!grade.submitted) {
      return { status: 'not-submitted', label: 'Not Submitted', color: 'text-red-600 bg-red-50' };
    }
    if (grade.marks !== null) {
      return { status: 'graded', label: 'Graded', color: 'text-green-600 bg-green-50' };
    }
    return { status: 'pending', label: 'Pending Grade', color: 'text-yellow-600 bg-yellow-50' };
  };

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Overall Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Total Score</h3>
            <p className="text-2xl font-bold text-blue-900">
              {stats.totalMarks} / {stats.totalMaxMarks}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600 mb-1">Percentage</h3>
            <p className="text-2xl font-bold text-green-900">{stats.percentage}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Grade</h3>
            <p className="text-2xl font-bold text-purple-900">{getGradeLetter(stats.percentage)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Progress</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.gradedCount} / {stats.totalCount}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Assignment Grades */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Assignment Grades</h2>
          <p className="text-sm text-gray-600 mt-1">
            {grades.length} assignment{grades.length !== 1 ? 's' : ''} • {stats.gradedCount} graded
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grades.map((grade) => {
                const status = getGradeStatus(grade);
                const percentage = grade.marks !== null ? Math.round((grade.marks / grade.maxMarks) * 100) : null;
                
                return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{grade.assignmentTitle}</div>
                        {grade.feedback && (
                          <div className="text-sm text-gray-500 mt-1">
                            Feedback: {grade.feedback}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(grade.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status === 'graded' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {status.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                        {status.status === 'not-submitted' && <XCircleIcon className="h-3 w-3 mr-1" />}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {grade.marks !== null ? (
                        <span className="font-medium">
                          {grade.marks} / {grade.maxMarks}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {percentage !== null ? (
                        <span className={`font-medium ${
                          percentage >= 90 ? 'text-green-600' :
                          percentage >= 80 ? 'text-blue-600' :
                          percentage >= 70 ? 'text-yellow-600' :
                          percentage >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {percentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {grades.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p>Your teacher hasn't created any assignments for this class yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGrades;
