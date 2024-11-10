import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent {
  @Input() label: string = '';
  @Input() control!: FormControl<boolean>;

  /**
   * Simply toggles the checkbox boolean value.
   */
  toggleCheckbox(): void {
    this.control.setValue(!this.control.value);
  }

  /**
   * Handles the Space and Enter keydown events for the checkbox.
   * If any of the two are clicked while this element has focus, the checkbox will be toggled.
   *
   * @param event - The KeyboardEvent that triggered this function.
   */
  handleKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      this.toggleCheckbox();
      event.preventDefault();
    }
  }
}
