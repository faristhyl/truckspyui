import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import * as moment from 'moment';

import { APP_DATE_FORAT } from '@app/core/smartadmin.config';
import { ConfigState, getConfigLocalTime } from '@app/core/store/config';
import { Pipe, PipeTransform } from '@angular/core';
import { LocalStorageService } from '@app/core/services/rest.service';

enum TimeZoneAbbreviation {
    CDT = "CDT",
    CST = "CST"
}

@Pipe({
    name: 'timezoneHandler',
})
export class TimezoneHandlerPipe implements PipeTransform {

    localTime: any;

    transform(value: any, straight: boolean = true): any {
        if (!value) {
            return "";
        }
        // let utcValue = (typeof value === "string" && !value.endsWith('Z')) ? value + 'Z' : value;
        var somedatetime = (value instanceof Date) ? moment(value).clone().toDate() : moment(value, APP_DATE_FORAT).clone().toDate();

        let dstOffset: number = this.getAdditionalOffset(somedatetime);
        const offset = this.getOffset();
        somedatetime.setHours(somedatetime.getHours() + (straight ? (offset + dstOffset) : -(offset + dstOffset)));
        return somedatetime;
    }

    private getAdditionalOffset(date: Date): number {
        let strValue = date.toLocaleString("en-US", { timeZone: this.getTimezone(), timeZoneName: "short" });
        let isCDT = strValue.indexOf(TimeZoneAbbreviation.CDT) != -1;
        let isCST = strValue.indexOf(TimeZoneAbbreviation.CST) != -1;

        const timezoneAbbreviation = this.getTimezoneAbbreviation();
        if (isCDT && timezoneAbbreviation === TimeZoneAbbreviation.CST) { // `date` is in CDT, current time is CST
            return 1;
        }
        if (isCST && timezoneAbbreviation === TimeZoneAbbreviation.CDT) { // `date` is in CST, current time is CDT
            return -1;
        }
        return 0;
    }

    private getOffset() {
        const loginAsLocaltime = this.lsService.getLoginAsLocaltime();
        return (loginAsLocaltime && loginAsLocaltime.UTCOffset) || this.localTime.UTCOffset;
    }
    private getTimezone() {
        const loginAsLocaltime = this.lsService.getLoginAsLocaltime();
        return (loginAsLocaltime && loginAsLocaltime.timezone) || this.localTime.timezone;
    }
    private getTimezoneAbbreviation() {
        const loginAsLocaltime = this.lsService.getLoginAsLocaltime();
        return (loginAsLocaltime && loginAsLocaltime.timezoneAbbreviation) || this.localTime.timezoneAbbreviation;
    }

    constructor(
        private store: Store<ConfigState>,
        private lsService: LocalStorageService) {
        this.store.select(getConfigLocalTime).subscribe((localTime: any) => {
            this.localTime = localTime;
        });
    }

}

@Injectable()
export class DateService {

    constructor(
        private timezoneHandler: TimezoneHandlerPipe,
        private datepipe: DatePipe) { }

    getCurrentTime(): Date {
        let dateStr = this.datepipe.transform(Date.now(), 'yyyy-MM-dd, HH:mm:ss', '+0000');
        return this.timezoneHandler.transform(dateStr);
    }

    getCurrentTimePlusMinute(): Date {
        let dateStr = this.datepipe.transform(Date.now() + 60000, 'yyyy-MM-dd, HH:mm:ss', '+0000');
        return this.timezoneHandler.transform(dateStr);
    }

    transformDateTime(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd, HH:mm:ss');
    }

    transformDwellDateTime(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd, HH:mm');
    }

    transformDwellDuration(seconds: number): string {
        // YYYY-MM-DDTHH:MM:SS.000Z
        return !!seconds ? new Date(seconds * 1000).toISOString().substr(11, 5) : "00:00";
    }

    transformDate(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyy-MM-dd');
    }

    transformDateMMDD(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'MM/dd');
    }

    transformDateYYYYMMDD(date: string): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'yyyyMMdd');
    }

    transform4Backend(date: Date): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date, false), 'yyyy-MM-ddTHH:mm:ss');
    }

    transform2OdometerDate(date: Date): string {
        return !date ? null : this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    transform2Time(date: Date): string {
        return !date ? null : this.datepipe.transform(this.timezoneHandler.transform(date), 'HH:mm:ss');
    }

    plusHours(date: Date, hours: number): Date {
        return new Date(date.getTime() + hours * 3600000);
    }

}
