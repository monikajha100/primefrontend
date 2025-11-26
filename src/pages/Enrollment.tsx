import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { studentAPI, StudentEnrollmentData } from '../api/student.api';
import { Layout } from '../components/Layout';

// Software options
const SOFTWARE_OPTIONS = [
  'Photoshop',
  'Illustrator',
  'InDesign',
  'Corel',
  'Figma',
  'Xd',
  'Animate CC',
  'Premiere',
  'Audition',
  'After Effects',
  'HTML',
  'Java',
  'Dreamweaver',
  'CSS',
  'Arnold Max',
  'Vray',
  '3ds Max',
  'Fusion',
  'Real Flow',
  'Fume FX',
  'Nuke',
  'Thinking Particles',
  'Ray Fire',
  'Mocha',
  'Silhouette',
  'PFTrack',
  'VUE',
  'Houdini',
  'Final Cut Pro',
  'Maya',
  'CAD',
  'Unity',
  'Mudbox',
  'Unity Game Design',
  'ZBrush',
  'Lumion',
  'SketchUp',
  'Unreal',
  'Blender Pro',
  'Cinema 4D',
  'Substance Painter',
  '3D Equalizer',
  'Photography',
  'AutoCAD',
  'WordPress',
  'Vuforia SDK',
  'DaVinci Resolve',
];

// Complimentary Software Options
const COMPLIMENTARY_SOFTWARE_OPTIONS = [
  'None',
  'Adobe Creative Cloud',
  'Autodesk Suite',
  'Unity Pro',
  'Unreal Engine',
  'Blender',
  'Other',
];

// Lead Source Options
const LEAD_SOURCE_OPTIONS = [
  'Walk-in',
  'Website',
  'Social Media',
  'Referral',
  'Advertisement',
  'Phone Call',
  'Email',
  'Other',
];

interface EnrollmentFormData {
  studentName: string;
  dateOfAdmission: string;
  contactNumber: string;
  whatsappNumber: string;
  localAddress: string;
  permanentAddress: string;
  emergencyContactNumber: string;
  emergencyName: string;
  emergencyRelation: string;
  courseName: string;
  totalDeal: number;
  bookingAmount: number;
  balanceAmount: number;
  emiPlan: boolean;
  emiPlanDate?: string;
  softwaresIncluded: string[];
  complimentarySoftware: string;
  complimentaryGift: string;
  hasReference: boolean;
  referenceDetails?: string;
  counselorName: string;
  leadSource: string;
  walkinDate: string;
  masterFaculty: string;
  photograph: FileList | null;
  aadharCard: FileList | null;
  educationMarksheet: FileList | null;
  email: string;
}

const schema = yup.object().shape({
  studentName: yup.string().required('Student Name is required').min(2, 'Name must be at least 2 characters'),
  dateOfAdmission: yup.date().required('Date of Admission is required').typeError('Invalid date format'),
  contactNumber: yup.string().required('Contact Number is required'),
  whatsappNumber: yup.string().required('WhatsApp Number is required'),
  localAddress: yup.string().required('Local Address is required'),
  permanentAddress: yup.string().required('Permanent Address is required'),
  emergencyContactNumber: yup.string().required('Emergency Contact Number is required'),
  emergencyName: yup.string().required('Emergency Name is required'),
  emergencyRelation: yup.string().required('Emergency Relation is required'),
  courseName: yup.string().required('Course Name is required'),
  totalDeal: yup.number().required('Total Deal is required').min(0, 'Total Deal must be positive'),
  bookingAmount: yup.number().required('Booking Amount is required').min(0, 'Booking Amount must be positive'),
  balanceAmount: yup.number().required('Balance Amount is required').min(0, 'Balance Amount must be positive'),
  emiPlan: yup.boolean(),
  emiPlanDate: yup.string().when('emiPlan', {
    is: true,
    then: (schema) => schema.required('EMI Plan Date is required when EMI Plan is selected'),
    otherwise: (schema) => schema.nullable(),
  }),
  softwaresIncluded: yup.array().of(yup.string()).min(1, 'Please select at least one software'),
  complimentarySoftware: yup.string().required('Complimentary Software selection is required'),
  complimentaryGift: yup.string().nullable(),
  hasReference: yup.boolean(),
  referenceDetails: yup.string().nullable(),
  counselorName: yup.string().required('Counselor Name is required'),
  leadSource: yup.string().required('Lead Source is required'),
  walkinDate: yup.date().required('Walk-in Date is required').typeError('Invalid date format'),
  masterFaculty: yup.string().required('Master Faculty is required'),
  photograph: yup.mixed().nullable(),
  aadharCard: yup.mixed().nullable(),
  educationMarksheet: yup.mixed().nullable(),
  email: yup.string().required('Email is required').email('Invalid email address'),
});

