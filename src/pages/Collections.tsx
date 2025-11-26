import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentAPI, PaymentStatus, Payment } from '../api/payment.api';
import { userAPI, User, UserRole } from '../api/user.api';

const formatCurrency = (value: number | string) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getOutstanding = (payment: Payment) => {
  const amount = Number(payment.amount || 0);
  const paidAmount = Number(payment.paidAmount || 0);
  return Math.max(amount - paidAmount, 0);
};

export const Collections: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>(PaymentStatus.PENDING);
  const [studentFilter, setStudentFilter] = useState<number | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentToRecord, setPaymentToRecord] = useState<Payment | null>(null);

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'collections'],
    queryFn: () =>
      userAPI.getAllUsers({
        role: UserRole.STUDENT,
        isActive: true,
        page: 1,
        limit: 500,
      }),
  });

  const {
    data: paymentsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['collections-payments', statusFilter, studentFilter],
    queryFn: () =>
      paymentAPI.getAllPayments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        studentId: studentFilter ? Number(studentFilter) : undefined,
      }),
  });

  const payments = paymentsData?.data?.payments || [];

  const summary = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
    const pendingAmount = payments.reduce((sum, payment) => sum + getOutstanding(payment), 0);
    const partialCount = payments.filter((p) => p.status === PaymentStatus.PARTIAL).length;
    const pendingCount = payments.filter((p) => p.status === PaymentStatus.PENDING).length;
    const paidCount = payments.filter((p) => p.status === PaymentStatus.PAID).length;

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      partialCount,
      pendingCount,
      paidCount,
    };
  }, [payments]);

  const createPaymentMutation = useMutation({
    mutationFn: paymentAPI.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-payments'] });
      setShowCreateModal(false);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, amountPaid, receiptUrl }: { id: number; amountPaid: number; receiptUrl?: string }) =>
      paymentAPI.recordPayment(id, { amountPaid, receiptUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-payments'] });
      setPaymentToRecord(null);
    },
  });

  const students = studentsData?.data?.users || [];
  const pendingPayments = payments.filter((payment) => payment.status !== PaymentStatus.PAID);
  const paidPayments = payments.filter((payment) => payment.status === PaymentStatus.PAID);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Collections & Payments</h1>
          <p className="text-orange-100">Track EMI plans, pending dues, and receipts</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            + Add EMI / Payment Plan
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Scheduled" value={formatCurrency(summary.totalAmount)} sub="All EMI plans" color="from-indigo-500 to-indigo-600" />
        <SummaryCard title="Collected" value={formatCurrency(summary.paidAmount)} sub={`${summary.paidCount} payments`} color="from-green-500 to-green-600" />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(summary.pendingAmount)}
          sub={`${summary.pendingCount + summary.partialCount} pending/partial`}
          color="from-red-500 to-orange-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PaymentStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value={PaymentStatus.PENDING}>Pending</option>
            <option value={PaymentStatus.PARTIAL}>Partial</option>
            <option value={PaymentStatus.PAID}>Paid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Student</label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value ? Number(e.target.value) : '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Students</option>
            {students.map((student: User) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setStatusFilter(PaymentStatus.PENDING);
              setStudentFilter('');
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Tables */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">Failed to load payments. Please try again.</div>
      ) : (
        <div className="space-y-6">
          <PaymentSection
            title="Pending & Partial Payments"
            payments={pendingPayments}
            emptyMessage="All payments are cleared!"
            onRecordPayment={(payment) => setPaymentToRecord(payment)}
          />
          <PaymentSection title="Paid Payments" payments={paidPayments} emptyMessage="No payments recorded yet." />
        </div>
      )}

      {showCreateModal && (
        <CreatePaymentModal
          students={students}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createPaymentMutation.mutate(data)}
          isLoading={createPaymentMutation.isPending}
        />
      )}

      {paymentToRecord && (
        <RecordPaymentModal
          payment={paymentToRecord}
          onClose={() => setPaymentToRecord(null)}
          onSubmit={(amountPaid, receiptUrl) =>
            recordPaymentMutation.mutate({ id: paymentToRecord.id, amountPaid, receiptUrl })
          }
          isLoading={recordPaymentMutation.isPending}
        />
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  color: string;
}) => (
  <div className={`bg-gradient-to-r ${color} rounded-xl shadow-lg text-white p-5`}>
    <p className="text-sm text-white/80">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-white/80 mt-1">{sub}</p>
  </div>
);

const PaymentSection: React.FC<{
  title: string;
  payments: Payment[];
  emptyMessage: string;
  onRecordPayment?: (payment: Payment) => void;
}> = ({ title, payments, emptyMessage, onRecordPayment }) => (
  <div className="bg-white rounded-xl shadow border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <span className="text-sm text-gray-500">{payments.length} record(s)</span>
    </div>
    {payments.length === 0 ? (
      <div className="p-8 text-center text-gray-500">{emptyMessage}</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
              {onRecordPayment && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => {
              const outstanding = getOutstanding(payment);
              return (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-gray-900">{payment.student?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{payment.student?.email}</div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(payment.paidAmount)}</td>
                  <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(outstanding)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(payment.dueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {payment.receiptUrl ? (
                      <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">No receipt</span>
                    )}
                  </td>
                  {onRecordPayment && (
                    <td className="px-4 py-2 text-sm">
                      {payment.status === PaymentStatus.PAID ? (
                        <span className="text-green-600 font-medium">Paid</span>
                      ) : (
                        <button
                          onClick={() => onRecordPayment(payment)}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const styles: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-800',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  };

  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.PARTIAL]: 'Partial',
    [PaymentStatus.PAID]: 'Paid',
  };

  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
};

const CreatePaymentModal: React.FC<{
  students: User[];
  onClose: () => void;
  onSubmit: (data: { studentId: number; amount: number; dueDate: string; receiptUrl?: string }) => void;
  isLoading: boolean;
}> = ({ students, onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    receiptUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.amount || !form.dueDate) return;
    onSubmit({
      studentId: Number(form.studentId),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      receiptUrl: form.receiptUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Add EMI / Payment Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL (optional)</label>
            <input
              type="url"
              value={form.receiptUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, receiptUrl: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecordPaymentModal: React.FC<{
  payment: Payment;
  onClose: () => void;
  onSubmit: (amountPaid: number, receiptUrl?: string) => void;
  isLoading: boolean;
}> = ({ payment, onClose, onSubmit, isLoading }) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const outstanding = getOutstanding(payment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid) return;
    onSubmit(Number(amountPaid), receiptUrl || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Student:</strong> {payment.student?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Outstanding:</strong> {formatCurrency(outstanding)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
            <input
              type="number"
              min={0}
              max={outstanding}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL (optional)</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


