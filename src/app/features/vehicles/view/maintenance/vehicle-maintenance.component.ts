import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-vehicle-maintenance',
  templateUrl: './vehicle-maintenance.component.html',
  styleUrls: ['./vehicle-maintenance.component.css']
})
export class VehicleMaintenanceComponent implements OnInit {

  constructor(
    private route: ActivatedRoute) { }

  ngOnInit() { }

}
