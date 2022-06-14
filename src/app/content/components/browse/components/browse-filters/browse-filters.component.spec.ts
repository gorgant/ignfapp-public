import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseFiltersComponent } from './browse-filters.component';

describe('BrowseFiltersComponent', () => {
  let component: BrowseFiltersComponent;
  let fixture: ComponentFixture<BrowseFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BrowseFiltersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
