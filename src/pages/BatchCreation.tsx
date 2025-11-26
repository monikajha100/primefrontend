import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Stepper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { batchAPI, BatchMode, CreateBatchRequest, Candidate } from '../api/batch.api';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface BatchFormData {
  title: string;
  software: string;
  mode: BatchMode | '';
  startDate: string;
  endDate: string;
  maxCapacity: number;
  schedule: {
    days: string[];
    timeSlots: TimeSlot[];
  };
}

export const BatchCreation: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [suggestedBatchId, setSuggestedBatchId] = useState<number | null>(null);

  const form = useForm<BatchFormData>({
    initialValues: {
      title: '',
      software: '',
      mode: '',
      startDate: '',
      endDate: '',
      maxCapacity: 1,
      schedule: {
        days: [],
        timeSlots: [],
      },
    },
    validate: {
      title: (value) => (!value ? 'Title is required' : null),
      software: (value) => (!value ? 'Software is required to suggest candidates' : null),
      mode: (value) => (!value ? 'Mode is required' : null),
      startDate: (value) => (!value ? 'Start date is required' : null),
      endDate: (value) => (!value ? 'End date is required' : null),
      maxCapacity: (value) => (value < 1 ? 'Capacity must be at least 1' : null),
      'schedule.timeSlots': (value) => (!value || value.length === 0 ? 'At least one time slot is required' : null),
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: CreateBatchRequest) => batchAPI.createBatch(data),
  });

  const suggestCandidatesMutation = useMutation({
    mutationFn: (batchId: number) => batchAPI.suggestCandidates(batchId),
    onSuccess: (data) => {
      setCandidates(data.data.candidates);
      setSuggestedBatchId(data.data.batch.id);
    },
  });

  const handleNext = async () => {
    // Validate current step
    if (active === 0) {
      const titleError = form.validateField('title');
      const softwareError = form.validateField('software');
      if (titleError.hasError || softwareError.hasError || !form.values?.mode) return;
    } else if (active === 1) {
      const errors = form.validate();
      if (errors.hasErrors || !form.values?.schedule?.days || form.values.schedule.days.length === 0) return;
      if (!form.values?.schedule?.timeSlots || form.values.schedule.timeSlots.length === 0) return;
    }

    // If moving to step 3 (candidate suggestion), create batch first if not already done
    if (active === 1 && !suggestedBatchId) {
      try {
        if (!form.values) {
          console.error('Form values are undefined');
          return;
        }

        const batchData: CreateBatchRequest = {
          title: form.values.title || '',
          software: form.values.software || undefined,
          mode: (form.values.mode || '') as BatchMode,
          startDate: form.values.startDate || '',
          endDate: form.values.endDate || '',
          maxCapacity: form.values.maxCapacity || 1,
          schedule: form.values.schedule || { days: [], timeSlots: [] },
        };

        const result = await createBatchMutation.mutateAsync(batchData);
        const batchId = result.data.batch.id;
        setSuggestedBatchId(batchId);
        
        // Automatically fetch candidates
        await suggestCandidatesMutation.mutateAsync(batchId);
      } catch (error) {
        console.error('Error creating batch:', error);
        return;
      }
    }

    setActive((current) => (current < 3 ? current + 1 : current));
  };

  const handleBack = () => {
    setActive((current) => (current > 0 ? current - 1 : current));
  };

  const handleSubmit = async () => {
    // Batch is already created when moving to step 3, just navigate
    navigate('/dashboard');
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900">Create New Batch</h2>
            <p className="mt-2 text-sm text-gray-600">
              Follow the steps below to create a new batch for Prime Academy
            </p>
          </div>

          <div className="px-6 py-6">
            <Stepper
              active={active}
              onStepClick={setActive}
              breakpoint="sm"
              className="mb-8"
            >
              <Stepper.Step label="Basic Info" description="Title, software, and mode">
                <div className="space-y-6 mt-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.getInputProps('title')}
                      type="text"
                      id="title"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      placeholder="e.g., Digital Art Fundamentals - Batch 1"
                    />
                    {form.errors.title && (
                      <p className="mt-1 text-sm text-red-600">{form.errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="software" className="block text-sm font-medium text-gray-700 mb-2">
                      Software/Tools <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.getInputProps('software')}
                      type="text"
                      id="software"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      placeholder="e.g., Photoshop, Illustrator, Figma"
                    />
                    {form.errors.software && (
                      <p className="mt-1 text-sm text-red-600">{form.errors.software}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      This will be used to find students who have selected this software
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value={BatchMode.ONLINE}
                          checked={form.values?.mode === BatchMode.ONLINE}
                          onChange={(e) => form.setFieldValue('mode', e.target.value as BatchMode)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-gray-700">Online</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value={BatchMode.OFFLINE}
                          checked={form.values?.mode === BatchMode.OFFLINE}
                          onChange={(e) => form.setFieldValue('mode', e.target.value as BatchMode)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-gray-700">Offline</span>
                      </label>
                    </div>
                    {!form.values?.mode && form.touched?.mode && (
                      <p className="mt-1 text-sm text-red-600">Mode is required</p>
                    )}
                  </div>
                </div>
              </Stepper.Step>

              <Stepper.Step label="Schedule & Capacity" description="Dates, time, and capacity">
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...form.getInputProps('startDate')}
                        type="date"
                        id="startDate"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      />
                      {form.errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{form.errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...form.getInputProps('endDate')}
                        type="date"
                        id="endDate"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                      />
                      {form.errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{form.errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.getInputProps('maxCapacity')}
                      type="number"
                      id="maxCapacity"
                      min="1"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                    />
                    {form.errors.maxCapacity && (
                      <p className="mt-1 text-sm text-red-600">{form.errors.maxCapacity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <label
                          key={day}
                          className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.values?.schedule?.days?.includes(day) || false}
                            onChange={(e) => {
                              const currentDays = form.values?.schedule?.days || [];
                              const days = e.target.checked
                                ? [...currentDays, day]
                                : currentDays.filter((d) => d !== day);
                              form.setFieldValue('schedule.days', days);
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                    {(!form.values?.schedule?.days || form.values.schedule.days.length === 0) && (
                      <p className="mt-1 text-sm text-red-600">At least one day is required</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Time Slots <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSlots = form.values?.schedule?.timeSlots || [];
                          const newSlot: TimeSlot = {
                            id: `slot-${Date.now()}-${Math.random()}`,
                            startTime: '',
                            endTime: '',
                            durationMinutes: 0,
                          };
                          form.setFieldValue('schedule.timeSlots', [...currentSlots, newSlot]);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    {(!form.values?.schedule?.timeSlots || form.values.schedule.timeSlots.length === 0) ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                        No time slots added. Click "Add Time Slot" to add one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {form.values.schedule.timeSlots.map((slot, index) => {
                          // Calculate duration in minutes
                          const calculateDuration = (start: string, end: string): number => {
                            if (!start || !end) return 0;
                            const [startHours, startMinutes] = start.split(':').map(Number);
                            const [endHours, endMinutes] = end.split(':').map(Number);
                            const startTotal = startHours * 60 + startMinutes;
                            const endTotal = endHours * 60 + endMinutes;
                            return Math.max(0, endTotal - startTotal);
                          };

                          const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
                            const updatedSlots = [...(form.values?.schedule?.timeSlots || [])];
                            updatedSlots[index] = {
                              ...updatedSlots[index],
                              [field]: value,
                            };

                            // Auto-calculate duration if both times are set
                            if (field === 'startTime' && updatedSlots[index].endTime) {
                              updatedSlots[index].durationMinutes = calculateDuration(
                                value,
                                updatedSlots[index].endTime
                              );
                            } else if (field === 'endTime' && updatedSlots[index].startTime) {
                              updatedSlots[index].durationMinutes = calculateDuration(
                                updatedSlots[index].startTime,
                                value
                              );
                            }

                            form.setFieldValue('schedule.timeSlots', updatedSlots);
                          };

                          const handleDurationChange = (value: number) => {
                            const updatedSlots = [...(form.values?.schedule?.timeSlots || [])];
                            updatedSlots[index] = {
                              ...updatedSlots[index],
                              durationMinutes: Math.max(0, value),
                            };
                            form.setFieldValue('schedule.timeSlots', updatedSlots);
                          };

                          const handleRemove = () => {
                            const updatedSlots = form.values?.schedule?.timeSlots?.filter((_, i) => i !== index) || [];
                            form.setFieldValue('schedule.timeSlots', updatedSlots);
                          };

                          return (
                            <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Time Slot {index + 1}</h4>
                                {form.values?.schedule?.timeSlots && form.values.schedule.timeSlots.length > 1 && (
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
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Duration (Minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="15"
                                    value={slot.durationMinutes}
                                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2 border"
                                    placeholder="Auto-calculated"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    {slot.durationMinutes > 0
                                      ? `${Math.floor(slot.durationMinutes / 60)}h ${slot.durationMinutes % 60}m`
                                      : 'Set start & end time'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {form.errors['schedule.timeSlots'] && (
                      <p className="mt-2 text-sm text-red-600">{form.errors['schedule.timeSlots']}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Add multiple time slots for different times during the day. Duration is automatically calculated but can be manually adjusted.
                    </p>
                  </div>
                </div>
              </Stepper.Step>

              <Stepper.Step label="Candidate Suggestion" description="Review eligible students">
                <div className="space-y-6 mt-6">
                  {suggestCandidatesMutation.isPending ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <span className="ml-3 text-gray-600">Fetching eligible candidates...</span>
                    </div>
                  ) : suggestCandidatesMutation.isError ? (
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                      Error loading candidates. Please try again.
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                      No eligible candidates found. Make sure the batch has software specified and students have selected that software.
                    </div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      {suggestCandidatesMutation.data?.data.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-green-800">Available</p>
                                <p className="text-2xl font-bold text-green-900">{suggestCandidatesMutation.data.data.summary.available}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-yellow-800">Busy</p>
                                <p className="text-2xl font-bold text-yellow-900">{suggestCandidatesMutation.data.data.summary.busy}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-red-800">Fees Overdue</p>
                                <p className="text-2xl font-bold text-red-900">{suggestCandidatesMutation.data.data.summary.feesOverdue}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>{candidates.length}</strong> candidate(s) found with matching software: <strong>{suggestCandidatesMutation.data?.data.batch.software || 'N/A'}</strong>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Students</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Details
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {candidates.map((candidate) => {
                                const getStatusBadge = () => {
                                  switch (candidate.status) {
                                    case 'available':
                                      return (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center">
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          Available
                                        </span>
                                      );
                                    case 'busy':
                                      return (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                          </svg>
                                          Busy
                                        </span>
                                      );
                                    case 'fees_overdue':
                                      return (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                          </svg>
                                          Fees Overdue
                                        </span>
                                      );
                                    default:
                                      return null;
                                  }
                                };

                                return (
                                  <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {candidate.name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {candidate.email}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {candidate.phone || '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {getStatusBadge()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                      <div className="space-y-1">
                                        <p className="text-xs">{candidate.statusMessage}</p>
                                        {candidate.status === 'fees_overdue' && candidate.totalOverdueAmount > 0 && (
                                          <p className="text-xs font-semibold text-red-600">
                                            Amount: ₹{candidate.totalOverdueAmount.toFixed(2)}
                                          </p>
                                        )}
                                        {candidate.status === 'busy' && candidate.conflictingBatches && candidate.conflictingBatches.length > 0 && (
                                          <details className="text-xs">
                                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                              View {candidate.conflictingBatches.length} conflicting batch(es)
                                            </summary>
                                            <ul className="mt-1 ml-4 list-disc">
                                              {candidate.conflictingBatches.map((batch) => (
                                                <li key={batch.id} className="text-gray-600">
                                                  {batch.title}
                                                </li>
                                              ))}
                                            </ul>
                                          </details>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Stepper.Step>

              <Stepper.Completed>
                <div className="mt-6 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Batch Created Successfully!</h3>
                  {suggestCandidatesMutation.data?.data.summary && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>{candidates.length}</strong> candidate(s) found with matching software.
                      </p>
                      <div className="flex justify-center space-x-4 mt-3">
                        <span className="text-sm text-green-600">
                          ✓ {suggestCandidatesMutation.data.data.summary.available} Available
                        </span>
                        <span className="text-sm text-yellow-600">
                          ⏱ {suggestCandidatesMutation.data.data.summary.busy} Busy
                        </span>
                        <span className="text-sm text-red-600">
                          ₹ {suggestCandidatesMutation.data.data.summary.feesOverdue} Fees Overdue
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Stepper.Completed>
            </Stepper>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={active === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {active < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    createBatchMutation.isPending ||
                    suggestCandidatesMutation.isPending ||
                    (active === 0 && (!form.values?.title || !form.values?.mode)) ||
                    (active === 1 &&
                      (!form.values?.startDate ||
                        !form.values?.endDate ||
                        !form.values?.schedule?.days ||
                        form.values?.schedule?.days?.length === 0 ||
                        !form.values?.schedule?.timeSlots ||
                        form.values?.schedule?.timeSlots?.length === 0))
                  }
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {active === 1
                    ? createBatchMutation.isPending || suggestCandidatesMutation.isPending
                      ? 'Processing...'
                      : 'Next'
                    : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

