import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * The Board interface contains all board information.
 * It has a unique id, a name, and a list of columns.
 *
 * @remarks
 * The id will always be incremented by 1 based on the last id in the Boards object.
 *
 */
export interface Board {
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

/**
 * The BoardName interface contains the BoardName of a board, and a unique id to be used with Angulars trackBy (for performance).
 *
 */
export interface BoardName {
  boardName: string;
  uid: number;
}

@Injectable({
  providedIn: 'root',
})
export class BoardsService {
  private db: IDBDatabase | null = null;

  private selectedBoardIDSubject = new BehaviorSubject<number | undefined>(
    undefined,
  );
  public selectedBoardID$ = this.selectedBoardIDSubject.asObservable();
  private selectedBoardID: number | undefined; // Internal variable to keep track of the selected board id, without creating unnecessary extra subscriptions.

  private boardNamesSubject = new BehaviorSubject<BoardName[]>([]);
  public boardNames$ = this.boardNamesSubject.asObservable();

  private selectedBoardSubject = new BehaviorSubject<Board | undefined>(
    undefined,
  );
  public selectedBoard$ = this.selectedBoardSubject.asObservable();

  constructor() {
    this.selectedBoardID$.subscribe((id) => (this.selectedBoardID = id)); // This subscription is for internal tracking of the selectedBoardID.
  }

  /**
   * The initializer of the whole service and IndexedDB logic.
   * The promise resolves only when the connection is successful, otherwise it rejects with an error message.
   *
   * @remarks
   * The function is promisified to handle the async nature of the IndexedDB API.
   *
   */
  public async initBoardsServiceAndGetSelectedBoard(): Promise<void> {
    await this.connectToDB();
    const boardNames = await this.getAllBoardNames();

    // If no boards exist, this is the first run. Create a new default board.
    if (boardNames.length === 0) {
      await this.createDefaultBoard();
      await this.getAllBoardNames();
    }

    await this.getSelectedBoardId();
    return await this.getSelectedBoard();
  }

  /**
   * Connects to the IndexedDB boardsDatabase.
   * The promise resolves only when the connection is successful, otherwise it rejects with an error message.
   *
   * @remarks
   * The function is promisified to handle the async nature of the IndexedDB API.
   *
   * @param version - The version of the database. Defaults to 1. Increment this number when you change the structure of the database.
   *
   */
  public connectToDB(version: number = 1): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const requestToGetBoardsDB = indexedDB.open('boardsDatabase', version);

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
        // (If you don't specify the keyPath as id, the id is implicitly set and not 'visible' in the object store.)
        const boardsObjectStore = db.createObjectStore('boards', {
          keyPath: 'id',
          autoIncrement: true,
        });

        boardsObjectStore.createIndex('boardName', 'boardName', {
          unique: false,
        });

        // No autoincrement needed for selectedBoardId, since we only need one object in this store.
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

  //
  /**
   * Gets all board names from the boardsDatabase.
   * Returns a promise that resolves with the selected board names, or rejects with an error message.
   *
   * @remarks
   * @TODO Since we changed this function to actually iterate over all boards (getAllKeys() doesnt support getting only a subset of properties, like only the name fields), we should probably create a separate store just to keep track of the board names. It could be a single array, so that we can easily change the order of board names displayed.
   *
   */
  public getAllBoardNames(): Promise<BoardName[]> {
    return new Promise<BoardName[]>((resolve, reject) => {
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
        const boardNames = request.result.map((board, index) => {
          return {
            boardName: board.boardName,
            uid: board.id,
          };
        });
        this.boardNamesSubject.next(boardNames);
        resolve(boardNames);
      };

      request.onerror = (event) => {
        reject(`Error in getAllBoards(): ${event}`);
      };
    });
  }

