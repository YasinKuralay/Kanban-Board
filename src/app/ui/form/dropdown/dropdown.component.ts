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

/**
 * The overlay reference to the dropdown-popup. Used to be able to close it from the component that is inside the overlay (in this case dropdown-popup).
 */
export const COMPONENT_OVERLAY_REF = new InjectionToken<OverlayRef>(
  'COMPONENT_OVERLAY_REF',
);

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
   * Subscription to the detachments event of the overlay. Used to close the overlay when it is detached.
   */
  private detachmentsSubscription?: Subscription;

  /**
   * The ResizeObserver used to update the overlay size when the anchor element is resized. This variable is used to unobserve() the anchor element when needed.
   */
  private resizeObserver?: ResizeObserver;

  /**
   * Subscription to the backdropClick event of the overlay. Used to close the overlay when the backdrop is clicked. This variable is used to unsubscribe when needed.
   */
  private backdropClickSubscription?: Subscription;

  /**
   * Generates a unique ID for the input id attribute
   */
  public uniqueId = uuidv4();

  /**
   * Keeps track of whether the dropdown-overlay is open or closed.
   */
  private dropdownOverlayIsOpen = false;

  /**
   * The overlay reference used to create the dropdown-list. Later used to close the overlay via dispose().
   */
  private dropdownOverlayRef!: OverlayRef;

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
    this.removeAllSubscriptionsAndEventListeners();
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
        hasBackdrop: true, // Adds a backdrop to the overlay.
        backdropClass: 'cdk-overlay-transparent-backdrop', // Adds a transparent backdrop to the overlay.
        scrollStrategy: this.overlay.scrollStrategies.block(), // Prevents scrolling behind the overlay
        positionStrategy: this.overlay
          .position()
          .flexibleConnectedTo(overlayAnchorPoint) // Connects the overlay to the anchor element.
          .withPositions([
            {
              offsetY: 8,
              originX: 'start',
              overlayX: 'start',
              originY: 'bottom',
              overlayY: 'top',
            },
            {
              offsetY: -8,
              originX: 'start',
              overlayX: 'start',
              originY: 'top',
              overlayY: 'bottom',
            },
          ]),
      };

      this.dropdownOverlayRef = this.overlay.create(overlayConfig);

      const injector = Injector.create({
        providers: [
          { provide: DROPDOWN_DATA, useValue: { dropdownItems: this.options } },
          { provide: COMPONENT_OVERLAY_REF, useValue: this.dropdownOverlayRef },
        ],
        parent: this.injector,
      });

      const dropdownPortal = new ComponentPortal(
        DropdownPopupComponent,
        null,
        injector,
      );
      const componentRef = this.dropdownOverlayRef.attach(dropdownPortal);

      // Set the property showing that the overlay is open to true.
      this.dropdownOverlayIsOpen = true;

      // Sets focus and a focusTrap on the overlay.
      // We need setTimeout as changedetection.detectChanges() doesn't work in this case. Otherwise, the focus trap won't work.
      setTimeout(() => {
        // Create a focus trap for the overlay
        const focusTrap: FocusTrap = this.focusTrapFactory.create(
          componentRef!.location.nativeElement,
        );

        // Set focus to the overlay
        focusTrap.focusInitialElement();
      }, 0);

      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === this.dropdownHeader.nativeElement) {
            this.updateOverlaySize();
          }
        }
      });
      this.resizeObserver.observe(this.dropdownHeader.nativeElement);

      // Close the overlay when the backdrop is clicked
      this.backdropClickSubscription = this.dropdownOverlayRef
        .backdropClick()
        .subscribe(() => {
          this.dropdownOverlayRef.dispose();
          this.dropdownOverlayIsOpen = false;
          this.removeAllSubscriptionsAndEventListeners();
        });

      this.detachmentsSubscription = this.dropdownOverlayRef
        .detachments()
        .subscribe(() => {
          this.dropdownOverlayIsOpen = false;
          this.removeAllSubscriptionsAndEventListeners();
        });
    } else {
      this.dropdownOverlayRef.dispose();
    }
  }

  /**
   * Updates the size of the overlay to match the width of the anchor element.
   *
   * @remarks Used together with the ResizeObserver to update the overlay size when the anchor element is resized.
   */
  private updateOverlaySize() {
    if (this.dropdownOverlayIsOpen && this.dropdownOverlayRef) {
      const anchorWidth =
        this.dropdownHeader.nativeElement.getBoundingClientRect().width;
      this.dropdownOverlayRef.updateSize({ width: `${anchorWidth}px` });
    }
  }

  /**
   * Removes all subscriptions and event listeners.
   */
  private removeAllSubscriptionsAndEventListeners() {
    this.detachmentsSubscription?.unsubscribe();
    this.resizeObserver?.unobserve(this.dropdownHeader.nativeElement);
    this.backdropClickSubscription?.unsubscribe();
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

      // Set focus on the 'selected' element via selectedOptionIndex.
      const indexToFocus =
        this.selectedOptionIndex === -1 ? 0 : this.selectedOptionIndex;
      this.focusOption(indexToFocus);
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
