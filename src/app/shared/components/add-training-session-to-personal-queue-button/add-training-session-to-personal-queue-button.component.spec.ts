import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrainingSessionToPersonalQueueButtonComponent } from './add-training-session-to-personal-queue-button.component';

describe('AddTrainingSessionToPersonalQueueButtonComponent', () => {
  let component: AddTrainingSessionToPersonalQueueButtonComponent;
  let fixture: ComponentFixture<AddTrainingSessionToPersonalQueueButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTrainingSessionToPersonalQueueButtonComponent ]
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
