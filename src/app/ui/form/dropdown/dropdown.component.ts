import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { createPopper } from '@popperjs/core';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DropdownComponent implements OnDestroy {
  @ViewChild('dropdownHeader') dropdownHeader!: ElementRef;
  @ViewChild('dropdownList') dropdownList?: ElementRef;

  @Input() options: string[] = [];
  @Input() selectedOptionIndex: number = -1;
  @Output() selectedOptionIndexChange = new EventEmitter<number>();

  /**
   * Keeps track of whether the dropdown-list is open or closed.
   */
  isOpen = false;
  popperInstance: any;

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnDestroy() {
    this.destroyPopperInstance();
  }

  createPopperInstance() {
    if (this.dropdownHeader && this.dropdownList) {
      this.popperInstance = createPopper(
        this.dropdownHeader.nativeElement,
        this.dropdownList.nativeElement,
        {
          placement: 'bottom', // Default placement
          modifiers: [
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['top'], // Flip to top if not enough space below
              },
            },
          ],
        },
      );
    }
  }

  destroyPopperInstance() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.cdRef.detectChanges();
      this.createPopperInstance();
    } else {
      this.destroyPopperInstance();
    }
  }

  selectOption(index: number) {
    this.selectedOptionIndex = index;
    this.selectedOptionIndexChange.emit(index);
    this.isOpen = false;
  }
}
