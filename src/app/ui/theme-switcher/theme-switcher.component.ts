import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { SvgLoaderComponent } from '../svg-loader/svg-loader.component';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
  imports: [SvgLoaderComponent],
  encapsulation: ViewEncapsulation.None,
})
export class ThemeSwitcherComponent {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Toggles the current theme between 'light' and 'dark'.
   *
   * @remarks
   * Applies the new theme to the html element and stores it in localstorage.
   *
   */
  public toggleTheme() {
    const currentTheme =
      this.document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
}
