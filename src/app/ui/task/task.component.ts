import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  ViewEncapsulation,
} from '@angular/core';
import { Task } from '../../data-layer/boards.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskComponent implements OnChanges {
  @HostBinding('class') class = 'task';

  @Input({ required: true }) public task!: Task;

  public taskTitle!: string;

  /**
   * The number of subtasks that are done.
   * Calculated in ngOnInit.
   */
  public numOfDoneSubtasks!: number;

  /**
   * The number of total subtasks.
   * Calculated in ngOnInit.
   */
  public numOfTotalSubtasks!: number;

  ngOnChanges() {
    console.log('this.task is: ', this.task);
    this.taskTitle = this.task.title;
    this.numOfDoneSubtasks = this.task.subtasks.filter(
      (subtask) => subtask.completed,
    ).length;
    this.numOfTotalSubtasks = this.task.subtasks.length;
  }
}
