import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface ReportData {
  [key: string]: any;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    { id: 'all-analysis', label: 'All Analysis Reports', description: 'Comprehensive master report with all statistics' },
    { id: 'student-current-batch', label: 'Particular Student Current Batch', description: 'View current batch for a specific student', requiresStudentId: true },
    { id: 'students-without-batch', label: 'Students Without Batch', description: 'List of students not enrolled in any batch' },
    { id: 'batch-attendance', label: 'Particular Batch Attendance & Teaching Hours', description: 'Attendance and teaching hours for a specific batch', requiresBatchId: true },
    { id: 'student-attendance', label: 'Particular Student Attendance', description: 'Attendance records for a specific student', requiresStudentId: true },
    { id: 'batches-by-faculty', label: 'Number of Batches by Faculty', description: 'Batches and teaching hours grouped by faculty', requiresDateRange: true },
    { id: 'pending-payments', label: 'Pending Payment Student Wise', description: 'All pending payments grouped by student' },
    { id: 'monthwise-payments', label: 'Monthwise Payment Reports', description: 'Payment statistics grouped by month', requiresDateRange: true },
    { id: 'portfolio-status', label: 'Portfolio for Approval/Rejection', description: 'Portfolio status with approval dates' },
  ];

  const fetchReport = async (reportType: string, params: Record<string, any>) => {
    let endpoint = '';
    switch (reportType) {
      case 'all-analysis':
        endpoint = '/reports/all-analysis';
        break;
      case 'student-current-batch':
        if (!params.studentId) throw new Error('Student ID is required');
        endpoint = `/reports/student/${params.studentId}/current-batch`;
        break;
      case 'students-without-batch':
        endpoint = '/reports/students-without-batch';
        break;
      case 'batch-attendance':
        if (!params.batchId) throw new Error('Batch ID is required');
        endpoint = `/reports/batch-attendance?batchId=${params.batchId}${params.from ? `&from=${params.from}` : ''}${params.to ? `&to=${params.to}` : ''}`;
        break;
      case 'student-attendance':
        if (!params.studentId) throw new Error('Student ID is required');
        endpoint = `/reports/student/${params.studentId}/attendance${params.from ? `?from=${params.from}` : ''}${params.to ? `${params.from ? '&' : '?'}to=${params.to}` : ''}`;
        break;
      case 'batches-by-faculty':
        endpoint = `/reports/batches-by-faculty${params.facultyId ? `?facultyId=${params.facultyId}` : ''}${params.from ? `${params.facultyId ? '&' : '?'}from=${params.from}` : ''}${params.to ? `${params.from || params.facultyId ? '&' : '?'}to=${params.to}` : ''}`;
        break;
      case 'pending-payments':
        endpoint = '/reports/pending-payments';
        break;
      case 'monthwise-payments':
        endpoint = `/reports/monthwise-payments${params.month ? `?month=${params.month}` : ''}${params.year ? `${params.month ? '&' : '?'}year=${params.year}` : ''}`;
        break;
      case 'portfolio-status':
        endpoint = '/reports/portfolio-status';
        break;
      default:
        throw new Error('Invalid report type');
    }

    const response = await api.get(endpoint);
    return response.data;
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      setError('Please select a report type');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const data = await fetchReport(selectedReport, filters);
      setReportData(data);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format: 'csv' = 'csv') => {
    if (!selectedReport) return;

    try {
      const params = new URLSearchParams();
      params.append('type', selectedReport);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/reports/download?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const renderReportData = () => {
    if (!reportData || !reportData.data) return null;

    const data = reportData.data;

    // Render based on report type
    const renderContent = () => {
      // Pending Payments Report
      if (data.payments !== undefined && data.summary) {
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Total Pending</div>
                <div className="text-2xl font-bold text-blue-900">{data.summary.totalPending || 0}</div>
                <div className="text-xs text-blue-600 mt-1">Payments</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium mb-1">Outstanding Amount</div>
                <div className="text-2xl font-bold text-orange-900">₹{data.summary.totalPendingAmount || '0.00'}</div>
                <div className="text-xs text-orange-600 mt-1">Pending</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-600 font-medium mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-900">{data.summary.overdue?.count || 0}</div>
                <div className="text-xs text-red-600 mt-1">₹{data.summary.overdue?.amount || '0.00'}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium mb-1">Upcoming</div>
                <div className="text-2xl font-bold text-yellow-900">{data.summary.upcoming?.count || 0}</div>
                <div className="text-xs text-yellow-600 mt-1">₹{data.summary.upcoming?.amount || '0.00'}</div>
              </div>
            </div>

            {/* Payments Table */}
            {data.payments && data.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.payments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.student?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.student?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{payment.amount || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{payment.paidAmount || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{payment.remainingAmount || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'partial'
                                ? 'bg-blue-100 text-blue-800'
                                : payment.isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payment.status === 'paid'
                              ? 'Paid'
                              : payment.status === 'partial'
                              ? 'Partial'
                              : payment.isOverdue
                              ? 'Overdue'
                              : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending payments</h3>
                <p className="mt-1 text-sm text-gray-500">All payments have been processed.</p>
              </div>
            )}
          </div>
        );
      }

      // All Analysis Reports
      if (data.summary && data.summary.students && data.summary.batches) {
        return (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              Generated at: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'N/A'}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Students */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">Students</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Total:</span>
                    <span className="font-bold text-blue-900">{data.summary.students.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">With Batch:</span>
                    <span className="font-bold text-blue-900">{data.summary.students.withBatch || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Without Batch:</span>
                    <span className="font-bold text-blue-900">{data.summary.students.withoutBatch || 0}</span>
                  </div>
                </div>
              </div>

              {/* Batches */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Batches</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Total:</span>
                    <span className="font-bold text-green-900">{data.summary.batches.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Active:</span>
                    <span className="font-bold text-green-900">{data.summary.batches.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Ended:</span>
                    <span className="font-bold text-green-900">{data.summary.batches.ended || 0}</span>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">Sessions</h4>
                <div className="text-3xl font-bold text-purple-900">{data.summary.sessions?.total || 0}</div>
                <div className="text-sm text-purple-700 mt-1">Total Sessions</div>
              </div>

              {/* Payments */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-orange-900 mb-3">Payments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-700">Total:</span>
                    <span className="font-bold text-orange-900">{data.summary.payments?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-700">Pending:</span>
                    <span className="font-bold text-orange-900">{data.summary.payments?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-700">Total Amount:</span>
                    <span className="font-bold text-orange-900">₹{data.summary.payments?.totalAmount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-700">Paid:</span>
                    <span className="font-bold text-orange-900">₹{data.summary.payments?.paidAmount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-700">Pending Amount:</span>
                    <span className="font-bold text-orange-900">₹{data.summary.payments?.pendingAmount || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Portfolios */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-pink-900 mb-3">Portfolios</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-pink-700">Total:</span>
                    <span className="font-bold text-pink-900">{data.summary.portfolios?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-pink-700">Pending:</span>
                    <span className="font-bold text-pink-900">{data.summary.portfolios?.pending || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Students Without Batch
      if (data.students && Array.isArray(data.students)) {
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Students Without Batch</div>
              <div className="text-3xl font-bold text-blue-900">{data.totalCount || data.students.length}</div>
            </div>
            {data.students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.students.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.phone || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">All students are enrolled in batches.</p>
              </div>
            )}
          </div>
        );
      }

      // Portfolio Status
      if (data.portfolios && Array.isArray(data.portfolios)) {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">Total</div>
                <div className="text-2xl font-bold text-gray-900">{data.summary?.total || 0}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium">Pending</div>
                <div className="text-2xl font-bold text-yellow-900">{data.summary?.pending || 0}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Approved</div>
                <div className="text-2xl font-bold text-green-900">{data.summary?.approved || 0}</div>
              </div>
            </div>
            {data.portfolios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.portfolios.map((portfolio: any) => (
                      <tr key={portfolio.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{portfolio.student?.name}</div>
                          <div className="text-sm text-gray-500">{portfolio.student?.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{portfolio.batch?.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            portfolio.status === 'approved' ? 'bg-green-100 text-green-800' :
                            portfolio.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {portfolio.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {portfolio.approvedAt ? new Date(portfolio.approvedAt).toLocaleDateString() : 
                           portfolio.createdAt ? new Date(portfolio.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No portfolios found.</p>
              </div>
            )}
          </div>
        );
      }

      // Student Current Batch
      if (data.student && data.currentBatch) {
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Student Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600">Name</div>
                  <div className="font-semibold text-blue-900">{data.student.name}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">Email</div>
                  <div className="font-semibold text-blue-900">{data.student.email}</div>
                </div>
              </div>
            </div>

            {data.currentBatch ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Current Batch</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-green-600">Title</div>
                      <div className="font-semibold text-green-900">{data.currentBatch.batch.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">Software</div>
                      <div className="font-semibold text-green-900">{data.currentBatch.batch.software || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">Mode</div>
                      <div className="font-semibold text-green-900 capitalize">{data.currentBatch.batch.mode}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">Status</div>
                      <div className="font-semibold text-green-900 capitalize">{data.currentBatch.batch.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">Start Date</div>
                      <div className="font-semibold text-green-900">{new Date(data.currentBatch.batch.startDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-green-600">End Date</div>
                      <div className="font-semibold text-green-900">{new Date(data.currentBatch.batch.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-center">
                <p className="text-yellow-800">This student is not currently enrolled in any active batch.</p>
              </div>
            )}
          </div>
        );
      }

      // Student Attendance
      if (data.student && data.attendances) {
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Student Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600">Name</div>
                  <div className="font-semibold text-blue-900">{data.student.name}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">Email</div>
                  <div className="font-semibold text-blue-900">{data.student.email}</div>
                </div>
              </div>
            </div>

            {data.statistics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{data.statistics.present || 0}</div>
                  <div className="text-sm text-green-600">Present</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{data.statistics.absent || 0}</div>
                  <div className="text-sm text-red-600">Absent</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{data.statistics.total || 0}</div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">{data.statistics.attendanceRate || '0%'}</div>
                  <div className="text-sm text-purple-600">Rate</div>
                </div>
              </div>
            )}

            {data.attendances && data.attendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.attendances.map((attendance: any) => (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(attendance.session.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {attendance.session.startTime} - {attendance.session.endTime}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{attendance.session.batch?.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            attendance.status === 'present' || attendance.status === 'manual_present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attendance.status === 'manual_present' ? 'Manual Present' : attendance.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No attendance records found.</p>
              </div>
            )}
          </div>
        );
      }

      // Batch Attendance
      if (data.batch && data.statistics) {
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Batch Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600">Title</div>
                  <div className="font-semibold text-blue-900">{data.batch.title}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">Date Range</div>
                  <div className="font-semibold text-blue-900">
                    {data.dateRange?.from ? new Date(data.dateRange.from).toLocaleDateString() : 'N/A'} - 
                    {data.dateRange?.to ? new Date(data.dateRange.to).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-900">{data.statistics.totalSessions || 0}</div>
                <div className="text-sm text-blue-600">Total Sessions</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">{data.statistics.presentCount || 0}</div>
                <div className="text-sm text-green-600">Present</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-900">{data.statistics.absentCount || 0}</div>
                <div className="text-sm text-red-600">Absent</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-900">{data.statistics.attendancePercentage || '0%'}</div>
                <div className="text-sm text-purple-600">Attendance %</div>
              </div>
            </div>

            {data.studentStatistics && data.studentStatistics.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.studentStatistics.map((stat: any, idx: number) => (
                      <tr key={stat.studentId || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{stat.studentId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{stat.present || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{stat.absent || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{stat.total || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{stat.attendanceRate || '0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      // Batches by Faculty
      if (data.facultyStatistics && Array.isArray(data.facultyStatistics)) {
        return (
          <div className="space-y-4">
            {data.facultyStatistics.map((facultyStat: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{facultyStat.faculty?.name}</h4>
                    <p className="text-sm text-gray-600">{facultyStat.faculty?.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{facultyStat.batchCount || 0}</div>
                    <div className="text-sm text-gray-600">Batches</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-600">Total Sessions</div>
                    <div className="text-xl font-bold text-blue-900">{facultyStat.totalSessions || 0}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-green-600">Total Hours</div>
                    <div className="text-xl font-bold text-green-900">{facultyStat.totalHours || 0}h</div>
                  </div>
                </div>
                {facultyStat.batches && facultyStat.batches.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Batches:</div>
                    <div className="flex flex-wrap gap-2">
                      {facultyStat.batches.map((batch: any) => (
                        <span key={batch.id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          {batch.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }

      // Monthwise Payments
      if (data.monthlyStatistics && Array.isArray(data.monthlyStatistics)) {
        return (
          <div className="space-y-4">
            {data.monthlyStatistics.map((monthStat: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{monthStat.month}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-600">Total Amount</div>
                    <div className="text-xl font-bold text-blue-900">₹{monthStat.totalAmount || '0.00'}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-green-600">Paid</div>
                    <div className="text-xl font-bold text-green-900">₹{monthStat.paid || '0.00'}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-sm text-orange-600">Pending</div>
                    <div className="text-xl font-bold text-orange-900">₹{monthStat.pending || '0.00'}</div>
                  </div>
                </div>
                {monthStat.payments && monthStat.payments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthStat.payments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{payment.student?.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{payment.amount}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{payment.paidAmount || '0.00'}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{payment.remainingAmount || '0.00'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    payment.status === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'partial'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }

      // Default fallback - show formatted JSON if structure is unknown
      return (
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px] border border-gray-200">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      );
    };

    return (
      <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-white">Report Results</h3>
            <button
              onClick={() => handleDownload('csv')}
              className="px-5 py-2.5 bg-white text-orange-600 rounded-lg hover:bg-gray-50 font-medium shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Reports Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Generate and download comprehensive reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Report Selection - Mobile: Full width, Desktop: Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Report Types</h2>
              </div>
              <div className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="space-y-3">
                  {reportTypes.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report.id);
                        setFilters({});
                        setReportData(null);
                        setError(null);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedReport === report.id
                          ? 'border-orange-500 bg-orange-50 shadow-md transform scale-[1.02]'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          selectedReport === report.id ? 'bg-orange-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm sm:text-base mb-1 ${
                            selectedReport === report.id ? 'text-orange-700' : 'text-gray-900'
                          }`}>
                            {report.label}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            {report.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Report Configuration and Results */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {selectedReport ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    {reportTypes.find((r) => r.id === selectedReport)?.label}
                  </h2>
                </div>
                <div className="p-4 sm:p-6">

                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    {reportTypes.find((r) => r.id === selectedReport)?.requiresStudentId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={filters.studentId || ''}
                          onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="Enter student ID"
                          required
                        />
                      </div>
                    )}

                    {selectedReport === 'batch-attendance' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Batch ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={filters.batchId || ''}
                            onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="Enter batch ID"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <input
                              type="date"
                              value={filters.from || ''}
                              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <input
                              type="date"
                              value={filters.to || ''}
                              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedReport === 'student-attendance' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                          <input
                            type="date"
                            value={filters.from || ''}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                          <input
                            type="date"
                            value={filters.to || ''}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {selectedReport === 'batches-by-faculty' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID (Optional)</label>
                          <input
                            type="number"
                            value={filters.facultyId || ''}
                            onChange={(e) => setFilters({ ...filters, facultyId: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="Leave empty for all faculty"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <input
                              type="date"
                              value={filters.from || ''}
                              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <input
                              type="date"
                              value={filters.to || ''}
                              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedReport === 'monthwise-payments' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Month (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={filters.month || ''}
                            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                          <input
                            type="number"
                            value={filters.year || new Date().getFullYear()}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Report Type</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Choose a report from the sidebar to get started</p>
                </div>
              </div>
            )}

            {renderReportData()}
          </div>
        </div>
      </div>
    </div>
  );
};

