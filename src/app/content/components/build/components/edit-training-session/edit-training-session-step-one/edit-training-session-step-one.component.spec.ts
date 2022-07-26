import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainingSessionStepOneComponent } from './edit-training-session-step-one.component';

describe('EditTrainingSessionStepOneComponent', () => {
  let component: EditTrainingSessionStepOneComponent;
  let fixture: ComponentFixture<EditTrainingSessionStepOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTrainingSessionStepOneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTrainingSessionStepOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
