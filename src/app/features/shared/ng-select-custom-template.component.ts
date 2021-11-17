import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-ng-select-custom-template',
  template: `
  <span class="ng-value" *ngFor="let item of items | slice:0:2" style="padding: 5px 0 5px 0;">
    <span class="ng-value-icon right" (click)="clear(item)" aria-hidden="true">×</span>
    <span class="ng-value-label">{{item[bindLabelName]}}</span>
  </span>
  <span class="ng-value" *ngIf="items.length > 2" style="padding: 5px 0 5px 0;">
    <span class="ng-value-label">{{items.length - 2}} more...</span>
  </span>`,
})
export class NgSelectCustomTemplateComponent implements OnInit {

  @Input() items: any;
  @Input() clear: any;
  @Input() bindLabelName: any;
  constructor() { }

  ngOnInit() {
  }

}
