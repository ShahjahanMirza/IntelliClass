import React, { useState, useMemo } from 'react';
import { DownloadIcon, EditIcon, CheckIcon, XIcon } from 'lucide-react';
import { updateGrade } from '../../utils/api';

interface Grade {
  id: string;
  studentName: string;
  studentId: string;
  assignment: string;
  assignmentId: string;
  marks: number | null;
  maxMarks: number;
  submitted: boolean;
  submittedAt?: string;
  gradedAt?: string;
}

interface GradesSpreadsheetProps {
  grades: Grade[];
  onUpdateGrade: (id: string, marks: number) => void;
}

interface StudentRow {
  studentId: string;
  studentName: string;
  assignments: { [assignmentId: string]: Grade };
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
}

const GradesSpreadsheet: React.FC<GradesSpreadsheetProps> = ({
  grades,
  onUpdateGrade
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  console.log('GradesSpreadsheet - Received grades:', grades);
  console.log('GradesSpreadsheet - Grades length:', grades?.length);

  // Transform grades data into spreadsheet format
  const { students, assignments } = useMemo(() => {
    const studentsMap = new Map<string, StudentRow>();
    const assignmentsMap = new Map<string, { id: string; title: string; maxMarks: number }>();

    // Process all grades to build the data structure
    grades.forEach(grade => {
      // Track assignments
      if (!assignmentsMap.has(grade.assignmentId)) {
        assignmentsMap.set(grade.assignmentId, {
          id: grade.assignmentId,
          title: grade.assignment,
          maxMarks: grade.maxMarks
        });
      }

      // Track students
      if (!studentsMap.has(grade.studentId)) {
        studentsMap.set(grade.studentId, {
          studentId: grade.studentId,
          studentName: grade.studentName,
          assignments: {},
          totalMarks: 0,
          totalMaxMarks: 0,
          percentage: 0
        });
      }

      const student = studentsMap.get(grade.studentId)!;
      student.assignments[grade.assignmentId] = grade;
    });

    // Calculate totals for each student
    studentsMap.forEach(student => {
      let totalMarks = 0;
      let totalMaxMarks = 0;
      
      Object.values(student.assignments).forEach(grade => {
        if (grade.marks !== null) {
          totalMarks += grade.marks;
        }
        totalMaxMarks += grade.maxMarks;
      });

      student.totalMarks = totalMarks;
      student.totalMaxMarks = totalMaxMarks;
      student.percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    });

    return {
      students: Array.from(studentsMap.values()).sort((a, b) => a.studentName.localeCompare(b.studentName)),
      assignments: Array.from(assignmentsMap.values()).sort((a, b) => a.title.localeCompare(b.title))
    };
  }, [grades]);

  const handleEdit = (grade: Grade) => {
    setEditingCell(`${grade.studentId}-${grade.assignmentId}`);
    setEditValue(grade.marks !== null ? grade.marks.toString() : '');
  };

  const handleSave = async (grade: Grade) => {
    setIsSaving(true);
    const numValue = parseInt(editValue);
    if (!isNaN(numValue)) {
      try {
        await updateGrade(grade.id, numValue);
        onUpdateGrade(grade.id, numValue);
      } catch (error) {
        console.error('Error updating grade:', error);
      }
    }
    setEditingCell(null);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Student', ...assignments.map(a => a.title), 'Total', 'Percentage'];
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        `"${student.studentName}"`,
        ...assignments.map(assignment => {
          const grade = student.assignments[assignment.id];
          return grade?.marks !== null ? grade.marks : '';
        }),
        student.totalMarks,
        `${student.percentage}%`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_grades.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (students.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold mb-4">Class Grades</h2>
        <p className="text-gray-500">No students or assignments found for this class yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Class Grades</h2>
          <p className="text-sm text-gray-600 mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} • {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-700"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Excel
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Student
              </th>
              {assignments.map(assignment => (
                <th key={assignment.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  <div className="truncate" title={assignment.title}>
                    {assignment.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    /{assignment.maxMarks}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10">
                  {student.studentName}
                </td>
                {assignments.map(assignment => {
                  const grade = student.assignments[assignment.id];
                  const cellId = `${student.studentId}-${assignment.id}`;
                  const isEditing = editingCell === cellId;
                  
                  return (
                    <td key={assignment.id} className="px-3 py-4 text-center">
                      {grade ? (
                        isEditing ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              className="w-12 px-1 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              min="0"
                              max={assignment.maxMarks}
                            />
                            <button
                              onClick={() => handleSave(grade)}
                              disabled={isSaving}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                            onClick={() => handleEdit(grade)}
                          >
                            {grade.marks !== null ? (
                              <span className="font-medium">{grade.marks}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-center font-semibold bg-blue-50">
                  {student.totalMarks}/{student.totalMaxMarks}
                </td>
                <td className="px-6 py-4 text-center font-semibold bg-blue-50">
                  {student.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradesSpreadsheet;
