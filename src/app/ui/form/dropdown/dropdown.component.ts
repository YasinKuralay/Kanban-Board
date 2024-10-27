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

  /**
   * The options that are displayed in the dropdown-list.
   */
  @Input() options: string[] = [];

  /**
   * The index of the selected option.
   * If no option is selected, the index is -1.
   */
  @Input() selectedOptionIndex: number = -1;

  /**
   * Emits the index of the selected option when the option is changed.
   */
  @Output() selectedOptionIndexChange = new EventEmitter<number>();

  /**
   * Keeps track of whether the dropdown-list is open or closed.
   */
  isOpen = false;

  /**
   * The Popper.js instance that manages the dropdown-list positioning.
   */
  popperInstance: any;

  constructor(private cdRef: ChangeDetectorRef) {}

  /**
   * The popper.js instance should be destroyed without ngOnDestroy anyways, but making 100% sure it's destroyed.
   */
  ngOnDestroy() {
    this.destroyPopperInstance();
  }

  /**
   * Creates a new Popper.js instance to manage the dropdown-list positioning.
   * The dropdown-list is positioned below the dropdown-header by default.
   * If there is not enough space below, the dropdown-list is flipped to the top.
   * This is done by the 'flip' modifier.
   * The Popper.js instance is stored in the 'popperInstance' property.
   * The instance is destroyed when the dropdown is closed.
   *
   */
  private createPopperInstance() {
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
            {
              name: 'offset',
              options: {
                offset: [0, 18], // Adjust the second value to set the vertical spacing
              },
            },
          ],
        },
      );
    }
  }

  /**
   * Destroys the Popper.js instance if it exists.
   */
  private destroyPopperInstance() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
  }

  /**
   * Toggles the dropdown-list visibility via the isOpen property, then focuses the selected option.
   * If the dropdown-list is opened, the Popper.js instance is created.
   * If the dropdown-list is closed, the Popper.js instance is destroyed.
   *
   * @remarks
   * The change detection is triggered because if not, the @ViewChild properties are not updated before this function is finished executing.
   */
  public toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.cdRef.detectChanges();
      this.createPopperInstance();

      // Set focus on the 'selected' element via selectedOptionIndex.
      const indexToFocus =
        this.selectedOptionIndex === -1 ? 0 : this.selectedOptionIndex;
      this.focusOption(indexToFocus);
    } else {
      this.destroyPopperInstance();
    }
  }

  /**
   * Handles the Space and Enter keydown events on the dropdown-header.
   * Simply calls the toggleDropdown method.
   */
  public handleKeydownOnHeader(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      this.toggleDropdown();
      event.preventDefault();
    }
  }

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
      idx = Math.min(this.options.length - 1, idx + 1); // Ensures idx is not out of bounds.
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
    this.selectedOptionIndex = index;
    this.selectedOptionIndexChange.emit(index);
    this.dropdownHeader.nativeElement.focus();
    this.isOpen = false;
  }

  /**
   * Handles the focusout event on the dropdown-list:
   * If the related target is not a child of the dropdown-list, the dropdown-list is closed.
   *
   * @remarks
   * Since focusout events bubble, the child elements of the dropdown-list will trigger this event.
   */
  public handleFocusOutOnList(event: FocusEvent) {
    // The event.relatedTarget (in FocusEvents) is the element that is gaining focus.
    const relatedTarget = event.relatedTarget as HTMLElement;
    const isRelatedTargetInDropdown =
      this.dropdownList?.nativeElement.contains(relatedTarget);
    const isRelatedTargetHeader =
      relatedTarget === this.dropdownHeader.nativeElement;

    // Check if the related target is within the dropdown list or the header itself.
    if (!isRelatedTargetInDropdown && !isRelatedTargetHeader) {
      this.isOpen = false;
    }
  }
}
