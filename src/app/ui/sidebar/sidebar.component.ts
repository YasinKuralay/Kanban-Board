import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { InteractiveBoardsListComponent } from '../interactive-boards-list/interactive-boards-list.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ThemeSwitcherComponent,
    InteractiveBoardsListComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SidebarComponent {
  @Input() isOpen: boolean = false;
  @Output() onToggleSidebar = new EventEmitter<boolean>();

  toggleSidebar() {
    this.onToggleSidebar.emit(!this.isOpen);
  }
}
