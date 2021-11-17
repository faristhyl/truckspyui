import { Pipe, PipeTransform } from '@angular/core';
import { Stop, StopType } from '@app/core/services/rest.model';

@Pipe({
    name: 'excludePositionStops',
})
export class ExcludePositionStopsPipe implements PipeTransform {

    transform(theArray: Stop[]): any {
        if (!theArray || theArray.length === 0) {
            return theArray;
        }
        return theArray.filter(
            (stop: Stop) => {
                return stop.type !== StopType.POSITION;
            });
    }

}
