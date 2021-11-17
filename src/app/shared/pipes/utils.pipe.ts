import { Pipe, PipeTransform, Injectable } from '@angular/core';
import * as moment from 'moment';

import { APP_DATE_FORAT } from '@app/core/smartadmin.config';

/**
 * Capitalizes the first character of the string. Transforms `testField` to `TestField`.
 * Usage:
 *  `value | capitalize`
 *  `{{ value | capitalize }}`
 */
@Pipe({
    name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {

    transform(value: string, args: any[]): string {
        if (!value) {
            return "";
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

}

/**
 * Capitalizes first character of every word in the string and adjusts to lower case the remain part.
 * Transforms `test FIELD` to `Test Field`.
 * Usage:
 *  `value | capitalizeAll`
 *  `{{ value | capitalizeAll }}`
 */
@Pipe({
    name: 'capitalizeAll'
})
export class CapitalizeAllPipe implements PipeTransform {

    transform(value: string): string {
        if (!value) {
            return "";
        }
        if ((typeof value) !== "string") {
            return value;
        }
        value = value.split(" ").map(next => {
            if (!value) {
                return "";
            }
            return next[0].toUpperCase() + next.slice(1).toLowerCase();
        }).join(" ");
        return value;
    }

}

/**
 * Removes `ROLE_` prefix if presented.
 * Transforms `ROLE_SUPER_ADMIN` to `SUPER_ADMIN`.
 * Usage:
 *  `value | rolePrefixRemover`
 *  `{{ value | rolePrefixRemover }}`
 */
@Pipe({
    name: 'rolePrefixRemover'
})
export class RolePrefixRemoverPipe implements PipeTransform {

    transform(value: string): string {
        if (!value) {
            return "";
        }
        if ((typeof value) !== "string") {
            return value;
        }
        if (value.startsWith("ROLE_")) {
            return value.slice("ROLE_".length);
        }
        return value;
    }

}

/**
 * Humanizes the string, adds spaces before every capital case. Transforms `testField` to `Test Field`.
 * Usage:
 *  `value | humanize`
 *  `{{ value | humanize }}`
 */
@Pipe({
    name: 'humanize'
})
export class HumanizePipe {
    transform(value: string) {
        if (!value) {
            return "";
        }
        if ((typeof value) !== "string") {
            return value;
        }
        value = value.split(/(?=[A-Z])/).join(" ");
        value = value[0].toUpperCase() + value.slice(1);
        return value;
    }
}

/**
 * Divides amount (in cents) by 100. Transforms `350` to `3.5`.
 * Usage:
 *  `value | amountHandler`
 *  `{{ value | amountHandler }}`
 */
@Pipe({
    name: 'amountHandler'
})
export class AmountHandlerPipe implements PipeTransform {

    transform(value: number, args: any[]): number {
        if (!value) {
            return 0;
        }
        return value / 100;
    }

}

/**
 * Replaces underscores `_` with spaces ` `. Transforms `Minimum_Wage_Compliance ` to `Minimum Wage Compliance `.
 * Usage:
 *  `value | replaceUnderscore`
 *  `{{ value | replaceUnderscore }}`
 */
@Pipe({ name: 'replaceUnderscore' })
export class ReplaceUnderscorePipe implements PipeTransform {

    transform(value: string): string {
        return value ? value.replace(/_/g, " ") : value;
    }

}

/**
 * Replaces dashes `-` with spaces ` `. Transforms `Some-Value` to `Some Value`.

 * Usage:
 *  `value | replaceDashes`
 *  `{{ value | replaceDashes }}`
 */
@Pipe({ name: 'replaceDashes' })
export class ReplaceDashesPipe implements PipeTransform {

    transform(value: string): string {
        return value ? value.replace(/-/g, " ") : value;
    }

}

/**
 * Minifies product type name. Transforms `Minimum_Wage_Compliance ` to `MWC `.
 * Usage:
 *  `value | productTypeMin`
 *  `{{ value | productTypeMin }}`
 */
@Pipe({ name: 'productTypeMin' })
export class ProductTypeMinPipe implements PipeTransform {

    transform(value: string): string {
        if (!value) {
            return "";
        }
        let [first, ...rest] = value.split("_").map(function (next: string) {
            return next.charAt(0);
        })
        return rest.length === 0 ? first : `${first}${rest.join("")}`;
    }

}

/**
 * Joins non-empty string values to one comma-separated value. Transforms `["1", null, "2"] ` to `1, 2`.
 * Usage:
 *  `array | join`
 *  `{{ array | join:', ' }}`
 */
@Pipe({
    name: 'join'
})
export class JoinPipe implements PipeTransform {

    transform(input: Array<any>, separator = ', '): string {
        return input.filter(e => !!e).join(separator);
    }

}

/**
 * Displays time difference in minutes between two dates. Transforms `["2021-01-10T17:10:10", "2021-01-10T17:40:20"] ` to `30`.
 * Usage:
 *  `[date1, date2] | diffMins`
 *  `{{[date1, date2] | diffMins }}`
 */
@Pipe({
    name: 'diffMins'
})
export class DiffMinsPipe implements PipeTransform {

    transform(dates: Array<any>): string {
        if (!dates || dates.length < 2 || !dates[0] || !dates[1]) {
            return "N/A";
        }
        var ms = moment(dates[0], "YYYY-MM-DD'T'HH:mm:ss").diff(moment(dates[1], "YYYY-MM-DD'T'HH:mm:ss"));
        var d = moment.duration(ms);
        return Math.round(Math.abs(d.asMinutes())) + " mins";
    }

}

/**
 * Transforms time in seconds to durationin 'h:mm" format. Transforms `3660 ` to `1:01`.
 * Usage:
 *  `seconds | seconds2HMM`
 *  `{{seconds | seconds2HMM }}`
 */
@Pipe({
    name: 'seconds2HMM'
})
export class Seconds2HMMPipe implements PipeTransform {

    transform(seconds: number): string {
        if (!seconds) {
            return "N/A";
        }
        var d = moment.duration(seconds * 1000);
        let hours = Math.floor(d.asHours());
        let minutes = Math.floor(d.asMinutes()) - 60 * hours;
        let theMinutes = minutes <= 9 ? `0${minutes}` : `${minutes}`;
        return hours + ":" + theMinutes;
    }

}

/**
 * Adds specified amount of days to the date. Transforms `2020-01-05` to `2020-01-15` (in case of `addDays:10`).
 * Usage:
 *  `date | addDays:10`
 *  `{{ date | addDays:10 }}`
 */
@Pipe({
    name: 'addDays'
})
export class AddDaysPipe implements PipeTransform {

    transform(value: any, days: number = 0) {
        if (!value) {
            return "";
        }
        var datetime = (value instanceof Date) ? moment(value).clone().toDate() : moment(value, APP_DATE_FORAT).clone().toDate();
        datetime.setDate(datetime.getDate() + days);
        return datetime;
    }

}

@Injectable()
export class HTMLGeneratorService {

    constructor(
        private productTypeMin: ProductTypeMinPipe,
        private replaceUnderscore: ReplaceUnderscorePipe) { }

    defaultBadge(): string {
        return `<span title="Default Reporting Profile" class="badge bg-color-blue">
                    Default
                </span>`;
    }

    productBadge(type: string): string {
        let minify = this.productTypeMin.transform(type);
        let full = this.replaceUnderscore.transform(type);
        return `<span title="${full}" class="badge bg-color-gray">
                    ${minify}
                </span>`;
    }

}
