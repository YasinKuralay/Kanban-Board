import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  constructor(private boardsService: BoardsService) {}

  async ngOnInit() {
    await this.boardsService.initBoardsServiceAndGetSelectedBoard();
  }
}
