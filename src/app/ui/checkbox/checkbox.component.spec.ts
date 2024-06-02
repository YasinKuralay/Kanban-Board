import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  let component: CheckboxComponent;
  let fixture: ComponentFixture<CheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    component.control = new FormControl(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle checkbox value', () => {
    component.toggleCheckbox();
    expect(component.control.value).toBe(true);
  });

  it('should toggle checkbox value on space or enter key press', () => {
    const event = new KeyboardEvent('keydown', { key: ' ' });
    component.handleKeydown(event);
    expect(component.control.value).toBe(true);
  });
});
