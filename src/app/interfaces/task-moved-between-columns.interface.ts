/**
 * The data needed to update the state of the app when a task is moved between columns.
 */
export interface TaskMovedBetweenColumns {
  previousColumnId: number;
  currentColumnId: number;
  previousIndexOfTask: number;
  currentIndexOfTask: number;
}
