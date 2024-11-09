import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ElementRef, Injectable } from '@angular/core';
import { MobileBoardsDialogComponent } from './mobile-boards-dialog/mobile-boards-dialog.component';
import { Overlay } from '@angular/cdk/overlay';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, fromEvent, takeUntil } from 'rxjs';
import { BoardDialogComponent } from './board-dialog/board-dialog.component';
import { Board, Column } from '../../data-layer/boards.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';

/**
 * The service for opening/closing any dialog. This service is used to launch dialogs from any component in the application.
 *
 */
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  public mobileBoardsDialogIsOpen = false;
  private mobileBoardsDialogRef!: DialogRef<MobileBoardsDialogComponent>;

  private boardDialogRef!: DialogRef<BoardDialogComponent>;

  constructor(
    private dialog: Dialog,
    private overlay: Overlay,
    private breakpointObserver: BreakpointObserver,
  ) {}

  /**
   * Opens the "Boards Dialog" on the mobile header.
   *
   * @param dialogAnchorPoint - The anchor point for the dialog. This is the button that opens the dialog, and the dialog will be anchored to this via a PositionStrategy.
   *
   * @remarks
   * This dialog is only launched on the mobile header. It will automatically be closed if the user extends the Viewport-Width over 767px, because on tablet+ there is no dialog: Just a navigation bar.
   * The dialog is positioned to be right under the button that opened it, by the use of a PositionStratgy.
   *
   * This method launches an Angular CDK dialog that displays a list of boards. The Dialog additionally includes a light-dark theme toggle.
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  openMobileBoardsDialog(dialogAnchorPoint: ElementRef): void {
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
        .flexibleConnectedTo(dialogAnchorPoint)
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

  /**
   * Opens the "Board Dialog", which is used either for creating or editing a board.
   *
   * @param board - The boardData such as boardName, columns etc. are contained here. Only needed if the dialog is used for editing an existing board.
   * @param isCreateNewBoard - A boolean that determines if the dialog is used for creating a new board or editing an existing one. This determines some strings (e.g. new instead of edit) and the behavior of the dialog upon clicking the primary button.
   *
   * @remarks
   *
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  public openBoardDialog(isCreateNewBoard: boolean, board?: Board): void {
    this.dialog.open<BoardDialogComponent>(BoardDialogComponent, {
      width: '100%',
      maxWidth: 'min(480px, 94%)',
      data: {
        isCreateNewBoard: isCreateNewBoard,
        currentBoard: board || undefined,
      },
    });
  }

  /**
   * Opens the "Task Dialog", which is used for Creating, Editing or Viewing a task.
   *
   * @param dialogMode - The mode of the dialog. This determines the behavior of the dialog.
   * @param columns - The columns of the board. Used to make the user select which column the task should be created in.
   *
   * @remarks
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  public openTaskDialog(
    dialogMode: 'create' | 'edit' | 'view',
    columns: Column[] | undefined,
  ): void {
    if (columns === undefined) {
      console.error('Columns are required for creating a new task.');
    } else {
      this.dialog.open<TaskDialogComponent>(TaskDialogComponent, {
        width: '100%',
        maxWidth: 'min(480px, 94%)',
        data: {
          dialogMode: dialogMode,
          columns: columns,
        },
      });
    }
  }
}
