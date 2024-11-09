import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { BoardsService, Column, Task } from '../../data-layer/boards.service';
import { TaskComponent } from '../task/task.component';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { TaskMovedBetweenColumns } from '../../interfaces/task-moved-between-columns.interface';

@Component({
  selector: 'app-tasks-column',
  standalone: true,
  imports: [TaskComponent, CdkDrag, CdkDropList],
  templateUrl: './tasks-column.component.html',
  styleUrl: './tasks-column.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TasksColumnComponent {
  @HostBinding('class') class = 'tasks-column';

  @Input({ required: true }) public columnData!: Column;

  /**
   * The event that is emitted when a task is moved between columns.
   *
   * @remarks
   * The reason this is emitted is because one TaskColumn can't directly change the state of another TaskColumn.
   * The AppComponent listens for this event and first optimisticly updates the UI, then calls the service method to update the database.
   */
  @Output() taskMovedBetweenColumns =
    new EventEmitter<TaskMovedBetweenColumns>();

  constructor(private boardsService: BoardsService) {}

  /**
   * When a task is dragged and dropped, this function is called.
   *
   * @remarks
   * This function currently only supports moving tasks within the same column.
   * The function updates the UI before the database action is complete: If the database fails to save the new state, the UI is restored to its previous state.
   *
   * @param event The event that is triggered when a task is dropped.
   */
  public taskDragAndDropped(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      /** The backup of the tasks array is created to restore the array if the database fails to save the new state. */
      const backupOfTasks = [...this.columnData.tasks];

      // Calling moveItemInArray before the service method prevents the "dropped Task" from flickering, since IndexedDB takes a bit of time to update it all.
      moveItemInArray(
        this.columnData.tasks,
        event.previousIndex,
        event.currentIndex,
      );

      this.boardsService
        .moveTaskInColumn(
          this.columnData.id,
          event.previousIndex,
          event.currentIndex,
        )
        .catch((error) => {
          console.error(
            'Error moving task in the database, restoring array to its previous state:',
            error,
          );
          this.columnData.tasks = [...backupOfTasks];
        });
    } else {
      // Emit event to app.component which will optimisticly update the UI.
      // data[0] is the columnId: We defined this in the HTML template under cdkDropListData.
      this.taskMovedBetweenColumns.emit({
        previousColumnId: Number(event.previousContainer.data[0]),
        currentColumnId: Number(event.container.data[0]),
        previousIndexOfTask: event.previousIndex,
        currentIndexOfTask: event.currentIndex,
      });
    }
  }
}
