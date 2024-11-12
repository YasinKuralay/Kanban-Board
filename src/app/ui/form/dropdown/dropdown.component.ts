import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  InjectionToken,
  Injector,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { DropdownPopupComponent } from './dropdown-popup/dropdown-popup.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Subscription } from 'rxjs';

export const DROPDOWN_DATA = new InjectionToken<any>('DROPDOWN_DATA');

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
   * The label that is displayed above the dropdown-header.
   */
  @Input() public label: string = '';

  /**
   * The options that are displayed in the dropdown-list.
   */
  @Input({ required: true }) options: string[] = [];

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
  public isOpen = false;

  /**
   * Keeps track of whether the focusOutListener is added or not. Used to removeEventListener when the component is destroyed.
   */
  private focusOutListener?: () => void;

  private detachmentsSubscription?: Subscription;

  /**
   * Generates a unique ID for the input id attribute
   */
  public uniqueId = uuidv4();

  private dropdownOverlayIsOpen = false;

  private dropdownOverlayRef!: OverlayRef;
  private componentRef?: ComponentRef<DropdownPopupComponent>;

  constructor(
    private overlay: Overlay,
    private cdRef: ChangeDetectorRef,
    private injector: Injector,
    private focusTrapFactory: FocusTrapFactory,
  ) {}

  /**
   * Removes event listeners when the component is destroyed.
   */
  ngOnDestroy() {
    this.detachmentsSubscription?.unsubscribe();
    this.componentRef?.location.nativeElement.removeEventListener(
      'focusout',
      this.focusOutListener,
    );
  }

  /**
   * Launches the overlay and subscribes to the detachments and focusout events.
   *
   * @param overlayAnchorPoint - The anchor point of the overlay: In this case, the dropdown-header.
   */
  private toggleOverlayAndSubscribeToEvents(
    overlayAnchorPoint: ElementRef,
  ): void {
    // Only open the overlay if it is not already open
    if (!this.dropdownOverlayIsOpen) {
      // Gets the width of the anchor element to match the width of the overlay.
      const anchorWidth =
        overlayAnchorPoint.nativeElement.getBoundingClientRect().width;

      const overlayConfig: OverlayConfig = {
        width: `${anchorWidth}px`,
        positionStrategy: this.overlay
          .position()
          .flexibleConnectedTo(overlayAnchorPoint) // Connects the overlay to the anchor element.
          .withPositions([
            {
              originX: 'start',
              originY: 'bottom',
              overlayX: 'start',
              overlayY: 'top',
            },
            {
              originX: 'start',
              originY: 'top',
              overlayX: 'end',
              overlayY: 'top',
            },
          ]),
      };

      const overlayRef: OverlayRef = this.overlay.create(overlayConfig);

      const injector = Injector.create({
        providers: [
          { provide: DROPDOWN_DATA, useValue: { dropdownItems: this.options } },
        ],
        parent: this.injector,
      });

      const dropdownPortal = new ComponentPortal(
        DropdownPopupComponent,
        null,
        injector,
      );
      this.componentRef = overlayRef.attach(dropdownPortal);

      // Sets focus and a focusTrap on the overlay.
      // We need setTimeout as changedetection.detectChanges() doesn't work in this case. Otherwise, the focus trap won't work.
      setTimeout(() => {
        // Create a focus trap for the overlay
        const focusTrap: FocusTrap = this.focusTrapFactory.create(
          this.componentRef!.location.nativeElement,
        );

        // Set focus to the overlay
        focusTrap.focusInitialElement();
      }, 0);

      // Close the overlay when it loses focus
      this.focusOutListener =
        this.componentRef.location.nativeElement.addEventListener(
          'focusout',
          (event: FocusEvent) => {
            if (
              !this.componentRef?.location.nativeElement.contains(
                event.relatedTarget as Node,
              )
            ) {
              overlayRef.dispose();
              this.dropdownOverlayIsOpen = false;

              // Unsubscriptions.
              this.detachmentsSubscription?.unsubscribe();
              this.componentRef?.location.nativeElement.removeEventListener(
                'focusout',
                this.focusOutListener,
              );
            }
          },
        );

      // Set the property showing that the overlay is open to true.
      this.dropdownOverlayIsOpen = true;

      overlayRef.detachments().subscribe(() => {
        this.dropdownOverlayIsOpen = false;
      });
    } else {
      this.dropdownOverlayRef.dispose();
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
      this.toggleOverlayAndSubscribeToEvents(this.dropdownHeader);
      this.cdRef.detectChanges();
      // this.createPopperInstance();

      // Set focus on the 'selected' element via selectedOptionIndex.
      const indexToFocus =
        this.selectedOptionIndex === -1 ? 0 : this.selectedOptionIndex;
      this.focusOption(indexToFocus);
    } else {
      // this.destroyPopperInstance();
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
