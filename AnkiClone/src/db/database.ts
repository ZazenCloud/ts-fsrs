import * as SQLite from 'expo-sqlite';
import { Deck, Card } from './types'; // Ensure Card is imported

const db = SQLite.openDatabase('ankiClone.db');

export const initDB = () => {
  return new Promise<void>((resolve, reject) => { // Changed to Promise<void> for consistency with previous initDB
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);',
        [],
        () => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, deckId INTEGER NOT NULL, front TEXT NOT NULL, back TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE);',
            [],
            () => resolve(), // Resolve with no value
            (_, error) => {
              console.error('Error creating cards table:', error);
              reject(error);
              return false; // Stop transaction
            }
          );
        },
        (_, error) => {
          console.error('Error creating decks table:', error);
          reject(error);
          return false; // Stop transaction
        }
      );
    });
  });
};

export const fetchDecks = (): Promise<Deck[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM decks;',
        [],
        (_, { rows }) => resolve(rows._array as Deck[]),
        (_, error) => {
          console.error('Error fetching decks:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const insertDeck = (name: string): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO decks (name) VALUES (?);',
        [name],
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Error inserting deck:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteDeck = (id: number): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // ON DELETE CASCADE in cards table schema handles card deletion for a deck
      tx.executeSql(
        'DELETE FROM decks WHERE id = ?;',
        [id],
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Error deleting deck:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const fetchCardsForDeck = (deckId: number): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM cards WHERE deckId = ? ORDER BY createdAt DESC;',
        [deckId],
        (_, { rows }) => resolve(rows._array as Card[]),
        (_, error) => {
          console.error('Error fetching cards for deck:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const insertCard = (deckId: number, front: string, back: string): Promise<SQLite.SQLResultSet> => {
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO cards (deckId, front, back, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);',
        [deckId, front, back, now, now],
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Error inserting card:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Later: updateCard, deleteCard


export const fetchCardById = (id: number): Promise<Card | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM cards WHERE id = ?;',
        [id],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows._array[0] as Card);
          } else {
            resolve(null); // Card not found
          }
        },
        (_, error) => {
          console.error('Error fetching card by ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateCard = (id: number, front: string, back: string): Promise<SQLite.SQLResultSet> => {
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE cards SET front = ?, back = ?, updatedAt = ? WHERE id = ?;',
        [front, back, now, id],
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Error updating card:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteCard = (id: number): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM cards WHERE id = ?;',
        [id],
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Error deleting card:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};
