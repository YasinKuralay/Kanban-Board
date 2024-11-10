import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DropdownComponent } from '../../form/dropdown/dropdown.component';
import {
  BoardsService,
  Column,
  Subtask,
  Task,
} from '../../../data-layer/boards.service';
import { InputTextareaComponent } from '../../form/input-textarea/input-textarea.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    InputTextComponent,
    ListOfInputTextsComponent,
    DropdownComponent,
    InputTextareaComponent,
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDialogComponent {
  /**
   * Dynamic title for the dialog, based on the dialogMode.
   */
  public dialogTitle!: string;

  public dialogDescription?: string;

  /**
   * Dynamic action-button text for the dialog, based on the dialogMode.
   */
  public actionButtonText!: string;

  /**
   * The FormControl for the Task Name. Used in Create and Edit dialogMode.
   */
  public taskNameFormControl = new FormControl('', [Validators.required]);

  /**
   * The FormControl for the Task Description. Used in Create and Edit dialogMode.
   */
  public taskDescriptionFormControl = new FormControl('');

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
   * The index of the column where the Task should be created.
   * Please keep in mind that index in the columns array will probably not correspond to the id of the column!
   *
   * @remarks
   * This can be made dynamic in the future by passing it via the DIALOG_DATA.
   */
  public selectedColumnIndex: number = 0;

  /**
   * The names of the columns.
   * Used for the dropdown in the dialog.
   */
  public columnsOnlyNames: string[] = [];

  /**
   * The columns of the board.
   * @required for making the user select which column the task should be created in.
   */
  private columns: Column[] = [];

  private selectedBoardSubscription?: Subscription;

  public task: Task | undefined;

  public completedSubtasks: number | undefined;

  constructor(
    public dialogRef: DialogRef<string>,
    private boardsService: BoardsService,
    @Inject(DIALOG_DATA) public data: any,
  ) {
    this.dialogMode = this.data.dialogMode || 'create';

    if (this.dialogMode === 'view' || this.dialogMode === 'edit') {
      this.task = this.data.task;

      // Get all columnNames from the columns, and find out which column the Task is in.
      this.selectedBoardSubscription =
        this.boardsService.selectedBoard$.subscribe((board) => {
          this.columns = board!.columns;

          // Loop over all board columns: Save each columnName in the columnsOnlyNames array, and find out which column the Task is in.
          // The .some instead of .forEach is used to break the loop once the Task is found.
          this.columns.some((column) => {
            // @Performance: This could be optimized by passing the currentColumnId to the TaskComponents.
            // The .some instead of .forEach is used to break the loop once the Task is found.
            return column.tasks.some((task) => {
              if (task.uniqueId === this.task!.uniqueId) {
                this.selectedColumnIndex = this.columns.findIndex(
                  (col) => col.id === column.id,
                );
                this.task = task;
                return true;
              }
              return false;
            });
          });

          // Extract the column names from the columns.
          this.columnsOnlyNames = board!.columns.map(
            (column) => column.columnName,
          );
        });
    }

    if (this.dialogMode === 'create') {
      this.dialogTitle = 'Add New Task';
      this.actionButtonText = 'Create Task';
      this.columns = this.data.columns;
      this.columnsOnlyNames = this.columns.map((column) => column.columnName);
    } else if (this.dialogMode === 'edit') {
      this.dialogTitle = 'Edit Task';
      this.actionButtonText = 'Save Changes';
    } else if (this.dialogMode === 'view') {
      this.dialogTitle = this.task!.title || '';
      this.dialogDescription = this.task!.description || '';
    }
  }

  ngOnDestroy() {
    if (this.dialogMode === 'view') {
      this.selectedBoardSubscription?.unsubscribe();
    }
  }

  /**
   * Event handler for when the user changes the selected column.
   */
  public onSelectedColumnIndexChange(
    selectedColumnIdx: number,
    changeImmediately?: boolean,
  ) {
    this.selectedColumnIndex = selectedColumnIdx;

    if (changeImmediately) {
      // UpdateCurrentBoard
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
        const newTask: Omit<Task, 'uniqueId'> = {
          title: this.taskNameFormControl.value as string,
          description: (this.taskDescriptionFormControl.value as string) || '',
          subtasks: subtasks,
        };

        this.boardsService.createTask(
          this.columns[this.selectedColumnIndex].id,
          newTask,
        );
      } else if (this.dialogMode === 'edit') {
        // Uses the formControls to edit the taskData and then updates the task by calling the BoardsService.editCurrentBoard.
      }
      this.dialogRef.close();
    }
  }
}
