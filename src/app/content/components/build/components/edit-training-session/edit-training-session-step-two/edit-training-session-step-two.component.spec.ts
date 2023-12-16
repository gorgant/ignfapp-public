import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainingSessionStepTwoComponent } from './edit-training-session-step-two.component';

describe('EditTrainingSessionStepTwoComponent', () => {
  let component: EditTrainingSessionStepTwoComponent;
  let fixture: ComponentFixture<EditTrainingSessionStepTwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [EditTrainingSessionStepTwoComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTrainingSessionStepTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
