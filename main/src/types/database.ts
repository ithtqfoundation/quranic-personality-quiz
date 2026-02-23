// Database Type Definitions - 4-Layer Quiz System
// Generated from Supabase schema_v2.sql

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          age: number | null;
          whatsapp: string | null;
          bio: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          age?: number | null;
          whatsapp?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          age?: number | null;
          whatsapp?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: number;
          question_text: string;
          layer: number; // 1-4
          category: string; // 'EXTRAVERSION', 'EGO', 'NEUROTICISM', 'BRANCH', 'TIEBREAKER'
          branch_category: string | null; // 'EHNH', 'EHNL', 'ELNH', 'ELNL' for layer 3
          order_number: number;
          juz_reference: number | null;
          ayat_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          question_text: string;
          layer: number;
          category: string;
          branch_category?: string | null;
          order_number: number;
          juz_reference?: number | null;
          ayat_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          question_text?: string;
          layer?: number;
          category?: string;
          branch_category?: string | null;
          order_number?: number;
          juz_reference?: number | null;
          ayat_reference?: string | null;
          created_at?: string;
        };
      };
      quiz_options: {
        Row: {
          id: number;
          question_id: number;
          option_text: string;
          option_value: string; // 'E', 'I', 'EGO-H', 'EGO-L', 'NEURO-H', 'NEURO-L', 'JUZ_X'
          points: number;
          order_number: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          option_text: string;
          option_value: string;
          points?: number;
          order_number: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          option_text?: string;
          option_value?: string;
          points?: number;
          order_number?: number;
          created_at?: string;
        };
      };
      branch_categories: {
        Row: {
          id: number;
          code: string; // 'EHNH', 'EHNL', 'ELNH', 'ELNL'
          name: string;
          description: string | null;
          ego_level: string; // 'HIGH' or 'LOW'
          neuro_level: string; // 'HIGH' or 'LOW'
          available_juz: number[]; // Array of Juz numbers
          created_at: string;
        };
        Insert: {
          id?: number;
          code: string;
          name: string;
          description?: string | null;
          ego_level: string;
          neuro_level: string;
          available_juz: number[];
          created_at?: string;
        };
        Update: {
          id?: number;
          code?: string;
          name?: string;
          description?: string | null;
          ego_level?: string;
          neuro_level?: string;
          available_juz?: number[];
          created_at?: string;
        };
      };
      personality_types: {
        Row: {
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
        };
        Insert: {
          id?: number;
          juz_number: number;
          name: string;
          description?: string | null;
          strengths?: string[] | null;
          challenges?: string[] | null;
          development_advice?: string | null;
          ayat_references?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          juz_number?: number;
          name?: string;
          description?: string | null;
          strengths?: string[] | null;
          challenges?: string[] | null;
          development_advice?: string | null;
          ayat_references?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      tiebreaker_questions: {
        Row: {
          id: number;
          juz_a: number;
          juz_b: number;
          question_text: string;
          option_a_description: string;
          option_b_description: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          juz_a: number;
          juz_b: number;
          question_text: string;
          option_a_description: string;
          option_b_description: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          juz_a?: number;
          juz_b?: number;
          question_text?: string;
          option_a_description?: string;
          option_b_description?: string;
          created_at?: string;
        };
      };
      quiz_results: {
        Row: {
          id: string; // UUID
          user_id: string | null;
          anon_user_id: string | null;
          is_anonymous: boolean;
          // Layer 1: Extraversion
          extraversion_score: number | null;
          // Layer 2: Ego & Neuroticism
          ego_score: number | null;
          ego_level: string | null; // 'HIGH' or 'LOW'
          neuro_score: number | null;
          neuro_level: string | null; // 'HIGH' or 'LOW'
          branch_category: string | null; // 'EHNH', 'EHNL', 'ELNH', 'ELNL'
          // Layer 3: Juz scores
          juz_scores: any | null; // JSONB: {"12": 5, "14": 3, ...}
          top_juz_1: number | null;
          top_juz_2: number | null;
          had_tie: boolean;
          // Layer 4: Tie-breaker
          tiebreaker_question_id: number | null;
          tiebreaker_answer: string | null; // 'A' or 'B'
          // Final result
          final_juz: number | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anon_user_id?: string | null;
          is_anonymous?: boolean;
          extraversion_score?: number | null;
          ego_score?: number | null;
          ego_level?: string | null;
          neuro_score?: number | null;
          neuro_level?: string | null;
          branch_category?: string | null;
          juz_scores?: any | null;
          top_juz_1?: number | null;
          top_juz_2?: number | null;
          had_tie?: boolean;
          tiebreaker_question_id?: number | null;
          tiebreaker_answer?: string | null;
          final_juz?: number | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anon_user_id?: string | null;
          is_anonymous?: boolean;
          extraversion_score?: number | null;
          ego_score?: number | null;
          ego_level?: string | null;
          neuro_score?: number | null;
          neuro_level?: string | null;
          branch_category?: string | null;
          juz_scores?: any | null;
          top_juz_1?: number | null;
          top_juz_2?: number | null;
          had_tie?: boolean;
          tiebreaker_question_id?: number | null;
          tiebreaker_answer?: string | null;
          final_juz?: number | null;
          completed_at?: string | null;
        };
      };
      quiz_answers: {
        Row: {
          id: number;
          result_id: string;
          question_id: number;
          option_id: number;
          layer: number;
          answered_at: string;
        };
        Insert: {
          id?: number;
          result_id: string;
          question_id: number;
          option_id: number;
          layer: number;
          answered_at?: string;
        };
        Update: {
          id?: number;
          result_id?: string;
          question_id?: number;
          option_id?: number;
          layer?: number;
          answered_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert'];
export type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update'];

export type QuizOption = Database['public']['Tables']['quiz_options']['Row'];
export type QuizOptionInsert = Database['public']['Tables']['quiz_options']['Insert'];
export type QuizOptionUpdate = Database['public']['Tables']['quiz_options']['Update'];

export type BranchCategory = Database['public']['Tables']['branch_categories']['Row'];
export type BranchCategoryInsert = Database['public']['Tables']['branch_categories']['Insert'];
export type BranchCategoryUpdate = Database['public']['Tables']['branch_categories']['Update'];

export type PersonalityType = Database['public']['Tables']['personality_types']['Row'];
export type PersonalityTypeInsert = Database['public']['Tables']['personality_types']['Insert'];
export type PersonalityTypeUpdate = Database['public']['Tables']['personality_types']['Update'];

export type TiebreakerQuestion = Database['public']['Tables']['tiebreaker_questions']['Row'];
export type TiebreakerQuestionInsert = Database['public']['Tables']['tiebreaker_questions']['Insert'];
export type TiebreakerQuestionUpdate = Database['public']['Tables']['tiebreaker_questions']['Update'];

export type QuizResult = Database['public']['Tables']['quiz_results']['Row'];
export type QuizResultInsert = Database['public']['Tables']['quiz_results']['Insert'];
export type QuizResultUpdate = Database['public']['Tables']['quiz_results']['Update'];

export type QuizAnswer = Database['public']['Tables']['quiz_answers']['Row'];
export type QuizAnswerInsert = Database['public']['Tables']['quiz_answers']['Insert'];
export type QuizAnswerUpdate = Database['public']['Tables']['quiz_answers']['Update'];

// Additional types for 4-layer system
export type Layer = 1 | 2 | 3 | 4;
export type BranchCode = 'EHNH' | 'EHNL' | 'ELNH' | 'ELNL';
export type EgoLevel = 'HIGH' | 'LOW';
export type NeuroLevel = 'HIGH' | 'LOW';
export type TiebreakerAnswer = 'A' | 'B';
