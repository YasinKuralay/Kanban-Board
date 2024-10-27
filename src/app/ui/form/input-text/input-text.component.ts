import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InputTextComponent {
  @Input() public label: string = '';
  @Input() public placeholder: string = '';
  @Input({ required: true }) public internalFormControl!: FormControl<
    string | null
  >;

  /**
   * Generates a unique ID for the input id attribute
   */
  public uniqueId = uuidv4();
}
