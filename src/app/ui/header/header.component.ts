import { NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DialogService } from '../dialogs/dialog.service';
import { Subscription } from 'rxjs';
import { Board, BoardsService } from '../../data-layer/boards.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  public mobileBoardsDialogIsOpen = false;
  private selectedBoardSubscription: Subscription;
  public selectedBoard: Board | undefined;

  @ViewChild('mobileBoardsDialogAnchorPoint')
  mobileBoardsDialogAnchorPoint!: ElementRef;

  @Input() sidebarIsOpen = false;

  constructor(
    private dialogService: DialogService,
    private boardsService: BoardsService,
  ) {
    this.selectedBoardSubscription =
      this.boardsService.selectedBoard$.subscribe((board) => {
        this.selectedBoard = board;
      });
  }

  ngOnDestroy() {
    this.selectedBoardSubscription.unsubscribe();
  }

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
  public openMobileBoardsDialog() {
    this.dialogService.openMobileBoardsDialog(
      this.mobileBoardsDialogAnchorPoint,
    );
  }

  /**
   * Opens the "Create Task Dialog".
   *
   * @remarks
   * This method launches an Angular CDK dialog that allows the user to create a new board.
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  public openCreateTaskDialog() {
    this.dialogService.openTaskDialog(
      'create',
      undefined,
      this.selectedBoard?.columns,
    );
  }
}
