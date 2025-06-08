import * as SQLite from 'expo-sqlite';
import { Deck, Card } from './types';
import { FSRS, Rating, State, Card as FSRSCard, ReviewLog, date_scheduler } from './fsrs'; // Path to be corrected by sed

const db = SQLite.openDatabase('ankiClone.db');
const fsrs = new FSRS(); // Initialize FSRS, potentially with custom weights later

// Helper to convert DB string dates to Date objects and vice-versa for FSRS fields
const parseCardFromDB = (dbCard: any): Card => {
  return {
    ...dbCard,
    due: dbCard.due ? date_scheduler(new Date(dbCard.due),false) : date_scheduler(new Date(),false),
    last_review: dbCard.last_review ? date_scheduler(new Date(dbCard.last_review),false) : null,
    state: dbCard.state as State,
  };
};

const toISODateString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);',
        [],
        () => {
          // tx.executeSql('DROP TABLE IF EXISTS cards;');
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS cards (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              deckId INTEGER NOT NULL,
              front TEXT NOT NULL,
              back TEXT NOT NULL,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL,
              due TEXT NOT NULL,
              stability REAL DEFAULT 0,
              difficulty REAL DEFAULT 0,
              elapsed_days INTEGER DEFAULT 0,
              scheduled_days INTEGER DEFAULT 0,
              reps INTEGER DEFAULT 0,
              lapses INTEGER DEFAULT 0,
              state TEXT DEFAULT '${State.New}',
              last_review TEXT,
              FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE
            );`,
            [],
            () => resolve(true),
            (_, error) => { console.error('Error creating cards table:', error); reject(error); return false; }
          );
        },
        (_, error) => { console.error('Error creating decks table:', error); reject(error); return false; }
      );
    });
  });
};

export const fetchDecks = (): Promise<Deck[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM decks;', [],
        (_, { rows }) => resolve(rows._array as Deck[]),
        (_, error) => { console.error('Error fetching decks:', error); reject(error); return false; }
      );
    });
  });
};

export const insertDeck = (name: string): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO decks (name) VALUES (?);', [name],
        (_, result) => resolve(result),
        (_, error) => { console.error('Error inserting deck:', error); reject(error); return false; }
      );
    });
  });
};

export const deleteDeck = (id: number): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM decks WHERE id = ?;', [id],
        (_, result) => resolve(result),
        (_, error) => { console.error('Error deleting deck:', error); reject(error); return false; }
      );
    });
  });
};

export const fetchCardsForDeck = (deckId: number): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM cards WHERE deckId = ? ORDER BY createdAt DESC;', [deckId],
        (_, { rows }) => resolve(rows._array.map(parseCardFromDB)),
        (_, error) => { console.error('Error fetching cards for deck:', error); reject(error); return false; }
      );
    });
  });
};

export const fetchCardById = (id: number): Promise<Card | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM cards WHERE id = ?;', [id],
        (_, { rows }) => {
          if (rows.length > 0) resolve(parseCardFromDB(rows._array[0]));
          else resolve(null);
        },
        (_, error) => { console.error('Error fetching card by ID:', error); reject(error); return false; }
      );
    });
  });
};

export const insertCard = (deckId: number, front: string, back: string): Promise<SQLite.SQLResultSet> => {
  const now = new Date();
  const initialFsrsCard: FSRSCard = fsrs.create_card();

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO cards (deckId, front, back, createdAt, updatedAt, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          deckId, front, back, now.toISOString(), now.toISOString(),
          toISODateString(initialFsrsCard.due),
          initialFsrsCard.stability, initialFsrsCard.difficulty, initialFsrsCard.elapsed_days,
          initialFsrsCard.scheduled_days, initialFsrsCard.reps, initialFsrsCard.lapses,
          initialFsrsCard.state, toISODateString(initialFsrsCard.last_review)
        ],
        (_, result) => resolve(result),
        (_, error) => { console.error('Error inserting card:', error); reject(error); return false; }
      );
    });
  });
};

export const updateCard = (id: number, front: string, back: string, fsrsProps?: Partial<FSRSCard>): Promise<SQLite.SQLResultSet> => {
  const now = new Date().toISOString();
  let query = 'UPDATE cards SET front = ?, back = ?, updatedAt = ?';
  let params: any[] = [front, back, now];

  if (fsrsProps) {
    Object.entries(fsrsProps).forEach(([key, value]) => {
      if (key === 'due' || key === 'last_review') {
        query += `, ${key} = ?`;
        params.push(toISODateString(value as Date));
      } else if (key !== 'id' && key !== 'deckId' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'front' && key !== 'back') {
        query += `, ${key} = ?`;
        params.push(value);
      }
    });
  }
  query += ' WHERE id = ?;';
  params.push(id);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(query, params,
        (_, result) => resolve(result),
        (_, error) => { console.error('Error updating card:', error); reject(error); return false; }
      );
    });
  });
};

export const deleteCard = (id: number): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM cards WHERE id = ?;', [id],
        (_, result) => resolve(result),
        (_, error) => { console.error('Error deleting card:', error); reject(error); return false; }
      );
    });
  });
};

export const getDueCardsForDeck = (deckId: number, date: Date = new Date()): Promise<Card[]> => {
  const todayString = date_scheduler(date,false).toISOString().split('T')[0];
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        "SELECT * FROM cards WHERE deckId = ? AND (date(due) <= date(?) OR state = 'New') ORDER BY due ASC, createdAt ASC;",
        [deckId, todayString],
        (_, { rows }) => resolve(rows._array.map(parseCardFromDB)),
        (_, error) => { console.error('Error fetching due cards:', error); reject(error); return false; }
      );
    });
  });
};

export const recordReview = async (cardId: number, rating: Rating, reviewTime: Date = new Date()): Promise<FSRSCard> => {
  const card = await fetchCardById(cardId);
  if (!card) throw new Error('Card not found for review');

  const fsrsCard: FSRSCard = {
      ...card,
      due: card.due,
      last_review: card.last_review
  };

  const scheduling_cards = fsrs.repeat(fsrsCard, reviewTime);
  const newFsrsCard = scheduling_cards[rating];

  await updateCard(cardId, card.front, card.back, {
    due: newFsrsCard.due,
    stability: newFsrsCard.stability,
    difficulty: newFsrsCard.difficulty,
    elapsed_days: newFsrsCard.elapsed_days,
    scheduled_days: newFsrsCard.scheduled_days,
    reps: newFsrsCard.reps,
    lapses: newFsrsCard.lapses,
    state: newFsrsCard.state,
    last_review: newFsrsCard.last_review,
  });
  return newFsrsCard;
};
