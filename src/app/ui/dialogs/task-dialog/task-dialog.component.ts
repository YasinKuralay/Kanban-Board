import {
  ChangeDetectorRef,
  Component,
  Inject,
  ViewEncapsulation,
} from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DropdownComponent } from '../../form/dropdown/dropdown.component';
import {
  BoardsService,
  Column,
  Subtask,
  Task,
} from '../../../data-layer/boards.service';
import { InputTextareaComponent } from '../../form/input-textarea/input-textarea.component';
import { pairwise, startWith, Subscription } from 'rxjs';
import { CheckboxComponent } from '../../form/checkbox/checkbox.component';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    InputTextComponent,
    ListOfInputTextsComponent,
    DropdownComponent,
    InputTextareaComponent,
    CheckboxComponent,
    OverlayModule,
    A11yModule,
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDialogComponent {
  /** Dynamic title for the dialog, based on the dialogMode. */
  public dialogTitle!: string;

  /** Dynamic description for the dialog, based on the dialogMode. */
  public dialogDescription?: string;

  /** Dynamic action-button text for the dialog, based on the dialogMode. */
  public actionButtonText!: string;

  /** The FormControl for the Task Name. Used in Create and Edit dialogMode. */
  public taskNameFormControl = new FormControl('', [Validators.required]);

  /** The FormControl for the Task Description. Used in Create and Edit dialogMode. */
  public taskDescriptionFormControl = new FormControl('');

  /** FormArray that holds the Subtasks, including their title and completed status. This will be used to edit a Task, since we want to keep the completed status even if the title changes. Used in Create and Edit dialogMode. */
  public subtasksFormArray = new FormArray<
    FormGroup<{
      subTaskTitle: FormControl<string | null>;
      completed: FormControl<boolean>;
    }>
  >([]);

  /** FormArray that holds the Subtasks' completion status. Used in View dialogMode. */
  public subtaskCompletionStatusFormArray = new FormArray<FormControl<boolean>>(
    [],
  );

  /**
   * Based on the dialogMode, the dialog will either Create, Edit or View a Task.
   * This determines the behavior of the dialog.
   * The title and action-button text will be dynamically set based on this value.
   */
  public dialogMode: 'create' | 'edit' | 'view';

  /**
   * The index of the column where the Task should be created or edited.
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

  /** The number of completed subtasks, used for displaying in the dialogue. */
  public numOfCompletedSubtasks: number | undefined;

  /** The number of total subtasks, used for displaying in the dialogue. */
  public numOfTotalSubtasks: number | undefined;

  /** The subtasks of the task. */
  public subtasks: Subtask[] = [];

  /** Keeps track of whether the taskOptionsOverlay Overlay is open. Used to open and close it. */
  public taskOptionsOverlayIsOpen = false;

  public taskOptionsOverlayPositions = [
    new ConnectionPositionPair(
      { originX: 'center', originY: 'bottom' },
      { overlayX: 'center', overlayY: 'top' },
      0,
      8,
    ),
  ];

  /**
   * The columns of the board.
   * @required for making the user select which column the task should be created in.
   */
  private columns: Column[] = [];

  /** The task that is being viewed or edited. */
  private task: Task | undefined;

  private selectedBoardSubscription?: Subscription;
  private subtaskCompletionStatusSubscription?: Subscription;

  constructor(
    public dialogRef: DialogRef<string>,
    private boardsService: BoardsService,
    private cdRef: ChangeDetectorRef,
    @Inject(DIALOG_DATA) public data: any,
  ) {
    this.dialogMode = this.data.dialogMode || 'create';

    if (this.dialogMode === 'view' || this.dialogMode === 'edit') {
      this.task = this.data.task;
      this.subtasks = this.task!.subtasks;
      this.subtasks.forEach((subtask) => {
        this.subtaskCompletionStatusFormArray.push(
          new FormControl<boolean>(subtask.completed, { nonNullable: true }),
        );
      });

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
      this.numOfCompletedSubtasks = this.subtasks.filter(
        (subtask) => subtask.completed,
      ).length;
      this.numOfTotalSubtasks = this.subtasks.length;
      // Subscribe to get subtask completion status changes
      this.subtaskCompletionStatusSubscription =
        this.subtaskCompletionStatusFormArray.valueChanges
          .pipe(
            startWith(this.subtaskCompletionStatusFormArray.value),
            pairwise(),
          )
          .subscribe(([previousValues, currentValues]) => {
            // Change the corresponding subtask completion status. changedIndex is the index of the subtask that was changed.
            const changedIndex = currentValues.findIndex(
              (value, index) => value !== previousValues[index],
            );
            this.toggleSubtaskCompletionStatus(changedIndex);

            // Update the number of completed subtasks to display in correctly.
            this.numOfCompletedSubtasks = currentValues.filter(
              (value) => value,
            ).length;
          });
    }
  }

  ngOnDestroy() {
    if (this.dialogMode === 'view') {
      this.selectedBoardSubscription?.unsubscribe();
      this.subtaskCompletionStatusSubscription?.unsubscribe();
    }
  }

  /**
   * Event handler for when the user changes the selected column.
   *
   * @param selectedColumnIdx - The index of the selected column.
   * @param changeImmediately - If true, the task will be moved to the new column immediately (and not when the actionButton is clicked).
   */
  public onSelectedColumnIndexChange(
    selectedColumnIdx: number,
    changeImmediately?: boolean,
  ) {
    this.selectedColumnIndex = selectedColumnIdx;

    if (changeImmediately) {
      // UpdateCurrentBoard
      this.boardsService.changeTaskColumn(
        this.task!.uniqueId,
        this.columns[selectedColumnIdx].id,
      );
    }
  }

  /**
   * Toggles the completion status of a subtask.
   *
   * @param subtaskIndex - The index of the subtask to toggle.
   */
  public toggleSubtaskCompletionStatus(subtaskIndex: number) {
    const subtask = this.subtasks[subtaskIndex];
    subtask.completed = !subtask.completed;

    // BoardsService toggles subtask completion status.
    this.boardsService.toggleSubtaskCompletionStatus(
      this.task!.uniqueId,
      subtaskIndex,
    );
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
        // Uses the formControls to edit the taskData and then updates the task by calling the BoardsService.editTask()
        const editedTask: Task = {
          uniqueId: this.task!.uniqueId,
          title: this.taskNameFormControl.value as string,
          description: this.taskDescriptionFormControl.value as string,
          subtasks: this.subtasksFormArray.controls.map((control, index) => ({
            id: index + 1,
            subTaskTitle: control.value.subTaskTitle as string,
            completed: control.value.completed ? true : false,
          })),
        };

        const columnIdOfTaskBeingEdited =
          this.columns[this.selectedColumnIndex].id;

        this.boardsService.editTask(columnIdOfTaskBeingEdited, editedTask);
      }
      this.dialogRef.close();
    }
  }

  /**
   * Toggles the Edit or Delete Overlay, which is used to provide two options in a popup: Edit Task and Delete Task.
   *
   * @param toggleTo - If true, the overlay will be opened. If false, it will be closed. If not provided, it will be toggled.
   */
  public toggleTaskOptionsOverlay(toggleTo?: boolean) {
    if (toggleTo === true) {
      this.taskOptionsOverlayIsOpen = true;
    } else if (toggleTo === false) {
      this.taskOptionsOverlayIsOpen = false;
    } else {
      this.taskOptionsOverlayIsOpen = !this.taskOptionsOverlayIsOpen;
    }

    if (this.taskOptionsOverlayIsOpen) {
      // Move focus to the first button in the overlay.
      setTimeout(() => {
        (document.querySelector('.edit-task-button') as HTMLElement)?.focus();
      }, 0);
    } else {
      // Move focus back to the task-dialog-options button.
      setTimeout(() => {
        (
          document.querySelector('.task-dialog-options') as HTMLElement
        )?.focus();
      }, 0);
    }
  }

  /**
   * Event handler for when the user clicks the Edit Task button in the Task Options Overlay.
   * It sets all necessary variables for edit-mode and sets the dialogMode to 'edit'.
   *
   * @remarks
   * After this method is called, the dialog will edit the task instead of just viewing it.
   */
  public editTaskClickHandler() {
    this.dialogTitle = 'Edit Task';
    this.actionButtonText = 'Save Changes';
    this.taskNameFormControl.setValue(this.task!.title);
    this.taskDescriptionFormControl.setValue(this.task!.description || '');
    // Clear the current subtasksFormArray and set new values based on the subtasks array.
    this.subtasksFormArray.clear();
    this.subtasks.forEach((subtask) => {
      this.subtasksFormArray.push(
        new FormGroup({
          subTaskTitle: new FormControl(
            subtask.subTaskTitle,
            Validators.required,
          ),
          completed: new FormControl(subtask.completed, { nonNullable: true }),
        }),
      );
    });

    this.toggleTaskOptionsOverlay(false);
    // The actual action that turns the dialog into edit mode.
    this.dialogMode = 'edit';

    // Needed for being able to set focus on one of the newly created elements (because the complete view changes to edit mode).
    this.cdRef.detectChanges();

    // Set focus here
    (document.querySelector('.input-text') as HTMLElement)?.focus();
  }

  /**
   * Event handler for when the user clicks the Delete Task button in the Task Options Overlay.
   * It closes the overlay and deletes the task.
   */
  public deleteTaskClickHandler() {
    this.toggleTaskOptionsOverlay(false);
    this.dialogRef.close();
  }
}
