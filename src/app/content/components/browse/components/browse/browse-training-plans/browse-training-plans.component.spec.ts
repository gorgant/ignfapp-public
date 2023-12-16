import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseTrainingPlansComponent } from './browse-training-plans.component';

describe('BrowseTrainingPlansComponent', () => {
  let component: BrowseTrainingPlansComponent;
  let fixture: ComponentFixture<BrowseTrainingPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [BrowseTrainingPlansComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(BrowseTrainingPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
