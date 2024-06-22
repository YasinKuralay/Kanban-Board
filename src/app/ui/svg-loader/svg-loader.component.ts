import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * The SVG Loader Component is used to load SVG files as inline svg into the DOM.
 *
 * @remarks
 * The Component is following the same logic that the Angular Material Team uses for its icons.
 * The logic was taken from https://stackoverflow.com/a/71988870.
 *
 */
@Component({
  selector: 'app-svg-loader',
  standalone: true,
  imports: [],
  template: '<span [innerHTML]="svgIcon" [class]="name"></span>',
})
export class SvgLoaderComponent implements OnChanges {
  @Input() public name?: string;

  public svgIcon: any;

  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  /**
   * Gets the SVG file from the assets folder and sanitizes it to be used as innerHTML.
   *
   * @remarks
   * The logic is inside the ngOnChanges lifecycle hook, to allow for dynamic changes of the SVG file.
   *
   */
  public ngOnChanges(): void {
    if (!this.name) {
      this.svgIcon = '';
      return;
    }

    this.httpClient
      .get(`assets/svg/${this.name}.svg`, { responseType: 'text' })
      .subscribe((value) => {
        this.svgIcon = this.sanitizer.bypassSecurityTrustHtml(value);
      });
  }
}
