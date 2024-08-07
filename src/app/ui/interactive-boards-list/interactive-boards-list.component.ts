import { Component, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { BoardName, BoardsService } from '../../data-layer/boards.service';
import { NgClass } from '@angular/common';
import { SvgLoaderComponent } from '../svg-loader/svg-loader.component';

@Component({
  selector: 'app-interactive-boards-list',
  standalone: true,
  imports: [NgClass, SvgLoaderComponent],
  templateUrl: './interactive-boards-list.component.html',
  styleUrl: './interactive-boards-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InteractiveBoardsListComponent {
  private selectedBoardIDSubscription: Subscription;
  public selectedBoardID: number | undefined;

  private boardNamesSubscription: Subscription;
  public boardNamesWithUID: BoardName[] | undefined;

  constructor(private boardsService: BoardsService) {
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
  }
}
