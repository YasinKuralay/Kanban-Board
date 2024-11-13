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
   * The ResizeObserver used to update the overlay size when the anchor element is resized. This property is used to unobserve() the anchor element when needed.
   */
  private resizeObserver?: ResizeObserver;

  /**
   * Subscription to the backdropClick event of the overlay. Used to close the overlay when the backdrop is clicked. This property is used to unsubscribe when needed.
   */
  private backdropClickSubscription?: Subscription;

  /**
   * Subscription to the optionSelected event of the dropdown-popup. Used to select the option when it is clicked.
   */
  private optionSelectedSubscription?: Subscription;

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
   * Launches the overlay, passes all needed info into the ComponentPortal and subscribes to the detachments and backdropClick events.
   *
   * @param overlayAnchorPoint - The anchor point of the overlay: In this case, the dropdown-header.
   *
   * @remarks
   * The overlay is created with the dropdown-header as the anchor point.
   * The dropdown-popup is attached to the overlay via a ComponentPortal.
   * The overlay is closed when the backdrop is clicked or when the overlay is detached.
   * The overlay is resized when the anchor element is resized.
   * The focus is set back on the dropdownHeader when the overlay is closed.
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
          { provide: COMPONENT_OVERLAY_REF, useValue: this.dropdownOverlayRef }, // Provide the overlay reference to the dropdown-popup so that it can close the overlay from inside when needed.
        ],
        parent: this.injector,
      });

      // Creates a ComponentPortal to attach the dropdown-popup to the overlay.
      const dropdownPortal = new ComponentPortal(
        DropdownPopupComponent,
        null,
        injector,
      );
      const componentRef = this.dropdownOverlayRef.attach(dropdownPortal);
      componentRef.instance.selectedOptionIndex = this.selectedOptionIndex; // Pass the selected option index, so that the selected option can be focused when the overlay is opened.
      componentRef.instance.dropdownItemsAsStrings = this.options; // Pass the options.
      // Subscribe to the @Output event of the dropdown-popup to select the option when it is clicked.
      componentRef.instance.optionSelected.subscribe((index: number) => {
        this.selectOption(index);
      });

      // Set the property showing that the overlay is open to true.
      this.dropdownOverlayIsOpen = true;

      // Resize the overlay when the anchor element is resized.
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
        });

      // React to the closing (detachment) of the overlay.
      this.detachmentsSubscription = this.dropdownOverlayRef
        .detachments()
        .subscribe(() => {
          this.dropdownOverlayIsOpen = false;
          this.removeAllSubscriptionsAndEventListeners();
          // Set focus back on the dropdownHeader when the overlay is closed. (Otherwise the focus will be at the end of the page where the Portal is. Not good.)
          this.dropdownHeader.nativeElement.focus();
        });
    } else {
      this.dropdownOverlayRef.dispose();
      this.isOpen = false;
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
    this.optionSelectedSubscription?.unsubscribe();
    this.isOpen = false;
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
   * Selects the option at the given index, closes the dropdown-list and sets the focus back on the dropdownHeader.
   * Emits the selectedOptionIndexChange event with the index.
   */
  public selectOption(index: number) {
    this.selectedOptionIndex = index;
    this.selectedOptionIndexChange.emit(index);
    this.dropdownHeader.nativeElement.focus();
    this.isOpen = false;
  }
}
