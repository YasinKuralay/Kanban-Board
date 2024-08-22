import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';
import { FormControl, Validators } from '@angular/forms';
import { ListOfInputTextsComponent } from '../../form/list-of-input-texts/list-of-input-texts.component';

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

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
  ) {
    console.log('this.data is: ', this.data.isCreateNewBoard);
  }

  public actionButton() {
    if (this.boardNameFormControl.valid) {
      // Check if Create or Update Board
      if (this.data.isCreateNewBoard) {
        // Create new board
      } else {
        // Edit existing board
      }
      this.dialogRef.close();
    } else {
      // Show error message
    }
  }

  /**
   * Keeps track of whether all FormsControls inside app-list-of-input-texts are valid.
   */
  public checkIfListOfInputTextsIsValid(isValid: boolean) {
    this.listOfInputTextsIsValid = isValid;
  }
}
