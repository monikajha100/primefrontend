import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, EmployeeProfileData } from '../api/employee.api';

const schema = yup.object().shape({
  userId: yup.number().required('User ID is required').positive('User ID must be positive'),
  employeeId: yup.string().required('Employee ID is required').min(2, 'Employee ID must be at least 2 characters'),
  gender: yup.string().oneOf(['Male', 'Female', 'Other']).nullable(),
  dateOfBirth: yup.date().nullable().typeError('Invalid date format').max(new Date(), 'Date of birth cannot be in the future'),
  nationality: yup.string().nullable(),
  maritalStatus: yup.string().oneOf(['Single', 'Married', 'Other']).nullable(),
  department: yup.string().nullable(),
  designation: yup.string().nullable(),
  dateOfJoining: yup.date().nullable().typeError('Invalid date format'),
  employmentType: yup.string().oneOf(['Full-Time', 'Part-Time', 'Contract', 'Intern']).nullable(),
  reportingManager: yup.string().nullable(),
  workLocation: yup.string().nullable(),
  bankName: yup.string().nullable(),
  accountNumber: yup.string().nullable(),
  ifscCode: yup.string().nullable(),
  branch: yup.string().nullable(),
  panNumber: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  postalCode: yup.string().nullable(),
});

export const EmployeeDetails: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EmployeeProfileData & { userId: number }>({
    resolver: yupResolver(schema),
  });

  const gender = watch('gender');
  const maritalStatus = watch('maritalStatus');
  const employmentType = watch('employmentType');

  const onSubmit = async (data: EmployeeProfileData & { userId: number }) => {
    setError('');
    setLoading(true);

    try {
      const employeeData: EmployeeProfileData = {
        userId: data.userId,
        employeeId: data.employeeId,
        gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : undefined,
        nationality: data.nationality || undefined,
        maritalStatus: data.maritalStatus || undefined,
        department: data.department || undefined,
        designation: data.designation || undefined,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining).toISOString().split('T')[0] : undefined,
        employmentType: data.employmentType || undefined,
        reportingManager: data.reportingManager || undefined,
        workLocation: data.workLocation || undefined,
        bankName: data.bankName || undefined,
        accountNumber: data.accountNumber || undefined,
        ifscCode: data.ifscCode || undefined,
        branch: data.branch || undefined,
        panNumber: data.panNumber || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
      };

      await employeeAPI.createEmployeeProfile(employeeData);
      
      alert('Employee details saved successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save employee details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900">🧾 Employee Details Form</h2>
            <p className="mt-2 text-sm text-gray-600">
              Fill in the form below to complete your employee profile
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Personal Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name - Note: This comes from User, but we need userId */}
                <div className="md:col-span-2">
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('userId', { valueAsNumber: true })}
                    type="number"
                    id="userId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter user ID"
                  />
                  {errors.userId && (
                    <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="flex space-x-4">
                    {['Male', 'Female', 'Other'].map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          {...register('gender')}
                          type="radio"
                          value={option}
                          checked={gender === option}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    id="dateOfBirth"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Nationality */}
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                    Nationality
                  </label>
                  <input
                    {...register('nationality')}
                    type="text"
                    id="nationality"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter nationality"
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationality.message}</p>
                  )}
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marital Status
                  </label>
                  <div className="flex space-x-4">
                    {['Single', 'Married', 'Other'].map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          {...register('maritalStatus')}
                          type="radio"
                          value={option}
                          checked={maritalStatus === option}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.maritalStatus && (
                    <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    id="city"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                {/* State/Province */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    {...register('state')}
                    type="text"
                    id="state"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter state/province"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    id="postalCode"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter postal code"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Employment Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Employment Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee ID */}
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('employeeId')}
                    type="text"
                    id="employeeId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    {...register('department')}
                    type="text"
                    id="department"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter department"
                  />
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>

                {/* Designation / Job Title */}
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                    Designation / Job Title
                  </label>
                  <input
                    {...register('designation')}
                    type="text"
                    id="designation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter designation"
                  />
                  {errors.designation && (
                    <p className="mt-1 text-sm text-red-600">{errors.designation.message}</p>
                  )}
                </div>

                {/* Date of Joining */}
                <div>
                  <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700">
                    Date of Joining
                  </label>
                  <input
                    {...register('dateOfJoining')}
                    type="date"
                    id="dateOfJoining"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                  />
                  {errors.dateOfJoining && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfJoining.message}</p>
                  )}
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Full-Time', 'Part-Time', 'Contract', 'Intern'].map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          {...register('employmentType')}
                          type="radio"
                          value={option}
                          checked={employmentType === option}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.employmentType && (
                    <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                  )}
                </div>

                {/* Reporting Manager */}
                <div>
                  <label htmlFor="reportingManager" className="block text-sm font-medium text-gray-700">
                    Reporting Manager
                  </label>
                  <input
                    {...register('reportingManager')}
                    type="text"
                    id="reportingManager"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter reporting manager"
                  />
                  {errors.reportingManager && (
                    <p className="mt-1 text-sm text-red-600">{errors.reportingManager.message}</p>
                  )}
                </div>

                {/* Work Location */}
                <div className="md:col-span-2">
                  <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700">
                    Work Location
                  </label>
                  <input
                    {...register('workLocation')}
                    type="text"
                    id="workLocation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter work location"
                  />
                  {errors.workLocation && (
                    <p className="mt-1 text-sm text-red-600">{errors.workLocation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Bank Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Name */}
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <input
                    {...register('bankName')}
                    type="text"
                    id="bankName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    {...register('accountNumber')}
                    type="text"
                    id="accountNumber"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
                  )}
                </div>

                {/* IFSC / Routing Number */}
                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                    IFSC / Routing Number
                  </label>
                  <input
                    {...register('ifscCode')}
                    type="text"
                    id="ifscCode"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter IFSC/routing number"
                  />
                  {errors.ifscCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.ifscCode.message}</p>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <input
                    {...register('branch')}
                    type="text"
                    id="branch"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter branch"
                  />
                  {errors.branch && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch.message}</p>
                  )}
                </div>

                {/* PAN / Tax ID */}
                <div className="md:col-span-2">
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                    PAN / Tax ID
                  </label>
                  <input
                    {...register('panNumber')}
                    type="text"
                    id="panNumber"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter PAN/Tax ID"
                  />
                  {errors.panNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Employee Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

