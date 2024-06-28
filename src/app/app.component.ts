import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BoardsService } from './data-layer/boards.service';
import { HeaderComponent } from './ui/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(
    private boardsService: BoardsService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  async ngOnInit() {
    this.applyTheme();
    await this.boardsService.initBoardsServiceAndGetSelectedBoard();
  }

  /**
   * Checks if in localstorage there is a theme stored and applies it.
   *
   */
  private applyTheme() {
    const theme = localStorage.getItem('theme') || 'light'; // Default to 'light' if nothing is stored
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
