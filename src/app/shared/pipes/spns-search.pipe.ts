import { Pipe, PipeTransform } from '@angular/core';
import { SPNDescription } from '@app/core/services/rest.model';

@Pipe({
    name: 'spnsSearch',
})
export class SPNsSearchPipe implements PipeTransform {

    transform(spns: SPNDescription[], query: string = ""): any {
        if (!spns || spns.length === 0 || !query) {
            return spns;
        }
        let noCaseQuery = query.toLowerCase();

        let result: SPNDescription[] = [];
        spns.forEach(function (next: SPNDescription) {
            let spnMatches: boolean = `${next.spn}`.toLowerCase().includes(noCaseQuery);
            let labelMatches: boolean = `${next.label}`.toLowerCase().includes(noCaseQuery);
            if (spnMatches || labelMatches) {
                result.push(next);
            }
        });

        return result;
    }

}
