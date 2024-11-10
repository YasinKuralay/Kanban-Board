import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveBoardsListComponent } from './interactive-boards-list.component';

describe('InteractiveBoardsListComponent', () => {
  let component: InteractiveBoardsListComponent;
  let fixture: ComponentFixture<InteractiveBoardsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractiveBoardsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InteractiveBoardsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
