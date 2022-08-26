import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingPlanCardComponent } from './training-plan-card.component';

describe('TrainingPlanCardComponent', () => {
  let component: TrainingPlanCardComponent;
  let fixture: ComponentFixture<TrainingPlanCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrainingPlanCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingPlanCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
