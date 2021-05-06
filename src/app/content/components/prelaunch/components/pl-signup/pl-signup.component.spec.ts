import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlSignupComponent } from './pl-signup.component';

describe('PlSignupComponent', () => {
  let component: PlSignupComponent;
  let fixture: ComponentFixture<PlSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlSignupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
