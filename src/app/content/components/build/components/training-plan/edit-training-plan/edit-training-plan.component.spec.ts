import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainingPlanComponent } from './edit-training-plan.component';

describe('EditTrainingPlanComponent', () => {
  let component: EditTrainingPlanComponent;
  let fixture: ComponentFixture<EditTrainingPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTrainingPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTrainingPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
