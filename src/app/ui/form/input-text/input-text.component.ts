import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid'; // Install 'uuid' package if needed

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InputTextComponent {
  @Input() public label: string = '';
  @Input() public placeholder: string = '';
  @Input() public formControl: FormControl = new FormControl('');

  /**
   * Generates a unique ID for the input id attribute
   */
  public uniqueId = uuidv4();
}
