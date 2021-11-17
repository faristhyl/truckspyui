import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldFilterPipe } from './field-filter.pipe';
import { MomentPipe } from './moment.pipe';
import { RoleFilterPipe } from './role-filter.pipe';
import { NaHandlerPipe } from './na-handler.pipe';
import { TimezoneHandlerPipe, DateService } from './timezone-handler.pipe';
import {
  CapitalizePipe, AmountHandlerPipe, ReplaceUnderscorePipe, ProductTypeMinPipe, HTMLGeneratorService,
  HumanizePipe, CapitalizeAllPipe, ReplaceDashesPipe, AddDaysPipe, RolePrefixRemoverPipe, JoinPipe,
  DiffMinsPipe, Seconds2HMMPipe
} from './utils.pipe';
import { MessageDatePipe } from './message-date.pipe';
import { BookingSearchPipe } from './booking-search.pipe';
import { ArrayPaginationPipe } from './array-pagination.pipe';
import { TripsHandlerItemSearchPipe } from './trips-handler-item-search.pipe';
import { SPNsSearchPipe } from './spns-search.pipe';
import { QuestionSearchPipe } from './question-search.pipe';
import { VehiclesMapItems } from './vehicles-map-items.pipe';
import { ExcludePositionStopsPipe } from './exclude-position-stops.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    FieldFilterPipe, MomentPipe, RoleFilterPipe, NaHandlerPipe, TimezoneHandlerPipe, CapitalizePipe,
    AmountHandlerPipe, ReplaceUnderscorePipe, ProductTypeMinPipe, MessageDatePipe, BookingSearchPipe,
    ArrayPaginationPipe, TripsHandlerItemSearchPipe, HumanizePipe, QuestionSearchPipe, VehiclesMapItems,
    CapitalizeAllPipe, ReplaceDashesPipe, SPNsSearchPipe, AddDaysPipe, ExcludePositionStopsPipe,
    RolePrefixRemoverPipe, JoinPipe, DiffMinsPipe, Seconds2HMMPipe
  ],
  exports: [
    FieldFilterPipe, MomentPipe, RoleFilterPipe, NaHandlerPipe, TimezoneHandlerPipe, CapitalizePipe,
    AmountHandlerPipe, ReplaceUnderscorePipe, ProductTypeMinPipe, MessageDatePipe, BookingSearchPipe,
    ArrayPaginationPipe, TripsHandlerItemSearchPipe, HumanizePipe, QuestionSearchPipe, VehiclesMapItems,
    CapitalizeAllPipe, ReplaceDashesPipe, SPNsSearchPipe, AddDaysPipe, ExcludePositionStopsPipe,
    RolePrefixRemoverPipe, JoinPipe, DiffMinsPipe, Seconds2HMMPipe
  ],
  providers: [
    RoleFilterPipe, NaHandlerPipe, TimezoneHandlerPipe, DateService, CapitalizePipe, AmountHandlerPipe,
    ReplaceUnderscorePipe, ProductTypeMinPipe, HTMLGeneratorService, MessageDatePipe, BookingSearchPipe,
    ArrayPaginationPipe, TripsHandlerItemSearchPipe, HumanizePipe, QuestionSearchPipe, VehiclesMapItems,
    CapitalizeAllPipe, ReplaceDashesPipe, SPNsSearchPipe, AddDaysPipe, ExcludePositionStopsPipe,
    RolePrefixRemoverPipe, JoinPipe, DiffMinsPipe, Seconds2HMMPipe
  ]
})
export class PipesModule { }
