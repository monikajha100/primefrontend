import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { studentLeaveAPI, StudentLeave, LeaveStatus, CreateLeaveRequest } from '../api/studentLeave.api';
import { batchAPI } from '../api/batch.api';
import { studentAPI } from '../api/student.api';

export const StudentLeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<StudentLeave | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // Fetch leaves
  const { data: leavesData, isLoading } = useQuery({
    queryKey: ['student-leaves', user?.role, user?.id],
    queryFn: () => studentLeaveAPI.getLeaves(),
  });

  // Fetch batches for dropdown
  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchAPI.getAllBatches(),
    enabled: user?.role === 'admin' || user?.role === 'superadmin',
  });

  // Fetch students for dropdown (admin only)
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentAPI.getAllStudents(),
    enabled: user?.role === 'admin' || user?.role === 'superadmin',
  });

  const createLeaveMutation = useMutation({
    mutationFn: (data: CreateLeaveRequest) => studentLeaveAPI.createLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-leaves'] });
      setIsCreateModalOpen(false);
      alert('Leave request created successfully!');
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({ id, approve, rejectionReason }: { id: number; approve: boolean; rejectionReason?: string }) =>
      studentLeaveAPI.approveLeave(id, { approve, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-leaves'] });
      setIsApproveModalOpen(false);
      setSelectedLeave(null);
      alert('Leave request processed successfully!');
    },
  });

  const leaves = leavesData?.data.leaves || [];
  const batches = batchesData?.data || [];
  const students = studentsData?.data?.students || [];

  const getStatusBadge = (status: LeaveStatus) => {
    const colors = {
      [LeaveStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [LeaveStatus.APPROVED]: 'bg-green-100 text-green-800',
      [LeaveStatus.REJECTED]: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleApprove = (leave: StudentLeave, approve: boolean) => {
    setSelectedLeave(leave);
    setIsApproveModalOpen(true);
  };

  const handleSubmitApprove = (approve: boolean, rejectionReason?: string) => {
    if (selectedLeave) {
      approveLeaveMutation.mutate({ id: selectedLeave.id, approve, rejectionReason });
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Student Leave Management</h1>
                <p className="mt-2 text-orange-100">Manage student leave requests and approvals</p>
              </div>
              {(user?.role === 'student' || user?.role === 'admin' || user?.role === 'superadmin') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  + Request Leave
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{leave.student?.name}</div>
                          <div className="text-sm text-gray-500">{leave.student?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {leave.batch?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(leave.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {leave.reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(leave.status)}</td>
                        {(user?.role === 'admin' || user?.role === 'superadmin') && leave.status === LeaveStatus.PENDING && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleApprove(leave, true)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(leave, false)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leaves.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No leave requests found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Leave Modal */}
      {isCreateModalOpen && (
        <CreateLeaveModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createLeaveMutation.mutate(data)}
          batches={batches}
          students={students}
          currentUser={user}
        />
      )}

      {/* Approve/Reject Modal */}
      {isApproveModalOpen && selectedLeave && (
        <ApproveLeaveModal
          leave={selectedLeave}
          onClose={() => {
            setIsApproveModalOpen(false);
            setSelectedLeave(null);
          }}
          onSubmit={handleSubmitApprove}
        />
      )}
    </Layout>
  );
};

// Create Leave Modal Component
const CreateLeaveModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreateLeaveRequest) => void;
  batches: any[];
  students: any[];
  currentUser: any;
}> = ({ onClose, onSubmit, batches, students, currentUser }) => {
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    studentId: currentUser?.role === 'student' ? currentUser.id : 0,
    batchId: 0,
    startDate: '',
    endDate: '',
    reason: '',
  });

  React.useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.id) {
      setFormData((prev) => ({
        ...prev,
        studentId: currentUser.id,
      }));
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.studentId && formData.batchId && formData.startDate && formData.endDate) {
      onSubmit(formData);
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Request Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentUser?.role !== 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Approve Leave Modal Component
const ApproveLeaveModal: React.FC<{
  leave: StudentLeave;
  onClose: () => void;
  onSubmit: (approve: boolean, rejectionReason?: string) => void;
}> = ({ leave, onClose, onSubmit }) => {
  const [approve, setApprove] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(approve, approve ? undefined : rejectionReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {approve ? 'Approve' : 'Reject'} Leave Request
        </h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Student:</strong> {leave.student?.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Batch:</strong> {leave.batch?.title}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Dates:</strong> {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={approve}
                onChange={() => setApprove(true)}
              />
              <span>Approve</span>
            </label>
            <label className="flex items-center space-x-2 mt-2">
              <input
                type="radio"
                checked={!approve}
                onChange={() => setApprove(false)}
              />
              <span>Reject</span>
            </label>
          </div>
          {!approve && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                required={!approve}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white ${
                approve ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {approve ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


