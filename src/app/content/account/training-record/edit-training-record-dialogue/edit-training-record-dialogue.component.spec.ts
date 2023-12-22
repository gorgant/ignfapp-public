import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainingRecordDialogueComponent } from './edit-training-record-dialogue.component';

describe('EditTrainingRecordDialogueComponent', () => {
  let component: EditTrainingRecordDialogueComponent;
  let fixture: ComponentFixture<EditTrainingRecordDialogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTrainingRecordDialogueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditTrainingRecordDialogueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
