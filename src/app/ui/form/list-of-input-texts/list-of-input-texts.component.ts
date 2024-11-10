import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { InputTextComponent } from '../input-text/input-text.component';
import {
  AbstractControl,
  FormArray,
  FormControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-of-input-texts',
  standalone: true,
  imports: [InputTextComponent],
  templateUrl: './list-of-input-texts.component.html',
  styleUrl: './list-of-input-texts.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ListOfInputTextsComponent implements OnInit {
  /**
   * The FormArray that holds the form controls for the dynamically generated input fields.
   */
  @Input() public inputFormArray!: FormArray<FormControl<string | null>>;

  /**
   * An optional flag that determines whether the FormArray will be valid if there are no input fields.
   */
  @Input() public emptyFormArrayNotAllowed: boolean = false;

  /**
   * The text that is displayed on the button that adds a new input field.
   * Please note that the button already has as text: "+ Add new ", so you can use this property to add additional text.
   */
  @Input() public addNewButtonText: string = '';

  /**
   * The text that is displayed above the input fields.
   */
  @Input() public topLabel: string = '';

  ngOnInit(): void {
    // If the emptyNotAllowed flag is set to true, we add a validator to the FormArray that prevents the FormArray from being Valid when empty.
    if (this.emptyFormArrayNotAllowed) {
      this.inputFormArray.setValidators(this.emptyFormArrayNotAllowedValidator);
      this.inputFormArray.updateValueAndValidity(); // This is necessary to trigger the validation, otherwise it will only start working after the user interacts with the form.
    }
  }

  /**
   * The validator that is added to the FormArray when the emptyFormArrayNotAllowed flag is set to true.
   *
   * @remarks
   * This validator prevents the FormArray from being valid when it is empty.
   */
  private emptyFormArrayNotAllowedValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    if ((control as FormArray).length === 0) {
      return { emptyNotAllowed: true };
    }
    return null;
  }

  /**
   * The method that is called when the user clicks the button to add a new input field.
   *
   * @remarks
   * All input fields are required by default, since empty fields can be removed by the user anyways.
   */
  public addInputField() {
    this.inputFormArray.push(new FormControl('', [Validators.required]));
  }

  /**
   * The method that is called when the user clicks the button to remove an existing input field.
   */
  public removeInputField(index: number) {
    this.inputFormArray.removeAt(index);
  }
}
