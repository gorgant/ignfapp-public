import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingSessionFiltersComponent } from './training-session-filters.component';

describe('TrainingSessionFiltersComponent', () => {
  let component: TrainingSessionFiltersComponent;
  let fixture: ComponentFixture<TrainingSessionFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TrainingSessionFiltersComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TrainingSessionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
