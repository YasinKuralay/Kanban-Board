import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { SvgLoaderComponent } from '../../svg-loader/svg-loader.component';
import { Subscription } from 'rxjs';
import { BoardsService, BoardName } from '../../../data-layer/boards.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-mobile-boards-dialog',
  standalone: true,
  imports: [NgClass, SvgLoaderComponent],
  templateUrl: './mobile-boards-dialog.component.html',
  styleUrl: './mobile-boards-dialog.component.scss',
  encapsulation: ViewEncapsulation.None, // Encapsulation is set to none to allow for the dialog to apply its styles to its children.
})
export class MobileBoardsDialogComponent implements OnDestroy {
  private selectedBoardIDSubscription: Subscription;
  public selectedBoardID: number | undefined;

  private boardNamesSubscription: Subscription;
  public boardNamesWithUID: BoardName[] | undefined;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
    private boardsService: BoardsService,
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

  public setSelectedBoardId(boardID: number) {
    this.boardsService.setSelectedBoardId(boardID);
    this.dialogRef.close();
  }
}
