import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingSessionCardComponent } from './training-session-card.component';

describe('TrainingSessionCardComponent', () => {
  let component: TrainingSessionCardComponent;
  let fixture: ComponentFixture<TrainingSessionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TrainingSessionCardComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TrainingSessionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
