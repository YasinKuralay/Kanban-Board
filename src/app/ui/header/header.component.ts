import { NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MobileBoardsDialogComponent } from '../dialogs/mobile-boards-dialog/mobile-boards-dialog.component';
import { filter, fromEvent, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, DialogModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  public mobileBoardsDialogIsOpen = false;
  private mobileBoardsDialogRef!: DialogRef<MobileBoardsDialogComponent>;

  @ViewChild('mobileBoardsDialogTrigger') dialogTrigger!: ElementRef;

  constructor(
    private dialog: Dialog,
    private overlay: Overlay,
  ) {}

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
    // Only open the dialogue if it is not already open
    if (!this.mobileBoardsDialogIsOpen) {
      this.mobileBoardsDialogRef =
        this.dialog.open<MobileBoardsDialogComponent>(
          MobileBoardsDialogComponent,
          {
            width: '264px',
            data: {
              dialogType: 'boards',
            },
          },
        );

      // We need to use the Overlay API to set the positionStrategy (in this case: flexibleConnectedTo) for the dialog. It can't be set onto the dialog itself: It is a CDK Overlay under the hood.
      const positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(this.dialogTrigger)
        .withPositions([
          // Preferred positions
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
          // Fallback positions
          {
            originX: 'center',
            originY: 'center',
            overlayX: 'center',
            overlayY: 'center',
          },
        ]);

      // Applying the position strategy.
      this.mobileBoardsDialogRef.overlayRef.updatePositionStrategy(
        positionStrategy,
      );

      // Set the property showing that the dialog is open to true.
      this.mobileBoardsDialogIsOpen = true;

      // Closes the dialog when the viewport width is 768px or more (because this overlay is a mobile one which should only be shown on screens below 768px width).
      fromEvent(window, 'resize')
        .pipe(
          takeUntil(this.mobileBoardsDialogRef.closed), // Stop listening for resize events when the dialog is closed.
          filter(() => window.innerWidth >= 768), // Only emit when the viewport width is 768px or more.
        )
        .subscribe(() => this.mobileBoardsDialogRef.close());

      // Set the mobileBoardsDialogIsOpen to false when the user closes it (e.g. by clicking outside of the dialog).
      this.mobileBoardsDialogRef.closed.subscribe(() => {
        this.mobileBoardsDialogIsOpen = false;
      });
    } else {
      this.mobileBoardsDialogRef?.close();
    }
  }
}
