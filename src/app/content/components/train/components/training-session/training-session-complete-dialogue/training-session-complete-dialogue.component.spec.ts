import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingSessionCompleteDialogueComponent } from './training-session-complete-dialogue.component';

describe('TrainingSessionCompleteDialogueComponent', () => {
  let component: TrainingSessionCompleteDialogueComponent;
  let fixture: ComponentFixture<TrainingSessionCompleteDialogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TrainingSessionCompleteDialogueComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TrainingSessionCompleteDialogueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
