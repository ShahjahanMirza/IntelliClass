import React, { useState } from 'react';
import { updateGrade } from '../../utils/api';
import { CheckIcon, XIcon } from 'lucide-react';

interface Grade {
  id: string;
  studentName: string;
  assignment: string;
  marks: number | null;
  maxMarks: number;
  submitted: boolean;
  submittedAt?: string;
  gradedAt?: string;
}

interface GradesTableProps {
  grades: Grade[];
  onUpdateGrade: (id: string, marks: number) => void;
}

const GradesTable: React.FC<GradesTableProps> = ({
  grades,
  onUpdateGrade
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (grade: Grade) => {
    setEditingId(grade.id);
    setEditValue(grade.marks !== null ? grade.marks.toString() : '');
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    const numValue = parseInt(editValue);
    if (!isNaN(numValue)) {
      try {
        await updateGrade(id, numValue);
        onUpdateGrade(id, numValue);
      } catch (error) {
        console.error('Error updating grade:', error);
      }
    }
    setEditingId(null);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (grades.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold mb-4">Student Grades</h2>
        <p className="text-gray-500">No submissions found for this class yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Student Grades</h2>
        <p className="text-sm text-gray-600 mt-1">
          {grades.length} submission{grades.length !== 1 ? 's' : ''} found
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marks
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {grades.map(grade => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {grade.studentName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {grade.assignment}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === grade.id ? (
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        min="0" 
                        max={grade.maxMarks} 
                      />
                      <span className="ml-1 text-gray-600">
                        / {grade.maxMarks}
                      </span>
                    </div>
                  ) : (
                    <div>
                      {grade.marks !== null ? (
                        <span className="font-medium">
                          {grade.marks} / {grade.maxMarks}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {grade.marks !== null ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Graded
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.submittedAt ? new Date(grade.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === grade.id ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSave(grade.id)} 
                        disabled={isSaving} 
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={handleCancel} 
                        className="text-red-600 hover:text-red-900"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEdit(grade)} 
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradesTable;
