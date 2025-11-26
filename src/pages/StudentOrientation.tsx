import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { studentAPI, OrientationAcknowledgmentData } from '../api/student.api';

const schema = yup.object().shape({
  studentName: yup.string().required('Student name is required'),
  course: yup.string().required('Course is required'),
  specialCommitment: yup.string().nullable(),
  specialBatchTiming: yup.string().nullable(),
  unableToPracticeReason: yup.string().nullable(),
  paymentExemption: yup.string().nullable(),
  confirmed: yup.boolean().oneOf([true], 'You must confirm to proceed'),
});

interface OrientationFormData {
  studentName: string;
  course: string;
  specialCommitment?: string;
  specialBatchTiming?: string;
  unableToPracticeReason?: string;
  paymentExemption?: string;
  confirmed: boolean;
}

export const StudentOrientation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Get student data from location state (passed from enrollment)
  const studentData = location.state?.studentData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrientationFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      studentName: studentData?.name || '',
      course: studentData?.course || '',
      confirmed: false,
    },
  });

  const confirmed = watch('confirmed');

  const onSubmit = async (data: OrientationFormData) => {
    setError('');
    setLoading(true);

    try {
      if (!studentData?.id) {
        setError('Student ID is missing. Please complete enrollment first.');
        return;
      }

      // Save orientation acknowledgment
      const orientationData: OrientationAcknowledgmentData = {
        studentId: studentData.id,
        studentName: data.studentName,
        course: data.course,
        specialCommitment: data.specialCommitment || undefined,
        specialBatchTiming: data.specialBatchTiming || undefined,
        unableToPracticeReason: data.unableToPracticeReason || undefined,
        paymentExemption: data.paymentExemption || undefined,
        confirmed: data.confirmed,
      };

      await studentAPI.acknowledgeOrientation(orientationData);

      // Navigate to login
      alert('Orientation acknowledged successfully! Please login to continue.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save orientation acknowledgment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPage1 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-300 pb-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">SINCE 2013</div>
          <div className="text-3xl font-bold">PRIME</div>
          <div className="text-lg font-semibold border-2 border-gray-800 px-2 py-1 inline-block">ACADEMY</div>
          <div className="text-sm text-gray-600 mt-1">Digital Art With Excellence</div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold underline">Student Orientation</h1>
        </div>
      </div>

      {/* Coaching & Practice */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Coaching & Practice</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>3 days classroom coaching and 3 days lab practice is mandatory for every student</li>
          <li>The batch timing may change with new software</li>
          <li>
            If you have given commitment for special batch timing, plz do mention here
            <div className="mt-2">
              <input
                {...register('specialBatchTiming')}
                type="text"
                className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
                placeholder="Enter special batch timing commitment"
              />
            </div>
          </li>
          <li>
            The software practice is necessary in lab to complete assignments, for any reason if you are unable to come for practice at lab then mention here
            <div className="mt-2">
              <input
                {...register('unableToPracticeReason')}
                type="text"
                className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
                placeholder="Enter reason if unable to practice at lab"
              />
            </div>
          </li>
          <li>
            For any course, the ratio for coaching and practice is 1:2, it means every classroom lecture you will have to make 2 hours minimum practice and hence minimum 25 hours practice is compulsory at lab. For the best career monthly 50 hours practice is highly recommended.
          </li>
          <li>
            Student may bring their own laptop is desirable and if he/she couldn't arrange laptop then he/she may book the practice slot accordingly. Practice lab is open 9:00 am to 7:00 pm from Monday to Saturday. Faculty will guide during practice as per their availability
          </li>
        </ol>
      </div>

      {/* Portfolio & Placement */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Portfolio & Placement</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm" start={7}>
          <li>
            During the study of software, the faculty will guide for portfolio (assignments) and such assignment will have to get approved by faculty at end of each software.
          </li>
          <li>
            The placement call will sole depend on the portfolio work and practice hours. The student without approved portfolio is not eligible for placement
          </li>
        </ol>
      </div>

      {/* Fees payment & monthly EMIs */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Fees payment & monthly EMIs</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm" start={9}>
          <li>
            The student who enrolled on EMI payment term has to deposits all PDCs (postdated cheques) and such cheques will be deposited in bank latest by 10th of every month OR he has to pay monthly EMI between 1st to 10th day of every month. Any payment after 10th day will be liable to late payment charges Rs. 50/- per day. Student will get GST paid receipt from A/C dept between 15th to 20th day of every month. If any student get any exemption in payment date, plz mention here
            <div className="mt-2">
              <input
                {...register('paymentExemption')}
                type="text"
                className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
                placeholder="Enter payment exemption details"
              />
            </div>
            All fees payment are including GST and non-refundable
          </li>
          <li>
            Each course and its payment is non-transferable. No course can be down-graded in value or duration but it can be up-graded to bigger course value/duration. Any up gradation is subject to approval and for that student needs to pay difference amount in advance
          </li>
          <li>
            The course progress will sole depend on the grasping ability of student, leaves, absenteeism and circumstances and it is no way related to payment made for the course. The payment made is no way connected and co-related with the course completion which please be noted
          </li>
          <li>Cheques bounce charges Rs. 350/-</li>
          <li>
            After the completion of 6 month only, if any student is not able to pay fees for any month then he has to pay Rs. 1200/- as penalty and it is not part of total payment. Student can be considered as dropped out in system in case of fail to payment and study will be paused till clearance of all due with activation charge
          </li>
          <li>Student will have to pay their monthly EMI during the long leave for whatever reason.</li>
        </ol>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-center">
        <p>601 Gala Empire, Opp. Doordarshan metro station, Drive-In Road, Ahmedabad 380052. Helpdesk. 9033222499 | 9825308959</p>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-300 pb-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">SINCE 2013</div>
          <div className="text-3xl font-bold">PRIME</div>
          <div className="text-lg font-semibold border-2 border-gray-800 px-2 py-1 inline-block">ACADEMY</div>
          <div className="text-sm text-gray-600 mt-1">Digital Art With Excellence</div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold underline">Student Orientation</h1>
        </div>
      </div>

      {/* Technical Help */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Technical Help</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm" start={15}>
          <li>
            Student will get backup for the lectures/study he/she missed during the approved leaves and there is no backup for leave without approval.
          </li>
          <li>
            If any student face any difficulty in understanding of any software then on special recommendation of faculty the entire software will get repeated without any extra cost
          </li>
          <li>
            Once you enrolled with us you are our lifetime member and as privilege you may visit us for any technical assistance or job placement in future and all such services are FREE FOREVER
          </li>
        </ol>
      </div>

      {/* Special Commitment */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">If you have given any special commitment by counselor then do mention here/ or leave blank</p>
        <div className="space-y-2">
          <input
            {...register('specialCommitment')}
            type="text"
            className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
            placeholder="Enter special commitment (optional)"
          />
          <input
            type="text"
            className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
          />
          <input
            type="text"
            className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
          />
        </div>
      </div>

      {/* Student Information */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Student Name:</label>
            <input
              {...register('studentName')}
              type="text"
              className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
            />
            {errors.studentName && (
              <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
            )}
          </div>
          <div className="flex-1 ml-4">
            <label className="block text-sm font-medium mb-1 text-right">Course</label>
            <input
              {...register('course')}
              type="text"
              className="w-full border-b-2 border-gray-400 focus:outline-none focus:border-orange-500 px-2"
            />
            {errors.course && (
              <p className="mt-1 text-sm text-red-600">{errors.course.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Statement */}
      <div className="mt-6">
        <p className="text-sm mb-4">
          I, hereby confirm that I got detailed understanding for all above rule & regulation of institute and I assure to follow the same.
        </p>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            {...register('confirmed')}
            type="checkbox"
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="text-sm">I confirm and agree to all terms and conditions</span>
        </label>
        {errors.confirmed && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmed.message}</p>
        )}
      </div>

      {/* Signature */}
      <div className="mt-8">
        <div className="border-t-2 border-dashed border-gray-400 pt-2">
          <p className="text-sm">Student Sign / Date</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-center">
        <p>601 Gala Empire, Opp. Doordarshan metro station, Drive-In Road, Ahmedabad 380052. Helpdesk. 9033222499 | 9825308959</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white shadow-lg rounded-lg p-8">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Page Content */}
            {currentPage === 1 ? renderPage1() : renderPage2()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (currentPage === 1) {
                    navigate('/enrollment');
                  } else {
                    setCurrentPage(1);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {currentPage === 1 ? 'Back to Enrollment' : 'Previous Page'}
              </button>

              {currentPage === 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                >
                  Next Page
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !confirmed}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

