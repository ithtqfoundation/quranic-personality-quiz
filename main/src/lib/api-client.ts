// API Client Helper
// Provides convenient methods for making API requests

import { API_ROUTES } from './constants';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  GetQuestionsResponse,
  SubmitQuizRequest,
  SubmitQuizResponse,
  GetResultsResponse,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UploadPhotoResponse,
  DeletePhotoResponse,
  HealthCheckResponse,
  ApiError,
} from '@/types/api';

// ============================================
// BASE API CLIENT
// ============================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file (multipart/form-data)
  async upload<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    options?: RequestInit
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      credentials: 'include',
      // Don't set Content-Type header, let browser set it with boundary
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Upload failed',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// ============================================
// API SERVICE METHODS
// ============================================

export class ApiService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  // ========== AUTH ==========

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.client.post<RegisterResponse>(API_ROUTES.AUTH_REGISTER, data);
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.client.post<LoginResponse>(API_ROUTES.AUTH_LOGIN, data);
  }

  async logout(): Promise<LogoutResponse> {
    return this.client.post<LogoutResponse>(API_ROUTES.AUTH_LOGOUT);
  }

  // ========== QUIZ ==========

  async getQuestions(): Promise<GetQuestionsResponse> {
    return this.client.get<GetQuestionsResponse>(API_ROUTES.QUIZ_QUESTIONS);
  }

  async submitQuiz(data: SubmitQuizRequest): Promise<SubmitQuizResponse> {
    return this.client.post<SubmitQuizResponse>(API_ROUTES.QUIZ_SUBMIT, data);
  }

  async getResults(resultId: string): Promise<GetResultsResponse> {
    return this.client.get<GetResultsResponse>(
      `${API_ROUTES.QUIZ_RESULTS}?id=${resultId}`
    );
  }

  // ========== USER ==========

  async getProfile(): Promise<GetProfileResponse> {
    return this.client.get<GetProfileResponse>(API_ROUTES.USER_PROFILE);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return this.client.put<UpdateProfileResponse>(API_ROUTES.USER_UPDATE, data);
  }

  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    return this.client.upload<UploadPhotoResponse>(
      API_ROUTES.USER_UPLOAD_PHOTO,
      file,
      'photo'
    );
  }

  async deletePhoto(): Promise<DeletePhotoResponse> {
    return this.client.delete<DeletePhotoResponse>(
      API_ROUTES.USER_UPLOAD_PHOTO
    );
  }

  // ========== HEALTH ==========

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.client.get<HealthCheckResponse>(API_ROUTES.HEALTH);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const api = new ApiService();

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export default api;
