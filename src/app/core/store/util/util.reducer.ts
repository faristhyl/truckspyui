import { Action } from '@ngrx/store';
import { UtilActions, UtilActionTypes } from './util.actions';

export interface UtilState {
}

export const initialUtilState: UtilState = {
};

export function utilReducer(state = initialUtilState, action: UtilActions): UtilState {
  switch (action.type) {

    default:
      return state;
  }
}
