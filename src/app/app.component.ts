import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BoardsService } from './data-layer/boards.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(private boardsService: BoardsService) {}

  async ngOnInit() {
    await this.boardsService.initBoardsServiceAndGetSelectedBoard();
  }
}
