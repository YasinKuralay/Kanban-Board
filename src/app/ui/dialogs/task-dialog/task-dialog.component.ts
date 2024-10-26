import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DropdownComponent } from '../../form/dropdown/dropdown.component';
import {
  BoardsService,
  Subtask,
  Task,
} from '../../../data-layer/boards.service';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [InputTextComponent, ListOfInputTextsComponent, DropdownComponent],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDialogComponent {
  /**
   * Dynamic title for the dialog, based on the dialogMode.
   */
  public dialogTitle!: string;
  /**
   * Dynamic action-button text for the dialog, based on the dialogMode.
   */
  public actionButtonText!: string;
  /**
   * The FormControl for the Task Name. Used in Create and Edit dialogMode.
   */
  public taskNameFormControl = new FormControl('', [Validators.required]);
  /**
   * FormArray that holds the Subtasks. Used in Create and Edit dialogMode.
   */
  public subtasksFormArray = new FormArray<FormControl<string | null>>([]);
  /**
   * Based on the dialogMode, the dialog will either Create, Edit or View a Task.
   * This determines the behavior of the dialog.
   * The title and action-button text will be dynamically set based on this value.
   */
  public dialogMode: 'create' | 'edit' | 'view';
  /**
   * The ID of the column that the task will be created in.
   * @required for creating a new task.
   */
  private columnId: number;

  constructor(
    public dialogRef: DialogRef<string>,
    private boardsService: BoardsService,
    @Inject(DIALOG_DATA) public data: any,
  ) {
    this.dialogMode = this.data.dialogMode || 'create';
    this.columnId = this.data.columnId;

    if (this.dialogMode === 'create') {
      this.dialogTitle = 'Add New Task';
      this.actionButtonText = 'Create Task';
    }
  }

  /**
   * Action button for the dialog.
   * It does different things based on the dialogMode.
   *
   * - Create: Creates a new Task and adds it to the column.
   * - Edit: Edits the existing Task.
   *
   * @remarks
   * This button is always the final action button in the dialog, and causes it to close.
   */
  public actionButton() {
    if (this.taskNameFormControl.valid) {
      // Check if Create, Edit or View Task
      if (this.dialogMode === 'create') {
        // Loops over the formArray to create the Subtasks
        const subtasks: Subtask[] = this.subtasksFormArray.controls.map(
          (control, index) => ({
            id: index + 1,
            subTaskTitle: control.value as string,
            completed: false,
          }),
        );

        // Creates the new Task
        const newTask: Omit<Task, 'id'> = {
          title: this.taskNameFormControl.value as string,
          subtasks: subtasks,
        };
        this.boardsService.createTask(this.columnId, newTask);
      } else {
        // Edit existing Task
      }
      this.dialogRef.close();
    }
  }
}
