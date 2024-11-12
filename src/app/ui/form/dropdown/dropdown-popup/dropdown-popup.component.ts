import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DROPDOWN_DATA } from '../dropdown.component';

@Component({
  selector: 'app-dropdown-popup',
  standalone: true,
  imports: [],
  templateUrl: './dropdown-popup.component.html',
  styleUrl: './dropdown-popup.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DropdownPopupComponent {
  public dropdownItems: string[] = [];

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DROPDOWN_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.dropdownItems = this.data.dropdownItems;
  }

  public onDropdownItemClick(index: number) {}

  public closeDialog() {
    this.dialogRef.close();
  }
}
