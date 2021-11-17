import { Action } from "@ngrx/store";

export enum UtilActionTypes {
  MaintenanceGroupDeleted = "[Maintenance] GroupDeleted",
  MaintenanceGroupAddedUpdated = "[Maintenance] GroupAddedUpdated"
}

export class MaintenanceGroupDeleted implements Action {
  readonly type = UtilActionTypes.MaintenanceGroupDeleted;
}

export class MaintenanceGroupAddedUpdated implements Action {
  readonly type = UtilActionTypes.MaintenanceGroupAddedUpdated;
}

export type UtilActions =
  | MaintenanceGroupDeleted
  | MaintenanceGroupAddedUpdated;
