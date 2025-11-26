import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchAPI, Batch, BatchMode, UpdateBatchRequest } from '../api/batch.api';
import { useAuth } from '../context/AuthContext';

type BatchCategory = 'all' | 'current' | 'upcoming' | 'past';

export const BatchesList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<BatchCategory>('all');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateBatchRequest & { schedule?: { days: string[]; timeSlots: any[] } }>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchAPI.getAllBatches(),
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ batchId, data }: { batchId: number; data: UpdateBatchRequest }) =>
      batchAPI.updateBatch(batchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setIsEditModalOpen(false);
      setSelectedBatch(null);
      setEditFormData({});
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: number) => batchAPI.deleteBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleView = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsViewModalOpen(true);
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    const scheduleObj = getScheduleObject(batch.schedule);
    setEditFormData({
      title: batch.title,
      software: batch.software,
      mode: batch.mode,
      startDate: batch.startDate.split('T')[0],
      endDate: batch.endDate.split('T')[0],
      maxCapacity: batch.maxCapacity,
      schedule: scheduleObj || { days: [], timeSlots: [] },
      status: batch.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatch) {
      updateBatchMutation.mutate({ batchId: selectedBatch.id, data: editFormData });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedBatch) {
      deleteBatchMutation.mutate(selectedBatch.id);
    }
  };

  const categorizeBatch = (batch: Batch): BatchCategory[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const categories: BatchCategory[] = [];

    if (startDate > today) {
      categories.push('upcoming');
    } else if (endDate < today) {
      categories.push('past');
    } else {
      categories.push('current');
    }

    return categories;
  };

  const filterBatches = (batches: Batch[]): Batch[] => {
    if (activeTab === 'all') return batches;

    return batches.filter((batch) => {
      const categories = categorizeBatch(batch);
      return categories.includes(activeTab);
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeSlots = (schedule: Record<string, any> | undefined | string): string => {
    if (!schedule) return 'Not specified';
    
    // Handle if schedule is a JSON string
    let scheduleObj = schedule;
    if (typeof schedule === 'string') {
      try {
        scheduleObj = JSON.parse(schedule);
      } catch (e) {
        return 'Not specified';
      }
    }

    if (!scheduleObj || !scheduleObj.timeSlots || !Array.isArray(scheduleObj.timeSlots)) {
      return 'Not specified';
    }

    const formatted = scheduleObj.timeSlots
      .map((slot: any) => {
        if (slot.startTime && slot.endTime) {
          const duration = slot.durationMinutes ? ` (${Math.floor(slot.durationMinutes / 60)}h ${slot.durationMinutes % 60}m)` : '';
          return `${slot.startTime} - ${slot.endTime}${duration}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');
    
    return formatted || 'Not specified';
  };

  const formatDays = (schedule: Record<string, any> | undefined | string): string => {
    if (!schedule) return 'Not specified';
    
    // Handle if schedule is a JSON string
    let scheduleObj = schedule;
    if (typeof schedule === 'string') {
      try {
        scheduleObj = JSON.parse(schedule);
      } catch (e) {
        return 'Not specified';
      }
    }

    if (!scheduleObj || !scheduleObj.days || !Array.isArray(scheduleObj.days)) {
      return 'Not specified';
    }
    return scheduleObj.days.join(', ');
  };

  const getScheduleObject = (schedule: Record<string, any> | undefined | string): Record<string, any> | null => {
    if (!schedule) return null;
    
    if (typeof schedule === 'string') {
      try {
        return JSON.parse(schedule);
      } catch (e) {
        return null;
      }
    }
    
    return schedule as Record<string, any>;
  };

  const getBatchStatusBadge = (batch: Batch) => {
    const categories = categorizeBatch(batch);
    if (categories.includes('current')) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Current
        </span>
      );
    } else if (categories.includes('upcoming')) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Upcoming
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Past
        </span>
      );
    }
  };

  const tabs: { key: BatchCategory; label: string; count?: number }[] = [
    { key: 'all', label: 'All Batches' },
    { key: 'current', label: 'Current' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Batches</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : 'Failed to load batches. Please try again.'}
        </p>
      </div>
    );
  }

  const batches = data?.data || [];
  const filteredBatches = filterBatches(batches);

  // Calculate counts for each category
  const counts = {
    all: batches.length,
    current: batches.filter((b) => categorizeBatch(b).includes('current')).length,
    upcoming: batches.filter((b) => categorizeBatch(b).includes('upcoming')).length,
    past: batches.filter((b) => categorizeBatch(b).includes('past')).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
        <p className="text-gray-600 mt-2">View and manage all batches</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No batches found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {activeTab === 'all'
              ? 'No batches have been created yet.'
              : `No ${activeTab} batches found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{batch.title}</h3>
                      {getBatchStatusBadge(batch)}
                    </div>
                    {batch.software && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Software:</span> {batch.software}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Mode:</span>{' '}
                      <span className="capitalize">{batch.mode}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleView(batch)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition flex items-center"
                      title="View Details"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(batch)}
                          className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition flex items-center"
                          title="Edit Batch"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(batch)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition flex items-center"
                          title="Delete Batch"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Start Date
                    </p>
                    <p className="text-sm text-gray-900">{formatDate(batch.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      End Date
                    </p>
                    <p className="text-sm text-gray-900">{formatDate(batch.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Enrollment
                    </p>
                    <p className="text-sm text-gray-900">
                      {batch.currentEnrollment || 0} / {batch.maxCapacity} students
                    </p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, ((batch.currentEnrollment || 0) / batch.maxCapacity) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Status
                    </p>
                    <p className="text-sm text-gray-900 capitalize">{batch.status || 'Active'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                  {batch.schedule && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Days
                        </p>
                        <p className="text-sm text-gray-900">{formatDays(batch.schedule)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Time Slots
                        </p>
                        <p className="text-sm text-gray-900">{formatTimeSlots(batch.schedule)}</p>
                      </div>
                    </div>
                  )}

                  {batch.faculty && batch.faculty.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Faculty
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {batch.faculty.map((faculty) => (
                          <span
                            key={faculty.id}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                          >
                            {faculty.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {batch.createdBy && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Created By
                      </p>
                      <p className="text-sm text-gray-900">{batch.createdBy.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Batch Details</h2>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedBatch(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedBatch.title}</h3>
                  {selectedBatch.software && <p className="text-gray-600">Software: {selectedBatch.software}</p>}
                  <p className="text-gray-600">Mode: <span className="capitalize">{selectedBatch.mode}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="text-gray-900">{formatDate(selectedBatch.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p className="text-gray-900">{formatDate(selectedBatch.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <p className="text-gray-900">
                      {selectedBatch.currentEnrollment || 0} / {selectedBatch.maxCapacity} students
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-gray-900 capitalize">{selectedBatch.status || 'Active'}</p>
                  </div>
                </div>

                {selectedBatch.schedule && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Schedule</p>
                    <p className="text-gray-900 mb-1">
                      <span className="font-medium">Days:</span> {formatDays(selectedBatch.schedule)}
                    </p>
                    <p className="text-gray-900 mb-2">
                      <span className="font-medium">Time Slots:</span> {formatTimeSlots(selectedBatch.schedule)}
                    </p>
                    {(() => {
                      const scheduleObj = getScheduleObject(selectedBatch.schedule);
                      if (scheduleObj?.timeSlots && Array.isArray(scheduleObj.timeSlots) && scheduleObj.timeSlots.length > 0) {
                        return (
                          <div className="mt-2 space-y-2">
                            {scheduleObj.timeSlots.map((slot: any, idx: number) => (
                              <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="font-medium mb-1">Time Slot {idx + 1}</div>
                                <div className="text-gray-600">
                                  {slot.startTime && slot.endTime ? (
                                    <>
                                      {slot.startTime} - {slot.endTime}
                                      {slot.durationMinutes > 0 && (
                                        <span className="text-gray-500 ml-2">
                                          ({Math.floor(slot.durationMinutes / 60)}h {slot.durationMinutes % 60}m)
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    'Not configured'
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {selectedBatch.faculty && selectedBatch.faculty.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Faculty</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBatch.faculty.map((faculty) => (
                        <span key={faculty.id} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {faculty.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBatch.enrolledStudents && selectedBatch.enrolledStudents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Enrolled Students ({selectedBatch.enrolledStudents.length})</p>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedBatch.enrolledStudents.map((student) => (
                            <tr key={student.id}>
                              <td className="px-3 py-2 text-sm text-gray-900">{student.name}</td>
                              <td className="px-3 py-2 text-sm text-gray-500">{student.email}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 capitalize">{student.enrollmentStatus || 'Active'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedBatch(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Batch</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Software</label>
                  <input
                    type="text"
                    value={editFormData.software || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, software: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={editFormData.mode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value as BatchMode })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value={BatchMode.ONLINE}>Online</option>
                    <option value={BatchMode.OFFLINE}>Offline</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editFormData.startDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editFormData.endDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.maxCapacity || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, maxCapacity: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="e.g., active, completed, cancelled"
                  />
                </div>

                {/* Schedule Editing */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                  
                  {/* Days Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label
                          key={day}
                          className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editFormData.schedule?.days?.includes(day) || false}
                            onChange={(e) => {
                              const currentDays = editFormData.schedule?.days || [];
                              const days = e.target.checked
                                ? [...currentDays, day]
                                : currentDays.filter((d) => d !== day);
                              setEditFormData({
                                ...editFormData,
                                schedule: {
                                  ...(editFormData.schedule || { days: [], timeSlots: [] }),
                                  days,
                                },
                              });
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Time Slots
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSlots = editFormData.schedule?.timeSlots || [];
                          const newSlot = {
                            id: `slot-${Date.now()}-${Math.random()}`,
                            startTime: '',
                            endTime: '',
                            durationMinutes: 0,
                          };
                          setEditFormData({
                            ...editFormData,
                            schedule: {
                              ...(editFormData.schedule || { days: [], timeSlots: [] }),
                              timeSlots: [...currentSlots, newSlot],
                            },
                          });
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    {(!editFormData.schedule?.timeSlots || editFormData.schedule.timeSlots.length === 0) ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                        No time slots added. Click "Add Time Slot" to add one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {editFormData.schedule.timeSlots.map((slot: any, index: number) => {
                          const calculateDuration = (start: string, end: string): number => {
                            if (!start || !end) return 0;
                            const [startHours, startMinutes] = start.split(':').map(Number);
                            const [endHours, endMinutes] = end.split(':').map(Number);
                            const startTotal = startHours * 60 + startMinutes;
                            const endTotal = endHours * 60 + endMinutes;
                            return Math.max(0, endTotal - startTotal);
                          };

                          const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
                            const updatedSlots = [...(editFormData.schedule?.timeSlots || [])];
                            updatedSlots[index] = {
                              ...updatedSlots[index],
                              [field]: value,
                            };

                            if (field === 'startTime' && updatedSlots[index].endTime) {
                              updatedSlots[index].durationMinutes = calculateDuration(value, updatedSlots[index].endTime);
                            } else if (field === 'endTime' && updatedSlots[index].startTime) {
                              updatedSlots[index].durationMinutes = calculateDuration(updatedSlots[index].startTime, value);
                            }

                            setEditFormData({
                              ...editFormData,
                              schedule: {
                                ...(editFormData.schedule || { days: [], timeSlots: [] }),
                                timeSlots: updatedSlots,
                              },
                            });
                          };

                          const handleDurationChange = (value: number) => {
                            const updatedSlots = [...(editFormData.schedule?.timeSlots || [])];
                            updatedSlots[index] = {
                              ...updatedSlots[index],
                              durationMinutes: Math.max(0, value),
                            };
                            setEditFormData({
                              ...editFormData,
                              schedule: {
                                ...(editFormData.schedule || { days: [], timeSlots: [] }),
                                timeSlots: updatedSlots,
                              },
                            });
                          };

                          const handleRemove = () => {
                            const updatedSlots = editFormData.schedule?.timeSlots?.filter((_, i) => i !== index) || [];
                            setEditFormData({
                              ...editFormData,
                              schedule: {
                                ...(editFormData.schedule || { days: [], timeSlots: [] }),
                                timeSlots: updatedSlots,
                              },
                            });
                          };

                          return (
                            <div key={slot.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Time Slot {index + 1}</h4>
                                {editFormData.schedule?.timeSlots && editFormData.schedule.timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                                  <input
                                    type="time"
                                    value={slot.startTime || ''}
                                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                                  <input
                                    type="time"
                                    value={slot.endTime || ''}
                                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (Minutes)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="15"
                                    value={slot.durationMinutes || 0}
                                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    {slot.durationMinutes > 0
                                      ? `${Math.floor(slot.durationMinutes / 60)}h ${slot.durationMinutes % 60}m`
                                      : 'Auto-calculated'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {updateBatchMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {(updateBatchMutation.error as any)?.response?.data?.message || 'Failed to update batch'}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedBatch(null);
                      setEditFormData({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateBatchMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {updateBatchMutation.isPending ? 'Updating...' : 'Update Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Batch</h2>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedBatch.title}</strong>? This action cannot be undone.
              </p>
              {selectedBatch.currentEnrollment && selectedBatch.currentEnrollment > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                  <p className="text-sm">
                    This batch has {selectedBatch.currentEnrollment} enrollment(s). You must remove all enrollments before deleting.
                  </p>
                </div>
              )}

              {deleteBatchMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {(deleteBatchMutation.error as any)?.response?.data?.message || 'Failed to delete batch'}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedBatch(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteBatchMutation.isPending || (selectedBatch.currentEnrollment && selectedBatch.currentEnrollment > 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteBatchMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

