import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { CdkDropListGroup, transferArrayItem } from '@angular/cdk/drag-drop';
import { Board, BoardsService } from './data-layer/boards.service';
import { HeaderComponent } from './ui/header/header.component';
import { SidebarComponent } from './ui/sidebar/sidebar.component';
import { Subscription } from 'rxjs';
import { TasksColumnComponent } from './ui/tasks-column/tasks-column.component';
import { TaskMovedBetweenColumns } from './interfaces/task-moved-between-columns.interface';
import { DialogService } from './ui/dialogs/dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    TasksColumnComponent,
    CdkDropListGroup,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  constructor(
    private boardsService: BoardsService,
    private dialogService: DialogService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  private selectedBoardSubscription!: Subscription;
  public selectedBoard: Board | undefined;

  public sidebarIsOpen: boolean = false;

  async ngOnInit() {
    this.applyTheme();
    await this.boardsService.initBoardsServiceAndGetSelectedBoard();
    this.selectedBoardSubscription =
      this.boardsService.selectedBoard$.subscribe((board) => {
        this.selectedBoard = board;
      });
  }

  ngOnDestroy() {
    this.selectedBoardSubscription.unsubscribe();
  }

  /**
   * Checks if in localstorage there is a theme stored and applies it.
   *
   */
  private applyTheme() {
    const theme = localStorage.getItem('theme') || 'light'; // Default to 'light' if nothing is stored
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  public toggleSidebar() {
    this.sidebarIsOpen = !this.sidebarIsOpen;
  }

  public createNewColumn() {
    this.dialogService.openBoardDialog(false, this.selectedBoard);
  }

  /**
   * When a task is moved between columns, this function is called.
   *
   * @remarks
   * The reason this function is called here is because one TaskColumn can't directly change the state of another TaskColumn.
   * The AppComponent listens for this event and first optimistically updates the UI, then calls the service method to update the database.
   * If the database fails to save the new state, the UI is restored to its previous state.
   *
   * @param event Contains all necessary data to update the the position of the dragged Task.
   */
  public onTaskMovedBetweenColumns(event: TaskMovedBetweenColumns) {
    // Find the columns by columnId
    const previousColumn = this.selectedBoard!.columns.find(
      (column) => column.id === event.previousColumnId,
    );
    const currentColumn = this.selectedBoard!.columns.find(
      (column) => column.id === event.currentColumnId,
    );

    if (!previousColumn || !currentColumn) {
      console.error(
        'Could not find columns with the given IDs:',
        previousColumn,
        currentColumn,
      );
      return;
    }

    // The backups will be used to revert state in case the database action fails after the optimistic UI update.
    const backupOfPreviousColumnTasks = [...previousColumn.tasks];
    const backupOfCurrentColumnTasks = [...currentColumn.tasks];

    // Optimistic update
    transferArrayItem(
      previousColumn.tasks,
      currentColumn.tasks,
      event.previousIndexOfTask,
      event.currentIndexOfTask,
    );

    // Update the board in the service
    this.boardsService
      .moveTaskBetweenColumnsViaDragdrop(
        event.previousColumnId,
        event.currentColumnId,
        event.previousIndexOfTask,
        event.currentIndexOfTask,
      )
      .catch((error) => {
        console.error(
          'Error moving task between columns, restoring array to its previous state:',
          error,
        );
        previousColumn.tasks = [...backupOfPreviousColumnTasks];
        currentColumn.tasks = [...backupOfCurrentColumnTasks];
      });
  }
}
