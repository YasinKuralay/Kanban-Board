import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileBoardsDialogComponent } from './mobile-boards-dialog.component';

describe('MobileBoardsDialogComponent', () => {
  let component: MobileBoardsDialogComponent;
  let fixture: ComponentFixture<MobileBoardsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileBoardsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MobileBoardsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
