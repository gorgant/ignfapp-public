import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlLandingPageComponent } from './pl-landing-page.component';

describe('PlLandingPageComponent', () => {
  let component: PlLandingPageComponent;
  let fixture: ComponentFixture<PlLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [PlLandingPageComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
