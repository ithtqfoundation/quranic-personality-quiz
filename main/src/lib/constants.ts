// Application Constants
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

// ============================================
// API CONFIGURATION
// ============================================

export const API_BASE_URL = (typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_APP_URL 
  : (window as any).location?.origin) || 'http://localhost:3000';

export const API_ROUTES = {
  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  
  // Quiz
  QUIZ_QUESTIONS: '/api/quiz/questions',
  QUIZ_SUBMIT: '/api/quiz/submit',
  QUIZ_RESULTS: '/api/quiz/results',
  
  // User
  USER_PROFILE: '/api/user/profile',
  USER_UPDATE: '/api/user/update',
  USER_UPLOAD_PHOTO: '/api/user/upload-photo',
  
  // Health
  HEALTH: '/api/health',
} as const;

// ============================================
// QUIZ CONFIGURATION
// ============================================

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 30,
  TOTAL_JUZ: 30,
  OPTIONS_PER_QUESTION: 4,
  MIN_ANSWERS_REQUIRED: 30,
  PERSONALITY_DIMENSIONS: ['E/I', 'H/S', 'N/L', 'J/P'] as const,
} as const;

export const TRAIT_LABELS: Record<string, string> = {
  E: 'Extrovert',
  I: 'Introvert',
  H: 'Heart (Emotional)',
  S: 'Sensing (Practical)',
  N: 'Nurturing (Caring)',
  L: 'Logical (Analytical)',
  J: 'Judging (Structured)',
  P: 'Perceiving (Flexible)',
};

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
    ERROR_MESSAGE: 'Email format tidak valid',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    ERROR_MESSAGE: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    REGEX: /^[a-zA-Z\s]+$/,
    ERROR_MESSAGE: 'Nama hanya boleh mengandung huruf dan spasi',
  },
  BIO: {
    MAX_LENGTH: 500,
    ERROR_MESSAGE: 'Bio maksimal 500 karakter',
  },
  PHOTO: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ERROR_MESSAGE: 'File harus berupa gambar (JPEG, PNG, WEBP) dan maksimal 5MB',
  },
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'Email atau password salah',
  AUTH_EMAIL_EXISTS: 'Email sudah terdaftar',
  AUTH_WEAK_PASSWORD: 'Password terlalu lemah',
  AUTH_SESSION_EXPIRED: 'Sesi telah berakhir, silakan login kembali',
  AUTH_UNAUTHORIZED: 'Anda tidak memiliki akses',
  
  // Quiz errors
  QUIZ_NOT_FOUND: 'Quiz tidak ditemukan',
  QUIZ_INCOMPLETE: 'Mohon jawab semua pertanyaan',
  QUIZ_ALREADY_COMPLETED: 'Anda sudah menyelesaikan quiz ini',
  QUIZ_INVALID_ANSWER: 'Jawaban tidak valid',
  
  // User errors
  USER_NOT_FOUND: 'User tidak ditemukan',
  USER_UPDATE_FAILED: 'Gagal mengupdate profil',
  
  // File upload errors
  FILE_TOO_LARGE: 'File terlalu besar (maksimal 5MB)',
  FILE_INVALID_TYPE: 'Tipe file tidak didukung',
  FILE_UPLOAD_FAILED: 'Gagal mengupload file',
  
  // Network errors
  NETWORK_ERROR: 'Terjadi kesalahan jaringan',
  SERVER_ERROR: 'Terjadi kesalahan server',
  
  // Validation errors
  VALIDATION_FAILED: 'Validasi gagal',
  REQUIRED_FIELD: 'Field ini wajib diisi',
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  AUTH_REGISTER_SUCCESS: 'Registrasi berhasil! Silakan login',
  AUTH_LOGIN_SUCCESS: 'Login berhasil',
  AUTH_LOGOUT_SUCCESS: 'Logout berhasil',
  
  QUIZ_SUBMIT_SUCCESS: 'Quiz berhasil diselesaikan',
  
  USER_UPDATE_SUCCESS: 'Profil berhasil diupdate',
  PHOTO_UPLOAD_SUCCESS: 'Foto berhasil diupload',
  PHOTO_DELETE_SUCCESS: 'Foto berhasil dihapus',
} as const;

// ============================================
// STORAGE CONFIGURATION
// ============================================

export const STORAGE = {
  BUCKET_NAME: 'profile-photos',
  PROFILE_PHOTO_PATH: (userId: string) => `${userId}/profile`,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE = {
  QUIZ_QUESTIONS_TTL: 60 * 60, // 1 hour
  USER_PROFILE_TTL: 5 * 60, // 5 minutes
  RESULTS_TTL: 30 * 60, // 30 minutes
} as const;

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMIT = {
  API_REQUESTS_PER_SECOND: 10,
  GENERAL_REQUESTS_PER_SECOND: 30,
  LOGIN_ATTEMPTS_PER_MINUTE: 5,
  REGISTRATION_ATTEMPTS_PER_HOUR: 3,
} as const;

// ============================================
// ENVIRONMENT
// ============================================

export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// ============================================
// APP METADATA
// ============================================

export const APP_METADATA = {
  NAME: 'HTQ Personality Quiz',
  DESCRIPTION: 'Personality quiz berbasis 30 Juz Al-Quran dengan sistem MBTI-like personality types',
  VERSION: '1.0.0',
  AUTHOR: 'HTQ Foundation',
  KEYWORDS: ['quiz', 'personality', 'al-quran', 'mbti', 'islamic'],
} as const;

// ============================================
// COOKIE NAMES
// ============================================

export const COOKIES = {
  SESSION: 'htq-session',
  REFRESH_TOKEN: 'htq-refresh-token',
} as const;

// ============================================
// LOCAL STORAGE KEYS
// ============================================

export const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'htq-user-preferences',
  QUIZ_PROGRESS: 'htq-quiz-progress',
  THEME: 'htq-theme',
} as const;
