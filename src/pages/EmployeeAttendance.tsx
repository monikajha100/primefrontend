import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeAttendanceAPI, Location, PunchInRequest, PunchOutRequest, AddBreakRequest, EmployeePunch } from '../api/employeeAttendance.api';
import { useAuth } from '../context/AuthContext';
import { UserRole, userAPI, User } from '../api/user.api';

export const EmployeeAttendance: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  // Helper to get current time in local timezone for datetime-local input
  const getLocalDateTimeString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [breakForm, setBreakForm] = useState<AddBreakRequest>({
    breakType: 'lunch',
    startTime: new Date().toISOString(),
    reason: '',
  });

  const isEmployee = user?.role === UserRole.EMPLOYEE;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;

  // Fetch today's punch status
  const { data: todayPunch, isLoading: isLoadingToday } = useQuery({
    queryKey: ['todayPunch'],
    queryFn: () => employeeAttendanceAPI.getTodayPunch(),
    enabled: isEmployee,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch daily log
  const { data: dailyLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ['dailyLog'],
    queryFn: () => employeeAttendanceAPI.getDailyLog(),
    enabled: isEmployee,
  });

  // Filters for admin view
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'employee' | 'day'>('employee'); // 'employee' or 'day'

  // Fetch all employees for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => userAPI.getAllUsers({ role: UserRole.EMPLOYEE, isActive: true, page: 1, limit: 1000 }),
    enabled: isAdmin,
  });

  // Fetch all employees attendance (for admins) with filters
  const { data: allAttendance, isLoading: isLoadingAll } = useQuery({
    queryKey: ['allEmployeesAttendance', dateFrom, dateTo, selectedEmployeeId],
    queryFn: () => employeeAttendanceAPI.getAllEmployeesAttendance({
      from: dateFrom || undefined,
      to: dateTo || undefined,
      userId: selectedEmployeeId,
    }),
    enabled: isAdmin,
  });

  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Try to get address using browser's geocoding (if available)
            // Otherwise, just use coordinates
            let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            
            // Try reverse geocoding with browser API (limited support)
            try {
              // Use a free reverse geocoding service (no API key required)
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                  address = data.display_name;
                }
              }
            } catch (error) {
              // If reverse geocoding fails, use coordinates
              console.log('Reverse geocoding not available, using coordinates');
            }

            setLocation({
              latitude,
              longitude,
              address,
            });
          } catch (error) {
            // If reverse geocoding fails, still save coordinates
            setLocation({
              latitude,
              longitude,
              address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            });
          }
        },
        (error) => {
          setLocationError('Unable to fetch location. Please enable location services.');
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Open camera
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Close camera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhoto(null);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        closeCamera();
      }
    }
  };

  // Simulate fingerprint scan (in production, this would use a fingerprint scanner API)
  const scanFingerprint = async () => {
    setIsCapturing(true);
    // Simulate fingerprint scan delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate a mock fingerprint hash
    const mockFingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setFingerprintData(mockFingerprint);
    setIsCapturing(false);
    
    alert('Fingerprint scanned successfully!');
  };

  // Punch In mutation
  const punchInMutation = useMutation({
    mutationFn: (data: PunchInRequest) => employeeAttendanceAPI.punchIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPunch'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
      setCapturedPhoto(null);
      setFingerprintData(null);
      alert('Punched in successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to punch in');
    },
  });

  // Punch Out mutation
  const punchOutMutation = useMutation({
    mutationFn: (data: PunchOutRequest) => employeeAttendanceAPI.punchOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPunch'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
      setCapturedPhoto(null);
      setFingerprintData(null);
      alert('Punched out successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to punch out');
    },
  });

  // Add break mutation
  const addBreakMutation = useMutation({
    mutationFn: (data: AddBreakRequest) => employeeAttendanceAPI.addBreak(data),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['todayPunch'] });
      await queryClient.refetchQueries({ queryKey: ['todayPunch'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
      setShowBreakModal(false);
      setBreakForm({
        breakType: 'lunch',
        startTime: new Date().toISOString(),
        reason: '',
      });
      // Don't show alert, let the UI update naturally
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add break');
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: (breakId: string) => employeeAttendanceAPI.endBreak(breakId),
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['todayPunch'] });
      await queryClient.refetchQueries({ queryKey: ['todayPunch'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
      // Don't show alert, let the UI update naturally
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Failed to end break';
      const debugInfo = error.response?.data?.debug;
      if (debugInfo) {
        console.error('Break not found debug info:', debugInfo);
      }
      alert(errorMsg);
    },
  });

  const handlePunchIn = async () => {
    // All fields are now optional - proceed even without photo/location/fingerprint
    const data: PunchInRequest = {
      photo: capturedPhoto || undefined,
      fingerprint: fingerprintData || undefined,
      location: location || undefined,
    };

    punchInMutation.mutate(data);
  };

  const handlePunchOut = async () => {
    // All fields are now optional - proceed even without photo/location/fingerprint
    const data: PunchOutRequest = {
      photo: capturedPhoto || undefined,
      fingerprint: fingerprintData || undefined,
      location: location || undefined,
    };

    punchOutMutation.mutate(data);
  };

  const handleAddBreak = () => {
    if (!breakForm.reason.trim()) {
      alert('Please provide a reason for the break');
      return;
    }
    
    // Ensure startTime is set (use current time if not set)
    const breakData: AddBreakRequest = {
      ...breakForm,
      startTime: breakForm.startTime || new Date().toISOString(),
    };
    
    addBreakMutation.mutate(breakData);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateWorkingHours = (punch: EmployeePunch) => {
    if (!punch.punchInAt || !punch.punchOutAt) return 'N/A';
    
    if (punch.effectiveWorkingHours != null) {
      const hours = typeof punch.effectiveWorkingHours === 'number' 
        ? punch.effectiveWorkingHours 
        : parseFloat(punch.effectiveWorkingHours || '0');
      return `${hours.toFixed(2)}h`;
    }

    const punchIn = new Date(punch.punchInAt);
    const punchOut = new Date(punch.punchOutAt);
    const diffMs = punchOut.getTime() - punchIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(2)}h`;
  };

  if (!isEmployee && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only employees and admins can access attendance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Employee Attendance</h1>

        {/* Employee View */}
        {isEmployee && (
          <div className="space-y-6">
            {/* Today's Status Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Attendance</h2>
              
              {isLoadingToday ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium mb-1">Punch In</div>
                      <div className="text-lg font-bold text-blue-900">
                        {todayPunch?.data.punch?.punchInAt ? formatTime(todayPunch.data.punch.punchInAt) : 'Not punched in'}
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium mb-1">Punch Out</div>
                      <div className="text-lg font-bold text-green-900">
                        {todayPunch?.data.punch?.punchOutAt ? formatTime(todayPunch.data.punch.punchOutAt) : 'Not punched out'}
                      </div>
                    </div>
                  </div>

                  {todayPunch?.data.punch?.effectiveWorkingHours != null && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium mb-1">Effective Working Hours</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {typeof todayPunch.data.punch.effectiveWorkingHours === 'number' 
                          ? todayPunch.data.punch.effectiveWorkingHours.toFixed(2)
                          : parseFloat(todayPunch.data.punch.effectiveWorkingHours || '0').toFixed(2)} hours
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons - Primary - Moved to Top */}
                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    {isLoadingToday && (
                      <div className="text-center py-2 text-sm text-gray-500">Loading attendance status...</div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Punch In Button - Always show unless explicitly can't punch in */}
                      {(!todayPunch || todayPunch?.data?.canPunchIn !== false) && (
                        <button
                          onClick={handlePunchIn}
                          disabled={punchInMutation.isPending || (todayPunch?.data?.canPunchIn === false)}
                          className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                          {punchInMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Punching In...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Punch In Now
                            </>
                          )}
                        </button>
                      )}

                      {/* Punch Out Button - Show if can punch out */}
                      {todayPunch?.data?.canPunchOut && (
                        <button
                          onClick={handlePunchOut}
                          disabled={punchOutMutation.isPending}
                          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                          {punchOutMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Punching Out...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Punch Out Now
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 You can punch in/out without photo or fingerprint. Optional features are available below.
                    </p>
                    
                    {todayPunch?.data.punch?.punchInAt && !todayPunch.data.punch.punchOutAt && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowBreakModal(true)}
                          className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Add Break
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Location Status */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location (Optional)</h3>
                    <p className="text-sm text-gray-500 mb-3">Location tracking is optional but helps verify attendance location.</p>
                    {location ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm text-gray-600">📍 Location: {location.address || `${location.latitude}, ${location.longitude}`}</div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm text-yellow-700">
                          {locationError || 'Location not available. You can still punch in/out without location.'}
                        </div>
                        <button
                          onClick={() => {
                            setLocationError(null);
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  const { latitude, longitude } = position.coords;
                                  try {
                                    let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
                                    try {
                                      const response = await fetch(
                                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                                      );
                                      if (response.ok) {
                                        const data = await response.json();
                                        if (data.display_name) {
                                          address = data.display_name;
                                        }
                                      }
                                    } catch (error) {
                                      console.log('Reverse geocoding not available');
                                    }
                                    setLocation({ latitude, longitude, address });
                                  } catch (error) {
                                    setLocation({ latitude, longitude, address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` });
                                  }
                                },
                                (error) => {
                                  setLocationError('Unable to fetch location. You can still proceed without location.');
                                },
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                              );
                            }
                          }}
                          className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Optional Features Section */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Optional Verification Features</h3>
                    <p className="text-sm text-gray-500 mb-4">These features are optional but help enhance security and verification.</p>
                    
                    {/* Photo Capture Section */}
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">📷 Photo Capture (Optional)</h4>
                      <p className="text-xs text-gray-500 mb-3">Capture a photo for attendance verification.</p>
                    
                    {!isCameraOpen && !capturedPhoto && (
                      <button
                        onClick={openCamera}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Open Camera
                      </button>
                    )}

                    {isCameraOpen && (
                      <div className="space-y-3">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-md mx-auto"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={capturePhoto}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Capture Photo
                          </button>
                          <button
                            onClick={closeCamera}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {capturedPhoto && (
                      <div className="mt-3">
                        <img src={capturedPhoto} alt="Captured" className="w-full max-w-md rounded-lg border border-gray-200" />
                        <button
                          onClick={() => {
                            setCapturedPhoto(null);
                            openCamera();
                          }}
                          className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Retake
                        </button>
                      </div>
                    )}
                  </div>

                    {/* Fingerprint Section */}
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">👆 Fingerprint Scan (Optional)</h4>
                      <p className="text-xs text-gray-500 mb-3">Fingerprint verification for enhanced security.</p>
                    {!fingerprintData ? (
                      <button
                        onClick={scanFingerprint}
                        disabled={isCapturing}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isCapturing ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Scanning...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Scan Fingerprint
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-sm text-green-700">✓ Fingerprint scanned</span>
                        </div>
                        <button
                          onClick={() => setFingerprintData(null)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons - Primary */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {todayPunch?.data.canPunchIn && (
                        <button
                          onClick={handlePunchIn}
                          disabled={punchInMutation.isPending}
                          className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                          {punchInMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Punching In...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Punch In Now
                            </>
                          )}
                        </button>
                      )}

                      {todayPunch?.data.canPunchOut && (
                        <button
                          onClick={handlePunchOut}
                          disabled={punchOutMutation.isPending}
                          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                          {punchOutMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Punching Out...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Punch Out Now
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 You can punch in/out without photo or fingerprint. Optional features are available below.
                    </p>
                    
                    {todayPunch?.data.punch?.punchInAt && !todayPunch.data.punch.punchOutAt && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowBreakModal(true)}
                          className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Add Break
                        </button>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Today's Breaks */}
                  {todayPunch?.data.punch?.breaks && Array.isArray(todayPunch.data.punch.breaks) && todayPunch.data.punch.breaks.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Breaks</h3>
                      <div className="space-y-2">
                        {(Array.isArray(todayPunch.data.punch.breaks) ? todayPunch.data.punch.breaks : []).map((breakItem: any, index: number) => {
                          // Ensure break has an ID - use index as fallback
                          const breakId = breakItem.id || breakItem._id || `break-${index}`;
                          return (
                            <div key={breakId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{breakItem.breakType || 'Break'}</div>
                                <div className="text-sm text-gray-600">{breakItem.reason || 'No reason provided'}</div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                                </div>
                              </div>
                              {!breakItem.endTime && breakId && (
                                <button
                                  onClick={() => {
                                    if (breakId) {
                                      endBreakMutation.mutate(String(breakId));
                                    } else {
                                      alert('Break ID is missing. Please refresh the page.');
                                    }
                                  }}
                                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                  End Break
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Log */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Log</h2>
              {isLoadingLog ? (
                <div className="text-center py-8">Loading...</div>
              ) : dailyLog?.data.punches && dailyLog.data.punches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch In</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch Out</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breaks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyLog.data.punches.map((punch: EmployeePunch) => (
                        <tr key={punch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(punch.date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTime(punch.punchInAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTime(punch.punchOutAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{punch.breaks?.length || 0}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{calculateWorkingHours(punch)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {punch.punchInPhoto && (
                              <img src={punch.punchInPhoto} alt="Punch in" className="w-12 h-12 rounded object-cover" />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {punch.punchInLocation?.address || (punch.punchInLocation ? `${punch.punchInLocation.latitude}, ${punch.punchInLocation.longitude}` : 'N/A')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">No attendance records found.</div>
              )}
            </div>
          </div>
        )}

        {/* Admin View - All Employees */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Header with Filters */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">All Employees Attendance</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-100 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-100 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-100 mb-1">Employee</label>
                  <select
                    value={selectedEmployeeId || ''}
                    onChange={(e) => setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">All Employees</option>
                    {employeesData?.data?.users?.map((emp: User) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-100 mb-1">View Mode</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('employee')}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'employee' 
                          ? 'bg-white text-orange-600' 
                          : 'bg-orange-400 text-white hover:bg-orange-300'
                      }`}
                    >
                      By Employee
                    </button>
                    <button
                      onClick={() => setViewMode('day')}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'day' 
                          ? 'bg-white text-orange-600' 
                          : 'bg-orange-400 text-white hover:bg-orange-300'
                      }`}
                    >
                      By Day
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {allAttendance?.data.punches && allAttendance.data.punches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Records</div>
                  <div className="text-2xl font-bold text-blue-900">{allAttendance.data.punches.length}</div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Unique Employees</div>
                  <div className="text-2xl font-bold text-green-900">
                    {new Set(allAttendance.data.punches.map((p: EmployeePunch) => p.user?.id)).size}
                  </div>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Total Working Hours</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {allAttendance.data.punches.reduce((sum: number, p: EmployeePunch) => {
                      const hours = typeof p.effectiveWorkingHours === 'number' 
                        ? p.effectiveWorkingHours 
                        : parseFloat(p.effectiveWorkingHours || '0');
                      return sum + hours;
                    }, 0).toFixed(1)}h
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium">Days Covered</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {new Set(allAttendance.data.punches.map((p: EmployeePunch) => p.date)).size}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            {isLoadingAll ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="mt-4 text-gray-600">Loading attendance data...</p>
              </div>
            ) : allAttendance?.data.punches && allAttendance.data.punches.length > 0 ? (
              viewMode === 'employee' ? (
                // Employee-wise View
                <div className="space-y-4">
                  {Object.entries(
                    allAttendance.data.punches.reduce((acc: Record<number, EmployeePunch[]>, punch: EmployeePunch) => {
                      const userId = punch.user?.id;
                      if (userId) {
                        if (!acc[userId]) acc[userId] = [];
                        acc[userId].push(punch);
                      }
                      return acc;
                    }, {})
                  ).map(([userId, punches]: [string, EmployeePunch[]]) => {
                    const employee = punches[0]?.user;
                    const totalHours = punches.reduce((sum: number, p: EmployeePunch) => {
                      const hours = typeof p.effectiveWorkingHours === 'number' 
                        ? p.effectiveWorkingHours 
                        : parseFloat(p.effectiveWorkingHours || '0');
                      return sum + hours;
                    }, 0);
                    
                    return (
                      <div key={userId} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold">{employee?.name}</h3>
                              <p className="text-blue-100 text-sm">{employee?.email}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-blue-100">Total Days</div>
                              <div className="text-2xl font-bold">{punches.length}</div>
                              <div className="text-sm text-blue-100 mt-1">Total Hours: {totalHours.toFixed(1)}h</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch In</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch Out</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breaks</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {punches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((punch: EmployeePunch) => (
                                  <tr key={punch.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(punch.date)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatTime(punch.punchInAt)}
                                      {punch.punchInPhoto && (
                                        <img src={punch.punchInPhoto} alt="Punch in" className="w-8 h-8 rounded mt-1 object-cover" />
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatTime(punch.punchOutAt)}
                                      {punch.punchOutPhoto && (
                                        <img src={punch.punchOutPhoto} alt="Punch out" className="w-8 h-8 rounded mt-1 object-cover" />
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {Array.isArray(punch.breaks) ? punch.breaks.length : 0} break(s)
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{calculateWorkingHours(punch)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                      {punch.punchInLocation?.address || (punch.punchInLocation ? `${punch.punchInLocation.latitude?.toFixed(4)}, ${punch.punchInLocation.longitude?.toFixed(4)}` : 'N/A')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Day-wise View
                <div className="space-y-4">
                  {Object.entries(
                    allAttendance.data.punches.reduce((acc: Record<string, EmployeePunch[]>, punch: EmployeePunch) => {
                      const date = punch.date;
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(punch);
                      return acc;
                    }, {})
                  ).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()).map(([date, punches]: [string, EmployeePunch[]]) => {
                    const totalHours = punches.reduce((sum: number, p: EmployeePunch) => {
                      const hours = typeof p.effectiveWorkingHours === 'number' 
                        ? p.effectiveWorkingHours 
                        : parseFloat(p.effectiveWorkingHours || '0');
                      return sum + hours;
                    }, 0);
                    
                    return (
                      <div key={date} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold">{formatDate(date)}</h3>
                              <p className="text-green-100 text-sm">{new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-green-100">Employees Present</div>
                              <div className="text-2xl font-bold">{punches.length}</div>
                              <div className="text-sm text-green-100 mt-1">Total Hours: {totalHours.toFixed(1)}h</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch In</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punch Out</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breaks</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {punches.map((punch: EmployeePunch) => (
                                  <tr key={punch.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{punch.user?.name}</div>
                                      <div className="text-sm text-gray-500">{punch.user?.email}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatTime(punch.punchInAt)}
                                      {punch.punchInPhoto && (
                                        <img src={punch.punchInPhoto} alt="Punch in" className="w-8 h-8 rounded mt-1 object-cover" />
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatTime(punch.punchOutAt)}
                                      {punch.punchOutPhoto && (
                                        <img src={punch.punchOutPhoto} alt="Punch out" className="w-8 h-8 rounded mt-1 object-cover" />
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {Array.isArray(punch.breaks) ? punch.breaks.length : 0} break(s)
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{calculateWorkingHours(punch)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                      {punch.punchInLocation?.address || (punch.punchInLocation ? `${punch.punchInLocation.latitude?.toFixed(4)}, ${punch.punchInLocation.longitude?.toFixed(4)}` : 'N/A')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No attendance records found</h3>
                <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or date range.</p>
              </div>
            )}
          </div>
        )}

        {/* Break Modal */}
        {showBreakModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Break</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Type</label>
                  <select
                    value={breakForm.breakType}
                    onChange={(e) => setBreakForm({ ...breakForm, breakType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="lunch">Lunch</option>
                    <option value="tea">Tea</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={breakForm.startTime ? getLocalDateTimeString(new Date(breakForm.startTime)) : getLocalDateTimeString()}
                    onChange={(e) => {
                      // Convert local datetime to ISO string
                      const localDate = new Date(e.target.value);
                      setBreakForm({ ...breakForm, startTime: localDate.toISOString() });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current time will be used if not specified</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
                  <textarea
                    value={breakForm.reason}
                    onChange={(e) => setBreakForm({ ...breakForm, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Enter reason for break"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowBreakModal(false);
                    setBreakForm({
                      breakType: 'lunch',
                      startTime: new Date().toISOString(),
                      reason: '',
                    });
                  }}
                  disabled={addBreakMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBreak}
                  disabled={addBreakMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {addBreakMutation.isPending ? 'Adding...' : 'Add Break'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

