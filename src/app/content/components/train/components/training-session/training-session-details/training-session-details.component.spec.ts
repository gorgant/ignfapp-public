import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingSessionDetailsComponent } from './training-session-details.component';

describe('TrainingSessionDetailsComponent', () => {
  let component: TrainingSessionDetailsComponent;
  let fixture: ComponentFixture<TrainingSessionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TrainingSessionDetailsComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TrainingSessionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
