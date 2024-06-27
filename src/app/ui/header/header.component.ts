import { NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { MobileBoardsDialogComponent } from '../dialogs/mobile-boards-dialog/mobile-boards-dialog.component';
import { DialogService } from '../dialogs/dialog.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, DialogModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  public mobileBoardsDialogIsOpen = false;

  @ViewChild('mobileBoardsDialogAnchorPoint')
  mobileBoardsDialogAnchorPoint!: ElementRef;

  constructor(private dialogService: DialogService) {}

  /**
   * Opens the "Boards Dialog" on the mobile header.
   *
   * @remarks
   * This dialog is only launched on the mobile header. It will automatically be closed if the user extends the Viewport-Width over 767px, because on tablet+ there is no dialog: Just a navigation bar.
   * The dialog is positioned to be right under the button that opened it, by the use of a PositionStratgy.
   *
   * This method launches an Angular CDK dialog that displays a list of boards. The Dialog additionally includes a light-dark theme toggle.
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  openMobileBoardsDialog() {
    this.dialogService.openMobileBoardsDialog(
      this.mobileBoardsDialogAnchorPoint,
    );
  }
}
