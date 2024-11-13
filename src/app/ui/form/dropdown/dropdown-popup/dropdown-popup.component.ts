import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import { COMPONENT_OVERLAY_REF } from '../dropdown.component';

@Component({
  selector: 'app-dropdown-popup',
  standalone: true,
  imports: [],
  templateUrl: './dropdown-popup.component.html',
  styleUrl: './dropdown-popup.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DropdownPopupComponent {
  /**
   * The reference to the dropdown-list element.
   * Used to focus the options in the list.
   */
  @ViewChild('dropdownList') dropdownList?: ElementRef;
  /**
   * The event emitted when an option from the list is selected.
   */
  @Output() optionSelected = new EventEmitter<number>();
  /**
   * The index of the selected option.
   * If no option is selected, the index is -1.
   */
  @Input() selectedOptionIndex: number = -1;

  /** A string-only array of dropdownItems, used to render the options in the dropdown. */
  @Input() dropdownItemsAsStrings: string[] = [];

  constructor(
    @Inject(COMPONENT_OVERLAY_REF) private overlayRef: OverlayRef, // The overlay reference to the dropdown-popup. Used to be able to close it from within here.
  ) {}

  // Focus the selected or first option after the view has been initialized.
  ngAfterViewInit() {
    // Set focus on the seleted option, if there is one.
    if (this.selectedOptionIndex !== -1) {
      // We need to use setTimeout because of an ExpressionChangedAfterItHasBeenCheckedError. Unfortunately, using ChangeDetectorRef.detectChanges() does not work.
      setTimeout(() => {
        this.focusOption(this.selectedOptionIndex);
      }, 0);
    } else {
      // Otherwise, focus the first option.
      setTimeout(() => {
        this.focusOption(0);
      }, 0);
    }
  }

  // Close the dropdown-popup on ESC keydown.
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.overlayRef.dispose();
  }

  /**
   * Handles the Space, and Enter, Tab, Arrowup and Arrowdown keydown events on the dropdown-list items.
   * Either selects or focuses the option at the given index, by calling the selectOption or focusOption methods with the index.
   */
  public handleKeydownOnListItem(event: KeyboardEvent, idx: number) {
    event.preventDefault();

    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
      this.selectOption(idx);
    } else if (event.key === 'ArrowUp') {
      idx = Math.max(0, idx - 1); // Ensures index is not negative.
      this.focusOption(idx);
    } else if (event.key === 'ArrowDown') {
      idx = Math.min(this.dropdownItemsAsStrings.length - 1, idx + 1); // Ensures index is not out of bounds.
      this.focusOption(idx);
    }
  }

  /**
   * Focuses the option at the given index.
   */
  private focusOption(index: number) {
    const optionElements =
      this.dropdownList?.nativeElement.querySelectorAll('li');
    if (optionElements && optionElements[index]) {
      optionElements[index].focus();
    }
  }

  /**
   * Emits the option at the given index, closes the dropdown-list and sets the focus back on the dropdownHeader.
   */
  public selectOption(index: number) {
    this.overlayRef.dispose();
    this.optionSelected.emit(index);
  }
}
