import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTrainingPlanComponent } from './view-training-plan.component';

describe('ViewTrainingPlanComponent', () => {
  let component: ViewTrainingPlanComponent;
  let fixture: ComponentFixture<ViewTrainingPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTrainingPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTrainingPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