export const Enrollment: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documentPreviews, setDocumentPreviews] = useState<{ aadhar: string | null; marksheet: string | null }>({
    aadhar: null,
    marksheet: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EnrollmentFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      softwaresIncluded: [],
      emiPlan: false,
      hasReference: false,
      complimentarySoftware: 'None',
    },
  });

  const selectedSoftware = watch('softwaresIncluded') || [];
  const emiPlan = watch('emiPlan');
  const hasReference = watch('hasReference');
  const totalDeal = watch('totalDeal') || 0;
  const bookingAmount = watch('bookingAmount') || 0;

  // Calculate balance amount automatically
  React.useEffect(() => {
    const balance = totalDeal - bookingAmount;
    if (balance >= 0) {
      setValue('balanceAmount', balance);
    }
  }, [totalDeal, bookingAmount, setValue]);

  const handleSoftwareToggle = (software: string) => {
    const current = selectedSoftware || [];
    if (current.includes(software)) {
      setValue('softwaresIncluded', current.filter((s) => s !== software));
    } else {
      setValue('softwaresIncluded', [...current, software]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (type: 'aadhar' | 'marksheet', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
        setDocumentPreviews((prev) => ({ ...prev, [type]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setError('');
    setLoading(true);

    try {
      // Prepare enrollment data
      const enrollmentData: StudentEnrollmentData = {
        name: data.studentName,
        email: data.email,
        phone: data.contactNumber,
        address: `${data.localAddress} | Permanent: ${data.permanentAddress}`,
        dob: data.dateOfAdmission,
        softwareList: data.softwaresIncluded,
      };

      // Handle photo upload
      if (data.photograph && data.photograph[0]) {
        enrollmentData.photoUrl = URL.createObjectURL(data.photograph[0]);
      }

      // Handle documents
        const documentData: Record<string, any> = {};
      if (data.aadharCard && data.aadharCard[0]) {
        documentData['aadharCard'] = {
          name: data.aadharCard[0].name,
          type: data.aadharCard[0].type,
          size: data.aadharCard[0].size,
          url: URL.createObjectURL(data.aadharCard[0]),
        };
      }
      if (data.educationMarksheet && data.educationMarksheet[0]) {
        documentData['educationMarksheet'] = {
          name: data.educationMarksheet[0].name,
          type: data.educationMarksheet[0].type,
          size: data.educationMarksheet[0].size,
          url: URL.createObjectURL(data.educationMarksheet[0]),
        };
      }

      // Add additional enrollment metadata
      documentData['enrollmentMetadata'] = {
        whatsappNumber: data.whatsappNumber,
        emergencyContact: {
          number: data.emergencyContactNumber,
          name: data.emergencyName,
          relation: data.emergencyRelation,
        },
        courseName: data.courseName,
        financialDetails: {
          totalDeal: data.totalDeal,
          bookingAmount: data.bookingAmount,
          balanceAmount: data.balanceAmount,
          emiPlan: data.emiPlan,
          emiPlanDate: data.emiPlanDate,
        },
        complimentarySoftware: data.complimentarySoftware,
        complimentaryGift: data.complimentaryGift,
        reference: data.hasReference ? data.referenceDetails : null,
        counselorName: data.counselorName,
        leadSource: data.leadSource,
        walkinDate: data.walkinDate,
        masterFaculty: data.masterFaculty,
      };

      enrollmentData.documents = documentData;

      await studentAPI.createStudent(enrollmentData);

      alert('Student enrollment successful!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Student Enrollment Form</h1>
            <p className="mt-2 text-orange-100">Complete all required fields to enroll a new student</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-8">
              {/* Personal Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">👤</span>
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name <span className="text-red-500">*</span>
              </label>
              <input
                      {...register('studentName')}
                type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter full name"
              />
                    {errors.studentName && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="student@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Admission <span className="text-red-500">*</span>
              </label>
              <input
                      {...register('dateOfAdmission')}
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.dateOfAdmission && (
                      <p className="mt-1 text-sm text-red-600">{errors.dateOfAdmission.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                      {...register('contactNumber')}
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+1234567890"
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number <span className="text-red-500">*</span>
              </label>
                    <input
                      {...register('whatsappNumber')}
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+1234567890"
                    />
                    {errors.whatsappNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.whatsappNumber.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photograph <span className="text-red-500">*</span>
              </label>
              <input
                      {...register('photograph')}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                          className="h-24 w-24 object-cover rounded-lg border-2 border-gray-300"
                  />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📍</span>
                  Address Information
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('localAddress')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter local address"
                    />
                    {errors.localAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.localAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permanent Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('permanentAddress')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter permanent address"
                    />
                    {errors.permanentAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.permanentAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🚨</span>
                  Emergency Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('emergencyContactNumber')}
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+1234567890"
                    />
                    {errors.emergencyContactNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactNumber.message}</p>
              )}
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Name <span className="text-red-500">*</span>
              </label>
              <input
                      {...register('emergencyName')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Contact person name"
                    />
                    {errors.emergencyName && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relation <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('emergencyRelation')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Father, Mother, Guardian"
                    />
                    {errors.emergencyRelation && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyRelation.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Course & Financial Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💼</span>
                  Course & Financial Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('courseName')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter course name"
                    />
                    {errors.courseName && (
                      <p className="mt-1 text-sm text-red-600">{errors.courseName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Deal (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('totalDeal', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                    />
                    {errors.totalDeal && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalDeal.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('bookingAmount', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                    />
                    {errors.bookingAmount && (
                      <p className="mt-1 text-sm text-red-600">{errors.bookingAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Balance Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('balanceAmount', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Auto-calculated"
                    />
                    {errors.balanceAmount && (
                      <p className="mt-1 text-sm text-red-600">{errors.balanceAmount.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        {...register('emiPlan')}
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">EMI Plan Applicable</span>
                    </label>
                    {emiPlan && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          EMI Plan Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('emiPlanDate')}
                          type="date"
                          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        {errors.emiPlanDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.emiPlanDate.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Software Selection Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💻</span>
                  Software Selection
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Softwares Included <span className="text-red-500">*</span>
              </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                {SOFTWARE_OPTIONS.map((software) => (
                  <label
                    key={software}
                        className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSoftware.includes(software)}
                      onChange={() => handleSoftwareToggle(software)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{software}</span>
                  </label>
                ))}
              </div>
                  {errors.softwaresIncluded && (
                    <p className="mt-2 text-sm text-red-600">{errors.softwaresIncluded.message}</p>
              )}
                  <p className="mt-2 text-sm text-gray-500">
                    Selected: <span className="font-semibold text-orange-600">{selectedSoftware.length}</span> software
              </p>
            </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complimentary Software <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('complimentarySoftware')}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {COMPLIMENTARY_SOFTWARE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.complimentarySoftware && (
                    <p className="mt-1 text-sm text-red-600">{errors.complimentarySoftware.message}</p>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complimentary Gift Given
                  </label>
                  <input
                    {...register('complimentaryGift')}
                    type="text"
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter gift details (if any)"
                  />
                </div>
              </div>

              {/* Reference & Counselor Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Reference & Counselor Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 mb-3">
                      <input
                        {...register('hasReference')}
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Has Reference</span>
                    </label>
                    {hasReference && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reference Details
                        </label>
                        <textarea
                          {...register('referenceDetails')}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Enter reference details"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counselor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('counselorName')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter counselor name"
                    />
                    {errors.counselorName && (
                      <p className="mt-1 text-sm text-red-600">{errors.counselorName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('leadSource')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select lead source</option>
                      {LEAD_SOURCE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.leadSource && (
                      <p className="mt-1 text-sm text-red-600">{errors.leadSource.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Walk-in Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('walkinDate')}
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.walkinDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.walkinDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Master Faculty <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('masterFaculty')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter master faculty name"
                    />
                    {errors.masterFaculty && (
                      <p className="mt-1 text-sm text-red-600">{errors.masterFaculty.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Upload Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📄</span>
                  Documents Upload
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhar Card
                    </label>
                    <input
                      {...register('aadharCard')}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChange('aadhar', e)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {documentPreviews.aadhar && (
                      <div className="mt-2">
                        <img
                          src={documentPreviews.aadhar}
                          alt="Aadhar Preview"
                          className="h-32 w-full object-contain rounded-lg border-2 border-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education Marksheet (Optional)
                    </label>
                    <input
                      {...register('educationMarksheet')}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChange('marksheet', e)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {documentPreviews.marksheet && (
                      <div className="mt-2">
                        <img
                          src={documentPreviews.marksheet}
                          alt="Marksheet Preview"
                          className="h-32 w-full object-contain rounded-lg border-2 border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                  className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-500 border border-transparent rounded-lg hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Enrollment'
                  )}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
