import { Injectable } from '@angular/core';

/**
 * The interface that keeps track of all Boards and the active one.
 *
 */
interface Boards {
  boards: Board[];
}

/**
 * The Board interface contains all board information.
 * It has a unique id, a name, and a list of columns.
 *
 * @remarks
 * The id will always be incremented by 1 based on the last id in the Boards object.
 *
 */
interface Board {
  id: number;
  boardName: string;
  columns: Column[];
}

/**
 * The Column interface contains tasks.
 * It has a unique id, a name, and a list of tasks.
 *
 */
interface Column {
  id: number;
  columnName: string;
  tasks: Task[];
}

/**
 * The Task interface contains info about itself, and subtasks.
 * It has a unique id, a title, a description, a status and a list of subtasks.
 *
 */
interface Task {
  id: number;
  title: string;
  description: string;
  status: string; // "todo" | "in-progress" | "done" (@TODO: Make this an enum)
  subtasks: Subtask[];
}

/**
 * The Subtask interface contains info about itself.
 * It has a unique id, a name, a description and a field indicating whether it is completed or not.
 *
 */
interface Subtask {
  id: number;
  subTaskName: string;
  description: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BoardsService {
  constructor() {}

  private db: IDBDatabase | null = null;
  public selectedBoardID: number = 0;
  public boardNames: string[] = [];
  public selectedBoard: Board | null = null;

  async initBoardsServiceAndGetSelectedBoard(): Promise<Board> {
    await this.connectToDB();
    const boardNames = await this.getAllBoardNames();

    // If no boards exist, this is the first run
    if (boardNames.length === 0) {
      await this.createDefaultBoard();
    }

    await this.getSelectedBoardId();
    return await this.getSelectedBoard();
  }

  connectToDB() {
    return new Promise<string>((resolve, reject) => {
      const requestToGetBoardsDB = indexedDB.open('boardsDatabase', 1);

      // Error handler.
      requestToGetBoardsDB.onerror = (event) => {
        const errorMessage =
          "User didn't allow IndexedDB to be used in this browser: Couldn't indexedDB.open inside getBoards(). Error message: " +
          (event.target as IDBOpenDBRequest).error;
        reject(errorMessage);
      };

      // Create the object store if it doesn't exist, or define upgrade logic.
      requestToGetBoardsDB.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // We define both keyPath and autoIncrement to make sure that the id is always "displayed" in the object store.
        const boardsObjectStore = db.createObjectStore('boards', {
          keyPath: 'id',
          autoIncrement: true,
        });

        boardsObjectStore.createIndex('boardName', 'boardName', {
          unique: false,
        });

        db.createObjectStore('selectedBoardId', { keyPath: 'id' });
      };

      // Success handler.
      requestToGetBoardsDB.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;

        // Generic db error
        this.db.onerror = (event: Event) => {
          console.log(`Database error: ${(event.target as IDBRequest).error}`);
        };

        resolve('Connected to the database.');
      };
    });
  }

  //  @TODO: Since we changed this function to actually iterate over all boards (getAllKeys() doesnt support getting only a subset of properties), we should probably create a separate store just to keep track of the board names. It could be a single array, so that we can easily change the order of board names displayed.
  getAllBoardNames() {
    return new Promise<string[]>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readonly');
      const objectStore = transaction.objectStore('boards');

      // Gets all boardNames (only the boardName property!).
      const request = objectStore.getAll();

      request.onsuccess = () => {
        // Extract the boardName from each Board object
        this.boardNames = request.result.map((board) => board.boardName);
        resolve(this.boardNames);
      };

      request.onerror = (event) => {
        reject(`Error in getAllBoards(): ${event}`);
      };
    });
  }

  // Get selected board id
  getSelectedBoardId() {
    return new Promise<number>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const transaction = this.db.transaction('selectedBoardId', 'readonly');
      const objectStore = transaction.objectStore('selectedBoardId');

      const request = objectStore.get(1);

      request.onsuccess = () => {
        const selectedBoardID = request.result.selectedBoardID;
        if (selectedBoardID) {
          this.selectedBoardID = selectedBoardID;
          resolve(selectedBoardID);
        } else {
          // If there is no selected board, return null.
          reject('No selectedBoardID found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error in getSelectedBoardId(): ${event}`);
      };
    });
  }

  // GetSelectedBoard.
  getSelectedBoard() {
    return new Promise<Board>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      } else if (!this.selectedBoardID) {
        reject('Error in getSelectedBoard(): No selected board.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readonly');
      const objectStore = transaction.objectStore('boards');

      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result;
        if (selectedBoard) {
          this.selectedBoard = selectedBoard;
          resolve(selectedBoard);
        } else {
          reject('No selected board found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error in getSelectedBoard(): ${event}`);
      };
    });
  }

  // Create a default board. Used in case there are no other boards (application runs for the first time)
  createDefaultBoard() {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const defaultBoard: Board = {
        id: 1, // Since it's the first board
        boardName: 'Welcome Board',
        columns: [
          { id: 1, columnName: 'To Do', tasks: [] },
          { id: 2, columnName: 'In Progress', tasks: [] },
          { id: 3, columnName: 'Done', tasks: [] },
        ],
      };

      const boardsTransaction = this.db.transaction('boards', 'readwrite');
      const objectStore = boardsTransaction.objectStore('boards');
      const boardsRequest = objectStore.add(defaultBoard); // Add the board
      boardsRequest.onsuccess = () => resolve();
      boardsRequest.onerror = (event) =>
        reject('Error creating default board: ' + event);

      // Also set this as the selected board
      const idTransaction = this.db.transaction('selectedBoardId', 'readwrite');
      const idStore = idTransaction.objectStore('selectedBoardId');
      idStore.put({ id: 1, selectedBoardID: 1 }); // Store the ID 1
      this.selectedBoardID = 1;
    });
  }
}
