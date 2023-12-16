import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrainingSessionToPersonalQueueButtonComponent } from './add-training-session-to-personal-queue-button.component';

describe('AddTrainingSessionToPersonalQueueButtonComponent', () => {
  let component: AddTrainingSessionToPersonalQueueButtonComponent;
  let fixture: ComponentFixture<AddTrainingSessionToPersonalQueueButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AddTrainingSessionToPersonalQueueButtonComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AddTrainingSessionToPersonalQueueButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
