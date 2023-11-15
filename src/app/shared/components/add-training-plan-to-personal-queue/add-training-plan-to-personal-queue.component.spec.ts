import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrainingPlanToPersonalQueueComponent } from './add-training-plan-to-personal-queue.component';

describe('AddTrainingPlanToPersonalQueueComponent', () => {
  let component: AddTrainingPlanToPersonalQueueComponent;
  let fixture: ComponentFixture<AddTrainingPlanToPersonalQueueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddTrainingPlanToPersonalQueueComponent]
    });
    fixture = TestBed.createComponent(AddTrainingPlanToPersonalQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
