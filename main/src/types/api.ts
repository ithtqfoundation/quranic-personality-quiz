// API Request/Response Types

// ============================================
// AUTH API TYPES
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    photo_url: string | null;
    bio: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface LogoutResponse {
  message: string;
}

// ============================================
// QUIZ API TYPES
// ============================================

export interface QuestionWithOptions {
  id: string;
  juz_number: number;
  question_text: string;
  dimension: string;
  order_number: number;
  options: {
    id: string;
    option_text: string;
    trait_value: string;
    order_number: number;
  }[];
}

export interface GetQuestionsResponse {
  questions: QuestionWithOptions[];
  total: number;
}

export interface SubmitQuizRequest {
  answers: Record<string, string>; // { questionId: optionId }
  anonUserId?: string; // Optional for anonymous users
}

export interface SubmitQuizResponse {
  result: {
    id: string;
    personality_type: string;
    juz_result: number;
    title: string;
    scores: Record<string, number>;
    is_anonymous?: boolean;
    personality?: {
      name: string;
      description: string;
      traits: string[];
      strengths: string[];
      weaknesses: string[];
      suitable_traits?: {
        label: string;
        items: string[];
      };
      unsuitable_traits?: {
        label: string;
        items: string[];
      };
    };
    completed_at: string;
  };
}

export interface GetResultsResponse {
  result: {
    id: string;
    personality_type: string;
    juz_number: number;
    scores: Record<string, number>;
    personality: {
      type_code: string;
      name: string;
      description: string;
      traits: string[];
      strengths: string[];
      weaknesses: string[];
    };
    answers: {
      question_id: string;
      question_text: string;
      option_id: string;
      option_text: string;
      trait_value: string;
    }[];
    completed_at: string;
  };
}

// ============================================
// USER API TYPES
// ============================================

export interface GetProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    bio: string | null;
    photo_url: string | null;
    created_at: string;
    updated_at: string;
  };
  quiz_results: {
    id: string;
    personality_type: string;
    juz_number: number;
    completed_at: string;
  }[];
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

export interface UpdateProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    bio: string | null;
    photo_url: string | null;
    updated_at: string;
  };
}

export interface UploadPhotoResponse {
  photo_url: string;
  message: string;
}

export interface DeletePhotoResponse {
  message: string;
}

// ============================================
// HEALTH API TYPES
// ============================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
}

// ============================================
// ERROR TYPES
// ============================================

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

export interface ValidationError {
  error: string;
  fields?: Record<string, string>;
}

// ============================================
// COMMON TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// SUPABASE AUTH TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

// ============================================
// ANONYMOUS USER TYPES
// ============================================

export interface MergeAnonymousRequest {
  anonUserId: string;
}

export interface MergeAnonymousResponse {
  message: string;
  mergedCount: number;
}

export interface GetAnonymousResultsResponse {
  results: Array<{
    id: string;
    personality_type: string;
    juz_result: number;
    title: string;
    description: string;
    strengths: string[];
    challenges: string[];
    advice: string;
    completed_at: string;
  }>;
}
