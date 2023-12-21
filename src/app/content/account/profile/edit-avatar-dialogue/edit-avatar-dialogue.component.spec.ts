import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAvatarDialogueComponent } from './edit-avatar-dialogue.component';

describe('EditAvatarDialogueComponent', () => {
  let component: EditAvatarDialogueComponent;
  let fixture: ComponentFixture<EditAvatarDialogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [EditAvatarDialogueComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAvatarDialogueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
