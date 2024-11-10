import {
  Component,
  EventEmitter,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { BoardName, BoardsService } from '../../data-layer/boards.service';
import { NgClass } from '@angular/common';
import { SvgLoaderComponent } from '../svg-loader/svg-loader.component';
import { DialogService } from '../dialogs/dialog.service';

@Component({
  selector: 'app-interactive-boards-list',
  standalone: true,
  imports: [NgClass, SvgLoaderComponent],
  templateUrl: './interactive-boards-list.component.html',
  styleUrl: './interactive-boards-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InteractiveBoardsListComponent {
  @Output() boardSelectedEvent = new EventEmitter<void>();

  private selectedBoardIDSubscription: Subscription;
  public selectedBoardID: number | undefined;

  private boardNamesSubscription: Subscription;
  public boardNamesWithUID: BoardName[] | undefined;

  constructor(
    private boardsService: BoardsService,
    private dialogService: DialogService,
  ) {
    this.selectedBoardIDSubscription =
      this.boardsService.selectedBoardID$.subscribe((boardID) => {
        this.selectedBoardID = boardID;
      });

    this.boardNamesSubscription = this.boardsService.boardNames$.subscribe(
      (boardNames) => {
        this.boardNamesWithUID = boardNames;
      },
    );
  }

  ngOnDestroy() {
    this.selectedBoardIDSubscription.unsubscribe();
    this.boardNamesSubscription.unsubscribe();
  }

  /**
   * Sets the selectedBoardId and emits an event so that the parent component can react if needed, for example by closing a dialog.
   *
   */
  public setSelectedBoardId(boardID: number) {
    this.boardsService.setSelectedBoardId(boardID);
    this.boardSelectedEvent.emit();
  }

  public launchCreateBoardDialog() {
    this.dialogService.openBoardDialog(true);
  }
}
