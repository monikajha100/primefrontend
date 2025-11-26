import api from './axios';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'faculty' | 'student' | 'employee';
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface ImpersonateResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
    originalUser: {
      id: number;
      email: string;
      role: string;
      name: string;
      phone: string | null;
      avatarUrl: string | null;
      isActive: boolean;
    };
    originalToken: string; // Token to restore original user session
  };
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role: string,
    phone?: string
  ): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', {
      name,
      email,
      password,
      role,
      phone,
    });
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },

  impersonateUser: async (userId: number): Promise<ImpersonateResponse> => {
    const response = await api.post<ImpersonateResponse>(`/auth/impersonate/${userId}`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('originalUser');
    localStorage.removeItem('originalSession');
  },
};


