import api from './axios';

export interface Enrollment {
  id: number;
  studentId: number;
  batchId: number;
  enrollmentDate: string;
  status?: string;
  student?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface EnrollmentsResponse {
  status: string;
  data: Enrollment[];
}

export const enrollmentAPI = {
  getBatchEnrollments: async (batchId: number): Promise<EnrollmentsResponse> => {
    const response = await api.get<EnrollmentsResponse>(`/batches/${batchId}/enrollments`);
    return response.data;
  },
};


