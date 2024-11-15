import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * The Board interface contains all board information.
 * It has a unique id, a name, and a list of columns.
 *
 * @remarks
 * The id will always be incremented by 1 based on the last id in the Boards object.
 *
 */
export interface Board {
  id?: number;
  boardName: string;
  columns: Column[];
}

/**
 * The Column interface contains tasks.
 * It has a unique id, a name, and a list of tasks.
 *
 */
export interface Column {
  id: number;
  columnName: string;
  tasks: Task[];
}

/**
 * The Task interface contains info about itself, and subtasks.
 * It has a unique id, a title, a description and a list of subtasks.
 *
 */
export interface Task {
  /** The uniqueId is a uuidv4 */
  uniqueId: string;
  title: string;
  description?: string;
  subtasks: Subtask[];
}

/**
 * The Subtask interface contains info about itself.
 * It has a unique id, a name, a description and a field indicating whether it is completed or not.
 *
 */
export interface Subtask {
  id: number;
  subTaskTitle: string;
  description?: string;
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
          console.error(
            `Database error: ${(event.target as IDBRequest).error}`,
          );
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
        const selectedBoardId = request.result.selectedBoardId;
        if (selectedBoardId) {
          this.selectedBoardIDSubject.next(selectedBoardId);
          resolve();
        } else {
          reject('No selectedBoardId found.');
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
      idStore.put({ id: 1, selectedBoardId: 1 });
      this.selectedBoardIDSubject.next(1);
    });
  }

  /**
   * Creates a new board.
   * Returns a promise that resolves, or rejects with an error message.
   *
   * @param boardData - The data for the new Board
   *
   */
  public createNewBoard(boardData: Board): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not connected.');
        return;
      }

      const newBoard: Board = {
        boardName: boardData.boardName,
        columns: boardData.columns,
      };

      const transaction = this.db.transaction(
        ['boards', 'selectedBoardId'],
        'readwrite',
      );

      const objectStore = transaction.objectStore('boards');
      const boardsRequest = objectStore.add(newBoard); // Add the board

      // On Success, sets the new board as the 'Selected Board', and updates all related observables.
      boardsRequest.onsuccess = (event) => {
        // Set the new board as the 'Selected Board'
        const idStore = transaction.objectStore('selectedBoardId');
        const result = (event.target as IDBRequest<IDBValidKey>)
          .result as number;
        idStore.put({ id: 1, selectedBoardId: result });
        this.selectedBoardIDSubject.next(result);
        this.selectedBoardSubject.next(newBoard);
        this.getAllBoardNames(); // This call is needed to update the boardNames list.
        resolve();
      };
      boardsRequest.onerror = (event) =>
        reject('Error creating default board: ' + event);
    });
  }

  /**
   * Edits the currently selected board by simply replacing it with the new boardData. Could theoretically be the same board, if nothing changed.
   *
   * @remarks The boardId always stays the same, only the boardName and columns can change.
   *
   * @param boardData - The replacement data for the currently selected board. The boardID always stays the same.
   */
  public editCurrentBoard(boardData: Board): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readwrite');
      const objectStore = transaction.objectStore('boards');
      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result as Board;
        selectedBoard.boardName = boardData.boardName;
        selectedBoard.columns = boardData.columns;

        const updateRequest = objectStore.put(selectedBoard);
        updateRequest.onsuccess = () => {
          this.selectedBoardSubject.next(selectedBoard);
          this.getAllBoardNames(); // This call is needed to update the boardNames list. (This could also be conditionally emitted: only if the boardName has changed.)
          resolve();
        };
        updateRequest.onerror = (event) => {
          reject(`Error editing board: ${event}`);
        };
      };

      request.onerror = (event) => {
        reject(`Error editing board: ${event}`);
      };
    });
  }

  /**
   * Creates a new task in the specified column of the selected board.
   * Automatically generates a new unique task ID.
   *
   * @param columnId - The ID of the column where the task should be added.
   * @param taskWithoutId - The task object without the id property.
   */
  public createTask(
    columnId: number,
    taskWithoutId: Omit<Task, 'uniqueId'>,
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      try {
        const newTaskId = uuidv4();
        const newTask: Task = { uniqueId: newTaskId, ...taskWithoutId };

        const transaction = this.db.transaction('boards', 'readwrite');
        const objectStore = transaction.objectStore('boards');
        const request = objectStore.get(this.selectedBoardID);

        request.onsuccess = () => {
          const selectedBoard = request.result as Board;
          const column = selectedBoard.columns.find(
            (col) => col.id === columnId,
          );

          if (column) {
            column.tasks.push(newTask);
            const updateRequest = objectStore.put(selectedBoard);
            updateRequest.onsuccess = () => {
              this.selectedBoardSubject.next(selectedBoard);
              resolve();
            };
            updateRequest.onerror = (event) => {
              reject(`Error creating task: ${event}`);
            };
          } else {
            reject('Column not found.');
          }
        };

        request.onerror = (event) => {
          reject(`Error creating task: ${event}`);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Edits an existing task in the specified column of the selected board.
   *
   * @param columnId - The ID of the column where the task is located.
   * @param taskId - The uniqueId of the task to be edited.
   * @param updatedTask - The updated task object.
   */
  public editTask(
    columnId: number,
    taskId: string,
    updatedTask: Task,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readwrite');
      const objectStore = transaction.objectStore('boards');
      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result as Board;
        const column = selectedBoard.columns.find((col) => col.id === columnId);

        if (column) {
          const taskIndex = column.tasks.findIndex(
            (task) => task.uniqueId === taskId,
          );
          if (taskIndex !== -1) {
            column.tasks[taskIndex] = { ...updatedTask };
            const updateRequest = objectStore.put(selectedBoard);
            updateRequest.onsuccess = () => {
              this.selectedBoardSubject.next(selectedBoard);
              resolve();
            };
            updateRequest.onerror = (event) => {
              reject(`Error editing task: ${event}`);
            };
          } else {
            reject('Task not found.');
          }
        } else {
          reject('Column not found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error editing task: ${event}`);
      };
    });
  }

  /**
   * Deletes an existing task in the specified column of the selected board.
   *
   * @param columnId - The ID of the column where the task is located.
   * @param taskId - The uniqueId of the task to be deleted.
   */
  public deleteTask(columnId: number, taskId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readwrite');
      const objectStore = transaction.objectStore('boards');
      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result as Board;
        const column = selectedBoard.columns.find((col) => col.id === columnId);

        if (column) {
          const taskIndex = column.tasks.findIndex(
            (task) => task.uniqueId === taskId,
          );
          if (taskIndex !== -1) {
            column.tasks.splice(taskIndex, 1);
            const updateRequest = objectStore.put(selectedBoard);
            updateRequest.onsuccess = () => {
              this.selectedBoardSubject.next(selectedBoard);
              resolve();
            };
            updateRequest.onerror = (event) => {
              reject(`Error deleting task: ${event}`);
            };
          } else {
            reject('Task not found.');
          }
        } else {
          reject('Column not found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error deleting task: ${event}`);
      };
    });
  }

  /**
   * Toggles the completion status of a task. If the task is completed, it will be marked as incomplete, and vice versa.
   *
   * @param taskUniqueID - The uniqueId of the task that owns the subtask.
   * @param subtaskIndex - The index of the subtask to be toggled.
   */
  public toggleSubtaskCompletionStatus(
    taskUniqueID: string,
    subtaskIndex: number,
  ): void {
    if (!this.db || !this.selectedBoardID) {
      return;
    }

    const transaction = this.db.transaction('boards', 'readwrite');
    const objectStore = transaction.objectStore('boards');
    const request = objectStore.get(this.selectedBoardID);

    request.onsuccess = () => {
      const selectedBoard = request.result as Board;
      const column = selectedBoard.columns.find((col) =>
        col.tasks.some((task) => task.uniqueId === taskUniqueID),
      );

      if (column) {
        const task = column.tasks.find(
          (task) => task.uniqueId === taskUniqueID,
        );

        if (task) {
          task.subtasks[subtaskIndex].completed =
            !task.subtasks[subtaskIndex].completed;
          const updateRequest = objectStore.put(selectedBoard);
          updateRequest.onsuccess = () => {
            this.selectedBoardSubject.next(selectedBoard);
          };
          updateRequest.onerror = (event) => {
            console.error(`Error toggling subtask completion status: ${event}`);
          };
        }
      }
    };

    request.onerror = (event) => {
      console.error(`Error toggling subtask completion status: ${event}`);
    };
  }

  /**
   * Changes a given Tasks column by adding it to the end of the column.
   *
   * @param taskUniqueID - The uniqueId of the task to be moved.
   * @param newColumnId - The ID of the column where the task should be moved to.
   */
  public changeTaskColumn(taskUniqueID: string, newColumnId: number): void {
    if (!this.db || !this.selectedBoardID) {
      return;
    }

    const transaction = this.db.transaction('boards', 'readwrite');
    const objectStore = transaction.objectStore('boards');
    const request = objectStore.get(this.selectedBoardID);

    request.onsuccess = () => {
      const selectedBoard = request.result as Board;
      const oldColumn = selectedBoard.columns.find((col) =>
        col.tasks.some((task) => task.uniqueId === taskUniqueID),
      );
      const newColumn = selectedBoard.columns.find(
        (col) => col.id === newColumnId,
      );

      if (oldColumn && newColumn) {
        // Find the task in the old column.
        const [task] = oldColumn.tasks.filter(
          (task) => task.uniqueId === taskUniqueID,
        );

        // Remove the task from the old column and add it to the new column.
        oldColumn.tasks = oldColumn.tasks.filter(
          (task) => task.uniqueId !== taskUniqueID,
        );

        newColumn.tasks.push(task);

        const updateRequest = objectStore.put(selectedBoard);
        updateRequest.onsuccess = () => {
          this.selectedBoardSubject.next(selectedBoard);
        };
        updateRequest.onerror = (event) => {
          console.error(`Error changing task column: ${event}`);
        };
      }
    };

    request.onerror = (event) => {
      console.error(`Error changing task column: ${event}`);
    };
  }

  /**
   * Moves a task within the same column via drag and drop.
   *
   * @remarks This function uses the previous and current indexes to move the task and thus is optimized to only be used with the CdkDragDrop event.
   *
   * @param columnId - The ID of the column where the task is located.
   * @param previousIndex - The previous index of the task.
   * @param currentIndex - The current index of the task.
   */
  public moveTaskInColumnViaDragdrop(
    columnId: number,
    previousIndex: number,
    currentIndex: number,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readwrite');
      const objectStore = transaction.objectStore('boards');
      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result as Board;
        const column = selectedBoard.columns.find((col) => col.id === columnId);

        if (column) {
          if (previousIndex !== -1) {
            const [task] = column.tasks.splice(previousIndex, 1);
            column.tasks.splice(currentIndex, 0, task);
            const updateRequest = objectStore.put(selectedBoard);
            updateRequest.onsuccess = () => {
              this.selectedBoardSubject.next(selectedBoard);
              resolve();
            };
            updateRequest.onerror = (event) => {
              reject(`Error moving task: ${event}`);
            };
          } else {
            reject('Task not found.');
          }
        } else {
          reject('Column not found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error moving task: ${event}`);
      };
    });
  }

  /**
   * Moves a task between two specified columns via drag and drop.
   *
   * @remarks This function uses the previous and current indexes to move the task and thus is optimized to only be used with the CdkDragDrop event.
   *
   * @param previousColumnId - The ID of the column where the task was previously located.
   * @param currentColumnId - The ID of the column where the task should be moved to.
   * @param previousIndexOfTask - The index of the task in the previous column.
   * @param currentIndexOfTask - The index where the task should be moved to in the current column.
   */
  public moveTaskBetweenColumnsViaDragdrop(
    previousColumnId: number,
    currentColumnId: number,
    previousIndexOfTask: number,
    currentIndexOfTask: number,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || !this.selectedBoardID) {
        reject('Database or selected board not available.');
        return;
      }

      const transaction = this.db.transaction('boards', 'readwrite');
      const objectStore = transaction.objectStore('boards');
      const request = objectStore.get(this.selectedBoardID);

      request.onsuccess = () => {
        const selectedBoard = request.result as Board;
        const previousColumn = selectedBoard.columns.find(
          (col) => col.id === previousColumnId,
        );
        const currentColumn = selectedBoard.columns.find(
          (col) => col.id === currentColumnId,
        );

        if (previousColumn && currentColumn) {
          if (previousIndexOfTask !== -1 && currentIndexOfTask !== -1) {
            const [task] = previousColumn.tasks.splice(previousIndexOfTask, 1);
            currentColumn.tasks.splice(currentIndexOfTask, 0, task);
            const updateRequest = objectStore.put(selectedBoard);
            updateRequest.onsuccess = () => {
              this.selectedBoardSubject.next(selectedBoard);
              resolve();
            };
            updateRequest.onerror = (event) => {
              reject(`Error moving task: ${event}`);
            };
          } else {
            reject('Task not found.');
          }
        } else {
          reject('Column not found.');
        }
      };

      request.onerror = (event) => {
        reject(`Error moving task: ${event}`);
      };
    });
  }
}
