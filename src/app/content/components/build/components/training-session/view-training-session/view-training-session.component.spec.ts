import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTrainingSessionComponent } from './view-training-session.component';

describe('ViewTrainingSessionComponent', () => {
  let component: ViewTrainingSessionComponent;
  let fixture: ComponentFixture<ViewTrainingSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTrainingSessionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTrainingSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
