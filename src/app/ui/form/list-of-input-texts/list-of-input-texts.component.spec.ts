import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfInputTextsComponent } from './list-of-input-texts.component';

describe('ListOfInputTextsComponent', () => {
  let component: ListOfInputTextsComponent;
  let fixture: ComponentFixture<ListOfInputTextsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfInputTextsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListOfInputTextsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
