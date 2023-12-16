import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainingSessionComponent } from './edit-training-session.component';

describe('EditTrainingSessionComponent', () => {
  let component: EditTrainingSessionComponent;
  let fixture: ComponentFixture<EditTrainingSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [EditTrainingSessionComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTrainingSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
