import api from './axios';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PunchInRequest {
  photo?: string;
  fingerprint?: string;
  location?: Location;
}

export interface PunchOutRequest {
  photo?: string;
  fingerprint?: string;
  location?: Location;
}

export interface AddBreakRequest {
  breakType: string;
  startTime: string;
  endTime?: string;
  reason: string;
}

export interface EmployeePunch {
  id: number;
  date: string;
  punchInAt: string | null;
  punchOutAt: string | null;
  punchInPhoto: string | null;
  punchOutPhoto: string | null;
  punchInFingerprint: string | null;
  punchOutFingerprint: string | null;
  punchInLocation: Location | null;
  punchOutLocation: Location | null;
  breaks: Array<{
    id: string;
    breakType: string;
    startTime: string;
    endTime: string | null;
    reason: string;
    createdAt: string;
  }>;
  effectiveWorkingHours: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TodayPunchResponse {
  status: string;
  data: {
    punch: EmployeePunch | null;
    canPunchIn: boolean;
    canPunchOut: boolean;
  };
}

export interface DailyLogResponse {
  status: string;
  data: {
    punches: EmployeePunch[];
    total: number;
  };
}

export const employeeAttendanceAPI = {
  punchIn: async (data: PunchInRequest): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post('/employee-attendance/punch-in', data);
    return response.data;
  },

  punchOut: async (data: PunchOutRequest): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post('/employee-attendance/punch-out', data);
    return response.data;
  },

  getTodayPunch: async (): Promise<TodayPunchResponse> => {
    const response = await api.get('/employee-attendance/today');
    return response.data;
  },

  getDailyLog: async (params?: { from?: string; to?: string; userId?: number }): Promise<DailyLogResponse> => {
    const response = await api.get('/employee-attendance/daily-log', { params });
    return response.data;
  },

  addBreak: async (data: AddBreakRequest): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post('/employee-attendance/break', data);
    return response.data;
  },

  endBreak: async (breakId: string): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post(`/employee-attendance/break/${breakId}/end`);
    return response.data;
  },

  getAllEmployeesAttendance: async (params?: { from?: string; to?: string; userId?: number }): Promise<DailyLogResponse> => {
    const response = await api.get('/employee-attendance/all', { params });
    return response.data;
  },
};




