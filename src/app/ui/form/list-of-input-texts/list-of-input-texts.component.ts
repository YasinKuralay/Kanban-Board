import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { InputTextComponent } from '../input-text/input-text.component';
import { FormArray, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-of-input-texts',
  standalone: true,
  imports: [InputTextComponent],
  templateUrl: './list-of-input-texts.component.html',
  styleUrl: './list-of-input-texts.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ListOfInputTextsComponent {
  /**
   * The FormArray that holds the form controls for the dynamically generated input fields.
   */
  @Input() public inputFormArray!: FormArray<FormControl<string | null>>;

  /**
   * The text that is displayed on the button that adds a new input field.
   * Please note that the button already has as text: "+ Add new ", so you can use this property to add additional text.
   */
  @Input() public addNewButtonText: string = '';

  /**
   * The text that is displayed above the input fields.
   */
  @Input() public topLabel: string = '';

  /**
   * The method that is called when the user clicks the button to add a new input field.
   */
  public addInputField() {
    this.inputFormArray.push(new FormControl('', [])); // No need for Validators here if not validating
  }

  /**
   * The method that is called when the user clicks the button to remove an existing input field.
   */
  public removeInputField(index: number) {
    this.inputFormArray.removeAt(index);
  }
}
