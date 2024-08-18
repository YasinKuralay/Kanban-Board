import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { InputTextComponent } from '../../form/input-text/input-text.component';

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [InputTextComponent],
  templateUrl: './board-dialog.component.html',
  styleUrl: './board-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BoardDialogComponent {
  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
  ) {}
}
