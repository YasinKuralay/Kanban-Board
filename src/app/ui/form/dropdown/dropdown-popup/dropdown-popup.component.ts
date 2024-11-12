import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DROPDOWN_DATA, COMPONENT_OVERLAY_REF } from '../dropdown.component';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dropdown-popup',
  standalone: true,
  imports: [],
  templateUrl: './dropdown-popup.component.html',
  styleUrl: './dropdown-popup.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DropdownPopupComponent {
  @ViewChild('dropdownList') dropdownList?: ElementRef;

  /**
   * The index of the selected option.
   * If no option is selected, the index is -1.
   */
  @Input() selectedOptionIndex: number = -1;

  /** A string-only array of dropdownItems, used to render the options in the dropdown. */
  public dropdownItemsAsStrings: string[] = [];

  constructor(
    @Inject(DROPDOWN_DATA) public data: any,
    @Inject(COMPONENT_OVERLAY_REF) private overlayRef: OverlayRef, // The overlay reference to the dropdown-popup. Used to be able to close it from within here.
  ) {}

  ngOnInit() {
    this.dropdownItemsAsStrings = this.data.dropdownItems;
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.overlayRef.dispose();
  }

  public onDropdownItemClick(index: number) {}

  /**
   * Handles the Space, and Enter, Tab, Arropup and Arropdown keydown events on the dropdown-list items.
   * Either selects or focuses the option at the given index, by calling the selectOption or focusOption methods with the index.
   */
  public handleKeydownOnListItem(event: KeyboardEvent, idx: number) {
    event.preventDefault();

    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
      this.selectOption(idx);
    } else if (event.key === 'ArrowUp') {
      idx = Math.max(0, idx - 1); // Ensures idx is not negative.
      this.focusOption(idx);
    } else if (event.key === 'ArrowDown') {
      idx = Math.min(this.dropdownItemsAsStrings.length - 1, idx + 1); // Ensures idx is not out of bounds.
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
   * Selects the option at the given index, closes the dropdown-list and sets the focus back on the dropdownHeader.
   * Emits the selectedOptionIndexChange event with the index.
   */
  public selectOption(index: number) {
    this.overlayRef.dispose();
    // this.selectedOptionIndex = index;
    // this.selectedOptionIndexChange.emit(index);
    // this.dropdownHeader.nativeElement.focus();
    // this.isOpen = false;
  }

  // public closeDialog() {
  // this.dialogRef.close();
  // }
}
