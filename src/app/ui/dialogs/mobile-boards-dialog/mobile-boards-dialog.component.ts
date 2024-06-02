import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';

@Component({
  selector: 'app-mobile-boards-dialog',
  standalone: true,
  imports: [],
  templateUrl: './mobile-boards-dialog.component.html',
  styleUrl: './mobile-boards-dialog.component.scss',
})
export class MobileBoardsDialogComponent {
  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
  ) {}
}
