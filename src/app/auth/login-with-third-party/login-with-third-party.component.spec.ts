import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginWithThirdPartyComponent } from './login-with-third-party.component';

describe('LoginWithThirdPartyComponent', () => {
  let component: LoginWithThirdPartyComponent;
  let fixture: ComponentFixture<LoginWithThirdPartyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [LoginWithThirdPartyComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginWithThirdPartyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
