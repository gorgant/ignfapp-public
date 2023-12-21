import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingSessionVideoComponent } from './training-session-video.component';

describe('TrainingSessionVideoComponent', () => {
  let component: TrainingSessionVideoComponent;
  let fixture: ComponentFixture<TrainingSessionVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TrainingSessionVideoComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TrainingSessionVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
