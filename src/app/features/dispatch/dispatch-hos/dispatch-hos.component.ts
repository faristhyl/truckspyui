import { Component, Input, OnInit } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import * as moment from 'moment';

import { RestService, Driver, HOSUtilService } from '@app/core/services/rest.service';
import { LoggedInAs, AuthState, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { LocalStorageService, Company } from '@app/core/services';

@Component({
    selector: 'app-dispatch-hos',
    templateUrl: './dispatch-hos.component.html'
})
export class DispatchHOSComponent implements OnInit {

    company: Company;
    loginAsCompany: Company;
    theCompany() {
        return !!this.loginAsCompany ? this.loginAsCompany : this.company;
    }

    onLoggedInAs = this.actions$.subscribe(action => {
        if (action instanceof LoggedInAs) {
            this.loginAsCompany = this.lsService.getCompany();
        }
    });
    onLoggedOutAs = this.actions$.subscribe(action => {
        if (action instanceof LoggedOutAs) {
            this.loginAsCompany = null;
        }
    });

    @Input() driver: Driver;
    theDriver: Driver;

    data: any;
    loaded: boolean = false;
    hosEnabled: boolean = false;

    constructor(
        private restService: RestService,
        private hosUtilService: HOSUtilService,
        private actions$: Actions,
        private store: Store<AuthState>,
        private lsService: LocalStorageService) { }

    ngOnInit() {
        this.store.select(getConfigCompany).subscribe((company: Company) => {
            this.company = company;
        });
        this.loginAsCompany = this.lsService.getCompany();

        this.hosEnabled = this.theCompany().enabledFeatures.hoursOfService;
        if (this.hosEnabled && !!this.driver && !!this.driver.id) {
            this.restService.getAllDriversForHOS()
                .subscribe(hosDrivers => {
                    this.theDriver = hosDrivers.find(next => {
                        return this.driver.remoteId === next.alias
                    });

                    if (!!this.theDriver) {
                        combineLatest(
                            this.restService.getDriverStatuses(`${this.theDriver.id}`),
                            this.restService.getDriverMetaNames(`${this.theDriver.id}`)
                        ).subscribe(data => {
                            let status = data[0];
                            let metaName = data[1];
                            this.data = {
                                currentRuleset: metaName ? metaName.getCurrentRuleset() : "",
                                untilBreak: this.convertMillisecondToTime(status.availableBreak),
                                driveLeft: this.findDriveLeft(status.availableDrive, status.availableShift),
                                shiftLeft: this.convertMillisecondToTime(status.availableShift),
                                cycleLeft: this.convertMillisecondToTime(status.availableCycle),
                            }
                            this.loaded = true;
                        })
                    } else {
                        this.loaded = true;
                    }
                });
        } else {
            this.loaded = true;
        }
    }

    // TODO: move to HOSUtilService
    findDriveLeft(drive, shift) {
        // Handles a case when a certain drive left is greater than shift left.
        if (drive) {
            const driveLeft = moment.duration(drive).asMilliseconds(),
                shiftLeft = moment.duration(shift).asMilliseconds();

            return (driveLeft > shiftLeft) ? this.convertMillisecondToTime(shift) : this.convertMillisecondToTime(drive);
        }

        return "00:00";
    }

    convertMillisecondToTime(time, hideSeconds = true) {
        return time ? this.hosUtilService.millisToTime(moment.duration(time).asMilliseconds(), hideSeconds) : 'N/A';
    }
}
