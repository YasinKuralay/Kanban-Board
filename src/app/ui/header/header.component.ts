import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  public mobileBoardsDialogIsOpen = false;

  /**
   * Opens the "Boards Dialog" on the mobile header.
   *
   * @remarks
   * This dialog can only be launched on the mobile header. The dialog will automatically be closed if the user extends the Viewport-Width over 767px.
   * This method launches an Angular CDK dialog that displays a list of boards. The Dialog additionally includes a light-dark theme toggle.
   * For further reference on the CDK, please visit: https://material.angular.io/cdk/dialog/overview
   *
   */
  openMobileBoardsDialog() {
    this.mobileBoardsDialogIsOpen = !this.mobileBoardsDialogIsOpen;
    console.log(
      'openMobileBoardsDialog state: ',
      this.mobileBoardsDialogIsOpen
    );
  }
}
