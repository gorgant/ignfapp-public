import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrainingSessionToPlanButtonComponent } from './add-training-session-to-plan-button.component';

describe('AddTrainingSessionToPlanButtonComponent', () => {
  let component: AddTrainingSessionToPlanButtonComponent;
  let fixture: ComponentFixture<AddTrainingSessionToPlanButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTrainingSessionToPlanButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTrainingSessionToPlanButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
