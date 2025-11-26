import React, { useState, useEffect } from 'react';
import { attendanceAPI, AttendanceStatus, AttendanceRequest } from '../api/attendance.api';
import { enrollmentAPI, Enrollment } from '../api/enrollment.api';
import { Session } from '../api/session.api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AttendanceModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, isOpen, onClose }) => {
  const [studentAttendances, setStudentAttendances] = useState<Record<number, AttendanceStatus>>({});
  const queryClient = useQueryClient();

  // Fetch enrolled students for the batch
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['batch-enrollments', session.batchId],
    queryFn: () => enrollmentAPI.getBatchEnrollments(session.batchId),
    enabled: isOpen && !!session.batchId,
  });

  // Fetch existing attendances for this session
  const { data: attendancesData } = useQuery({
    queryKey: ['session-attendances', session.id],
    queryFn: () => attendanceAPI.getSessionAttendances(session.id),
    enabled: isOpen,
  });

  // Initialize student attendances from existing data
  useEffect(() => {
    if (attendancesData?.data) {
      const initial: Record<number, AttendanceStatus> = {};
      attendancesData.data.forEach((att) => {
        initial[att.studentId] = att.status;
      });
      setStudentAttendances(initial);
    } else if (enrollmentsData?.data) {
      // Initialize all as absent if no attendance records exist
      const initial: Record<number, AttendanceStatus> = {};
      enrollmentsData.data.forEach((enrollment) => {
        if (!initial[enrollment.studentId]) {
          initial[enrollment.studentId] = AttendanceStatus.ABSENT;
        }
      });
      setStudentAttendances(initial);
    }
  }, [attendancesData, enrollmentsData]);

  const markAttendanceMutation = useMutation({
    mutationFn: ({ studentId, status, isManual }: AttendanceRequest & { studentId: number }) =>
      attendanceAPI.markAttendance(session.id, { studentId, status, isManual }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-attendances', session.id] });
    },
  });

  const handleAttendanceChange = (studentId: number, status: AttendanceStatus, isManual = false) => {
    setStudentAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    markAttendanceMutation.mutate({ studentId, status, isManual });
  };

  const handleBulkSave = () => {
    if (!enrollmentsData?.data) return;

    enrollmentsData.data.forEach((enrollment) => {
      const status = studentAttendances[enrollment.studentId] || AttendanceStatus.ABSENT;
      markAttendanceMutation.mutate({ studentId: enrollment.studentId, status, isManual: false });
    });
  };

  if (!isOpen) return null;

  const students = enrollmentsData?.data || [];
  const isMarking = markAttendanceMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Mark Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">
              {session.batch?.title} - {new Date(session.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              {session.startTime} - {session.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {isLoadingEnrollments ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students enrolled in this batch.</p>
          ) : (
            <div className="space-y-2">
              {students.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {enrollment.student?.name || 'Unknown Student'}
                    </p>
                    <p className="text-sm text-gray-500">{enrollment.student?.email}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleAttendanceChange(
                          enrollment.studentId,
                          AttendanceStatus.PRESENT,
                          false
                        )
                      }
                      disabled={isMarking}
                      className={`px-3 py-1 text-sm rounded-md transition ${
                        studentAttendances[enrollment.studentId] === AttendanceStatus.PRESENT
                          ? 'bg-green-100 text-green-700 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50 border-2 border-transparent'
                      } ${isMarking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() =>
                        handleAttendanceChange(
                          enrollment.studentId,
                          AttendanceStatus.MANUAL_PRESENT,
                          true
                        )
                      }
                      disabled={isMarking}
                      className={`px-3 py-1 text-sm rounded-md transition ${
                        studentAttendances[enrollment.studentId] === AttendanceStatus.MANUAL_PRESENT
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 border-2 border-transparent'
                      } ${isMarking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() =>
                        handleAttendanceChange(
                          enrollment.studentId,
                          AttendanceStatus.ABSENT,
                          false
                        )
                      }
                      disabled={isMarking}
                      className={`px-3 py-1 text-sm rounded-md transition ${
                        studentAttendances[enrollment.studentId] === AttendanceStatus.ABSENT
                          ? 'bg-red-100 text-red-700 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-red-50 border-2 border-transparent'
                      } ${isMarking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleBulkSave}
            disabled={isMarking}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarking ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>
    </div>
  );
};


