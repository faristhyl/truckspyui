import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-hours',
  templateUrl: './hours.component.html',
  styleUrls: ['./hours.component.css'],
})
export class HoursComponent implements OnInit {
  childPath: string;
  folders = ['drivers', 'logs', 'violation', 'unindentified-driving', 'reports', 'malfunctions', 'log-edits', 'fmcsa-data-transfer'];
  
  /**
   * Constructor to instantiate an instance of DashboardComponent.
   */
  constructor(private route: ActivatedRoute, private router: Router, private store: Store<any>) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        let path = this.route.firstChild.routeConfig.path;
        if (this.folders.includes(path)) {
          this.childPath = path;
        }
      }
    });
  }

  ngOnInit() { }

  destroyChart() { }

  ngOnDestroy() {
    this.destroyChart();
  }
}
