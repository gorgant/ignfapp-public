import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPersonalQueueComponent } from './edit-personal-queue.component';

describe('EditPersonalQueueComponent', () => {
  let component: EditPersonalQueueComponent;
  let fixture: ComponentFixture<EditPersonalQueueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [EditPersonalQueueComponent]
});
    fixture = TestBed.createComponent(EditPersonalQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
