import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Board, BoardsService } from './data-layer/boards.service';
import { HeaderComponent } from './ui/header/header.component';
import { SidebarComponent } from './ui/sidebar/sidebar.component';
import { Subscription } from 'rxjs';
import { TasksColumnComponent } from './ui/tasks-column/tasks-column.component';
import { DropdownComponent } from './ui/form/dropdown/dropdown.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    TasksColumnComponent,
    DropdownComponent,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  constructor(
    private boardsService: BoardsService,
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
}
