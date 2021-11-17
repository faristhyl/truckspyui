import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RestService, Driver } from '@app/core/services';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class DriverLogsComponent implements OnInit {

  driverId: string;
  driver: Driver;
  driverVistrackId: string;

  constructor(
    private route: ActivatedRoute,
    private restService: RestService) { }

  ngOnInit() {
    this.driverId = this.route.snapshot.parent.paramMap.get('id');
    this.restService.getDriver(this.driverId)
      .subscribe(result => {
        this.driver = result;
        this.driverVistrackId = this.driver.visTracksId;
      });
  }

}
