import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { SvgLoaderComponent } from '../../svg-loader/svg-loader.component';
import { NgClass } from '@angular/common';
import { ThemeSwitcherComponent } from '../../theme-switcher/theme-switcher.component';
import { InteractiveBoardsListComponent } from '../../interactive-boards-list/interactive-boards-list.component';

@Component({
  selector: 'app-mobile-boards-dialog',
  standalone: true,
  templateUrl: './mobile-boards-dialog.component.html',
  styleUrl: './mobile-boards-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgClass,
    SvgLoaderComponent,
    ThemeSwitcherComponent,
    InteractiveBoardsListComponent,
  ],
})
export class MobileBoardsDialogComponent {
  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
  ) {}

  public closeDialog() {
    this.dialogRef.close();
  }
}
