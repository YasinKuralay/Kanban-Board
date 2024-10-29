import {
  Component,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Column, Task } from '../../data-layer/boards.service';
import { TaskComponent } from '../task/task.component';

@Component({
  selector: 'app-tasks-column',
  standalone: true,
  imports: [TaskComponent],
  templateUrl: './tasks-column.component.html',
  styleUrl: './tasks-column.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TasksColumnComponent {
  @HostBinding('class') class = 'tasks-column';

  @Input({ required: true }) public columnData!: Column;
}
