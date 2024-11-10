import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';
import { Board, BoardsService } from '../../../data-layer/boards.service';

/**
 * Data that is passed to the dialog via injection of DIALOG_DATA.
 */
interface BoardDialogData {
  /** If this is true, the board is launched in 'create' mode, otherwise it's 'edit' mode */
  isCreateNewBoard: boolean;
  /** If in 'edit' mode, the entire currentBoard to manipulate. */
  currentBoard?: Board;
}

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [InputTextComponent, ListOfInputTextsComponent],
  templateUrl: './board-dialog.component.html',
  styleUrl: './board-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BoardDialogComponent {
  public boardNameFormControl = new FormControl('', [Validators.required]);
  public listOfInputTextsFormArray = new FormArray<FormControl<string | null>>(
    [],
  );
  public dialogMode: 'create' | 'edit';

  constructor(
    public dialogRef: DialogRef<string>,
    private boardsService: BoardsService,
    @Inject(DIALOG_DATA) public data: BoardDialogData,
  ) {
    if (this.data.isCreateNewBoard) {
      this.dialogMode = 'create';
    } else {
      this.dialogMode = 'edit';
    }
  }

  ngOnInit() {
    if (this.dialogMode === 'edit') {
      // Fill in the current board name
      this.boardNameFormControl.setValue(this.data.currentBoard!.boardName);

      // Fill in the current column names
      this.data.currentBoard?.columns.forEach((column) => {
        this.listOfInputTextsFormArray.push(
          new FormControl(column.columnName, [Validators.required]),
        );
      });
    }
  }

  /**
   * The action button that is displayed at the bottom of the dialog.
   * Does different things based on whether the dialog is in 'create' or 'edit' mode.
   */
  public actionButton() {
    if (this.boardNameFormControl.valid) {
      // Check if Create or Update Board
      if (this.dialogMode === 'create') {
        // Loops over the formArray to create the columns
        const columns = this.listOfInputTextsFormArray.controls.map(
          (control, index) => ({
            id: index + 1,
            columnName: control.value as string,
            tasks: [],
          }),
        );

        // Creates the new board
        const newBoard: Board = {
          boardName: this.boardNameFormControl.value as string,
          columns: columns,
        };
        this.boardsService.createNewBoard(newBoard);
      } else if (this.dialogMode === 'edit') {
        // Same columns (based on index of the column) should contain same tasks.
        const columns = this.listOfInputTextsFormArray.controls.map(
          (control, index) => ({
            id: index + 1,
            columnName: control.value as string,
            tasks: this.data.currentBoard?.columns[index]?.tasks || [], // This behavior is intentional, but could potentially be changed.
          }),
        );

        // The edited Board keeps the same ID as the current board, and only changes columns and boardName if they were actually edited.
        const editedBoard: Board = {
          id: this.data.currentBoard!.id,
          boardName: this.boardNameFormControl.value as string,
          columns: columns,
        };

        this.boardsService.editCurrentBoard(editedBoard);
      }
      this.dialogRef.close();
    }
  }
}
