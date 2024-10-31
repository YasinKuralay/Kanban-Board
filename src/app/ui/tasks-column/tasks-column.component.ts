import {
  Component,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { BoardsService, Column } from '../../data-layer/boards.service';
import { TaskComponent } from '../task/task.component';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragPlaceholder,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tasks-column',
  standalone: true,
  imports: [TaskComponent, CdkDrag, CdkDropList, CdkDragPlaceholder],
  templateUrl: './tasks-column.component.html',
  styleUrl: './tasks-column.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TasksColumnComponent {
  @HostBinding('class') class = 'tasks-column';

  @Input({ required: true }) public columnData!: Column;

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
  }
}
