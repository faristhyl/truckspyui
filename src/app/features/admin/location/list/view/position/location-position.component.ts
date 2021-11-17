import { ActivatedRoute } from '@angular/router';
import { Component, OnChanges, Input } from '@angular/core';

import { DomicileLocation } from '@app/core/services';

@Component({
  selector: 'app-admin-location-position',
  templateUrl: './location-position.component.html',
  styleUrls: ['./location-position.component.css']
})
export class AdminLocationPositionComponent implements OnChanges {

  locationId: string;
  @Input() location: DomicileLocation;

  /**
   * Constructor to instantiate an instance of AdminLocationPositionComponent.
   */
  constructor(
    private route: ActivatedRoute) {
    this.locationId = this.route.snapshot.paramMap.get("id");
  }

  ngOnChanges() { }

}
