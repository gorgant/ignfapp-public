import { Directive, HostListener } from '@angular/core';
import { UiService } from 'src/app/core/services/ui.service';

@Directive({
  selector: '[backButton]'
})
export class BackButtonDirective {

  constructor(private uiService: UiService) {}

  @HostListener('click')
  onClick(): void {
    this.uiService.routeUserToPreviousPage();
  }

}
