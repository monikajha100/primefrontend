import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { batchProgressAPI, BatchProgress } from '../api/batchProgress.api';
import { Layout } from '../components/Layout';
import { userAPI, UserRole, User } from '../api/user.api';
import { batchAPI } from '../api/batch.api';
import { useAuth } from '../context/AuthContext';

export const BatchProgressList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchProgress | null>(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<number[]>([]);
  const [facultySearch, setFacultySearch] = useState('');

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['batch-progress', debouncedSearch],
    queryFn: () => batchProgressAPI.getBatchProgress(
      debouncedSearch && debouncedSearch.trim() 
        ? { search: debouncedSearch.trim() } 
        : undefined
    ),
  });

  const { data: facultyData, isLoading: isFacultyLoading } = useQuery({
    queryKey: ['faculty-users'],
    queryFn: () =>
      userAPI.getAllUsers({
        role: UserRole.FACULTY,
        isActive: true,
        page: 1,
        limit: 1000,
      }),
  });

  const assignFacultyMutation = useMutation({
    mutationFn: ({ batchId, facultyIds }: { batchId: number; facultyIds: number[] }) =>
      batchAPI.assignFaculty(batchId, facultyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-progress'] });
      setIsAllocateModalOpen(false);
      setSelectedBatch(null);
    },
  });

  const handleExportCSV = async () => {
    try {
      const blob = await batchProgressAPI.exportToCSV(debouncedSearch || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV. Please try again.');
      console.error('CSV export error:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      // For now, we'll use a simple approach - convert data to PDF using browser print
      // In production, you might want to use a library like jsPDF
      const batches = data?.data.batches || [];
      
      // Create a printable HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Batch Progress Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .progress-bar { width: 100px; height: 20px; background-color: #e0e0e0; border-radius: 10px; overflow: hidden; }
              .progress-fill { height: 100%; background-color: #4caf50; }
            </style>
          </head>
          <body>
            <h1>Batch Progress Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Title</th>
                  <th>Software</th>
                  <th>Mode</th>
                  <th>Total Sessions</th>
                  <th>Completed</th>
                  <th>Progress</th>
                  <th>Students</th>
                  <th>Faculty</th>
                </tr>
              </thead>
              <tbody>
                ${batches.map((batch) => `
                  <tr>
                    <td>${batch.id}</td>
                    <td>${batch.title}</td>
                    <td>${batch.software || 'N/A'}</td>
                    <td>${batch.mode}</td>
                    <td>${batch.totalSessions}</td>
                    <td>${batch.completedSessions}</td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${batch.progressPercentage}%"></div>
                      </div>
                      ${batch.progressPercentage}%
                    </td>
                    <td>${batch.studentCount}</td>
                    <td>${batch.faculty.map((f) => f.name).join(', ') || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (err) {
      alert('Failed to export PDF. Please try again.');
      console.error('PDF export error:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Batch Progress</h3>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load batch progress. Please try again.'}
          </p>
        </div>
      </Layout>
    );
  }

  const batches = data?.data.batches || [];
  const totalCount = data?.data.totalCount || 0;
  const facultyList: User[] = facultyData?.data.users || [];

  const filteredFaculty = facultyList.filter((faculty) => {
    if (!facultySearch.trim()) return true;
    const lower = facultySearch.toLowerCase();
    return (
      faculty.name.toLowerCase().includes(lower) ||
      faculty.email.toLowerCase().includes(lower)
    );
  });

  const handleOpenAllocateModal = (batch: BatchProgress) => {
    setSelectedBatch(batch);
    const currentIds = batch.faculty?.map((f) => f.id) || [];
    setSelectedFacultyIds(currentIds);
    setIsAllocateModalOpen(true);
  };

  const toggleFacultySelection = (facultyId: number) => {
    setSelectedFacultyIds((prev) =>
      prev.includes(facultyId) ? prev.filter((id) => id !== facultyId) : [...prev, facultyId]
    );
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    assignFacultyMutation.mutate({
      batchId: selectedBatch.id,
      facultyIds: selectedFacultyIds,
    });
  };

  const allocationErrorMessage = assignFacultyMutation.error
    ? (() => {
        const maybeAxiosError = assignFacultyMutation.error as AxiosError<{ message?: string }>;
        return (
          maybeAxiosError.response?.data?.message ||
          maybeAxiosError.message ||
          'Failed to update allocation'
        );
      })()
    : null;

  return (
    <>
      <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Batch Progress List</h1>
          <p className="text-gray-600 mt-2">View progress of all batches with completion tracking</p>
        </div>

        {/* Search and Export Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by batch title or software..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
          {debouncedSearch && (
            <div className="mt-2 text-sm text-gray-600">
              Found {totalCount} batch{totalCount !== 1 ? 'es' : ''} matching "{debouncedSearch}"
            </div>
          )}
        </div>

        {/* Batches List */}
        {batches.length === 0 ? (
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
              {debouncedSearch
                ? `No batches match your search "${debouncedSearch}"`
                : 'No batches have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Software
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocation
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.title}</div>
                        <div className="text-sm text-gray-500">ID: {batch.id}</div>
                        {batch.status && (
                          <div className="text-xs text-gray-400 capitalize">{batch.status}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.software || 'N/A'}</div>
                        <div className="text-xs text-gray-500 capitalize">{batch.mode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.completedSessions} / {batch.totalSessions}
                        </div>
                        <div className="text-xs text-gray-500">
                          {batch.totalSessions > 0
                            ? `${Math.round((batch.completedSessions / batch.totalSessions) * 100)}% complete`
                            : 'No sessions'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div
                              className={`h-2.5 rounded-full ${getProgressColor(batch.progressPercentage)}`}
                              style={{ width: `${batch.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {batch.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.studentCount}</div>
                        <div className="text-xs text-gray-500">students</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {batch.faculty.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {batch.faculty.map((faculty) => (
                                <span
                                  key={faculty.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {faculty.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No faculty assigned</span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAllocateModal(batch)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            {batch.faculty.length > 0 ? 'Update Allocation' : 'Assign Faculty'}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>

    {/* Allocate Faculty Modal */}
    {isAllocateModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Allocate Faculty</h2>
                  <p className="text-gray-600 mt-1">
                    Batch: <span className="font-semibold">{selectedBatch.title}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAllocateModalOpen(false);
                    setSelectedBatch(null);
                    setFacultySearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAllocateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Faculty
                  </label>
                  <input
                    type="text"
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  {isFacultyLoading ? (
                    <div className="text-sm text-gray-500">Loading faculty...</div>
                  ) : filteredFaculty.length === 0 ? (
                    <div className="text-sm text-gray-500">No faculty found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredFaculty.map((faculty) => (
                        <label
                          key={faculty.id}
                          className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                            selectedFacultyIds.includes(faculty.id) ? 'border-indigo-500 bg-indigo-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFacultyIds.includes(faculty.id)}
                            onChange={() => toggleFacultySelection(faculty.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                            <p className="text-xs text-gray-500">{faculty.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
                  <p>
                    Selected Faculty:{' '}
                    <span className="font-semibold">{selectedFacultyIds.length}</span>
                  </p>
                </div>

                {allocationErrorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {allocationErrorMessage}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllocateModalOpen(false);
                      setSelectedBatch(null);
                      setFacultySearch('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignFacultyMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {assignFacultyMutation.isPending ? 'Saving...' : 'Save Allocation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

