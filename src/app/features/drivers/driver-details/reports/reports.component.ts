import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Driver, RestService } from '@app/core/services';

@Component({
  selector: 'app-driver-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class DriverReportsComponent implements OnInit {

  driverId: string;
  driver: Driver;
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
  ) { }

  ngOnInit() {
    this.driver = new Driver();
    this.driverId = this.route.snapshot.parent.paramMap.get('id');
    this.restService.getDriver(this.driverId)
      .subscribe(result => {
        this.driver = result;
      });
  }

}
