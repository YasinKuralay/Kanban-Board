import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { FormControl, Validators } from '@angular/forms';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';
import { Board, BoardsService } from '../../../data-layer/boards.service';

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
  public listOfInputTextsIsValid = false;
  public dialogMode: 'create' | 'edit';

  constructor(
    public dialogRef: DialogRef<string>,
    private boardsService: BoardsService,
    @Inject(DIALOG_DATA) public data: any,
  ) {
    if (this.data.isCreateNewBoard) {
      this.dialogMode = 'create';
    } else {
      this.dialogMode = 'edit';
    }
  }

  public actionButton() {
    if (this.boardNameFormControl.valid) {
      // Check if Create or Update Board
      if (this.dialogMode === 'create') {
        // Create new board
        const newBoard: Board = {
          boardName: this.boardNameFormControl.value as string,
          columns: [{ id: 1, columnName: 'To Do', tasks: [] }],
        };
        this.boardsService.createNewBoard(newBoard);
      } else {
        // Edit existing board
      }
      this.dialogRef.close();
    }
  }

  /**
   * Keeps track of whether all FormsControls inside app-list-of-input-texts are valid.
   */
  public checkIfListOfInputTextsIsValid(isValid: boolean) {
    this.listOfInputTextsIsValid = isValid;
  }
}
