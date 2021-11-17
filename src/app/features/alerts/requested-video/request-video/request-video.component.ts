import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestService, Vehicle } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { BsModalRef } from 'ngx-bootstrap';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-request-video',
    templateUrl: './request-video.component.html',
    styleUrls: ['./request-video.component.css']
})
export class RequestVideoComponent implements OnInit, OnDestroy {

  selectedVehicle: string = '';
  startDateTime: Date;

  dateRangeStart: string;
  dateRangeEnd: string;

  vehicles: Vehicle[] = [];

  errorMessage$: BehaviorSubject<string> = new BehaviorSubject('');
  private onDestroy$ = new Subject();

  constructor(
    private restService: RestService,
    private dateService: DateService,
    private bsModalRef: BsModalRef
  ) {}

  ngOnInit() {
    this.restService.getAllVehicles(
      {page: 1, sort: "remoteId.asc"},
      "(active)",
      false,
      1000,
      { reportingProfileId: "", connectionId: "", domicileLocationId: "", dispatchGroupId: "", remoteId: "", category: "" }
    ).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe( res => this.vehicles = res.results ); 
   
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onVehicleChanged() {
    this.errorMessage$.next('');
    this.startDateTime = this.dateRangeStart = this.dateRangeEnd = null;
    this.restService.getVehicleVideoRequestPeriod(this.selectedVehicle).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(res => {
      this.dateRangeStart = res.start;
      this.dateRangeEnd = res.end;
    }, exc => {
      this.errorMessage$.next(exc.error.message);
      return exc;
    })
  }

  transformDate(date: string) {
    return this.dateService.transformDateTime(date);
  }

  submit() {
    if (this.isSubmit()) {
      const data = {
        vehicle: {
          id: this.selectedVehicle
        },
        startDateTime: this.dateService.transform4Backend(this.startDateTime),
        duration: 60
      };
      this.restService.requestVideo(data).subscribe(res => {
        this.bsModalRef.hide();
      })
    } else {
      this.errorMessage$.next('Please, fill out all the fields!');
    }
  }

  isSubmit() {
    return this.selectedVehicle && this.startDateTime;
  }

  closeAlertViewModal(): void {
    this.bsModalRef.hide();
  }

}
