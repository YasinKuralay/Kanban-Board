import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { InputTextComponent } from '../input-text/input-text.component';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { startWith, Subscription } from 'rxjs';

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
   * The array of strings that are used to populate the input fields.
   * These will be looped over to create FormControls.
   *
   * @remarks
   * If there are no strings in the array, no input fields will be displayed by default.
   */
  @Input() public inputTextStrings: string[] = [];

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
   * Keeps track of whether all FormsControls are valid.
   */
  @Output() public isValid = new EventEmitter<boolean>();

  private statusChangesSubscription!: Subscription;

  /**
   * The FormArray that holds the form controls for the dynamically generated input fields.
   *
   * @remarks
   * We use a FormArray here to be able to dynamically add and remove form controls at runtime.
   * The type definition <FormControl<string | null>> is needed to avoid TypeScript errors that occur when using formArray.push(new FormControl('')).
   */
  public internalFormArray = new FormArray<FormControl<string | null>>([]);

  ngOnInit() {
    // Populates the FormArray with FormControls based on the inputTextStrings array
    this.inputTextStrings.forEach((item: string) => {
      this.internalFormArray.push(new FormControl(item, [Validators.required]));
    });

    // Subscribe to the FormArray's valueChanges observable to keep track of whether all FormControls are valid
    this.statusChangesSubscription = this.internalFormArray.valueChanges
      .pipe(startWith(this.internalFormArray.value)) // Emit initial value
      .subscribe(() => {
        this.isValid.emit(this.internalFormArray.valid);
      });
  }

  ngOnDestroy() {
    this.statusChangesSubscription.unsubscribe();
  }

  /**
   * The method that is called when the user clicks the button to add a new input field.
   */
  public addInputField() {
    this.internalFormArray.push(new FormControl('', [Validators.required]));
  }

  /**
   * The method that is called when the user clicks the button to remove an existing input field.
   */
  public removeInputField(index: number) {
    this.internalFormArray.removeAt(index);
  }
}
