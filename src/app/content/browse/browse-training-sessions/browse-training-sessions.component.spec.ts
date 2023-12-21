import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseTrainingSessionsComponent } from './browse-training-sessions.component';

describe('BrowseTrainingSessionsComponent', () => {
  let component: BrowseTrainingSessionsComponent;
  let fixture: ComponentFixture<BrowseTrainingSessionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [BrowseTrainingSessionsComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(BrowseTrainingSessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
