import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { sessionAPI, Session, SessionStatus } from '../api/session.api';
import { AttendanceModal } from '../components/AttendanceModal';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Fetch sessions for the faculty
  const { data: sessionsData, isLoading, error } = useQuery({
    queryKey: ['faculty-sessions', user?.userId],
    queryFn: () => sessionAPI.getSessions({ facultyId: user?.userId }),
    enabled: !!user?.userId,
  });

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: (sessionId: number) => sessionAPI.checkinSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-sessions', user?.userId] });
    },
  });

  // Check-out mutation
  const checkoutMutation = useMutation({
    mutationFn: (sessionId: number) => sessionAPI.checkoutSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-sessions', user?.userId] });
    },
  });

  const handleCheckin = (session: Session) => {
    if (window.confirm(`Start session: ${session.batch?.title} on ${new Date(session.date).toLocaleDateString()}?`)) {
      checkinMutation.mutate(session.id);
    }
  };

  const handleCheckout = (session: Session) => {
    if (window.confirm(`End session: ${session.batch?.title} on ${new Date(session.date).toLocaleDateString()}?`)) {
      checkoutMutation.mutate(session.id);
    }
  };

  const handleMarkAttendance = (session: Session) => {
    setSelectedSession(session);
    setIsAttendanceModalOpen(true);
  };

  const getStatusBadgeColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case SessionStatus.ONGOING:
        return 'bg-green-100 text-green-800';
      case SessionStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sessions = sessionsData?.data || [];

  // Group sessions by status
  const scheduledSessions = sessions.filter((s) => s.status === SessionStatus.SCHEDULED);
  const ongoingSessions = sessions.filter((s) => s.status === SessionStatus.ONGOING);
  const completedSessions = sessions.filter((s) => s.status === SessionStatus.COMPLETED);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your teaching sessions and attendance</p>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error loading sessions. Please try again.
            </div>
          )}

          {/* Ongoing Sessions */}
          {ongoingSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ongoing Sessions</h2>
              <div className="grid gap-4">
                {ongoingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.batch?.title || 'Batch'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{session.startTime} - {session.endTime}</span>
                          {session.topic && <span>• {session.topic}</span>}
                          {session.actualStartAt && (
                            <span className="text-green-600">
                              Started: {new Date(session.actualStartAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleMarkAttendance(session)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Mark Attendance
                        </button>
                        <button
                          onClick={() => handleCheckout(session)}
                          disabled={checkoutMutation.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkoutMutation.isPending ? 'Ending...' : 'End Session'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Sessions */}
          {scheduledSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Sessions</h2>
              <div className="grid gap-4">
                {scheduledSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.batch?.title || 'Batch'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{session.startTime} - {session.endTime}</span>
                          {session.topic && <span>• {session.topic}</span>}
                        </div>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleCheckin(session)}
                          disabled={checkinMutation.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkinMutation.isPending ? 'Starting...' : 'Start Session'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Sessions</h2>
              <div className="grid gap-4">
                {completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.batch?.title || 'Batch'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{session.startTime} - {session.endTime}</span>
                          {session.topic && <span>• {session.topic}</span>}
                          {session.actualStartAt && session.actualEndAt && (
                            <span>
                              {new Date(session.actualStartAt).toLocaleTimeString()} - {new Date(session.actualEndAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleMarkAttendance(session)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          View Attendance
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && !isLoading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No sessions found.</p>
              <p className="text-gray-400 text-sm mt-2">Sessions will appear here when assigned to you.</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {selectedSession && (
        <AttendanceModal
          session={selectedSession}
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
};


