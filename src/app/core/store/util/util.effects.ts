import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { map, tap } from "rxjs/operators";
import { LayoutService } from "@app/core/services/layout.service";
import { UtilActionTypes } from "./util.actions";

@Injectable()
export class UtilEffects {

  @Effect({ dispatch: false })
  onMaintenanceGroupDeleted$ = this.actions$.pipe(
    ofType(UtilActionTypes.MaintenanceGroupDeleted),
    tap(action => { })
  );

  @Effect({ dispatch: false })
  MaintenanceGroupAddedUpdated$ = this.actions$.pipe(
    ofType(UtilActionTypes.MaintenanceGroupAddedUpdated),
    tap(action => { })
  );

  constructor(
    private actions$: Actions,
    private layoutService: LayoutService) { }

}
