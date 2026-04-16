// Admin-specific Type Definitions

// ============================================
// LANDING CONTENT TYPES
// ============================================

export type LandingSection = 'hero' | 'manfaat' | 'hasil' | 'cta' | 'footer';
export type ContentType = 'text' | 'image' | 'url' | 'json';

export interface LandingContent {
  id: number;
  section: LandingSection;
  key: string;
  content_type: ContentType;
  value: string | null;
  order_number: number;
  is_active: boolean;
  updated_at: string;
}

export interface LandingContentInsert {
  section: LandingSection;
  key: string;
  content_type: ContentType;
  value?: string | null;
  order_number?: number;
  is_active?: boolean;
}

export interface LandingContentUpdate {
  section?: LandingSection;
  key?: string;
  content_type?: ContentType;
  value?: string | null;
  order_number?: number;
  is_active?: boolean;
}

// Grouped content by section for easy consumption
export interface LandingContentBySection {
  hero: Record<string, string>;
  manfaat: Record<string, string>;
  hasil: Record<string, string>;
  cta: Record<string, string>;
  footer: Record<string, string>;
}

// ============================================
// HERO SECTION CONTENT
// ============================================

export interface HeroContent {
  badge_text: string;
  title: string;
  subtitle: string;
  background_image: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
}

// ============================================
// MANFAAT SECTION CONTENT
// ============================================

export interface ManfaatItem {
  title: string;
  desc: string;
  image: string;
}

export interface ManfaatContent {
  section_title: string;
  items: ManfaatItem[];
}

// ============================================
// HASIL SECTION CONTENT
// ============================================

export interface HasilItem {
  image: string;
  title: string;
  description: string;
}

export interface HasilContent {
  section_title: string;
  preview_image: string;
  items: HasilItem[];
}

// ============================================
// CTA SECTION CONTENT
// ============================================

export interface CTAContent {
  title: string;
  description: string;
  button_text: string;
  background_image: string;
}

// ============================================
// FOOTER SECTION CONTENT
// ============================================

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterSocialLink {
  platform: 'phone' | 'instagram' | 'facebook' | 'twitter' | 'youtube';
  url: string;
}

export interface FooterContent {
  org_name_line1: string;
  org_name_line2: string;
  address: string;
  copyright_text: string;
  page_links: FooterLink[];
  legal_links: FooterLink[];
  support_links: FooterLink[];
  social_links: FooterSocialLink[];
}

// ============================================
// DASHBOARD STATS TYPES
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalQuizCompleted: number;
  totalQuestions: number;
  totalActivePersonalities: number;
}

export interface RecentQuizActivity {
  id: string;
  userName: string;
  userEmail: string;
  finalJuz: number | null;
  personalityName: string | null;
  branchCategory: string | null;
  completedAt: string;
}

export interface PersonalityDistribution {
  juzNumber: number;
  personalityName: string;
  count: number;
}

export interface BranchDistribution {
  branchCategory: string;
  count: number;
}

// ============================================
// ADMIN API REQUEST/RESPONSE TYPES
// ============================================

export interface AdminPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Questions
export interface AdminQuestionWithOptions {
  id: number;
  question_text: string;
  layer: number;
  category: string;
  branch_category: string | null;
  order_number: number;
  juz_reference: number | null;
  ayat_reference: string | null;
  created_at: string;
  quiz_options: {
    id: number;
    option_text: string;
    option_value: string;
    points: number;
    order_number: number;
  }[];
}

export interface CreateQuestionRequest {
  question_text: string;
  layer: number;
  category: string;
  branch_category?: string | null;
  order_number: number;
  juz_reference?: number | null;
  ayat_reference?: string | null;
  options: {
    option_text: string;
    option_value: string;
    points: number;
    order_number: number;
  }[];
}

// Personality Types
export interface AdminPersonalityType {
  id: number;
  juz_number: number;
  name: string;
  description: string | null;
  strengths: string[] | null;
  challenges: string[] | null;
  development_advice: string | null;
  ayat_references: string[] | null;
  is_active: boolean;
  created_at: string;
}

// Tiebreaker
export interface AdminTiebreakerQuestion {
  id: number;
  juz_a: number;
  juz_b: number;
  question_text: string;
  option_a_description: string;
  option_b_description: string;
  created_at: string;
}

// Users (admin view)
export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  age: number | null;
  whatsapp: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
  quiz_count: number;
}

// Results (admin view)
export interface AdminResultView {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  extraversion_score: number | null;
  ego_score: number | null;
  ego_level: string | null;
  neuro_score: number | null;
  neuro_level: string | null;
  branch_category: string | null;
  juz_scores: Record<string, number> | null;
  final_juz: number | null;
  personality_name: string | null;
  had_tie: boolean;
  completed_at: string | null;
}

export interface ResultsFilterParams extends AdminPaginationParams {
  juz?: number;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
  completed?: boolean;
}
