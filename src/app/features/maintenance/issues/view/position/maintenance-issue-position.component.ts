import { ActivatedRoute } from '@angular/router';
import { Component, OnChanges, Input } from '@angular/core';

import { DomicileLocation } from '@app/core/services';

@Component({
  selector: 'app-maintenance-issue-position',
  templateUrl: './maintenance-issue-position.component.html',
  styleUrls: ['./maintenance-issue-position.component.css']
})
export class MaintenanceIssuePositionComponent implements OnChanges {

  @Input() location: DomicileLocation;

  /**
   * Constructor to instantiate an instance of MaintenanceIssuePositionComponent.
   */
  constructor(
    private route: ActivatedRoute) { }

  ngOnChanges() { }

}
