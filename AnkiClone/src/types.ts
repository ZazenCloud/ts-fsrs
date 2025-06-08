import { State } from './fsrs/models'; // Assuming State enum is available from the copied FSRS source

export interface Deck {
  id: number;
  name: string;
}

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // FSRS specific fields
  due: Date; // Or string if storing as ISO string, Date for easier manipulation
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date | null; // Or string
}
