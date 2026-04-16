export type ResultPageCardType =
  | 'custom'
  | 'personality_description'
  | 'personality_strengths'
  | 'personality_challenges';

export type ResultPageBlockType = 'text' | 'image' | 'heading';

export interface ResultPageCardBlock {
  id: number;
  card_id: number;
  block_type: ResultPageBlockType;
  content: string;
  order_number: number;
}

export interface ResultPageCard {
  id: number;
  title: string;
  card_type: ResultPageCardType;
  order_number: number;
  is_active: boolean;
  blocks: ResultPageCardBlock[];
}

// Shape for creating/updating a card from the admin UI
export interface ResultPageCardPayload {
  title: string;
  card_type: ResultPageCardType;
  order_number?: number;
  is_active?: boolean;
  blocks?: Omit<ResultPageCardBlock, 'id' | 'card_id'>[];
}