  /**
   * Gets the currently 'selected' board id from the boardsDatabase.
   * Calls selectedBoardIDSubject.next() with the according selectedBoardId.
   * Returns a promise, or rejects with an error message.
   *
   * @remarks
   * There is always a selectedBoardId.
   *
   */
  public getSelectedBoardId(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const transaction = this.db.transaction('selectedBoardId', 'readonly');
      const objectStore = transaction.objectStore('selectedBoardId');

      // Always gets the first object in the store, since there is only ever one: It keeps track of the currently selectedBoardId.
      const request = objectStore.get(1);

      request.onsuccess = () => {
        const selectedBoardID = request.result.selectedBoardID;
        if (selectedBoardID) {
          this.selectedBoardIDSubject.next(selectedBoardID);
          resolve();
        } else {
          reject('No selectedBoardID found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error in getSelectedBoardId(): ${event}`);
      };
    });
  }

  /**
   * Sets the currently 'selected' board id to the boardsDatabase.
   * Calls selectedBoardIDSubject.next() with the according boardId.
   * Returns a promise, or rejects with an error message.
   *
   * @remarks
   * There is always a selectedBoardId.
   *
   */
  public setSelectedBoardId(boardId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const transaction = this.db.transaction('selectedBoardId', 'readwrite');
      const objectStore = transaction.objectStore('selectedBoardId');

      // Always gets the first object in the store, since there is only ever one: It keeps track of the currently selectedBoardId.
      const request = objectStore.put({ id: 1, selectedBoardId: boardId });

      request.onsuccess = () => {
        this.selectedBoardIDSubject.next(boardId);
        this.getSelectedBoard();
        resolve();
      };

      request.onerror = (event) => {
        reject(`Error in setSelectedBoardId(): ${event}`);
      };
    });
  }

  /**
   * Gets the currently 'selected' board from the boardsDatabase.
   * Returns a promise that resolves with the selected board, or rejects with an error message.
   *
   * @remarks
   * If for some reason there is no selectedBoardId, the function will run getSelectedBoardId() once to get it.
   *
   */
  public getSelectedBoard(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      } else if (!this.selectedBoardID) {
        // No selectedBoardId found, running a request for it.
        await this.getSelectedBoardId();

        // If still no selectedBoardId, reject.
        if (!this.selectedBoardID) {
          reject('No selected board id found.');
          return;
        }
      }

      const transaction = this.db.transaction('boards', 'readonly');
      const objectStore = transaction.objectStore('boards');

      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result;
        if (selectedBoard) {
          this.selectedBoardSubject.next(selectedBoard);
          resolve();
        } else {
          reject('No selected board found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error in getSelectedBoard(): ${event}`);
      };
    });
  }

  /**
   * Creates a default board. Used in case there are no other boards (application runs for the first time), or user deletes all boards.
   *
   * @remarks
   * There is always a selectedBoardId.
   *
   */
  private createDefaultBoard() {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const defaultBoard: Board = {
        id: 1, // The key is 1, since it's the first board.
        boardName: 'Welcome Board',
        columns: [
          { id: 1, columnName: 'To Do', tasks: [] },
          { id: 2, columnName: 'In Progress', tasks: [] },
          { id: 3, columnName: 'Done', tasks: [] },
        ],
      };

      // const defaultBoard2: Board = {
      //   id: 2, // The key is 1, since it's the first board.
      //   boardName: 'Second Welcome Board',
      //   columns: [
      //     { id: 1, columnName: 'To Do', tasks: [] },
      //     { id: 2, columnName: 'In Progress', tasks: [] },
      //     { id: 3, columnName: 'Done', tasks: [] },
      //   ],
      // };

      // We have a single transaction for both stores, because if one db operation fails, we want to rollback the other.
      const transaction = this.db.transaction(
        ['boards', 'selectedBoardId'],
        'readwrite',
      );
      const objectStore = transaction.objectStore('boards');
      const boardsRequest = objectStore.add(defaultBoard); // Add the board
      // const boardsRequest2 = objectStore.add(defaultBoard2);
      boardsRequest.onsuccess = () => resolve();
      boardsRequest.onerror = (event) =>
        reject('Error creating default board: ' + event);

      // Set the default board as the 'selected board'
      const idStore = transaction.objectStore('selectedBoardId');
      idStore.put({ id: 1, selectedBoardID: 1 });
      this.selectedBoardIDSubject.next(1);
    });
  }
}
